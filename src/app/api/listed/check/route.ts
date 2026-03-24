import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Checks if source URLs are still live.
// Called from client with the listed watches array, returns availability status.
// Also callable from cron via POST with body.
export async function POST(request: Request) {
  try {
    const { watches } = await request.json() as { watches: { id: string; sourceUrl: string }[] };
    if (!watches || !Array.isArray(watches) || watches.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || '';

    // Check each URL — use a lightweight HEAD/GET via ScraperAPI to save credits
    // We only check up to 5 per call to stay within timeout
    const batch = watches.slice(0, 5);
    const results: { id: string; available: boolean; status: number | null }[] = [];

    for (const watch of batch) {
      try {
        let status: number;
        if (SCRAPER_API_KEY) {
          // Use ScraperAPI to bypass blocks
          const proxyUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(watch.sourceUrl)}`;
          const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
          const html = await res.text();
          // Check if listing is still active (not sold/removed)
          const isSold = /\b(sold|no longer available|removed|expired|ended)\b/i.test(html.slice(0, 5000));
          const is404 = res.status === 404 || html.includes('Page not found') || html.includes('404');
          status = res.status;
          results.push({ id: watch.id, available: res.ok && !isSold && !is404, status });
        } else {
          // Direct fetch as fallback (may get blocked)
          const res = await fetch(watch.sourceUrl, {
            signal: AbortSignal.timeout(8000),
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
          });
          status = res.status;
          results.push({ id: watch.id, available: res.ok, status });
        }
      } catch {
        results.push({ id: watch.id, available: false, status: null });
      }
    }

    return NextResponse.json({ results, checked: results.length, total: watches.length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
