import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    let responseJson;

    if (!apiKey) {
      console.log("No GEMINI_API_KEY provided. Returning mock data.");
      // Return Mock Data if API key is not present
      responseJson = getMockData(body);
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log("Generating meal plan with Gemini...");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

      const prompt = `
너는 자취생의 식비를 줄이고 맛있는 식단을 설계하는 AI 식생활 매니저다.

목표:
- 사용자의 예산 안에서 식단을 구성한다.
- 보유 재료를 우선 사용한다.
- 사용자가 실제로 해먹을 수 있을 만큼 쉬운 메뉴를 추천한다.
- 각 메뉴는 맛있어야 하며, 맛 포인트와 실패 방지 팁을 포함한다.
- 장보기 목록은 실제 필요한 재료 중심으로 최소화한다.

사용자 정보:
- 예산: ${body.weeklyBudget}
- 계획 기간 및 끼니: ${body.mealSchedule || '3일'}
- 1회 식사량: ${body.portionSize || '1'}인분
- 보유 재료 (보관 상태 및 잔반 포함): ${body.inventory}
- 보유 기본 양념: ${body.basicSeasonings?.join(', ')}
- 조리 가능 시간: ${body.maxCookingTime}분 이하
- 조리 도구: ${body.cookingTools?.join(', ')}
- 목표: ${body.goal}
- 선호 음식: ${body.preferences || '없음'}
- 비선호 음식: ${body.dislikedFoods || '없음'}
- 알레르기: ${body.allergies || '없음'}

반드시 지켜야 할 조건:
1. 총 예상 비용은 예산을 넘기지 않는다.
2. 알레르기 재료는 절대 포함하지 않는다.
3. 비선호 음식은 가능하면 제외한다.
4. 보유 재료를 최대한 먼저 사용한다.
5. 사용자가 보유하지 않은 기본 양념이 필요한 경우 장보기 목록에 추가하거나 양념이 최소화된 레시피를 제안한다.
6. 각 메뉴마다 레시피를 제공한다. (전자레인지, 에어프라이어 등을 사용할 경우 '700W 기준 2분 30초' 등 구체적인 조리 시간/온도를 명시한다)
7. 각 메뉴마다 맛있게 만드는 팁을 제공한다.
8. 너무 복잡한 요리는 제외한다.
9. 장보기 목록은 최소화한다.
10. 결과는 반드시 JSON 형식으로만 반환한다. 마크다운 백틱(\`\`\`json)은 제외하고 순수 JSON 객체만 출력한다.

출력 JSON 구조:
{
  "summary": {
    "estimatedTotalCost": number,
    "budgetRemaining": number,
    "estimatedSavings": number,
    "inventoryUtilizationRate": number,
    "strategy": string
  },
  "mealPlan": [
    {
      "date": string (예: 1일차 저녁),
      "mealType": string,
      "menuName": string,
      "estimatedCost": number,
      "cookingTime": number,
      "difficulty": string,
      "ingredientsUsed": string[],
      "additionalIngredients": string[],
      "tastePoint": string,
      "recipe": {
        "ingredients": string[],
        "steps": string[],
        "tips": string[],
        "failurePrevention": string[],
        "substitutions": string[]
      },
      "reason": string,
      "prepInstructions": string
    }
  ],
  "shoppingList": [
    {
      "ingredientName": string,
      "quantity": number,
      "unit": string,
      "estimatedPrice": number,
      "priority": "required" | "optional",
      "usedForMenu": string[],
      "storageTip": string
    }
  ]
}
`;
      const result = await model.generateContent(prompt);
      let text = result.response.text();
      // Clean up markdown formatting if exists
      text = text.replace(/^```json/g, '').replace(/```$/g, '').trim();
      responseJson = JSON.parse(text);
    }

    // 사용자 세션 확인
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.userId;

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId: userId,
        startDate: new Date(),
        endDate: new Date(new Date().getTime() + parseInt(body.planDays) * 24 * 60 * 60 * 1000),
        budget: Number(body.weeklyBudget),
        estimatedCost: responseJson.summary.estimatedTotalCost,
        estimatedSavings: responseJson.summary.estimatedSavings,
        inventoryUtilizationRate: responseJson.summary.inventoryUtilizationRate,
        items: {
          create: responseJson.mealPlan.map((item: any) => ({
            date: new Date(), // Mock date
            mealType: item.mealType,
            menuName: item.menuName,
            ingredientsUsedJson: JSON.stringify(item.ingredientsUsed),
            additionalIngredientsJson: JSON.stringify(item.additionalIngredients),
            prepInstructions: item.prepInstructions || '',
            estimatedCost: item.estimatedCost,
            cookingTime: item.cookingTime,
            difficulty: item.difficulty,
            recipeText: JSON.stringify(item.recipe),
            tastePoint: item.tastePoint,
            reason: item.reason,
          }))
        },
        shoppingLists: {
          create: {
            totalEstimatedCost: responseJson.summary.estimatedTotalCost,
            items: {
              create: responseJson.shoppingList.map((item: any) => ({
                ingredientName: item.ingredientName,
                quantity: Number(item.quantity) || 1,
                unit: item.unit,
                estimatedPrice: item.estimatedPrice,
                priority: item.priority,
                usedForMenu: item.usedForMenu.join(', ')
              }))
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, planId: mealPlan.id, data: responseJson });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Failed to generate meal plan' }, { status: 500 });
  }
}

