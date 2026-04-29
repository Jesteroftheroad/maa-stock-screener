import { TrendingUp, Users, Volume2, Zap, AlertTriangle } from "lucide-react";
import type { SmartMoneyOverview } from "@/types";

interface Props {
  overview: SmartMoneyOverview | null;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  subtitle: string;
}

function StatCard({ label, value, icon: Icon, color, bg, border, subtitle }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-4 border flex items-start gap-3"
      style={{ background: "var(--card)", borderColor: border }}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon size={18} className={color} />
      </div>
      <div className="min-w-0">
        <div className={`text-2xl font-bold tabular-nums ${color}`}>
          {typeof value === "number" ? value : value}
        </div>
        <div className="text-xs font-medium mt-0.5" style={{ color: "var(--text)" }}>
          {label}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

export function SmartMoneyHeader({ overview }: Props) {
  const stats: StatCardProps[] = [
    {
      label: "Bullish Flow Signals",
      value: overview?.bullish_flow_count ?? "—",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/15",
      border: "rgba(16,185,129,0.2)",
      subtitle: "Call/put ratio > 1.5×",
    },
    {
      label: "Insider Buy Alerts",
      value: overview?.insider_buy_count ?? "—",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/15",
      border: "rgba(59,130,246,0.2)",
      subtitle: "Filed insider purchases",
    },
    {
      label: "Unusual Volume",
      value: overview?.unusual_volume_count ?? "—",
      icon: Volume2,
      color: "text-purple-400",
      bg: "bg-purple-500/15",
      border: "rgba(168,85,247,0.2)",
      subtitle: "Volume > 2× daily average",
    },
    {
      label: "High Conviction",
      value: overview?.high_conviction_count ?? "—",
      icon: Zap,
      color: "text-yellow-400",
      bg: "bg-yellow-500/15",
      border: "rgba(234,179,8,0.2)",
      subtitle: "Smart money score ≥ 85",
    },
    {
      label: "Distribution Warnings",
      value: overview?.distribution_count ?? "—",
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/15",
      border: "rgba(239,68,68,0.2)",
      subtitle: "Bearish signals detected",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
