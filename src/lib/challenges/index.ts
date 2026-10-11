import { prisma } from '../db/prisma';

export function getTodayDateRange(now = new Date()) {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return { startOfDay, endOfDay };
}

async function findTodayDailyChallenge() {
  const { startOfDay, endOfDay } = getTodayDateRange();

  return prisma.dailyChallenge.findFirst({
    where: {
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: { challenge: true },
    orderBy: { date: 'asc' },
  });
}

export async function getOrCreateTodayDailyChallenge(challengeId: string) {
  const existing = await findTodayDailyChallenge();
  if (existing) return existing;

  const { startOfDay } = getTodayDateRange();
  return prisma.dailyChallenge.upsert({
    where: { date: startOfDay },
    update: {},
    create: { challengeId, date: startOfDay },
  });
}

export async function getTodayChallenge() {
  const now = new Date();
  const { startOfDay } = getTodayDateRange(now);
  const dailyChallenge = await findTodayDailyChallenge();

  if (dailyChallenge) {
    return dailyChallenge.challenge;
  }

  // Deterministic fallback when today's assignment has not been seeded.
  const activeChallenges = await prisma.challenge.findMany({
    where: { active: true },
    orderBy: { id: 'asc' },
  });

  if (!activeChallenges.length) return null;

  const dayOfYear = Math.floor(
    (startOfDay.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
  );
  return activeChallenges[dayOfYear % activeChallenges.length];
}
