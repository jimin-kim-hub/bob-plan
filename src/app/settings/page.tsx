"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings, Info } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [requireFeedback, setRequireFeedback] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRequireFeedback(data.data.requireFeedback);
        }
        setIsLoading(false);
      });
  }, []);

  const handleToggle = async () => {
    const newValue = !requireFeedback;
    setRequireFeedback(newValue);
    setIsSaving(true);
    
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requireFeedback: newValue })
    });
    
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Settings className="text-slate-800 w-5 h-5" />
          <span className="text-lg font-bold text-slate-800 tracking-tight">설정</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">앱 환경설정</h2>
          
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">식사 후 피드백 입력 활성화</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                피드백을 입력해주시면 사용자님의 입맛과 취향(매운맛, 조리 난이도 선호 등)을 학습하여 다음 식단 구성 시 훨씬 만족스러운 맞춤형 식단을 제공해드릴 수 있습니다. 가급적 활성화하시는 것을 권장합니다!
              </p>
            </div>
            
            <button 
              onClick={handleToggle}
              disabled={isLoading || isSaving}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 ${requireFeedback ? 'bg-orange-500' : 'bg-slate-300'}`}
            >
              <span className="sr-only">피드백 입력 활성화</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${requireFeedback ? 'translate-x-7' : 'translate-x-0'}`}
              />
            </button>
          </div>

          <div className="mt-6 bg-blue-50 p-4 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              이 설정을 끄더라도 이미 생성된 식단이나 장보기 목록은 유지됩니다. 단지 식단 결과 화면에서 평가 위젯이 숨겨집니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
