import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSessionUserId } from '@/lib/auth/session';
import {
  EMAIL_OTP_COOKIE,
  EMAIL_OTP_RESEND_WAIT_SECONDS,
  EMAIL_OTP_TTL_SECONDS,
  hashEmailOtp,
  openPendingRegistration,
  sealPendingRegistration,
  type PendingRegistration,
} from '@/lib/auth/email-otp';

const JUET_EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^\x60_{|}~-]+@juetguna\.in$/i;

function readPendingCookie(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') || '';
  return cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(EMAIL_OTP_COOKIE + '='))
    ?.slice(EMAIL_OTP_COOKIE.length + 1) || null;
}

function setPendingCookie(response: NextResponse, req: Request, pending: PendingRegistration) {
  response.cookies.set(EMAIL_OTP_COOKIE, sealPendingRegistration(pending), {
    httpOnly: true,
    secure: new URL(req.url).protocol === 'https:',
    sameSite: 'strict',
    path: '/api/users',
    maxAge: Math.max(0, Math.ceil((pending.expiresAt - Date.now()) / 1000)),
  });
}

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

    const previousToken = readPendingCookie(req);
    const previous = previousToken ? openPendingRegistration(previousToken) : null;
    const now = Date.now();
    if (previous && previous.studentEmail === studentEmail && previous.studentId === studentId &&
      previous.expiresAt > now && now - previous.issuedAt < EMAIL_OTP_RESEND_WAIT_SECONDS * 1000) {
      const seconds = Math.ceil((EMAIL_OTP_RESEND_WAIT_SECONDS * 1000 - (now - previous.issuedAt)) / 1000);
      return NextResponse.json({ error: 'Please wait ' + seconds + ' seconds before requesting another code.' }, { status: 429 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      console.error('Email OTP is not configured: RESEND_API_KEY and EMAIL_FROM are required.');
      return NextResponse.json({
        error: 'Email verification is not configured yet. Please contact the administrator.',
      }, { status: 503 });
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const pending: PendingRegistration = {
      name,
      studentId,
      studentEmail,
      codeHash: hashEmailOtp(studentEmail, code),
      issuedAt: now,
      expiresAt: now + EMAIL_OTP_TTL_SECONDS * 1000,
      attempts: 0,
    };

    const safeName = name.replace(/[&<>"]/g, '');
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [studentEmail],
        subject: 'Your Touch Grass verification code',
        text: 'Hi ' + name + ', your Touch Grass verification code is ' + code + '. It expires in 5 minutes. If you did not request this code, you can ignore this email.',
        html: '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#203426"><p>Hi ' + safeName + ',</p><h2>Verify your JUET student email</h2><p>Enter this code in Touch Grass to continue:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px;background:#f0f5e9;border-radius:12px;text-align:center">' + code + '</p><p>This code expires in <strong>5 minutes</strong>. If you did not request it, ignore this email.</p><p>— JUET Outdoor Club</p></div>',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (!emailResponse.ok) {
      const detail = await emailResponse.text().catch(() => '');
      console.error('Email provider rejected OTP delivery:', emailResponse.status, detail.slice(0, 300));
      return NextResponse.json({
        error: 'We could not send the verification email. Check your email address or try again later.',
      }, { status: 502 });
    }

    const response = NextResponse.json({
      success: true,
      requiresVerification: true,
      message: 'A 6-digit verification code was sent to ' + studentEmail + '. It expires in 5 minutes.',
      email: studentEmail,
    });
    setPendingCookie(response, req, pending);
    return response;
  } catch (error: unknown) {
    console.error('Email OTP request failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to send a verification code right now. Please try again.' }, { status: 500 });
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
