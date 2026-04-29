import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import requests


SOURCE_NAME = "reddit"
CACHE_TTL_HOURS = 6
DELAY_SECONDS = 2
ALLOWED_SUBS = {"SaaS", "indiehackers", "startups", "entrepreneur"}


def fetch_tool(tool: Dict[str, Any]) -> Dict[str, Any]:
    query = tool.get("reddit_query") or tool.get("name")
    headers = {"User-Agent": "TrendRadar/1.0"}
    url = f"https://www.reddit.com/search.json?q={query}&sort=new&limit=25&restrict_sr=false"
    resp = requests.get(url, headers=headers, timeout=20)
    resp.raise_for_status()
    children = resp.json().get("data", {}).get("children", [])
    since = datetime.now(timezone.utc) - timedelta(days=7)

    posts = 0
    upvotes = 0
    for child in children:
        data = child.get("data", {})
        subreddit = data.get("subreddit", "")
        created = datetime.fromtimestamp(data.get("created_utc", 0), tz=timezone.utc)
        if subreddit in ALLOWED_SUBS and created >= since:
            posts += 1
            upvotes += int(data.get("score", 0))

    time.sleep(DELAY_SECONDS)
    return {"posts_7d": posts, "upvotes_7d": upvotes}
