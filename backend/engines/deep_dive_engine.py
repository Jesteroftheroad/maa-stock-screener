"""AI Deep Dive Engine — hedge-fund style intelligence for any ticker."""

import logging
import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

import numpy as np
import pandas as pd
import yfinance as yf

from data.fetcher import DataFetcher
from engines.fundamental import FundamentalEngine
from engines.technical import TechnicalEngine
from engines.scorer import AIScorer

log = logging.getLogger(__name__)

_POSITIVE = {
    "upgrade", "upgraded", "beat", "beats", "surpass", "record", "strong",
    "bullish", "outperform", "overweight", "raise", "raised", "growth",
    "profit", "buy", "positive", "gains", "momentum", "breakout", "rally",
    "boom", "wins", "win", "boost", "jump", "soar", "surge",
}
_NEGATIVE = {
    "downgrade", "downgraded", "miss", "misses", "weak", "bearish",
    "underperform", "underweight", "cut", "cuts", "decline", "loss",
    "layoff", "layoffs", "disappoint", "disappointing", "warning",
    "risk", "concern", "selloff", "crash", "fail", "fraud", "probe",
    "investigation", "recall", "debt", "bankruptcy",
}


def _score_headline(title: str) -> float:
    words = set(title.lower().split())
    pos = len(words & _POSITIVE)
    neg = len(words & _NEGATIVE)
    total = pos + neg
    return (pos - neg) / total if total else 0.0


