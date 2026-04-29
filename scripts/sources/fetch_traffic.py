#!/usr/bin/env python3
from __future__ import annotations

from playwright.async_api import async_playwright
import asyncio
import random
import json
import os
import re
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup  # noqa: F401 (kept for optional parsing fallback)
from dotenv import load_dotenv
from supabase import create_client


USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
]


def parse_int(text: str | None) -> int | None:
    if not text:
        return None
    text = text.strip().replace(",", "").replace(" ", "")
    multiplier = 1
    if "K" in text.upper():
        multiplier = 1_000
    elif "M" in text.upper():
        multiplier = 1_000_000
    elif "B" in text.upper():
        multiplier = 1_000_000_000
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if not match:
        return None
    return int(float(match.group(1)) * multiplier)


def parse_float(text: str | None) -> float | None:
    if not text:
        return None
    match = re.search(r"(\d+(?:[\.,]\d+)?)", text)
    if not match:
        return None
    return float(match.group(1).replace(",", "."))


def domain_from_website(website: str | None) -> str | None:
    if not website:
        return None
    normalized = website if website.startswith("http") else f"https://{website}"
    try:
        host = urlparse(normalized).hostname or ""
        return host.replace("www.", "") or None
    except Exception:
        return None


def clean_metrics(payload: dict) -> dict:
    monthly_visits = payload.get("monthly_visits")
    global_rank = payload.get("global_rank")
    bounce_rate = payload.get("bounce_rate")
    pages_per_visit = payload.get("pages_per_visit")

    if not isinstance(monthly_visits, int) or monthly_visits <= 0:
        payload["monthly_visits"] = None
    if not isinstance(global_rank, int) or global_rank <= 0:
        payload["global_rank"] = None
    if bounce_rate is None or not (0 <= float(bounce_rate) <= 100):
        payload["bounce_rate"] = None
    if pages_per_visit is None or not (0 <= float(pages_per_visit) <= 50):
        payload["pages_per_visit"] = None
    return payload


