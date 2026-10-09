import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    const { name, studentId } = await req.json();
    if (!name || !studentId) {
      return NextResponse.json({ error: 'Name and studentId are required' }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { studentId },
      update: { name },
      create: { name, studentId },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('User Upsert Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { studentId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
