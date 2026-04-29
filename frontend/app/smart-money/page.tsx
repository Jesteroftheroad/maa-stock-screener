"use client";

import { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, TrendingUp, AlertTriangle, Zap, Building2, RefreshCw } from "lucide-react";
import { SmartMoneyHeader } from "@/components/smart-money/SmartMoneyHeader";
import { SmartMoneyPresets } from "@/components/smart-money/SmartMoneyPresets";
import { SmartMoneyFilters } from "@/components/smart-money/SmartMoneyFilters";
import { SmartMoneyTable } from "@/components/smart-money/SmartMoneyTable";
import { SmartMoneyStockCard } from "@/components/smart-money/SmartMoneyStockCard";
import {
  fetchSmartMoneyOverview,
  fetchSmartMoneyScreen,
  fetchSmartMoneyPreset,
} from "@/lib/api";
import type { SmartMoneyFilters as Filters, SmartMoneyResult } from "@/types";

export default function SmartMoneyPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<SmartMoneyResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: overview } = useQuery({
    queryKey: ["sm-overview"],
    queryFn: fetchSmartMoneyOverview,
    staleTime: 5 * 60 * 1000,
  });

  const { data: screenData, isLoading: screenLoading, refetch } = useQuery({
    queryKey: ["sm-screen", filters, activePreset],
    queryFn: () =>
      activePreset
        ? fetchSmartMoneyPreset(activePreset)
        : fetchSmartMoneyScreen(filters),
    staleTime: 5 * 60 * 1000,
    enabled: activePreset !== null || Object.keys(filters).length > 0,
  });

  const { data: defaultData, isLoading: defaultLoading } = useQuery({
    queryKey: ["sm-default"],
    queryFn: () => fetchSmartMoneyScreen({}),
    staleTime: 10 * 60 * 1000,
    enabled: activePreset === null && Object.keys(filters).length === 0,
  });

  const isLoading = activePreset !== null || Object.keys(filters).length > 0 ? screenLoading : defaultLoading;
  const results = (activePreset !== null || Object.keys(filters).length > 0 ? screenData : defaultData)?.results ?? [];
  const totalScanned = (activePreset !== null || Object.keys(filters).length > 0 ? screenData : defaultData)?.scanned ?? 0;

  function handlePreset(name: string) {
    if (activePreset === name) {
      setActivePreset(null);
    } else {
      setActivePreset(name);
      setFilters({});
    }
  }

  function handleFilter(f: Filters) {
    setFilters(f);
    setActivePreset(null);
  }

  function handleReset() {
    setFilters({});
    setActivePreset(null);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Page header */}
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
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                showFilters
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "border-white/10 text-muted-var hover:bg-white/5"
              }`}
            >
              <AlertTriangle size={14} />
              Filters
            </button>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/5 transition-all"
              style={{ color: "var(--muted)" }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        {/* Header stat cards */}
        <SmartMoneyHeader overview={overview ?? null} />

        {/* Preset buttons */}
        <SmartMoneyPresets activePreset={activePreset} onSelect={handlePreset} />

        {/* Filters panel */}
        {showFilters && (
          <SmartMoneyFilters
            filters={filters}
            onChange={handleFilter}
            onReset={handleReset}
          />
        )}

        {/* Results table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {isLoading ? "Scanning..." : `${results.length} signals found`}
              </span>
              {totalScanned > 0 && !isLoading && (
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  from {totalScanned} stocks
                </span>
              )}
            </div>
            {(activePreset || Object.keys(filters).length > 0) && (
              <button
                onClick={handleReset}
                className="text-xs hover:text-current transition-colors"
                style={{ color: "var(--muted)" }}
              >
                Clear filters
              </button>
            )}
          </div>

          <SmartMoneyTable
            results={results}
            isLoading={isLoading}
            onRowClick={setSelectedStock}
          />
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-center pb-4" style={{ color: "var(--muted)" }}>
          Smart Money signals are estimates based on public data (options flow, SEC filings, volume patterns).
          Labels like "Possible Accumulation" or "Bullish Flow Detected" are analytical observations, not
          confirmed institutional intent. Always do your own research.
        </p>
      </div>

      {/* Stock detail slide-in */}
      {selectedStock && (
        <SmartMoneyStockCard
          result={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}
