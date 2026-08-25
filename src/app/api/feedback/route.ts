import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await req.json();
    const { mealPlanItemId, ateStatus, tasteRating, difficultyRating, actualCost, wantAgain } = body;

    const feedback = await prisma.feedback.create({
      data: {
        userId: session.userId,
        mealPlanItemId,
        ateStatus,
        tasteRating,
        difficultyRating,
        actualCost,
        wantAgain
      }
    });

    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    console.error("Feedback Error:", error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
