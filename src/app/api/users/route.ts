import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createSessionToken, sessionMaxAge, SESSION_COOKIE, getSessionUserId } from '@/lib/auth/session';

const JUET_EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^`_{|}~-]+@juetguna\.in$/i;

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

    const existingStudent = await prisma.user.findUnique({ where: { studentId } });
    if (existingStudent?.studentEmail && existingStudent.studentEmail !== studentEmail) {
      return NextResponse.json({ error: 'This roll number is already registered with a different email address.' }, { status: 409 });
    }

    const user = await prisma.user.upsert({
      where: { studentId },
      update: { name, studentEmail },
      create: { name, studentId, studentEmail },
      select: { id: true, name: true, studentId: true, studentEmail: true },
    });

    const response = NextResponse.json(user);
    response.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      secure: new URL(req.url).protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: sessionMaxAge,
    });
    response.cookies.set('tg_email_otp', '', {
      httpOnly: true,
      secure: new URL(req.url).protocol === 'https:',
      sameSite: 'strict',
      path: '/api/users',
      maxAge: 0,
    });
    return response;
  } catch (error: unknown) {
    console.error('Direct sign-in failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to sign in right now. Please try again.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const userId = getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Sign in to continue' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, studentId: true, studentEmail: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error('User Lookup Error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
