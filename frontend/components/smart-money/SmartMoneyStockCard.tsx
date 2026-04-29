"use client";

import { useEffect } from "react";
import { X, TrendingUp, Users, Volume2, BarChart2, Brain, AlertTriangle } from "lucide-react";
import type { SmartMoneyResult } from "@/types";

interface Props {
  result: SmartMoneyResult;
  onClose: () => void;
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted)" }}>
        <span>{label}</span>
        <span className={`font-semibold ${color}`}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Ring({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  const strokeColor =
    color === "green" ? "#10b981" :
    color === "blue"  ? "#3b82f6" :
    color === "yellow"? "#eab308" :
                        "#6b7280";

  return (
    <div className="relative flex flex-col items-center">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke={strokeColor} strokeWidth="6"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
              fontSize="18" fontWeight="700" fill={strokeColor}>
          {score}
        </text>
      </svg>
      <span className={`text-xs font-semibold -mt-1 ${
        color === "green" ? "text-emerald-400" :
        color === "blue"  ? "text-blue-400" :
        color === "yellow"? "text-yellow-400" : "text-gray-400"
      }`}>{label}</span>
    </div>
  );
}

const ACTION_TAG_COLORS: Record<string, string> = {
  "Possible Accumulation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Bullish Flow":          "bg-green-500/20 text-green-400 border-green-500/30",
  "Quiet Buying":          "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "Momentum + Flow":       "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Insider Buying":        "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Distribution Risk":     "bg-red-500/20 text-red-400 border-red-500/30",
  "Watchlist":             "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export function SmartMoneyStockCard({ result: r, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const tagCls = ACTION_TAG_COLORS[r.action_tag] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";
  const pct = r.change_pct ?? 0;
  const pctColor = pct >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto border-l"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between p-4 border-b"
             style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: "var(--text)" }}>{r.ticker}</span>
              <span className={`text-sm font-semibold ${pctColor}`}>
                {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
              </span>
            </div>
            <div className="text-sm mt-0.5 truncate max-w-[280px]" style={{ color: "var(--muted)" }}>{r.name}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-medium ${tagCls}`}>
                {r.action_tag}
              </span>
              {r.sector && (
                <span className="text-xs" style={{ color: "var(--muted)" }}>{r.sector}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            style={{ color: "var(--muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-5">

          {/* Score overview */}
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Smart Money Score
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{r.signal_type}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{r.smart_money_score}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Confidence: {r.confidence.toFixed(0)}%</p>
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <Ring score={r.smart_money_score} label={r.score_label} color={r.score_color} />
            </div>

            <div className="space-y-3">
              <ScoreBar label="Institutional" value={r.inst_score}    max={30} color="text-blue-400" />
              <ScoreBar label="Options Flow"  value={r.options_score} max={25} color="text-emerald-400" />
              <ScoreBar label="Accumulation"  value={r.volume_score}  max={20} color="text-purple-400" />
              <ScoreBar label="Insider"       value={r.insider_score} max={15} color="text-yellow-400" />
              <ScoreBar label="Trend / RS"    value={r.trend_score}   max={10} color="text-cyan-400" />
            </div>
          </div>

          {/* Institutional */}
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Institutional</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCell label="Ownership" value={r.inst_ownership_pct != null ? `${r.inst_ownership_pct.toFixed(0)}%` : "—"} />
              <MetricCell label="# Holders" value={r.num_inst_holders?.toString() ?? "—"} />
              <MetricCell label="Inst. Trend" value={r.institutional_trend}
                color={r.institutional_trend === "Rising" ? "text-emerald-400" : r.institutional_trend === "Stable" ? "text-blue-400" : "text-gray-400"} />
              <MetricCell label="Short Interest" value={r.short_interest_pct != null ? `${r.short_interest_pct.toFixed(1)}%` : "—"}
                color={r.short_interest_pct && r.short_interest_pct > 15 ? "text-yellow-400" : undefined} />
            </div>
          </div>

          {/* Options flow */}
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Options Flow</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCell
                label="Call/Put Ratio"
                value={r.call_put_ratio != null ? r.call_put_ratio.toFixed(2) : "—"}
                color={r.call_put_ratio && r.call_put_ratio >= 2 ? "text-emerald-400" : r.call_put_ratio && r.call_put_ratio >= 1 ? "text-yellow-400" : "text-red-400"}
              />
              <MetricCell
                label="Sentiment"
                value={r.call_put_ratio && r.call_put_ratio >= 2 ? "Bullish" : r.call_put_ratio && r.call_put_ratio >= 1 ? "Neutral" : "Bearish"}
                color={r.call_put_ratio && r.call_put_ratio >= 2 ? "text-emerald-400" : r.call_put_ratio && r.call_put_ratio >= 1 ? "text-yellow-400" : "text-red-400"}
              />
            </div>
            {r.call_put_ratio && r.call_put_ratio >= 1.5 && (
              <p className="text-xs p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Elevated call activity suggests possible bullish positioning. Not confirmation of direction.
              </p>
            )}
          </div>

          {/* Volume / Accumulation */}
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Volume2 size={14} className="text-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Volume & Accumulation</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCell
                label="Volume vs Avg"
                value={`${r.volume_vs_avg.toFixed(1)}×`}
                color={r.volume_vs_avg >= 2 ? "text-emerald-400" : r.volume_vs_avg >= 1.3 ? "text-yellow-400" : undefined}
              />
              <MetricCell label="RSI" value={r.rsi != null ? r.rsi.toFixed(1) : "—"}
                color={r.rsi && r.rsi < 40 ? "text-emerald-400" : r.rsi && r.rsi > 70 ? "text-red-400" : undefined} />
              <MetricCell label="Above SMA50"  value={r.above_sma50 == null ? "—" : r.above_sma50 ? "Yes" : "No"}
                color={r.above_sma50 ? "text-emerald-400" : r.above_sma50 === false ? "text-red-400" : undefined} />
              <MetricCell label="Above SMA200" value={r.above_sma200 == null ? "—" : r.above_sma200 ? "Yes" : "No"}
                color={r.above_sma200 ? "text-emerald-400" : r.above_sma200 === false ? "text-red-400" : undefined} />
            </div>
          </div>

          {/* Insider activity */}
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 size={14} className="text-yellow-400" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Insider Activity (90d)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCell label="Buy Transactions"  value={r.insider_buys_90d.toString()}
                color={r.insider_buys_90d > 0 ? "text-emerald-400" : undefined} />
              <MetricCell label="Sell Transactions" value={r.insider_sells_90d.toString()}
                color={r.insider_sells_90d > r.insider_buys_90d ? "text-red-400" : undefined} />
            </div>
            {r.insider_buys_90d > 0 && r.insider_sells_90d === 0 && (
              <p className="text-xs p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Insider buying without matching sales — possible positive signal. Filings are public disclosures.
              </p>
            )}
          </div>

          {/* AI Explanation */}
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>AI Signal Summary</span>
            </div>
            <div className="rounded-lg p-3 border border-emerald-500/20 bg-emerald-500/5">
              <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                {r.ai_explanation}
              </p>
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              Based on publicly available options flow, institutional filings & volume patterns. Not financial advice.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}

function MetricCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg p-2.5 border" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.02)" }}>
      <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${color ?? ""}`} style={!color ? { color: "var(--text)" } : undefined}>
        {value}
      </div>
    </div>
  );
}
