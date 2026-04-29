"""Macro Engine — market context and Fear & Greed computation."""

import logging
from dataclasses import dataclass, field
import pandas as pd
from data.fetcher import DataFetcher
import config

log = logging.getLogger(__name__)


@dataclass
class MacroResult:
    stance: str = "NEUTRAL"
    risk_level: str = "MODERATE"
    vix: float | None = None
    trend: str = "SIDEWAYS"
    breadth: str = "MIXED"
    breadth_ratio: float = 0.5
    treasury_yield: float | None = None
    fear_greed_score: int = 50
    fear_greed_label: str = "Neutral"
    summary: str = ""
    data_available: bool = True
    missing_fields: list = field(default_factory=list)


def compute_fear_greed(vix: float | None, breadth_ratio: float, sp500_trend: str) -> dict:
    score = 50

    if vix is not None:
        if vix < 12:
            score += 20
        elif vix < 17:
            score += 12
        elif vix < 25:
            score += 0
        elif vix < 35:
            score -= 15
        else:
            score -= 25

    score += int((breadth_ratio - 0.5) * 40)

    if sp500_trend == "UPTREND":
        score += 12
    elif sp500_trend == "DOWNTREND":
        score -= 12

    score = max(0, min(100, score))

    if score >= 75:
        label = "Extreme Greed"
    elif score >= 55:
        label = "Greed"
    elif score >= 45:
        label = "Neutral"
    elif score >= 25:
        label = "Fear"
    else:
        label = "Extreme Fear"

    return {"score": score, "label": label}


class MacroEngine:
    def __init__(self, fetcher: DataFetcher):
        self.fetcher = fetcher

    def analyze(self) -> MacroResult:
        result = MacroResult()

        result.vix = self.fetcher.get_vix()
        if result.vix is None:
            result.missing_fields.append("VIX")

        index_history = self.fetcher.get_market_index_data()
        if index_history is not None and len(index_history) >= config.SMA_LONG:
            result.trend = self._get_trend_signal(index_history)
        else:
            result.trend = "SIDEWAYS"
            result.missing_fields.append("market_trend")

        sector_data = self.fetcher.get_sector_etf_histories()
        result.breadth, result.breadth_ratio = self._get_breadth_signal(sector_data)

        result.treasury_yield = self.fetcher.get_treasury_yield()

        fg = compute_fear_greed(result.vix, result.breadth_ratio, result.trend)
        result.fear_greed_score = fg["score"]
        result.fear_greed_label = fg["label"]

        result.risk_level = self._calculate_risk_level(result.vix, result.trend, result.breadth)
        result.stance = self._determine_stance(result.risk_level, result.trend)
        result.summary = self._build_summary(result)
        result.data_available = len(result.missing_fields) < 2

        return result

    def _get_trend_signal(self, history: pd.DataFrame) -> str:
        closes = history["Close"] if "Close" in history.columns else history.iloc[:, 3]
        sma50 = closes.rolling(config.SMA_MID).mean().iloc[-1]
        sma200 = closes.rolling(config.SMA_LONG).mean().iloc[-1]
        current = closes.iloc[-1]
        if current > sma200 and sma50 > sma200:
            return "UPTREND"
        elif current < sma200 and sma50 < sma200:
            return "DOWNTREND"
        return "SIDEWAYS"

    def _get_breadth_signal(self, sector_data: dict) -> tuple[str, float]:
        above_50sma = 0
        total = 0
        for etf, hist in sector_data.items():
            if hist is None or len(hist) < config.SMA_MID:
                continue
            closes = hist["Close"] if "Close" in hist.columns else hist.iloc[:, 3]
            sma50 = closes.rolling(config.SMA_MID).mean().iloc[-1]
            current = closes.iloc[-1]
            total += 1
            if current > sma50:
                above_50sma += 1

        if total == 0:
            return "MIXED", 0.5
        ratio = above_50sma / total
        if ratio > 0.6:
            return "BROAD", ratio
        elif ratio < 0.4:
            return "NARROW", ratio
        return "MIXED", ratio

    def _calculate_risk_level(self, vix: float | None, trend: str, breadth: str) -> str:
        score = 0
        if vix is not None:
            vix_scores = {"LOW_FEAR": 0, "MODERATE_FEAR": 1, "ELEVATED_FEAR": 2, "EXTREME_FEAR": 3}
            vix_signal = ("LOW_FEAR" if vix < config.VIX_LOW else
                          "MODERATE_FEAR" if vix < config.VIX_MODERATE else
                          "ELEVATED_FEAR" if vix < config.VIX_HIGH else "EXTREME_FEAR")
            score += vix_scores[vix_signal] * 0.40

        trend_weight = 0.35 if vix is not None else 0.55
        trend_scores = {"UPTREND": 0, "SIDEWAYS": 1, "DOWNTREND": 2}
        score += trend_scores.get(trend, 1) * trend_weight

        breadth_weight = 0.25 if vix is not None else 0.45
        breadth_scores = {"BROAD": 0, "MIXED": 1, "NARROW": 2}
        score += breadth_scores.get(breadth, 1) * breadth_weight

        if score < 0.5:
            return "LOW"
        elif score < 1.0:
            return "MODERATE"
        elif score < 1.7:
            return "HIGH"
        return "EXTREME"

    def _determine_stance(self, risk_level: str, trend: str) -> str:
        if risk_level == "EXTREME":
            return "BEARISH"
        if risk_level == "LOW" and trend == "UPTREND":
            return "BULLISH"
        if risk_level == "HIGH" or trend == "DOWNTREND":
            return "BEARISH"
        return "NEUTRAL"

    def _build_summary(self, r: MacroResult) -> str:
        vix_str = f"VIX at {r.vix:.1f}" if r.vix else "VIX unavailable"
        return (
            f"Market in {r.trend.lower().replace('_', ' ')} with {r.breadth.lower()} sector breadth. "
            f"{vix_str}. Fear & Greed: {r.fear_greed_label} ({r.fear_greed_score}). "
            f"Risk: {r.risk_level}. Stance: {r.stance}."
        )
