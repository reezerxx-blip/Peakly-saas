import time
from typing import Any, Dict

import requests


SOURCE_NAME = "devto"
CACHE_TTL_HOURS = 24
DELAY_SECONDS = 1


def fetch_tool(tool: Dict[str, Any]) -> Dict[str, Any]:
    raw = str(tool.get("devto_tag") or tool.get("name", "")).lower().replace(" ", "")
    # Dev.to tags are slug-like; keep only alphanumerics and dashes.
    tag = "".join(ch for ch in raw if ch.isalnum() or ch == "-")
    if not tag:
        return {"articles_count": 0, "reactions_total": 0, "comments_total": 0}

    url = f"https://dev.to/api/articles?tag={tag}&per_page=10"
    try:
        resp = requests.get(url, timeout=20)
        if resp.status_code == 404:
            # Some tags do not exist on Dev.to: treat as zero signal instead of failing pipeline.
            return {"articles_count": 0, "reactions_total": 0, "comments_total": 0}
        resp.raise_for_status()
        payload = resp.json()
    except requests.RequestException:
        # Keep pipeline resilient on public API fluctuations.
        return {"articles_count": 0, "reactions_total": 0, "comments_total": 0}

    articles = payload if isinstance(payload, list) else []
    reactions = sum(int(article.get("positive_reactions_count", 0)) for article in articles)
    comments = sum(int(article.get("comments_count", 0)) for article in articles)
    time.sleep(DELAY_SECONDS)
    return {"articles_count": len(articles), "reactions_total": reactions, "comments_total": comments}
