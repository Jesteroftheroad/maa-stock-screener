import type {
  MarketOverview, FearGreed, MoversData,
  ScreenerResult, FilterState, StockDetail,
  ChartDataPoint, WatchlistItem, DeepDiveResult,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function fetchMarketOverview(): Promise<MarketOverview | null> {
  return apiFetch<MarketOverview>("/api/market/overview");
}

export async function fetchFearGreed(): Promise<FearGreed | null> {
  return apiFetch<FearGreed>("/api/market/fear-greed");
}

export async function fetchMovers(): Promise<MoversData | null> {
  return apiFetch<MoversData>("/api/market/movers");
}

export async function fetchScreener(filters: FilterState): Promise<ScreenerResult | null> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  }
  return apiFetch<ScreenerResult>(`/api/screener?${params.toString()}`);
}

export async function fetchPreset(name: string): Promise<ScreenerResult | null> {
  return apiFetch<ScreenerResult>(`/api/presets/${name}`);
}

export async function fetchStock(ticker: string): Promise<StockDetail | null> {
  return apiFetch<StockDetail>(`/api/stock/${ticker}`);
}

export async function fetchStockChart(ticker: string, period: string): Promise<{ data: ChartDataPoint[] } | null> {
  return apiFetch<{ data: ChartDataPoint[] }>(`/api/stock/${ticker}/chart?period=${period}`);
}

export async function fetchSimilarStocks(ticker: string): Promise<{ similar: any[] } | null> {
  return apiFetch(`/api/stock/${ticker}/similar`);
}

export async function fetchWatchlist(): Promise<{ watchlist: WatchlistItem[] } | null> {
  return apiFetch<{ watchlist: WatchlistItem[] }>("/api/watchlist");
}

export async function addToWatchlist(ticker: string, name = "", country = "US"): Promise<boolean> {
  const res = await apiFetch<{ success: boolean }>("/api/watchlist", {
    method: "POST",
    body: JSON.stringify({ ticker, name, country }),
  });
  return res?.success ?? false;
}

export async function removeFromWatchlist(ticker: string): Promise<boolean> {
  const res = await apiFetch<{ success: boolean }>(`/api/watchlist/${ticker}`, { method: "DELETE" });
  return res?.success ?? false;
}

export async function fetchDeepDive(ticker: string): Promise<DeepDiveResult | null> {
  return apiFetch<DeepDiveResult>(`/api/deep-dive/${ticker.toUpperCase()}`);
}

export async function fetchDeepDiveCompare(tickers: string[]): Promise<{ results: DeepDiveResult[] } | null> {
  return apiFetch<{ results: DeepDiveResult[] }>(`/api/deep-dive/compare?tickers=${tickers.join(",")}`);
}
