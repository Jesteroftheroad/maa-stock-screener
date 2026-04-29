"""
Fundamental Engine — Buffett / Lynch / Graham principles.
Adapted from buddy's fundamental_engine.py.
"""

import math
import logging
from dataclasses import dataclass, field
from data.fetcher import DataFetcher
import config

log = logging.getLogger(__name__)


@dataclass
class FundamentalResult:
    ticker: str = ""
    current_price: float | None = None
    intrinsic_value: float | None = None
    margin_of_safety: float | None = None
    pe: float | None = None
    pe_signal: str = "UNAVAILABLE"
    peg: float | None = None
    peg_signal: str = "UNAVAILABLE"
    debt_to_equity: float | None = None
    debt_signal: str = "UNAVAILABLE"
    revenue_growth: float | None = None
    revenue_signal: str = "UNAVAILABLE"
    roe: float | None = None
    roe_signal: str = "UNAVAILABLE"
    eps_growth: float | None = None
    forward_pe: float | None = None
    price_to_book: float | None = None
    ev_ebitda: float | None = None
    dividend_yield: float | None = None
    payout_ratio: float | None = None
    beta: float | None = None
    market_cap: float | None = None
    fifty_two_week_high: float | None = None
    fifty_two_week_low: float | None = None
    analyst_recommendation: float | None = None
    composite_score: int = 0
    verdict: str = "INSUFFICIENT DATA"
    missing_fields: list = field(default_factory=list)
    data_available: bool = True


