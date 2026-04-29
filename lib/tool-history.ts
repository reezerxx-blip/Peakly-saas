import { createClient } from '@supabase/supabase-js';

export type ToolHistoryPoint = {
  recordedAt: string;
  trendScore: number;
};

export async function getToolHistory(toolId: string, limit = 20): Promise<ToolHistoryPoint[]> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await client
      .from('score_history')
      .select('recorded_at,trend_score')
      .eq('tool_id', toolId)
      .order('recorded_at', { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return data.map((item) => ({
      recordedAt: item.recorded_at as string,
      trendScore: Number(item.trend_score ?? 0),
    }));
  } catch {
    return [];
  }
}
