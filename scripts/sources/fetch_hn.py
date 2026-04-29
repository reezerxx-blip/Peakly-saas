from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import requests


SOURCE_NAME = "hackernews"
CACHE_TTL_HOURS = 6


def fetch_tool(tool: Dict[str, Any]) -> Dict[str, Any]:
    query = tool.get("name")
    since = int((datetime.now(timezone.utc) - timedelta(days=7)).timestamp())
    url = (
        "https://hn.algolia.com/api/v1/search"
        f"?query={query}&tags=story&numericFilters=created_at_i>{since}"
    )
    resp = requests.get(url, timeout=20)
    resp.raise_for_status()
    hits = resp.json().get("hits", [])
    scores = [int(hit.get("points", 0)) for hit in hits]
    return {
        "mentions": len(hits),
        "avg_score": round(sum(scores) / len(scores), 2) if scores else 0,
    }
