"""
Screener Engine — filters the stock universe and scores survivors.
Uses ThreadPoolExecutor for concurrent yfinance fetching (I/O-bound).
"""

import hashlib
import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from data.fetcher import DataFetcher
from data.universe import get_all_stocks
from engines.fundamental import FundamentalEngine, FundamentalResult
from engines.technical import TechnicalEngine, TechnicalResult
from engines.scorer import AIScorer, AIScore
from data.cache_manager import CacheManager
import config

log = logging.getLogger(__name__)


def _filter_hash(filters: dict) -> str:
    return hashlib.sha256(json.dumps(filters, sort_keys=True).encode()).hexdigest()[:16]


class ScreenerEngine:
    def __init__(self, fetcher: DataFetcher):
        self.fetcher = fetcher
        self.fund_engine = FundamentalEngine(fetcher)
        self.tech_engine = TechnicalEngine(fetcher)
        self.scorer = AIScorer()
        self._result_cache: dict = {}

    def run(self, filters: dict, max_results: int = 50) -> dict:
        cache_key = _filter_hash(filters)
        cached = self._result_cache.get(cache_key)
        if cached and time.time() - cached["ts"] < config.SCREENER_CACHE_TTL:
            log.info(f"Screener cache HIT for {cache_key}")
            return {**cached["data"], "cached": True}

        stocks = self._pre_filter_universe(filters)
        log.info(f"Pre-filtered universe: {len(stocks)} stocks to process")

        results = []
        total_scanned = 0

        with ThreadPoolExecutor(max_workers=config.SCREENER_MAX_WORKERS) as executor:
            futures = {
                executor.submit(self._evaluate_stock, s, filters): s
                for s in stocks
            }
            for future in as_completed(futures):
                total_scanned += 1
                try:
                    card = future.result()
                    if card is not None:
                        results.append(card)
                        if len(results) >= max_results:
                            # Cancel remaining futures
                            for f in futures:
                                f.cancel()
                            break
                except Exception as e:
                    log.debug(f"Screener future error: {e}")

        # Sort by AI score descending
        results.sort(key=lambda x: x.get("ai_score", 0), reverse=True)

        response = {
            "results": results[:max_results],
            "total": len(results),
            "scanned": total_scanned,
            "cached": False,
        }
        self._result_cache[cache_key] = {"data": response, "ts": time.time()}
        return response

    def _pre_filter_universe(self, filters: dict) -> list[dict]:
        """Fast filter using only JSON metadata — no API calls."""
        stocks = get_all_stocks()
        filtered = []
        for s in stocks:
            if filters.get("sector") and s.get("sector", "").lower() != filters["sector"].lower():
                continue
            if filters.get("country") and s.get("country", "").upper() != filters["country"].upper():
                continue
            if filters.get("exchange") and s.get("exchange", "").upper() != filters["exchange"].upper():
                continue
            filtered.append(s)
        return filtered

    def _evaluate_stock(self, stock_meta: dict, filters: dict) -> dict | None:
        ticker = stock_meta["ticker"]
        try:
            info = self.fetcher.get_ticker_info(ticker)
            if info is None:
                return None

            # Fast info-dict filters
            if not self._passes_info_filters(info, filters):
                return None

            # Technical filters (only if needed)
            tech_result = None
            needs_tech = any(k in filters for k in ["rsi_min", "rsi_max", "above_sma50", "above_sma200", "above_sma20", "volume_surge"])
            if needs_tech:
                ma_pos = self.tech_engine.get_ma_positions(ticker)
                if not self._passes_technical_filters(ma_pos, filters):
                    return None

            # Full analysis for scoring
            fund_result = self.fund_engine.analyze(ticker)
            if needs_tech:
                tech_result = self.tech_engine.analyze(ticker)
            else:
                # Lightweight tech for RSI/trend in score
                tech_result = self.tech_engine.analyze(ticker)

            ai_score = self.scorer.score(fund_result, tech_result, info)

            if filters.get("ai_score_min") and ai_score.total < int(filters["ai_score_min"]):
                return None

            return self._build_card(ticker, stock_meta, info, fund_result, tech_result, ai_score)

        except Exception as e:
            log.debug(f"evaluate_stock failed for {ticker}: {e}")
            return None

    def _passes_info_filters(self, info: dict, filters: dict) -> bool:
        # Price
        price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
        if price:
            if filters.get("price_min") and price < float(filters["price_min"]):
                return False
            if filters.get("price_max") and price > float(filters["price_max"]):
                return False

        # Market cap
        market_cap = info.get("marketCap")
        if market_cap:
            if filters.get("market_cap_min") and market_cap < float(filters["market_cap_min"]):
                return False
            if filters.get("market_cap_max") and market_cap > float(filters["market_cap_max"]):
                return False

        # PE
        pe = info.get("trailingPE") or info.get("forwardPE")
        if pe and pe > 0:
            if filters.get("pe_min") and pe < float(filters["pe_min"]):
                return False
            if filters.get("pe_max") and pe > float(filters["pe_max"]):
                return False

        # Forward PE
        fpe = info.get("forwardPE")
        if fpe and fpe > 0:
            if filters.get("forward_pe_max") and fpe > float(filters["forward_pe_max"]):
                return False

        # PEG
        peg = info.get("pegRatio") or info.get("trailingPegRatio")
        if peg and peg > 0 and filters.get("peg_max") and peg > float(filters["peg_max"]):
            return False

        # Dividend yield
        div = info.get("dividendYield") or info.get("trailingAnnualDividendYield")
        if div is not None and filters.get("div_yield_min") and div < float(filters["div_yield_min"]):
            return False

        # Payout ratio
        payout = info.get("payoutRatio")
        if payout is not None and filters.get("payout_ratio_max") and payout > float(filters["payout_ratio_max"]):
            return False

        # Revenue growth
        rev_growth = info.get("revenueGrowth")
        if rev_growth is not None and filters.get("rev_growth_min") and rev_growth < float(filters["rev_growth_min"]):
            return False

        # ROE
        roe = info.get("returnOnEquity")
        if roe is not None and filters.get("roe_min") and roe < float(filters["roe_min"]):
            return False

        # Debt
        dte = info.get("debtToEquity")
        if dte is not None and filters.get("debt_max"):
            dte_ratio = dte / 100.0 if dte > 10 else dte
            if dte_ratio > float(filters["debt_max"]):
                return False

        return True

    def _passes_technical_filters(self, ma_pos: dict, filters: dict) -> bool:
        rsi = ma_pos.get("rsi")
        if rsi is not None:
            if filters.get("rsi_min") and rsi < float(filters["rsi_min"]):
                return False
            if filters.get("rsi_max") and rsi > float(filters["rsi_max"]):
                return False

        if filters.get("above_sma50") is True and ma_pos.get("above_sma50") is False:
            return False
        if filters.get("above_sma200") is True and ma_pos.get("above_sma200") is False:
            return False
        if filters.get("above_sma20") is True and ma_pos.get("above_sma20") is False:
            return False

        vol_surge = ma_pos.get("volume_surge")
        if vol_surge is not None and filters.get("volume_surge"):
            if vol_surge < float(filters["volume_surge"]):
                return False

        return True

    def _build_card(
        self,
        ticker: str,
        meta: dict,
        info: dict,
        fund: FundamentalResult,
        tech: TechnicalResult | None,
        ai_score: AIScore,
    ) -> dict:
        price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose") or 0
        prev = info.get("regularMarketPreviousClose") or info.get("previousClose") or price
        change_pct = round((price - prev) / prev * 100, 2) if prev and prev > 0 else None

        sparkline = self.fetcher.get_sparkline(ticker)

        return {
            "ticker": ticker,
            "name": info.get("shortName") or meta.get("name", ticker),
            "price": round(float(price), 2) if price else None,
            "change_pct": change_pct,
            "market_cap": info.get("marketCap"),
            "pe": round(fund.pe, 1) if fund.pe else None,
            "forward_pe": round(fund.forward_pe, 1) if fund.forward_pe else None,
            "revenue_growth": round(fund.revenue_growth * 100, 1) if fund.revenue_growth is not None else None,
            "rsi": tech.rsi if tech else None,
            "div_yield": round(fund.dividend_yield * 100, 2) if fund.dividend_yield else None,
            "ai_score": ai_score.total,
            "ai_label": ai_score.label,
            "ai_label_color": ai_score.label_color,
            "sector": info.get("sector") or meta.get("sector", ""),
            "country": meta.get("country", "US"),
            "exchange": meta.get("exchange", ""),
            "sparkline": sparkline,
        }
