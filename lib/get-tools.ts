import { createClient } from '@supabase/supabase-js';
import type { Tool } from '@/lib/data';
import { toolsData, type ToolData } from '@/lib/tools-data';

export type ToolsFilter = {
  category?: string;
  status?: 'hot' | 'rising' | 'stable' | 'declining';
  dataQuality?: 'high' | 'medium' | 'low';
};

export type AppTool = Tool & {
  dataQuality?: 'high' | 'medium' | 'low' | 'unknown';
  lastUpdatedAt?: string | null;
  monthlyVisits?: number;
  weeklyGrowth?: number;
  pricing?: string;
  launched?: number;
  tags?: string[];
  githubRepo?: string;
  youtubeQuery?: string;
  redditQuery?: string;
  phSlug?: string;
  country?: string;
  companySize?: 'startup' | 'scaleup' | 'enterprise';
  fundingStage?: 'seed' | 'series-a' | 'series-b+' | 'bootstrapped';
};

type SupabaseToolRow = {
  id: string;
  name: string;
  website: string | null;
  category: string | null;
  description: string | null;
  pricing: string | null;
  launched: number | null;
  trend_score: number | null;
  weekly_growth: number | null;
  monthly_visits: number | null;
  status: 'hot' | 'rising' | 'stable' | 'declining' | null;
  data_quality: 'high' | 'medium' | 'low' | null;
};

function statusToSignal(status: SupabaseToolRow['status']): Tool['signalType'] {
  if (status === 'hot') return 'breakthrough';
  if (status === 'rising') return 'rising';
  if (status === 'declining') return 'declining';
  return 'stable';
}

function inferMonthlyGrowth(weeklyGrowth?: number | null): number {
  const weekly = Number(weeklyGrowth ?? 0);
  const monthly = (Math.pow(1 + weekly / 100, 4) - 1) * 100;
  return Number.isFinite(monthly) ? Math.round(monthly * 100) / 100 : 0;
}

function resolveSignalType(row: SupabaseToolRow): Tool['signalType'] {
  const fromStatus = statusToSignal(row.status);
  const growth = row.weekly_growth ?? 0;
  const score = row.trend_score ?? 0;

  // Guardrail: when pipeline status is stale/incoherent, infer a sensible signal from growth + score.
  if (fromStatus === 'declining' && growth > 0.75) {
    return score >= 85 || growth >= 8 ? 'breakthrough' : 'rising';
  }
  if ((fromStatus === 'stable' || fromStatus === 'rising') && growth <= -1.5) {
    return 'declining';
  }
  if (fromStatus === 'stable' && score >= 90 && growth >= 3) {
    return 'breakthrough';
  }
  return fromStatus;
}

function fromToolsData(tool: ToolData): AppTool {
  const monthlyGrowth = inferMonthlyGrowth(tool.weeklyGrowth);
  return {
    id: tool.id,
    name: tool.name,
    category: tool.category,
    description: tool.description,
    trending: tool.trendScore >= 70,
    trendingScore: tool.trendScore,
    signalType: tool.status === 'hot' ? 'breakthrough' : tool.status,
    newsCount: 0,
    metrics: {
      monthlyGrowth,
      userSentiment: 70,
      adoptionRate: Math.min(100, Math.max(20, Math.round(tool.trendScore * 0.9))),
    },
    website: tool.website,
    monthlyVisits: tool.monthlyVisits,
    weeklyGrowth: tool.weeklyGrowth,
    pricing: tool.pricing,
    launched: tool.launched,
    tags: tool.tags,
    githubRepo: tool.github_repo,
    youtubeQuery: tool.youtube_query,
    redditQuery: tool.reddit_query,
    phSlug: tool.ph_slug,
    country: 'Global',
    companySize: tool.monthlyVisits > 20_000_000 ? 'enterprise' : tool.monthlyVisits > 5_000_000 ? 'scaleup' : 'startup',
    fundingStage: tool.pricing === 'free' ? 'bootstrapped' : tool.trendScore > 90 ? 'series-b+' : tool.trendScore > 80 ? 'series-a' : 'seed',
    dataQuality: 'low',
    lastUpdatedAt: null,
  };
}

