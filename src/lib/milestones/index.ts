import { prisma } from '../db/prisma';

export async function getNextMilestone(totalDays: number) {
  const milestone = await prisma.goodieMilestone.findFirst({
    where: {
      requiredDays: { gt: totalDays },
    },
    orderBy: { requiredDays: 'asc' },
  });

  return milestone;
}
