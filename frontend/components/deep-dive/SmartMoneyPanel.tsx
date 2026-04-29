"use client";

import { ArrowUp, ArrowDown, Minus, Eye } from "lucide-react";
import type { DDInstitutional } from "@/types";

function SignalPill({ label, signal }: { label: string; signal: string }) {
  const color =
    signal === "Bullish" || signal === "Buying" || signal === "Low"
      ? "#00ff88"
      : signal === "Bearish" || signal === "Selling" || signal === "Elevated"
      ? "#ff4466"
      : "#ffcc44";
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold border"
      style={{ color, borderColor: color, background: `${color}15` }}>
      {signal}
    </span>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden flex-1" style={{ background: "var(--border)" }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

export function SmartMoneyPanel({ data }: { data: DDInstitutional }) {
  const insiderColor = data.insider_net === "Buying" ? "#00ff88" : data.insider_net === "Selling" ? "#ff4466" : "#ffcc44";
  const InsiderIcon = data.insider_net === "Buying" ? ArrowUp : data.insider_net === "Selling" ? ArrowDown : Minus;
  const optColor = data.options_signal === "Bullish" ? "#00ff88" : data.options_signal === "Bearish" ? "#ff4466" : "#ffcc44";

  return (
    <div className="card p-4 space-y-4 h-full">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs" style={{ background: "rgba(170,68,255,0.15)", color: "#aa44ff" }}>
          <Eye size={13} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Smart Money / Institutional</h3>
      </div>

      {/* Institutional Ownership */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span style={{ color: "var(--muted)" }}>Institutional Ownership</span>
          <span className="font-mono font-bold" style={{ color: "var(--text)" }}>{data.ownership_pct}%</span>
        </div>
        <Bar pct={data.ownership_pct} color="#aa44ff" />
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {data.ownership_pct > 70 ? "Heavy institutional concentration — smart money loaded up"
           : data.ownership_pct > 50 ? "Solid institutional backing"
           : data.ownership_pct > 30 ? "Moderate institutional presence"
           : "Limited institutional interest"}
        </p>
      </div>

      {/* Top Holders */}
      {data.top_holders.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Top Holders</p>
          {data.top_holders.slice(0, 4).map((h, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="text-xs truncate flex-1" style={{ color: "var(--text)" }}>{h.name}</span>
              <span className="text-xs font-mono flex-shrink-0" style={{ color: "#aa44ff" }}>{h.pct.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)" }} />

      {/* Insider Activity */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Insider Activity (90d)</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <InsiderIcon size={13} style={{ color: insiderColor }} />
            <span className="text-sm font-bold" style={{ color: insiderColor }}>{data.insider_net}</span>
          </div>
        </div>
        <div className="text-right text-xs" style={{ color: "var(--muted)" }}>
          {data.insider_3m_bought > 0 && <div>Bought: <span className="text-green-400">{data.insider_3m_bought.toLocaleString()}</span> sh</div>}
          {data.insider_3m_sold > 0 && <div>Sold: <span className="text-red-400">{data.insider_3m_sold.toLocaleString()}</span> sh</div>}
          {data.insider_3m_bought === 0 && data.insider_3m_sold === 0 && <span>No recent filings</span>}
        </div>
      </div>

      {/* Short Interest */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span style={{ color: "var(--muted)" }}>Short Interest</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold" style={{ color: data.short_pct > 15 ? "#ff4466" : "var(--text)" }}>{data.short_pct}%</span>
            <SignalPill label="trend" signal={data.short_trend} />
          </div>
        </div>
        <Bar pct={data.short_pct * 3} color={data.short_pct > 15 ? "#ff4466" : data.short_pct > 8 ? "#ffcc44" : "#00ff88"} />
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Days to cover: {data.short_ratio}
          {data.short_pct < 3 ? " — Bearish bets minimal" : data.short_pct > 15 ? " — Heavy shorting, squeeze potential" : " — Moderate short presence"}
        </p>
      </div>

      {/* Options Signal */}
      <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--card2)" }}>
        <div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Options Flow Signal</p>
          <p className="text-sm font-bold" style={{ color: optColor }}>{data.options_signal}</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: "var(--muted)" }}>Put/Call Ratio</p>
          <p className="text-sm font-mono font-bold" style={{ color: "var(--text)" }}>{data.put_call_ratio.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
