from typing import Any, Dict
from datetime import datetime, timedelta, timezone

from pytrends.request import TrendReq

from .common import random_sleep


SOURCE_NAME = "google_trends"
CACHE_TTL_HOURS = 48
DELAY_RANGE = (3, 6)
COOLDOWN_MINUTES_ON_429 = 15
_cooldown_until = None


def fetch_tool(tool: Dict[str, Any]) -> Dict[str, Any]:
    global _cooldown_until
    query = tool.get("name", "")

    # Global cooldown to avoid cascading 429 errors during backfills.
    if _cooldown_until and datetime.now(timezone.utc) < _cooldown_until:
        return {"score_avg": 0, "trend_30d": "cooldown"}

    # Slow down before request to reduce 429 rate-limit risk.
    random_sleep(3, 6)

    try:
        pytrends = TrendReq(hl="en-US", tz=0)
        pytrends.build_payload([query], timeframe="today 3-m")
        interest = pytrends.interest_over_time()
    except Exception as exc:
        if "429" in str(exc):
            # Enter cooldown window and fallback gracefully.
            _cooldown_until = datetime.now(timezone.utc) + timedelta(minutes=COOLDOWN_MINUTES_ON_429)
            return {"score_avg": 0, "trend_30d": "unknown"}
        # Any other transient parser/network issue should not kill the pipeline.
        return {"score_avg": 0, "trend_30d": "unknown"}

    if interest.empty or query not in interest.columns:
        result = {"score_avg": 0, "trend_30d": "flat"}
    else:
        series = interest[query].tolist()
        avg = round(sum(series) / max(len(series), 1), 2)
        last_30 = series[-30:] if len(series) >= 30 else series
        first = last_30[0] if last_30 else 0
        last = last_30[-1] if last_30 else 0
        trend = "up" if last > first else "down" if last < first else "flat"
        result = {"score_avg": avg, "trend_30d": trend}

    random_sleep(*DELAY_RANGE)
    return result
