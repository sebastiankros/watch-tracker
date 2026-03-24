import { NextResponse } from 'next/server';
import { checkAlerts, getSettings } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Called by Vercel Cron after scraping to check and send alerts.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const triggered = await checkAlerts();
  if (triggered.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No alerts triggered' });
  }

  const settings = getSettings();
  const email = settings.alertEmail;

  // Send email if Resend is configured and email is set
  if (email && process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const dealLines = triggered.flatMap(alert =>
        alert.deals.map(d =>
          `- ${alert.brand || ''} ${alert.modelName || alert.watchId || 'Watch'}: $${d.price.toLocaleString()} on ${d.source}`
        )
      );

      await resend.emails.send({
        from: 'Watch Tracker <alerts@watch-tracker.app>',
        to: email,
        subject: `Watch Alert: ${triggered.length} deal${triggered.length > 1 ? 's' : ''} found`,
        text: `Your watch deal alerts were triggered!\n\n${dealLines.join('\n')}\n\nView all deals: https://watch-tracker-sigma.vercel.app/deals`,
      });

      return NextResponse.json({ sent: triggered.length, email, message: 'Alerts sent' });
    } catch (err) {
      return NextResponse.json({ sent: 0, error: `Email failed: ${err instanceof Error ? err.message : String(err)}`, triggered: triggered.length });
    }
  }

  return NextResponse.json({ sent: 0, triggered: triggered.length, message: 'No email configured — alerts triggered but not sent' });
}
