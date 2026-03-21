import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { refreshInterval, minDiscountPct, preferredBrands, alertEmail } = body;

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        refreshInterval: refreshInterval ?? 60,
        minDiscountPct: minDiscountPct ?? 5,
        preferredBrands: preferredBrands ?? '',
        alertEmail: alertEmail ?? '',
      },
      update: {
        ...(refreshInterval !== undefined && { refreshInterval }),
        ...(minDiscountPct !== undefined && { minDiscountPct }),
        ...(preferredBrands !== undefined && { preferredBrands }),
        ...(alertEmail !== undefined && { alertEmail }),
      },
    });

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
