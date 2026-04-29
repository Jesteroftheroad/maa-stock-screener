"use client";

import { Zap } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { DDTradeSetup } from "@/types";

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: "var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="text-xs font-mono font-semibold" style={{ color: color ?? "var(--text)" }}>{value}</span>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: color + "30" }}>
      <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider" style={{ background: color + "15", color }}>
        {title}
      </div>
      <div className="px-3">{children}</div>
    </div>
  );
}

export function TradeSetupPanel({ data }: { data: DDTradeSetup }) {
  const rr = data.swing_target > data.swing_entry && data.swing_entry > data.swing_stop
    ? ((data.swing_target - data.swing_entry) / (data.swing_entry - data.swing_stop)).toFixed(1)
    : "—";

  return (
    <div className="card p-4 space-y-3 h-full">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88" }}>
          <Zap size={13} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Trade Setup Ideas</h3>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,204,68,0.1)", color: "#ffcc44" }}>
          Not financial advice
        </span>
      </div>

      {/* Swing Trade */}
      <Section title="⚡ Swing Trade Setup" color="#4488ff">
        <Row label="Entry Zone" value={formatPrice(data.swing_entry)} color="#4488ff" />
        <Row label="Price Target" value={formatPrice(data.swing_target)} color="#00ff88" />
        <Row label="Stop Loss" value={formatPrice(data.swing_stop)} color="#ff4466" />
        <Row label="Risk/Reward" value={`1 : ${rr}`} color="#ffcc44" />
      </Section>

      {/* Dip Buy */}
      <Section title="📉 Dip Buy Zone" color="#00ff88">
        <div className="py-1.5">
          <span className="text-xs" style={{ color: "var(--muted)" }}>Accumulate between </span>
          <span className="text-xs font-mono font-bold" style={{ color: "#00ff88" }}>{data.dip_zone}</span>
        </div>
      </Section>

      {/* Momentum */}
      <Section title="🚀 Momentum Breakout Entry" color="#ffcc44">
        <div className="py-1.5">
          <span className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{data.momentum_entry}</span>
        </div>
      </Section>

      {/* Options */}
      <Section title="🎯 Options Strategies" color="#aa44ff">
        <Row label={`Covered Call ($${data.covered_call_strike})`} value={data.covered_call_premium} color="#aa44ff" />
        <Row label={`Cash-Secured Put ($${data.csp_strike})`} value={data.csp_premium} color="#aa44ff" />
      </Section>

      <div className="text-xs rounded-lg p-2" style={{ background: "var(--card2)", color: "var(--muted)" }}>
        Setups are model-generated based on technical levels. Always use your own due diligence.
      </div>
    </div>
  );
}
