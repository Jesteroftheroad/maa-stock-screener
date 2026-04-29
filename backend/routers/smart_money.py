"""Smart Money Screener — API endpoints."""

import logging
from dataclasses import asdict
from fastapi import APIRouter, Query
from typing import Optional

from engines.smart_money_engine import SmartMoneyEngine, SmartMoneyResult
from data.universe import get_all_tickers

log = logging.getLogger(__name__)
router = APIRouter()
engine = SmartMoneyEngine()

# ── Curated liquid universe for fast scans ────────────────────────────────────
# Top US stocks guaranteed to have options data
LIQUID_UNIVERSE = [
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AMD", "NFLX", "PLTR",
    "SOFI", "RIVN", "COIN", "MARA", "HOOD", "RBLX", "SNAP", "UBER", "LYFT", "RKLB",
    "BA", "GS", "JPM", "BAC", "WFC", "XOM", "CVX", "LMT", "RTX", "NOC",
    "SBUX", "MCD", "NKE", "DIS", "ABNB", "BKNG", "SQ", "PYPL", "V", "MA",
    "CRM", "ORCL", "ADBE", "INTC", "QCOM", "MU", "AVGO", "ARM", "SMCI", "F",
]

# Preset filter sets
SMART_MONEY_PRESETS: dict[str, dict] = {
    "quiet_accumulation": {
        "label": "Quiet Institutional Accumulation",
        "icon": "building",
        "description": "Elevated volume + high institutional ownership — stealth buying pattern",
        "filters": {"vol_surge_min": 1.5, "inst_ownership_min": 0.5, "score_min": 55},
    },
    "bullish_flow": {
        "label": "Bullish Options Flow Today",
        "icon": "trending-up",
        "description": "High call/put ratio indicating bullish options sentiment",
        "filters": {"cp_ratio_min": 2.0, "score_min": 60},
    },
    "insider_buying": {
        "label": "Insider Buying This Month",
        "icon": "user-check",
        "description": "Recent insider purchase transactions filed with the SEC",
        "filters": {"insider_buys_min": 1, "score_min": 50},
    },
    "hedge_fund_favorites": {
        "label": "Hedge Fund Favorites",
        "icon": "briefcase",
        "description": "High institutional ownership from major funds",
        "filters": {"inst_ownership_min": 0.7, "score_min": 60},
    },
    "momentum_smart": {
        "label": "Momentum + Smart Money",
        "icon": "zap",
        "description": "Above 50-day MA with strong smart money score",
        "filters": {"above_sma50": True, "score_min": 65},
    },
    "oversold_flow": {
        "label": "Oversold with Bullish Flow",
        "icon": "arrow-down-circle",
        "description": "Oversold stocks (RSI < 40) showing bullish call activity",
        "filters": {"rsi_max": 40, "cp_ratio_min": 1.5},
    },
    "short_squeeze": {
        "label": "Short Squeeze + Calls",
        "icon": "flame",
        "description": "High short interest with bullish call flow — squeeze setup",
        "filters": {"short_interest_min": 0.10, "cp_ratio_min": 1.5},
    },
    "breakout_flow": {
        "label": "Breakout Supported by Flow",
        "icon": "bar-chart-2",
        "description": "Volume breakout with options confirmation",
        "filters": {"vol_surge_min": 2.0, "cp_ratio_min": 1.5, "above_sma50": True},
    },
}


def _result_dict(r: SmartMoneyResult) -> dict:
    d = asdict(r)
    d.pop("error", None)
    return d


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/presets")
def list_presets():
    return {
        "presets": [
            {"name": k, **{kk: vv for kk, vv in v.items() if kk != "filters"}}
            for k, v in SMART_MONEY_PRESETS.items()
        ]
    }


@router.get("/presets/{name}")
def run_preset(name: str):
    if name not in SMART_MONEY_PRESETS:
        return {"error": f"Unknown preset '{name}'", "results": [], "total": 0, "scanned": 0}

    preset = SMART_MONEY_PRESETS[name]
    filters = preset["filters"]

    results = engine.screen(filters, LIQUID_UNIVERSE)
    return {
        "preset": name,
        "preset_label": preset["label"],
        "results": [_result_dict(r) for r in results],
        "total": len(results),
        "scanned": len(LIQUID_UNIVERSE),
        "cached": True,
    }


@router.get("/overview")
def overview():
    """Quick stats from a 20-stock sample — designed to be fast."""
    sample = LIQUID_UNIVERSE[:20]
    results = engine.screen({}, sample)

    bullish_flow = sum(1 for r in results if (r.call_put_ratio or 0) > 1.5)
    insider_buys = sum(1 for r in results if r.insider_buys_90d > 0)
    unusual_vol = sum(1 for r in results if r.volume_vs_avg > 2.0)
    high_conviction = sum(1 for r in results if r.smart_money_score >= 85)
    distribution = sum(1 for r in results if r.action_tag == "Distribution Risk")

    return {
        "bullish_flow_count": bullish_flow,
        "insider_buy_count": insider_buys,
        "unusual_volume_count": unusual_vol,
        "high_conviction_count": high_conviction,
        "distribution_count": distribution,
        "total_scanned": len(results),
    }


@router.get("/screen")
def screen(
    score_min: Optional[int] = Query(None),
    cp_ratio_min: Optional[float] = Query(None),
    vol_surge_min: Optional[float] = Query(None),
    insider_buys_min: Optional[int] = Query(None),
    inst_ownership_min: Optional[float] = Query(None),
    above_sma50: Optional[bool] = Query(None),
    rsi_max: Optional[float] = Query(None),
    short_interest_min: Optional[float] = Query(None),
    sector: Optional[str] = Query(None),
    signal_type: Optional[str] = Query(None),
    universe: str = Query("liquid"),
):
    filters: dict = {}
    if score_min is not None:
        filters["score_min"] = score_min
    if cp_ratio_min is not None:
        filters["cp_ratio_min"] = cp_ratio_min
    if vol_surge_min is not None:
        filters["vol_surge_min"] = vol_surge_min
    if insider_buys_min is not None:
        filters["insider_buys_min"] = insider_buys_min
    if inst_ownership_min is not None:
        filters["inst_ownership_min"] = inst_ownership_min
    if above_sma50 is not None:
        filters["above_sma50"] = above_sma50
    if rsi_max is not None:
        filters["rsi_max"] = rsi_max
    if short_interest_min is not None:
        filters["short_interest_min"] = short_interest_min
    if sector:
        filters["sector"] = sector
    if signal_type:
        filters["signal_type"] = signal_type

    tickers = LIQUID_UNIVERSE if universe == "liquid" else get_all_tickers()
    results = engine.screen(filters, tickers)

    return {
        "results": [_result_dict(r) for r in results],
        "total": len(results),
        "scanned": len(tickers),
        "cached": True,
    }


@router.get("/stock/{ticker}")
def stock_analysis(ticker: str):
    r = engine.analyze(ticker.upper())
    if r.error:
        return {"error": r.error, "ticker": ticker.upper()}
    return _result_dict(r)
