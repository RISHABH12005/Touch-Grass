import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyImage } from '@/lib/ai/ollama';
import { getTodayChallenge } from '@/lib/challenges';

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

    // Find the daily challenge record for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyChallenge = await prisma.dailyChallenge.findUnique({
      where: { date: today },
    });

    if (!dailyChallenge) {
      return NextResponse.json({ error: 'Daily challenge not configured' }, { status: 500 });
    }

    // 1. AI Verification
    const verification = await verifyImage(challenge.description, imageBase64);

    // 2. Record Submission
    const submission = await prisma.submission.create({
      data: {
        userId,
        dailyChallengeId: dailyChallenge.id,
        image: imageBase64, // In MVP we store base64, production should use storage
        verificationStatus: verification.verified ? 'verified' : 'rejected',
        confidence: verification.confidence,
        reason: verification.reason,
      },
    });

    // 3. If verified, record completion
    if (verification.verified) {
      await prisma.completion.upsert({
        where: {
          userId_dailyChallengeId: {
            userId,
            dailyChallengeId: dailyChallenge.id,
          },
        },
        update: {},
        create: {
          userId,
          dailyChallengeId: dailyChallenge.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      verified: verification.verified,
      reason: verification.reason,
      submissionId: submission.id,
    });
  } catch (error: any) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
