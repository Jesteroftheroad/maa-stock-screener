"""Deep Dive endpoints — hedge-fund style intelligence for any ticker."""

import json
import logging
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from data.fetcher import DataFetcher
from engines.deep_dive_engine import DeepDiveEngine

log = logging.getLogger(__name__)
router = APIRouter()

_fetcher = DataFetcher()
_engine = DeepDiveEngine(_fetcher)

CACHE_DIR = Path("cache/deep_dive")
CACHE_DIR.mkdir(parents=True, exist_ok=True)
CACHE_TTL = 900  # 15 min


def _cache_path(ticker: str) -> Path:
    return CACHE_DIR / f"{ticker.upper()}.json"


def _load(ticker: str):
    p = _cache_path(ticker)
    if p.exists():
        try:
            d = json.loads(p.read_text())
            if time.time() - d.get("_ts", 0) < CACHE_TTL:
                return d.get("result")
        except Exception:
            pass
    return None


def _save(ticker: str, result: dict):
    try:
        _cache_path(ticker).write_text(json.dumps({"_ts": time.time(), "result": result}))
    except Exception:
        pass


# /api/deep-dive/compare must be declared before /{ticker} to avoid shadowing
@router.get("/compare")
def compare(tickers: str = Query(..., description="Comma-separated list of 2–3 tickers")):
    symbols = [t.strip().upper() for t in tickers.split(",")][:3]
    results = []
    for sym in symbols:
        cached = _load(sym)
        if cached:
            results.append(cached)
            continue
        try:
            r = _engine.analyze(sym)
            _save(sym, r)
            results.append(r)
        except Exception as e:
            results.append({"ticker": sym, "error": str(e)})
    return {"results": results}


@router.get("/{ticker}")
def deep_dive(ticker: str):
    ticker = ticker.upper()
    cached = _load(ticker)
    if cached:
        return cached
    try:
        result = _engine.analyze(ticker)
    except Exception as e:
        log.error(f"Deep dive failed for {ticker}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
    _save(ticker, result)
    return result
