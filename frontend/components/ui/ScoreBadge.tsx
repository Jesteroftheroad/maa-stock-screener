"use client";

interface ScoreBadgeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
}

function getScoreStyle(score: number): { color: string; bg: string; border: string; glow: string } {
  if (score >= 70) return {
    color: "#00ff88",
    bg:    "rgba(0,255,136,0.1)",
    border:"rgba(0,255,136,0.25)",
    glow:  "0 0 10px rgba(0,255,136,0.2)",
  };
  if (score >= 50) return {
    color: "#ffcc44",
    bg:    "rgba(255,204,68,0.1)",
    border:"rgba(255,204,68,0.25)",
    glow:  "0 0 10px rgba(255,204,68,0.15)",
  };
  if (score >= 30) return {
    color: "#ff8844",
    bg:    "rgba(255,136,68,0.1)",
    border:"rgba(255,136,68,0.25)",
    glow:  "0 0 10px rgba(255,136,68,0.12)",
  };
  return {
    color: "#ff4466",
    bg:    "rgba(255,68,102,0.1)",
    border:"rgba(255,68,102,0.25)",
    glow:  "0 0 10px rgba(255,68,102,0.12)",
  };
}

export function ScoreBadge({ score, label, size = "md", showScore = true }: ScoreBadgeProps) {
  const style = getScoreStyle(score);

  const padding = { sm: "px-2 py-0.5", md: "px-2.5 py-1", lg: "px-3 py-1.5" }[size];
  const fontSize = { sm: "text-[10px]", md: "text-xs", lg: "text-sm" }[size];
  const scoreSize = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];

  return (
    <div className="inline-flex items-center gap-1.5">
      {showScore && (
        <span
          className={`number-font font-bold ${scoreSize}`}
          style={{ color: style.color, textShadow: style.glow }}
        >
          {score}
        </span>
      )}
      <span
        className={`${padding} ${fontSize} font-semibold rounded-full whitespace-nowrap`}
        style={{
          color: style.color,
          background: style.bg,
          border: `1px solid ${style.border}`,
          boxShadow: style.glow,
        }}
      >
        {label}
      </span>
    </div>
  );
}
