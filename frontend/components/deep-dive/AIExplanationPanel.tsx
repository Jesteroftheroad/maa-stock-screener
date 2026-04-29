"use client";

import { Brain } from "lucide-react";
import type { DeepDiveResult } from "@/types";

export function AIExplanationPanel({ data }: { data: DeepDiveResult }) {
  const verdictColor =
    data.verdict === "Bullish" ? "#00ff88" :
    data.verdict === "Bearish" ? "#ff4466" : "#ffcc44";

  return (
    <div className="card p-4 space-y-4 h-full" style={{ border: `1px solid ${verdictColor}20` }}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: `${verdictColor}15`, color: verdictColor }}>
          <Brain size={13} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          AI Intelligence Brief
        </h3>
      </div>

      {/* Chat bubble */}
      <div className="rounded-xl p-4" style={{ background: "var(--card2)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: verdictColor, color: "#0a0a0f" }}>AI</div>
          <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>MAA Intelligence Engine</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
          {data.ai_explanation}
        </p>
      </div>

      {/* Score breakdown visual */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Graham Fair Value", value: data.ai_score.fair_value ? `$${data.ai_score.fair_value.toFixed(2)}` : "N/A", color: "#4488ff" },
          { label: "AI Score", value: `${data.total_score}/100`, color: verdictColor },
          { label: "Risk Level", value: data.risk_level, color: data.risk_level === "Low" ? "#00ff88" : data.risk_level === "Medium" ? "#ffcc44" : "#ff4466" },
          { label: "Confidence", value: `${data.confidence}%`, color: verdictColor },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg p-2.5 text-center" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)" }}>
            <div className="text-sm font-mono font-bold" style={{ color }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Bull / Bear case */}
      <div className="space-y-2">
        <div className="rounded-lg p-3" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)" }}>
          <div className="text-xs font-semibold text-green-400 mb-1">↑ AI BULL CASE</div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{data.ai_score.bull_case}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "rgba(255,68,102,0.06)", border: "1px solid rgba(255,68,102,0.2)" }}>
          <div className="text-xs font-semibold text-red-400 mb-1">↓ AI BEAR CASE</div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{data.ai_score.bear_case}</p>
        </div>
      </div>
    </div>
  );
}
