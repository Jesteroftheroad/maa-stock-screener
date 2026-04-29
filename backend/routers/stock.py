"""Individual stock endpoints: full data, chart, similar stocks."""

import logging
from fastapi import APIRouter, Query
from data.fetcher import DataFetcher
from data.universe import get_all_stocks, get_stock_meta
from engines.fundamental import FundamentalEngine
from engines.technical import TechnicalEngine
from engines.scorer import AIScorer

log = logging.getLogger(__name__)
router = APIRouter()

_fetcher = DataFetcher()
_fund_engine = FundamentalEngine(_fetcher)
_tech_engine = TechnicalEngine(_fetcher)
_scorer = AIScorer()

PERIOD_MAP = {
    "1d":  ("5d",  "5m"),
    "1w":  ("1mo", "1h"),
    "1m":  ("3mo", "1d"),
    "3m":  ("6mo", "1d"),
    "1y":  ("1y",  "1d"),
    "5y":  ("5y",  "1wk"),
}


@router.get("/{ticker}")
def get_stock(ticker: str):
    """Full stock data: fundamentals + technicals + AI score + news."""
    ticker = ticker.upper()

    info = _fetcher.get_ticker_info(ticker)
    if info is None:
        return {"error": f"No data available for {ticker}"}

    fund = _fund_engine.analyze(ticker)
    tech = _tech_engine.analyze(ticker)
    ai_score = _scorer.score(fund, tech, info)
    news = _fetcher.get_news(ticker)
    meta = get_stock_meta(ticker) or {}

    price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
    prev = info.get("regularMarketPreviousClose") or info.get("previousClose") or price
    change_pct = round((price - prev) / prev * 100, 2) if prev and prev > 0 and price else None

    return {
        "ticker": ticker,
        "name": info.get("longName") or info.get("shortName") or ticker,
        "sector": info.get("sector") or meta.get("sector", ""),
        "industry": info.get("industry", ""),
        "country": meta.get("country", "US"),
        "exchange": info.get("exchange") or meta.get("exchange", ""),
        "description": info.get("longBusinessSummary", ""),
        "website": info.get("website", ""),
        "price": round(float(price), 2) if price else None,
        "change_pct": change_pct,
        "market_cap": info.get("marketCap"),
        "volume": info.get("volume"),
        "avg_volume": info.get("averageVolume"),
        "fundamentals": {
            "pe": round(fund.pe, 2) if fund.pe else None,
            "forward_pe": round(fund.forward_pe, 2) if fund.forward_pe else None,
            "peg": round(fund.peg, 2) if fund.peg else None,
            "price_to_book": round(fund.price_to_book, 2) if fund.price_to_book else None,
            "ev_ebitda": round(fund.ev_ebitda, 2) if fund.ev_ebitda else None,
            "debt_to_equity": round(fund.debt_to_equity, 2) if fund.debt_to_equity else None,
            "roe": round(fund.roe * 100, 1) if fund.roe else None,
            "revenue_growth": round(fund.revenue_growth * 100, 1) if fund.revenue_growth is not None else None,
            "eps_growth": round(fund.eps_growth * 100, 1) if fund.eps_growth is not None else None,
            "dividend_yield": round(fund.dividend_yield * 100, 2) if fund.dividend_yield else None,
            "payout_ratio": round(fund.payout_ratio * 100, 1) if fund.payout_ratio else None,
            "beta": round(fund.beta, 2) if fund.beta else None,
            "intrinsic_value": fund.intrinsic_value,
            "margin_of_safety": round(fund.margin_of_safety * 100, 1) if fund.margin_of_safety is not None else None,
            "fifty_two_week_high": fund.fifty_two_week_high,
            "fifty_two_week_low": fund.fifty_two_week_low,
            "analyst_recommendation": fund.analyst_recommendation,
            "verdict": fund.verdict,
        },
        "technicals": {
            "rsi": tech.rsi,
            "rsi_signal": tech.rsi_signal,
            "trend": tech.trend,
            "macd": tech.macd,
            "macd_signal": tech.macd_signal_line,
            "macd_crossover": tech.macd_crossover,
            "momentum": tech.momentum,
            "volume_signal": tech.volume_signal,
            "above_sma20": tech.above_sma20,
            "above_sma50": tech.above_sma50,
            "above_sma200": tech.above_sma200,
            "support_levels": tech.support_levels,
            "resistance_levels": tech.resistance_levels,
            "atr": tech.atr,
            "stop_loss": tech.stop_loss,
        },
        "ai_score": {
            "total": ai_score.total,
            "label": ai_score.label,
            "label_color": ai_score.label_color,
            "breakdown": {
                "fundamentals": ai_score.fundamentals,
                "technical": ai_score.technical,
                "growth": ai_score.growth,
                "sentiment": ai_score.sentiment,
                "risk": ai_score.risk,
            },
            "bull_case": ai_score.bull_case,
            "bear_case": ai_score.bear_case,
            "fair_value": ai_score.fair_value,
        },
        "news": news,
    }


@router.get("/{ticker}/chart")
def get_stock_chart(ticker: str, period: str = Query("1m", enum=list(PERIOD_MAP.keys()))):
    """OHLCV data formatted for Recharts."""
    ticker = ticker.upper()
    yf_period, interval = PERIOD_MAP.get(period, ("3mo", "1d"))

    history = _fetcher.get_price_history(ticker, period=yf_period, interval=interval)
    if history is None or history.empty:
        return {"ticker": ticker, "period": period, "data": []}

    data = []
    for idx, row in history.iterrows():
        try:
            data.append({
                "date": str(idx)[:19],
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]) if "Volume" in row else 0,
            })
        except Exception:
            continue

    return {"ticker": ticker, "period": period, "data": data}


@router.get("/{ticker}/similar")
def get_similar_stocks(ticker: str):
    """Returns up to 5 stocks in the same sector with similar market cap."""
    ticker = ticker.upper()
    info = _fetcher.get_ticker_info(ticker)
    if info is None:
        return {"similar": []}

    target_sector = info.get("sector", "")
    target_cap = info.get("marketCap", 0) or 0

    candidates = [s for s in get_all_stocks() if s["ticker"] != ticker and s.get("sector") == target_sector]

    # Score by market cap similarity
    def cap_score(s):
        s_info = _fetcher.get_ticker_info(s["ticker"])
        if s_info is None:
            return float("inf")
        cap = s_info.get("marketCap", 0) or 0
        return abs(cap - target_cap)

    candidates_with_info = []
    for c in candidates[:30]:
        s_info = _fetcher.get_ticker_info(c["ticker"])
        if s_info:
            cap = s_info.get("marketCap", 0) or 0
            candidates_with_info.append((abs(cap - target_cap), c["ticker"], s_info, c))

    candidates_with_info.sort(key=lambda x: x[0])
    similar = []
    for _, t, s_info, meta in candidates_with_info[:5]:
        price = s_info.get("currentPrice") or s_info.get("regularMarketPrice") or s_info.get("previousClose")
        prev = s_info.get("regularMarketPreviousClose") or s_info.get("previousClose") or price
        change_pct = round((price - prev) / prev * 100, 2) if prev and prev > 0 and price else None
        similar.append({
            "ticker": t,
            "name": s_info.get("shortName") or meta.get("name", t),
            "price": round(float(price), 2) if price else None,
            "change_pct": change_pct,
            "sector": meta.get("sector", ""),
            "country": meta.get("country", "US"),
        })

    return {"similar": similar}
