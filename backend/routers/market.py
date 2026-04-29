"""Market overview endpoints: indices, movers, Fear & Greed."""

import logging
from fastapi import APIRouter
from data.fetcher import DataFetcher
from engines.macro import MacroEngine, compute_fear_greed
import config

log = logging.getLogger(__name__)
router = APIRouter()

_fetcher = DataFetcher()
_macro = MacroEngine(_fetcher)


@router.get("/overview")
def get_market_overview():
    """Returns prices and daily change for S&P 500, Nasdaq, Dow, BTC, Gold, Oil."""
    return _fetcher.get_market_overview()


@router.get("/movers")
def get_market_movers():
    """Returns top 5 gainers and losers from the curated movers list."""
    batch = _fetcher.get_batch_prices(config.MOVERS_LIST)

    valid = [v for v in batch.values() if v.get("price") and v.get("change_pct") is not None]
    sorted_all = sorted(valid, key=lambda x: x["change_pct"])

    losers = sorted_all[:5]
    gainers = sorted_all[-5:][::-1]

    return {"gainers": gainers, "losers": losers}


@router.get("/fear-greed")
def get_fear_greed():
    """Returns Fear & Greed score (0-100) and label based on VIX + market breadth + trend."""
    try:
        result = _macro.analyze()
        return {
            "score": result.fear_greed_score,
            "label": result.fear_greed_label,
            "vix": result.vix,
            "trend": result.trend,
            "breadth": result.breadth,
            "risk_level": result.risk_level,
            "summary": result.summary,
        }
    except Exception as e:
        log.error(f"Fear & Greed failed: {e}")
        return {"score": 50, "label": "Neutral", "vix": None, "trend": "SIDEWAYS", "breadth": "MIXED", "risk_level": "MODERATE", "summary": ""}
