import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WATCH_DATABASE, generateListings, generatePriceHistory } from '@/lib/watch-data';

export async function GET() {
  try {
    // Simulate a data refresh by updating prices with small variations
    const watches = await prisma.watch.findMany();

    for (const watch of watches) {
      const variation = 1 + (Math.random() - 0.5) * 0.04; // ±2%
      const newPrice = Math.round(watch.marketPrice * variation / 100) * 100;

      await prisma.watch.update({
        where: { id: watch.id },
        data: {
          previousPrice: watch.marketPrice,
          marketPrice: Math.max(newPrice, 1000),
          lastUpdated: new Date(),
        },
      });

      // Add a new price history entry
      await prisma.priceHistory.create({
        data: {
          watchId: watch.id,
          price: newPrice,
          source: 'Market Refresh',
          date: new Date(),
        },
      });
    }

    // Refresh some listings - deactivate old ones, create new ones
    await prisma.listing.updateMany({
      where: {
        listedDate: { lt: new Date(Date.now() - 30 * 86400000) },
      },
      data: { isActive: false },
    });

    // Add some new listings
    const watchRefs = WATCH_DATABASE.slice(0, 20); // refresh a subset
    for (const ref of watchRefs) {
      const dbWatch = await prisma.watch.findUnique({ where: { reference: ref.reference } });
      if (!dbWatch) continue;

      const newListings = generateListings({ ...ref, marketPrice: dbWatch.marketPrice }, 1);
      for (const listing of newListings) {
        await prisma.listing.create({
          data: {
            watchId: dbWatch.id,
            ...listing,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Refreshed ${watches.length} watches`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
