import { NextResponse } from 'next/server';
import { scrapeEbay, calculateMarketStats } from '@/lib/scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const listings = await scrapeEbay(q);
    const filtered = listings.filter((l) => l.price && l.price >= 500 && l.price <= 7000);
    const stats = calculateMarketStats(filtered, 500, 7000);

    return NextResponse.json({
      results: filtered.slice(0, 20).map((l) => ({
        brand: q.split(' ')[0] || 'Watch',
        model: q,
        reference: '',
        marketPrice: stats.marketPrice,
        price: l.price,
        source: l.source,
        url: l.url,
        title: l.title,
      })),
    });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
