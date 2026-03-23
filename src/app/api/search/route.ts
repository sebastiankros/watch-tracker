import { NextResponse } from 'next/server';
import { scrapeWatch, getMarketplaceSearchUrls } from '@/lib/scraper';
import { getSettings } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// In-memory cache for search results
const searchCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const cacheKey = q.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const { maxPrice } = getSettings();
    const marketData = await scrapeWatch(q, maxPrice);
    const searchUrls = getMarketplaceSearchUrls(q);

    const filteredListings = marketData.listings.filter(
      (l) => l.price && l.price >= 500 && l.price <= maxPrice
    );

    const result = {
      query: q,
      listings: filteredListings,
      marketPrice: marketData.marketPrice,
      medianPrice: marketData.medianPrice,
      lowPrice: marketData.lowPrice,
      highPrice: marketData.highPrice,
      sampleSize: marketData.sampleSize,
      scrapedAt: marketData.scrapedAt,
      searchUrls,
    };

    searchCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Search scrape error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data. Please try again.' },
      { status: 500 }
    );
  }
}
