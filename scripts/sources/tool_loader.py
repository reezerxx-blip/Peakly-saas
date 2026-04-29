import json
import re
from pathlib import Path
from typing import Any, Dict, List


ROOT_DIR = Path(__file__).resolve().parents[2]
TOOLS_JSON = ROOT_DIR / "data" / "tools-data.json"
TOOLS_TS = ROOT_DIR / "lib" / "tools-data.ts"


def _load_from_json() -> List[Dict[str, Any]]:
    if not TOOLS_JSON.exists():
        return []
    data = json.loads(TOOLS_JSON.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else []


def _load_from_ts() -> List[Dict[str, Any]]:
    content = TOOLS_TS.read_text(encoding="utf-8")
    object_blocks = re.findall(r"\{[\s\S]*?\n\s*\},?", content)
    tools: List[Dict[str, Any]] = []

    def _pick(block: str, key: str) -> Any:
        m = re.search(rf"{key}\s*:\s*'([^']*)'", block)
        if m:
            return m.group(1)
        m = re.search(rf"{key}\s*:\s*([0-9]+(?:\.[0-9]+)?)", block)
        if m:
            raw = m.group(1)
            return float(raw) if "." in raw else int(raw)
        return None

    def _pick_tags(block: str) -> List[str]:
        m = re.search(r"tags\s*:\s*\[([^\]]*)\]", block)
        if not m:
            return []
        raw = m.group(1)
        return re.findall(r"'([^']+)'", raw)

    for block in object_blocks:
        tool_id = _pick(block, "id")
        name = _pick(block, "name")
        website = _pick(block, "website")
        if not tool_id or not name:
            continue

        tools.append(
            {
                "id": tool_id,
                "name": name,
                "website": website,
                "category": _pick(block, "category"),
                "description": _pick(block, "description"),
                "pricing": _pick(block, "pricing"),
                "launched": _pick(block, "launched"),
                "trendScore": _pick(block, "trendScore"),
                "weeklyGrowth": _pick(block, "weeklyGrowth"),
                "monthlyVisits": _pick(block, "monthlyVisits"),
                "status": _pick(block, "status"),
                "ph_slug": _pick(block, "ph_slug"),
                "github_repo": _pick(block, "github_repo"),
                "npm_package": _pick(block, "npm_package"),
                "youtube_query": _pick(block, "youtube_query"),
                "reddit_query": _pick(block, "reddit_query"),
                "tags": _pick_tags(block),
            }
        )

    return tools


def load_tools() -> List[Dict[str, Any]]:
    tools = _load_from_json()
    if tools:
        return tools
    tools = _load_from_ts()
    if not tools:
        raise ValueError("Unable to load tools from data/tools-data.json or lib/tools-data.ts")
    return tools
