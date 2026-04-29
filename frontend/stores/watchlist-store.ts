"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addToWatchlist, removeFromWatchlist } from "@/lib/api";

interface WatchlistStore {
  tickers: string[];
  add: (ticker: string, name?: string, country?: string) => Promise<void>;
  remove: (ticker: string) => Promise<void>;
  has: (ticker: string) => boolean;
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      tickers: [],
      add: async (ticker, name = "", country = "US") => {
        const t = ticker.toUpperCase();
        set((s) => ({ tickers: s.tickers.includes(t) ? s.tickers : [...s.tickers, t] }));
        await addToWatchlist(t, name, country);
      },
      remove: async (ticker) => {
        const t = ticker.toUpperCase();
        set((s) => ({ tickers: s.tickers.filter((x) => x !== t) }));
        await removeFromWatchlist(t);
      },
      has: (ticker) => get().tickers.includes(ticker.toUpperCase()),
    }),
    { name: "maa-watchlist" }
  )
);
