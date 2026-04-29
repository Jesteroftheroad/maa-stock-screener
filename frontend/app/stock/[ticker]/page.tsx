"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Heart, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MetricsTable } from "@/components/stock/MetricsTable";
import { AIAnalysisPanel } from "@/components/stock/AIAnalysisPanel";
import { NewsSection } from "@/components/stock/NewsSection";
import { StockCard } from "@/components/screener/StockCard";
import { ChangeIndicator } from "@/components/ui/ChangeIndicator";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { fetchStock, fetchSimilarStocks } from "@/lib/api";
import { formatPrice, formatMarketCap, formatVolume } from "@/lib/utils";

const PriceChart = dynamic(() => import("@/components/stock/PriceChart").then(m => ({ default: m.PriceChart })), { ssr: false });

export default function StockPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const { add, remove, has } = useWatchlistStore();
  const inWatchlist = has(ticker);

  const { data: stock, isLoading } = useQuery({
    queryKey: ["stock", ticker],
    queryFn: () => fetchStock(ticker),
    staleTime: 1000 * 60 * 5,
  });

  const { data: similar } = useQuery({
    queryKey: ["similar", ticker],
    queryFn: () => fetchSimilarStocks(ticker),
    staleTime: 1000 * 60 * 15,
    enabled: !!stock,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded" style={{ background: "var(--card)" }} />
        <div className="h-72 rounded-xl" style={{ background: "var(--card)" }} />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="card p-12 text-center">
        <p className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Stock not found: {ticker}</p>
        <Link href="/screener" className="text-blue-400 hover:underline text-sm">← Back to Screener</Link>
      </div>
    );
  }

  const isPositive = (stock.change_pct ?? 0) >= 0;

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link href="/screener" className="inline-flex items-center gap-1.5 text-xs hover:text-blue-400 transition-colors" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={12} /> Back to Screener
      </Link>

      {/* Stock header */}
      <div className="card p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono font-bold text-2xl" style={{ color: "var(--text)" }}>{stock.ticker}</span>
              {stock.country === "CA" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">TSX</span>
              )}
              {stock.website && (
                <a href={stock.website} target="_blank" rel="noopener noreferrer" className="text-muted-var hover:text-blue-400 transition-colors">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
            <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>{stock.name}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {stock.sector}{stock.industry ? ` · ${stock.industry}` : ""} · {stock.exchange}
            </p>
          </div>

          <div className="text-right">
            <div className="font-mono font-bold text-2xl" style={{ color: isPositive ? "var(--green)" : "var(--red)" }}>
              {formatPrice(stock.price)}
            </div>
            <ChangeIndicator value={stock.change_pct} size="md" />
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Cap: {formatMarketCap(stock.market_cap)} · Vol: {formatVolume(stock.volume)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => inWatchlist ? remove(ticker) : add(ticker, stock.name, stock.country)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all ${
              inWatchlist ? "border-red-500/40 text-red-400 bg-red-500/10" : "border-current text-muted-var hover:border-red-500/40 hover:text-red-400"
            }`}
            style={{ borderColor: inWatchlist ? undefined : "var(--border)" }}
          >
            <Heart size={13} fill={inWatchlist ? "currentColor" : "none"} />
            {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
          </button>
        </div>
      </div>

      {/* Chart */}
      <PriceChart ticker={stock.ticker} isPositive={isPositive} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <MetricsTable stock={stock} />
          <NewsSection news={stock.news} />
          {stock.description && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>About</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                {stock.description.slice(0, 600)}{stock.description.length > 600 ? "…" : ""}
              </p>
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          <AIAnalysisPanel data={stock.ai_score} />
        </div>
      </div>

      {/* Similar stocks */}
      {similar?.similar && similar.similar.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>SIMILAR STOCKS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {similar.similar.map((s: any, i: number) => (
              <div
                key={s.ticker}
                onClick={() => window.location.href = `/stock/${s.ticker}`}
                className="card p-3 cursor-pointer hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm" style={{ color: "var(--text)" }}>{s.ticker}</span>
                    <div className="text-xs truncate" style={{ color: "var(--muted)" }}>{s.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm" style={{ color: "var(--text)" }}>{formatPrice(s.price)}</div>
                    <ChangeIndicator value={s.change_pct} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
