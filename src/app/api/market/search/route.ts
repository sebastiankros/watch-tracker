import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: Request) {
  await seedDatabase();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const watches = await prisma.watch.findMany({
    where: {
      OR: [
        { brand: { contains: q } },
        { model: { contains: q } },
        { reference: { contains: q } },
      ],
      marketPrice: { gte: 1000 },
    },
    take: 20,
    orderBy: { brand: 'asc' },
  });

  return NextResponse.json({ results: watches });
}
