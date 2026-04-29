"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Search, Bookmark } from "lucide-react";
import { ChangeIndicator } from "@/components/ui/ChangeIndicator";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { fetchWatchlist } from "@/lib/api";
import { formatPrice, formatMarketCap } from "@/lib/utils";
import Link from "next/link";

export default function WatchlistPage() {
  const router = useRouter();
  const { tickers, remove } = useWatchlistStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["watchlist", tickers],
    queryFn: fetchWatchlist,
    staleTime: 1000 * 60 * 2,
    enabled: tickers.length > 0,
  });

  const items = data?.watchlist ?? [];

  if (tickers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Bookmark size={48} className="mb-4 opacity-20" style={{ color: "var(--muted)" }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Your watchlist is empty</h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Add stocks from the screener to track them here</p>
        <Link
          href="/screener"
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm text-white"
          style={{ background: "linear-gradient(135deg,#4488ff,#00ccff)" }}
        >
          <Search size={14} /> Open Screener
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Watchlist</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{tickers.length} stocks tracked</p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:border-blue-500/40 hover:text-blue-400"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: tickers.length }).map((_, i) => (
            <div key={i} className="card p-4 h-16 animate-pulse" style={{ background: "var(--card)" }} />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
               style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
            <span className="col-span-3">Ticker</span>
            <span className="col-span-2 text-right">Price</span>
            <span className="col-span-2 text-right">Change</span>
            <span className="col-span-3 text-right">Added</span>
            <span className="col-span-2 text-right">Remove</span>
          </div>

          {/* Rows */}
          {(items.length > 0 ? items : tickers.map(t => ({ ticker: t, name: "", country: "US", added_at: "", notes: "", price: null, change_pct: null, id: 0 }))).map((item) => (
            <div
              key={item.ticker}
              className="grid grid-cols-12 px-4 py-3 border-b items-center hover:bg-white/2 transition-colors cursor-pointer"
              style={{ borderColor: "var(--border)" }}
              onClick={() => router.push(`/stock/${item.ticker}`)}
            >
              <div className="col-span-3">
                <div className="font-mono font-bold text-sm" style={{ color: "var(--text)" }}>{item.ticker}</div>
                {item.name && <div className="text-xs truncate" style={{ color: "var(--muted)" }}>{item.name}</div>}
              </div>
              <div className="col-span-2 text-right font-mono text-sm" style={{ color: "var(--text)" }}>
                {formatPrice(item.price)}
              </div>
              <div className="col-span-2 flex justify-end">
                <ChangeIndicator value={item.change_pct} size="sm" />
              </div>
              <div className="col-span-3 text-right text-xs" style={{ color: "var(--muted)" }}>
                {item.added_at ? new Date(item.added_at).toLocaleDateString() : "—"}
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); remove(item.ticker); }}
                  className="p-1.5 rounded hover:text-red-400 transition-colors"
                  style={{ color: "var(--muted)" }}
                  aria-label="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
