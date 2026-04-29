"use client";

import { TrendingUp, TrendingDown, Target } from "lucide-react";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { formatPrice } from "@/lib/utils";
import type { AIScoreData } from "@/types";

interface AIAnalysisPanelProps {
  data: AIScoreData;
}

function BreakdownBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span style={{ color: "var(--muted)" }}>{label}</span>
        <span className="font-mono font-medium" style={{ color: "var(--text)" }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function AIAnalysisPanel({ data }: AIAnalysisPanelProps) {
  const scoreColor =
    data.total >= 70 ? "#00ff88" :
    data.total >= 50 ? "#ffcc44" :
    data.total >= 30 ? "#ff8844" : "#ff4466";

  return (
    <div className="card p-5 space-y-5">
      {/* Score header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>AI Analysis</h3>
        <ScoreBadge score={data.total} label={data.label} size="lg" />
      </div>

      {/* Score ring */}
      <div className="flex items-center gap-4">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="28" fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="36" cy="36" r="28"
            fill="none"
            stroke={scoreColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(data.total / 100) * 175.9} 175.9`}
            strokeDashoffset="44"
            transform="rotate(-90 36 36)"
          />
          <text x="36" y="40" textAnchor="middle" fill={scoreColor} fontSize="16" fontWeight="700" fontFamily="monospace">
            {data.total}
          </text>
        </svg>

        <div className="flex-1 space-y-1">
          <BreakdownBar label="Fundamentals" value={data.breakdown.fundamentals} max={30} color="#4488ff" />
          <BreakdownBar label="Technical"    value={data.breakdown.technical}    max={30} color="#00ccff" />
          <BreakdownBar label="Growth"       value={data.breakdown.growth}       max={20} color="#00ff88" />
          <BreakdownBar label="Sentiment"    value={data.breakdown.sentiment}    max={10} color="#ffcc44" />
          <BreakdownBar label="Risk"         value={data.breakdown.risk}         max={10} color="#aa44ff" />
        </div>
      </div>

      {/* Fair value */}
      {data.fair_value && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--card2)" }}>
          <Target size={14} style={{ color: "var(--muted)" }} />
          <span className="text-xs" style={{ color: "var(--muted)" }}>Graham Fair Value:</span>
          <span className="text-sm font-mono font-bold" style={{ color: "var(--text)" }}>
            {formatPrice(data.fair_value)}
          </span>
        </div>
      )}

      {/* Bull case */}
      <div className="rounded-lg p-3 border border-green-500/20 bg-green-500/5">
        <div className="flex items-center gap-1.5 text-xs font-semibold mb-1 text-green-400">
          <TrendingUp size={12} /> BULL CASE
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{data.bull_case}</p>
      </div>

      {/* Bear case */}
      <div className="rounded-lg p-3 border border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-1.5 text-xs font-semibold mb-1 text-red-400">
          <TrendingDown size={12} /> BEAR CASE
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{data.bear_case}</p>
      </div>
    </div>
  );
}
