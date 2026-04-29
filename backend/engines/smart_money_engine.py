"""Smart Money Engine — detects institutional accumulation, options flow, and insider activity."""

import logging
import time
import json
import os
import hashlib
from dataclasses import dataclass, field, asdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

import yfinance as yf

log = logging.getLogger(__name__)

CACHE_DIR = "cache/smart_money"
CACHE_TTL = 900  # 15 min


def _cache_path(ticker: str) -> str:
    os.makedirs(CACHE_DIR, exist_ok=True)
    return os.path.join(CACHE_DIR, f"{ticker.upper()}.json")


def _load_cache(ticker: str) -> Optional[dict]:
    path = _cache_path(ticker)
    try:
        if not os.path.exists(path):
            return None
        mtime = os.path.getmtime(path)
        if time.time() - mtime > CACHE_TTL:
            return None
        with open(path) as f:
            return json.load(f)
    except Exception:
        return None


def _save_cache(ticker: str, data: dict) -> None:
    try:
        with open(_cache_path(ticker), "w") as f:
            json.dump(data, f)
    except Exception:
        pass


@dataclass
class SmartMoneyResult:
    ticker: str = ""
    name: str = ""
    price: Optional[float] = None
    change_pct: Optional[float] = None
    sector: str = ""
    market_cap: Optional[float] = None

    # Composite score
    smart_money_score: int = 0
    score_label: str = "Weak / Mixed"
    score_color: str = "gray"
    signal_type: str = "Mixed Signals"
    confidence: float = 50.0
    action_tag: str = "Watchlist"

    # Score breakdown (max: inst=30, opts=25, vol=20, insider=15, trend=10)
    inst_score: int = 0
    options_score: int = 0
    volume_score: int = 0
    insider_score: int = 0
    trend_score: int = 0

    # Key metrics
    volume_vs_avg: float = 1.0
    call_put_ratio: Optional[float] = None
    institutional_trend: str = "Stable"
    inst_ownership_pct: Optional[float] = None
    num_inst_holders: Optional[int] = None
    insider_buys_90d: int = 0
    insider_sells_90d: int = 0
    short_interest_pct: Optional[float] = None
    rsi: Optional[float] = None
    above_sma50: Optional[bool] = None
    above_sma200: Optional[bool] = None

    ai_explanation: str = ""
    error: Optional[str] = None


