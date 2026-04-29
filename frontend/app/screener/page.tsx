"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Filter, Loader2 } from "lucide-react";
import { FilterPanel } from "@/components/screener/FilterPanel";
import { PresetButtons } from "@/components/screener/PresetButtons";
import { StockCard } from "@/components/screener/StockCard";
import { StockCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { fetchScreener, fetchPreset } from "@/lib/api";
import type { FilterState } from "@/types";

function ScreenerInner() {
  const searchParams = useSearchParams();
  const presetParam = searchParams.get("preset");

  const [filters, setFilters] = useState<FilterState>({});
  const [activePreset, setActivePreset] = useState<string | null>(presetParam);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (presetParam) setActivePreset(presetParam);
  }, [presetParam]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: activePreset ? ["preset", activePreset] : ["screener", filters],
    queryFn: () => activePreset ? fetchPreset(activePreset) : fetchScreener(filters),
    staleTime: 1000 * 60 * 5,
    enabled: activePreset != null || Object.keys(filters).length > 0,
  });

  const handleFilterChange = useCallback((f: FilterState) => {
    setFilters(f);
    setActivePreset(null);
  }, []);

  const handlePresetSelect = useCallback((preset: string) => {
    setActivePreset(p => p === preset ? null : preset);
    setFilters({});
  }, []);

  const results = data?.results ?? [];
  const isRunning = isLoading || isFetching;
  const hasQuery = activePreset != null || Object.keys(filters).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Stock Screener</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {data ? `${data.total} results from ${data.scanned} stocks${data.cached ? " (cached)" : ""}` : "Apply filters to screen stocks"}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          <Filter size={14} /> Filters
        </button>
      </div>

      <PresetButtons activePreset={activePreset} onSelect={handlePresetSelect} />

      <div className="flex gap-4">
        <div className={`w-64 flex-shrink-0 ${showFilters ? "block" : "hidden"} lg:block`}>
          <FilterPanel filters={filters} onChange={handleFilterChange} />
        </div>

        <div className="flex-1 min-w-0">
          {isRunning && (
            <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "var(--muted)" }}>
              <Loader2 size={14} className="animate-spin" /> Scanning universe…
            </div>
          )}

          {!hasQuery && !isRunning && (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium mb-1" style={{ color: "var(--text)" }}>Select a preset or apply filters</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Try "Buffett" or "Dividend Kings" to get started</p>
            </div>
          )}

          {isLoading && hasQuery && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => <StockCardSkeleton key={i} />)}
            </div>
          )}

          {!isLoading && results.length === 0 && hasQuery && (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-medium mb-1" style={{ color: "var(--text)" }}>No stocks matched</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Try relaxing the filters</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {results.map((stock, i) => (
                <StockCard key={stock.ticker} stock={stock} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScreenerPage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
        {Array.from({ length: 9 }).map((_, i) => <StockCardSkeleton key={i} />)}
      </div>
    }>
      <ScreenerInner />
    </Suspense>
  );
}
