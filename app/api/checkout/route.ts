import { NextResponse } from 'next/server';
import { createLemonCheckout } from '@/lib/billing';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('users')
    .select('full_name,email')
    .eq('id', user.id)
    .maybeSingle();

  const checkoutUrl = await createLemonCheckout({
    userId: user.id,
    userEmail: profile?.email ?? user.email ?? '',
    userName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
  });

  if (!checkoutUrl) {
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }

  return NextResponse.json({ checkoutUrl });
}
