import { NextResponse } from 'next/server';
import { refreshMarketData } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = refreshMarketData();
  return NextResponse.json(result);
}
