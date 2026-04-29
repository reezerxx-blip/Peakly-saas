import os
import time
from typing import Any, Dict

import requests


SOURCE_NAME = "producthunt"
CACHE_TTL_HOURS = 24
DELAY_SECONDS = 2
ENDPOINT = "https://api.producthunt.com/v2/api/graphql"


def fetch_tool(tool: Dict[str, Any]) -> Dict[str, Any]:
    token = os.getenv("PH_TOKEN")
    if not token:
        raise EnvironmentError("PH_TOKEN missing")

    slug = tool.get("ph_slug") or str(tool.get("name", "")).lower().replace(" ", "-")
    query = """
    query ProductBySlug($slug: String!) {
      post(slug: $slug) {
        votesCount
        reviewsCount
        createdAt
        featuredAt
      }
    }
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    resp = requests.post(
        ENDPOINT,
        headers=headers,
        json={"query": query, "variables": {"slug": slug}},
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json().get("data", {}).get("post") or {}
    time.sleep(DELAY_SECONDS)
    return {
        "upvotes": data.get("votesCount"),
        "reviews": data.get("reviewsCount"),
        "launch_date": data.get("createdAt"),
        "rank": 1 if data else None,
    }
