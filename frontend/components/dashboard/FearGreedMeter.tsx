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

interface FearGreedMeterProps {
  data: FearGreed;
}

export function FearGreedMeter({ data }: FearGreedMeterProps) {
  const color = LABEL_COLORS[data.label] ?? "#ffcc44";
  // Convert score 0-100 to angle -90 to +90 degrees on a semicircle
  const angle = (data.score / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;
  const cx = 100, cy = 90, r = 70;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);

  return (
    <div className="card p-5 flex flex-col items-center">
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>FEAR &amp; GREED</h3>

      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Background arc segments */}
        {[
          { color: "#ff4466", start: 0,   end: 36  },
          { color: "#ff8844", start: 36,  end: 72  },
          { color: "#ffcc44", start: 72,  end: 108 },
          { color: "#44cc88", start: 108, end: 144 },
          { color: "#00ff88", start: 144, end: 180 },
        ].map(({ color: c, start, end }, i) => {
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
              opacity={0.25}
            />
          );
        })}

        {/* Gauge arc outline */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Colored arc up to score */}
        {(() => {
          const startAngle = -Math.PI;
          const endAngle = rad;
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
              strokeWidth="6"
              strokeLinecap="round"
            />
          );
        })()}

        {/* Needle */}
        <motion.line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ x2: cx - r, y2: cy }}
          animate={{ x2: nx, y2: ny }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <circle cx={cx} cy={cy} r="4" fill={color} />

        {/* Score */}
        <text x={cx} y={cy - 16} textAnchor="middle" fill={color} fontSize="20" fontWeight="700" fontFamily="monospace">
          {data.score}
        </text>
      </svg>

      <div className="text-sm font-semibold mt-1" style={{ color }}>{data.label}</div>
      {data.vix && (
        <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>VIX: {data.vix.toFixed(1)}</div>
      )}
    </div>
  );
}
