"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, MessageSquare, Star, CheckCircle, RefreshCw } from "lucide-react";

export default function MealCard({ item, requireFeedback }: { item: any, requireFeedback: boolean }) {
  const recipe = JSON.parse(item.recipeText);
  const usedIngredients = JSON.parse(item.ingredientsUsedJson);
  const addIngredients = JSON.parse(item.additionalIngredientsJson);

  const router = useRouter();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubstituting, setIsSubstituting] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [feedback, setFeedback] = useState({
    ateStatus: '먹음',
    tasteRating: 5,
    difficultyRating: 3,
    actualCost: '',
    wantAgain: true
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealPlanItemId: item.id,
          ...feedback,
          actualCost: feedback.actualCost ? parseInt(feedback.actualCost) : null
        })
      });
      setFeedbackSubmitted(true);
      setIsFeedbackOpen(false);
      
      // Dispatch custom event to update dashboard stats
      window.dispatchEvent(new CustomEvent('feedbackSubmitted', { detail: feedback.ateStatus }));
    } catch (e) {
      console.error(e);
    }
    setIsSubmitting(false);
  };

  const handleSubstitute = async (reason: string) => {
    setIsSubstituting(true);
    setShowSubMenu(false);
    try {
      await fetch('/api/meal-plan/substitute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: item.planId,
          mealPlanItemId: item.id,
          reason
        })
      });
      // 서버에서 새로 데이터를 받아오도록 페이지 리프레시
      router.refresh();
    } catch (e) {
      console.error(e);
      setIsSubstituting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
        <div className="flex items-center gap-3">
          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
            {new Date(item.date).toLocaleDateString('ko-KR')} {item.mealType}
          </span>
          <h3 className="text-xl font-bold text-slate-800">{item.menuName}</h3>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <span className="hidden sm:flex items-center gap-1"><Clock className="w-4 h-4"/> {item.cookingTime}분</span>
          <span className="hidden sm:inline">난이도: {item.difficulty}</span>
          <span className="text-orange-600 mr-2">{item.estimatedCost.toLocaleString()}원</span>
          
          <div className="relative">
            <button 
              onClick={() => setShowSubMenu(!showSubMenu)}
              disabled={isSubstituting}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-colors shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isSubstituting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">교체</span>
            </button>
            
            {showSubMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-2 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1 text-xs font-bold text-slate-400 border-b border-slate-100 mb-1">교체 사유 선택</div>
                {["너무 귀찮아요", "더 저렴하게", "같은 재료로 다른 메뉴", "단백질 높게", "매운맛 줄이기"].map(reason => (
                  <button 
                    key={reason}
                    onClick={() => handleSubstitute(reason)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {item.prepInstructions && (
            <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-sm font-medium">
              💡 사전 준비: {item.prepInstructions}
            </div>
          )}
          
          <div>
            <h4 className="font-bold text-slate-800 mb-2">재료 현황</h4>
            <div className="flex flex-wrap gap-2 text-sm">
              {usedIngredients.map((ing: string) => (
                <span key={ing} className="bg-green-100 text-green-800 px-2 py-1 rounded-lg">보유: {ing}</span>
              ))}
              {addIngredients.map((ing: string) => (
                <span key={ing} className="bg-red-100 text-red-800 px-2 py-1 rounded-lg">필요: {ing}</span>
              ))}
            </div>
          </div>

          {item.tastePoint && (
            <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm leading-relaxed">
              <span className="font-bold block mb-1">😋 맛 포인트</span>
              {item.tastePoint}
            </div>
          )}

          <div className="text-sm text-slate-600 italic">
            " {item.reason} "
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 mb-2 border-b pb-2">조리 순서</h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 text-sm leading-relaxed">
              {recipe.steps.map((step: string, i: number) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          {recipe.tips?.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-800 mb-2 text-sm">꿀팁</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                {recipe.tips.map((tip: string, i: number) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer (Feedback) */}
      <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          {requireFeedback && !feedbackSubmitted && (
            <button 
              onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}
              className="flex items-center gap-2 text-orange-600 font-bold text-sm hover:text-orange-700 transition-colors bg-orange-100 px-4 py-2 rounded-xl"
            >
              <MessageSquare className="w-4 h-4" />
              피드백 남기기
            </button>
          )}
          
          {feedbackSubmitted && (
            <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-4 py-2 rounded-xl">
              <CheckCircle className="w-4 h-4" />
              피드백 완료
            </div>
          )}
        </div>

        {isFeedbackOpen && !feedbackSubmitted && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 mt-2 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <h4 className="font-bold text-slate-800 text-sm border-b pb-2">식사 후 평가 (AI 학습 데이터)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">식사 여부</label>
                <select 
                  value={feedback.ateStatus} 
                  onChange={e => setFeedback({...feedback, ateStatus: e.target.value})}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                >
                  <option value="먹음">먹음</option>
                  <option value="안 먹음 (외식/배달)">안 먹음 (외식/배달)</option>
                  <option value="다른 메뉴 먹음">다른 메뉴 먹음</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">실제 지출 비용 (선택)</label>
                <input 
                  type="number" 
                  value={feedback.actualCost}
                  onChange={e => setFeedback({...feedback, actualCost: e.target.value})}
                  placeholder="예: 4500"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">맛 별점 (1~5)</label>
                <div className="flex gap-1 items-center h-9">
                  {[1,2,3,4,5].map(star => (
                    <button 
                      key={star}
                      onClick={() => setFeedback({...feedback, tasteRating: star})}
                      className={`${feedback.tasteRating >= star ? 'text-yellow-400' : 'text-slate-200'} hover:scale-110 transition-transform`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">다시 추천 받을까요?</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFeedback({...feedback, wantAgain: true})}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${feedback.wantAgain ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >네</button>
                  <button 
                    onClick={() => setFeedback({...feedback, wantAgain: false})}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${!feedback.wantAgain ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >아니요</button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors"
              >
                제출하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
