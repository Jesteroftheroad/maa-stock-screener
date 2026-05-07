# MAA Stock Screener — Global Configuration
# Extends buddy's proven thresholds + MAA-specific additions.

# --- Market Index Tickers ---
MARKET_INDEX = "^GSPC"
VIX_TICKER = "^VIX"
TREASURY_TICKER = "^TNX"
RISK_FREE_RATE = 0.045

MARKET_TICKERS = {
    "sp500":  "^GSPC",
    "nasdaq": "^IXIC",
    "dow":    "^DJI",
    "btc":    "BTC-USD",
    "gold":   "GC=F",
    "oil":    "CL=F",
}

MARKET_TICKER_NAMES = {
    "^GSPC":   "S&P 500",
    "^IXIC":   "Nasdaq",
    "^DJI":    "Dow Jones",
    "BTC-USD": "Bitcoin",
    "GC=F":    "Gold",
    "CL=F":    "Crude Oil",
}

# --- Sector ETFs for breadth signal ---
SECTOR_ETFS = ["XLK", "XLF", "XLE", "XLV", "XLI", "XLY", "XLU", "XLRE", "XLB", "XLP", "XLC"]

# --- VIX Thresholds ---
VIX_LOW = 15
VIX_MODERATE = 25
VIX_HIGH = 35

# --- Fundamental Thresholds ---
MAX_ACCEPTABLE_PE = 25
MAX_ACCEPTABLE_DEBT_TO_EQUITY = 1.5
MIN_REVENUE_GROWTH = 0.05
MARGIN_OF_SAFETY = 0.25
MIN_ROE = 0.15
PEG_UNDERVALUED = 1.0
PEG_FAIR = 2.0
GRAHAM_MULTIPLIER = 22.5

# --- Technical Thresholds ---
RSI_OVERBOUGHT = 70
RSI_OVERSOLD = 30
VOLUME_SPIKE_MULTIPLIER = 1.5
SMA_SHORT = 20
SMA_MID = 50
SMA_LONG = 200
ATR_PERIOD = 14
RSI_PERIOD = 14
MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9

# --- Cache Settings ---
PRICE_CACHE_TTL = 300     # 5 minutes
FUNDS_CACHE_TTL = 900     # 15 minutes
CACHE_DIR_PRICE = "cache/price"
CACHE_DIR_FUNDS = "cache/funds"

# --- Screener Settings ---
SCREENER_BATCH_SIZE = 25
SCREENER_MAX_WORKERS = 8
SCREENER_CACHE_TTL = 900  # 15 minutes

# --- Universe ---
UNIVERSE_US_PATH  = "data_files/universe_us.json"
UNIVERSE_CA_PATH  = "data_files/universe_ca.json"
UNIVERSE_ETF_PATH = "data_files/universe_etf.json"

# --- Watchlist ---
WATCHLIST_DB_PATH = "data_files/watchlist.db"

# --- Movers list (high-liquidity subset for fast daily movers scan) ---
MOVERS_LIST = [
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AVGO", "JPM", "LLY",
    "UNH", "V", "XOM", "MA", "HD", "JNJ", "PG", "MRK", "ABBV", "CVX",
    "KO", "BAC", "WMT", "CRM", "COST", "ACN", "PEP", "MCD", "NFLX", "TMO",
    "ADBE", "AMD", "INTC", "QCOM", "TXN", "AMAT", "INTU", "LRCX", "NOW", "SNOW",
    "PANW", "CRWD", "ZS", "DDOG", "NET", "MU", "MRVL", "KLAC", "ASML", "TSM",
    "PLTR", "SOFI", "RIVN", "HOOD", "COIN", "MSTR", "LCID", "RBLX", "U", "DKNG",
    "SHOP.TO", "RY.TO", "TD.TO", "ENB.TO", "CNQ.TO", "BCE.TO", "BNS.TO", "BMO.TO",
    "CM.TO", "SU.TO", "TRP.TO", "ABX.TO", "CNR.TO", "CP.TO", "WPM.TO",
    "SPY", "QQQ", "IWM", "GLD", "SLV", "USO", "TLT", "HYG",
    "F", "GM", "BA", "CAT", "DE", "GE", "HON", "RTX", "LMT", "NOC",
    "DIS", "CMCSA", "T", "VZ", "TMUS", "WBD", "PARA", "NWSA",
    "GS", "MS", "WFC", "C", "AXP", "BLK", "SCHW", "CB", "PGR",
    "UNP", "UPS", "FDX", "UBER", "LYFT", "ABNB", "BKNG", "MAR", "HLT",
    "PFE", "MRNA", "BNTX", "GILD", "REGN", "BMY", "AZN", "NVO", "LLY",
    "AMGN", "BIIB", "VRTX", "ILMN", "ISRG", "SYK", "MDT", "ABT",
    "NEE", "DUK", "SO", "D", "AEP", "EXC", "SRE", "XEL",
    "AMT", "PLD", "EQIX", "CCI", "SPG", "O", "WELL", "DLR",
]