function fromSupabaseRow(row: SupabaseToolRow): AppTool {
  const trend = row.trend_score ?? 0;
  const signalType = resolveSignalType(row);
  const monthlyGrowth = inferMonthlyGrowth(row.weekly_growth);
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? 'Unknown',
    description: row.description ?? '',
    trending: trend >= 70,
    trendingScore: trend,
    signalType,
    newsCount: 0,
    metrics: {
      monthlyGrowth,
      userSentiment: 72,
      adoptionRate: Math.min(100, Math.max(20, Math.round(trend * 0.9))),
    },
    website: row.website ?? undefined,
    monthlyVisits: row.monthly_visits ?? undefined,
    weeklyGrowth: row.weekly_growth ?? undefined,
    pricing: row.pricing ?? undefined,
    launched: row.launched ?? undefined,
    country: 'Global',
    companySize: (row.monthly_visits ?? 0) > 20_000_000 ? 'enterprise' : (row.monthly_visits ?? 0) > 5_000_000 ? 'scaleup' : 'startup',
    fundingStage: row.pricing === 'free' ? 'bootstrapped' : trend > 90 ? 'series-b+' : trend > 80 ? 'series-a' : 'seed',
    dataQuality: row.data_quality ?? 'unknown',
    lastUpdatedAt: null,
  };
}

function applyFilters(rows: SupabaseToolRow[], filters?: ToolsFilter): SupabaseToolRow[] {
  if (!filters) return rows;
  return rows.filter((row) => {
    if (filters.category && row.category !== filters.category) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.dataQuality && row.data_quality !== filters.dataQuality) return false;
    return true;
  });
}

async function fetchFromSupabase(filters?: ToolsFilter): Promise<AppTool[] | null> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client
    .from('tools')
    .select(
      'id,name,website,category,description,pricing,launched,trend_score,weekly_growth,monthly_visits,status,data_quality'
    )
    .order('trend_score', { ascending: false });

  if (error || !data || data.length === 0) return null;
  const filtered = applyFilters(data as SupabaseToolRow[], filters);
  return filtered.map(fromSupabaseRow);
}

export async function getTools(filters?: ToolsFilter): Promise<AppTool[]> {
  const fallbackAll = toolsData.map(fromToolsData);
  const fallbackById = new Map(fallbackAll.map((tool) => [tool.id, tool]));

  // Keep Supabase as source of truth when present, but do not hide tools not fetched yet.
  const supabaseTools = await fetchFromSupabase();
  if (supabaseTools && supabaseTools.length > 0) {
    for (const tool of supabaseTools) {
      const base = fallbackById.get(tool.id);
      fallbackById.set(tool.id, {
        ...(base ?? {}),
        ...tool,
        website: tool.website ?? base?.website,
        monthlyVisits: tool.monthlyVisits ?? base?.monthlyVisits,
        weeklyGrowth: tool.weeklyGrowth ?? base?.weeklyGrowth,
        pricing: tool.pricing ?? base?.pricing,
        launched: tool.launched ?? base?.launched,
        tags: tool.tags ?? base?.tags,
        githubRepo: tool.githubRepo ?? base?.githubRepo,
        youtubeQuery: tool.youtubeQuery ?? base?.youtubeQuery,
        redditQuery: tool.redditQuery ?? base?.redditQuery,
        phSlug: tool.phSlug ?? base?.phSlug,
      } as AppTool);
    }
  }

  const merged = Array.from(fallbackById.values()).filter((tool) => {
    if (!filters) return true;
    if (filters.category && tool.category !== filters.category) return false;
    if (filters.status) {
      const status = tool.signalType === 'breakthrough' ? 'hot' : tool.signalType;
      if (status !== filters.status) return false;
    }
    return true;
  });

  // dataQuality filter is only available from Supabase rows; if requested, use Supabase-only filtered data.
  if (filters?.dataQuality) {
    const supabaseFiltered = await fetchFromSupabase(filters);
    return (supabaseFiltered ?? []).sort((a, b) => b.trendingScore - a.trendingScore);
  }

  return merged.sort((a, b) => b.trendingScore - a.trendingScore);
}
