import { prisma } from './prisma';
import {
  WATCH_DATABASE,
  generateListings,
  generatePriceHistory,
  generateSoldRecords,
} from './watch-data';

export async function seedDatabase() {
  // Check if already seeded
  const count = await prisma.watch.count();
  if (count > 0) return { seeded: false, count };

  console.log('Seeding database with watch data...');

  for (const watchRef of WATCH_DATABASE) {
    // Random historical prices
    const price7d = Math.round(watchRef.marketPrice * (0.97 + Math.random() * 0.06) / 100) * 100;
    const price30d = Math.round(watchRef.marketPrice * (0.94 + Math.random() * 0.12) / 100) * 100;
    const price90d = Math.round(watchRef.marketPrice * (0.90 + Math.random() * 0.20) / 100) * 100;

    const watch = await prisma.watch.create({
      data: {
        brand: watchRef.brand,
        model: watchRef.model,
        reference: watchRef.reference,
        marketPrice: watchRef.marketPrice,
        previousPrice: price7d,
        price7dAgo: price7d,
        price30dAgo: price30d,
        price90dAgo: price90d,
        confidence: 0.6 + Math.random() * 0.35,
        imageUrl: watchRef.imageUrl,
      },
    });

    // Generate listings
    const listings = generateListings(watchRef, 2 + Math.floor(Math.random() * 4));
    for (const listing of listings) {
      await prisma.listing.create({
        data: {
          watchId: watch.id,
          ...listing,
        },
      });
    }

    // Generate price history
    const history = generatePriceHistory(watchRef.marketPrice, 90);
    for (const entry of history) {
      await prisma.priceHistory.create({
        data: {
          watchId: watch.id,
          ...entry,
        },
      });
    }

    // Generate sold records
    const soldRecords = generateSoldRecords(watchRef.reference, watchRef.marketPrice);
    for (const record of soldRecords) {
      await prisma.soldRecord.create({
        data: record,
      });
    }
  }

  // Ensure default settings exist
  await prisma.settings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });

  const finalCount = await prisma.watch.count();
  console.log(`Seeded ${finalCount} watches`);
  return { seeded: true, count: finalCount };
}
