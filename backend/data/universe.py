"""
Stock & ETF universe loader — merges US + CA + ETF JSON files.
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
    stocks: list[dict] = []

    sources = [
        (config.UNIVERSE_US_PATH,  "US",  "Stock"),
        (config.UNIVERSE_CA_PATH,  "CA",  "Stock"),
        (config.UNIVERSE_ETF_PATH, "US",  "ETF"),
    ]

    for path, default_country, default_type in sources:
        p = Path(path)
        if not p.exists():
            log.warning("Universe file not found: %s", path)
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            file_country = data.get("country", default_country)
            file_type    = data.get("type",    default_type)
            for s in data.get("stocks", []):
                s.setdefault("country", file_country)
                s.setdefault("type",    file_type)
                stocks.append(s)
        except Exception as e:
            log.error("Failed to load universe from %s: %s", path, e)

    # Deduplicate by ticker (ETFs take precedence over stocks with same ticker)
    seen: set[str] = set()
    unique: list[dict] = []
    for s in stocks:
        t = s["ticker"]
        if t not in seen:
            seen.add(t)
            unique.append(s)

    log.info("Universe loaded: %d instruments (%d ETFs)",
             len(unique),
             sum(1 for s in unique if s.get("type") == "ETF"))
    return unique


def get_all_stocks() -> list[dict]:
    return _load_all()


def get_all_tickers() -> list[str]:
    """All tickers (stocks only — ETFs excluded from screener scans)."""
    return [s["ticker"] for s in _load_all() if s.get("type", "Stock") == "Stock"]


def get_all_tickers_including_etfs() -> list[str]:
    return [s["ticker"] for s in _load_all()]


def get_tickers_by_sector(sector: str) -> list[str]:
    return [
        s["ticker"] for s in _load_all()
        if s.get("sector", "").lower() == sector.lower()
    ]


def get_tickers_by_country(country: str) -> list[str]:
    return [
        s["ticker"] for s in _load_all()
        if s.get("country", "").upper() == country.upper()
    ]


def get_stock_meta(ticker: str) -> dict | None:
    for s in _load_all():
        if s["ticker"].upper() == ticker.upper():
            return s
    return None


def search_universe(query: str, limit: int = 12) -> list[dict]:
    """
    Search stocks AND ETFs by ticker prefix or name substring.
    Returns results ranked: exact ticker match → ticker prefix → name match.
    """
    q = query.strip().lower()
    if not q or len(q) < 1:
        return []

    exact:  list[dict] = []
    prefix: list[dict] = []
    name:   list[dict] = []

    for s in _load_all():
        ticker_lc = s["ticker"].lower()
        name_lc   = s.get("name", "").lower()

        if ticker_lc == q:
            exact.append(s)
        elif ticker_lc.startswith(q):
            prefix.append(s)
        elif q in name_lc:
            name.append(s)

    combined = exact + prefix + name
    # Deduplicate (safety — shouldn't be needed)
    seen: set[str] = set()
    result: list[dict] = []
    for s in combined:
        if s["ticker"] not in seen:
            seen.add(s["ticker"])
            result.append(s)
        if len(result) >= limit:
            break
    return result


# Keep backwards-compatible alias
def search_tickers(query: str) -> list[dict]:
    return search_universe(query)


SECTORS   = sorted(set(s["sector"]   for s in _load_all() if s.get("sector")))
EXCHANGES = sorted(set(s["exchange"] for s in _load_all() if s.get("exchange")))
COUNTRIES = sorted(set(s["country"]  for s in _load_all() if s.get("country")))