class FundamentalEngine:
    def __init__(self, fetcher: DataFetcher):
        self.fetcher = fetcher

    def analyze(self, ticker: str) -> FundamentalResult:
        result = FundamentalResult(ticker=ticker)

        info = self.fetcher.get_ticker_info(ticker)
        if info is None:
            result.data_available = False
            result.verdict = "INSUFFICIENT DATA"
            return result

        result.current_price = (
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or info.get("previousClose")
        )
        if result.current_price is None:
            result.missing_fields.append("current_price")

        result.pe, result.pe_signal = self._get_pe_signal(info)
        if result.pe is None:
            result.missing_fields.append("pe")

        result.peg, result.peg_signal = self._get_peg_signal(info)
        if result.peg is None:
            result.missing_fields.append("peg")

        result.intrinsic_value = self._calculate_intrinsic_value(info)
        if result.intrinsic_value is None:
            result.missing_fields.append("intrinsic_value")

        if result.current_price and result.intrinsic_value:
            result.margin_of_safety = (result.intrinsic_value - result.current_price) / result.intrinsic_value
        elif result.intrinsic_value is None:
            result.missing_fields.append("margin_of_safety")

        result.debt_to_equity, result.debt_signal = self._get_debt_signal(info)
        if result.debt_to_equity is None:
            result.missing_fields.append("debt_to_equity")

        result.revenue_growth, result.revenue_signal = self._get_revenue_growth_signal(ticker, info)
        if result.revenue_growth is None:
            result.missing_fields.append("revenue_growth")

        result.roe, result.roe_signal = self._get_roe_signal(info)
        if result.roe is None:
            result.missing_fields.append("roe")

        # Additional MAA fields
        result.eps_growth = info.get("earningsGrowth") or info.get("earningsQuarterlyGrowth")
        result.forward_pe = info.get("forwardPE")
        result.price_to_book = info.get("priceToBook")
        result.ev_ebitda = info.get("enterpriseToEbitda")
        result.dividend_yield = info.get("dividendYield") or info.get("trailingAnnualDividendYield")
        result.payout_ratio = info.get("payoutRatio")
        result.beta = info.get("beta")
        result.market_cap = info.get("marketCap")
        result.fifty_two_week_high = info.get("fiftyTwoWeekHigh")
        result.fifty_two_week_low = info.get("fiftyTwoWeekLow")
        result.analyst_recommendation = info.get("recommendationMean")

        signals = {
            "pe_signal": result.pe_signal,
            "peg_signal": result.peg_signal,
            "debt_signal": result.debt_signal,
            "revenue_signal": result.revenue_signal,
            "roe_signal": result.roe_signal,
            "margin_of_safety": result.margin_of_safety,
        }
        result.composite_score = self._composite_score(signals)
        result.verdict = self._generate_verdict(result.composite_score, result.margin_of_safety)
        result.data_available = len(result.missing_fields) < 4

        return result

    def _get_pe_signal(self, info: dict) -> tuple[float | None, str]:
        pe = info.get("trailingPE") or info.get("forwardPE")
        if pe is None or pe <= 0:
            return None, "UNAVAILABLE"
        if pe < 15:
            return pe, "ATTRACTIVE"
        elif pe <= config.MAX_ACCEPTABLE_PE:
            return pe, "FAIR"
        elif pe <= 40:
            return pe, "EXPENSIVE"
        return pe, "VERY EXPENSIVE"

    def _get_peg_signal(self, info: dict) -> tuple[float | None, str]:
        peg = info.get("trailingPegRatio") or info.get("pegRatio")
        if peg is None or peg <= 0:
            return None, "UNAVAILABLE"
        if peg < config.PEG_UNDERVALUED:
            return peg, "UNDERVALUED"
        elif peg <= config.PEG_FAIR:
            return peg, "FAIR"
        return peg, "EXPENSIVE"

    def _calculate_intrinsic_value(self, info: dict) -> float | None:
        eps = info.get("trailingEps") or info.get("epsTrailingTwelveMonths")
        bvps = info.get("bookValue")
        if eps is None or bvps is None or eps <= 0 or bvps <= 0:
            return None
        try:
            return round(math.sqrt(config.GRAHAM_MULTIPLIER * eps * bvps), 2)
        except (ValueError, TypeError):
            return None

    def _get_debt_signal(self, info: dict) -> tuple[float | None, str]:
        dte = info.get("debtToEquity")
        if dte is None:
            return None, "UNAVAILABLE"
        dte_ratio = dte / 100.0 if dte > 10 else dte
        if dte_ratio < 0.5:
            return dte_ratio, "EXCELLENT"
        elif dte_ratio <= config.MAX_ACCEPTABLE_DEBT_TO_EQUITY:
            return dte_ratio, "ACCEPTABLE"
        return dte_ratio, "CONCERNING"

    def _get_revenue_growth_signal(self, ticker: str, info: dict) -> tuple[float | None, str]:
        growth = info.get("revenueGrowth")
        if growth is not None:
            if growth >= config.MIN_REVENUE_GROWTH * 2:
                return growth, "STRONG"
            elif growth >= config.MIN_REVENUE_GROWTH:
                return growth, "ADEQUATE"
            elif growth >= 0:
                return growth, "WEAK"
            return growth, "DECLINING"

        try:
            fin = self.fetcher.get_financials(ticker)
            if fin is not None and not fin.empty:
                for label in ["Total Revenue", "Revenue"]:
                    if label in fin.index:
                        rev_row = fin.loc[label]
                        if len(rev_row) >= 2:
                            vals = rev_row.values
                            recent, prior = float(vals[0]), float(vals[1])
                            if prior > 0:
                                growth = (recent - prior) / prior
                                if growth >= config.MIN_REVENUE_GROWTH * 2:
                                    return growth, "STRONG"
                                elif growth >= config.MIN_REVENUE_GROWTH:
                                    return growth, "ADEQUATE"
                                elif growth >= 0:
                                    return growth, "WEAK"
                                return growth, "DECLINING"
        except Exception as e:
            log.debug(f"Revenue growth fallback failed for {ticker}: {e}")

        return None, "UNAVAILABLE"

    def _get_roe_signal(self, info: dict) -> tuple[float | None, str]:
        roe = info.get("returnOnEquity")
        if roe is None:
            return None, "UNAVAILABLE"
        if roe >= config.MIN_ROE * 1.5:
            return roe, "EXCELLENT"
        elif roe >= config.MIN_ROE:
            return roe, "GOOD"
        elif roe >= 0:
            return roe, "POOR"
        return roe, "NEGATIVE"

    def _composite_score(self, signals: dict) -> int:
        score = 0
        mos = signals.get("margin_of_safety")
        if mos is not None:
            if mos >= config.MARGIN_OF_SAFETY:
                score += 30
            elif mos >= 0.10:
                score += 20
            elif mos >= 0:
                score += 10

        debt_map = {"EXCELLENT": 25, "ACCEPTABLE": 15, "CONCERNING": 0, "UNAVAILABLE": 10}
        score += debt_map.get(signals.get("debt_signal", "UNAVAILABLE"), 10)

        roe_map = {"EXCELLENT": 20, "GOOD": 15, "POOR": 5, "NEGATIVE": 0, "UNAVAILABLE": 8}
        score += roe_map.get(signals.get("roe_signal", "UNAVAILABLE"), 8)

        peg_map = {"UNDERVALUED": 15, "FAIR": 10, "EXPENSIVE": 0, "UNAVAILABLE": 5}
        score += peg_map.get(signals.get("peg_signal", "UNAVAILABLE"), 5)

        rev_map = {"STRONG": 10, "ADEQUATE": 7, "WEAK": 3, "DECLINING": 0, "UNAVAILABLE": 4}
        score += rev_map.get(signals.get("revenue_signal", "UNAVAILABLE"), 4)

        return min(100, max(0, score))

    def _generate_verdict(self, score: int, margin_of_safety: float | None) -> str:
        if margin_of_safety is not None and margin_of_safety < -0.15:
            return "AVOID"
        if score >= 75:
            return "STRONG BUY"
        elif score >= 55:
            return "BUY"
        elif score >= 35:
            return "HOLD"
        elif score > 0:
            return "AVOID"
        return "INSUFFICIENT DATA"
