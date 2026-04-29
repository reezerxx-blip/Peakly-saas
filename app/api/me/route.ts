import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  let { data: profile } = await admin
    .from('users')
    .select('id,email,full_name,plan')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    await admin.from('users').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      plan: 'free',
    });

    const result = await admin
      .from('users')
      .select('id,email,full_name,plan')
      .eq('id', user.id)
      .maybeSingle();
    profile = result.data ?? null;
  }

  const isOwner = Boolean(env.ownerUserId && user.id === env.ownerUserId);
  const effectivePlan: 'free' | 'pro' = isOwner ? 'pro' : (profile?.plan ?? 'free');

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
      plan: effectivePlan,
    },
  });
}
