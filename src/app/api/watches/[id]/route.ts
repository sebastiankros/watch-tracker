import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const watch = await prisma.watch.findUnique({
    where: { id: params.id },
    include: {
      priceHistory: {
        orderBy: { date: 'asc' },
      },
      listings: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
      },
    },
  });

  if (!watch) {
    return NextResponse.json({ error: 'Watch not found' }, { status: 404 });
  }

  const soldRecords = await prisma.soldRecord.findMany({
    where: { reference: watch.reference },
    orderBy: { soldDate: 'desc' },
    take: 10,
  });

  return NextResponse.json({ watch, soldRecords });
}
