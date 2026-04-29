import json
import os
import random
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, Optional

import requests


BACKOFF_SECONDS = [0, 10, 30]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def supabase_headers() -> Dict[str, str]:
    key = os.getenv("SUPABASE_KEY", "")
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def get_supabase_url() -> str:
    base = os.getenv("SUPABASE_URL", "").rstrip("/")
    if not base:
        raise EnvironmentError("SUPABASE_URL is missing")
    return base


def _cache_query(tool_id: str, source: str, only_valid: bool) -> Optional[Dict[str, Any]]:
    base = get_supabase_url()
    headers = supabase_headers()
    params = {
        "tool_id": f"eq.{tool_id}",
        "source": f"eq.{source}",
        "select": "value,fetched_at,expires_at",
        "order": "fetched_at.desc",
        "limit": "1",
    }
    if only_valid:
        params["expires_at"] = f"gt.{datetime.now(timezone.utc).isoformat()}"
    response = requests.get(f"{base}/rest/v1/api_cache", headers=headers, params=params, timeout=20)
    response.raise_for_status()
    rows = response.json()
    return rows[0] if rows else None


def get_cache(tool_id: str, source: str, only_valid: bool = True) -> Optional[Dict[str, Any]]:
    try:
        return _cache_query(tool_id, source, only_valid)
    except Exception:
        return None


def set_cache(tool_id: str, source: str, value: Dict[str, Any], ttl_hours: int) -> None:
    try:
        base = get_supabase_url()
        headers = supabase_headers()
        fetched = datetime.now(timezone.utc)
        expires = fetched + timedelta(hours=ttl_hours)
        payload = {
            "tool_id": tool_id,
            "source": source,
            "value": value,
            "fetched_at": fetched.isoformat(),
            "expires_at": expires.isoformat(),
        }
        requests.post(
            f"{base}/rest/v1/api_cache",
            headers={**headers, "Prefer": "resolution=merge-duplicates"},
            data=json.dumps(payload),
            timeout=20,
        ).raise_for_status()
    except Exception:
        pass


def log_fetch(tool_id: str, source: str, status: str, error_message: Optional[str] = None) -> None:
    try:
        base = get_supabase_url()
        headers = supabase_headers()
        payload = {
            "tool_id": tool_id,
            "source": source,
            "status": status,
            "error_message": error_message,
            "fetched_at": now_iso(),
        }
        requests.post(f"{base}/rest/v1/fetch_log", headers=headers, data=json.dumps(payload), timeout=20).raise_for_status()
    except Exception:
        pass


def run_with_retry(fn: Callable[[], Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    for attempt, delay in enumerate(BACKOFF_SECONDS, start=1):
        if delay > 0:
            time.sleep(delay)
        try:
            return fn()
        except Exception as exc:
            if attempt == len(BACKOFF_SECONDS):
                print(f"[error] retry failed after {attempt} attempts: {exc}")
                return None
    return None


def random_sleep(min_seconds: float, max_seconds: float) -> None:
    time.sleep(random.uniform(min_seconds, max_seconds))
