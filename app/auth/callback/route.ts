import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const callbackError = requestUrl.searchParams.get('error');
  const callbackErrorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  if (callbackError) {
    const params = new URLSearchParams({
      error: callbackError,
      error_description: callbackErrorDescription ?? 'oauth_callback_error',
    });
    return NextResponse.redirect(`${origin}/auth?${params.toString()}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code&error_description=missing_authorization_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const params = new URLSearchParams({
      error: 'oauth_failed',
      error_description: error?.message ?? 'unable_to_exchange_code_for_session',
    });
    return NextResponse.redirect(`${origin}/auth?${params.toString()}`);
  }

  const admin = createSupabaseAdminClient();
  await admin.from('users').upsert({
    id: data.user.id,
    email: data.user.email,
    full_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
    avatar_url: data.user.user_metadata?.avatar_url ?? null,
    plan: 'free',
  });

  return NextResponse.redirect(`${origin}/trends`);
}
