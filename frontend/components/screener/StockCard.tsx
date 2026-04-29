"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
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

export function StockCard({ stock, index = 0 }: StockCardProps) {
  const router = useRouter();
  const { add, remove, has } = useWatchlistStore();
  const inWatchlist = has(stock.ticker);

  const handleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) {
      remove(stock.ticker);
    } else {
      add(stock.ticker, stock.name, stock.country);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
      onClick={() => router.push(`/stock/${stock.ticker}`)}
      className="card p-4 cursor-pointer hover:scale-[1.005] transition-all hover:border-blue-500/30 group"
    >
      {/* Top row: identity + badge */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm" style={{ color: "var(--text)" }}>
              {stock.ticker}
            </span>
            {stock.country === "CA" && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">CA</span>
            )}
          </div>
          <div className="text-xs mt-0.5 truncate max-w-[160px]" style={{ color: "var(--muted)" }}>
            {stock.name}
          </div>
        </div>
        <ScoreBadge score={stock.ai_score} label={stock.ai_label} size="sm" />
      </div>

      {/* Price row */}
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono font-bold text-base" style={{ color: "var(--text)" }}>
          {formatPrice(stock.price)}
        </span>
        <ChangeIndicator value={stock.change_pct} size="sm" />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div>
          <span style={{ color: "var(--muted)" }}>Cap </span>
          <span className="font-mono" style={{ color: "var(--text)" }}>{formatMarketCap(stock.market_cap)}</span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>P/E </span>
          <span className="font-mono" style={{ color: "var(--text)" }}>{stock.pe ? formatNumber(stock.pe, 1) : "—"}</span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>RSI </span>
          <span className={`font-mono ${stock.rsi && stock.rsi > 70 ? "text-red-400" : stock.rsi && stock.rsi < 30 ? "text-green-400" : ""}`}>
            {stock.rsi ? formatNumber(stock.rsi, 0) : "—"}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>RevG </span>
          <span className={`font-mono ${(stock.revenue_growth ?? 0) > 0 ? "text-positive" : "text-negative"}`}>
            {stock.revenue_growth != null ? `${stock.revenue_growth > 0 ? "+" : ""}${stock.revenue_growth.toFixed(0)}%` : "—"}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Div </span>
          <span className="font-mono" style={{ color: "var(--text)" }}>
            {stock.div_yield ? `${stock.div_yield.toFixed(1)}%` : "—"}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--muted)" }}>Sec </span>
          <span className="truncate" style={{ color: "var(--text)" }}>
            {stock.sector?.split(" ")[0] ?? "—"}
          </span>
        </div>
      </div>

      {/* Bottom: sparkline + watchlist */}
      <div className="flex items-center justify-between">
        <Sparkline data={stock.sparkline} isPositive={(stock.change_pct ?? 0) >= 0} />
        <button
          onClick={handleWatchlist}
          className={`p-1.5 rounded-lg transition-all ${inWatchlist ? "text-red-400" : "text-muted-var hover:text-red-400"}`}
          aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Heart size={15} fill={inWatchlist ? "currentColor" : "none"} />
        </button>
      </div>
    </motion.div>
  );
}
