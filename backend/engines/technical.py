"""
Technical Engine — pure price-action analysis.
Adapted from buddy's technical_engine.py. Added get_ma_positions() for fast screener pre-filtering.
"""

import logging
from dataclasses import dataclass, field
import numpy as np
import pandas as pd
from data.fetcher import DataFetcher
import config

log = logging.getLogger(__name__)


@dataclass
class EntryZone:
    zone_low: float | None = None
    zone_high: float | None = None
    condition: str = "WAIT"


@dataclass
class TechnicalResult:
    ticker: str = ""
    trend: str = "SIDEWAYS"
    rsi: float | None = None
    rsi_signal: str = ""
    macd: float | None = None
    macd_signal_line: float | None = None
    macd_crossover: str = "NONE"
    support_levels: list = field(default_factory=list)
    resistance_levels: list = field(default_factory=list)
    volume_signal: str = "NEUTRAL"
    entry_zone: EntryZone = field(default_factory=EntryZone)
    stop_loss: float | None = None
    atr: float | None = None
    momentum: str = "NEUTRAL"
    current_price: float | None = None
    above_sma20: bool | None = None
    above_sma50: bool | None = None
    above_sma200: bool | None = None
    volume_surge_ratio: float | None = None
    data_available: bool = True
    missing_fields: list = field(default_factory=list)


