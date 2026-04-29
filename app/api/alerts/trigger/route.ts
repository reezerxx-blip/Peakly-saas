import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { env } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const secret = request.headers.get('x-trigger-secret');
  if (secret !== process.env.ALERTS_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  const { data: tools, error: toolsError } = await admin
    .from('tools')
    .select('id,name,weekly_growth')
    .gt('weekly_growth', 15);

  if (toolsError) {
    return NextResponse.json({ error: toolsError.message }, { status: 500 });
  }

  if (!tools?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 });
  }
  const resend = new Resend(resendKey);

  for (const tool of tools) {
    const { data: matchingAlerts } = await admin
      .from('alerts')
      .select('id,user_id,threshold_percent,users!inner(email,full_name)')
      .eq('tool_id', tool.id)
      .eq('active', true)
      .lte('threshold_percent', tool.weekly_growth);

    for (const alert of matchingAlerts ?? []) {
      const user = Array.isArray(alert.users) ? alert.users[0] : alert.users;
      if (!user?.email) continue;

      await resend.emails.send({
        from: 'Peakly Alerts <alerts@your-domain.com>',
        to: user.email,
        subject: `${tool.name} passe a +${tool.weekly_growth}%`,
        html: `
          <p>Bonjour ${user.full_name ?? 'there'},</p>
          <p><strong>${tool.name}</strong> vient de depasser votre seuil d'alerte.</p>
          <p>Trafic actuel: <strong>+${tool.weekly_growth}%</strong></p>
          <p>Connectez-vous a Peakly pour voir les signaux:</p>
          <p><a href="${env.appUrl}/alerts">Voir mes alertes</a></p>
        `,
      });
      sent += 1;
    }
  }

  return NextResponse.json({ sent });
}
