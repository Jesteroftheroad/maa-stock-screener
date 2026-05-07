export interface MarketItem {
  ticker: string;
  name: string;
  price: number | null;
  change_pct: number | null;
}

export interface MarketOverview {
  sp500: MarketItem;
  nasdaq: MarketItem;
  dow: MarketItem;
  btc: MarketItem;
  gold: MarketItem;
  oil: MarketItem;
}

export interface FearGreed {
  score: number;
  label: string;
  vix: number | null;
  trend: string;
  breadth: string;
  risk_level: string;
  summary: string;
}

export interface StockResult {
  ticker: string;
  name: string;
  price: number | null;
  change_pct: number | null;
  market_cap: number | null;
  pe: number | null;
  forward_pe: number | null;
  revenue_growth: number | null;
  rsi: number | null;
  div_yield: number | null;
  ai_score: number;
  ai_label: string;
  ai_label_color: string;
  sector: string;
  country: string;
  exchange: string;
  sparkline: number[];
}

export interface ScreenerResult {
  results: StockResult[];
  total: number;
  scanned: number;
  cached: boolean;
  error?: string;
}

export interface FilterState {
  sector?: string;
  country?: string;
  exchange?: string;
  pe_min?: number;
  pe_max?: number;
  forward_pe_max?: number;
  peg_max?: number;
  price_min?: number;
  price_max?: number;
  market_cap_min?: number;
  market_cap_max?: number;
  rsi_min?: number;
  rsi_max?: number;
  above_sma20?: boolean;
  above_sma50?: boolean;
  above_sma200?: boolean;
  volume_surge?: number;
  div_yield_min?: number;
  payout_ratio_max?: number;
  rev_growth_min?: number;
  roe_min?: number;
  debt_max?: number;
  ai_score_min?: number;
}

export interface AIScoreBreakdown {
  fundamentals: number;
  technical: number;
  growth: number;
  sentiment: number;
  risk: number;
}

export interface AIScoreData {
  total: number;
  label: string;
  label_color: string;
  breakdown: AIScoreBreakdown;
  bull_case: string;
  bear_case: string;
  fair_value: number | null;
}

export interface StockFundamentals {
  pe: number | null;
  forward_pe: number | null;
  peg: number | null;
  price_to_book: number | null;
  ev_ebitda: number | null;
  debt_to_equity: number | null;
  roe: number | null;
  revenue_growth: number | null;
  eps_growth: number | null;
  dividend_yield: number | null;
  payout_ratio: number | null;
  beta: number | null;
  intrinsic_value: number | null;
  margin_of_safety: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  analyst_recommendation: number | null;
  verdict: string;
}

export interface StockTechnicals {
  rsi: number | null;
  rsi_signal: string;
  trend: string;
  macd: number | null;
  macd_signal: number | null;
  macd_crossover: string;
  momentum: string;
  volume_signal: string;
  above_sma20: boolean | null;
  above_sma50: boolean | null;
  above_sma200: boolean | null;
  support_levels: number[];
  resistance_levels: number[];
  atr: number | null;
  stop_loss: number | null;
}

export interface NewsItem {
  title: string;
  link: string;
  publisher: string;
  published_at: number;
}

export interface StockDetail {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  country: string;
  exchange: string;
  description: string;
  website: string;
  price: number | null;
  change_pct: number | null;
  market_cap: number | null;
  volume: number | null;
  avg_volume: number | null;
  fundamentals: StockFundamentals;
  technicals: StockTechnicals;
  ai_score: AIScoreData;
  news: NewsItem[];
}

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface WatchlistItem {
  id: number;
  ticker: string;
  name: string;
  country: string;
  added_at: string;
  notes: string;
  price: number | null;
  change_pct: number | null;
}

// ─── AI Deep Dive ─────────────────────────────────────────────────────────────

export interface DDHolder { name: string; pct: number; shares: number }
export interface DDUpDown { firm: string; from: string; to: string; date: string }

export interface DDInstitutional {
  ownership_pct: number;
  top_holders: DDHolder[];
  insider_net: "Buying" | "Selling" | "Neutral";
  insider_3m_bought: number;
  insider_3m_sold: number;
  short_pct: number;
  short_ratio: number;
  short_trend: string;
  options_signal: "Bullish" | "Bearish" | "Neutral";
  put_call_ratio: number;
}

