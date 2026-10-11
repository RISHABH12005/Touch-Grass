import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getOrCreateTodayDailyChallenge, getTodayChallenge, getTodayDateRange } from '@/lib/challenges';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  try {
    const now = new Date();
    const { endOfDay } = getTodayDateRange(now);
    const challenge = await getTodayChallenge();
    if (!challenge) {
      return NextResponse.json({ completed: false, nextChallengeAt: endOfDay.toISOString() });
    }

    const dailyChallenge = await getOrCreateTodayDailyChallenge(challenge.id);
    const completion = await prisma.completion.findUnique({
      where: {
        userId_dailyChallengeId: {
          userId,
          dailyChallengeId: dailyChallenge.id,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({
      completed: Boolean(completion),
      nextChallengeAt: endOfDay.toISOString(),
    });
  } catch (error) {
    console.error('Challenge status error:', error);
    return NextResponse.json({ error: 'Could not load today’s challenge status' }, { status: 500 });
  }
}
