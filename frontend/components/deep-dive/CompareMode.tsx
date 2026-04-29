"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitCompare, Loader2, X } from "lucide-react";
import { fetchDeepDiveCompare } from "@/lib/api";
import { formatPrice, formatMarketCap } from "@/lib/utils";
import type { DeepDiveResult } from "@/types";

const FIELDS: { label: string; key: (d: DeepDiveResult) => string | number; higherBetter?: boolean }[] = [
  { label: "AI Score",            key: d => d.total_score,              higherBetter: true },
  { label: "Verdict",             key: d => d.verdict },
  { label: "Confidence",          key: d => `${d.confidence}%`,         higherBetter: true },
  { label: "Price",               key: d => formatPrice(d.price) ?? "—" },
  { label: "Market Cap",          key: d => formatMarketCap(d.market_cap) ?? "—" },
  { label: "Fund. Score",         key: d => d.fundamental_score,        higherBetter: true },
  { label: "Tech. Score",         key: d => d.technical_score,          higherBetter: true },
  { label: "Inst. Score",         key: d => d.institutional_score,      higherBetter: true },
  { label: "RSI",                 key: d => d.rsi.toFixed(1) },
  { label: "Trend",               key: d => d.trend },
  { label: "Breakout Prob.",      key: d => `${d.breakout_prob}%`,      higherBetter: true },
  { label: "Short Interest",      key: d => `${d.institutional.short_pct}%` },
  { label: "Inst. Ownership",     key: d => `${d.institutional.ownership_pct}%`, higherBetter: true },
  { label: "Analyst Rating",      key: d => d.analyst.rating_label },
  { label: "Analyst Upside",      key: d => `${d.analyst.upside_pct}%`, higherBetter: true },
  { label: "News Sentiment",      key: d => d.sentiment.news_sentiment },
  { label: "Risk Level",          key: d => d.risk_level },
];

const VERDICT_COLOR: Record<string, string> = {
  Bullish: "#00ff88", Neutral: "#ffcc44", Bearish: "#ff4466",
};

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 28; const circ = 2 * Math.PI * r; const dash = (score / 100) * circ;
  return (
    <svg width="70" height="70" viewBox="0 0 70 70">
      <circle cx="35" cy="35" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
      <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25} transform="rotate(-90 35 35)" />
      <text x="35" y="39" textAnchor="middle" fill={color} fontSize="14" fontWeight="800" fontFamily="monospace">{score}</text>
    </svg>
  );
}

export function CompareMode({ primaryTicker }: { primaryTicker: string }) {
  const [inputs, setInputs] = useState(["", ""]);
  const [tickers, setTickers] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["compare", tickers],
    queryFn: () => fetchDeepDiveCompare([primaryTicker, ...tickers.filter(Boolean)]),
    enabled: tickers.some(Boolean),
    staleTime: 1000 * 60 * 15,
  });

  const results: DeepDiveResult[] = data?.results?.filter((r: any) => !r.error) ?? [];

  const handleCompare = () => {
    const valid = inputs.map(s => s.trim().toUpperCase()).filter(Boolean);
    setTickers(valid);
  };

  const numericVals = (field: typeof FIELDS[number]) => {
    return results.map(d => {
      const v = field.key(d);
      return typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.-]/g, ""));
    });
  };

  const winner = (field: typeof FIELDS[number], idx: number): boolean => {
    if (!field.higherBetter) return false;
    const vals = numericVals(field);
    if (vals.some(isNaN)) return false;
    const best = Math.max(...vals);
    return vals[idx] === best;
  };

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center gap-2">
        <GitCompare size={18} style={{ color: "#4488ff" }} />
        <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Compare Mode</h3>
      </div>

      {/* Input row */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="rounded-lg px-3 py-2 border text-sm font-mono font-bold"
          style={{ borderColor: "#4488ff50", background: "rgba(68,136,255,0.1)", color: "#4488ff" }}>
          {primaryTicker}
        </div>
        <span className="text-sm" style={{ color: "var(--muted)" }}>vs</span>
        {[0, 1].map(i => (
          <div key={i} className="relative">
            <input
              value={inputs[i]}
              onChange={e => { const n = [...inputs]; n[i] = e.target.value.toUpperCase(); setInputs(n); }}
              onKeyDown={e => e.key === "Enter" && handleCompare()}
              placeholder={i === 0 ? "AAPL" : "Optional…"}
              maxLength={10}
              className="w-28 rounded-lg px-3 py-2 text-sm font-mono uppercase border outline-none focus:border-blue-500/50 transition-colors"
              style={{ background: "var(--card2)", borderColor: "var(--border)", color: "var(--text)" }}
            />
            {inputs[i] && (
              <button onClick={() => { const n = [...inputs]; n[i] = ""; setInputs(n); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                style={{ color: "var(--muted)" }}>
                <X size={11} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleCompare}
          disabled={!inputs.some(Boolean) || isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#4488ff,#00ccff)" }}>
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <GitCompare size={14} />}
          Compare
        </button>
      </div>

      {/* Comparison table */}
      {results.length >= 2 && (
        <div className="overflow-x-auto -mx-1 px-1">
          {/* Score rings header */}
          <div className="grid mb-4" style={{ gridTemplateColumns: `160px repeat(${results.length}, 1fr)` }}>
            <div />
            {results.map(d => {
              const vc = VERDICT_COLOR[d.verdict] ?? "#ffcc44";
              return (
                <div key={d.ticker} className="text-center space-y-1">
                  <ScoreRing score={d.total_score} color={vc} />
                  <div className="font-mono font-black text-base" style={{ color: vc }}>{d.ticker}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{d.name?.split(" ").slice(0, 2).join(" ")}</div>
                  <div className="text-xs font-semibold" style={{ color: vc }}>{d.verdict}</div>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {FIELDS.map(field => (
            <div key={field.label} className="grid py-1.5 border-b"
              style={{ gridTemplateColumns: `160px repeat(${results.length}, 1fr)`, borderColor: "var(--border)" }}>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{field.label}</span>
              {results.map((d, idx) => {
                const val = field.key(d);
                const isWinner = winner(field, idx);
                return (
                  <span key={d.ticker} className="text-xs font-mono text-center font-medium"
                    style={{ color: isWinner ? "#00ff88" : "var(--text)" }}>
                    {isWinner && <span className="mr-1">▲</span>}
                    {String(val)}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {results.length === 1 && !isLoading && tickers.some(Boolean) && (
        <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
          Enter at least one valid ticker to compare against {primaryTicker}
        </p>
      )}
    </div>
  );
}
