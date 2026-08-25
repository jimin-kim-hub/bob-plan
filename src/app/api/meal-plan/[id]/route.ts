import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const plan = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        items: true,
        shoppingLists: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    // 소유권 확인: 로그인한 사용자라도 남의 식단은 조회할 수 없다.
    if (plan.userId !== session.userId) {
      return NextResponse.json({ error: '본인의 식단만 조회할 수 있습니다.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    console.error('Fetch Plan Error:', error);
    return NextResponse.json({ error: 'Failed to fetch meal plan' }, { status: 500 });
  }
}
