import { useState } from "react";
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

  function update(key: keyof Filters, value: string | number | boolean | undefined) {
    const next = { ...local, [key]: value === "" ? undefined : value };
    setLocal(next);
  }

  function apply() {
    const clean: Filters = {};
    for (const [k, v] of Object.entries(local)) {
      if (v !== undefined && v !== "" && v !== null) {
        (clean as Record<string, unknown>)[k] = v;
      }
    }
    onChange(clean);
  }

  function reset() {
    setLocal({});
    onReset();
  }

  const inputCls = "w-full rounded-lg px-3 py-1.5 text-sm border outline-none focus:border-emerald-500/60 transition-colors";
  const inputStyle = {
    background: "var(--bg)",
    borderColor: "var(--border)",
    color: "var(--text)",
  };

  const labelCls = "block text-xs font-medium mb-1";
  const labelStyle = { color: "var(--muted)" };

  return (
    <div className="rounded-xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-emerald-400" />
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Advanced Filters</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

        {/* Score */}
        <div>
          <label className={labelCls} style={labelStyle}>Min Smart Money Score</label>
          <input
            type="number" min={0} max={100}
            placeholder="e.g. 65"
            value={local.score_min ?? ""}
            onChange={e => update("score_min", e.target.value ? Number(e.target.value) : undefined)}
            className={inputCls} style={inputStyle}
          />
        </div>

        {/* C/P Ratio */}
        <div>
          <label className={labelCls} style={labelStyle}>Min Call/Put Ratio</label>
          <input
            type="number" min={0} step={0.1}
            placeholder="e.g. 2.0"
            value={local.cp_ratio_min ?? ""}
            onChange={e => update("cp_ratio_min", e.target.value ? Number(e.target.value) : undefined)}
            className={inputCls} style={inputStyle}
          />
        </div>

        {/* Volume surge */}
        <div>
          <label className={labelCls} style={labelStyle}>Min Volume vs Avg</label>
          <input
            type="number" min={0} step={0.1}
            placeholder="e.g. 1.5"
            value={local.vol_surge_min ?? ""}
            onChange={e => update("vol_surge_min", e.target.value ? Number(e.target.value) : undefined)}
            className={inputCls} style={inputStyle}
          />
        </div>

        {/* Insider buys */}
        <div>
          <label className={labelCls} style={labelStyle}>Min Insider Buys (90d)</label>
          <input
            type="number" min={0}
            placeholder="e.g. 1"
            value={local.insider_buys_min ?? ""}
            onChange={e => update("insider_buys_min", e.target.value ? Number(e.target.value) : undefined)}
            className={inputCls} style={inputStyle}
          />
        </div>

        {/* Institutional ownership */}
        <div>
          <label className={labelCls} style={labelStyle}>Min Inst. Ownership</label>
          <input
            type="number" min={0} max={1} step={0.05}
            placeholder="e.g. 0.5 = 50%"
            value={local.inst_ownership_min ?? ""}
            onChange={e => update("inst_ownership_min", e.target.value ? Number(e.target.value) : undefined)}
            className={inputCls} style={inputStyle}
          />
        </div>

        {/* RSI max */}
        <div>
          <label className={labelCls} style={labelStyle}>Max RSI (oversold)</label>
          <input
            type="number" min={0} max={100}
            placeholder="e.g. 40"
            value={local.rsi_max ?? ""}
            onChange={e => update("rsi_max", e.target.value ? Number(e.target.value) : undefined)}
            className={inputCls} style={inputStyle}
          />
        </div>

        {/* Short interest */}
        <div>
          <label className={labelCls} style={labelStyle}>Min Short Interest</label>
          <input
            type="number" min={0} max={1} step={0.01}
            placeholder="e.g. 0.10 = 10%"
            value={local.short_interest_min ?? ""}
            onChange={e => update("short_interest_min", e.target.value ? Number(e.target.value) : undefined)}
            className={inputCls} style={inputStyle}
          />
        </div>

        {/* Sector */}
        <div>
          <label className={labelCls} style={labelStyle}>Sector</label>
          <select
            value={local.sector ?? ""}
            onChange={e => update("sector", e.target.value || undefined)}
            className={inputCls} style={inputStyle}
          >
            <option value="">All Sectors</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Signal type */}
        <div>
          <label className={labelCls} style={labelStyle}>Signal Type</label>
          <select
            value={local.signal_type ?? ""}
            onChange={e => update("signal_type", e.target.value || undefined)}
            className={inputCls} style={inputStyle}
          >
            <option value="">All Signals</option>
            {SIGNAL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Above SMA50 */}
        <div>
          <label className={labelCls} style={labelStyle}>Price vs SMA50</label>
          <select
            value={local.above_sma50 === true ? "true" : local.above_sma50 === false ? "false" : ""}
            onChange={e => update("above_sma50", e.target.value === "" ? undefined : e.target.value === "true")}
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
