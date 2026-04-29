import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "—";
  if (price >= 1000) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toFixed(2)}`;
}

export function formatMarketCap(cap: number | null | undefined): string {
  if (cap == null) return "—";
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

export function formatPercent(val: number | null | undefined, decimals = 2): string {
  if (val == null) return "—";
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(decimals)}%`;
}

export function formatNumber(val: number | null | undefined, decimals = 2): string {
  if (val == null) return "—";
  return val.toFixed(decimals);
}

export function formatVolume(vol: number | null | undefined): string {
  if (vol == null) return "—";
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(0)}K`;
  return String(vol);
}

export function timeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "text-brand-green";
  if (score >= 50) return "text-brand-yellow";
  if (score >= 30) return "text-brand-orange";
  return "text-brand-red";
}

export function getLabelStyle(label: string): string {
  switch (label) {
    case "Buy Candidate": return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "Watchlist":     return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "Risky":         return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    case "Overvalued":    return "bg-red-500/20 text-red-400 border border-red-500/30";
    default:              return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
  }
}
