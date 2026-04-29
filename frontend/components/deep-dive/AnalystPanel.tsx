"use client";

import { ArrowUp, ArrowDown, Target } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { DDAnalyst } from "@/types";

function RatingBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-24 flex-shrink-0" style={{ color: "var(--muted)" }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono w-4 text-right" style={{ color: "var(--text)" }}>{count}</span>
    </div>
  );
}

export function AnalystPanel({ data, price }: { data: DDAnalyst; price: number | null }) {
  const total = data.strong_buy + data.buy + data.hold + data.sell + data.strong_sell;
  const ratingColor =
    data.avg_rating <= 1.5 ? "#00ff88" :
    data.avg_rating <= 2.5 ? "#4488ff" :
    data.avg_rating <= 3.5 ? "#ffcc44" : "#ff4466";

  const priceLow = data.target_low || 0;
  const priceAvg = data.target_avg || 0;
  const priceHigh = data.target_high || 0;
  const range = priceHigh - priceLow;
  const currentPct = range > 0 && price ? ((price - priceLow) / range) * 100 : 50;
  const avgPct = range > 0 ? ((priceAvg - priceLow) / range) * 100 : 50;

  const upsideColor = data.upside_pct >= 0 ? "#00ff88" : "#ff4466";

  return (
    <div className="card p-4 space-y-4 h-full">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(68,136,255,0.15)", color: "#4488ff" }}>
          <Target size={13} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Wall Street Analyst Consensus</h3>
      </div>

      {/* Rating header */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-3xl font-black font-mono" style={{ color: ratingColor }}>{data.avg_rating.toFixed(1)}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>/ 5.0 scale</div>
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold" style={{ color: ratingColor }}>{data.rating_label}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>{data.num_analysts} analysts covering</div>
          <div className="text-xs mt-0.5" style={{ color: upsideColor }}>
            {data.upside_pct >= 0 ? "▲" : "▼"} {Math.abs(data.upside_pct)}% implied {data.upside_pct >= 0 ? "upside" : "downside"}
          </div>
        </div>
      </div>

      {/* Rating distribution */}
      {total > 0 && (
        <div className="space-y-1.5">
          <RatingBar label="Strong Buy" count={data.strong_buy} total={total} color="#00ff88" />
          <RatingBar label="Buy" count={data.buy} total={total} color="#4488ff" />
          <RatingBar label="Hold" count={data.hold} total={total} color="#ffcc44" />
          <RatingBar label="Sell" count={data.sell} total={total} color="#ff8844" />
          <RatingBar label="Strong Sell" count={data.strong_sell} total={total} color="#ff4466" />
        </div>
      )}

      {/* Price target range */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>PRICE TARGET RANGE</p>
        <div className="relative h-6 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          {/* Fill to avg */}
          <div className="absolute top-0 left-0 h-full rounded-full opacity-30"
            style={{ width: `${Math.max(avgPct, 0)}%`, background: ratingColor }} />
          {/* Current price marker */}
          {price && (
            <div className="absolute top-0 h-full w-0.5" style={{ left: `${Math.max(0, Math.min(100, currentPct))}%`, background: "white", opacity: 0.7 }} />
          )}
          {/* Avg target marker */}
          <div className="absolute top-0 h-full w-1 rounded-full" style={{ left: `${Math.max(0, Math.min(99, avgPct))}%`, background: ratingColor }} />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span style={{ color: "#ff4466" }}>Low {formatPrice(data.target_low)}</span>
          <span style={{ color: ratingColor }}>Avg {formatPrice(data.target_avg)}</span>
          <span style={{ color: "#00ff88" }}>High {formatPrice(data.target_high)}</span>
        </div>
      </div>

      {/* Recent actions */}
      {(data.recent_upgrades.length > 0 || data.recent_downgrades.length > 0) && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Recent Actions (90d)</p>
          {data.recent_upgrades.slice(0, 2).map((u, i) => (
            <div key={`u${i}`} className="flex items-center gap-2 text-xs">
              <ArrowUp size={10} className="text-green-400 flex-shrink-0" />
              <span className="flex-1 truncate" style={{ color: "var(--text)" }}>{u.firm}</span>
              <span style={{ color: "var(--muted)" }}>{u.from} → <span className="text-green-400">{u.to}</span></span>
              <span className="flex-shrink-0 text-right" style={{ color: "var(--muted)" }}>{u.date}</span>
            </div>
          ))}
          {data.recent_downgrades.slice(0, 2).map((d, i) => (
            <div key={`d${i}`} className="flex items-center gap-2 text-xs">
              <ArrowDown size={10} className="text-red-400 flex-shrink-0" />
              <span className="flex-1 truncate" style={{ color: "var(--text)" }}>{d.firm}</span>
              <span style={{ color: "var(--muted)" }}>{d.from} → <span className="text-red-400">{d.to}</span></span>
              <span className="flex-shrink-0 text-right" style={{ color: "var(--muted)" }}>{d.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
