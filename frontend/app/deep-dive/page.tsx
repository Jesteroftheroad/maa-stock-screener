"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Terminal, Zap, TrendingUp, BarChart2, X } from "lucide-react";
import { fetchDeepDive, fetchSearch } from "@/lib/api";
import type { SearchResult } from "@/types";

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

const EXAMPLES = ["NVDA", "TSLA", "AAPL", "SOFI", "SHOP.TO", "RKLB", "AMD", "PLTR", "SPY", "QQQ"];

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function DeepDiveInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTicker = searchParams.get("ticker") ?? "";

  const [input, setInput]             = useState(initialTicker);
  const [activeTicker, setActiveTicker] = useState(initialTicker);
  const [suggestions, setSuggestions]  = useState<SearchResult[]>([]);
  const [showSug, setShowSug]          = useState(false);
  const [activeIdx, setActiveIdx]      = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["deep-dive", activeTicker],
    queryFn: () => fetchDeepDive(activeTicker),
    staleTime: 1000 * 60 * 15,
    enabled: activeTicker.length > 0,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) { setSuggestions([]); return; }
      const res = await fetchSearch(q);
      setSuggestions(res?.results ?? []);
    }, 220),
    []
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInput(v);
    setActiveIdx(-1);
    if (v.trim().length >= 1) { doSearch(v); setShowSug(true); }
    else { setSuggestions([]); setShowSug(false); }
  }

  function runDive(ticker: string) {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setInput(t);
    setActiveTicker(t);
    setSuggestions([]);
    setShowSug(false);
    router.replace(`/deep-dive?ticker=${t}`, { scroll: false });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter") {
      if (activeIdx >= 0 && suggestions[activeIdx]) runDive(suggestions[activeIdx].ticker);
      else runDive(input);
    }
    if (e.key === "Escape") { setShowSug(false); setSuggestions([]); }
  }

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowSug(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleExample = (ticker: string) => runDive(ticker);

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
          <div className="relative flex-1" ref={wrapRef}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 z-10" style={{ color: "var(--muted)" }} />
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onFocus={() => input.trim() && suggestions.length > 0 && setShowSug(true)}
              onKeyDown={handleKey}
              placeholder="Ticker or company name… (NVDA, Apple, SPY, QQQ)"
              maxLength={40}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none focus:border-blue-500/50 transition-colors"
              style={{ background: "var(--card2)", borderColor: "var(--border)", color: "var(--text)" }}
              autoFocus
              autoComplete="off"
            />

            {/* Autocomplete dropdown */}
            {showSug && suggestions.length > 0 && (
              <div
                className="absolute top-full mt-1 left-0 right-0 rounded-xl border shadow-2xl z-50 overflow-hidden"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                {suggestions.map((r, idx) => (
                  <button
                    key={r.ticker}
                    onMouseDown={() => runDive(r.ticker)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                    style={{ background: idx === activeIdx ? "rgba(255,255,255,0.06)" : "transparent" }}
                  >
                    <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
                      r.type === "ETF" ? "bg-blue-500/15" : "bg-emerald-500/15"
                    }`}>
                      {r.type === "ETF"
                        ? <BarChart2 size={13} className="text-blue-400" />
                        : <TrendingUp size={13} className="text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm font-mono" style={{ color: "var(--text)" }}>{r.ticker}</span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                          r.type === "ETF"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        }`}>{r.type}</span>
                      </div>
                      <div className="text-xs truncate" style={{ color: "var(--muted)" }}>{r.name}</div>
                    </div>
                    <div className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>{r.exchange}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => runDive(input)}
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
