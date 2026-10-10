import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const JUET_EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@juetguna\.in$/i;

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const name = typeof payload.name === 'string' ? payload.name.trim().replace(/\s+/g, ' ') : '';
    const studentId = typeof payload.studentId === 'string' ? payload.studentId.trim().toUpperCase() : '';
    const studentEmail = typeof payload.studentEmail === 'string' ? payload.studentEmail.trim().toLowerCase() : '';

    if (!name || !studentId || !studentEmail) {
      return NextResponse.json({ error: 'Roll number, name, and student email are required' }, { status: 400 });
    }
    if (name.length > 100 || studentId.length > 80 || studentEmail.length > 254 || !JUET_EMAIL_PATTERN.test(studentEmail)) {
      return NextResponse.json({ error: 'Enter a valid JUET student email ending in @juetguna.in' }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { studentEmail } });
    if (existingEmail && existingEmail.studentId !== studentId) {
      return NextResponse.json({ error: 'This student email is already linked to another roll number.' }, { status: 409 });
    }

    const user = await prisma.user.upsert({
      where: { studentId },
      update: { name, studentEmail },
      create: { name, studentId, studentEmail },
    });

    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error('User Upsert Error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to register right now. Please try again.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId')?.trim().toUpperCase();
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { studentId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error('User Lookup Error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
