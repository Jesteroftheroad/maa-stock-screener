"use client";

import { useRouter } from "next/navigation";
import { Heart, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { Sparkline } from "@/components/ui/Sparkline";
import { ChangeIndicator } from "@/components/ui/ChangeIndicator";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { formatPrice, formatMarketCap, formatNumber } from "@/lib/utils";
import type { StockResult } from "@/types";

interface StockCardProps {
  stock: StockResult;
  index?: number;
}

function getScoreGlow(score: number) {
  if (score >= 70) return { border: "rgba(0,255,136,0.15)",  shadow: "0 0 16px rgba(0,255,136,0.07)"  };
  if (score >= 50) return { border: "rgba(255,204,68,0.15)", shadow: "0 0 16px rgba(255,204,68,0.06)" };
  if (score >= 30) return { border: "rgba(255,136,68,0.15)", shadow: "0 0 16px rgba(255,136,68,0.05)" };
  return           { border: "rgba(255,68,102,0.15)",        shadow: "0 0 16px rgba(255,68,102,0.05)" };
}

export function StockCard({ stock, index = 0 }: StockCardProps) {
  const router      = useRouter();
  const { add, remove, has } = useWatchlistStore();
  const inWatchlist = has(stock.ticker);
  const glow        = getScoreGlow(stock.ai_score);

  const handleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) remove(stock.ticker);
    else             add(stock.ticker, stock.name, stock.country);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
      onClick={() => router.push(`/stock/${stock.ticker}`)}
      className="p-4 rounded-xl cursor-pointer transition-all group"
      style={{
        background: "var(--card)",
        border: `1px solid ${glow.border}`,
        boxShadow: glow.shadow,
      }}
      whileHover={{ scale: 1.008, transition: { duration: 0.15 } }}
    >
      {/* Top row: identity + badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1 mr-2">
          <div className="flex items-center gap-2">
            <span className="ticker-font font-bold text-sm" style={{ color: "var(--text)" }}>
              {stock.ticker}
            </span>
            {stock.country === "CA" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                style={{ background: "rgba(255,60,60,0.1)", color: "#ff6060", border: "1px solid rgba(255,60,60,0.2)" }}>
                CA
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
            {stock.name}
          </div>
        </div>
        <ScoreBadge score={stock.ai_score} label={stock.ai_label} size="sm" />
      </div>

      {/* Price row */}
      <div className="flex items-center gap-3 mb-3">
        <span className="number-font font-bold text-base" style={{ color: "var(--text)" }}>
          {formatPrice(stock.price)}
        </span>
        <ChangeIndicator value={stock.change_pct} size="sm" />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 mb-3 text-xs">
        {[
          { label: "Cap",  value: formatMarketCap(stock.market_cap) },
          { label: "P/E",  value: stock.pe ? formatNumber(stock.pe, 1) : "—" },
          {
            label: "RSI",
            value: stock.rsi ? formatNumber(stock.rsi, 0) : "—",
            color: stock.rsi
              ? stock.rsi > 70 ? "#ff4466" : stock.rsi < 30 ? "#00ff88" : undefined
              : undefined,
          },
          {
            label: "RevG",
            value: stock.revenue_growth != null
              ? `${stock.revenue_growth > 0 ? "+" : ""}${stock.revenue_growth.toFixed(0)}%`
              : "—",
            color: stock.revenue_growth != null
              ? stock.revenue_growth > 0 ? "var(--green)" : "var(--red)"
              : undefined,
          },
          { label: "Div",  value: stock.div_yield ? `${stock.div_yield.toFixed(1)}%` : "—" },
          { label: "Sec",  value: stock.sector?.split(" ")[0] ?? "—" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <span style={{ color: "var(--muted)" }}>{label} </span>
            <span className="number-font" style={{ color: color ?? "var(--text)" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Bottom: sparkline + actions */}
      <div className="flex items-center justify-between">
        <Sparkline data={stock.sparkline} isPositive={(stock.change_pct ?? 0) >= 0} />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); router.push(`/stock/${stock.ticker}`); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/8"
            style={{ color: "var(--muted)" }}
            aria-label="Open detail view"
          >
            <ExternalLink size={13} />
          </button>
          <button
            onClick={handleWatchlist}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: inWatchlist ? "#ff4466" : "var(--muted)" }}
            aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Heart size={14} fill={inWatchlist ? "currentColor" : "none"} />
          </button>
        </div>
        {/* Show heart when in watchlist even without hover */}
        {inWatchlist && (
          <button
            onClick={handleWatchlist}
            className="p-1.5 rounded-lg transition-all group-hover:hidden"
            style={{ color: "#ff4466" }}
          >
            <Heart size={14} fill="currentColor" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
