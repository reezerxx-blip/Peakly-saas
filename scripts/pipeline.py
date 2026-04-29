#!/usr/bin/env python3
import argparse
import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv

from sources import (
    fetch_devto,
    fetch_github,
    fetch_hn,
    fetch_npm,
    fetch_producthunt,
    fetch_reddit,
    fetch_trends,
    fetch_youtube,
)
from sources.common import get_cache, log_fetch, run_with_retry, set_cache
from sources.tool_loader import load_tools


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
LAST_WEEK_PATH = DATA_DIR / "last-week-snapshot.json"
ENRICHED_PATH = DATA_DIR / "enriched-tools.json"


def _chunks(items: List[Dict[str, Any]], n_groups: int) -> List[List[Dict[str, Any]]]:
    size = math.ceil(len(items) / n_groups)
    return [items[i : i + size] for i in range(0, len(items), size)]


def get_today_group(tools: List[Dict[str, Any]]) -> Tuple[int, List[Dict[str, Any]]]:
    groups = _chunks(tools, 7)
    weekday = datetime.now(timezone.utc).weekday()
    group_index = weekday % max(len(groups), 1)
    return group_index, groups[group_index]


def get_specific_group(tools: List[Dict[str, Any]], group_number: int) -> Tuple[int, List[Dict[str, Any]]]:
    groups = _chunks(tools, 7)
    if group_number < 1 or group_number > len(groups):
        raise ValueError(f"group must be between 1 and {len(groups)}")
    idx = group_number - 1
    return idx, groups[idx]


def load_last_week() -> Dict[str, Any]:
    if LAST_WEEK_PATH.exists():
        return json.loads(LAST_WEEK_PATH.read_text(encoding="utf-8"))
    return {}