function getMockData(body: any) {
  return {
    "summary": {
      "estimatedTotalCost": 15000,
      "budgetRemaining": body.weeklyBudget - 15000,
      "estimatedSavings": 25000,
      "inventoryUtilizationRate": 0.85,
      "strategy": "계란과 김치를 활용하여 배달을 줄이고 가성비 높은 집밥 달성"
    },
    "mealPlan": [
      {
        "date": "1일차 저녁",
        "mealType": "저녁",
        "menuName": "참치김치비빔밥",
        "estimatedCost": 1500,
        "cookingTime": 5,
        "difficulty": "초보",
        "ingredientsUsed": ["김치", "참치캔", "계란"],
        "additionalIngredients": ["햇반"],
        "tastePoint": "참기름 한 방울과 반숙 계란 프라이가 핵심입니다.",
        "recipe": {
          "ingredients": ["김치 조금", "참치캔 1/2", "계란 1개", "햇반 1개", "참기름 1스푼"],
          "steps": [
            "햇반을 전자레인지 700W 기준 2분 돌려줍니다.",
            "프라이팬에 식용유를 두르고 계란 프라이를 반숙으로 굽습니다. (약불에서 2분)",
            "따뜻한 밥 위에 잘게 자른 김치와 기름을 뺀 참치를 올립니다.",
            "계란 프라이를 올리고 참기름을 둘러 비벼 먹습니다."
          ],
          "tips": ["김치를 프라이팬에 살짝 볶아 올리면 감칠맛이 폭발합니다."],
          "failurePrevention": ["참치 기름을 꽉 짜주지 않으면 비빔밥이 느끼해질 수 있어요."],
          "substitutions": ["햇반 대신 남은 찬밥을 활용해도 좋습니다."]
        },
        "reason": "냉장고에 있는 김치와 참치캔을 최우선으로 소진하기 위해 구성했습니다.",
        "prepInstructions": ""
      },
      {
        "date": "2일차 점심",
        "mealType": "점심",
        "menuName": "치킨마요 덮밥",
        "estimatedCost": 500,
        "cookingTime": 8,
        "difficulty": "초보",
        "ingredientsUsed": ["어제 남은 치킨", "계란", "양파"],
        "additionalIngredients": ["마요네즈", "간장"],
        "tastePoint": "양파를 간장에 졸여 단짠단짠 소스를 만드는 것이 포인트!",
        "recipe": {
          "ingredients": ["남은 치킨 3조각", "계란 1개", "양파 1/4개", "마요네즈", "간장 1스푼", "설탕 0.5스푼"],
          "steps": [
            "남은 치킨은 잘게 찢어서 전자레인지 700W에서 1분간 데웁니다.",
            "양파를 채 썰고 프라이팬에 식용유를 둘러 볶다가 간장 1, 설탕 0.5, 물 2스푼을 넣고 졸입니다.",
            "계란은 풀어서 프라이팬에서 스크램블(1분) 해줍니다.",
            "밥 위에 스크램블, 치킨, 양파조림을 올리고 마요네즈를 뿌려줍니다."
          ],
          "tips": ["마요네즈를 비닐장갑 모서리에 넣고 조금만 잘라 짜면 식당처럼 예쁘게 뿌릴 수 있어요."],
          "failurePrevention": ["양파를 졸일 때 너무 센 불로 하면 간장이 타서 쓴맛이 납니다."],
          "substitutions": ["치킨 대신 참치나 스팸을 넣어도 훌륭합니다."]
        },
        "reason": "어제 남은 배달 치킨 잔반을 완벽하게 재활용하는 맛보장 메뉴입니다.",
        "prepInstructions": "냉동실에 치킨을 보관했다면 1시간 전 실온에 꺼내 해동해주세요."
      }
    ],
    "shoppingList": [
      {
        "ingredientName": "마요네즈",
        "quantity": 1,
        "unit": "개",
        "estimatedPrice": 3500,
        "priority": "required",
        "usedForMenu": ["치킨마요 덮밥"],
        "storageTip": "서늘한 실온 보관 (개봉 후 냉장)"
      },
      {
        "ingredientName": "햇반 3입",
        "quantity": 1,
        "unit": "팩",
        "estimatedPrice": 4500,
        "priority": "required",
        "usedForMenu": ["참치김치비빔밥"],
        "storageTip": "실온 보관"
      }
    ]
  };
}
