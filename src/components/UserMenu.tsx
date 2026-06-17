"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-orange-100 text-orange-600 px-3 py-2 rounded-full hover:bg-orange-200 transition-colors shadow-sm hover:scale-105 active:scale-95 duration-200"
      >
        <User className="w-5 h-5" />
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <Link 
            href="/mypage"
            className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
            onClick={() => setIsOpen(false)}
          >
            <User className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold">마이페이지</span>
          </Link>
          <Link 
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold">환경설정</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-bold">로그아웃</span>
          </button>
        </div>
      )}
    </div>
  );
}
