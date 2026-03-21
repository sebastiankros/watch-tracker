import { NextResponse } from 'next/server';
import { searchWatches } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const results = searchWatches(q);
  return NextResponse.json({ results });
}
