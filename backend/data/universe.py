"""
Stock universe loader — merges US + CA JSON files.
Provides fast pre-filtering without hitting yfinance.
"""

import json
import logging
from pathlib import Path
from functools import lru_cache

import config

log = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _load_all() -> list[dict]:
    stocks = []
    for path in [config.UNIVERSE_US_PATH, config.UNIVERSE_CA_PATH]:
        p = Path(path)
        if not p.exists():
            log.warning(f"Universe file not found: {path}")
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            country = data.get("country", "US")
            for s in data.get("stocks", []):
                s.setdefault("country", country)
                stocks.append(s)
        except Exception as e:
            log.error(f"Failed to load universe from {path}: {e}")
    # Deduplicate by ticker
    seen = set()
    unique = []
    for s in stocks:
        if s["ticker"] not in seen:
            seen.add(s["ticker"])
            unique.append(s)
    log.info(f"Universe loaded: {len(unique)} stocks")
    return unique


def get_all_stocks() -> list[dict]:
    return _load_all()


def get_all_tickers() -> list[str]:
    return [s["ticker"] for s in _load_all()]


def get_tickers_by_sector(sector: str) -> list[str]:
    return [s["ticker"] for s in _load_all() if s.get("sector", "").lower() == sector.lower()]


def get_tickers_by_country(country: str) -> list[str]:
    return [s["ticker"] for s in _load_all() if s.get("country", "").upper() == country.upper()]


def get_stock_meta(ticker: str) -> dict | None:
    for s in _load_all():
        if s["ticker"].upper() == ticker.upper():
            return s
    return None


def search_tickers(query: str) -> list[dict]:
    q = query.lower()
    results = []
    for s in _load_all():
        if q in s["ticker"].lower() or q in s["name"].lower():
            results.append(s)
        if len(results) >= 10:
            break
    return results


SECTORS = sorted(set(s["sector"] for s in _load_all() if s.get("sector")))
EXCHANGES = sorted(set(s["exchange"] for s in _load_all() if s.get("exchange")))
COUNTRIES = sorted(set(s["country"] for s in _load_all() if s.get("country")))
