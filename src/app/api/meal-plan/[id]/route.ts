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

async function assertOwnedPlan(id: string) {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }) };
  }
  const plan = await prisma.mealPlan.findUnique({ where: { id }, select: { userId: true } });
  if (!plan) {
    return { error: NextResponse.json({ error: 'Meal plan not found' }, { status: 404 }) };
  }
  if (plan.userId !== session.userId) {
    return { error: NextResponse.json({ error: '본인의 식단만 수정할 수 있습니다.' }, { status: 403 }) };
  }
  return { session };
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await assertOwnedPlan(id);
  if (error) return error;

  try {
    // 스키마에 onDelete: Cascade가 걸려 있어 items/shoppingLists/feedback이 함께 정리된다.
    await prisma.mealPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete Plan Error:', err);
    return NextResponse.json({ error: 'Failed to delete meal plan' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await assertOwnedPlan(id);
  if (error) return error;

  try {
    const body = await req.json();
    if (typeof body.isFavorite !== 'boolean') {
      return NextResponse.json({ error: 'isFavorite(boolean)이 필요합니다.' }, { status: 400 });
    }
    const plan = await prisma.mealPlan.update({
      where: { id },
      data: { isFavorite: body.isFavorite },
    });
    return NextResponse.json({ success: true, data: plan });
  } catch (err) {
    console.error('Update Plan Error:', err);
    return NextResponse.json({ error: 'Failed to update meal plan' }, { status: 500 });
  }
}
