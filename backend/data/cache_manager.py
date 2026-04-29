import json
import logging
import time
from pathlib import Path

log = logging.getLogger(__name__)


class CacheManager:
    """TTL-based disk-backed cache with timestamp expiry."""

    def __init__(self, cache_dir: str, ttl_seconds: int):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl = ttl_seconds
        self._index_path = self.cache_dir / "_index.json"
        self._index: dict = self._load_index()

    def _load_index(self) -> dict:
        if self._index_path.exists():
            try:
                with open(self._index_path, "r") as f:
                    return json.load(f)
            except (json.JSONDecodeError, OSError):
                log.warning("Cache index corrupt — rebuilding.")
        return {}

    def _save_index(self) -> None:
        try:
            with open(self._index_path, "w") as f:
                json.dump(self._index, f)
        except OSError as e:
            log.error(f"Failed to save cache index: {e}")

    def _cache_path(self, key: str) -> Path:
        safe_key = key.replace("/", "_").replace("^", "X").replace(":", "_")
        return self.cache_dir / f"{safe_key}.json"

    def get(self, key: str):
        meta = self._index.get(key)
        if not meta:
            return None
        if time.time() - meta["ts"] > self.ttl:
            log.debug(f"Cache MISS (expired): {key}")
            return None
        path = self._cache_path(key)
        if not path.exists():
            return None
        try:
            with open(path, "r") as f:
                log.debug(f"Cache HIT: {key}")
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            log.warning(f"Cache file corrupt for key: {key}")
            return None

    def set(self, key: str, value) -> None:
        path = self._cache_path(key)
        try:
            with open(path, "w") as f:
                json.dump(value, f)
            self._index[key] = {"ts": time.time()}
            self._save_index()
        except (OSError, TypeError) as e:
            log.warning(f"Could not cache key '{key}': {e}")

    def invalidate(self, key: str) -> None:
        if key in self._index:
            del self._index[key]
            self._save_index()
        path = self._cache_path(key)
        if path.exists():
            path.unlink(missing_ok=True)

    def clear_expired(self) -> int:
        expired = [k for k, v in self._index.items() if time.time() - v["ts"] > self.ttl]
        for key in expired:
            self.invalidate(key)
        if expired:
            log.info(f"Cleared {len(expired)} expired cache entries.")
        return len(expired)
