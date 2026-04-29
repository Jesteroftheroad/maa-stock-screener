import { Building2, TrendingUp, UserCheck, Briefcase, Zap, ArrowDownCircle, Flame, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
  { name: "quiet_accumulation",  label: "Quiet Accumulation",       icon: Building2,        color: "blue"    },
  { name: "bullish_flow",        label: "Bullish Flow",              icon: TrendingUp,       color: "green"   },
  { name: "insider_buying",      label: "Insider Buying",            icon: UserCheck,        color: "blue"    },
  { name: "hedge_fund_favorites",label: "Hedge Fund Favorites",      icon: Briefcase,        color: "purple"  },
  { name: "momentum_smart",      label: "Momentum + Smart Money",    icon: Zap,              color: "yellow"  },
  { name: "oversold_flow",       label: "Oversold + Flow",           icon: ArrowDownCircle,  color: "orange"  },
  { name: "short_squeeze",       label: "Short Squeeze Setup",       icon: Flame,            color: "red"     },
  { name: "breakout_flow",       label: "Breakout + Flow",           icon: BarChart2,        color: "green"   },
];

const colorMap: Record<string, { active: string; hover: string; border: string }> = {
  green:  { active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",  hover: "hover:border-emerald-500/30 hover:text-emerald-400",  border: "border-emerald-500/40"  },
  blue:   { active: "bg-blue-500/20 text-blue-400 border-blue-500/40",           hover: "hover:border-blue-500/30 hover:text-blue-400",         border: "border-blue-500/40"     },
  purple: { active: "bg-purple-500/20 text-purple-400 border-purple-500/40",     hover: "hover:border-purple-500/30 hover:text-purple-400",     border: "border-purple-500/40"   },
  yellow: { active: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",     hover: "hover:border-yellow-500/30 hover:text-yellow-400",     border: "border-yellow-500/40"   },
  orange: { active: "bg-orange-500/20 text-orange-400 border-orange-500/40",     hover: "hover:border-orange-500/30 hover:text-orange-400",     border: "border-orange-500/40"   },
  red:    { active: "bg-red-500/20 text-red-400 border-red-500/40",              hover: "hover:border-red-500/30 hover:text-red-400",            border: "border-red-500/40"      },
};

interface Props {
  activePreset: string | null;
  onSelect: (name: string) => void;
}

export function SmartMoneyPresets({ activePreset, onSelect }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--muted)" }}>
        Quick Filters
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ name, label, icon: Icon, color }) => {
          const c = colorMap[color];
          const isActive = activePreset === name;
          return (
            <button
              key={name}
              onClick={() => onSelect(name)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                isActive ? c.active : `border-white/10 ${c.hover}`,
                !isActive && "text-current"
              )}
              style={!isActive ? { color: "var(--muted)" } : undefined}
            >
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
