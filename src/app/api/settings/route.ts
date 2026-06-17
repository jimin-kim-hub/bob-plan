import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    let user = await prisma.user.findFirst({ include: { profile: true } });
    if (!user) {
      user = await prisma.user.create({ data: { nickname: '자취생' } });
    }
    
    let profile = user.profile;
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
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
    const body = await req.json();
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("User not found");

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { requireFeedback: body.requireFeedback },
      create: {
        userId: user.id,
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
