import os
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import requests


SOURCE_NAME = "youtube"
CACHE_TTL_HOURS = 24
DELAY_SECONDS = 1


def fetch_tool(tool: Dict[str, Any]) -> Dict[str, Any]:
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise EnvironmentError("YOUTUBE_API_KEY missing")

    query = tool.get("youtube_query") or tool.get("name")
    published_after = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    search_url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "key": api_key,
        "part": "snippet",
        "q": query,
        "type": "video",
        "publishedAfter": published_after,
        "maxResults": 10,
    }
    search_resp = requests.get(search_url, params=params, timeout=20)
    search_resp.raise_for_status()
    items = search_resp.json().get("items", [])
    video_ids = [item.get("id", {}).get("videoId") for item in items if item.get("id", {}).get("videoId")]

    total_views = 0
    total_likes = 0
    primary_channel_id = None
    primary_channel_title = None
    for item in items:
        snippet = item.get("snippet", {})
        channel_id = snippet.get("channelId")
        channel_title = snippet.get("channelTitle")
        if channel_id:
            primary_channel_id = channel_id
            primary_channel_title = channel_title
            break
    if video_ids:
      details_resp = requests.get(
          "https://www.googleapis.com/youtube/v3/videos",
          params={"key": api_key, "part": "statistics", "id": ",".join(video_ids)},
          timeout=20,
      )
      details_resp.raise_for_status()
      for video in details_resp.json().get("items", []):
          stats = video.get("statistics", {})
          total_views += int(stats.get("viewCount", 0))
          total_likes += int(stats.get("likeCount", 0))

    time.sleep(DELAY_SECONDS)
    channel_url = f"https://www.youtube.com/channel/{primary_channel_id}" if primary_channel_id else None
    return {
        "videos_count": len(video_ids),
        "views_total": total_views,
        "likes_total": total_likes,
        "channel_id": primary_channel_id,
        "channel_title": primary_channel_title,
        "channel_url": channel_url,
    }
