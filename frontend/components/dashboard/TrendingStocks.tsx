"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ChangeIndicator } from "@/components/ui/ChangeIndicator";
import { formatPrice } from "@/lib/utils";
import type { MoverItem } from "@/types";

interface TrendingStocksProps {
  gainers: MoverItem[];
  losers: MoverItem[];
}

function MoverRow({ item, index }: { item: MoverItem; index: number }) {
  const isPositive = (item.change_pct ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between py-2 border-b last:border-0"
      style={{ borderColor: "var(--border)" }}
    >
      <span className="font-mono text-sm font-semibold" style={{ color: "var(--text)" }}>
        {item.ticker}
      </span>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm" style={{ color: "var(--muted)" }}>
          {formatPrice(item.price)}
        </span>
        <ChangeIndicator value={item.change_pct} size="sm" />
      </div>
    </motion.div>
  );
}

export function TrendingStocks({ gainers, losers }: TrendingStocksProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card p-4">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3" style={{ color: "var(--green)" }}>
          <TrendingUp size={14} /> TOP GAINERS
        </h3>
        {gainers.map((item, i) => <MoverRow key={item.ticker} item={item} index={i} />)}
      </div>
      <div className="card p-4">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3" style={{ color: "var(--red)" }}>
          <TrendingDown size={14} /> TOP LOSERS
        </h3>
        {losers.map((item, i) => <MoverRow key={item.ticker} item={item} index={i} />)}
      </div>
    </div>
  );
}
