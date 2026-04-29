"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { MarketOverviewCard } from "@/components/dashboard/MarketOverviewCard";
import { FearGreedMeter } from "@/components/dashboard/FearGreedMeter";
import { TrendingStocks } from "@/components/dashboard/TrendingStocks";
import { MarketCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { fetchMarketOverview, fetchFearGreed, fetchMovers } from "@/lib/api";

export default function DashboardPage() {
  const { data: overview, isLoading: ovLoading } = useQuery({
    queryKey: ["market-overview"],
    queryFn: fetchMarketOverview,
    refetchInterval: 60_000,
  });

  const { data: fearGreed } = useQuery({
    queryKey: ["fear-greed"],
    queryFn: fetchFearGreed,
    refetchInterval: 5 * 60_000,
  });

  const { data: movers } = useQuery({
    queryKey: ["movers"],
    queryFn: fetchMovers,
    refetchInterval: 5 * 60_000,
  });

  const marketItems = overview ? Object.values(overview) : [];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            AI-Powered
          </span>{" "}
          Stock Screener
        </h1>
        <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
          Discover undervalued, momentum &amp; dividend stocks — US &amp; Canada
        </p>
        <Link
          href="/screener"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.03]"
          style={{ background: "linear-gradient(135deg,#4488ff,#00ccff)" }}
        >
          <Search size={16} /> Open Screener <ArrowRight size={14} />
        </Link>
      </div>

      {/* Market Overview */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
          Market Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ovLoading
            ? Array.from({ length: 6 }).map((_, i) => <MarketCardSkeleton key={i} />)
            : marketItems.map((item, i) => (
                <MarketOverviewCard key={item.ticker} item={item} index={i} />
              ))}
        </div>
      </section>

      {/* Fear & Greed + Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          {fearGreed ? (
            <FearGreedMeter data={fearGreed} />
          ) : (
            <div className="card p-5 flex items-center justify-center h-48">
              <span style={{ color: "var(--muted)" }} className="text-sm">Loading sentiment…</span>
            </div>
          )}
        </div>
        <div className="lg:col-span-3">
          {movers ? (
            <TrendingStocks gainers={movers.gainers} losers={movers.losers} />
          ) : (
            <div className="card p-5 flex items-center justify-center h-48">
              <span style={{ color: "var(--muted)" }} className="text-sm">Loading movers…</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick preset links */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
          Quick Screeners
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Warren Buffett",   preset: "buffett" },
            { label: "Undervalued Tech", preset: "undervalued_tech" },
            { label: "Dividend Kings",   preset: "dividend_kings" },
            { label: "Breakout Today",   preset: "breakout_today" },
            { label: "Short Squeeze",    preset: "short_squeeze" },
            { label: "High Growth CA",   preset: "high_growth_ca" },
            { label: "Peter Lynch",      preset: "peter_lynch_growth" },
            { label: "Covered Calls",    preset: "covered_call" },
          ].map(({ label, preset }) => (
            <Link
              key={preset}
              href={`/screener?preset=${preset}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:border-blue-500/60 hover:text-blue-400"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
