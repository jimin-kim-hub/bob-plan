import Link from 'next/link';
import { ChefHat, PiggyBank, CalendarCheck, Utensils } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-2 rounded-xl">
            <ChefHat className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">밥계획</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/settings" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            설정
          </Link>
          <Link href="/plan/new" className="text-sm font-medium text-slate-600 hover:text-orange-600 transition-colors">
            시작하기
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="px-6 pt-20 pb-16 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-6">
            <PiggyBank className="w-4 h-4" />
            자취생 필수 AI 매니저
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            이번 주 식비 <span className="text-orange-500">5만 원</span>,<br />
            뭐 먹을지 AI가 짜드립니다.
          </h1>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            냉장고에 남은 재료와 예산을 알려주세요.<br className="hidden sm:block" />
            현실적인 3일 식단부터 레시피, 장보기 목록까지 완벽하게 만들어드려요.
          </p>
          <Link 
            href="/plan/new" 
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Utensils className="w-5 h-5" />
            무료로 3일 식단 받아보기
          </Link>
        </section>

        <section className="bg-white py-16 px-6 border-t border-slate-200">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-12">밥계획이 해결해드려요</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<PiggyBank className="w-8 h-8 text-orange-500" />}
                title="배달비 완벽 절약"
                description="예산 안에서 해결할 수 있는 식단을 짜드려요. 배달 유혹을 이겨낼 수 있습니다."
              />
              <FeatureCard 
                icon={<CalendarCheck className="w-8 h-8 text-green-500" />}
                title="남은 재료 냉장고 파먹기"
                description="애매하게 남은 식재료를 우선적으로 활용하는 메뉴를 추천해 버리는 식재료를 줄여요."
              />
              <FeatureCard 
                icon={<ChefHat className="w-8 h-8 text-blue-500" />}
                title="15분 컷 현실 레시피"
                description="복잡한 요리는 NO! 요리 초보도 전자레인지와 프라이팬으로 뚝딱 만들 수 있습니다."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} 밥계획. All rights reserved.</p>
        <p className="mt-2 text-slate-500">자취생의 식비 절약을 응원합니다.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-orange-200 transition-colors shadow-sm hover:shadow-md text-center flex flex-col items-center">
      <div className="bg-white p-4 rounded-full shadow-sm mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
