import { NextResponse } from 'next/server';
import { refreshMarketData } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const result = await refreshMarketData();
  return NextResponse.json(result);
}
