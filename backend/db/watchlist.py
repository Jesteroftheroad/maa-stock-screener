"""SQLite watchlist CRUD — no ORM, no dependencies beyond stdlib."""

import sqlite3
import logging
from pathlib import Path
from datetime import datetime, timezone

import config

log = logging.getLogger(__name__)


def _connect() -> sqlite3.Connection:
    Path(config.WATCHLIST_DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(config.WATCHLIST_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS watchlist (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker   TEXT    NOT NULL UNIQUE,
                name     TEXT    DEFAULT '',
                country  TEXT    DEFAULT 'US',
                added_at TEXT    DEFAULT (datetime('now')),
                notes    TEXT    DEFAULT ''
            )
        """)
        conn.commit()
    log.info("Watchlist DB initialized.")


def add_ticker(ticker: str, name: str = "", country: str = "US") -> bool:
    try:
        with _connect() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO watchlist (ticker, name, country, added_at) VALUES (?, ?, ?, ?)",
                (ticker.upper(), name, country, datetime.now(timezone.utc).isoformat())
            )
            conn.commit()
        return True
    except Exception as e:
        log.error(f"add_ticker failed for {ticker}: {e}")
        return False


def remove_ticker(ticker: str) -> bool:
    try:
        with _connect() as conn:
            conn.execute("DELETE FROM watchlist WHERE ticker = ?", (ticker.upper(),))
            conn.commit()
        return True
    except Exception as e:
        log.error(f"remove_ticker failed for {ticker}: {e}")
        return False


def get_watchlist() -> list[dict]:
    try:
        with _connect() as conn:
            rows = conn.execute("SELECT * FROM watchlist ORDER BY added_at DESC").fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        log.error(f"get_watchlist failed: {e}")
        return []


def is_in_watchlist(ticker: str) -> bool:
    try:
        with _connect() as conn:
            row = conn.execute("SELECT 1 FROM watchlist WHERE ticker = ?", (ticker.upper(),)).fetchone()
        return row is not None
    except Exception:
        return False
