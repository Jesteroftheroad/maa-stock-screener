"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SmartMoneyResult } from "@/types";

interface Props {
  results: SmartMoneyResult[];
  isLoading: boolean;
  onRowClick: (r: SmartMoneyResult) => void;
}

type SortKey = "smart_money_score" | "volume_vs_avg" | "call_put_ratio" | "inst_ownership_pct" | "change_pct";

const ACTION_TAG_COLORS: Record<string, string> = {
  "Possible Accumulation": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "Bullish Flow":          "text-green-400  bg-green-500/10  border-green-500/30",
  "Quiet Buying":          "text-teal-400   bg-teal-500/10   border-teal-500/30",
  "Momentum + Flow":       "text-cyan-400   bg-cyan-500/10   border-cyan-500/30",
  "Insider Buying":        "text-blue-400   bg-blue-500/10   border-blue-500/30",
  "Distribution Risk":     "text-red-400    bg-red-500/10    border-red-500/30",
  "Watchlist":             "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
};

const SCORE_COLORS: Record<string, string> = {
  "High Conviction":   "text-emerald-400",
  "Strong Watchlist":  "text-blue-400",
  "Early Setup":       "text-yellow-400",
  "Weak / Mixed":      "text-gray-400",
};

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color = SCORE_COLORS[label] ?? "text-gray-400";
  const bg =
    label === "High Conviction"  ? "bg-emerald-500/15 border-emerald-500/30" :
    label === "Strong Watchlist" ? "bg-blue-500/15 border-blue-500/30" :
    label === "Early Setup"      ? "bg-yellow-500/15 border-yellow-500/30" :
                                   "bg-gray-500/15 border-gray-500/30";

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold ${bg} ${color}`}>
      <span className="tabular-nums">{score}</span>
    </div>
  );
}

function ActionTag({ tag }: { tag: string }) {
  const cls = ACTION_TAG_COLORS[tag] ?? "text-gray-400 bg-gray-500/10 border-gray-500/30";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-medium ${cls}`}>
      {tag}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-lg animate-pulse"
          style={{ background: "var(--card)", opacity: 1 - i * 0.08 }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
        <ExternalLink size={20} style={{ color: "var(--muted)" }} />
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>No signals found</p>
      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
        Try a preset or loosen your filters
      </p>
    </div>
  );
}

