"""MAA Stock Screener — FastAPI backend."""

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.watchlist import init_db
from routers import market, screener, stock, watchlist, deep_dive

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="MAA Stock Screener API",
    version="1.0.0",
    description="AI-powered stock screener for US and Canadian markets",
    lifespan=lifespan,
)

_extra = os.environ.get("ALLOWED_ORIGIN", "")
_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    *([_extra] if _extra else []),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market.router,    prefix="/api/market",    tags=["market"])
app.include_router(screener.router,  prefix="/api",           tags=["screener"])
app.include_router(stock.router,     prefix="/api/stock",     tags=["stock"])
app.include_router(watchlist.router,  prefix="/api/watchlist",  tags=["watchlist"])
app.include_router(deep_dive.router,  prefix="/api/deep-dive",  tags=["deep-dive"])


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "MAA Stock Screener"}
