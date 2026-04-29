"use client";

import { TrendingUp, Minus, TrendingDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { DeepDiveResult } from "@/types";

const SCENARIOS = [
  { key: "bull" as const, label: "Bull Case", Icon: TrendingUp, color: "#00ff88", bg: "rgba(0,255,136,0.06)", border: "rgba(0,255,136,0.2)" },
  { key: "base" as const, label: "Base Case", Icon: Minus,     color: "#4488ff", bg: "rgba(68,136,255,0.06)", border: "rgba(68,136,255,0.2)" },
  { key: "bear" as const, label: "Bear Case", Icon: TrendingDown, color: "#ff4466", bg: "rgba(255,68,102,0.06)", border: "rgba(255,68,102,0.2)" },
];

function ProbArc({ probability, color }: { probability: number; color: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (probability / 100) * circ;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25} transform="rotate(-90 28 28)" />
      <text x="28" y="32" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="monospace">{probability}%</text>
    </svg>
  );
}

export function ScenarioPanel({ data }: { data: DeepDiveResult }) {
  return (
    <div className="card p-4 space-y-4 h-full">
      <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
        🎲 AI Scenario Forecast
      </h3>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Price targets based on analyst consensus + fundamental momentum + technical structure.
      </p>

      <div className="space-y-3">
        {SCENARIOS.map(({ key, label, Icon, color, bg, border }) => {
          const s = data.scenarios[key];
          return (
            <div key={key} className="rounded-xl p-3 border" style={{ background: bg, borderColor: border }}>
              <div className="flex items-start gap-3">
                <ProbArc probability={s.probability} color={color} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon size={12} style={{ color }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
                  </div>
                  <div className="font-mono font-black text-xl" style={{ color }}>{formatPrice(s.target)}</div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text)" }}>{s.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs rounded-lg p-2.5" style={{ background: "var(--card2)", color: "var(--muted)" }}>
        Probabilities are model estimates, not guarantees. Past performance does not predict future returns.
      </div>
    </div>
  );
}
