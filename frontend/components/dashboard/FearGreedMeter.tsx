"use client";

import { motion } from "framer-motion";
import type { FearGreed } from "@/types";

const LABEL_COLORS: Record<string, string> = {
  "Extreme Fear":  "#ff4466",
  "Fear":          "#ff8844",
  "Neutral":       "#ffcc44",
  "Greed":         "#44cc88",
  "Extreme Greed": "#00ff88",
};

const SEGMENTS = [
  { color: "#ff4466", start: 0,   end: 36,  label: "Extreme Fear" },
  { color: "#ff8844", start: 36,  end: 72,  label: "Fear" },
  { color: "#ffcc44", start: 72,  end: 108, label: "Neutral" },
  { color: "#44cc88", start: 108, end: 144, label: "Greed" },
  { color: "#00ff88", start: 144, end: 180, label: "Extreme Greed" },
];

interface FearGreedMeterProps {
  data: FearGreed;
}

export function FearGreedMeter({ data }: FearGreedMeterProps) {
  const color = LABEL_COLORS[data.label] ?? "#ffcc44";
  const angle = (data.score / 100) * 180 - 90;
  const rad   = (angle * Math.PI) / 180;
  const cx = 100, cy = 90, r = 68;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);

  return (
    <div
      className="p-5 rounded-xl flex flex-col items-center h-full"
      style={{
        background: "var(--card)",
        border: `1px solid rgba(255,204,68,0.15)`,
        boxShadow: `0 0 20px rgba(255,204,68,0.06)`,
      }}
    >
      <h3
        className="text-[10px] font-bold uppercase tracking-widest mb-3"
        style={{ color: "var(--muted)" }}
      >
        Market Sentiment
      </h3>

      <svg width="200" height="112" viewBox="0 0 200 112">
        {/* Segment arcs */}
        {SEGMENTS.map(({ color: c, start, end }, i) => {
          const s = ((start / 180) * Math.PI) - Math.PI;
          const e = ((end   / 180) * Math.PI) - Math.PI;
          const x1 = cx + r * Math.cos(s);
          const y1 = cy + r * Math.sin(s);
          const x2 = cx + r * Math.cos(e);
          const y2 = cy + r * Math.sin(e);
          return (
            <path
              key={i}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
              fill={c}
              opacity={0.18}
            />
          );
        })}

        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Active arc */}
        {(() => {
          const startAngle = -Math.PI;
          const endAngle   = rad;
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          const large = data.score > 50 ? 1 : 0;
          return (
            <path
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
              fill="none"
              stroke={color}
              strokeWidth="7"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
            />
          );
        })()}

        {/* Needle */}
        <motion.line
          x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ x2: cx - r, y2: cy }}
          animate={{ x2: nx, y2: ny }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
        <circle cx={cx} cy={cy} r="4.5" fill={color}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />

        {/* Score number */}
        <text
          x={cx} y={cy - 18}
          textAnchor="middle"
          fill={color}
          fontSize="22"
          fontWeight="700"
          fontFamily="'JetBrains Mono', monospace"
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        >
          {data.score}
        </text>
      </svg>

      <div className="text-sm font-bold mt-0.5" style={{ color }}>{data.label}</div>
      {data.vix && (
        <div className="text-xs mt-1.5 px-2.5 py-0.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.05)", color: "var(--muted)" }}>
          VIX {data.vix.toFixed(1)}
        </div>
      )}
    </div>
  );
}
