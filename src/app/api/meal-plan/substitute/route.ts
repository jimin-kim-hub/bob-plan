import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { planId, mealPlanItemId, reason } = await req.json();

    // 기존 식단 아이템 찾기
    const oldItem = await prisma.mealPlanItem.findUnique({ where: { id: mealPlanItemId } });
    if (!oldItem) throw new Error("Item not found");

    // MVP Mock 데이터 로직: API 연동 전이므로, 교체 사유에 따라 하드코딩된 결과를 반환합니다.
    let newMenuName = "대체된 메뉴";
    let newCost = oldItem.estimatedCost;
    
    if (reason === "더 저렴하게") {
      newMenuName = "간장계란밥 (초절약)";
      newCost = 1500;
    } else if (reason === "너무 귀찮아요") {
      newMenuName = "전자레인지 컵밥";
      newCost = 3000;
    } else if (reason === "단백질 높게") {
      newMenuName = "닭가슴살 샐러드";
      newCost = 4500;
    } else {
      newMenuName = "김치볶음밥 (대체)";
    }

    // 기존 데이터 삭제
    await prisma.mealPlanItem.delete({ where: { id: mealPlanItemId } });
    
    // 새 데이터 생성
    const newItem = await prisma.mealPlanItem.create({
      data: {
        planId: oldItem.planId,
        date: oldItem.date,
        mealType: oldItem.mealType,
        menuName: newMenuName,
        ingredientsUsedJson: JSON.stringify(["햇반", "계란"]),
        additionalIngredientsJson: JSON.stringify([]),
        estimatedCost: newCost,
        cookingTime: 5,
        difficulty: "아주 쉬움",
        recipeText: JSON.stringify({
          steps: ["전자레인지에 데운다.", "재료를 모두 넣고 섞어 맛있게 먹는다."],
          tips: ["참기름 한 방울이 핵심!"]
        }),
        tastePoint: "간단하지만 든든한 자취생의 영혼의 맛",
        reason: `사용자의 '${reason}' 요청을 반영하여 AI가 새롭게 대체한 메뉴입니다.`
      }
    });

    return NextResponse.json({ success: true, data: newItem });

  } catch (error) {
    console.error("Substitute Error:", error);
    return NextResponse.json({ error: 'Failed to substitute menu' }, { status: 500 });
  }
}
