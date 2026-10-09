import { NextResponse } from 'next/server';
import { getTodayChallenge } from '@/lib/challenges';

export async function GET() {
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
