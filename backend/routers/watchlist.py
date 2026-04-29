"""Watchlist CRUD endpoints."""

import logging
from fastapi import APIRouter
from pydantic import BaseModel
from db import watchlist as wl_db
from data.fetcher import DataFetcher
from data.universe import get_stock_meta

log = logging.getLogger(__name__)
router = APIRouter()
_fetcher = DataFetcher()


class WatchlistAddRequest(BaseModel):
    ticker: str
    name: str = ""
    country: str = "US"


@router.get("")
def get_watchlist():
    items = wl_db.get_watchlist()
    enriched = []
    for item in items:
        ticker = item["ticker"]
        info = _fetcher.get_ticker_info(ticker)
        price = None
        change_pct = None
        if info:
            price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
            prev = info.get("regularMarketPreviousClose") or info.get("previousClose") or price
            change_pct = round((price - prev) / prev * 100, 2) if prev and prev > 0 and price else None
            price = round(float(price), 2) if price else None
        enriched.append({**item, "price": price, "change_pct": change_pct})
    return {"watchlist": enriched}


@router.post("")
def add_to_watchlist(body: WatchlistAddRequest):
    ticker = body.ticker.upper()
    meta = get_stock_meta(ticker)
    name = body.name or (meta.get("name", "") if meta else "")
    country = body.country or (meta.get("country", "US") if meta else "US")
    success = wl_db.add_ticker(ticker, name=name, country=country)
    return {"success": success, "ticker": ticker}


@router.delete("/{ticker}")
def remove_from_watchlist(ticker: str):
    success = wl_db.remove_ticker(ticker.upper())
    return {"success": success, "ticker": ticker.upper()}


@router.get("/check/{ticker}")
def check_watchlist(ticker: str):
    return {"ticker": ticker.upper(), "in_watchlist": wl_db.is_in_watchlist(ticker.upper())}
