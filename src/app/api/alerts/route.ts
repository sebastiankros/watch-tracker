import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const alerts = await prisma.alert.findMany({
    include: { watch: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { watchId, brand, modelName, targetPrice, discountPct } = body;

    const alert = await prisma.alert.create({
      data: {
        watchId: watchId || null,
        brand: brand || null,
        modelName: modelName || null,
        targetPrice: targetPrice ? Number(targetPrice) : null,
        discountPct: discountPct ? Number(discountPct) : null,
      },
    });

    return NextResponse.json({ alert });
  } catch {
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  await prisma.alert.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
