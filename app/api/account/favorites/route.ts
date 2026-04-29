import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('user_favorites')
    .select('id,tool_id,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ favorites: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { toolId?: string };
  if (!body.toolId) return NextResponse.json({ error: 'toolId is required' }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('user_favorites')
    .upsert({ user_id: user.id, tool_id: body.toolId }, { onConflict: 'user_id,tool_id' })
    .select('id,tool_id,created_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ favorite: data });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requestUrl = new URL(request.url);
  const toolId = requestUrl.searchParams.get('toolId');
  if (!toolId) return NextResponse.json({ error: 'toolId is required' }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('user_favorites').delete().eq('user_id', user.id).eq('tool_id', toolId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
