require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

const DEMO_EMAIL = 'judge@bobplan.demo';
const DEMO_PASSWORD = 'BobPlan2026!';
const DEMO_NICKNAME = '심사위원용 데모';

const DEMO_INPUT = {
  weeklyBudget: 50000,
  mealSchedule: '3일 (월 저녁, 화 점심/저녁, 수 저녁)',
  portionSize: '1',
  inventory: '계란 6개, 김치 조금, 햇반 3개, 양파 1개, 두부 1모, 어제 남은 배달 치킨 3조각',
  basicSeasonings: ['소금', '간장', '식용유', '설탕', '고춧가루', '참기름'],
  maxCookingTime: 15,
  cookingTools: ['전자레인지', '프라이팬', '냄비'],
  goal: '절약',
  preferences: '매콤한 음식, 단백질 많은 음식',
  dislikedFoods: '버섯',
  allergies: '',
};

function buildPrompt(input) {
  return `
너는 자취생의 식비를 줄이고 맛있는 식단을 설계하는 AI 식생활 매니저다.

목표:
- 사용자의 예산 안에서 식단을 구성한다.
- 보유 재료를 우선 사용한다.
- 사용자가 실제로 해먹을 수 있을 만큼 쉬운 메뉴를 추천한다.
- 각 메뉴는 맛있어야 하며, 맛 포인트와 실패 방지 팁을 포함한다.
- 장보기 목록은 실제 필요한 재료 중심으로 최소화한다.

사용자 정보:
- 예산: ${input.weeklyBudget}
- 계획 기간 및 끼니: ${input.mealSchedule}
- 1회 식사량: ${input.portionSize}인분
- 보유 재료 (보관 상태 및 잔반 포함): ${input.inventory}
- 보유 기본 양념: ${input.basicSeasonings.join(', ')}
- 조리 가능 시간: ${input.maxCookingTime}분 이하
- 조리 도구: ${input.cookingTools.join(', ')}
- 목표: ${input.goal}
- 선호 음식: ${input.preferences}
- 비선호 음식: ${input.dislikedFoods}
- 알레르기: ${input.allergies || '없음'}

반드시 지켜야 할 조건:
1. 총 예상 비용은 예산을 넘기지 않는다.
2. 알레르기 재료는 절대 포함하지 않는다.
3. 비선호 음식은 가능하면 제외한다.
4. 보유 재료를 최대한 먼저 사용한다.
5. 각 메뉴마다 레시피를 제공한다. (전자레인지 등을 사용할 경우 구체적인 조리 시간/온도를 명시한다)
6. 각 메뉴마다 맛있게 만드는 팁을 제공한다.
7. 너무 복잡한 요리는 제외한다.
8. 장보기 목록은 최소화한다.
9. 결과는 반드시 JSON 형식으로만 반환한다. 마크다운 백틱은 제외하고 순수 JSON 객체만 출력한다.

출력 JSON 구조:
{
  "summary": { "estimatedTotalCost": number, "budgetRemaining": number, "estimatedSavings": number, "inventoryUtilizationRate": number, "strategy": string },
  "mealPlan": [ { "date": string, "mealType": string, "menuName": string, "estimatedCost": number, "cookingTime": number, "difficulty": string, "ingredientsUsed": string[], "additionalIngredients": string[], "tastePoint": string, "recipe": { "ingredients": string[], "steps": string[], "tips": string[], "failurePrevention": string[], "substitutions": string[] }, "reason": string, "prepInstructions": string } ],
  "shoppingList": [ { "ingredientName": string, "quantity": number, "unit": string, "estimatedPrice": number, "priority": "required" | "optional", "usedForMenu": string[], "storageTip": string } ]
}`;
}

async function generatePlanJson(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
  const result = await model.generateContent(buildPrompt(DEMO_INPUT));
  let text = result.response.text();
  text = text.replace(/^```json/g, '').replace(/```$/g, '').trim();
  return JSON.parse(text);
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 없어 데모 식단을 생성할 수 없습니다. .env를 확인하세요.');
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      password_hash: passwordHash,
      nickname: DEMO_NICKNAME,
      profile: {
        create: {
          weeklyBudget: DEMO_INPUT.weeklyBudget,
          cookingLevel: '초보',
          maxCookingTime: DEMO_INPUT.maxCookingTime,
          goal: DEMO_INPUT.goal,
          allergies: DEMO_INPUT.allergies,
          requireFeedback: true,
        },
      },
    },
  });

  console.log(`데모 계정 준비 완료: ${DEMO_EMAIL} (userId=${user.id})`);

  const existingPlan = await prisma.mealPlan.findFirst({ where: { userId: user.id } });
  if (existingPlan) {
    console.log('이미 데모 식단이 있어 새로 생성하지 않습니다. planId =', existingPlan.id);
    console.log(`로그인 정보 → 이메일: ${DEMO_EMAIL} / 비밀번호: ${DEMO_PASSWORD}`);
    return;
  }

  console.log('Gemini로 데모 식단 생성 중... (몇 초 걸릴 수 있습니다)');
  const data = await generatePlanJson(apiKey);

  const plan = await prisma.mealPlan.create({
    data: {
      userId: user.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      budget: DEMO_INPUT.weeklyBudget,
      estimatedCost: data.summary.estimatedTotalCost,
      estimatedSavings: data.summary.estimatedSavings,
      inventoryUtilizationRate: data.summary.inventoryUtilizationRate,
      isMock: false,
      items: {
        create: data.mealPlan.map((item) => ({
          date: new Date(),
          mealType: item.mealType,
          menuName: item.menuName,
          ingredientsUsedJson: JSON.stringify(item.ingredientsUsed || []),
          additionalIngredientsJson: JSON.stringify(item.additionalIngredients || []),
          prepInstructions: item.prepInstructions || '',
          estimatedCost: item.estimatedCost,
          cookingTime: item.cookingTime,
          difficulty: item.difficulty,
          recipeText: JSON.stringify(item.recipe),
          tastePoint: item.tastePoint,
          reason: item.reason,
        })),
      },
      shoppingLists: {
        create: {
          totalEstimatedCost: data.summary.estimatedTotalCost,
          items: {
            create: (data.shoppingList || []).map((item) => ({
              ingredientName: item.ingredientName,
              quantity: Number(item.quantity) || 1,
              unit: item.unit,
              estimatedPrice: item.estimatedPrice,
              priority: item.priority,
              usedForMenu: Array.isArray(item.usedForMenu) ? item.usedForMenu.join(', ') : String(item.usedForMenu || ''),
            })),
          },
        },
      },
    },
  });

  console.log('데모 식단 생성 완료. planId =', plan.id);
  console.log(`로그인 정보 → 이메일: ${DEMO_EMAIL} / 비밀번호: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
