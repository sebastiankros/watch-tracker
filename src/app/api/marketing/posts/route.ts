import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  const posts = await prisma.marketingPost.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { watchId, brand, model, platform, content, type } = body;

  const post = await prisma.marketingPost.create({
    data: {
      watchId: watchId || null,
      brand: brand || null,
      model: model || null,
      platform,
      content,
      type: type || 'custom',
      status: 'draft',
    },
  });

  return NextResponse.json({ post });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await prisma.marketingPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const post = await prisma.marketingPost.update({
    where: { id },
    data: {
      status,
      postedAt: status === 'posted' ? new Date() : undefined,
    },
  });

  return NextResponse.json({ post });
}
