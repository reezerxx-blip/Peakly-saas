import { NextResponse } from 'next/server';
import { verifyLemonSignature } from '@/lib/billing';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

type LemonWebhookPayload = {
  meta?: {
    custom_data?: {
      user_id?: string;
    };
  };
  data?: {
    attributes?: {
      user_email?: string;
      status?: string;
      renews_at?: string;
      ends_at?: string | null;
      cancelled?: boolean;
    };
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature');

  if (!verifyLemonSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const eventName = request.headers.get('x-event-name') ?? '';
  const payload = JSON.parse(rawBody) as LemonWebhookPayload;
  const userId = payload.meta?.custom_data?.user_id;
  const userEmail = payload.data?.attributes?.user_email;

  if (!userId && !userEmail) {
    return NextResponse.json({ ok: true });
  }

  const status = payload.data?.attributes?.status ?? '';
  const cancelled = payload.data?.attributes?.cancelled ?? false;
  const plan = status === 'active' && !cancelled ? 'pro' : 'free';
  const proExpiresAt = payload.data?.attributes?.renews_at ?? payload.data?.attributes?.ends_at ?? null;

  const admin = createSupabaseAdminClient();
  let query = admin.from('users').update({ plan, pro_expires_at: proExpiresAt });
  if (userId) {
    query = query.eq('id', userId);
  } else if (userEmail) {
    query = query.eq('email', userEmail);
  }

  await query;

  return NextResponse.json({ ok: true, eventName });
}
