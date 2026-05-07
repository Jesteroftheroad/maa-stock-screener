"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import type { SmartMoneyFilters as Filters } from "@/types";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
}

const SECTORS = [
  "Technology", "Healthcare", "Financials", "Consumer Discretionary",
  "Industrials", "Energy", "Communication Services", "Utilities",
  "Real Estate", "Materials", "Consumer Staples",
];

const SIGNAL_TYPES = [
  "Bullish Flow", "Possible Accumulation", "Quiet Buying",
  "Insider Buying", "Momentum + Flow", "Distribution Signals",
];

export function SmartMoneyFilters({ filters, onChange, onReset }: Props) {
  const [local, setLocal] = useState<Filters>(filters);

  // Sync when parent resets (filters becomes {})
  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  function set(key: keyof Filters, raw: string) {
    setLocal(prev => {
      if (raw === "" || raw === undefined) {
        const next = { ...prev };
        delete (next as Record<string, unknown>)[key];
        return next;
      }
      return { ...prev, [key]: raw };
    });
  }

  function setNum(key: keyof Filters, raw: string) {
    setLocal(prev => {
      if (raw === "") {
        const next = { ...prev };
        delete (next as Record<string, unknown>)[key];
        return next;
      }
      return { ...prev, [key]: Number(raw) };
    });
  }

  function setBool(key: keyof Filters, raw: string) {
    setLocal(prev => {
      if (raw === "") {
        const next = { ...prev };
        delete (next as Record<string, unknown>)[key];
        return next;
      }
      return { ...prev, [key]: raw === "true" };
    });
  }

  function apply() {
    onChange({ ...local });
  }

  function reset() {
    setLocal({});
    onReset();
  }

  const inputCls =
    "w-full rounded-lg px-3 py-1.5 text-sm border outline-none focus:border-emerald-500/60 transition-colors";
  const inputStyle = {
    background: "var(--bg)",
    borderColor: "var(--border)",
    color: "var(--text)",
  } as React.CSSProperties;
  const labelCls = "block text-xs font-medium mb-1";
  const labelStyle = { color: "var(--muted)" } as React.CSSProperties;

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal size={15} className="text-emerald-400" />
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Advanced Filters
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

        <div>
          <label className={labelCls} style={labelStyle}>Min SM Score</label>
          <input
            type="number" min={0} max={100} placeholder="e.g. 65"
            value={(local.score_min as number | undefined) ?? ""}
            onChange={e => setNum("score_min", e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Min Call/Put Ratio</label>
          <input
            type="number" min={0} step={0.1} placeholder="e.g. 2.0"
            value={(local.cp_ratio_min as number | undefined) ?? ""}
            onChange={e => setNum("cp_ratio_min", e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Min Volume vs Avg</label>
          <input
            type="number" min={0} step={0.1} placeholder="e.g. 1.5"
            value={(local.vol_surge_min as number | undefined) ?? ""}
            onChange={e => setNum("vol_surge_min", e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Min Insider Buys (90d)</label>
          <input
            type="number" min={0} placeholder="e.g. 1"
            value={(local.insider_buys_min as number | undefined) ?? ""}
            onChange={e => setNum("insider_buys_min", e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Min Inst. Ownership</label>
          <input
            type="number" min={0} max={1} step={0.05} placeholder="0.5 = 50%"
            value={(local.inst_ownership_min as number | undefined) ?? ""}
            onChange={e => setNum("inst_ownership_min", e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Max RSI (oversold)</label>
          <input
            type="number" min={0} max={100} placeholder="e.g. 40"
            value={(local.rsi_max as number | undefined) ?? ""}
            onChange={e => setNum("rsi_max", e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Min Short Interest</label>
          <input
            type="number" min={0} max={1} step={0.01} placeholder="0.10 = 10%"
            value={(local.short_interest_min as number | undefined) ?? ""}
            onChange={e => setNum("short_interest_min", e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Sector</label>
          <select
            value={(local.sector as string | undefined) ?? ""}
            onChange={e => set("sector", e.target.value)}
            className={inputCls} style={inputStyle}
          >
            <option value="">All Sectors</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Signal Type</label>
          <select
            value={(local.signal_type as string | undefined) ?? ""}
            onChange={e => set("signal_type", e.target.value)}
            className={inputCls} style={inputStyle}
          >
            <option value="">All Signals</option>
            {SIGNAL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Price vs SMA50</label>
          <select
            value={
              local.above_sma50 === true ? "true"
              : local.above_sma50 === false ? "false"
              : ""
            }
            onChange={e => setBool("above_sma50", e.target.value)}
            className={inputCls} style={inputStyle}
          >
            <option value="">Any</option>
            <option value="true">Above SMA50</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mt-4 justify-end">
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 hover:bg-white/5 transition-all"
          style={{ color: "var(--muted)" }}
        >
          <RotateCcw size={12} />
          Reset
        </button>
        <button
          onClick={apply}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-all"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
