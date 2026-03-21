import { NextResponse } from 'next/server';
import { getAlerts, createAlert, deleteAlert } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const alerts = getAlerts();
  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const alert = createAlert(body);
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
  deleteAlert(id);
  return NextResponse.json({ success: true });
}