class DeepDiveEngine:
    def __init__(self, fetcher: DataFetcher):
        self._fetcher = fetcher
        self._fund_engine = FundamentalEngine(fetcher)
        self._tech_engine = TechnicalEngine(fetcher)
        self._scorer = AIScorer()

    def analyze(self, ticker: str) -> dict:
        ticker = ticker.upper()
        t = yf.Ticker(ticker)
        info = self._fetcher.get_ticker_info(ticker) or {}

        price = (
            info.get("currentPrice") or
            info.get("regularMarketPrice") or
            info.get("previousClose") or 0
        )
        prev = info.get("regularMarketPreviousClose") or info.get("previousClose") or price
        change_pct = round((price - prev) / prev * 100, 2) if prev and prev > 0 and price else 0

        name = info.get("longName") or info.get("shortName") or ticker
        sector = info.get("sector", "Unknown")

        fund = self._fund_engine.analyze(ticker)
        tech = self._tech_engine.analyze(ticker)
        ai = self._scorer.score(fund, tech, info)

        institutional = self._get_institutional(t, info)
        analyst = self._get_analyst(t, info, float(price or 0))
        sentiment = self._get_sentiment(t)

        # Component scores (out of: fund=30, tech=30, inst=20, sent=10, macro=10)
        inst_s = self._institutional_score(institutional)
        sent_s = self._sentiment_score(sentiment, analyst)
        macro_s = min(10, max(0, ai.growth // 2))
        total = min(100, max(0, ai.fundamentals + ai.technical + inst_s + sent_s + macro_s))

        verdict, confidence = self._verdict(total, tech, fund)
        risk_level = self._risk_level(info, fund, institutional)

        rsi = tech.rsi or 50
        trend = tech.trend or "SIDEWAYS"

        scenarios = self._scenarios(float(price or 0), fund, analyst, verdict)
        trade = self._trade_setup(float(price or 0), tech, scenarios)
        red_flags = self._red_flags(info, fund, tech, institutional)
        explanation = self._explain(verdict, fund, tech, institutional, analyst, ai)

        return {
            "ticker": ticker,
            "name": name,
            "sector": sector,
            "industry": info.get("industry", ""),
            "price": round(float(price), 2) if price else None,
            "change_pct": change_pct,
            "market_cap": info.get("marketCap"),

            "verdict": verdict,
            "confidence": confidence,
            "risk_level": risk_level,
            "short_term_outlook": self._outlook_short(trend, rsi, tech),
            "medium_term_outlook": self._outlook_medium(verdict, fund, tech),
            "long_term_outlook": self._outlook_long(ai, fund, sector),

            "fundamental_score": ai.fundamentals,
            "technical_score": ai.technical,
            "institutional_score": inst_s,
            "sentiment_score": sent_s,
            "macro_score": macro_s,
            "total_score": total,

            "institutional": institutional,
            "analyst": analyst,
            "sentiment": sentiment,

            "rsi": round(rsi, 1),
            "trend": trend,
            "macd_signal": tech.macd_crossover or "NONE",
            "support": (tech.support_levels or [])[:3],
            "resistance": (tech.resistance_levels or [])[:3],
            "above_sma50": tech.above_sma50,
            "above_sma200": tech.above_sma200,
            "breakout_prob": self._breakout_prob(tech, rsi),
            "bounce_prob": self._bounce_prob(tech, rsi),
            "breakdown_risk": self._breakdown_risk(tech, rsi),
            "volume_surge": round(tech.volume_surge_ratio or 1.0, 2),
            "atr": tech.atr,

            "scenarios": scenarios,
            "trade_setup": trade,
            "red_flags": red_flags,
            "ai_explanation": explanation,
            "ai_score": {
                "total": ai.total,
                "label": ai.label,
                "label_color": ai.label_color,
                "breakdown": {
                    "fundamentals": ai.fundamentals,
                    "technical": ai.technical,
                    "growth": ai.growth,
                    "sentiment": ai.sentiment,
                    "risk": ai.risk,
                },
                "bull_case": ai.bull_case,
                "bear_case": ai.bear_case,
                "fair_value": ai.fair_value,
            },
        }

    # ─── Institutional ────────────────────────────────────────────────────────

    def _get_institutional(self, t: yf.Ticker, info: dict) -> dict:
        ownership_pct = round((info.get("institutionPctHeld") or 0) * 100, 1)
        short_pct = round((info.get("shortPercentOfFloat") or 0) * 100, 1)
        short_ratio = round(info.get("shortRatio") or 0, 1)

        insider_net = "Neutral"
        bought = 0
        sold = 0
        top_holders: list = []

        try:
            raw = t.insider_transactions
            if raw is not None and not raw.empty:
                cutoff = datetime.now() - timedelta(days=90)
                date_col = next((c for c in raw.columns if "date" in c.lower() or "start" in c.lower()), None)
                recent = raw
                if date_col:
                    recent = raw[pd.to_datetime(raw[date_col], errors="coerce") > cutoff]
                for _, row in recent.iterrows():
                    shares = row.get("shares", 0) or 0
                    try:
                        shares = int(float(str(shares).replace(",", "") or 0))
                    except Exception:
                        shares = 0
                    txt = str(row.get("text", "")) + str(row.get("transaction", ""))
                    if "Sale" in txt or shares < 0:
                        sold += abs(shares)
                    elif "Purchase" in txt or "Buy" in txt or shares > 0:
                        bought += abs(shares)
                if bought > sold * 1.5:
                    insider_net = "Buying"
                elif sold > bought * 1.5:
                    insider_net = "Selling"
        except Exception as e:
            log.debug(f"Insider error for {t.ticker}: {e}")

        try:
            holders = t.institutional_holders
            if holders is not None and not holders.empty:
                name_col = next((c for c in holders.columns if "holder" in c.lower()), None)
                pct_col = next((c for c in holders.columns if "pct" in c.lower() or "%" in c.lower()), None)
                shr_col = next((c for c in holders.columns if "share" in c.lower()), None)
                for _, row in holders.head(5).iterrows():
                    top_holders.append({
                        "name": str(row[name_col]) if name_col else "—",
                        "pct": round(float(row[pct_col] or 0) * 100, 2) if pct_col else 0,
                        "shares": int(row[shr_col] or 0) if shr_col else 0,
                    })
        except Exception as e:
            log.debug(f"Holders error: {e}")

        options_signal = "Neutral"
        put_call_ratio = 1.0
        try:
            expiries = t.options
            if expiries:
                chain = t.option_chain(expiries[0])
                calls_vol = chain.calls["volume"].fillna(0).sum()
                puts_vol = chain.puts["volume"].fillna(0).sum()
                if calls_vol > 0:
                    put_call_ratio = round(puts_vol / calls_vol, 2)
                if put_call_ratio < 0.7:
                    options_signal = "Bullish"
                elif put_call_ratio > 1.2:
                    options_signal = "Bearish"
        except Exception as e:
            log.debug(f"Options error: {e}")

        # Short trend: compare short_pct to historical — proxy via short_ratio direction
        short_trend = "Stable"
        if short_pct > 15:
            short_trend = "Elevated"
        elif short_pct < 3:
            short_trend = "Low"

        return {
            "ownership_pct": ownership_pct,
            "top_holders": top_holders,
            "insider_net": insider_net,
            "insider_3m_bought": bought,
            "insider_3m_sold": sold,
            "short_pct": short_pct,
            "short_ratio": short_ratio,
            "short_trend": short_trend,
            "options_signal": options_signal,
            "put_call_ratio": put_call_ratio,
        }

    def _institutional_score(self, inst: dict) -> int:
        s = 0
        pct = inst.get("ownership_pct", 0)
        if pct > 70:
            s += 5
        elif pct > 50:
            s += 3

        if inst.get("insider_net") == "Buying":
            s += 7
        elif inst.get("insider_net") == "Neutral":
            s += 3

        short_pct = inst.get("short_pct", 0)
        if short_pct < 3:
            s += 5
        elif short_pct < 8:
            s += 3
        elif short_pct > 20:
            s -= 5

        if inst.get("options_signal") == "Bullish":
            s += 3
        elif inst.get("options_signal") == "Bearish":
            s -= 2

        return max(0, min(20, s))

    # ─── Analyst ──────────────────────────────────────────────────────────────

    def _get_analyst(self, t: yf.Ticker, info: dict, price: float) -> dict:
        avg_rating = float(info.get("recommendationMean") or 3.0)
        num_analysts = int(info.get("numberOfAnalystOpinions") or 0)
        target_avg = float(info.get("targetMeanPrice") or price or 0)
        target_high = float(info.get("targetHighPrice") or price or 0)
        target_low = float(info.get("targetLowPrice") or price or 0)
        upside = round((target_avg - price) / price * 100, 1) if price > 0 else 0

        thresholds = [(1.5, "Strong Buy"), (2.2, "Buy"), (2.8, "Moderate Buy"),
                      (3.2, "Hold"), (3.8, "Moderate Sell"), (5.1, "Sell")]
        rating_label = "Hold"
        for threshold, label in thresholds:
            if avg_rating < threshold:
                rating_label = label
                break

        strong_buy = buy = hold = sell = strong_sell = 0
        try:
            summary = t.recommendations_summary
            if summary is not None and not summary.empty:
                row = summary.iloc[0]
                strong_buy = int(row.get("strongBuy", 0) or 0)
                buy = int(row.get("buy", 0) or 0)
                hold = int(row.get("hold", 0) or 0)
                sell = int(row.get("sell", 0) or 0)
                strong_sell = int(row.get("strongSell", 0) or 0)
        except Exception as e:
            log.debug(f"Recommendations summary error: {e}")

        upgrades: list = []
        downgrades: list = []
        try:
            rec = t.upgrades_downgrades
            if rec is not None and not rec.empty:
                rec = rec.reset_index()
                date_col = next((c for c in rec.columns if "date" in c.lower()), None)
                cutoff = datetime.now() - timedelta(days=90)
                recent = rec
                if date_col:
                    recent = rec[pd.to_datetime(rec[date_col], errors="coerce") > cutoff].head(12)
                for _, row in recent.iterrows():
                    action = str(row.get("Action", "")).lower()
                    to_grade = str(row.get("ToGrade", ""))
                    entry = {
                        "firm": str(row.get("Firm", "—")),
                        "from": str(row.get("FromGrade", "—")),
                        "to": to_grade,
                        "date": str(row.get(date_col, ""))[:10] if date_col else "",
                    }
                    if "up" in action or "init" in action:
                        upgrades.append(entry)
                    elif "down" in action:
                        downgrades.append(entry)
        except Exception as e:
            log.debug(f"Upgrades/downgrades error: {e}")

        return {
            "avg_rating": round(avg_rating, 2),
            "rating_label": rating_label,
            "num_analysts": num_analysts,
            "strong_buy": strong_buy,
            "buy": buy,
            "hold": hold,
            "sell": sell,
            "strong_sell": strong_sell,
            "target_avg": round(target_avg, 2),
            "target_high": round(target_high, 2),
            "target_low": round(target_low, 2),
            "upside_pct": upside,
            "recent_upgrades": upgrades[:3],
            "recent_downgrades": downgrades[:3],
        }

    # ─── Sentiment ────────────────────────────────────────────────────────────

    def _get_sentiment(self, t: yf.Ticker) -> dict:
        news = []
        try:
            news = t.news or []
        except Exception:
            pass

        scores = [_score_headline(item.get("title", "")) for item in news[:20]]
        avg = sum(scores) / len(scores) if scores else 0

        if avg > 0.2:
            label = "Positive"
        elif avg < -0.2:
            label = "Negative"
        else:
            label = "Neutral"

        count = len(news)
        if count >= 15:
            hype, buzz = "Hot", "Rising"
        elif count >= 8:
            hype, buzz = "Warm", "Stable"
        elif count >= 3:
            hype, buzz = "Cool", "Stable"
        else:
            hype, buzz = "Cold", "Falling"

        return {
            "news_sentiment": label,
            "news_score": round(avg, 3),
            "news_count": count,
            "buzz_trend": buzz,
            "retail_hype": hype,
        }

    def _sentiment_score(self, sentiment: dict, analyst: dict) -> int:
        s = 0
        ns = sentiment.get("news_score", 0)
        if ns > 0.3:
            s += 4
        elif ns > 0:
            s += 2
        elif ns < -0.3:
            s -= 2
        avg = analyst.get("avg_rating", 3)
        if avg <= 1.5:
            s += 4
        elif avg <= 2.5:
            s += 2
        elif avg >= 4:
            s -= 2
        if sentiment.get("retail_hype") == "Hot":
            s += 2
        elif sentiment.get("retail_hype") == "Warm":
            s += 1
        return max(0, min(10, s))

    # ─── Verdicts & Risk ──────────────────────────────────────────────────────

    def _verdict(self, total: int, tech, fund) -> tuple[str, int]:
        if total >= 68:
            verdict = "Bullish"
            confidence = min(95, 62 + (total - 68))
        elif total >= 45:
            verdict = "Neutral"
            mid = 56
            confidence = max(40, 58 - abs(total - mid) * 2)
        else:
            verdict = "Bearish"
            confidence = min(95, 62 + (45 - total))
        return verdict, int(confidence)

    def _risk_level(self, info: dict, fund, inst: dict) -> str:
        beta = info.get("beta") or (fund.beta if fund else None) or 1.0
        score = 0
        if beta > 2.0:
            score += 3
        elif beta > 1.5:
            score += 2
        elif beta > 1.0:
            score += 1
        if inst.get("short_pct", 0) > 15:
            score += 2
        elif inst.get("short_pct", 0) > 8:
            score += 1
        de = (fund.debt_to_equity if fund else None) or 0
        if de > 2.0:
            score += 2
        elif de > 1.0:
            score += 1
        return ["Low", "Medium", "High", "Very High"][min(3, score // 2)]

    # ─── Outlooks ─────────────────────────────────────────────────────────────

    def _outlook_short(self, trend: str, rsi: float, tech) -> str:
        if trend == "UPTREND":
            if rsi > 70:
                return "Overbought — expect a brief consolidation before next leg"
            if rsi > 55:
                return "Momentum intact — continuation likely in the near-term"
            return "Healthy RSI with uptrend — watch for acceleration"
        if trend == "DOWNTREND":
            if rsi < 30:
                return "Deeply oversold — dead-cat bounce possible; trend still down"
            return "Downtrend intact — avoid catching the falling knife"
        return "Range-bound — wait for a directional break with volume"

    def _outlook_medium(self, verdict: str, fund, tech) -> str:
        rv = round((fund.revenue_growth or 0) * 100, 1) if fund else 0
        if verdict == "Bullish":
            if rv > 15:
                return f"Strong growth ({rv}% revenue) supports 1–3 month trend continuation"
            return "Fundamental tailwinds support medium-term upside thesis"
        if verdict == "Bearish":
            return "Fundamental or technical headwinds warrant caution 1–3 months out"
        return "Mixed signals — consolidation likely before a clear directional move"

    def _outlook_long(self, ai, fund, sector: str) -> str:
        if ai.total >= 70:
            return f"High conviction long-term — strong {sector} fundamentals support a multi-year thesis"
        if ai.total >= 50:
            return f"Moderate long-term potential — monitor earnings revisions and sector rotation"
        return "Long-term risk elevated — requires meaningful fundamental improvement"

    # ─── Probabilities ────────────────────────────────────────────────────────

    def _breakout_prob(self, tech, rsi: float) -> int:
        s = 40
        if tech.trend == "UPTREND":
            s += 20
        elif tech.trend == "DOWNTREND":
            s -= 15
        if 50 < rsi < 65:
            s += 15
        elif rsi > 70:
            s -= 10
        if tech.above_sma50:
            s += 8
        if tech.above_sma200:
            s += 7
        if tech.macd_crossover == "BULLISH":
            s += 10
        return max(5, min(90, s))

    def _bounce_prob(self, tech, rsi: float) -> int:
        s = 35
        if rsi < 30:
            s += 30
        elif rsi < 40:
            s += 15
        elif rsi > 70:
            s -= 10
        if tech.trend == "UPTREND":
            s += 10
        return max(5, min(80, s))

    def _breakdown_risk(self, tech, rsi: float) -> int:
        s = 25
        if tech.trend == "DOWNTREND":
            s += 30
        if rsi > 70:
            s += 15
        elif rsi < 30:
            s -= 10
        if not tech.above_sma50:
            s += 10
        if not tech.above_sma200:
            s += 10
        return max(5, min(85, s))

    # ─── Scenarios ────────────────────────────────────────────────────────────

    def _scenarios(self, price: float, fund, analyst: dict, verdict: str) -> dict:
        tgt_avg = analyst.get("target_avg") or price
        tgt_high = analyst.get("target_high") or price * 1.20
        tgt_low = analyst.get("target_low") or price * 0.85

        rev = round((fund.revenue_growth or 0.05) * 100, 1) if fund else 5
        bull_mult = max(0.10, min(0.50, rev / 100 * 2.5))
        bull_t = round(max(tgt_avg * 1.05, price * (1 + bull_mult)), 2)
        base_t = round(max(tgt_avg, price * 1.04), 2)
        bear_t = round(min(tgt_low, price * 0.84), 2)

        if verdict == "Bullish":
            p = (40, 40, 20)
        elif verdict == "Bearish":
            p = (20, 35, 45)
        else:
            p = (30, 45, 25)

        return {
            "bull": {"target": bull_t, "probability": p[0],
                     "description": f"Strong earnings beat + sector tailwinds → ${bull_t:,.2f}"},
            "base": {"target": base_t, "probability": p[1],
                     "description": f"Consensus scenario — gradual grind toward ${base_t:,.2f}"},
            "bear": {"target": bear_t, "probability": p[2],
                     "description": f"Macro headwinds or weak guidance → ${bear_t:,.2f}"},
        }

    # ─── Trade Setup ──────────────────────────────────────────────────────────

    def _trade_setup(self, price: float, tech, scenarios: dict) -> dict:
        support = tech.support_levels or []
        resistance = tech.resistance_levels or []
        atr = tech.atr or price * 0.025

        entry = round(support[0] if support else price * 0.97, 2)
        target = round(resistance[0] if resistance else price * 1.06, 2)
        swing_stop = round(entry * 0.97, 2)

        dip_low = support[1] if len(support) > 1 else round(price * 0.93, 2)
        dip_zone = f"${round(dip_low, 2):,.2f} – ${round(entry, 2):,.2f}"

        if resistance:
            momentum_entry = f"Confirmed break above ${resistance[0]:,.2f} with above-avg volume"
        else:
            momentum_entry = f"Confirmed break above ${round(price * 1.03, 2):,.2f} with above-avg volume"

        stop_loss = round(price - 2.0 * atr, 2)

        # Round strikes to nearest $5
        cc_strike = round(price * 1.05 / 5) * 5
        csp_strike = round(price * 0.95 / 5) * 5
        est_cc = round(price * 0.018, 2)
        est_csp = round(price * 0.014, 2)

        return {
            "swing_entry": entry,
            "swing_target": target,
            "swing_stop": swing_stop,
            "dip_zone": dip_zone,
            "momentum_entry": momentum_entry,
            "stop_loss": stop_loss,
            "covered_call_strike": cc_strike,
            "covered_call_premium": f"~${est_cc}/share est.",
            "csp_strike": csp_strike,
            "csp_premium": f"~${est_csp}/share est.",
        }

    # ─── Red Flags ────────────────────────────────────────────────────────────

    def _red_flags(self, info: dict, fund, tech, inst: dict) -> list:
        flags = []
        de = (fund.debt_to_equity if fund else None) or 0
        if de > 3.0:
            flags.append(f"Extreme leverage: D/E ratio {de:.1f}x — balance sheet risk")
        elif de > 1.5:
            flags.append(f"Elevated debt: D/E ratio {de:.1f}x — watch cash flow coverage")

        if inst.get("insider_net") == "Selling":
            sold = inst.get("insider_3m_sold", 0)
            flags.append(f"Insider selling: {sold:,} shares sold in last 90 days")

        pe = fund.pe if fund else None
        if pe and pe > 80:
            flags.append(f"Extreme valuation: P/E {pe:.0f}x — priced for perfection")
        elif pe and pe > 50:
            flags.append(f"Elevated P/E: {pe:.0f}x — limited margin of safety")

        eps = (fund.eps_growth or 0) if fund else 0
        if eps < -0.15:
            flags.append(f"EPS declining {abs(eps*100):.1f}% YoY — earnings deterioration")

        rev = (fund.revenue_growth or 0) if fund else 0
        if rev < -0.05:
            flags.append(f"Revenue shrinking {abs(rev*100):.1f}% YoY — top-line headwind")

        sp = inst.get("short_pct", 0)
        if sp > 20:
            flags.append(f"Very high short interest: {sp:.1f}% of float — heavy bearish bets")
        elif sp > 12:
            flags.append(f"Elevated short interest: {sp:.1f}% of float")

        if tech.trend == "DOWNTREND" and (tech.rsi or 50) > 55:
            flags.append("Downtrend with elevated RSI — momentum fading, watch for flush")

        mos = (fund.margin_of_safety or 0) if fund else 0
        if mos < -0.5:
            flags.append(f"Trading {abs(mos*100):.0f}% above Graham intrinsic value")

        return flags

    # ─── AI Explanation ───────────────────────────────────────────────────────

    def _explain(self, verdict: str, fund, tech, inst: dict, analyst: dict, ai) -> str:
        lines = []
        rv = round((fund.revenue_growth or 0) * 100, 1) if fund else 0
        pe = fund.pe if fund else None
        roe = round((fund.roe or 0) * 100, 1) if fund else 0

        if verdict == "Bullish":
            lines.append("The AI is constructive on this stock.")
        elif verdict == "Bearish":
            lines.append("The AI is cautious on this stock.")
        else:
            lines.append("The AI sees a balanced risk/reward profile.")

        if pe and pe < 18:
            lines.append(f"Valuation is compelling at {pe:.1f}x earnings relative to peers.")
        elif pe and pe > 50:
            lines.append(f"Valuation at {pe:.1f}x earnings is stretched, leaving little room for error.")

        if rv > 15:
            lines.append(f"Revenue is growing at {rv}%, signaling strong business momentum.")
        elif rv < 0:
            lines.append(f"Revenue is contracting {abs(rv)}% YoY — a fundamental headwind to watch.")

        if roe > 20:
            lines.append(f"ROE of {roe}% reflects excellent capital efficiency.")

        rsi = tech.rsi or 50
        trend = tech.trend or "SIDEWAYS"
        if trend == "UPTREND" and 40 < rsi < 70:
            lines.append("The technical picture is bullish with RSI in a healthy range.")
        elif trend == "DOWNTREND":
            lines.append("Price action is bearish — selling pressure remains intact.")

        if inst.get("insider_net") == "Buying":
            bought = inst.get("insider_3m_bought", 0)
            lines.append(f"Insiders bought {bought:,} shares recently — a strong alignment signal.")
        own = inst.get("ownership_pct", 0)
        if own > 65:
            lines.append(f"Institutional ownership at {own}% shows deep smart-money conviction.")

        upside = analyst.get("upside_pct", 0)
        n = analyst.get("num_analysts", 0)
        if upside > 15 and n >= 3:
            lines.append(f"Wall Street consensus implies {upside}% upside with {n} analysts covering.")
        elif upside < -10:
            lines.append(f"Analyst price targets suggest {abs(upside)}% downside — caution warranted.")

        return " ".join(lines)
