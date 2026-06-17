import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (id === 'mock-id') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const plan = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        items: true,
        shoppingLists: {
          include: {
            items: true
          }
        }
      }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    console.error("Fetch Plan Error:", error);
    return NextResponse.json({ error: 'Failed to fetch meal plan' }, { status: 500 });
  }
}
