"""
DataFetcher — the ONLY place yfinance is called.
Every method returns None on failure. Callers must handle None gracefully.
"""

import logging
import time
import yfinance as yf
import pandas as pd
from data.cache_manager import CacheManager
import config

log = logging.getLogger(__name__)

# Singleton caches shared across all requests
_price_cache: CacheManager | None = None
_fund_cache: CacheManager | None = None


def get_price_cache() -> CacheManager:
    global _price_cache
    if _price_cache is None:
        _price_cache = CacheManager(config.CACHE_DIR_PRICE, config.PRICE_CACHE_TTL)
    return _price_cache


def get_fund_cache() -> CacheManager:
    global _fund_cache
    if _fund_cache is None:
        _fund_cache = CacheManager(config.CACHE_DIR_FUNDS, config.FUNDS_CACHE_TTL)
    return _fund_cache


class DataFetcher:
    def __init__(self):
        self.price_cache = get_price_cache()
        self.fund_cache = get_fund_cache()

    def _key(self, ticker: str, suffix: str) -> str:
        return f"{ticker}_{suffix}"

    def _fetch_ticker(self, ticker: str) -> yf.Ticker | None:
        try:
            return yf.Ticker(ticker)
        except Exception as e:
            log.error(f"Could not create Ticker for {ticker}: {e}")
            return None

    # ------------------------------------------------------------------
    # Fundamental data
    # ------------------------------------------------------------------

    def get_ticker_info(self, ticker: str) -> dict | None:
        key = self._key(ticker, "info")
        cached = self.fund_cache.get(key)
        if cached is not None:
            return cached

        t = self._fetch_ticker(ticker)
        if t is None:
            return None
        try:
            info = t.info
            if not info:
                return None
            price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
            if price is None and len(info) < 5:
                log.warning(f"Empty info for {ticker}")
                return None
            self.fund_cache.set(key, info)
            return info
        except Exception as e:
            log.error(f"get_ticker_info failed for {ticker}: {e}")
            return None

    def get_financials(self, ticker: str) -> pd.DataFrame | None:
        key = self._key(ticker, "financials")
        cached = self.fund_cache.get(key)
        if cached is not None:
            try:
                return pd.DataFrame(cached)
            except Exception:
                pass

        t = self._fetch_ticker(ticker)
        if t is None:
            return None
        try:
            fin = t.financials
            if fin is None or fin.empty:
                return None
            self.fund_cache.set(key, fin.to_dict())
            return fin
        except Exception as e:
            log.error(f"get_financials failed for {ticker}: {e}")
            return None

    # ------------------------------------------------------------------
    # Price / Technical data
    # ------------------------------------------------------------------

    def get_price_history(self, ticker: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame | None:
        key = self._key(ticker, f"history_{period}_{interval}")
        cached = self.price_cache.get(key)
        if cached is not None:
            try:
                df = pd.DataFrame(cached)
                df.index = pd.to_datetime(df.index)
                return df
            except Exception:
                pass

        try:
            t = yf.Ticker(ticker)
            hist = t.history(period=period, interval=interval, auto_adjust=True)
            if hist is None or hist.empty:
                return None
            self.price_cache.set(key, hist.to_dict())
            return hist
        except Exception as e:
            log.error(f"get_price_history failed for {ticker}: {e}")
            return None

    def get_sparkline(self, ticker: str) -> list[float]:
        """Returns last 7 daily closing prices for sparkline chart."""
        history = self.get_price_history(ticker, period="1mo", interval="1d")
        if history is None or history.empty:
            return []
        closes = history["Close"].dropna().tail(7)
        return [round(float(v), 2) for v in closes.values]

    def get_current_price(self, ticker: str) -> float | None:
        info = self.get_ticker_info(ticker)
        if info is None:
            return None
        return (
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or info.get("previousClose")
        )

    def get_daily_change_pct(self, ticker: str) -> float | None:
        info = self.get_ticker_info(ticker)
        if info is None:
            return None
        prev = info.get("regularMarketPreviousClose") or info.get("previousClose")
        curr = info.get("currentPrice") or info.get("regularMarketPrice")
        if prev and curr and prev > 0:
            return round((curr - prev) / prev * 100, 2)
        return info.get("regularMarketChangePercent")

    # ------------------------------------------------------------------
    # Market overview (batch fetch for index cards)
    # ------------------------------------------------------------------

    def get_market_overview(self) -> dict:
        result = {}
        for key, ticker in config.MARKET_TICKERS.items():
            try:
                t = yf.Ticker(ticker)
                info = t.fast_info
                price = getattr(info, "last_price", None) or getattr(info, "regular_market_price", None)
                prev = getattr(info, "previous_close", None)
                change_pct = None
                if price and prev and prev > 0:
                    change_pct = round((price - prev) / prev * 100, 2)
                result[key] = {
                    "ticker": ticker,
                    "name": config.MARKET_TICKER_NAMES.get(ticker, ticker),
                    "price": round(float(price), 2) if price else None,
                    "change_pct": change_pct,
                }
            except Exception as e:
                log.error(f"Market overview failed for {ticker}: {e}")
                result[key] = {"ticker": ticker, "name": config.MARKET_TICKER_NAMES.get(ticker, ticker), "price": None, "change_pct": None}
        return result

    def get_batch_prices(self, tickers: list[str]) -> dict[str, dict]:
        """
        Batch price fetch using yf.download — one API call for many tickers.
        Returns {ticker: {price, change_pct, name}}.
        """
        if not tickers:
            return {}

        # Filter out already-cached tickers
        result = {}
        to_fetch = []
        for t in tickers:
            key = self._key(t, "batch_price")
            cached = self.price_cache.get(key)
            if cached:
                result[t] = cached
            else:
                to_fetch.append(t)

        if not to_fetch:
            return result

        try:
            ticker_str = " ".join(to_fetch)
            data = yf.download(ticker_str, period="2d", interval="1d",
                               group_by="ticker", auto_adjust=True, progress=False, threads=True)
            for t in to_fetch:
                try:
                    if len(to_fetch) == 1:
                        closes = data["Close"]
                    else:
                        closes = data[t]["Close"] if t in data.columns.get_level_values(0) else None

                    if closes is None or len(closes) < 2:
                        result[t] = {"ticker": t, "price": None, "change_pct": None}
                        continue

                    closes = closes.dropna()
                    if len(closes) < 2:
                        result[t] = {"ticker": t, "price": None, "change_pct": None}
                        continue

                    price = round(float(closes.iloc[-1]), 2)
                    prev  = round(float(closes.iloc[-2]), 2)
                    change_pct = round((price - prev) / prev * 100, 2) if prev > 0 else None
                    entry = {"ticker": t, "price": price, "change_pct": change_pct}
                    result[t] = entry
                    self.price_cache.set(self._key(t, "batch_price"), entry)
                except Exception:
                    result[t] = {"ticker": t, "price": None, "change_pct": None}
        except Exception as e:
            log.error(f"Batch price download failed: {e}")
            for t in to_fetch:
                result[t] = {"ticker": t, "price": None, "change_pct": None}

        return result

    # ------------------------------------------------------------------
    # Macro helpers
    # ------------------------------------------------------------------

    def get_vix(self) -> float | None:
        key = self._key("VIX", "price")
        cached = self.price_cache.get(key)
        if cached is not None:
            return cached
        try:
            t = yf.Ticker(config.VIX_TICKER)
            info = t.fast_info
            vix = getattr(info, "last_price", None) or getattr(info, "regular_market_price", None)
            if vix:
                self.price_cache.set(key, float(vix))
                return float(vix)
        except Exception as e:
            log.error(f"VIX fetch failed: {e}")
        return None

    def get_market_index_data(self) -> pd.DataFrame | None:
        return self.get_price_history(config.MARKET_INDEX, period="1y", interval="1d")

    def get_sector_etf_histories(self) -> dict[str, pd.DataFrame | None]:
        return {etf: self.get_price_history(etf, period="3mo", interval="1d") for etf in config.SECTOR_ETFS}

    def get_treasury_yield(self) -> float | None:
        try:
            t = yf.Ticker(config.TREASURY_TICKER)
            info = t.fast_info
            val = getattr(info, "last_price", None)
            return float(val) if val else None
        except Exception:
            return None

    # ------------------------------------------------------------------
    # News
    # ------------------------------------------------------------------

    def get_news(self, ticker: str) -> list[dict]:
        key = self._key(ticker, "news")
        cached = self.fund_cache.get(key)
        if cached is not None:
            return cached
        try:
            t = yf.Ticker(ticker)
            news = t.news or []
            items = []
            for n in news[:5]:
                items.append({
                    "title": n.get("title", ""),
                    "link": n.get("link", ""),
                    "publisher": n.get("publisher", ""),
                    "published_at": n.get("providerPublishTime", 0),
                })
            self.fund_cache.set(key, items)
            return items
        except Exception as e:
            log.error(f"get_news failed for {ticker}: {e}")
            return []
