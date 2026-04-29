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
  const updates = {
    plan,
    pro_expires_at: proExpiresAt,
    ...(userEmail ? { email: userEmail } : {}),
  };

  const { data: updatedRows, error: updateError } = userId
    ? await admin
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select('id')
    : await admin
        .from('users')
        .update(updates)
        .eq('email', userEmail as string)
        .select('id');

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update user plan' }, { status: 500 });
  }

  // Checkout can complete before the app has created a row in users.
  // In that case, create it so premium status is not lost.
  if (!updatedRows || updatedRows.length === 0) {
    const upsertPayload = userId
      ? { id: userId, ...updates }
      : { email: userEmail as string, ...updates };
    const { error: upsertError } = await admin.from('users').upsert(upsertPayload);

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to persist user plan' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, eventName });
}
