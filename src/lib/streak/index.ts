import { prisma } from '../db/prisma';

export async function calculateUserStats(userId: string) {
  const completions = await prisma.completion.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' },
  });

  const totalDays = completions.length;
  
  if (totalDays === 0) {
    return { totalDays: 0, currentStreak: 0 };
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completionDates = new Set(
    completions.map(c => c.completedAt.toISOString().split('T')[0])
  );

  let checkDate = new Date(today);
  
  // If the most recent completion was today or yesterday, the streak is active
  const lastCompletionDate = new Date(completions[0].completedAt);
  lastCompletionDate.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today.getTime() - lastCompletionDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    return { totalDays, currentStreak: 0 };
  }

  // Start counting backwards from today (or yesterday if not completed today)
  let current = new Date(today);
  if (!completionDates.has(current.toISOString().split('T')[0])) {
    current.setDate(current.getDate() - 1);
  }

  while (true) {
    const dateStr = current.toISOString().split('T')[0];
    if (completionDates.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return { totalDays, currentStreak: streak };
}