def choose_coherent_visits(
    similarweb_visits: int | None,
    semrush_visits: int | None,
    spyfu_visits: int | None,
    previous_visits: int | None,
) -> int | None:
    values = [v for v in [similarweb_visits, semrush_visits, spyfu_visits] if isinstance(v, int) and v > 0]
    if not values:
        return previous_visits
    values.sort()
    candidate = values[len(values) // 2] if len(values) >= 2 else values[0]
    if isinstance(previous_visits, int) and previous_visits > 0:
        ratio = max(candidate, previous_visits) / min(candidate, previous_visits)
        # Guardrail: if sudden >20x jump, keep previous known stable value.
        if ratio > 20:
            return previous_visits
    return candidate


async def accept_cookies_if_present(page) -> None:
    candidates = [
        "button:has-text('Accept')",
        "button:has-text('I agree')",
        "button:has-text('Accepter')",
        "[id*='accept']",
        "[class*='accept']",
        "[data-testid*='accept']",
    ]
    for selector in candidates:
        try:
            btn = page.locator(selector).first
            if await btn.is_visible(timeout=800):
                await btn.click(timeout=1000)
                await asyncio.sleep(0.5)
                return
        except Exception:
            continue


async def safe_text_content(page, selector: str, timeout_ms: int = 4000) -> str | None:
    try:
        node = page.locator(selector).first
        if await node.count() == 0:
            return None
        return await node.text_content(timeout=timeout_ms)
    except Exception:
        return None


async def open_with_retry(page, url: str, source: str, domain: str) -> tuple[bool, str | None]:
    for attempt in range(2):
        try:
            response = await page.goto(url, wait_until="networkidle", timeout=30_000)
            status_code = response.status if response else 200
            if status_code == 403:
                return False, "blocked_403"
            if status_code == 429:
                if attempt == 0:
                    await asyncio.sleep(60)
                    continue
                return False, "rate_limited_429"

            # Some anti-bot providers return a rendered "blocked" page with HTTP 200.
            body_text = (await page.content()).lower()
            blocked_markers = [
                "request blocked",
                "generated by cloudfront",
                "access denied",
                "sorry, you have been blocked",
                "captcha",
            ]
            if any(marker in body_text for marker in blocked_markers):
                return False, "blocked_challenge_page"
            return True, None
        except Exception as exc:
            if "Timeout" in str(exc):
                return False, "timeout_30s"
            if attempt == 1:
                return False, "navigation_error"
    return False, "unknown"


def empty_similarweb() -> dict:
    return {
        "source": "similarweb",
        "monthly_visits": None,
        "bounce_rate": None,
        "pages_per_visit": None,
        "avg_visit_duration": None,
        "global_rank": None,
    }


async def fetch_similarweb(domain: str, browser):
    page = await browser.new_page(user_agent=random.choice(USER_AGENTS))
    result = empty_similarweb()
    try:
        ok, reason = await open_with_retry(
            page,
            f"https://www.similarweb.com/website/{domain}/",
            "similarweb",
            domain,
        )
        if not ok:
            result["error"] = reason
            return result

        await accept_cookies_if_present(page)
        await page.wait_for_timeout(random.randint(6_000, 12_000))

        values = await page.locator(".engagement-list__item-value").all_text_contents()
        ranks = await page.locator(".wa-rank-list__value").all_text_contents()

        result["monthly_visits"] = parse_int(values[0]) if len(values) > 0 else None
        result["bounce_rate"] = parse_float(values[1]) if len(values) > 1 else None
        result["pages_per_visit"] = parse_float(values[2]) if len(values) > 2 else None
        result["avg_visit_duration"] = values[3].strip() if len(values) > 3 else None
        result["global_rank"] = parse_int(ranks[0]) if len(ranks) > 0 else None
        return clean_metrics(result)
    finally:
        await page.close()


def empty_semrush() -> dict:
    return {
        "source": "semrush",
        "organic_traffic": None,
        "global_rank": None,
        "top_country": None,
    }


async def fetch_semrush(domain: str, browser):
    page = await browser.new_page(user_agent=random.choice(USER_AGENTS))
    result = empty_semrush()
    try:
        ok, reason = await open_with_retry(
            page,
            f"https://www.semrush.com/analytics/overview/?q={domain}",
            "semrush",
            domain,
        )
        if not ok:
            result["error"] = reason
            return result

        await accept_cookies_if_present(page)
        await page.wait_for_timeout(random.randint(5_000, 10_000))

        traffic_text = await safe_text_content(page, "[data-test='total-visits']")
        rank_text = await safe_text_content(page, "[data-test='global-rank']")
        country_text = await safe_text_content(page, "[data-test='top-country']")

        result["organic_traffic"] = parse_int(traffic_text)
        result["global_rank"] = parse_int(rank_text)
        result["top_country"] = country_text.strip() if country_text else None
        return result
    finally:
        await page.close()


def empty_spyfu() -> dict:
    return {
        "source": "spyfu",
        "monthly_traffic": None,
        "organic_keywords": None,
        "traffic_value": None,
    }


async def fetch_spyfu(domain: str, browser):
    page = await browser.new_page(user_agent=random.choice(USER_AGENTS))
    result = empty_spyfu()
    try:
        ok, reason = await open_with_retry(
            page,
            f"https://www.spyfu.com/overview/domain?query={domain}",
            "spyfu",
            domain,
        )
        if not ok:
            result["error"] = reason
            return result

        await accept_cookies_if_present(page)
        await page.wait_for_timeout(random.randint(5_000, 10_000))

        values = await page.locator(".domain-overview-stat-value").all_text_contents()
        result["monthly_traffic"] = parse_int(values[0]) if len(values) > 0 else None
        result["organic_keywords"] = parse_int(values[1]) if len(values) > 1 else None
        result["traffic_value"] = values[2].strip() if len(values) > 2 else None
        return result
    finally:
        await page.close()


def log_fetch(supabase, tool_id: str, source: str, status: str, error_message: str | None = None) -> None:
    payload = {
        "tool_id": tool_id,
        "source": source,
        "status": status,
        "error_message": error_message,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        supabase.table("fetch_log").insert(payload).execute()
    except Exception as exc:
        print(f"[warn] fetch_log insert failed for {tool_id}/{source}: {exc}")


async def fetch_traffic_for_tool(
    tool: dict,
    browser,
    supabase,
    enable_similarweb: bool = True,
    enable_semrush: bool = False,
    enable_spyfu: bool = False,
):
    tool_id = tool["id"]
    domain = domain_from_website(tool.get("website"))
    if not domain:
        return {
            "source_used": "none",
            "monthly_visits": tool.get("monthly_visits"),
            "global_rank": tool.get("global_rank"),
            "bounce_rate": tool.get("bounce_rate"),
            "pages_per_visit": tool.get("pages_per_visit"),
            "avg_visit_duration": tool.get("avg_visit_duration"),
        }

    sw = empty_similarweb()
    if enable_similarweb:
        sw = await fetch_similarweb(domain, browser)
        if sw.get("error"):
            status = "blocked" if "blocked" in str(sw.get("error")) else "fail"
            log_fetch(supabase, tool_id, "similarweb", status, str(sw.get("error")))
        elif sw.get("monthly_visits"):
            log_fetch(supabase, tool_id, "similarweb", "success")
        else:
            log_fetch(supabase, tool_id, "similarweb", "fail", "no_monthly_visits")
    else:
        log_fetch(supabase, tool_id, "similarweb", "fallback", "disabled")

    if sw.get("monthly_visits"):
        chosen = "similarweb"
    else:
        sem = empty_semrush()
        if enable_semrush:
            sem = await fetch_semrush(domain, browser)
            if sem.get("error"):
                status = "blocked" if "blocked" in str(sem.get("error")) else "fail"
                log_fetch(supabase, tool_id, "semrush", status, str(sem.get("error")))
            elif sem.get("organic_traffic"):
                log_fetch(supabase, tool_id, "semrush", "success")
            else:
                log_fetch(supabase, tool_id, "semrush", "fail", "no_organic_traffic")
        else:
            log_fetch(supabase, tool_id, "semrush", "fallback", "disabled")

        if sem.get("organic_traffic"):
            chosen = "semrush"
        else:
            spy = empty_spyfu()
            if enable_spyfu:
                spy = await fetch_spyfu(domain, browser)
                if spy.get("error"):
                    status = "blocked" if "blocked" in str(spy.get("error")) else "fail"
                    log_fetch(supabase, tool_id, "spyfu", status, str(spy.get("error")))
                elif spy.get("monthly_traffic"):
                    log_fetch(supabase, tool_id, "spyfu", "success")
                else:
                    log_fetch(supabase, tool_id, "spyfu", "fail", "no_monthly_traffic")
            else:
                log_fetch(supabase, tool_id, "spyfu", "fallback", "disabled")

            chosen = "spyfu" if spy.get("monthly_traffic") else "fallback_supabase"

            best_monthly_visits = choose_coherent_visits(
                sw.get("monthly_visits"),
                sem.get("organic_traffic"),
                spy.get("monthly_traffic"),
                tool.get("monthly_visits"),
            )
            merged = {
                "source_used": chosen,
                "monthly_visits": best_monthly_visits,
                "global_rank": sw.get("global_rank") or sem.get("global_rank") or tool.get("global_rank"),
                "bounce_rate": sw.get("bounce_rate") or tool.get("bounce_rate"),
                "pages_per_visit": sw.get("pages_per_visit") or tool.get("pages_per_visit"),
                "avg_visit_duration": sw.get("avg_visit_duration") or tool.get("avg_visit_duration"),
                "raw": {"similarweb": sw, "semrush": sem, "spyfu": spy},
            }
            return merged

        best_monthly_visits = choose_coherent_visits(
            sw.get("monthly_visits"),
            sem.get("organic_traffic"),
            None,
            tool.get("monthly_visits"),
        )
        merged = {
            "source_used": chosen,
            "monthly_visits": best_monthly_visits,
            "global_rank": sw.get("global_rank") or sem.get("global_rank") or tool.get("global_rank"),
            "bounce_rate": sw.get("bounce_rate") or tool.get("bounce_rate"),
            "pages_per_visit": sw.get("pages_per_visit") or tool.get("pages_per_visit"),
            "avg_visit_duration": sw.get("avg_visit_duration") or tool.get("avg_visit_duration"),
            "raw": {"similarweb": sw, "semrush": sem},
        }
        return merged

    merged = {
        "source_used": chosen,
        "monthly_visits": choose_coherent_visits(sw.get("monthly_visits"), None, None, tool.get("monthly_visits")),
        "global_rank": sw.get("global_rank") or tool.get("global_rank"),
        "bounce_rate": sw.get("bounce_rate") or tool.get("bounce_rate"),
        "pages_per_visit": sw.get("pages_per_visit") or tool.get("pages_per_visit"),
        "avg_visit_duration": sw.get("avg_visit_duration") or tool.get("avg_visit_duration"),
        "raw": {"similarweb": sw},
    }
    return merged


async def fetch_traffic_for_tool_no_login(tool: dict, supabase):
    """No-login mode: keep existing values and log clean fallback."""
    tool_id = tool["id"]
    log_fetch(supabase, tool_id, "traffic_cascade", "fallback", "no_login_mode")
    return {
        "source_used": "fallback_supabase",
        "monthly_visits": tool.get("monthly_visits"),
        "global_rank": tool.get("global_rank"),
        "bounce_rate": tool.get("bounce_rate"),
        "pages_per_visit": tool.get("pages_per_visit"),
        "avg_visit_duration": tool.get("avg_visit_duration"),
        "raw": {"mode": "no_login"},
    }


def get_tools_group(tools: list[dict]) -> tuple[int, list[dict]]:
    chunks = [tools[i : i + 7] for i in range(0, len(tools), 7)]
    if not chunks:
        return 0, []
    weekday = datetime.now(timezone.utc).weekday()  # Monday=0
    group_index = min(weekday, len(chunks) - 1)
    return group_index, chunks[group_index]


async def main():
    load_dotenv(".env.local")
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError("Missing SUPABASE_URL and/or SUPABASE_KEY")

    supabase = create_client(url, key)
    tools_res = supabase.table("tools").select("id,name,website,monthly_visits,global_rank,bounce_rate,pages_per_visit,avg_visit_duration").execute()
    tools = tools_res.data or []
    group_idx, today_group = get_tools_group(tools)
    print(f"[info] weekly traffic batch group {group_idx + 1} - tools: {len(today_group)}")

    # Stable defaults: Similarweb only.
    use_premium_sources = os.getenv("TRAFFIC_USE_PREMIUM", "true").lower() == "true"
    enable_similarweb = os.getenv("TRAFFIC_ENABLE_SIMILARWEB", "true").lower() == "true"
    enable_semrush = os.getenv("TRAFFIC_ENABLE_SEMRUSH", "false").lower() == "true"
    enable_spyfu = os.getenv("TRAFFIC_ENABLE_SPYFU", "false").lower() == "true"
    headless = os.getenv("TRAFFIC_HEADLESS", "true").lower() == "true"

    if not use_premium_sources:
        print("[info] TRAFFIC_USE_PREMIUM=false -> no-login mode (no Similarweb/Semrush/Spyfu scraping)")
    else:
        print(
            f"[info] premium source flags -> similarweb={enable_similarweb}, semrush={enable_semrush}, spyfu={enable_spyfu}"
        )

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        try:
            for tool in today_group:
                if use_premium_sources:
                    result = await fetch_traffic_for_tool(
                        tool,
                        browser,
                        supabase,
                        enable_similarweb=enable_similarweb,
                        enable_semrush=enable_semrush,
                        enable_spyfu=enable_spyfu,
                    )
                else:
                    result = await fetch_traffic_for_tool_no_login(tool, supabase)
                update_payload = {
                    "monthly_visits": result.get("monthly_visits"),
                    "global_rank": result.get("global_rank"),
                    "bounce_rate": result.get("bounce_rate"),
                    "pages_per_visit": result.get("pages_per_visit"),
                    "avg_visit_duration": result.get("avg_visit_duration"),
                    "traffic_updated_at": datetime.now(timezone.utc).isoformat(),
                }
                supabase.table("tools").update(update_payload).eq("id", tool["id"]).execute()

                # Store merged raw payload in cache for observability/replay.
                # Do not rely on ON CONFLICT here because some environments may
                # not have the expected unique constraint applied yet.
                try:
                    supabase.table("api_cache").insert(
                        {
                            "tool_id": tool["id"],
                            "source": "traffic_cascade",
                            "value": result.get("raw", {}),
                            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                        }
                    ).execute()
                except Exception as cache_exc:
                    print(f"[warn] api_cache insert skipped for {tool['id']}: {cache_exc}")

                final_status = "fallback" if result.get("source_used") == "fallback_supabase" else "success"
                log_fetch(supabase, tool["id"], result.get("source_used", "unknown"), final_status)
                print(f"✅ {tool['name']} : {result.get('monthly_visits') or 'n/a'} visites/mois")
                await asyncio.sleep(random.randint(8, 15))
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
