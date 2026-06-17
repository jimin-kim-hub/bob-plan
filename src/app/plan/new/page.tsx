"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";

export default function NewPlanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [currentExpiry, setCurrentExpiry] = useState("");
  const [inventoryItems, setInventoryItems] = useState<{name: string, expiry: string}[]>([]);
  const [mealOptions, setMealOptions] = useState<string[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    nickname: "",
    weeklyBudget: 50000,
    planDays: "3",
    mealSchedule: "",
    portionSize: "1",
    cookingLevel: "초보",
    maxCookingTime: "15",
    cookingTools: [] as string[],
    basicSeasonings: [] as string[],
    goal: "절약",
    preferences: "",
    dislikedFoods: "",
    allergies: "",
  });

  useEffect(() => {
    const days = parseInt(formData.planDays) || 3;
    const options = [];
    const today = new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const meals = ['아침', '점심', '저녁'];
    
    const currentHour = today.getHours();
    let startMealIdx = 0;
    if (currentHour >= 20) {
      today.setDate(today.getDate() + 1);
    } else if (currentHour >= 14) {
      startMealIdx = 2;
    } else if (currentHour >= 10) {
      startMealIdx = 1;
    }

    let currentDate = new Date(today);
    
    for (let i = 0; i < days; i++) {
      const dayName = dayNames[currentDate.getDay()];
      const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
      
      for (let m = 0; m < meals.length; m++) {
        if (i === 0 && m < startMealIdx) continue;
        options.push(`${dateStr}(${dayName}) ${meals[m]}`);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setMealOptions(options);
    setSelectedMeals(options);
  }, [formData.planDays]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: "cookingTools" | "basicSeasonings", value: string) => {
    setFormData((prev) => {
      const list = prev[name];
      if (list.includes(value)) {
        return { ...prev, [name]: list.filter((item) => item !== value) };
      } else {
        return { ...prev, [name]: [...list, value] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        mealSchedule: selectedMeals.length > 0 ? selectedMeals.join(', ') : "선택 안함",
        inventory: inventoryItems.length > 0 
          ? inventoryItems.map(item => `${item.name}${item.expiry ? ` (유통기한: ${item.expiry})` : ''}`).join(', ')
          : "없음"
      };

      const res = await fetch('/api/meal-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success && data.planId) {
        router.push(`/plan/${data.planId}`);
      } else {
        throw new Error("API 연동 실패");
      }
    } catch (error) {
      console.error(error);
      alert("식단 생성 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  const tools = ["전자레인지", "프라이팬", "냄비", "에어프라이어", "밥솥", "오븐"];
  const seasonings = ["소금", "간장", "설탕", "식용유", "고춧가루", "참기름", "고추장", "된장", "후추"];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-orange-500 p-2 rounded-xl">
            <ChefHat className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight">밥계획</span>
        </Link>
        <UserMenu />
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-10">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">나만의 식단 만들기</h1>
          <p className="text-slate-500">예산과 냉장고 상황을 알려주시면 최적의 3일 식단을 짜드려요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          
          {/* 1. 기본 정보 */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">1. 기본 정보</h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">닉네임</label>
              <input 
                type="text" name="nickname" required value={formData.nickname} onChange={handleInputChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="자취요리왕"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">이번 주 예산 (원)</label>
                <input 
                  type="number" name="weeklyBudget" required value={formData.weeklyBudget} onChange={handleInputChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">계획 기간</label>
                <select 
                  name="planDays" value={formData.planDays} onChange={handleInputChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                >
                  <option value="3">3일 (추천)</option>
                  <option value="5">5일</option>
                  <option value="7">7일</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">집에서 식사할 끼니 선택</label>
                <div className="flex flex-wrap gap-2">
                  {mealOptions.map((meal, idx) => {
                    const isSelected = selectedMeals.includes(meal);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMeals(selectedMeals.filter(m => m !== meal));
                          } else {
                            setSelectedMeals([...selectedMeals, meal]);
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
                          isSelected 
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                        }`}
                      >
                        {meal}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">외식이나 약속이 있는 끼니는 한 번 눌러서 빼주세요.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">1회 식사량</label>
                <select 
                  name="portionSize" value={formData.portionSize} onChange={handleInputChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                >
                  <option value="0.5">0.5인분 (소식가)</option>
                  <option value="1">1인분 (보통)</option>
                  <option value="1.5">1.5인분</option>
                  <option value="2">2인분 (대식가)</option>
                </select>
              </div>
            </div>
          </section>

          {/* 2. 냉장고 및 요리 환경 */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">2. 냉장고 및 요리 환경</h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">보유 중인 재료 (잔반 포함)</label>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  value={currentIngredient} 
                  onChange={(e) => setCurrentIngredient(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="예) 계란 3개, 먹다 남은 치킨"
                />
                <input 
                  type="text" 
                  value={currentExpiry} 
                  onChange={(e) => setCurrentExpiry(e.target.value)}
                  className="w-32 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="남은 기한 (선택)"
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (currentIngredient.trim() === "") return;
                    setInventoryItems([...inventoryItems, { name: currentIngredient, expiry: currentExpiry }]);
                    setCurrentIngredient("");
                    setCurrentExpiry("");
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl font-bold transition-colors w-14 flex items-center justify-center"
                >
                  +
                </button>
              </div>
              
              {inventoryItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  {inventoryItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white border border-orange-200 text-orange-800 px-3 py-1.5 rounded-lg text-sm shadow-sm">
                      <span className="font-semibold">{item.name}</span>
                      {item.expiry && <span className="text-orange-600 text-xs">({item.expiry})</span>}
                      <button 
                        type="button" 
                        onClick={() => setInventoryItems(inventoryItems.filter((_, i) => i !== index))}
                        className="text-orange-300 hover:text-orange-600 ml-1 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">최대 조리 시간</label>
                <select 
                  name="maxCookingTime" value={formData.maxCookingTime} onChange={handleInputChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                >
                  <option value="5">5분 이하</option>
                  <option value="10">10분 이하</option>
                  <option value="15">15분 이하</option>
                  <option value="30">30분 이하</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">요리 실력</label>
                <select 
                  name="cookingLevel" value={formData.cookingLevel} onChange={handleInputChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                >
                  <option value="못함">아예 못함</option>
                  <option value="초보">초보 (계란후라이 정도)</option>
                  <option value="보통">보통 (레시피 보고 가능)</option>
                  <option value="잘함">잘함</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">보유 조리 도구</label>
              <div className="flex flex-wrap gap-2">
                {tools.map(tool => (
                  <label key={tool} className={`px-4 py-2 rounded-full cursor-pointer border text-sm transition-all ${formData.cookingTools.includes(tool) ? 'bg-orange-100 border-orange-500 text-orange-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'}`}>
                    <input type="checkbox" className="hidden" checked={formData.cookingTools.includes(tool)} onChange={() => handleCheckboxChange('cookingTools', tool)} />
                    {tool}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">보유 기본 양념</label>
              <div className="flex flex-wrap gap-2">
                {seasonings.map(seasoning => (
                  <label key={seasoning} className={`px-4 py-2 rounded-full cursor-pointer border text-sm transition-all ${formData.basicSeasonings.includes(seasoning) ? 'bg-orange-100 border-orange-500 text-orange-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'}`}>
                    <input type="checkbox" className="hidden" checked={formData.basicSeasonings.includes(seasoning)} onChange={() => handleCheckboxChange('basicSeasonings', seasoning)} />
                    {seasoning}
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* 3. 취향 및 목표 */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">3. 취향 및 목표</h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">목표</label>
              <select 
                name="goal" value={formData.goal} onChange={handleInputChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              >
                <option value="절약">식비 절약</option>
                <option value="다이어트">다이어트</option>
                <option value="건강식">건강식</option>
                <option value="빠른조리">최대한 빠른 조리</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">비선호 음식 / 알레르기</label>
              <input 
                type="text" name="dislikedFoods" value={formData.dislikedFoods} onChange={handleInputChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="예) 버섯 싫어함, 갑각류 알레르기"
              />
            </div>
          </section>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-lg py-4 rounded-xl shadow-md transition-all mt-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI가 완벽한 식단을 계산중입니다...
              </>
            ) : (
              <>
                식단 생성하기
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}
