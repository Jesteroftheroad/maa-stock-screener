"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, SlidersHorizontal, RefreshCw, MousePointerClick } from "lucide-react";
import { SmartMoneyHeader } from "@/components/smart-money/SmartMoneyHeader";
import { SmartMoneyPresets } from "@/components/smart-money/SmartMoneyPresets";
import { SmartMoneyFilters } from "@/components/smart-money/SmartMoneyFilters";
import { SmartMoneyTable } from "@/components/smart-money/SmartMoneyTable";
import { SmartMoneyStockCard } from "@/components/smart-money/SmartMoneyStockCard";
import { TopStocksToWatch } from "@/components/smart-money/TopStocksToWatch";
import {
  fetchSmartMoneyOverview,
  fetchSmartMoneyScreen,
  fetchSmartMoneyPreset,
} from "@/lib/api";
import type { SmartMoneyFilters as Filters, SmartMoneyResult } from "@/types";

export default function SmartMoneyPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<Filters>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<SmartMoneyResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  // Track whether user has intentionally triggered a scan
  const [scanTriggered, setScanTriggered] = useState(false);

  const hasActiveFilter = activePreset !== null || Object.keys(filters).length > 0;

  /* ── Header stats (small 20-stock sample, fast) ─────────────── */
  const { data: overview } = useQuery({
    queryKey: ["sm-overview"],
    queryFn: fetchSmartMoneyOverview,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  /* ── Main scan query — only runs when user has picked something ─ */
  const {
    data: scanData,
    isLoading: scanLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["sm-scan", activePreset, filters],
    queryFn: () =>
      activePreset
        ? fetchSmartMoneyPreset(activePreset)
        : fetchSmartMoneyScreen(filters),
    staleTime: 5 * 60 * 1000,
    enabled: scanTriggered && (hasActiveFilter),
    retry: 1,
  });

  const results = scanData?.results ?? [];
  const totalScanned = scanData?.scanned ?? 0;
  const isLoading = scanLoading || isFetching;

  /* ── Handlers ─────────────────────────────────────────────────── */
  function handlePreset(name: string) {
    if (activePreset === name) {
      setActivePreset(null);
      setScanTriggered(false);
    } else {
      setActivePreset(name);
      setFilters({});
      setScanTriggered(true);
    }
  }

  function handleFilter(f: Filters) {
    setFilters(f);
    setActivePreset(null);
    setScanTriggered(true);
  }

  function handleReset() {
    setFilters({});
    setActivePreset(null);
    setScanTriggered(false);
  }

  function handleRefresh() {
    if (hasActiveFilter && scanTriggered) {
      qc.invalidateQueries({ queryKey: ["sm-scan"] });
      refetch();
    } else {
      qc.invalidateQueries({ queryKey: ["sm-overview"] });
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                <Eye size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                Smart Money Screener
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PREMIUM
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Signals of institutional accumulation, options flow & insider activity. Not financial advice.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                showFilters
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "border-white/10 hover:bg-white/5"
              }`}
              style={!showFilters ? { color: "var(--muted)" } : undefined}
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/5 transition-all disabled:opacity-50"
              style={{ color: "var(--muted)" }}
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Header stat cards ────────────────────────────────────── */}
        <SmartMoneyHeader overview={overview ?? null} />

        {/* ── Top 10 AI Score 70+ ─────────────────────────────────── */}
        <TopStocksToWatch />

        {/* ── Preset buttons ────────────────────────────────────────── */}
        <SmartMoneyPresets activePreset={activePreset} onSelect={handlePreset} />

        {/* ── Filters panel ─────────────────────────────────────────── */}
        {showFilters && (
          <SmartMoneyFilters
            key={JSON.stringify(filters)}   /* re-mount when parent resets */
            filters={filters}
            onChange={handleFilter}
            onReset={handleReset}
          />
        )}

        {/* ── Results ───────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {!scanTriggered
                  ? "Select a preset or apply filters to scan"
                  : isLoading
                  ? "Scanning market…"
                  : `${results.length} signal${results.length !== 1 ? "s" : ""} found`}
              </span>
              {totalScanned > 0 && !isLoading && (
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  from {totalScanned} stocks
                </span>
              )}
            </div>
            {hasActiveFilter && (
              <button
                onClick={handleReset}
                className="text-xs hover:text-current transition-colors"
                style={{ color: "var(--muted)" }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Idle state — show a prompt before any scan */}
          {!scanTriggered ? (
            <IdlePrompt />
          ) : (
            <SmartMoneyTable
              results={results}
              isLoading={isLoading}
              onRowClick={setSelectedStock}
            />
          )}
        </div>

        {/* ── Disclaimer ────────────────────────────────────────────── */}
        <p className="text-xs text-center pb-4" style={{ color: "var(--muted)" }}>
          Smart Money signals are estimates derived from public data (options flow, SEC filings, volume patterns).
          Labels like "Possible Accumulation" are analytical observations — not confirmed institutional intent.
          Always conduct your own research before acting.
        </p>
      </div>

      {/* ── Stock detail slide-in ──────────────────────────────────── */}
      {selectedStock && (
        <SmartMoneyStockCard
          result={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}

function IdlePrompt() {
  return (
    <div
      className="rounded-xl border py-14 flex flex-col items-center justify-center gap-3"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <MousePointerClick size={22} className="text-emerald-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Choose a preset to start scanning
        </p>
        <p className="text-xs mt-1 max-w-xs" style={{ color: "var(--muted)" }}>
          Pick one of the quick filters above, or open the Filters panel to
          build a custom smart money scan.
        </p>
      </div>
    </div>
  );
}
