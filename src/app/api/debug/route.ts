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
    query,
    envKeys: {
      SCRAPER_API_KEY: SCRAPER_API_KEY ? `${SCRAPER_API_KEY.slice(0, 8)}...len=${SCRAPER_API_KEY.length}` : 'MISSING',
      SCRAPINGBEE_API_KEY: SCRAPINGBEE_API_KEY ? `${SCRAPINGBEE_API_KEY.slice(0, 8)}...len=${SCRAPINGBEE_API_KEY.length}` : 'MISSING',
    },
  };

  // Test 1: Direct fetch (like old debug endpoint) — this worked before
  const t0 = Date.now();
  try {
    const scraperApiUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(scraperApiUrl, { signal: AbortSignal.timeout(20000) });
    const text = await res.text();
    // Try the regex extraction on this HTML
    const offerBlocks = Array.from(text.matchAll(/"name":"([^"]+)"[\s\S]{0,300}?"price":"(\d+)"[\s\S]{0,300}?"url":"([^"]+)"/g));
    const c24Filtered = offerBlocks.filter(m => m[3].includes('chrono24.com'));
    results.directFetch = {
      status: res.status,
      timeMs: Date.now() - t0,
      bodyLength: text.length,
      hasJsonLd: text.includes('@graph'),
      regexMatchesTotal: offerBlocks.length,
      regexMatchesChrono24: c24Filtered.length,
      first3: c24Filtered.slice(0, 3).map(m => ({ name: m[1], price: m[2], url: m[3].slice(0, 60) })),
    };
  } catch (e: unknown) {
    results.directFetch = { error: e instanceof Error ? `${e.name}: ${e.message}` : String(e), timeMs: Date.now() - t0 };
  }

  // Test 2: Import and run scraper function
  const t1 = Date.now();
  try {
    // Dynamic import to catch import errors
    const scraper = await import('@/lib/scraper');
    const c24Listings = await scraper.scrapeChrono24(query, 50000);
    results.scraperFunction = {
      timeMs: Date.now() - t1,
      listingsCount: c24Listings.length,
      first3: c24Listings.slice(0, 3).map(l => ({ title: l.title, price: l.price, source: l.source })),
    };
  } catch (e: unknown) {
    // Get the full error chain
    let errMsg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    if (e instanceof AggregateError) {
      errMsg += ' | errors: ' + e.errors.map((err: Error) => `${err.name}: ${err.message}`).join(' | ');
    }
    results.scraperFunction = { error: errMsg, timeMs: Date.now() - t1 };
  }

  // Test 3: eBay scraper
  const t2 = Date.now();
  try {
    const scraper = await import('@/lib/scraper');
    const ebayListings = await scraper.scrapeEbay(query, 50000);
    results.ebayFunction = {
      timeMs: Date.now() - t2,
      listingsCount: ebayListings.length,
      first3: ebayListings.slice(0, 3).map(l => ({ title: l.title, price: l.price, source: l.source })),
    };
  } catch (e: unknown) {
    let errMsg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    if (e instanceof AggregateError) {
      errMsg += ' | errors: ' + e.errors.map((err: Error) => `${err.name}: ${err.message}`).join(' | ');
    }
    results.ebayFunction = { error: errMsg, timeMs: Date.now() - t2 };
  }

  // Test 4: Deals from store
  const t3 = Date.now();
  try {
    const store = await import('@/lib/store');
    const dealsData = await store.getDeals({ minDiscount: 0, maxPrice: 50000 });
    results.deals = {
      timeMs: Date.now() - t3,
      totalDeals: dealsData.deals.length,
      stats: dealsData.stats,
      first5: dealsData.deals.slice(0, 5).map(d => ({
        watch: `${d.brand} ${d.model}`,
        price: d.listingPrice,
        market: d.marketPrice,
        discount: d.discount,
        source: d.source,
        score: d.dealScore,
      })),
    };
  } catch (e: unknown) {
    results.deals = { error: e instanceof Error ? e.message : String(e), timeMs: Date.now() - t3 };
  }

  results.totalTimeMs = Date.now() - t0;
  return NextResponse.json(results);
}
