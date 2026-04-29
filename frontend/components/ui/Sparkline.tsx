"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  isPositive?: boolean;
  width?: number;
  height?: number;
}

export function Sparkline({ data, isPositive, width = 80, height = 36 }: SparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="opacity-20 bg-current rounded" />;
  }

  const positive = isPositive ?? (data[data.length - 1] >= data[0]);
  const color = positive ? "#00ff88" : "#ff4466";
  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          dot={false}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
