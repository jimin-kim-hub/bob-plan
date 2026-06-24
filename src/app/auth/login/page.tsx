"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChefHat, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = "/";
    } catch (e: any) {
      setError(e.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <div className="bg-orange-500 p-3 rounded-2xl mb-4 hover:scale-105 transition-transform">
              <ChefHat className="text-white w-8 h-8" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">돌아오셨군요!</h1>
          <p className="text-slate-500 mt-2 text-center">오늘도 스마트하게 식비를 아껴볼까요?</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 font-medium text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">이메일 (아이디)</label>
            <input 
              type="email" required 
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">비밀번호</label>
            <input 
              type="password" required 
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          <button disabled={isLoading} type="submit" className="w-full bg-slate-800 text-white font-bold p-4 rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 mt-2">
            {isLoading ? "로그인 중..." : "로그인"} <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          아직 계정이 없으신가요? <Link href="/auth/signup" className="text-orange-600 font-bold hover:underline">회원가입</Link>
        </div>
      </div>
    </div>
  );
}
