import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: Request) {
  await seedDatabase();

  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const minDiscount = Number(searchParams.get('minDiscount') || '0');
  const minPrice = Number(searchParams.get('minPrice') || '1000');
  const maxPrice = Number(searchParams.get('maxPrice') || '0');
  const sort = searchParams.get('sort') || 'discount';

  // Get all active listings with their watch data
  const listings = await prisma.listing.findMany({
    where: {
      isActive: true,
      watch: {
        marketPrice: { gte: 1000 },
        ...(brand ? { brand } : {}),
      },
    },
    include: {
      watch: true,
    },
  });

  // Calculate deals
  let deals = listings
    .map((listing) => {
      const discount = ((listing.watch.marketPrice - listing.price) / listing.watch.marketPrice) * 100;
      const savings = listing.watch.marketPrice - listing.price;
      return {
        id: listing.id,
        watchId: listing.watch.id,
        brand: listing.watch.brand,
        model: listing.watch.model,
        reference: listing.watch.reference,
        listingPrice: listing.price,
        marketPrice: listing.watch.marketPrice,
        discount: Math.round(discount * 10) / 10,
        savings,
        source: listing.source,
        url: listing.url,
        seller: listing.seller,
        condition: listing.condition,
        listedDate: listing.listedDate,
      };
    })
    .filter((d) => d.discount >= minDiscount && d.listingPrice >= minPrice);

  if (maxPrice > 0) {
    deals = deals.filter((d) => d.listingPrice <= maxPrice);
  }

  // Sort
  switch (sort) {
    case 'discount':
      deals.sort((a, b) => b.discount - a.discount);
      break;
    case 'savings':
      deals.sort((a, b) => b.savings - a.savings);
      break;
    case 'price_asc':
      deals.sort((a, b) => a.listingPrice - b.listingPrice);
      break;
    case 'price_desc':
      deals.sort((a, b) => b.listingPrice - a.listingPrice);
      break;
    case 'brand':
      deals.sort((a, b) => a.brand.localeCompare(b.brand));
      break;
    case 'recent':
      deals.sort((a, b) => new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime());
      break;
    default:
      deals.sort((a, b) => b.discount - a.discount);
  }

  // Stats
  const dealsAbove5 = deals.filter((d) => d.discount >= 5);
  const avgDiscount = dealsAbove5.length > 0
    ? Math.round((dealsAbove5.reduce((sum, d) => sum + d.discount, 0) / dealsAbove5.length) * 10) / 10
    : 0;

  return NextResponse.json({
    deals,
    stats: {
      totalDeals: deals.length,
      dealsAbove5: dealsAbove5.length,
      dealsAbove10: deals.filter((d) => d.discount >= 10).length,
      dealsAbove15: deals.filter((d) => d.discount >= 15).length,
      avgDiscount,
      bestDeal: deals[0] || null,
    },
  });
}
