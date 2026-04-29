"use client";

import { AlertTriangle, CheckCircle } from "lucide-react";

export function RedFlagsPanel({ flags }: { flags: string[] }) {
  const clean = flags.length === 0;

  return (
    <div className="card p-4 h-full" style={clean ? { border: "1px solid rgba(0,255,136,0.2)" } : { border: "1px solid rgba(255,204,68,0.2)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md flex items-center justify-center"
          style={clean ? { background: "rgba(0,255,136,0.15)", color: "#00ff88" } : { background: "rgba(255,204,68,0.15)", color: "#ffcc44" }}>
          {clean ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
        </div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Red Flags Detector</h3>
        {!clean && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(255,68,102,0.15)", color: "#ff4466" }}>
            {flags.length} issue{flags.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {clean ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircle size={36} style={{ color: "#00ff88", opacity: 0.8 }} className="mb-2" />
          <p className="text-sm font-semibold" style={{ color: "#00ff88" }}>No Red Flags Detected</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            This stock passes all major risk filters — debt, insider activity, valuation, and technical health.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {flags.map((flag, i) => {
            const isWarn = flag.startsWith("⚠");
            const text = flag.replace("⚠ ", "");
            return (
              <div key={i} className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
                style={{
                  background: isWarn ? "rgba(255,68,102,0.08)" : "rgba(255,204,68,0.06)",
                  border: `1px solid ${isWarn ? "rgba(255,68,102,0.25)" : "rgba(255,204,68,0.2)"}`,
                }}>
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: isWarn ? "#ff4466" : "#ffcc44" }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
