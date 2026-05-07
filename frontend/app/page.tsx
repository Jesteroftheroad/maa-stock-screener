"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Search, Eye, Terminal, Zap, TrendingUp } from "lucide-react";
import { MarketOverviewCard } from "@/components/dashboard/MarketOverviewCard";
import { FearGreedMeter } from "@/components/dashboard/FearGreedMeter";
import { TrendingStocks } from "@/components/dashboard/TrendingStocks";
import { MarketCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { fetchMarketOverview, fetchFearGreed, fetchMovers } from "@/lib/api";

const QUICK_SCREENERS = [
  { label: "Warren Buffett",   preset: "buffett",            icon: "💎" },
  { label: "Undervalued Tech", preset: "undervalued_tech",   icon: "🔬" },
  { label: "Dividend Kings",   preset: "dividend_kings",     icon: "👑" },
  { label: "Breakout Today",   preset: "breakout_today",     icon: "🚀" },
  { label: "Short Squeeze",    preset: "short_squeeze",      icon: "⚡" },
  { label: "High Growth CA",   preset: "high_growth_ca",     icon: "🍁" },
  { label: "Peter Lynch",      preset: "peter_lynch_growth", icon: "📈" },
  { label: "Covered Calls",    preset: "covered_call",       icon: "🎯" },
];

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

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative text-center py-10 px-4 overflow-hidden">
        {/* Ambient glow blobs */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(68,136,255,0.08) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[300px] h-[120px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(170,68,255,0.06) 0%, transparent 70%)" }}
        />

        {/* Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-5 text-xs font-semibold tracking-wider uppercase"
          style={{ borderColor: "rgba(68,136,255,0.25)", background: "rgba(68,136,255,0.08)", color: "#4488ff" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Institutional-Grade Intelligence
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 leading-tight">
          <span className="gradient-text-blue">Smart Money</span>
          <br />
          <span style={{ color: "var(--text)" }}>at Your Fingertips</span>
        </h1>
        <p className="text-sm sm:text-base max-w-xl mx-auto mb-8" style={{ color: "var(--muted)" }}>
          Track institutional flow, unusual options activity, and insider signals —
          before they hit the mainstream.
        </p>

        {/* CTA row */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/screener"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg,#4488ff,#00ccff)", boxShadow: "0 0 24px rgba(68,136,255,0.3)" }}
          >
            <Search size={15} /> Open Screener <ArrowRight size={13} />
          </Link>
          <Link
            href="/smart-money"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.03] border"
            style={{
              borderColor: "rgba(170,68,255,0.35)",
              background: "rgba(170,68,255,0.08)",
              color: "#aa44ff",
              boxShadow: "0 0 20px rgba(170,68,255,0.12)",
            }}
          >
            <Eye size={15} /> Smart Money
          </Link>
          <Link
            href="/deep-dive"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.03] border"
            style={{
              borderColor: "rgba(0,255,136,0.25)",
              background: "rgba(0,255,136,0.06)",
              color: "#00ff88",
              boxShadow: "0 0 20px rgba(0,255,136,0.08)",
            }}
          >
            <Terminal size={15} /> Deep Dive
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-8 mt-8 flex-wrap">
          {[
            { label: "US Stocks", value: "500+" },
            { label: "Canadian Stocks", value: "100+" },
            { label: "ETFs Tracked", value: "60+" },
            { label: "AI Signals", value: "Real-time" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-lg font-bold number-font" style={{ color: "var(--text)" }}>{value}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Market Overview ───────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} style={{ color: "var(--muted)" }} />
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Live Market Overview
          </h2>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--green)" }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ovLoading
            ? Array.from({ length: 6 }).map((_, i) => <MarketCardSkeleton key={i} />)
            : marketItems.map((item, i) => (
                <MarketOverviewCard key={item.ticker} item={item} index={i} />
              ))}
        </div>
      </section>

      {/* ── Fear & Greed + Trending ───────────────────────────── */}
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

      {/* ── Quick Screeners ───────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={13} style={{ color: "#ffcc44" }} />
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Quick Screeners
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_SCREENERS.map(({ label, preset, icon }) => (
            <Link
              key={preset}
              href={`/screener?preset=${preset}`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all hover:scale-[1.02]"
              style={{
                borderColor: "var(--border)",
                background: "var(--card)",
                color: "var(--text)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(68,136,255,0.4)";
                (e.currentTarget as HTMLElement).style.color = "#4488ff";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.color = "var(--text)";
              }}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
