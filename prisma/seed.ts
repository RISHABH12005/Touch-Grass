import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database safely...');

  const challengesData = [
    { title: 'Campus Landmark', description: 'Photograph a JUET campus landmark.' },
    { title: 'Nature Spot', description: 'Photograph a tree on the JUET campus.' },
    { title: 'Study Area', description: 'Photograph an outdoor study/activity area.' },
    { title: 'Sports Action', description: 'Photograph an outdoor sports activity.' },
    { title: 'Campus Path', description: 'Photograph a campus pathway or open area.' },
    { title: 'Hidden Gem', description: 'Photograph something interesting you discovered outdoors on campus.' },
    { title: 'Outdoor Activity', description: 'Photograph yourself completing an outdoor activity.' },
  ];

  for (const c of challengesData) {
    const existing = await prisma.challenge.findFirst({ 
      where: { title: c.title } 
    });
    if (!existing) {
      await prisma.challenge.create({ 
        data: { ...c, active: true } 
      });
      console.log(`Created challenge: ${c.title}`);
    } else {
      console.log(`Challenge already exists: ${c.title}`);
    }
  }

  const allChallenges = await prisma.challenge.findMany({
    where: { active: true },
    orderBy: { id: 'asc' },
  });

  if (!allChallenges || allChallenges.length === 0) {
    throw new Error('No active challenges available. Cannot assign daily challenges.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    await prisma.dailyChallenge.upsert({
      where: { date: date },
      update: {},
      create: {
        challengeId: allChallenges[i % allChallenges.length].id,
        date: date,
      },
    });
  }
  console.log('Daily challenge assignments updated for the next 30 days.');

  const milestonesData = [
    { requiredDays: 3, name: 'Digital Badge', description: 'Keep it up!' },
    { requiredDays: 7, name: 'JUET Sticker', description: 'You are really touching grass!' },
    { requiredDays: 14, name: 'JUET Merchandise', description: 'Outdoor champion!' },
    { requiredDays: 30, name: 'Special Certificate', description: 'Ultimate Grass Toucher!' },
  ];

  for (const m of milestonesData) {
    const existing = await prisma.goodieMilestone.findFirst({ 
      where: { requiredDays: m.requiredDays } 
    });
    if (!existing) {
      await prisma.goodieMilestone.create({ data: m });
      console.log(`Created milestone: ${m.name}`);
    } else {
      console.log(`Milestone already exists: ${m.name}`);
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
