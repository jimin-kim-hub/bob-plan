import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let profile = await prisma.userProfile.findUnique({
      where: { userId: session.userId }
    });
    
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId: session.userId,
          weeklyBudget: 50000,
          cookingLevel: '초보',
          maxCookingTime: 15,
          goal: '절약',
          requireFeedback: true
        }
      });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("Fetch Settings Error:", error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const profile = await prisma.userProfile.upsert({
      where: { userId: session.userId },
      update: { requireFeedback: body.requireFeedback },
      create: {
        userId: session.userId,
        weeklyBudget: 50000,
        cookingLevel: '초보',
        maxCookingTime: 15,
        goal: '절약',
        requireFeedback: body.requireFeedback
      }
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("Update Settings Error:", error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
