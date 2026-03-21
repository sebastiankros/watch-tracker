import { NextResponse } from 'next/server';
import { getDeals } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand') || undefined;
  const minDiscount = Number(searchParams.get('minDiscount') || '0');
  const minPrice = Number(searchParams.get('minPrice') || '1000');
  const maxPrice = Number(searchParams.get('maxPrice') || '0');
  const sort = searchParams.get('sort') || 'discount';

  const data = getDeals({ brand, minDiscount, minPrice, maxPrice, sort });
  return NextResponse.json(data);
}
