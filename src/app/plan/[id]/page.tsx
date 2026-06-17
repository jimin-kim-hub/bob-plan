import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ChefHat, PiggyBank, Calendar, ShoppingCart, Award, Clock, ArrowLeft } from 'lucide-react';
import MealCard from './MealCard';
import { getSession } from '@/lib/auth';
import UserMenu from '@/components/UserMenu';

export default async function PlanResultPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const plan = await prisma.mealPlan.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: true,
      shoppingLists: {
        include: { items: true }
      }
    }
  });

  if (!plan) return notFound();

  const session = await getSession();
  if (!session) return notFound(); // Or redirect to login

  const user = await prisma.user.findUnique({ 
    where: { id: session.userId },
    include: { profile: true } 
  });
  const requireFeedback = user?.profile?.requireFeedback ?? true;

  const feedbacks = await prisma.feedback.findMany({
    where: { mealPlanItem: { planId: resolvedParams.id } }
  });
  const eatenCount = feedbacks.filter(f => f.ateStatus === '먹음').length;
  const totalMeals = plan.items.length;

  const shoppingList = plan.shoppingLists[0]?.items || [];
  const budgetRemaining = plan.budget - plan.estimatedCost;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/plan/new" className="text-slate-400 hover:text-orange-500 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-2 rounded-xl">
              <ChefHat className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">밥계획 결과</span>
          </div>
        </div>
        <UserMenu />
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-10">
        
        {/* 주간 리포트 / 요약 */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] -z-10" />
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-orange-500" />
            식단 요약 및 기대 효과
          </h2>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs font-semibold text-slate-500 mb-1">총 예상 식비</p>
              <p className="text-2xl font-bold text-slate-800">{plan.estimatedCost.toLocaleString()}원</p>
              <p className="text-xs text-green-600 mt-2 font-medium">예산 {budgetRemaining.toLocaleString()}원 남음</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 text-center">
              <p className="text-xs font-semibold text-orange-600 mb-1">예상 절약액</p>
              <p className="text-2xl font-bold text-orange-600">{plan.estimatedSavings.toLocaleString()}원</p>
              <p className="text-xs text-orange-500 mt-2 font-medium">배달비 방어</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
              <p className="text-xs font-semibold text-blue-600 mb-1">재료 활용률</p>
              <p className="text-2xl font-bold text-blue-600">{Math.round(plan.inventoryUtilizationRate * 100)}%</p>
              <p className="text-xs text-blue-500 mt-2 font-medium">냉장고 비우기</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 text-center">
              <p className="text-xs font-semibold text-purple-600 mb-1">식사 달성률</p>
              <p className="text-2xl font-bold text-purple-600">{eatenCount} / {totalMeals}</p>
              <p className="text-xs text-purple-500 mt-2 font-medium">피드백 완료 기준</p>
            </div>
          </div>
        </section>

        {/* 식단 및 레시피 */}
        <section>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-500" />
            추천 식단 및 레시피
          </h2>

          <div className="space-y-6">
            {plan.items.map((item) => (
              <MealCard key={item.id} item={item} requireFeedback={requireFeedback} />
            ))}
          </div>
        </section>

        {/* 장보기 목록 */}
        <section>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-orange-500" />
            장보기 목록
          </h2>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="font-bold text-slate-800">구매 필요 항목 ({shoppingList.length}개)</span>
              <span className="font-bold text-orange-600">예상 {plan.shoppingLists[0]?.totalEstimatedCost.toLocaleString() || 0}원</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {shoppingList.length === 0 ? (
                <li className="p-8 text-center text-slate-500">추가로 구매할 재료가 없습니다. 냉장고 파먹기 완벽!</li>
              ) : (
                shoppingList.map(item => (
                  <li key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800 text-lg">{item.ingredientName}</span>
                        <span className="text-sm font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          {item.quantity}{item.unit}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">용도: {item.usedForMenu}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-700">{item.estimatedPrice.toLocaleString()}원</span>
                      <a 
                        href={`https://www.coupang.com/np/search?q=${encodeURIComponent(item.ingredientName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors inline-block"
                      >
                        구매 검색
                      </a>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

      </main>
    </div>
  );
}
