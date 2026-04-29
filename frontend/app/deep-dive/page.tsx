"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Terminal, Zap, ChevronRight } from "lucide-react";
import { fetchDeepDive } from "@/lib/api";

import { ExecutiveSummary } from "@/components/deep-dive/ExecutiveSummary";
import { SmartMoneyPanel } from "@/components/deep-dive/SmartMoneyPanel";
import { TechnicalPanel } from "@/components/deep-dive/TechnicalPanel";
import { AnalystPanel } from "@/components/deep-dive/AnalystPanel";
import { SentimentPanel } from "@/components/deep-dive/SentimentPanel";
import { ScenarioPanel } from "@/components/deep-dive/ScenarioPanel";
import { TradeSetupPanel } from "@/components/deep-dive/TradeSetupPanel";
import { RedFlagsPanel } from "@/components/deep-dive/RedFlagsPanel";
import { AIExplanationPanel } from "@/components/deep-dive/AIExplanationPanel";
import { CompareMode } from "@/components/deep-dive/CompareMode";

const EXAMPLES = ["NVDA", "TSLA", "AAPL", "SOFI", "SHOP", "RKLB", "AMD", "PLTR"];

function DeepDiveInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTicker = searchParams.get("ticker") ?? "";

  const [input, setInput] = useState(initialTicker);
  const [activeTicker, setActiveTicker] = useState(initialTicker);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["deep-dive", activeTicker],
    queryFn: () => fetchDeepDive(activeTicker),
    staleTime: 1000 * 60 * 15,
    enabled: activeTicker.length > 0,
  });

  const handleSearch = () => {
    const t = input.trim().toUpperCase();
    if (!t) return;
    setActiveTicker(t);
    router.replace(`/deep-dive?ticker=${t}`, { scroll: false });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleExample = (ticker: string) => {
    setInput(ticker);
    setActiveTicker(ticker);
    router.replace(`/deep-dive?ticker=${ticker}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Terminal size={18} style={{ color: "#4488ff" }} />
            <h1 className="text-xl font-black tracking-tight" style={{ color: "var(--text)" }}>
              AI Deep Dive Terminal
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(68,136,255,0.15)", color: "#4488ff" }}>PREMIUM</span>
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Hedge-fund grade intelligence: fundamentals · technicals · smart money · scenarios · trade setups
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 space-y-3" style={{ border: "1px solid rgba(68,136,255,0.2)" }}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={handleKey}
              placeholder="Enter ticker symbol… (NVDA, TSLA, SHOP)"
              maxLength={12}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-mono uppercase border outline-none focus:border-blue-500/50 transition-colors"
              style={{ background: "var(--card2)", borderColor: "var(--border)", color: "var(--text)" }}
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!input.trim() || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#4488ff,#00ccff)" }}>
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Analyze
          </button>
        </div>

        {/* Quick examples */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: "var(--muted)" }}>Try:</span>
          {EXAMPLES.map(t => (
            <button key={t} onClick={() => handleExample(t)}
              className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium border transition-all hover:border-blue-500/40 hover:text-blue-400"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[
            "Fetching market data…",
            "Running fundamental analysis…",
            "Scanning institutional activity…",
            "Generating AI intelligence brief…",
          ].map((msg, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 card">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4488ff", animationDelay: `${i * 200}ms` }} />
              <span className="text-xs" style={{ color: "var(--muted)" }}>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="card p-8 text-center">
          <p className="text-red-400 font-medium">Analysis failed for {activeTicker}</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>The ticker may be invalid or data is unavailable. Try AAPL, NVDA, or TSLA.</p>
        </div>
      )}

      {/* No data yet */}
      {!data && !isLoading && !activeTicker && (
        <div className="card p-12 text-center space-y-3">
          <Terminal size={48} className="mx-auto opacity-20" style={{ color: "var(--muted)" }} />
          <p className="text-lg font-bold" style={{ color: "var(--text)" }}>Enter a ticker to begin your Deep Dive</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Get institutional-grade intelligence on any US or Canadian stock in seconds.</p>
          <div className="flex justify-center gap-2 flex-wrap pt-2">
            {["NVDA", "TSLA", "SHOP", "SOFI"].map(t => (
              <button key={t} onClick={() => handleExample(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono border transition-all hover:border-blue-500/40"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                {t} <ChevronRight size={12} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Not found */}
      {data && (data as any).error && (
        <div className="card p-8 text-center">
          <p className="font-medium" style={{ color: "var(--text)" }}>No data found for {activeTicker}</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Check the ticker symbol and try again.</p>
        </div>
      )}

      {/* Full results */}
      {data && !isLoading && !(data as any).error && (
        <div className="space-y-4">
          {/* Executive Summary — full width */}
          <ExecutiveSummary data={data} />

          {/* Row 2: Smart Money | Technical | Analyst */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SmartMoneyPanel data={data.institutional} />
            <TechnicalPanel data={data} />
            <AnalystPanel data={data.analyst} price={data.price} />
          </div>

          {/* Row 3: Sentiment | Scenario | AI Brief */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SentimentPanel data={data.sentiment} />
            <ScenarioPanel data={data} />
            <AIExplanationPanel data={data} />
          </div>

          {/* Row 4: Trade Setup | Red Flags */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TradeSetupPanel data={data.trade_setup} />
            <RedFlagsPanel flags={data.red_flags} />
          </div>

          {/* Row 5: Compare Mode */}
          <CompareMode primaryTicker={data.ticker} />
        </div>
      )}
    </div>
  );
}

export default function DeepDivePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--muted)" }} />
      </div>
    }>
      <DeepDiveInner />
    </Suspense>
  );
}
