import { NextResponse } from 'next/server';
import { getTodayChallenge } from '@/lib/challenges';
import { getSessionUserId } from '@/lib/auth/session';

export async function GET(req: Request) {
  if (!getSessionUserId(req)) return NextResponse.json({ error: 'Sign in to continue' }, { status: 401 });
  try {
    const challenge = await getTodayChallenge();
    if (!challenge) {
      return NextResponse.json({ error: 'No challenge found for today' }, { status: 404 });
    }
    return NextResponse.json(challenge);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
