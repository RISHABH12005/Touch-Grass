import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

async function validateAdmin(req: Request) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return false;
  }
  return true;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  if (!(await validateAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (type === 'users') {
      const users = await prisma.user.findMany();
      return NextResponse.json(users);
    }
    if (type === 'challenges') {
      const challenges = await prisma.challenge.findMany();
      return NextResponse.json(challenges);
    }
    if (type === 'submissions') {
      const submissions = await prisma.submission.findMany({
        include: { user: true }
      });
      return NextResponse.json(submissions);
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
