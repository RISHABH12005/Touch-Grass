import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyImage } from '@/lib/ai/ollama';
import { getOrCreateTodayDailyChallenge, getTodayChallenge } from '@/lib/challenges';

export async function POST(req: Request) {
  try {
    const { userId, imageBase64 } = await req.json();

    if (!userId || !imageBase64) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const challenge = await getTodayChallenge();
    if (!challenge) {
      return NextResponse.json({ error: 'No challenge available today' }, { status: 404 });
    }

    // Reuse today's assignment and refuse another submission once this user has completed it.
    const dailyChallenge = await getOrCreateTodayDailyChallenge(challenge.id);
    const existingCompletion = await prisma.completion.findUnique({
      where: {
        userId_dailyChallengeId: {
          userId,
          dailyChallengeId: dailyChallenge.id,
        },
      },
      select: { id: true },
    });
    if (existingCompletion) {
      return NextResponse.json({
        success: false,
        completed: true,
        error: 'Today’s challenge is already complete. Your next challenge opens tomorrow.',
      }, { status: 409 });
    }

    const verification = await verifyImage(challenge.description, imageBase64);
    const submission = await prisma.submission.create({
      data: {
        userId,
        dailyChallengeId: dailyChallenge.id,
        image: imageBase64,
        verificationStatus: verification.verified ? 'verified' : 'rejected',
        confidence: verification.confidence,
        reason: verification.reason,
      },
    });

    if (verification.verified) {
      await prisma.completion.upsert({
        where: {
          userId_dailyChallengeId: {
            userId,
            dailyChallengeId: dailyChallenge.id,
          },
        },
        update: {},
        create: { userId, dailyChallengeId: dailyChallenge.id },
      });
    }

    return NextResponse.json({
      success: true,
      verified: verification.verified,
      reason: verification.reason,
      submissionId: submission.id,
    });
  } catch (error: unknown) {
    console.error('Submission error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
