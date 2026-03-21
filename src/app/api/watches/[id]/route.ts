import { NextResponse } from 'next/server';
import { getWatch } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const data = getWatch(params.id);
  if (!data) {
    return NextResponse.json({ error: 'Watch not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}
