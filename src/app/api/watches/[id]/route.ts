import { NextResponse } from 'next/server';
import { getWatch } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const data = await getWatch(params.id);
  if (!data) {
    return NextResponse.json({ error: 'Watch not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}
