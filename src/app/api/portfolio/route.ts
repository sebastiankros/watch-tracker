import { NextResponse } from 'next/server';
import { getPortfolio, getPortfolioStats, addToPortfolio, markAsSold, updatePortfolioEntry, deletePortfolioEntry } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const entries = getPortfolio();
  const stats = getPortfolioStats();
  return NextResponse.json({ entries, stats });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  if (action === 'sell') {
    const { id, soldPrice, soldDate, soldSource, fees } = body;
    if (!id || !soldPrice) {
      return NextResponse.json({ error: 'id and soldPrice required' }, { status: 400 });
    }
    const entry = markAsSold(id, { soldPrice, soldDate, soldSource, fees });
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    return NextResponse.json({ entry });
  }

  // Default: add new portfolio entry
  const { brand, model, reference, purchasePrice, purchaseDate, purchaseSource, purchaseUrl, fees, notes, watchId } = body;
  if (!brand || !model || !purchasePrice) {
    return NextResponse.json({ error: 'brand, model, and purchasePrice required' }, { status: 400 });
  }

  const entry = addToPortfolio({
    watchId,
    brand,
    model,
    reference,
    purchasePrice,
    purchaseDate,
    purchaseSource,
    purchaseUrl,
    fees,
    notes,
  });

  return NextResponse.json({ entry });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }
  const entry = updatePortfolioEntry(id, data);
  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }
  return NextResponse.json({ entry });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }
  const deleted = deletePortfolioEntry(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
