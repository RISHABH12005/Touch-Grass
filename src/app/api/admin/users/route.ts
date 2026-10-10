import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
  const adminSecret = process.env.ADMIN_SECRET;
  const auth = req.headers.get('Authorization');

  if (!adminSecret || auth !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, studentId: true, studentEmail: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Admin users lookup failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
