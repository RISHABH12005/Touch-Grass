import { NextResponse } from 'next/server';
import { calculateUserStats } from '@/lib/streak';
import { getNextMilestone } from '@/lib/milestones';
import { getSessionUserId } from '@/lib/auth/session';

export async function GET(req: Request) {
  const userId = getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Sign in to continue' }, { status: 401 });

  try {
    const stats = await calculateUserStats(userId);
    const nextMilestone = await getNextMilestone(stats.totalDays);

    return NextResponse.json({
      ...stats,
      nextMilestone,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
