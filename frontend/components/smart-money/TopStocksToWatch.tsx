"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Star, TrendingUp, TrendingDown, ArrowRight, Sparkles } from "lucide-react";
import { fetchScreener } from "@/lib/api";
import type { StockResult } from "@/types";

function fmt(n: number | null, prefix = ""): string {
  if (n == null) return "—";
  return `${prefix}${n.toFixed(2)}`;
}

function fmtCap(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

const SCORE_STYLES: Record<string, { ring: string; badge: string; dot: string }> = {
  green: {
    ring: "ring-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  yellow: {
    ring: "ring-yellow-500/30",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-400",
  },
  orange: {
    ring: "ring-orange-500/30",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
  },
  red: {
    ring: "ring-red-500/30",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    dot: "bg-red-400",
  },
};

function StockCard({ stock, rank }: { stock: StockResult; rank: number }) {
  const pct = stock.change_pct ?? 0;
  const isUp = pct >= 0;
  const styles = SCORE_STYLES[stock.ai_label_color] ?? SCORE_STYLES.yellow;

  return (
    <Link href={`/stock/${stock.ticker}`}>
      <div
        className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ring-1 ${styles.ring}`}
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        {/* Rank badge */}
        <div className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
          <span className="text-[9px] font-bold text-black">{rank}</span>
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-bold text-base" style={{ color: "var(--text)" }}>
              {stock.ticker}
            </div>
            <div className="text-xs truncate max-w-[130px] mt-0.5" style={{ color: "var(--muted)" }}>
              {stock.name}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold font-mono text-sm" style={{ color: "var(--text)" }}>
              {stock.price != null ? `$${stock.price.toFixed(2)}` : "—"}
            </div>
            <div className={`flex items-center justify-end gap-0.5 text-xs font-semibold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
              {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {isUp ? "+" : ""}{pct.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* AI Score */}
        <div className="flex items-center justify-between mb-3">
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold ${styles.badge}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
            {stock.ai_label}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: "var(--muted)" }}>AI</span>
            <span className={`text-lg font-bold tabular-nums ${
              stock.ai_label_color === "green" ? "text-emerald-400" :
              stock.ai_label_color === "yellow" ? "text-yellow-400" :
              stock.ai_label_color === "orange" ? "text-orange-400" : "text-red-400"
            }`}>
              {stock.ai_score}
            </span>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <Metric label="Sector" value={stock.sector || "—"} small />
          <Metric label="Mkt Cap" value={fmtCap(stock.market_cap)} />
          <Metric label="P/E" value={stock.pe != null ? stock.pe.toFixed(1) : "—"} />
          <Metric label="RSI" value={stock.rsi != null ? stock.rsi.toFixed(1) : "—"}
            color={stock.rsi != null && stock.rsi < 40 ? "text-emerald-400" : stock.rsi != null && stock.rsi > 70 ? "text-red-400" : undefined} />
          {stock.revenue_growth != null && (
            <Metric
              label="Rev Growth"
              value={`${(stock.revenue_growth * 100).toFixed(0)}%`}
              color={stock.revenue_growth > 0.1 ? "text-emerald-400" : stock.revenue_growth < 0 ? "text-red-400" : undefined}
            />
          )}
          {stock.div_yield != null && stock.div_yield > 0 && (
            <Metric label="Div Yield" value={`${(stock.div_yield * 100).toFixed(1)}%`} />
          )}
        </div>

        {/* Arrow hint */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={14} style={{ color: "var(--muted)" }} />
        </div>
      </div>
    </Link>
  );
}

function Metric({ label, value, color, small }: { label: string; value: string; color?: string; small?: boolean }) {
  return (
    <div>
      <span className="text-xs" style={{ color: "var(--muted)" }}>{label}: </span>
      <span className={`text-xs font-semibold ${small ? "truncate" : ""} ${color ?? ""}`}
            style={!color ? { color: "var(--text)" } : undefined}>
        {value}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl border p-4 animate-pulse"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="h-4 rounded w-1/3 mb-2" style={{ background: "var(--border)" }} />
      <div className="h-3 rounded w-2/3 mb-4" style={{ background: "var(--border)" }} />
      <div className="h-6 rounded w-1/2 mb-3" style={{ background: "var(--border)" }} />
      <div className="space-y-2">
        <div className="h-3 rounded" style={{ background: "var(--border)" }} />
        <div className="h-3 rounded w-3/4" style={{ background: "var(--border)" }} />
      </div>
    </div>
  );
}

export function TopStocksToWatch() {
  const { data, isLoading } = useQuery({
    queryKey: ["top-watchlist"],
    queryFn: () => fetchScreener({ ai_score_min: 70 }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const stocks = (data?.results ?? [])
    .sort((a, b) => b.ai_score - a.ai_score)
    .slice(0, 10);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-yellow-500 to-amber-400 flex items-center justify-center">
            <Star size={13} className="text-black" />
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
            Top 10 Stocks to Watch
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 font-semibold">
            AI Score 70+
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
          <Sparkles size={12} className="text-yellow-400" />
          {isLoading ? "Loading…" : `${stocks.length} stocks`}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : stocks.length === 0 ? (
        <div
          className="rounded-xl border py-8 text-center text-sm"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted)" }}
        >
          No stocks found with AI score ≥ 70 right now. Market data is loading.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {stocks.map((s, i) => (
            <StockCard key={s.ticker} stock={s} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
