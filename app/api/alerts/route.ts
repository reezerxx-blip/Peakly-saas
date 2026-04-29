import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { getTools } from '@/lib/get-tools';
import { env } from '@/lib/env';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('alerts')
    .select('id,tool_id,threshold_percent,active,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    const setupHint =
      error.message.includes('relation') && error.message.includes('alerts')
        ? 'Supabase setup missing: run SQL migrations (see INTEGRATIONS.md).'
        : undefined;
    return NextResponse.json({ error: error.message, setupHint }, { status: 500 });
  }

  return NextResponse.json({
    alerts: data ?? [],
    meta: {
      total: data?.length ?? 0,
      active: (data ?? []).filter((item) => item.active).length,
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    toolId?: string;
    thresholdPercent?: number;
  };

  if (!body.toolId) {
    return NextResponse.json({ error: 'toolId is required' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from('users').select('plan').eq('id', user.id).maybeSingle();
  const isOwner = Boolean(env.ownerUserId && user.id === env.ownerUserId);
  if (!isOwner && profile?.plan !== 'pro') {
    return NextResponse.json({ error: 'Pro plan required' }, { status: 403 });
  }
  const { data: existingAlerts } = await admin
    .from('alerts')
    .select('id')
    .eq('user_id', user.id)
    .eq('active', true);
  if ((existingAlerts?.length ?? 0) >= 50) {
    return NextResponse.json({ error: 'Maximum active alerts reached (50)' }, { status: 400 });
  }

  const thresholdPercent = Math.max(1, Number(body.thresholdPercent ?? 15));
  const tools = await getTools();
  const selectedTool = tools.find((tool) => tool.id === body.toolId);
  if (!selectedTool) {
    return NextResponse.json({ error: 'Invalid toolId' }, { status: 400 });
  }

  await admin.from('tools').upsert({
    id: selectedTool.id,
    name: selectedTool.name,
    website: selectedTool.website ?? null,
    category: selectedTool.category,
    description: selectedTool.description,
    trend_score: selectedTool.trendingScore,
    weekly_growth: selectedTool.metrics.monthlyGrowth,
    status: selectedTool.signalType === 'breakthrough' ? 'hot' : selectedTool.signalType,
    data_quality: 'low',
    updated_at: new Date().toISOString(),
  });

  const { data, error } = await admin
    .from('alerts')
    .insert({
      user_id: user.id,
      tool_id: body.toolId,
      threshold_percent: thresholdPercent,
      active: true,
    })
    .select('id,tool_id,threshold_percent,active,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alert: data });
}
