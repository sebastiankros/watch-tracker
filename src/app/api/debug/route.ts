import { NextResponse } from 'next/server';
import { scrapeChrono24, scrapeEbay } from '@/lib/scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const query = 'Omega Speedmaster';
  const maxPrice = 50000;
  const results: Record<string, unknown> = {
    startTime: new Date().toISOString(),
    envKeys: {
      SCRAPER_API_KEY: process.env.SCRAPER_API_KEY ? `${process.env.SCRAPER_API_KEY.slice(0, 6)}...` : 'MISSING',
      SCRAPINGBEE_API_KEY: process.env.SCRAPINGBEE_API_KEY ? `${process.env.SCRAPINGBEE_API_KEY.slice(0, 6)}...` : 'MISSING',
    },
  };

  // Test Chrono24
  const c24Start = Date.now();
  try {
    const c24 = await scrapeChrono24(query, maxPrice);
    results.chrono24 = {
      count: c24.length,
      timeMs: Date.now() - c24Start,
      sample: c24.slice(0, 3).map((l) => ({ title: l.title, price: l.price, source: l.source })),
    };
  } catch (e: unknown) {
    results.chrono24 = { error: String(e), timeMs: Date.now() - c24Start };
  }

  // Test eBay
  const ebayStart = Date.now();
  try {
    const ebay = await scrapeEbay(query, maxPrice);
    results.ebay = {
      count: ebay.length,
      timeMs: Date.now() - ebayStart,
      sample: ebay.slice(0, 3).map((l) => ({ title: l.title, price: l.price, source: l.source })),
    };
  } catch (e: unknown) {
    results.ebay = { error: String(e), timeMs: Date.now() - ebayStart };
  }

  results.totalTimeMs = Date.now() - c24Start;
  results.endTime = new Date().toISOString();

  return NextResponse.json(results);
}
