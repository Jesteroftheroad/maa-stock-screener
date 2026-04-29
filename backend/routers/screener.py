"""Screener and preset endpoints."""

import logging
from fastapi import APIRouter, Query
from data.fetcher import DataFetcher
from engines.screener_engine import ScreenerEngine

log = logging.getLogger(__name__)
router = APIRouter()

_fetcher = DataFetcher()
_screener = ScreenerEngine(_fetcher)

PRESETS = {
    "buffett": {
        "pe_max": 20,
        "roe_min": 0.15,
        "debt_max": 1.0,
        "rev_growth_min": 0.05,
        "ai_score_min": 55,
    },
    "undervalued_tech": {
        "sector": "Technology",
        "pe_max": 30,
        "rev_growth_min": 0.10,
        "ai_score_min": 50,
    },
    "dividend_kings": {
        "div_yield_min": 0.025,
        "payout_ratio_max": 0.80,
        "ai_score_min": 45,
    },
    "breakout_today": {
        "above_sma200": True,
        "volume_surge": 1.5,
        "rsi_min": 50,
    },
    "short_squeeze": {
        "above_sma50": True,
        "rsi_min": 50,
        "volume_surge": 2.0,
    },
    "high_growth_ca": {
        "country": "CA",
        "rev_growth_min": 0.08,
    },
    "peter_lynch_growth": {
        "peg_max": 1.0,
        "rev_growth_min": 0.10,
        "ai_score_min": 50,
    },
    "covered_call": {
        "price_max": 50,
        "div_yield_min": 0.01,
        "above_sma200": True,
    },
}


@router.get("/screener")
def run_screener(
    sector: str | None = Query(None),
    country: str | None = Query(None),
    exchange: str | None = Query(None),
    pe_min: float | None = Query(None),
    pe_max: float | None = Query(None),
    forward_pe_max: float | None = Query(None),
    peg_max: float | None = Query(None),
    price_min: float | None = Query(None),
    price_max: float | None = Query(None),
    market_cap_min: float | None = Query(None),
    market_cap_max: float | None = Query(None),
    rsi_min: float | None = Query(None),
    rsi_max: float | None = Query(None),
    above_sma20: bool | None = Query(None),
    above_sma50: bool | None = Query(None),
    above_sma200: bool | None = Query(None),
    volume_surge: float | None = Query(None),
    div_yield_min: float | None = Query(None),
    payout_ratio_max: float | None = Query(None),
    rev_growth_min: float | None = Query(None),
    roe_min: float | None = Query(None),
    debt_max: float | None = Query(None),
    ai_score_min: int | None = Query(None),
    max_results: int = Query(50, le=100),
):
    filters = {k: v for k, v in {
        "sector": sector,
        "country": country,
        "exchange": exchange,
        "pe_min": pe_min,
        "pe_max": pe_max,
        "forward_pe_max": forward_pe_max,
        "peg_max": peg_max,
        "price_min": price_min,
        "price_max": price_max,
        "market_cap_min": market_cap_min,
        "market_cap_max": market_cap_max,
        "rsi_min": rsi_min,
        "rsi_max": rsi_max,
        "above_sma20": above_sma20,
        "above_sma50": above_sma50,
        "above_sma200": above_sma200,
        "volume_surge": volume_surge,
        "div_yield_min": div_yield_min,
        "payout_ratio_max": payout_ratio_max,
        "rev_growth_min": rev_growth_min,
        "roe_min": roe_min,
        "debt_max": debt_max,
        "ai_score_min": ai_score_min,
    }.items() if v is not None}

    try:
        return _screener.run(filters, max_results=max_results)
    except Exception as e:
        log.error(f"Screener failed: {e}")
        return {"results": [], "total": 0, "scanned": 0, "cached": False, "error": str(e)}


@router.get("/presets/{name}")
def run_preset(name: str, max_results: int = Query(50, le=100)):
    preset = PRESETS.get(name.lower())
    if not preset:
        return {"error": f"Unknown preset '{name}'. Available: {list(PRESETS.keys())}"}
    try:
        return _screener.run(preset, max_results=max_results)
    except Exception as e:
        log.error(f"Preset {name} failed: {e}")
        return {"results": [], "total": 0, "scanned": 0, "cached": False, "error": str(e)}


@router.get("/presets")
def list_presets():
    return {"presets": list(PRESETS.keys())}
