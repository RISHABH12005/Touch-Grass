import { NextResponse } from 'next/server';
import { calculateUserStats } from '@/lib/streak';
import { getNextMilestone } from '@/lib/milestones';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

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
