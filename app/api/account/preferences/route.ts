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
    .from('user_preferences')
    .select('theme,language,email_alerts_enabled')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    preferences: data ?? {
      theme: 'dark',
      language: 'fr',
      email_alerts_enabled: true,
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as {
    theme?: 'dark' | 'system';
    language?: 'fr' | 'en';
    email_alerts_enabled?: boolean;
  };
  const payload = {
    user_id: user.id,
    theme: body.theme === 'system' ? 'system' : 'dark',
    language: body.language === 'en' ? 'en' : 'fr',
    email_alerts_enabled: Boolean(body.email_alerts_enabled),
    updated_at: new Date().toISOString(),
  };

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select('theme,language,email_alerts_enabled')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ preferences: data });
}
