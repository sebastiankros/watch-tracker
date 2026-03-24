import { NextResponse } from 'next/server';
import { getDeals } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand') || undefined;
  const minDiscount = Number(searchParams.get('minDiscount') || '0');
  const minPrice = Number(searchParams.get('minPrice') || '500');
  const maxPrice = Number(searchParams.get('maxPrice') || '50000');
  const sort = searchParams.get('sort') || 'score';
  const condition = searchParams.get('condition') || undefined;

  const data = await getDeals({ brand, minDiscount, minPrice, maxPrice, sort, condition });
  return NextResponse.json(data);
}
