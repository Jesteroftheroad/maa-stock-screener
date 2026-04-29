"""AI Score Engine — aggregates fundamental + technical signals into a 0-100 score."""

import math
import logging
from dataclasses import dataclass
from engines.fundamental import FundamentalResult
from engines.technical import TechnicalResult

log = logging.getLogger(__name__)


@dataclass
class AIScore:
    total: int = 50
    label: str = "Watchlist"
    label_color: str = "yellow"
    fundamentals: int = 0
    technical: int = 0
    growth: int = 0
    sentiment: int = 0
    risk: int = 0
    bull_case: str = ""
    bear_case: str = ""
    fair_value: float | None = None


class AIScorer:
    def score(
        self,
        fund: FundamentalResult | None,
        tech: TechnicalResult | None,
        info: dict | None,
    ) -> AIScore:
        result = AIScore()
        info = info or {}

        # --- Fundamentals (30 pts) ---
        f_score = 0
        pe_signal = fund.pe_signal if fund else "UNAVAILABLE"
        pe_map = {"ATTRACTIVE": 10, "FAIR": 7, "EXPENSIVE": 3, "VERY EXPENSIVE": 0, "UNAVAILABLE": 5}
        f_score += pe_map.get(pe_signal, 5)

        debt_signal = fund.debt_signal if fund else "UNAVAILABLE"
        debt_map = {"EXCELLENT": 10, "ACCEPTABLE": 7, "CONCERNING": 0, "UNAVAILABLE": 5}
        f_score += debt_map.get(debt_signal, 5)

        roe_signal = fund.roe_signal if fund else "UNAVAILABLE"
        roe_map = {"EXCELLENT": 10, "GOOD": 7, "POOR": 3, "NEGATIVE": 0, "UNAVAILABLE": 5}
        f_score += roe_map.get(roe_signal, 5)

        result.fundamentals = min(30, f_score)

        # --- Technical (30 pts) ---
        t_score = 0
        rsi = tech.rsi if tech else None
        if rsi is not None:
            if 30 <= rsi <= 45:
                t_score += 10   # Oversold — potential bounce
            elif 45 < rsi <= 55:
                t_score += 7    # Neutral
            elif 55 < rsi <= 70:
                t_score += 8    # Bullish momentum
            else:
                t_score += 2    # Overbought or very oversold

        trend = tech.trend if tech else "SIDEWAYS"
        trend_map = {"UPTREND": 10, "SIDEWAYS": 5, "DOWNTREND": 0}
        t_score += trend_map.get(trend, 5)

        crossover = tech.macd_crossover if tech else "NONE"
        macd_map = {"BULLISH": 10, "NONE": 5, "BEARISH": 0}
        t_score += macd_map.get(crossover, 5)

        result.technical = min(30, t_score)

        # --- Growth (20 pts) ---
        g_score = 0
        rev_signal = fund.revenue_signal if fund else "UNAVAILABLE"
        rev_map = {"STRONG": 12, "ADEQUATE": 8, "WEAK": 4, "DECLINING": 0, "UNAVAILABLE": 5}
        g_score += rev_map.get(rev_signal, 5)

        eps_growth = fund.eps_growth if fund else None
        if eps_growth is not None:
            g_score += 8 if eps_growth > 0 else 0
        else:
            g_score += 4  # Neutral when unavailable

        result.growth = min(20, g_score)

        # --- Sentiment (10 pts) ---
        rec_mean = info.get("recommendationMean") or (fund.analyst_recommendation if fund else None)
        if rec_mean is not None:
            if rec_mean <= 1.5:
                result.sentiment = 10
            elif rec_mean <= 2.5:
                result.sentiment = 7
            elif rec_mean <= 3.5:
                result.sentiment = 4
            else:
                result.sentiment = 0
        else:
            result.sentiment = 5  # Neutral default

        # --- Risk (10 pts) ---
        beta = info.get("beta") or (fund.beta if fund else None)
        r_score = 10
        if beta is not None:
            if beta <= 1.0:
                r_score = 10
            elif beta <= 1.5:
                r_score = 7
            elif beta <= 2.0:
                r_score = 4
            else:
                r_score = 1

        # Penalty if far below 52wk high
        high52 = info.get("fiftyTwoWeekHigh") or (fund.fifty_two_week_high if fund else None)
        price = info.get("currentPrice") or info.get("regularMarketPrice") or (fund.current_price if fund else None)
        if high52 and price and high52 > 0:
            pct_from_high = (price - high52) / high52
            if pct_from_high < -0.30:
                r_score = max(0, r_score - 3)

        result.risk = min(10, max(0, r_score))

        # --- Total ---
        result.total = result.fundamentals + result.technical + result.growth + result.sentiment + result.risk

        # Override rules
        pe = fund.pe if fund else None
        if pe and pe > 50 and result.total < 60:
            result.total = min(result.total, 45)  # Cap at Risky when very expensive

        if debt_signal == "CONCERNING" and result.total < 55:
            result.total = min(result.total, 49)

        # Label
        if result.total >= 70:
            result.label = "Buy Candidate"
            result.label_color = "green"
        elif result.total >= 50:
            result.label = "Watchlist"
            result.label_color = "yellow"
        elif result.total >= 30:
            result.label = "Risky"
            result.label_color = "orange"
        else:
            result.label = "Overvalued"
            result.label_color = "red"

        # Fair value (Graham Number)
        result.fair_value = fund.intrinsic_value if fund else None

        # Bull/Bear case text
        result.bull_case = self._build_bull_case(fund, tech, info)
        result.bear_case = self._build_bear_case(fund, tech, info)

        return result

    def _build_bull_case(self, fund: FundamentalResult | None, tech: TechnicalResult | None, info: dict) -> str:
        parts = []
        if fund and fund.pe:
            parts.append(f"Trading at {fund.pe:.1f}x earnings")
        if fund and fund.revenue_growth:
            parts.append(f"{fund.revenue_growth*100:.0f}% revenue growth")
        if fund and fund.roe:
            parts.append(f"{fund.roe*100:.0f}% return on equity")
        if tech and tech.trend == "UPTREND":
            parts.append("price in confirmed uptrend")
        if tech and tech.macd_crossover == "BULLISH":
            parts.append("MACD bullish crossover")
        if fund and fund.margin_of_safety and fund.margin_of_safety > 0:
            parts.append(f"{fund.margin_of_safety*100:.0f}% margin of safety vs Graham value")
        return ". ".join(parts).capitalize() + "." if parts else "Insufficient data for bull case."

    def _build_bear_case(self, fund: FundamentalResult | None, tech: TechnicalResult | None, info: dict) -> str:
        parts = []
        if fund and fund.debt_signal == "CONCERNING":
            parts.append(f"high debt-to-equity ratio of {fund.debt_to_equity:.1f}x" if fund.debt_to_equity else "concerning debt levels")
        if fund and fund.margin_of_safety and fund.margin_of_safety < 0:
            parts.append(f"trading {abs(fund.margin_of_safety*100):.0f}% above intrinsic value")
        if tech and tech.trend == "DOWNTREND":
            parts.append("price below key moving averages")
        if tech and tech.rsi and tech.rsi > 70:
            parts.append(f"RSI at {tech.rsi:.0f} — overbought")
        if fund and fund.revenue_signal == "DECLINING":
            parts.append("declining revenue trend")
        rec = info.get("recommendationMean") or (fund.analyst_recommendation if fund else None)
        if rec and rec > 3.0:
            parts.append(f"analyst consensus {rec:.1f}/5 — weak buy signal")
        return ". ".join(parts).capitalize() + "." if parts else "Monitor for fundamental deterioration."
