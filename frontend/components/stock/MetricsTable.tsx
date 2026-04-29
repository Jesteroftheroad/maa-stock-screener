"use client";

import { formatNumber, formatMarketCap, formatPrice } from "@/lib/utils";
import type { StockDetail } from "@/types";

interface MetricsTableProps {
  stock: StockDetail;
}

export function MetricsTable({ stock }: MetricsTableProps) {
  const f = stock.fundamentals;
  const t = stock.technicals;

  const rows = [
    ["P/E Ratio",        f.pe        != null ? formatNumber(f.pe, 2) : "—",        ""],
    ["Forward P/E",      f.forward_pe != null ? formatNumber(f.forward_pe, 2) : "—", ""],
    ["PEG Ratio",        f.peg       != null ? formatNumber(f.peg, 2) : "—",        ""],
    ["Price/Book",       f.price_to_book != null ? formatNumber(f.price_to_book, 2) : "—", ""],
    ["EV/EBITDA",        f.ev_ebitda != null ? formatNumber(f.ev_ebitda, 2) : "—",  ""],
    ["Debt/Equity",      f.debt_to_equity != null ? formatNumber(f.debt_to_equity, 2) : "—", ""],
    ["ROE",              f.roe != null ? `${f.roe.toFixed(1)}%` : "—",              ""],
    ["Revenue Growth",   f.revenue_growth != null ? `${f.revenue_growth > 0 ? "+" : ""}${f.revenue_growth.toFixed(1)}%` : "—",
                         f.revenue_growth != null ? (f.revenue_growth > 0 ? "text-positive" : "text-negative") : ""],
    ["EPS Growth",       f.eps_growth != null ? `${f.eps_growth > 0 ? "+" : ""}${f.eps_growth.toFixed(1)}%` : "—",
                         f.eps_growth != null ? (f.eps_growth > 0 ? "text-positive" : "text-negative") : ""],
    ["Dividend Yield",   f.dividend_yield != null ? `${f.dividend_yield.toFixed(2)}%` : "—", ""],
    ["Payout Ratio",     f.payout_ratio != null ? `${f.payout_ratio.toFixed(1)}%` : "—", ""],
    ["Beta",             f.beta != null ? formatNumber(f.beta, 2) : "—",            ""],
    ["Market Cap",       formatMarketCap(stock.market_cap),                          ""],
    ["Volume",           stock.volume != null ? (stock.volume / 1e6).toFixed(1) + "M" : "—", ""],
    ["52W High",         formatPrice(f.fifty_two_week_high),                         ""],
    ["52W Low",          formatPrice(f.fifty_two_week_low),                          ""],
    ["RSI",              t.rsi != null ? formatNumber(t.rsi, 1) : "—",              t.rsi && t.rsi > 70 ? "text-negative" : t.rsi && t.rsi < 30 ? "text-positive" : ""],
    ["Trend",            t.trend,                                                    t.trend === "UPTREND" ? "text-positive" : t.trend === "DOWNTREND" ? "text-negative" : ""],
    ["MACD Signal",      t.macd_crossover,                                           t.macd_crossover === "BULLISH" ? "text-positive" : t.macd_crossover === "BEARISH" ? "text-negative" : ""],
    ["Fair Value (Graham)", f.intrinsic_value != null ? formatPrice(f.intrinsic_value) : "—", ""],
    ["Margin of Safety", f.margin_of_safety != null ? `${f.margin_of_safety > 0 ? "+" : ""}${f.margin_of_safety.toFixed(1)}%` : "—",
                         f.margin_of_safety != null ? (f.margin_of_safety > 0 ? "text-positive" : "text-negative") : ""],
    ["Analyst Rating",   f.analyst_recommendation != null ? `${f.analyst_recommendation.toFixed(1)}/5` : "—", ""],
  ];

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Key Metrics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
        {rows.map(([label, value, colorClass]) => (
          <div
            key={label}
            className="flex items-center justify-between py-1.5 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
            <span className={`text-xs font-mono font-medium ${colorClass}`} style={{ color: colorClass ? undefined : "var(--text)" }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
