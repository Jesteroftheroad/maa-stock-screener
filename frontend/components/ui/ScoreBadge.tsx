"use client";

import { cn, getLabelStyle } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
}

export function ScoreBadge({ score, label, size = "md", showScore = true }: ScoreBadgeProps) {
  const sizeClass = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  }[size];

  return (
    <div className="flex items-center gap-1.5">
      {showScore && (
        <span className={cn("font-mono font-bold", {
          "text-green-400": score >= 70,
          "text-yellow-400": score >= 50 && score < 70,
          "text-orange-400": score >= 30 && score < 50,
          "text-red-400": score < 30,
          "text-xs": size === "sm",
          "text-sm": size === "md",
          "text-base": size === "lg",
        })}>
          {score}
        </span>
      )}
      <span className={cn("rounded-full font-medium whitespace-nowrap", sizeClass, getLabelStyle(label))}>
        {label}
      </span>
    </div>
  );
}
