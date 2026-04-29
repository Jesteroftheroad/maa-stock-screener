"use client";

import { Radio } from "lucide-react";
import type { DDSentiment } from "@/types";

const HYPE_CONFIG: Record<string, { color: string; pct: number; desc: string }> = {
  Hot:  { color: "#ff4466", pct: 90, desc: "Extremely elevated retail attention" },
  Warm: { color: "#ffcc44", pct: 60, desc: "Above-average social interest" },
  Cool: { color: "#4488ff", pct: 35, desc: "Below-average retail attention" },
  Cold: { color: "#667799", pct: 10, desc: "Minimal retail interest detected" },
};

const BUZZ_CONFIG: Record<string, { color: string; icon: string }> = {
  Rising:  { color: "#00ff88", icon: "↑" },
  Stable:  { color: "#ffcc44", icon: "→" },
  Falling: { color: "#ff4466", icon: "↓" },
};

const SENTIMENT_CONFIG: Record<string, { color: string; label: string }> = {
  Positive: { color: "#00ff88", label: "Positive" },
  Neutral:  { color: "#ffcc44", label: "Neutral" },
  Negative: { color: "#ff4466", label: "Negative" },
};

function HeatGauge({ value, color }: { value: number; color: string }) {
  const r = 28;
  const circ = Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width="76" height="44" viewBox="0 0 76 44">
      <path d="M 10 40 A 28 28 0 0 1 66 40" fill="none" stroke="var(--border)" strokeWidth="6" strokeLinecap="round" />
      <path d="M 10 40 A 28 28 0 0 1 66 40" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} />
    </svg>
  );
}

export function SentimentPanel({ data }: { data: DDSentiment }) {
  const hype = HYPE_CONFIG[data.retail_hype] ?? HYPE_CONFIG.Cool;
  const buzz = BUZZ_CONFIG[data.buzz_trend] ?? BUZZ_CONFIG.Stable;
  const sent = SENTIMENT_CONFIG[data.news_sentiment] ?? SENTIMENT_CONFIG.Neutral;

  return (
    <div className="card p-4 space-y-4 h-full">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(255,204,68,0.15)", color: "#ffcc44" }}>
          <Radio size={13} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Crowd / Street Sentiment</h3>
      </div>

      {/* Retail Hype Meter */}
      <div className="flex flex-col items-center">
        <HeatGauge value={hype.pct} color={hype.color} />
        <div className="text-lg font-black -mt-1" style={{ color: hype.color }}>
          {data.retail_hype}
        </div>
        <div className="text-xs text-center mt-0.5" style={{ color: "var(--muted)" }}>{hype.desc}</div>
      </div>

      {/* Social Buzz */}
      <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--card2)" }}>
        <div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Social Buzz Trend</p>
          <p className="text-sm font-bold" style={{ color: buzz.color }}>{buzz.icon} {data.buzz_trend}</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: "var(--muted)" }}>News Volume</p>
          <p className="text-sm font-mono font-bold" style={{ color: "var(--text)" }}>{data.news_count} articles</p>
        </div>
      </div>

      {/* News Sentiment */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>NEWS TONE ANALYSIS</p>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: sent.color, background: `${sent.color}15` }}>
            {sent.label}
          </span>
        </div>
        <div className="flex gap-2">
          {[
            { label: "Bearish", width: Math.max(5, Math.round((1 - (data.news_score + 1) / 2) * 100)) + "%", color: "#ff4466" },
            { label: "Neutral", width: "20%", color: "#667799" },
            { label: "Bullish", width: Math.max(5, Math.round(((data.news_score + 1) / 2) * 100)) + "%", color: "#00ff88" },
          ].map(({ label, width, color }) => (
            <div key={label} className="flex flex-col items-center" style={{ width }}>
              <div className="w-full h-3 rounded" style={{ background: color, opacity: 0.7 }} />
              <span className="text-xs mt-1" style={{ color: "var(--muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="text-xs rounded-lg p-2.5" style={{ background: "var(--card2)", color: "var(--muted)" }}>
        <span className="font-semibold">Note:</span> Sentiment derived from news headline NLP analysis and volume proxies.
        Social media data requires external API integration.
      </div>
    </div>
  );
}