export function SmartMoneyTable({ results, isLoading, onRowClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("smart_money_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...results].sort((a, b) => {
    const av = (a[sortKey] ?? 0) as number;
    const bv = (b[sortKey] ?? 0) as number;
    return sortDir === "desc" ? bv - av : av - bv;
  });

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} className="opacity-30" />;
    return sortDir === "desc"
      ? <ChevronDown size={12} className="text-emerald-400" />
      : <ChevronUp size={12} className="text-emerald-400" />;
  }

  function ColHead({ label, k, align = "right" }: { label: string; k: SortKey; align?: string }) {
    return (
      <th
        className={`py-2.5 px-3 text-xs font-semibold cursor-pointer hover:text-current transition-colors select-none ${align === "right" ? "text-right" : "text-left"}`}
        style={{ color: "var(--muted)" }}
        onClick={() => toggleSort(k)}
      >
        <span className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
          {label}
          <SortIcon k={k} />
        </span>
      </th>
    );
  }

  if (isLoading) return <LoadingSkeleton />;
  if (!results.length) return <EmptyState />;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
            <tr>
              <th className="py-2.5 px-3 text-xs font-semibold text-left" style={{ color: "var(--muted)" }}>Ticker</th>
              <th className="py-2.5 px-3 text-xs font-semibold text-left" style={{ color: "var(--muted)" }}>Sector</th>
              <th className="py-2.5 px-3 text-xs font-semibold text-right" style={{ color: "var(--muted)" }}>Price</th>
              <ColHead label="Change %" k="change_pct" />
              <ColHead label="SM Score" k="smart_money_score" />
              <th className="py-2.5 px-3 text-xs font-semibold text-left" style={{ color: "var(--muted)" }}>Signal</th>
              <ColHead label="Vol/Avg" k="volume_vs_avg" />
              <ColHead label="C/P Ratio" k="call_put_ratio" />
              <ColHead label="Inst. Own" k="inst_ownership_pct" />
              <th className="py-2.5 px-3 text-xs font-semibold text-left" style={{ color: "var(--muted)" }}>Inst. Trend</th>
              <th className="py-2.5 px-3 text-xs font-semibold text-left" style={{ color: "var(--muted)" }}>Tag</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const pct = r.change_pct ?? 0;
              const pctColor = pct >= 0 ? "text-emerald-400" : "text-red-400";
              const trendColor =
                r.institutional_trend === "Rising"  ? "text-emerald-400" :
                r.institutional_trend === "Stable"  ? "text-blue-400" :
                r.institutional_trend === "Limited" ? "text-yellow-400" :
                                                      "text-gray-400";

              return (
                <tr
                  key={r.ticker}
                  onClick={() => onRowClick(r)}
                  className="cursor-pointer transition-colors hover:bg-white/3"
                  style={{ borderBottom: i < sorted.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  {/* Ticker + name */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-sm" style={{ color: "var(--text)" }}>{r.ticker}</div>
                    <div className="text-xs truncate max-w-[120px]" style={{ color: "var(--muted)" }}>{r.name}</div>
                  </td>

                  {/* Sector */}
                  <td className="py-3 px-3">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{r.sector || "—"}</span>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-3 text-right">
                    <span className="font-mono text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {r.price != null ? `$${r.price.toFixed(2)}` : "—"}
                    </span>
                  </td>

                  {/* Change % */}
                  <td className="py-3 px-3 text-right">
                    <span className={`font-mono text-sm font-semibold ${pctColor}`}>
                      {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                    </span>
                  </td>

                  {/* SM Score */}
                  <td className="py-3 px-3 text-right">
                    <ScoreBadge score={r.smart_money_score} label={r.score_label} />
                  </td>

                  {/* Signal type */}
                  <td className="py-3 px-3">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{r.signal_type}</span>
                  </td>

                  {/* Volume vs avg */}
                  <td className="py-3 px-3 text-right">
                    <span className={cn(
                      "font-mono text-sm",
                      r.volume_vs_avg >= 2 ? "text-emerald-400 font-semibold" :
                      r.volume_vs_avg >= 1.3 ? "text-yellow-400" : ""
                    )} style={r.volume_vs_avg < 1.3 ? { color: "var(--muted)" } : undefined}>
                      {r.volume_vs_avg.toFixed(1)}×
                    </span>
                  </td>

                  {/* C/P ratio */}
                  <td className="py-3 px-3 text-right">
                    <span className={cn(
                      "font-mono text-sm",
                      (r.call_put_ratio ?? 0) >= 2 ? "text-emerald-400 font-semibold" :
                      (r.call_put_ratio ?? 0) >= 1.2 ? "text-yellow-400" : ""
                    )} style={(r.call_put_ratio ?? 0) < 1.2 ? { color: "var(--muted)" } : undefined}>
                      {r.call_put_ratio != null ? r.call_put_ratio.toFixed(1) : "—"}
                    </span>
                  </td>

                  {/* Inst ownership */}
                  <td className="py-3 px-3 text-right">
                    <span className="font-mono text-sm" style={{ color: "var(--text)" }}>
                      {r.inst_ownership_pct != null ? `${r.inst_ownership_pct.toFixed(0)}%` : "—"}
                    </span>
                  </td>

                  {/* Inst trend */}
                  <td className="py-3 px-3">
                    <span className={`text-xs font-medium ${trendColor}`}>
                      {r.institutional_trend}
                    </span>
                  </td>

                  {/* Action tag */}
                  <td className="py-3 px-3">
                    <ActionTag tag={r.action_tag} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
