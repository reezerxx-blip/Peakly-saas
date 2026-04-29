from typing import Any, Dict

import requests


SOURCE_NAME = "npm"
CACHE_TTL_HOURS = 24


def fetch_tool(tool: Dict[str, Any]) -> Dict[str, Any]:
    package_name = tool.get("npm_package")
    if not package_name:
        return {"downloads_weekly": None}
    url = f"https://api.npmjs.org/downloads/point/last-week/{package_name}"
    resp = requests.get(url, timeout=20)
    resp.raise_for_status()
    payload = resp.json()
    return {"downloads_weekly": payload.get("downloads")}
