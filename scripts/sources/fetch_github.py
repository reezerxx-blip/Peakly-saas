import os
import time
from datetime import datetime, timezone
from typing import Any, Dict

import requests


SOURCE_NAME = "github"
CACHE_TTL_HOURS = 12
DELAY_SECONDS = 1


def fetch_tool(tool: Dict[str, Any], previous_week: Dict[str, Any]) -> Dict[str, Any]:
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise EnvironmentError("GITHUB_TOKEN missing")

    repo = tool.get("github_repo")
    if not repo:
        return {"repo": None, "stars": None, "forks": None, "open_issues": None, "stars_growth_7d_pct": None}

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    resp = requests.get(f"https://api.github.com/repos/{repo}", headers=headers, timeout=20)
    if resp.status_code == 404:
        return {"repo": repo, "stars": None, "forks": None, "open_issues": None, "stars_growth_7d_pct": None}
    resp.raise_for_status()
    payload = resp.json()

    stars = int(payload.get("stargazers_count", 0))
    forks = int(payload.get("forks_count", 0))
    open_issues = int(payload.get("open_issues_count", 0))
    prev = previous_week.get(tool.get("id"))
    growth = ((stars - prev) / prev * 100) if prev and prev > 0 else None

    time.sleep(DELAY_SECONDS)
    return {
        "repo": repo,
        "stars": stars,
        "forks": forks,
        "open_issues": open_issues,
        "stars_growth_7d_pct": round(growth, 2) if growth is not None else None,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
