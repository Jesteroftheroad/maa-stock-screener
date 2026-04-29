"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterState } from "@/types";

const SECTORS = [
  "Technology", "Financial Services", "Healthcare", "Consumer Cyclical",
  "Consumer Defensive", "Industrials", "Energy", "Communication Services",
  "Real Estate", "Utilities", "Basic Materials",
];

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b pb-3 mb-3" style={{ borderColor: "var(--border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider py-1"
        style={{ color: "var(--muted)" }}
      >
        {title}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  );
}

function NumberInput({ label, field, filters, onChange, placeholder }: {
  label: string; field: keyof FilterState; filters: FilterState; onChange: (f: FilterState) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>{label}</label>
      <input
        type="number"
        placeholder={placeholder ?? "—"}
        value={(filters[field] as number | undefined) ?? ""}
        onChange={e => onChange({ ...filters, [field]: e.target.value ? Number(e.target.value) : undefined })}
        className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none focus:border-blue-500/60 transition-colors"
        style={{ background: "var(--card2)", borderColor: "var(--border)", color: "var(--text)" }}
      />
    </div>
  );
}

function CheckboxFilter({ label, field, filters, onChange }: {
  label: string; field: keyof FilterState; filters: FilterState; onChange: (f: FilterState) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
      <input
        type="checkbox"
        checked={!!(filters[field])}
        onChange={e => onChange({ ...filters, [field]: e.target.checked ? true : undefined })}
        className="rounded"
      />
      {label}
    </label>
  );
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const activeCount = Object.keys(filters).filter(k => filters[k as keyof FilterState] !== undefined).length;

  return (
    <div className="card p-4 h-fit sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Filters {activeCount > 0 && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{activeCount}</span>}
        </span>
        {activeCount > 0 && (
          <button
            onClick={() => onChange({})}
            className="text-xs flex items-center gap-1 hover:text-red-400 transition-colors"
            style={{ color: "var(--muted)" }}
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <Section title="Valuation">
        <NumberInput label="P/E Max" field="pe_max" filters={filters} onChange={onChange} placeholder="25" />
        <NumberInput label="P/E Min" field="pe_min" filters={filters} onChange={onChange} />
        <NumberInput label="Forward P/E Max" field="forward_pe_max" filters={filters} onChange={onChange} />
        <NumberInput label="PEG Max" field="peg_max" filters={filters} onChange={onChange} placeholder="1.0" />
      </Section>

      <Section title="Technical">
        <NumberInput label="RSI Min" field="rsi_min" filters={filters} onChange={onChange} placeholder="30" />
        <NumberInput label="RSI Max" field="rsi_max" filters={filters} onChange={onChange} placeholder="70" />
        <CheckboxFilter label="Above 20-Day MA" field="above_sma20" filters={filters} onChange={onChange} />
        <CheckboxFilter label="Above 50-Day MA" field="above_sma50" filters={filters} onChange={onChange} />
        <CheckboxFilter label="Above 200-Day MA" field="above_sma200" filters={filters} onChange={onChange} />
        <NumberInput label="Volume Surge ×" field="volume_surge" filters={filters} onChange={onChange} placeholder="1.5" />
      </Section>

      <Section title="Growth">
        <NumberInput label="Revenue Growth Min %" field="rev_growth_min" filters={filters} onChange={onChange} placeholder="10" />
        <NumberInput label="ROE Min %" field="roe_min" filters={filters} onChange={onChange} placeholder="15" />
      </Section>

      <Section title="Dividend" defaultOpen={false}>
        <NumberInput label="Yield Min %" field="div_yield_min" filters={filters} onChange={onChange} placeholder="2.5" />
        <NumberInput label="Payout Ratio Max %" field="payout_ratio_max" filters={filters} onChange={onChange} placeholder="75" />
      </Section>

      <Section title="Basics" defaultOpen={false}>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Sector</label>
          <select
            value={(filters.sector as string) ?? ""}
            onChange={e => onChange({ ...filters, sector: e.target.value || undefined })}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none focus:border-blue-500/60 transition-colors"
            style={{ background: "var(--card2)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            <option value="">All Sectors</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Country</label>
          <select
            value={(filters.country as string) ?? ""}
            onChange={e => onChange({ ...filters, country: e.target.value || undefined })}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none focus:border-blue-500/60"
            style={{ background: "var(--card2)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            <option value="">US + Canada</option>
            <option value="US">US Only</option>
            <option value="CA">Canada Only</option>
          </select>
        </div>
        <NumberInput label="Price Min ($)" field="price_min" filters={filters} onChange={onChange} />
        <NumberInput label="Price Max ($)" field="price_max" filters={filters} onChange={onChange} placeholder="50" />
        <NumberInput label="Debt/Equity Max" field="debt_max" filters={filters} onChange={onChange} placeholder="1.5" />
      </Section>

      <Section title="AI Score" defaultOpen={false}>
        <NumberInput label="Min AI Score (0-100)" field="ai_score_min" filters={filters} onChange={onChange} placeholder="60" />
      </Section>
    </div>
  );
}