def save_last_week(snapshot: Dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    LAST_WEEK_PATH.write_text(json.dumps(snapshot, indent=2), encoding="utf-8")


def fetch_with_fallback(
    tool: Dict[str, Any],
    source_name: str,
    ttl_hours: int,
    fetch_fn,
    weekly_snapshot: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    tool_id = tool["id"]

    valid_cache = get_cache(tool_id, source_name, only_valid=True)
    if valid_cache:
        log_fetch(tool_id, source_name, "cached")
        return valid_cache.get("value")

    fresh = run_with_retry(fetch_fn)
    if fresh is not None:
        set_cache(tool_id, source_name, fresh, ttl_hours)
        log_fetch(tool_id, source_name, "success")
        return fresh

    stale_cache = get_cache(tool_id, source_name, only_valid=False)
    if stale_cache:
        log_fetch(tool_id, source_name, "fallback", "using stale cache")
        return stale_cache.get("value")

    weekly = weekly_snapshot.get(tool_id, {}).get(source_name)
    if weekly:
        log_fetch(tool_id, source_name, "fallback", "using weekly snapshot")
        return weekly

    log_fetch(tool_id, source_name, "fail", "no data available")
    return None


def normalize(value: float, min_value: float, max_value: float) -> float:
    if max_value <= min_value:
        return 0.0
    ratio = (value - min_value) / (max_value - min_value)
    return max(0.0, min(100.0, ratio * 100))


def compute_score(sources: Dict[str, Any], previous_score: Optional[float]) -> Tuple[float, str, str]:
    weights = {
        "trends": 0.25,
        "mentions": 0.20,
        "producthunt": 0.15,
        "github": 0.15,
        "youtube": 0.15,
        "devto": 0.10,
    }

    components: Dict[str, float] = {}
    if sources.get("google_trends"):
        val = float(sources["google_trends"].get("score_avg", 0))
        components["trends"] = normalize(val, 0, 100)
    if sources.get("hackernews") or sources.get("reddit"):
        hn_mentions = float((sources.get("hackernews") or {}).get("mentions", 0))
        rd_mentions = float((sources.get("reddit") or {}).get("posts_7d", 0))
        components["mentions"] = normalize(hn_mentions + rd_mentions, 0, 120)
    if sources.get("producthunt"):
        upvotes = float(sources["producthunt"].get("upvotes") or 0)
        components["producthunt"] = normalize(upvotes, 0, 5000)
    if sources.get("github"):
        growth = float(sources["github"].get("stars_growth_7d_pct") or 0)
        components["github"] = normalize(growth, -20, 60)
    if sources.get("youtube"):
        videos = float(sources["youtube"].get("videos_count") or 0)
        views = float(sources["youtube"].get("views_total") or 0)
        components["youtube"] = normalize(videos * 2 + views / 10000, 0, 250)
    if sources.get("devto"):
        articles = float(sources["devto"].get("articles_count") or 0)
        reactions = float(sources["devto"].get("reactions_total") or 0)
        components["devto"] = normalize(articles * 4 + reactions / 20, 0, 200)

    available_weight = sum(weights[key] for key in components.keys())
    if available_weight == 0:
        score = previous_score or 0.0
    else:
        score = 0.0
        for key, comp in components.items():
            redistributed_weight = weights[key] / available_weight
            score += comp * redistributed_weight

    source_count = len(components)
    if source_count >= 6:
        data_quality = "high"
    elif source_count >= 4:
        data_quality = "medium"
    else:
        data_quality = "low"

    prev = previous_score or 0.0
    growth = ((score - prev) / prev * 100) if prev > 0 else 0
    if score > 75:
        status = "hot"
    elif 50 <= score <= 75 and growth > 0:
        status = "rising"
    elif 30 <= score < 50:
        status = "stable"
    else:
        status = "declining"

    return round(score, 2), status, data_quality


def upsert_tool_row(tool: Dict[str, Any], score: float, status: str, quality: str, weekly_growth: float) -> None:
    base = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_KEY", "")
    if not base or not key:
        print("[warn] SUPABASE_URL/SUPABASE_KEY missing, skipping upsert")
        return

    payload = {
        "id": tool["id"],
        "name": tool["name"],
        "website": tool.get("website"),
        "category": tool.get("category"),
        "description": tool.get("description"),
        "pricing": tool.get("pricing"),
        "launched": tool.get("launched"),
        "trend_score": score,
        "weekly_growth": weekly_growth,
        "monthly_visits": tool.get("monthlyVisits"),
        "status": status,
        "data_quality": quality,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    requests.post(f"{base}/rest/v1/tools", headers=headers, data=json.dumps(payload), timeout=20).raise_for_status()
    requests.post(
        f"{base}/rest/v1/score_history",
        headers=headers,
        data=json.dumps(
            {
                "tool_id": tool["id"],
                "trend_score": score,
                "recorded_at": datetime.now(timezone.utc).isoformat(),
            }
        ),
        timeout=20,
    ).raise_for_status()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run multi-source trend pipeline")
    parser.add_argument("--group", type=int, help="Run a specific group number (1..7)")
    parser.add_argument("--all-groups", action="store_true", help="Run all groups sequentially")
    args = parser.parse_args()

    load_dotenv(ROOT_DIR / ".env.local")
    tools = load_tools()
    groups = _chunks(tools, 7)
    if args.all_groups:
        target_groups = list(enumerate(groups))
    elif args.group:
        idx, group = get_specific_group(tools, args.group)
        target_groups = [(idx, group)]
    else:
        idx, group = get_today_group(tools)
        target_groups = [(idx, group)]

    weekly_snapshot = load_last_week()
    github_prev = {}
    for tool_id, snapshot in weekly_snapshot.items():
        if not isinstance(snapshot, dict):
            continue
        github_data = snapshot.get("github")
        if isinstance(github_data, dict):
            github_prev[tool_id] = github_data.get("stars")

    next_snapshot: Dict[str, Any] = dict(weekly_snapshot)
    enriched_rows = []

    source_requirements = {
        "producthunt": ["PH_TOKEN"],
        "github": ["GITHUB_TOKEN"],
        "youtube": ["YOUTUBE_API_KEY"],
    }

    missing_env_sources = {
        source: [key for key in keys if not os.getenv(key)]
        for source, keys in source_requirements.items()
        if any(not os.getenv(key) for key in keys)
    }
    if missing_env_sources:
        for source, missing in missing_env_sources.items():
            print(f"[warn] Source '{source}' skipped (missing env: {', '.join(missing)})")

    for group_idx, group_tools in target_groups:
        print(f"[info] Processing group {group_idx + 1}/7 with {len(group_tools)} tools")
        for tool in group_tools:
            print(f"[info] Tool: {tool['name']}")
            source_values: Dict[str, Any] = {}
            tool_prev = weekly_snapshot.get(tool["id"], {})

            source_values["google_trends"] = fetch_with_fallback(
                tool,
                fetch_trends.SOURCE_NAME,
                fetch_trends.CACHE_TTL_HOURS,
                lambda: fetch_trends.fetch_tool(tool),
                weekly_snapshot,
            )
            if "producthunt" in missing_env_sources:
                source_values["producthunt"] = None
            else:
                source_values["producthunt"] = fetch_with_fallback(
                    tool,
                    fetch_producthunt.SOURCE_NAME,
                    fetch_producthunt.CACHE_TTL_HOURS,
                    lambda: fetch_producthunt.fetch_tool(tool),
                    weekly_snapshot,
                )
            if "github" in missing_env_sources:
                source_values["github"] = None
            else:
                source_values["github"] = fetch_with_fallback(
                    tool,
                    fetch_github.SOURCE_NAME,
                    fetch_github.CACHE_TTL_HOURS,
                    lambda: fetch_github.fetch_tool(tool, github_prev),
                    weekly_snapshot,
                )
            source_values["hackernews"] = fetch_with_fallback(
                tool,
                fetch_hn.SOURCE_NAME,
                fetch_hn.CACHE_TTL_HOURS,
                lambda: fetch_hn.fetch_tool(tool),
                weekly_snapshot,
            )
            source_values["reddit"] = fetch_with_fallback(
                tool,
                fetch_reddit.SOURCE_NAME,
                fetch_reddit.CACHE_TTL_HOURS,
                lambda: fetch_reddit.fetch_tool(tool),
                weekly_snapshot,
            )
            if "youtube" in missing_env_sources:
                source_values["youtube"] = None
            else:
                source_values["youtube"] = fetch_with_fallback(
                    tool,
                    fetch_youtube.SOURCE_NAME,
                    fetch_youtube.CACHE_TTL_HOURS,
                    lambda: fetch_youtube.fetch_tool(tool),
                    weekly_snapshot,
                )
            source_values["devto"] = fetch_with_fallback(
                tool,
                fetch_devto.SOURCE_NAME,
                fetch_devto.CACHE_TTL_HOURS,
                lambda: fetch_devto.fetch_tool(tool),
                weekly_snapshot,
            )
            source_values["npm"] = fetch_with_fallback(
                tool,
                fetch_npm.SOURCE_NAME,
                fetch_npm.CACHE_TTL_HOURS,
                lambda: fetch_npm.fetch_tool(tool),
                weekly_snapshot,
            )

            prev_score = tool_prev.get("trend_score") if isinstance(tool_prev, dict) else None
            score, status, quality = compute_score(source_values, prev_score)
            weekly_growth = ((score - prev_score) / prev_score * 100) if prev_score and prev_score > 0 else 0.0

            upsert_tool_row(tool, score, status, quality, round(weekly_growth, 2))

            next_snapshot[tool["id"]] = {
                **source_values,
                "trend_score": score,
                "status": status,
                "data_quality": quality,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            enriched_rows.append(
                {
                    "id": tool["id"],
                    "name": tool["name"],
                    "trendScore": score,
                    "weeklyGrowth": round(weekly_growth, 2),
                    "status": status,
                    "dataQuality": quality,
                    "sources": source_values,
                }
            )

    save_last_week(next_snapshot)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ENRICHED_PATH.write_text(
        json.dumps({"updatedAt": datetime.now(timezone.utc).isoformat(), "tools": enriched_rows}, indent=2),
        encoding="utf-8",
    )
    if args.all_groups:
        print("[ok] pipeline completed for all groups (1..7)")
    else:
        print(f"[ok] pipeline completed for group {target_groups[0][0] + 1}")


if __name__ == "__main__":
    main()
