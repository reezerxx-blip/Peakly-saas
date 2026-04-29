import { createClient } from '@supabase/supabase-js';

export type DataHealth = {
  lastSyncAt: string | null;
  syncedTools: number;
  quality: 'high' | 'medium' | 'low' | 'unknown';
  activeSources: string[];
};

type ToolHealthRow = {
  updated_at: string | null;
  data_quality: 'high' | 'medium' | 'low' | null;
};

type FetchLogRow = {
  source: string;
  status: 'success' | 'fail' | 'cached' | 'fallback';
};

function pickQuality(rows: ToolHealthRow[]): DataHealth['quality'] {
  const qualities = rows
    .map((row) => row.data_quality)
    .filter((value): value is 'high' | 'medium' | 'low' => Boolean(value));
  if (qualities.length === 0) return 'unknown';
  if (qualities.includes('high')) return 'high';
  if (qualities.includes('medium')) return 'medium';
  return 'low';
}

export async function getDataHealth(): Promise<DataHealth | null> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    const [{ data: toolsRows, error: toolsError }, { data: logsRows, error: logsError }] =
      await Promise.all([
        supabase
          .from('tools')
          .select('updated_at,data_quality')
          .order('updated_at', { ascending: false })
          .limit(1000),
        supabase.from('fetch_log').select('source,status').order('fetched_at', { ascending: false }).limit(200),
      ]);

    if (toolsError || logsError) return null;

    const tools = (toolsRows ?? []) as ToolHealthRow[];
    const logs = (logsRows ?? []) as FetchLogRow[];

    const lastSyncAt = tools.find((row) => row.updated_at)?.updated_at ?? null;
    const quality = pickQuality(tools);
    const activeSources = Array.from(
      new Set(logs.filter((row) => row.status === 'success' || row.status === 'cached').map((row) => row.source))
    ).slice(0, 8);

    return {
      lastSyncAt,
      syncedTools: tools.length,
      quality,
      activeSources,
    };
  } catch {
    return null;
  }
}
