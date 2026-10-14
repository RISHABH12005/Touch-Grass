import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createSessionToken, sessionMaxAge, SESSION_COOKIE } from '@/lib/auth/session';
import {
  compareEmailOtp,
  EMAIL_OTP_COOKIE,
  EMAIL_OTP_MAX_ATTEMPTS,
  openPendingRegistration,
  sealPendingRegistration,
} from '@/lib/auth/email-otp';

function clearOtpCookie(response: NextResponse, req: Request) {
  response.cookies.set(EMAIL_OTP_COOKIE, '', {
    httpOnly: true,
    secure: new URL(req.url).protocol === 'https:',
    sameSite: 'strict',
    path: '/api/users',
    maxAge: 0,
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Enter the verification code from your email.' }, { status: 400 });
  }

  const code = body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>).code
    : undefined;
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Enter the 6-digit verification code.' }, { status: 400 });
  }

  const cookieHeader = req.headers.get('cookie') || '';
  const token = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(EMAIL_OTP_COOKIE + '='))
    ?.slice(EMAIL_OTP_COOKIE.length + 1);
  const pending = token ? openPendingRegistration(token) : null;

  if (!pending) {
    const response = NextResponse.json({ error: 'Your verification session is missing or invalid. Please request a new code.' }, { status: 400 });
    clearOtpCookie(response, req);
    return response;
  }

  if (pending.expiresAt <= Date.now()) {
    const response = NextResponse.json({ error: 'This code has expired. Please request a new one.' }, { status: 410 });
    clearOtpCookie(response, req);
    return response;
  }

  if (pending.attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
    const response = NextResponse.json({ error: 'Too many incorrect attempts. Request a new verification code.' }, { status: 429 });
    clearOtpCookie(response, req);
    return response;
  }

  if (!compareEmailOtp(pending.studentEmail, code, pending.codeHash)) {
    pending.attempts += 1;
    const response = NextResponse.json({
      error: pending.attempts >= EMAIL_OTP_MAX_ATTEMPTS
        ? 'Too many incorrect attempts. Request a new verification code.'
        : 'That code is incorrect. Check the email and try again.',
    }, { status: pending.attempts >= EMAIL_OTP_MAX_ATTEMPTS ? 429 : 400 });
    if (pending.attempts >= EMAIL_OTP_MAX_ATTEMPTS) clearOtpCookie(response, req);
    else {
      response.cookies.set(EMAIL_OTP_COOKIE, sealPendingRegistration(pending), {
        httpOnly: true,
        secure: new URL(req.url).protocol === 'https:',
        sameSite: 'strict',
        path: '/api/users',
        maxAge: Math.max(0, Math.ceil((pending.expiresAt - Date.now()) / 1000)),
      });
    }
    return response;
  }

  try {
    const existingEmail = await prisma.user.findUnique({ where: { studentEmail: pending.studentEmail } });
    if (existingEmail && existingEmail.studentId !== pending.studentId) {
      const response = NextResponse.json({ error: 'This student email is already linked to another roll number.' }, { status: 409 });
      clearOtpCookie(response, req);
      return response;
    }

    const existingStudent = await prisma.user.findUnique({ where: { studentId: pending.studentId } });
    if (existingStudent?.studentEmail && existingStudent.studentEmail !== pending.studentEmail) {
      const response = NextResponse.json({ error: 'This roll number is already registered with a different email address.' }, { status: 409 });
      clearOtpCookie(response, req);
      return response;
    }

    const user = await prisma.user.upsert({
      where: { studentId: pending.studentId },
      update: { name: pending.name, studentEmail: pending.studentEmail },
      create: { name: pending.name, studentId: pending.studentId, studentEmail: pending.studentEmail },
    });

    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      studentId: user.studentId,
      studentEmail: user.studentEmail,
    });
    response.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      secure: new URL(req.url).protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: sessionMaxAge,
    });
    clearOtpCookie(response, req);
    return response;
  } catch (error: unknown) {
    console.error('Email OTP verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to complete sign-in right now. Please try again.' }, { status: 500 });
  }
}
