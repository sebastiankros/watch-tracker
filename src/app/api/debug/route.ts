import { NextResponse } from 'next/server';
import { scrapeChrono24, scrapeEbay, calculateMarketStats } from '@/lib/scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const startTime = Date.now();
  const query = 'Omega Speedmaster';
  const maxPrice = 50000;

  const results: Record<string, unknown> = {
    startTime: new Date().toISOString(),
    query,
  };

  // Test Chrono24 scraper end-to-end
  const t1 = Date.now();
  let c24Listings: Awaited<ReturnType<typeof scrapeChrono24>> = [];
  try {
    c24Listings = await scrapeChrono24(query, maxPrice);
    results.chrono24 = {
      timeMs: Date.now() - t1,
      listingsCount: c24Listings.length,
      first3: c24Listings.slice(0, 3).map(l => ({
        title: l.title,
        price: l.price,
        source: l.source,
        url: l.url.slice(0, 80),
      })),
      priceRange: c24Listings.length > 0
        ? { min: Math.min(...c24Listings.map(l => l.price!)), max: Math.max(...c24Listings.map(l => l.price!)) }
        : null,
    };
  } catch (e: unknown) {
    results.chrono24 = { error: e instanceof Error ? e.message : String(e), timeMs: Date.now() - t1 };
  }

  // Test eBay scraper end-to-end
  const t2 = Date.now();
  let ebayListings: Awaited<ReturnType<typeof scrapeEbay>> = [];
  try {
    ebayListings = await scrapeEbay(query, maxPrice);
    results.ebay = {
      timeMs: Date.now() - t2,
      listingsCount: ebayListings.length,
      first3: ebayListings.slice(0, 3).map(l => ({
        title: l.title,
        price: l.price,
        source: l.source,
        url: l.url.slice(0, 80),
      })),
      priceRange: ebayListings.length > 0
        ? { min: Math.min(...ebayListings.map(l => l.price!)), max: Math.max(...ebayListings.map(l => l.price!)) }
        : null,
    };
  } catch (e: unknown) {
    results.ebay = { error: e instanceof Error ? e.message : String(e), timeMs: Date.now() - t2 };
  }

  // Calculate market stats from combined listings
  const allListings = [...c24Listings, ...ebayListings];
  const stats = calculateMarketStats(allListings, 500, maxPrice);

  // Find deals (listings below market price)
  let dealCount = 0;
  const sampleDeals: unknown[] = [];
  if (stats.marketPrice) {
    for (const l of allListings) {
      if (l.price && l.price < stats.marketPrice) {
        dealCount++;
        if (sampleDeals.length < 3) {
          const discount = ((stats.marketPrice - l.price) / stats.marketPrice * 100).toFixed(1);
          sampleDeals.push({
            title: l.title,
            price: l.price,
            marketPrice: stats.marketPrice,
            discount: `${discount}%`,
            savings: stats.marketPrice - l.price,
            source: l.source,
          });
        }
      }
    }
  }

  results.combined = {
    totalListings: allListings.length,
    marketPrice: stats.marketPrice,
    medianPrice: stats.medianPrice,
    lowPrice: stats.lowPrice,
    highPrice: stats.highPrice,
    sampleSize: stats.sampleSize,
    dealCount,
    sampleDeals,
  };

  results.totalTimeMs = Date.now() - startTime;
  return NextResponse.json(results);
}