class TechnicalEngine:
    def __init__(self, fetcher: DataFetcher):
        self.fetcher = fetcher

    def get_ma_positions(self, ticker: str) -> dict:
        """Fast check for screener: RSI + MA positions without full analysis."""
        history = self.fetcher.get_price_history(ticker, period="1y", interval="1d")
        if history is None or len(history) < config.SMA_MID:
            return {"rsi": None, "above_sma20": None, "above_sma50": None, "above_sma200": None, "volume_surge": None}

        closes = history["Close"]
        price = float(closes.iloc[-1])

        sma20 = float(closes.rolling(config.SMA_SHORT).mean().iloc[-1]) if len(closes) >= config.SMA_SHORT else None
        sma50 = float(closes.rolling(config.SMA_MID).mean().iloc[-1])
        sma200 = float(closes.rolling(config.SMA_LONG).mean().iloc[-1]) if len(closes) >= config.SMA_LONG else None

        rsi = self._calculate_rsi(closes)

        # Volume surge ratio vs 20-day average
        vol_surge = None
        if "Volume" in history.columns and len(history) >= 20:
            volumes = history["Volume"]
            avg_vol = float(volumes.rolling(20).mean().iloc[-1])
            today_vol = float(volumes.iloc[-1])
            if avg_vol > 0:
                vol_surge = round(today_vol / avg_vol, 2)

        return {
            "rsi": rsi,
            "above_sma20": price > sma20 if sma20 else None,
            "above_sma50": price > sma50,
            "above_sma200": price > sma200 if sma200 else None,
            "volume_surge": vol_surge,
        }

    def analyze(self, ticker: str) -> TechnicalResult:
        result = TechnicalResult(ticker=ticker)

        history = self.fetcher.get_price_history(ticker, period="1y", interval="1d")
        if history is None or len(history) < config.SMA_LONG:
            result.data_available = False
            result.missing_fields.append("price_history")
            return result

        closes = history["Close"]
        result.current_price = float(closes.iloc[-1])

        result.trend = self._get_trend(history)

        result.rsi = self._calculate_rsi(closes)
        if result.rsi is not None:
            result.rsi_signal = self._rsi_signal(result.rsi)
        else:
            result.missing_fields.append("rsi")

        macd_data = self._calculate_macd(closes)
        result.macd = macd_data["macd"]
        result.macd_signal_line = macd_data["signal"]
        result.macd_crossover = macd_data["crossover"]

        sr = self._find_support_resistance(history)
        result.support_levels = sr["support"]
        result.resistance_levels = sr["resistance"]

        result.volume_signal = self._get_volume_signal(history)
        result.atr = self._calculate_atr(history)
        result.entry_zone = self._get_entry_zone(result.current_price, result.support_levels, result.rsi)
        result.stop_loss = self._get_stop_loss(result.current_price, result.support_levels, result.atr)
        result.momentum = self._composite_momentum(result.rsi, result.macd_crossover, result.trend)

        # MA positions
        price = result.current_price
        sma20 = float(closes.rolling(config.SMA_SHORT).mean().iloc[-1])
        sma50 = float(closes.rolling(config.SMA_MID).mean().iloc[-1])
        sma200 = float(closes.rolling(config.SMA_LONG).mean().iloc[-1])
        result.above_sma20 = price > sma20
        result.above_sma50 = price > sma50
        result.above_sma200 = price > sma200

        # Volume surge
        if "Volume" in history.columns:
            volumes = history["Volume"]
            avg_vol = float(volumes.rolling(20).mean().iloc[-1])
            today_vol = float(volumes.iloc[-1])
            result.volume_surge_ratio = round(today_vol / avg_vol, 2) if avg_vol > 0 else None

        return result

    def _calculate_sma(self, prices: pd.Series, window: int) -> pd.Series:
        return prices.rolling(window).mean()

    def _calculate_ema(self, prices: pd.Series, window: int) -> pd.Series:
        return prices.ewm(span=window, adjust=False).mean()

    def _get_trend(self, history: pd.DataFrame) -> str:
        closes = history["Close"]
        if len(closes) < config.SMA_LONG:
            return "SIDEWAYS"
        sma50 = self._calculate_sma(closes, config.SMA_MID).iloc[-1]
        sma200 = self._calculate_sma(closes, config.SMA_LONG).iloc[-1]
        price = closes.iloc[-1]

        if price > sma200 and sma50 > sma200:
            return "UPTREND"
        elif price < sma200 and sma50 < sma200:
            return "DOWNTREND"
        return "SIDEWAYS"

    def _calculate_rsi(self, prices: pd.Series, period: int = None) -> float | None:
        period = period or config.RSI_PERIOD
        if len(prices) < period + 1:
            return None
        try:
            delta = prices.diff()
            gain = delta.clip(lower=0).rolling(period).mean()
            loss = (-delta.clip(upper=0)).rolling(period).mean()
            rs = gain / loss.replace(0, np.nan)
            rsi = 100 - (100 / (1 + rs))
            val = rsi.iloc[-1]
            return round(float(val), 2) if not np.isnan(val) else None
        except Exception as e:
            log.debug(f"RSI calculation error: {e}")
            return None

    def _rsi_signal(self, rsi: float) -> str:
        if rsi >= config.RSI_OVERBOUGHT:
            return "OVERBOUGHT"
        elif rsi <= config.RSI_OVERSOLD:
            return "OVERSOLD"
        elif rsi >= 55:
            return "BULLISH"
        elif rsi <= 45:
            return "BEARISH"
        return "NEUTRAL"

    def _calculate_macd(self, prices: pd.Series) -> dict:
        result = {"macd": None, "signal": None, "histogram": None, "crossover": "NONE"}
        if len(prices) < config.MACD_SLOW + config.MACD_SIGNAL:
            return result
        try:
            ema_fast = self._calculate_ema(prices, config.MACD_FAST)
            ema_slow = self._calculate_ema(prices, config.MACD_SLOW)
            macd_line = ema_fast - ema_slow
            signal_line = self._calculate_ema(macd_line, config.MACD_SIGNAL)
            histogram = macd_line - signal_line

            result["macd"] = round(float(macd_line.iloc[-1]), 4)
            result["signal"] = round(float(signal_line.iloc[-1]), 4)
            result["histogram"] = round(float(histogram.iloc[-1]), 4)

            if len(macd_line) >= 2 and len(signal_line) >= 2:
                prev_diff = macd_line.iloc[-2] - signal_line.iloc[-2]
                curr_diff = macd_line.iloc[-1] - signal_line.iloc[-1]
                if prev_diff < 0 and curr_diff > 0:
                    result["crossover"] = "BULLISH"
                elif prev_diff > 0 and curr_diff < 0:
                    result["crossover"] = "BEARISH"
        except Exception as e:
            log.debug(f"MACD calculation error: {e}")
        return result

    def _find_support_resistance(self, history: pd.DataFrame, lookback: int = 60) -> dict:
        result = {"support": [], "resistance": []}
        try:
            subset = history.tail(lookback)
            highs = subset["High"].values
            lows = subset["Low"].values
            closes = subset["Close"].values

            pivot_highs = []
            pivot_lows = []
            for i in range(2, len(closes) - 2):
                if highs[i] == max(highs[i-2:i+3]):
                    pivot_highs.append(highs[i])
                if lows[i] == min(lows[i-2:i+3]):
                    pivot_lows.append(lows[i])

            current_price = closes[-1]

            def cluster(vals, threshold=0.01):
                clusters = []
                for v in sorted(vals):
                    found = False
                    for c in clusters:
                        if abs(v - c) / c < threshold:
                            found = True
                            break
                    if not found:
                        clusters.append(v)
                return clusters

            if pivot_lows:
                all_lows = cluster(pivot_lows)
                result["support"] = sorted([round(v, 2) for v in all_lows if v < current_price], reverse=True)[:3]
            if pivot_highs:
                all_highs = cluster(pivot_highs)
                result["resistance"] = sorted([round(v, 2) for v in all_highs if v > current_price])[:3]
        except Exception as e:
            log.debug(f"S/R calculation error: {e}")
        return result

    def _get_volume_signal(self, history: pd.DataFrame) -> str:
        try:
            if "Volume" not in history.columns:
                return "NEUTRAL"
            vols = history["Volume"].tail(20)
            avg = vols.mean()
            recent = vols.tail(3).mean()
            closes = history["Close"].tail(5)
            price_direction = closes.iloc[-1] > closes.iloc[0]
            if recent > avg * config.VOLUME_SPIKE_MULTIPLIER:
                return "ACCUMULATION" if price_direction else "DISTRIBUTION"
        except Exception:
            pass
        return "NEUTRAL"

    def _calculate_atr(self, history: pd.DataFrame, period: int = None) -> float | None:
        period = period or config.ATR_PERIOD
        try:
            high = history["High"]
            low = history["Low"]
            close = history["Close"]
            tr = pd.concat([
                high - low,
                (high - close.shift()).abs(),
                (low - close.shift()).abs()
            ], axis=1).max(axis=1)
            atr = tr.rolling(period).mean().iloc[-1]
            return round(float(atr), 4) if not np.isnan(atr) else None
        except Exception:
            return None

    def _get_entry_zone(self, price: float, support_levels: list, rsi: float | None) -> EntryZone:
        zone = EntryZone()
        if not support_levels:
            return zone
        nearest_support = support_levels[0]
        pct_from_support = (price - nearest_support) / nearest_support if nearest_support > 0 else 1

        if pct_from_support < 0.02 and rsi and rsi < 50:
            zone.condition = "STRONG ENTRY"
            zone.zone_low = round(nearest_support * 0.99, 2)
            zone.zone_high = round(nearest_support * 1.02, 2)
        elif pct_from_support < 0.05:
            zone.condition = "POTENTIAL ENTRY"
            zone.zone_low = round(nearest_support * 0.98, 2)
            zone.zone_high = round(nearest_support * 1.03, 2)
        else:
            zone.condition = "WAIT"
        return zone

    def _get_stop_loss(self, price: float, support_levels: list, atr: float | None) -> float | None:
        if support_levels:
            support = support_levels[0]
            stop = round(support * 0.98, 2)
            if stop < price:
                return stop
        if atr:
            return round(price - 2 * atr, 2)
        return round(price * (1 - config.FALLBACK_STOP_LOSS_PCT), 2)

    def _composite_momentum(self, rsi: float | None, macd_crossover: str, trend: str) -> str:
        score = 0
        if rsi is not None:
            if rsi >= 60:
                score += 2
            elif rsi >= 50:
                score += 1
            elif rsi <= 40:
                score -= 1
            elif rsi <= 30:
                score -= 2

        macd_scores = {"BULLISH": 2, "NONE": 0, "BEARISH": -2}
        score += macd_scores.get(macd_crossover, 0)

        trend_scores = {"UPTREND": 1, "SIDEWAYS": 0, "DOWNTREND": -1}
        score += trend_scores.get(trend, 0)

        if score >= 4:
            return "STRONG BULLISH"
        elif score >= 2:
            return "BULLISH"
        elif score <= -4:
            return "STRONG BEARISH"
        elif score <= -2:
            return "BEARISH"
        return "NEUTRAL"
