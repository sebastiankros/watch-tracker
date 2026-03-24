import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || '';
  const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY || '';
  const query = 'Omega Speedmaster';
  const encoded = encodeURIComponent(query);
  const targetUrl = `https://www.chrono24.com/search/index.htm?query=${encoded}&dosearch=true&usedWhere=us&priceTo=50000&priceFrom=500`;

  const results: Record<string, unknown> = {
    startTime: new Date().toISOString(),
    envKeys: {
      SCRAPER_API_KEY: SCRAPER_API_KEY ? `${SCRAPER_API_KEY.slice(0, 8)}...len=${SCRAPER_API_KEY.length}` : 'MISSING',
      SCRAPINGBEE_API_KEY: SCRAPINGBEE_API_KEY ? `${SCRAPINGBEE_API_KEY.slice(0, 8)}...len=${SCRAPINGBEE_API_KEY.length}` : 'MISSING',
    },
  };

  // Test ScraperAPI directly
  const scraperApiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}`;
  const t1 = Date.now();
  try {
    const res = await fetch(scraperApiUrl, { signal: AbortSignal.timeout(20000) });
    const text = await res.text();
    results.scraperapi = {
      status: res.status,
      timeMs: Date.now() - t1,
      bodyLength: text.length,
      bodySnippet: text.slice(0, 500),
      hasListings: text.includes('"price"'),
    };
  } catch (e: unknown) {
    results.scraperapi = {
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      timeMs: Date.now() - t1,
    };
  }

  // Test ScrapingBee directly
  const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(targetUrl)}&render_js=false`;
  const t2 = Date.now();
  try {
    const res = await fetch(scrapingBeeUrl, { signal: AbortSignal.timeout(20000) });
    const text = await res.text();
    results.scrapingbee = {
      status: res.status,
      timeMs: Date.now() - t2,
      bodyLength: text.length,
      bodySnippet: text.slice(0, 500),
      hasListings: text.includes('"price"'),
    };
  } catch (e: unknown) {
    results.scrapingbee = {
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      timeMs: Date.now() - t2,
    };
  }

  results.totalTimeMs = Date.now() - t1;
  return NextResponse.json(results);
}
