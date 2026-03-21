import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: Request) {
  // Auto-seed if empty
  await seedDatabase();

  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const sort = searchParams.get('sort') || 'brand';
  const order = searchParams.get('order') || 'asc';
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {
    marketPrice: { gte: 1000 },
  };

  if (brand) where.brand = brand;
  if (minPrice) where.marketPrice = { ...((where.marketPrice as Record<string, unknown>) || {}), gte: Number(minPrice) };
  if (maxPrice) where.marketPrice = { ...((where.marketPrice as Record<string, unknown>) || {}), lte: Number(maxPrice) };
  if (search) {
    where.OR = [
      { brand: { contains: search } },
      { model: { contains: search } },
      { reference: { contains: search } },
    ];
  }

  const watches = await prisma.watch.findMany({
    where,
    orderBy: { [sort]: order },
    include: {
      _count: { select: { listings: true } },
    },
  });

  const brands = await prisma.watch.findMany({
    select: { brand: true },
    distinct: ['brand'],
    orderBy: { brand: 'asc' },
  });

  return NextResponse.json({
    watches,
    brands: brands.map((b) => b.brand),
  });
}