class SmartMoneyEngine:

    def analyze(self, ticker: str) -> SmartMoneyResult:
        cached = _load_cache(ticker)
        if cached:
            return SmartMoneyResult(**{k: v for k, v in cached.items() if k in SmartMoneyResult.__dataclass_fields__})
        result = self._compute(ticker)
        if not result.error:
            _save_cache(ticker, asdict(result))
        return result

    def _compute(self, ticker: str) -> SmartMoneyResult:
        r = SmartMoneyResult(ticker=ticker)
        try:
            t = yf.Ticker(ticker)
            info = t.info or {}

            r.name = info.get("longName") or info.get("shortName") or ticker
            r.price = (
                info.get("currentPrice")
                or info.get("regularMarketPrice")
                or info.get("previousClose")
            )
            prev = info.get("previousClose") or info.get("regularMarketPreviousClose")
            if r.price and prev and prev > 0:
                r.change_pct = round((r.price - prev) / prev * 100, 2)
            r.sector = info.get("sector") or ""
            mc = info.get("marketCap")
            r.market_cap = float(mc) if mc else None

            hist = t.history(period="3mo", interval="1d")

            inst_pts, inst_data = self._institutional_score(info, t)
            opts_pts, opts_data = self._options_score(t, ticker)
            vol_pts, vol_data = self._volume_score(hist)
            ins_pts, ins_data = self._insider_score(t)
            trd_pts, trd_data = self._trend_score(hist)

            r.inst_score = inst_pts
            r.options_score = opts_pts
            r.volume_score = vol_pts
            r.insider_score = ins_pts
            r.trend_score = trd_pts

            for k, v in {**inst_data, **opts_data, **vol_data, **ins_data, **trd_data}.items():
                if hasattr(r, k):
                    setattr(r, k, v)

            r.smart_money_score = min(100, inst_pts + opts_pts + vol_pts + ins_pts + trd_pts)
            r.confidence = min(100.0, float(r.smart_money_score))
            r.score_label, r.score_color = self._label(r.smart_money_score)
            r.signal_type, r.action_tag = self._signal(r)
            r.ai_explanation = self._explain(r)

        except Exception as e:
            log.warning("SmartMoney %s error: %s", ticker, e)
            r.error = str(e)

        return r

    # ── Institutional Score (max 30) ─────────────────────────────────────────

    def _institutional_score(self, info: dict, t) -> tuple[int, dict]:
        pts = 0
        data: dict = {}

        pct_inst = info.get("heldPercentInstitutions")
        data["inst_ownership_pct"] = round(pct_inst * 100, 1) if pct_inst else None
        if pct_inst:
            if pct_inst > 0.75:
                pts += 12
            elif pct_inst > 0.50:
                pts += 8
            elif pct_inst > 0.25:
                pts += 5
            else:
                pts += 2

        try:
            holders = t.institutional_holders
            if holders is not None and not holders.empty:
                num = int(len(holders))
                data["num_inst_holders"] = num
                if num > 200:
                    pts += 10
                elif num > 100:
                    pts += 7
                elif num > 50:
                    pts += 4
                else:
                    pts += 1
                data["institutional_trend"] = (
                    "Rising" if num > 150 else "Stable" if num > 40 else "Limited"
                )
            else:
                data["num_inst_holders"] = None
                data["institutional_trend"] = "Unknown"
        except Exception:
            data["num_inst_holders"] = None
            data["institutional_trend"] = "Unknown"

        short_pct = info.get("shortPercentOfFloat")
        data["short_interest_pct"] = round(float(short_pct) * 100, 1) if short_pct else None
        if short_pct:
            if short_pct > 0.20:
                pts += 5  # Squeeze potential
            elif short_pct < 0.05:
                pts += 3  # Clean / low risk
            else:
                pts += 1

        return min(30, pts), data

    # ── Options Flow Score (max 25) ──────────────────────────────────────────

    def _options_score(self, t, ticker: str) -> tuple[int, dict]:
        pts = 0
        data: dict = {"call_put_ratio": None}
        try:
            exps = t.options
            if not exps:
                return pts, data

            chain = t.option_chain(exps[0])
            calls = chain.calls
            puts = chain.puts

            call_vol = float(calls["volume"].fillna(0).sum()) if not calls.empty else 0.0
            put_vol = float(puts["volume"].fillna(0).sum()) if not puts.empty else 0.0

            if put_vol > 0:
                cp = round(call_vol / put_vol, 2)
            elif call_vol > 0:
                cp = 5.0
            else:
                cp = 1.0

            data["call_put_ratio"] = cp

            if cp >= 3.0:
                pts = 25
            elif cp >= 2.0:
                pts = 18
            elif cp >= 1.5:
                pts = 12
            elif cp >= 1.0:
                pts = 6
            elif cp >= 0.7:
                pts = 3
            else:
                pts = 0

        except Exception as e:
            log.debug("Options %s: %s", ticker, e)

        return min(25, pts), data

    # ── Volume / Accumulation Score (max 20) ─────────────────────────────────

    def _volume_score(self, hist) -> tuple[int, dict]:
        pts = 0
        data: dict = {"volume_vs_avg": 1.0}
        try:
            if hist is None or len(hist) < 5:
                return pts, data

            volumes = hist["Volume"].dropna()
            avg_vol = float(volumes[-20:].mean()) if len(volumes) >= 20 else float(volumes.mean())
            last_vol = float(volumes.iloc[-1])
            ratio = round(last_vol / avg_vol, 2) if avg_vol > 0 else 1.0
            data["volume_vs_avg"] = ratio

            if ratio >= 3.0:
                pts = 20
            elif ratio >= 2.0:
                pts = 15
            elif ratio >= 1.5:
                pts = 10
            elif ratio >= 1.2:
                pts = 6
            else:
                pts = 2

        except Exception as e:
            log.debug("Volume score error: %s", e)

        return min(20, pts), data

    # ── Insider Activity Score (max 15) ──────────────────────────────────────

    def _insider_score(self, t) -> tuple[int, dict]:
        pts = 5  # Neutral default
        data: dict = {"insider_buys_90d": 0, "insider_sells_90d": 0}
        try:
            txns = t.insider_transactions
            if txns is None or txns.empty:
                return pts, data

            sample = txns.head(30)
            buys = 0
            sells = 0
            for _, row in sample.iterrows():
                text = str(row.get("Text", "")).lower()
                if any(w in text for w in ("purchase", "buy", "acquisition", "acquired")):
                    buys += 1
                elif any(w in text for w in ("sale", "sell", "sold", "disposition")):
                    sells += 1

            data["insider_buys_90d"] = buys
            data["insider_sells_90d"] = sells

            net = buys - sells
            if net >= 3:
                pts = 15
            elif net >= 1:
                pts = 10
            elif net == 0:
                pts = 5
            elif net == -1:
                pts = 2
            else:
                pts = 0

        except Exception as e:
            log.debug("Insider score error: %s", e)

        return min(15, pts), data

    # ── Trend / Relative Strength Score (max 10) ─────────────────────────────

    def _trend_score(self, hist) -> tuple[int, dict]:
        pts = 0
        data: dict = {"rsi": None, "above_sma50": None, "above_sma200": None}
        try:
            if hist is None or len(hist) < 15:
                return pts, data

            closes = hist["Close"].dropna()

            # RSI
            delta = closes.diff()
            gain = delta.clip(lower=0).rolling(14).mean()
            loss = (-delta.clip(upper=0)).rolling(14).mean()
            rs = gain / loss.replace(0, float("nan"))
            rsi_series = 100 - 100 / (1 + rs)
            if not rsi_series.dropna().empty:
                rsi = float(rsi_series.dropna().iloc[-1])
                data["rsi"] = round(rsi, 1)
                if 30 <= rsi < 40:
                    pts += 6  # Oversold opportunity
                elif 40 <= rsi < 60:
                    pts += 4  # Building
                elif 60 <= rsi <= 70:
                    pts += 3  # Bullish not overbought
                else:
                    pts += 1

            last_close = float(closes.iloc[-1])

            if len(closes) >= 50:
                sma50 = float(closes[-50:].mean())
                data["above_sma50"] = last_close > sma50
                pts += 2 if data["above_sma50"] else 0

            if len(closes) >= 200:
                sma200 = float(closes[-200:].mean())
                data["above_sma200"] = last_close > sma200
                pts += 2 if data["above_sma200"] else 0

        except Exception as e:
            log.debug("Trend score error: %s", e)

        return min(10, pts), data

    # ── Classification ────────────────────────────────────────────────────────

    def _label(self, score: int) -> tuple[str, str]:
        if score >= 85:
            return "High Conviction", "green"
        elif score >= 70:
            return "Strong Watchlist", "blue"
        elif score >= 55:
            return "Early Setup", "yellow"
        else:
            return "Weak / Mixed", "gray"

    def _signal(self, r: SmartMoneyResult) -> tuple[str, str]:
        cp = r.call_put_ratio or 1.0
        vol = r.volume_vs_avg or 1.0
        buys = r.insider_buys_90d or 0
        sells = r.insider_sells_90d or 0

        if r.options_score >= 18 and r.volume_score >= 10:
            return "Bullish Flow", "Momentum + Flow"
        if buys >= 2 and sells == 0:
            return "Insider Buying", "Possible Accumulation"
        if vol >= 2.0 and r.inst_score >= 15:
            return "Possible Accumulation", "Possible Accumulation"
        if cp >= 2.0:
            return "Bullish Flow", "Bullish Flow"
        if vol >= 1.5 and r.smart_money_score >= 60:
            return "Quiet Buying", "Quiet Buying"
        if r.smart_money_score >= 70:
            return "Smart Money Interest", "Watchlist"
        if r.options_score < 6 and vol < 1.0 and r.inst_score < 10:
            return "Distribution Signals", "Distribution Risk"
        return "Mixed Signals", "Watchlist"

    def _explain(self, r: SmartMoneyResult) -> str:
        name = r.name or r.ticker
        parts = []

        if r.inst_ownership_pct and r.inst_ownership_pct > 50:
            parts.append(f"significant institutional ownership ({r.inst_ownership_pct:.0f}%)")
        if r.call_put_ratio and r.call_put_ratio > 1.5:
            parts.append(f"elevated call activity (C/P ratio: {r.call_put_ratio:.1f})")
        if r.volume_vs_avg and r.volume_vs_avg > 1.5:
            parts.append(f"volume running at {r.volume_vs_avg:.1f}x its 20-day average")
        if r.insider_buys_90d > 0:
            parts.append(f"{r.insider_buys_90d} insider buy transaction(s) in the past 90 days")
        if r.above_sma50:
            parts.append("price holding above its 50-day moving average")
        if r.short_interest_pct and r.short_interest_pct > 15:
            parts.append(f"elevated short interest ({r.short_interest_pct:.0f}%) creating squeeze potential")

        if parts:
            return (
                f"{name} is showing possible smart money signals through {', '.join(parts)}. "
                "Activity worth monitoring — not a guarantee of future price action."
            )
        return (
            f"{name} shows mixed or limited smart money signals at this time. "
            "Monitor for developing accumulation or flow activity."
        )

    # ── Batch Screen ──────────────────────────────────────────────────────────

    def screen(self, filters: dict, tickers: list[str]) -> list[SmartMoneyResult]:
        results = []
        with ThreadPoolExecutor(max_workers=8) as ex:
            futures = {ex.submit(self.analyze, t): t for t in tickers}
            for fut in as_completed(futures):
                try:
                    r = fut.result(timeout=30)
                    if r.error:
                        continue
                    if self._passes(r, filters):
                        results.append(r)
                except Exception:
                    pass
        results.sort(key=lambda x: x.smart_money_score, reverse=True)
        return results

    def _passes(self, r: SmartMoneyResult, f: dict) -> bool:
        if f.get("score_min") and r.smart_money_score < int(f["score_min"]):
            return False
        if f.get("cp_ratio_min"):
            if not r.call_put_ratio or r.call_put_ratio < float(f["cp_ratio_min"]):
                return False
        if f.get("vol_surge_min") and r.volume_vs_avg < float(f["vol_surge_min"]):
            return False
        if f.get("insider_buys_min") and r.insider_buys_90d < int(f["insider_buys_min"]):
            return False
        if f.get("inst_ownership_min"):
            if not r.inst_ownership_pct or r.inst_ownership_pct < float(f["inst_ownership_min"]) * 100:
                return False
        if f.get("above_sma50") and not r.above_sma50:
            return False
        if f.get("rsi_max"):
            if not r.rsi or r.rsi > float(f["rsi_max"]):
                return False
        if f.get("short_interest_min"):
            if not r.short_interest_pct or r.short_interest_pct < float(f["short_interest_min"]) * 100:
                return False
        if f.get("sector") and r.sector != f["sector"]:
            return False
        if f.get("signal_type") and r.signal_type != f["signal_type"]:
            return False
        return True
