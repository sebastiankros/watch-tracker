import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const settings = updateSettings(body);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
