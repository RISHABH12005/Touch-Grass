import { prisma } from '../db/prisma';

export async function getTodayChallenge() {
  const now = new Date();
  // Normalize to midnight in local time for consistency
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  try {
    const dailyChallenge = await prisma.dailyChallenge.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { challenge: true },
    });

    if (dailyChallenge) {
      return dailyChallenge.challenge;
    }

    // Deterministic Fallback: 
    // Use the date to pick a consistent index from active challenges
    const activeChallenges = await prisma.challenge.findMany({
      where: { active: true },
      orderBy: { id: 'asc' },
    });

    if (!activeChallenges || activeChallenges.length === 0) {
      return null;
    }

    // Deterministic index based on the current date
    const dayOfYear = Math.floor((startOfDay.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % activeChallenges.length;
    
    return activeChallenges[index];
  } catch (error) {
    console.error('Database error in getTodayChallenge:', error);
    throw error; // Re-throw to distinguish from 'no challenge'
  }
}
