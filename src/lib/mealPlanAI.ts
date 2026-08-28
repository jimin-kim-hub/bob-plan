import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import prisma from './prisma';

/**
 * 최근 낮은 평점(2점 이하)이나 "다시 안 먹고 싶어요"를 받은 메뉴 이름을 모아
 * 다음 생성 프롬프트에서 피하도록 한다. 피드백 화면의 "AI 학습 데이터"라는
 * 문구가 실제로 다음 추천에 반영되게 만드는 최소한의 개인화 루프.
 */
export async function getRecentDislikedMenus(userId: string, limit = 8): Promise<string[]> {
  const feedbacks = await prisma.feedback.findMany({
    where: {
      userId,
      OR: [{ tasteRating: { lte: 2 } }, { wantAgain: false }],
    },
    include: { mealPlanItem: { select: { menuName: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const names = feedbacks
    .map((f) => f.mealPlanItem?.menuName)
    .filter((name): name is string => Boolean(name));

  return Array.from(new Set(names));
}

const RecipeSchema = z.object({
  ingredients: z.array(z.string()).default([]),
  steps: z.array(z.string()).default([]),
  tips: z.array(z.string()).default([]),
  failurePrevention: z.array(z.string()).default([]),
  substitutions: z.array(z.string()).default([]),
});

export const MealPlanItemSchema = z.object({
  date: z.string().optional().default(''),
  mealType: z.string(),
  menuName: z.string(),
  estimatedCost: z.number(),
  cookingTime: z.number(),
  difficulty: z.string(),
  ingredientsUsed: z.array(z.string()).default([]),
  additionalIngredients: z.array(z.string()).default([]),
  tastePoint: z.string().optional().default(''),
  recipe: RecipeSchema,
  reason: z.string().optional().default(''),
  prepInstructions: z.string().optional().default(''),
});
export type MealPlanItemT = z.infer<typeof MealPlanItemSchema>;

const ShoppingListItemSchema = z.object({
  ingredientName: z.string(),
  quantity: z.number().default(1),
  unit: z.string().default('개'),
  estimatedPrice: z.number().default(0),
  priority: z.string().default('required'),
  usedForMenu: z.array(z.string()).default([]),
  storageTip: z.string().optional().default(''),
});

export const MealPlanResponseSchema = z.object({
  summary: z.object({
    estimatedTotalCost: z.number(),
    budgetRemaining: z.number().optional().default(0),
    estimatedSavings: z.number().optional().default(0),
    inventoryUtilizationRate: z.number().optional().default(0),
    strategy: z.string().optional().default(''),
  }),
  mealPlan: z.array(MealPlanItemSchema),
  shoppingList: z.array(ShoppingListItemSchema).default([]),
});
export type MealPlanResponseT = z.infer<typeof MealPlanResponseSchema>;

// --- 검증 규칙 -------------------------------------------------------

export interface ValidationIssue {
  type: 'budget' | 'allergy' | 'cookingTime' | 'format';
  severity: 'blocking' | 'warning';
  itemIndex?: number;
  message: string;
}

export interface ItemConstraints {
  maxCookingTime: number;
  allergies?: string;
}

function splitTerms(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/[,，、\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function validateBudget(estimatedTotalCost: number, weeklyBudget: number): ValidationIssue[] {
  if (weeklyBudget > 0 && estimatedTotalCost > weeklyBudget) {
    return [
      {
        type: 'budget',
        severity: 'warning',
        message: `예상 총비용(${estimatedTotalCost.toLocaleString()}원)이 예산(${weeklyBudget.toLocaleString()}원)을 초과했습니다.`,
      },
    ];
  }
  return [];
}

export function validateMealItems(items: MealPlanItemT[], constraints: ItemConstraints): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const allergyTerms = splitTerms(constraints.allergies);

  items.forEach((item, itemIndex) => {
    if (constraints.maxCookingTime > 0 && item.cookingTime > constraints.maxCookingTime) {
      issues.push({
        type: 'cookingTime',
        severity: 'warning',
        itemIndex,
        message: `"${item.menuName}"의 조리시간(${item.cookingTime}분)이 허용 시간(${constraints.maxCookingTime}분)을 초과했습니다.`,
      });
    }

    if (allergyTerms.length > 0) {
      const haystack = [item.menuName, ...item.ingredientsUsed, ...item.additionalIngredients].join(' ');
      for (const term of allergyTerms) {
        if (haystack.includes(term)) {
          issues.push({
            type: 'allergy',
            severity: 'blocking',
            itemIndex,
            message: `"${item.menuName}"에 알레르기 재료로 등록된 "${term}"(이)가 포함된 것으로 보입니다.`,
          });
        }
      }
    }
  });

  return issues;
}

export function hasBlockingIssues(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === 'blocking');
}

export function formatIssuesForPrompt(issues: ValidationIssue[]): string {
  return issues.map((i) => `- [${i.severity === 'blocking' ? '반드시 수정' : '가능하면 수정'}] ${i.message}`).join('\n');
}

/** itemIndex별 위반 메시지를 이어붙여 MealPlanItem.validationNote에 저장할 문자열을 만든다. */
export function noteForItem(issues: ValidationIssue[], itemIndex: number): string | null {
  const related = issues.filter((i) => i.itemIndex === itemIndex);
  if (related.length === 0) return null;
  return related.map((i) => i.message).join(' / ');
}

/** 재요청 후에도 알레르기(치명적) 위반이 남아있는 메뉴는 안전하게 내용을 비우고 경고로 치환한다. */
export function redactBlockingItems(items: MealPlanItemT[], issues: ValidationIssue[]): MealPlanItemT[] {
  const blockingIndexes = new Set(
    issues.filter((i) => i.severity === 'blocking' && i.itemIndex !== undefined).map((i) => i.itemIndex)
  );
  if (blockingIndexes.size === 0) return items;

  return items.map((item, idx) => {
    if (!blockingIndexes.has(idx)) return item;
    return {
      ...item,
      menuName: `⚠️ 알레르기 위험으로 보류된 메뉴`,
      estimatedCost: 0,
      ingredientsUsed: [],
      additionalIngredients: [],
      recipe: {
        ingredients: [],
        steps: ['알레르기 위험이 감지되어 자동으로 보류되었습니다. "교체" 버튼으로 다른 메뉴를 요청해주세요.'],
        tips: [],
        failurePrevention: [],
        substitutions: [],
      },
    };
  });
}

// --- Gemini 호출 + 재검증 파이프라인 ----------------------------------

export interface GenerateWithValidationResult<T> {
  data: T;
  issues: ValidationIssue[];
  wasAutoCorrected: boolean;
}

/**
 * Gemini에 요청 → zod로 구조 검증 → 비즈니스 규칙(validate) 검증까지 통과할 때까지
 * 최대 1회 재요청한다. 무한 루프를 막기 위해 시도 횟수는 항상 2회로 고정한다.
 */
export async function generateWithValidation<T>(opts: {
  apiKey: string;
  buildPrompt: (correction?: string) => string;
  schema: z.ZodType<T>;
  validate: (data: T) => ValidationIssue[];
}): Promise<GenerateWithValidationResult<T>> {
  const { apiKey, buildPrompt, schema, validate } = opts;
  // gemini-flash-latest는 큰 요청(여러 날치 식단)에서 503(과부하)이 잦고 응답도 느려
  // Vercel의 60초 함수 제한에 걸릴 위험이 컸다. gemini-flash-lite-latest가 같은 요청을
  // 훨씬 빠르고 안정적으로 처리하는 것을 확인하고 교체했다.
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

  let correction: string | undefined;
  let lastError: unknown = null;
  const MAX_ATTEMPTS = 2;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const prompt = buildPrompt(correction);
      const result = await model.generateContent(prompt);
      let text = result.response.text();
      text = text.replace(/^```json/g, '').replace(/```$/g, '').trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        lastError = new Error('AI 응답이 유효한 JSON이 아닙니다.');
        correction = '이전 응답이 유효한 JSON이 아니었습니다. 마크다운이나 설명 없이 순수 JSON 객체만 출력하세요.';
        continue;
      }

      const zodResult = schema.safeParse(parsed);
      if (!zodResult.success) {
        lastError = zodResult.error;
        correction = 'JSON 구조가 요청한 스키마와 다릅니다. 반드시 지정된 JSON 스키마 형식 그대로 다시 출력하세요.';
        continue;
      }

      const issues = validate(zodResult.data);
      const blocking = issues.filter((i) => i.severity === 'blocking');
      if (blocking.length > 0 && attempt < MAX_ATTEMPTS - 1) {
        correction = `아래 문제를 반드시 수정해서 다시 생성하세요:\n${formatIssuesForPrompt(blocking)}`;
        continue;
      }

      return { data: zodResult.data, issues, wasAutoCorrected: attempt > 0 };
    } catch (err) {
      lastError = err;
      correction = correction || '이전 시도에서 오류가 발생했습니다. 순수 JSON 객체만 출력하세요.';
    }
  }

  throw lastError instanceof Error ? lastError : new Error('AI 응답 생성/검증에 반복적으로 실패했습니다.');
}
