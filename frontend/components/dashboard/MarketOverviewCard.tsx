"use client";

import { motion } from "framer-motion";
import { ChangeIndicator } from "@/components/ui/ChangeIndicator";
import { formatPrice } from "@/lib/utils";
import type { MarketItem } from "@/types";

const ICONS: Record<string, string> = {
  "S&P 500":   "📈",
  "Nasdaq":    "💻",
  "Dow Jones": "🏦",
  "Bitcoin":   "₿",
  "Gold":      "🥇",
  "Crude Oil": "🛢️",
};

interface MarketOverviewCardProps {
  item: MarketItem;
  index: number;
}

export function MarketOverviewCard({ item, index }: MarketOverviewCardProps) {
  const isPositive = (item.change_pct ?? 0) >= 0;
  const glowColor  = isPositive ? "rgba(0,255,136,0.1)" : "rgba(255,68,102,0.1)";
  const borderColor = isPositive ? "rgba(0,255,136,0.15)" : "rgba(255,68,102,0.15)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="p-4 rounded-xl hover:scale-[1.02] transition-all cursor-default"
      style={{
        background: "var(--card)",
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 16px ${glowColor}`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-lg leading-none">{ICONS[item.name] ?? "📊"}</span>
        <ChangeIndicator value={item.change_pct} size="sm" />
      </div>
      <div
        className="number-font font-bold text-lg"
        style={{ color: isPositive ? "var(--green)" : "var(--red)" }}
      >
        {formatPrice(item.price)}
      </div>
      <div className="text-xs mt-1 font-medium" style={{ color: "var(--muted)" }}>{item.name}</div>
    </motion.div>
  );
}
