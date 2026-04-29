"use client";

import { Activity, Check, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { DeepDiveResult } from "@/types";

function RSIGauge({ rsi }: { rsi: number }) {
  const angle = ((rsi / 100) * 180) - 90;
  const color =
    rsi < 30 ? "#ff4466" : rsi < 45 ? "#ffcc44" :
    rsi < 70 ? "#00ff88" : "#ff8844";

  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="65" viewBox="0 0 110 65">
        {/* Background arc */}
        <path d="M 10 60 A 45 45 0 0 1 100 60" fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
        {/* RSI zones */}
        <path d="M 10 60 A 45 45 0 0 1 30 21" fill="none" stroke="#ff446622" strokeWidth="8" />
        <path d="M 30 21 A 45 45 0 0 1 55 11" fill="none" stroke="#ffcc4422" strokeWidth="8" />
        <path d="M 55 11 A 45 45 0 0 1 80 21" fill="none" stroke="#00ff8822" strokeWidth="8" />
        <path d="M 80 21 A 45 45 0 0 1 100 60" fill="none" stroke="#ff884422" strokeWidth="8" />
        {/* Needle */}
        <line x1="55" y1="60" x2={55 + 38 * Math.cos((angle - 90) * Math.PI / 180)} y2={60 + 38 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="55" cy="60" r="4" fill={color} />
        {/* Labels */}
        <text x="7" y="58" fontSize="8" fill="#ff4466" textAnchor="middle">30</text>
        <text x="103" y="58" fontSize="8" fill="#ff8844" textAnchor="middle">70</text>
      </svg>
      <div className="font-mono font-black text-2xl -mt-2" style={{ color }}>{rsi.toFixed(1)}</div>
      <div className="text-xs" style={{ color: "var(--muted)" }}>RSI</div>
    </div>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: "var(--muted)" }}>{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function SMACheck({ label, active }: { label: string; active: boolean | null }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {active ? <Check size={12} className="text-green-400" /> : <X size={12} className="text-red-400" />}
      <span style={{ color: active ? "var(--text)" : "var(--muted)" }}>{label}</span>
    </div>
  );
}

export function TechnicalPanel({ data }: { data: DeepDiveResult }) {
  const trendColor = data.trend === "UPTREND" ? "#00ff88" : data.trend === "DOWNTREND" ? "#ff4466" : "#ffcc44";
  const macdColor = data.macd_signal === "BULLISH" ? "#00ff88" : data.macd_signal === "BEARISH" ? "#ff4466" : "#ffcc44";

  return (
    <div className="card p-4 space-y-4 h-full">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(0,204,255,0.15)", color: "#00ccff" }}>
          <Activity size={13} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Technical Analysis Engine</h3>
      </div>

      {/* RSI gauge + trend */}
      <div className="flex items-center gap-4">
        <RSIGauge rsi={data.rsi} />
        <div className="flex-1 space-y-2">
          <div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>Trend</div>
            <div className="text-base font-bold" style={{ color: trendColor }}>{data.trend}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>MACD Signal</div>
            <div className="text-base font-bold" style={{ color: macdColor }}>{data.macd_signal}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>Volume Surge</div>
            <div className="text-sm font-mono font-bold" style={{ color: data.volume_surge > 1.5 ? "#00ff88" : "var(--text)" }}>
              {data.volume_surge.toFixed(1)}x avg
            </div>
          </div>
        </div>
      </div>

      {/* MA positions */}
      <div className="flex gap-3 flex-wrap">
        <SMACheck label="Above SMA 50" active={data.above_sma50} />
        <SMACheck label="Above SMA 200" active={data.above_sma200} />
      </div>

      {/* Support / Resistance */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold mb-1.5" style={{ color: "#00ff88" }}>Support</p>
          {data.support.length > 0
            ? data.support.map((s, i) => <div key={i} className="text-sm font-mono" style={{ color: "var(--text)" }}>{formatPrice(s)}</div>)
            : <div className="text-xs" style={{ color: "var(--muted)" }}>—</div>}
        </div>
        <div>
          <p className="text-xs font-semibold mb-1.5" style={{ color: "#ff4466" }}>Resistance</p>
          {data.resistance.length > 0
            ? data.resistance.map((r, i) => <div key={i} className="text-sm font-mono" style={{ color: "var(--text)" }}>{formatPrice(r)}</div>)
            : <div className="text-xs" style={{ color: "var(--muted)" }}>—</div>}
        </div>
      </div>

      {data.atr && (
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          ATR: <span className="font-mono" style={{ color: "var(--text)" }}>{formatPrice(data.atr)}</span>
          <span className="ml-3">Stop-loss zone:</span>
          <span className="font-mono ml-1" style={{ color: "var(--text)" }}>{formatPrice(data.trade_setup.stop_loss)}</span>
        </div>
      )}

      {/* Probability bars */}
      <div className="space-y-2 pt-1">
        <ProbBar label="Breakout Probability" value={data.breakout_prob} color="#4488ff" />
        <ProbBar label="Bounce Probability" value={data.bounce_prob} color="#00ff88" />
        <ProbBar label="Breakdown Risk" value={data.breakdown_risk} color="#ff4466" />
      </div>
    </div>
  );
}
