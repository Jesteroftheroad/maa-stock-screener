"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChangeIndicatorProps {
  value: number | null | undefined;
  suffix?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function ChangeIndicator({ value, suffix = "%", size = "md", showIcon = true }: ChangeIndicatorProps) {
  if (value == null) return <span className="text-muted-var">—</span>;

  const isPositive = value >= 0;
  const isNeutral = Math.abs(value) < 0.01;

  const textSize = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];
  const iconSize = { sm: 12, md: 14, lg: 16 }[size];

  const colorClass = isNeutral
    ? "text-muted-var"
    : isPositive
    ? "text-positive"
    : "text-negative";

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <span className={cn("flex items-center gap-0.5 font-mono font-medium", textSize, colorClass)}>
      {showIcon && <Icon size={iconSize} />}
      {isPositive && !isNeutral ? "+" : ""}
      {value.toFixed(2)}{suffix}
    </span>
  );
}
