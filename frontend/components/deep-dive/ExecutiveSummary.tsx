"use client";

import { TrendingUp, TrendingDown, Minus, Shield, Clock } from "lucide-react";
import { formatPrice, formatMarketCap } from "@/lib/utils";
import type { DeepDiveResult } from "@/types";

const VERDICT_STYLE: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  Bullish: { bg: "rgba(0,255,136,0.08)", border: "rgba(0,255,136,0.3)", text: "#00ff88", glow: "0 0 20px rgba(0,255,136,0.15)" },
  Neutral: { bg: "rgba(255,204,68,0.08)", border: "rgba(255,204,68,0.3)", text: "#ffcc44", glow: "0 0 20px rgba(255,204,68,0.10)" },
  Bearish: { bg: "rgba(255,68,102,0.08)", border: "rgba(255,68,102,0.3)", text: "#ff4466", glow: "0 0 20px rgba(255,68,102,0.15)" },
};

const RISK_COLOR: Record<string, string> = {
  Low: "#00ff88", Medium: "#ffcc44", High: "#ff8844", "Very High": "#ff4466",
};

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: "var(--muted)" }}>{label}</span>
        <span className="font-mono" style={{ color: "var(--text)" }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function ConfidenceRing({ value, color }: { value: number; color: string }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25} transform="rotate(-90 48 48)" />
      <text x="48" y="44" textAnchor="middle" fill={color} fontSize="18" fontWeight="700" fontFamily="monospace">{value}%</text>
      <text x="48" y="58" textAnchor="middle" fill="var(--muted)" fontSize="9" fontFamily="sans-serif">CONFIDENCE</text>
    </svg>
  );
}

export function ExecutiveSummary({ data }: { data: DeepDiveResult }) {
  const vs = VERDICT_STYLE[data.verdict] ?? VERDICT_STYLE.Neutral;
  const VerdictIcon = data.verdict === "Bullish" ? TrendingUp : data.verdict === "Bearish" ? TrendingDown : Minus;
  const riskColor = RISK_COLOR[data.risk_level] ?? "#ffcc44";

  return (
    <div className="card p-5 space-y-5" style={{ border: `1px solid ${vs.border}`, background: vs.bg, boxShadow: vs.glow }}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono font-black text-3xl tracking-tight" style={{ color: "var(--text)" }}>{data.ticker}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border" style={{ color: vs.text, borderColor: vs.border, background: "rgba(0,0,0,0.3)" }}>
              {data.sector}
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{data.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{data.industry} · Cap: {formatMarketCap(data.market_cap)}</p>
        </div>

        <div className="text-right">
          <div className="font-mono font-black text-3xl" style={{ color: vs.text }}>
            {formatPrice(data.price)}
          </div>
          <div className="text-sm font-medium mt-0.5" style={{ color: (data.change_pct ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>
            {(data.change_pct ?? 0) >= 0 ? "+" : ""}{data.change_pct?.toFixed(2)}% today
          </div>
        </div>
      </div>

      {/* Verdict + Confidence */}
      <div className="flex items-center gap-6 flex-wrap">
        {/* Verdict badge */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: vs.border, background: "rgba(0,0,0,0.4)" }}>
          <VerdictIcon size={24} style={{ color: vs.text }} />
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>AI Verdict</div>
            <div className="text-xl font-black" style={{ color: vs.text }}>{data.verdict}</div>
          </div>
        </div>

        <ConfidenceRing value={data.confidence} color={vs.text} />

        {/* Risk badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.3)" }}>
          <Shield size={16} style={{ color: riskColor }} />
          <div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>Risk Level</div>
            <div className="text-sm font-bold" style={{ color: riskColor }}>{data.risk_level}</div>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.3)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: vs.text, color: "#0a0a0f" }}>
            {data.total_score}
          </div>
          <div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>AI Score</div>
            <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{data.ai_score.label}</div>
          </div>
        </div>
      </div>

      {/* Score breakdown bars */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
        <ScoreBar label="Fundamentals" value={data.fundamental_score} max={30} color="#4488ff" />
        <ScoreBar label="Technical" value={data.technical_score} max={30} color="#00ccff" />
        <ScoreBar label="Institutional" value={data.institutional_score} max={20} color="#aa44ff" />
        <ScoreBar label="Sentiment" value={data.sentiment_score} max={10} color="#ffcc44" />
        <ScoreBar label="Macro/Growth" value={data.macro_score} max={10} color="#00ff88" />
      </div>

      {/* Outlooks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        {[
          { icon: "⚡", label: "Short-term (1W)", text: data.short_term_outlook },
          { icon: "📈", label: "Mid-term (1–3M)", text: data.medium_term_outlook },
          { icon: "🎯", label: "Long-term (1Y)", text: data.long_term_outlook },
        ].map(({ icon, label, text }) => (
          <div key={label} className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
              <span>{icon}</span><span>{label}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
