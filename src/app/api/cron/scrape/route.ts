import { NextResponse } from 'next/server';
import { cronScrape } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Called by Vercel Cron every 30 minutes.
// Scrapes a rotating batch of 8 watches per run.
// All 30 watches get fresh data within ~2 hours.
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow without auth in dev or if CRON_SECRET not set
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startTime = Date.now();
  const result = await cronScrape();

  return NextResponse.json({
    ...result,
    timeMs: Date.now() - startTime,
    nextRotation: 'Next batch in 30 minutes',
  });
}