export interface DDAnalyst {
  avg_rating: number;
  rating_label: string;
  num_analysts: number;
  strong_buy: number;
  buy: number;
  hold: number;
  sell: number;
  strong_sell: number;
  target_avg: number;
  target_high: number;
  target_low: number;
  upside_pct: number;
  recent_upgrades: DDUpDown[];
  recent_downgrades: DDUpDown[];
}

export interface DDSentiment {
  news_sentiment: "Positive" | "Neutral" | "Negative";
  news_score: number;
  news_count: number;
  buzz_trend: "Rising" | "Stable" | "Falling";
  retail_hype: "Hot" | "Warm" | "Cool" | "Cold";
}

export interface DDScenario { target: number; probability: number; description: string }

export interface DDTradeSetup {
  swing_entry: number;
  swing_target: number;
  swing_stop: number;
  dip_zone: string;
  momentum_entry: string;
  stop_loss: number;
  covered_call_strike: number;
  covered_call_premium: string;
  csp_strike: number;
  csp_premium: string;
}

export interface DeepDiveResult {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number | null;
  change_pct: number | null;
  market_cap: number | null;

  verdict: "Bullish" | "Neutral" | "Bearish";
  confidence: number;
  risk_level: "Low" | "Medium" | "High" | "Very High";
  short_term_outlook: string;
  medium_term_outlook: string;
  long_term_outlook: string;

  fundamental_score: number;
  technical_score: number;
  institutional_score: number;
  sentiment_score: number;
  macro_score: number;
  total_score: number;

  institutional: DDInstitutional;
  analyst: DDAnalyst;
  sentiment: DDSentiment;

  rsi: number;
  trend: string;
  macd_signal: string;
  support: number[];
  resistance: number[];
  above_sma50: boolean | null;
  above_sma200: boolean | null;
  breakout_prob: number;
  bounce_prob: number;
  breakdown_risk: number;
  volume_surge: number;
  atr: number | null;

  scenarios: { bull: DDScenario; base: DDScenario; bear: DDScenario };
  trade_setup: DDTradeSetup;
  red_flags: string[];
  ai_explanation: string;
  ai_score: AIScoreData;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  ticker: string;
  name: string;
  sector: string;
  exchange: string;
  country: string;
  type: "Stock" | "ETF";
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
}

// ─── Smart Money Screener ──────────────────────────────────────────────────────

export interface SmartMoneyResult {
  ticker: string;
  name: string;
  price: number | null;
  change_pct: number | null;
  sector: string;
  market_cap: number | null;
  smart_money_score: number;
  score_label: string;
  score_color: string;
  signal_type: string;
  confidence: number;
  action_tag: string;
  inst_score: number;
  options_score: number;
  volume_score: number;
  insider_score: number;
  trend_score: number;
  volume_vs_avg: number;
  call_put_ratio: number | null;
  institutional_trend: string;
  inst_ownership_pct: number | null;
  num_inst_holders: number | null;
  insider_buys_90d: number;
  insider_sells_90d: number;
  short_interest_pct: number | null;
  rsi: number | null;
  above_sma50: boolean | null;
  above_sma200: boolean | null;
  ai_explanation: string;
}

export interface SmartMoneyOverview {
  bullish_flow_count: number;
  insider_buy_count: number;
  unusual_volume_count: number;
  high_conviction_count: number;
  distribution_count: number;
  total_scanned: number;
}

export interface SmartMoneyScreenerResult {
  results: SmartMoneyResult[];
  total: number;
  scanned: number;
  cached: boolean;
  preset?: string;
  preset_label?: string;
}

export interface SmartMoneyFilters {
  score_min?: number;
  cp_ratio_min?: number;
  vol_surge_min?: number;
  insider_buys_min?: number;
  inst_ownership_min?: number;
  above_sma50?: boolean;
  rsi_max?: number;
  short_interest_min?: number;
  sector?: string;
  signal_type?: string;
}

export interface SmartMoneyPreset {
  name: string;
  label: string;
  icon: string;
  description: string;
}

export interface MoverItem {
  ticker: string;
  price: number | null;
  change_pct: number | null;
}

export interface MoversData {
  gainers: MoverItem[];
  losers: MoverItem[];
}
