import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ChefHat, ArrowLeft, PiggyBank, CalendarCheck, LogOut, ArrowRight } from "lucide-react";
import UserMenu from "@/components/UserMenu";

export default async function MyPage() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      mealPlans: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    redirect("/auth/login");
  }

  const totalSavings = user.mealPlans.reduce((sum, plan) => sum + plan.estimatedSavings, 0);
  const totalPlans = user.mealPlans.length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-orange-500 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-2 rounded-xl">
              <ChefHat className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">마이페이지</span>
          </div>
        </div>
        <UserMenu />
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-8 space-y-8">
        
        {/* 프로필 요약 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user.nickname}님, 반가워요!</h2>
            <p className="text-slate-500 text-sm mt-1">{user.email}</p>
          </div>
        </div>

        {/* 누적 통계 대시보드 */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">나의 누적 절약 리포트</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex flex-col items-center justify-center text-center">
              <PiggyBank className="w-8 h-8 text-orange-500 mb-3" />
              <p className="text-sm font-semibold text-orange-600 mb-1">총 아낀 식비</p>
              <p className="text-3xl font-extrabold text-orange-600">{totalSavings.toLocaleString()}원</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col items-center justify-center text-center">
              <CalendarCheck className="w-8 h-8 text-blue-500 mb-3" />
              <p className="text-sm font-semibold text-blue-600 mb-1">생성한 식단</p>
              <p className="text-3xl font-extrabold text-blue-600">{totalPlans}회</p>
            </div>
          </div>
        </section>

        {/* 과거 식단 히스토리 */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">과거 식단 기록</h3>
          <div className="space-y-4">
            {user.mealPlans.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-500">
                아직 생성된 식단이 없습니다. 지금 바로 첫 식단을 짜보세요!
                <Link href="/plan/new" className="block mt-4 text-orange-500 font-bold hover:underline">식단 생성하기</Link>
              </div>
            ) : (
              user.mealPlans.map((plan) => (
                <Link key={plan.id} href={`/plan/${plan.id}`}>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-orange-300 hover:shadow-md transition-all flex items-center justify-between group">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 mb-1">
                        {plan.createdAt.toLocaleDateString()} 생성
                      </p>
                      <p className="font-bold text-slate-800">
                        {plan.budget.toLocaleString()}원 예산 식단 (예상 지출 {plan.estimatedCost.toLocaleString()}원)
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
