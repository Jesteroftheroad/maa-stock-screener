"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, BarChart2, Loader2 } from "lucide-react";
import { fetchSearch } from "@/lib/api";
import type { SearchResult } from "@/types";

const TYPE_BADGE: Record<string, string> = {
  ETF:   "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Stock: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
};

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [active, setActive]     = useState(-1);

  const inputRef    = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Keyboard shortcut: Ctrl+K / Cmd+K ─────────────────────── */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  /* ── Close on outside click ─────────────────────────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActive(-1);
  }

  /* ── Debounced search ───────────────────────────────────────── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) { setResults([]); setLoading(false); return; }
      setLoading(true);
      try {
        const res = await fetchSearch(q);
        setResults(res?.results ?? []);
        setActive(-1);
      } finally {
        setLoading(false);
      }
    }, 220),
    []
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    if (v.trim()) {
      setLoading(true);
      doSearch(v);
    } else {
      setResults([]);
      setLoading(false);
    }
  }

  function navigate(result: SearchResult) {
    router.push(`/stock/${result.ticker}`);
    close();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(a => Math.min(a + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(a => Math.max(a - 1, 0));
    }
    if (e.key === "Enter" && active >= 0 && results[active]) {
      navigate(results[active]);
    }
    if (e.key === "Enter" && active < 0 && query.trim()) {
      // Direct ticker lookup
      router.push(`/stock/${query.trim().toUpperCase()}`);
      close();
    }
  }

  const showDropdown = open && (loading || results.length > 0 || query.trim().length > 0);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button (collapsed) */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all hover:bg-white/5 group"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          title="Search stocks & ETFs  (Ctrl+K)"
        >
          <Search size={14} />
          <span className="hidden md:block text-xs">Search…</span>
          <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ml-1 opacity-60"
               style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
            ⌘K
          </kbd>
        </button>
      )}

      {/* Open search bar */}
      {open && (
        <div className="flex items-center gap-1">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                   style={{ color: "var(--muted)" }} />
            {loading
              ? <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: "var(--muted)" }} />
              : query && <button onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
                  <X size={14} />
                </button>
            }
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              onKeyDown={handleKey}
              placeholder="Search ticker or company…"
              className="w-56 md:w-72 pl-9 pr-8 py-1.5 rounded-lg text-sm border outline-none transition-colors"
              style={{
                background: "var(--bg)",
                borderColor: "rgba(99,102,241,0.4)",
                color: "var(--text)",
              }}
              autoFocus
            />
          </div>
          <button onClick={close} className="p-1.5 rounded hover:bg-white/5 transition-colors"
                  style={{ color: "var(--muted)" }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full mt-2 right-0 w-80 rounded-xl border shadow-2xl z-[200] overflow-hidden"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {/* Results */}
          {results.length > 0 ? (
            <div>
              {/* Group: ETFs first if any */}
              {["ETF", "Stock"].map(type => {
                const group = results.filter(r => r.type === type);
                if (!group.length) return null;
                return (
                  <div key={type}>
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                         style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                      {type === "ETF" ? "📊 ETFs" : "📈 Stocks"}
                    </div>
                    {group.map((r) => {
                      const idx = results.indexOf(r);
                      const isActive = idx === active;
                      return (
                        <button
                          key={r.ticker}
                          onClick={() => navigate(r)}
                          onMouseEnter={() => setActive(idx)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                          style={{
                            background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                          }}
                        >
                          {/* Icon */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            r.type === "ETF" ? "bg-blue-500/15" : "bg-emerald-500/15"
                          }`}>
                            {r.type === "ETF"
                              ? <BarChart2 size={13} className="text-blue-400" />
                              : <TrendingUp size={13} className="text-emerald-400" />
                            }
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm font-mono" style={{ color: "var(--text)" }}>
                                {r.ticker}
                              </span>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${TYPE_BADGE[r.type] ?? ""}`}>
                                {r.type}
                              </span>
                            </div>
                            <div className="text-xs truncate" style={{ color: "var(--muted)" }}>
                              {r.name}
                            </div>
                          </div>

                          {/* Sector / exchange */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs" style={{ color: "var(--muted)" }}>{r.exchange}</div>
                            {r.sector && (
                              <div className="text-[10px] truncate max-w-[80px]" style={{ color: "var(--muted)", opacity: 0.7 }}>
                                {r.sector}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Enter hint */}
              <div className="px-3 py-2 border-t text-xs flex items-center gap-2" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                <kbd className="px-1.5 py-0.5 rounded border text-[10px]" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>↑↓</kbd> navigate
                <kbd className="px-1.5 py-0.5 rounded border text-[10px]" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>↵</kbd> open
                <kbd className="px-1.5 py-0.5 rounded border text-[10px]" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>Esc</kbd> close
              </div>
            </div>
          ) : loading ? (
            <div className="py-6 text-center text-sm" style={{ color: "var(--muted)" }}>
              Searching…
            </div>
          ) : query.trim().length > 0 ? (
            <div className="py-6 text-center space-y-1">
              <p className="text-sm" style={{ color: "var(--text)" }}>No results for "{query}"</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Try an exact ticker like AAPL, SPY, or QQQ
              </p>
              <button
                onClick={() => { router.push(`/stock/${query.trim().toUpperCase()}`); close(); }}
                className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors"
              >
                Look up {query.trim().toUpperCase()} anyway →
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
