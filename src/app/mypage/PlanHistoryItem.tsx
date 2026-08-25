"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Star, Trash2 } from "lucide-react";

export default function PlanHistoryItem({
  plan,
}: {
  plan: { id: string; createdAtLabel: string; budget: number; estimatedCost: number; isFavorite: boolean };
}) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(plan.isFavorite);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggling) return;
    const next = !isFavorite;
    setIsFavorite(next);
    setIsToggling(true);
    try {
      const res = await fetch(`/api/meal-plan/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
      if (!res.ok) throw new Error("즐겨찾기 변경에 실패했습니다.");
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsFavorite(!next);
      alert("즐겨찾기 변경에 실패했습니다.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleting) return;
    if (!confirm("이 식단을 삭제할까요? 삭제하면 되돌릴 수 없습니다.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/meal-plan/${plan.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제에 실패했습니다.");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("삭제에 실패했습니다.");
      setIsDeleting(false);
    }
  };

  return (
    <Link href={`/plan/${plan.id}`}>
      <div
        className={`bg-white p-5 rounded-2xl border transition-all flex items-center justify-between group ${
          isFavorite ? "border-orange-200" : "border-slate-100"
        } hover:border-orange-300 hover:shadow-md ${isDeleting ? "opacity-40 pointer-events-none" : ""}`}
      >
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1">{plan.createdAtLabel} 생성</p>
          <p className="font-bold text-slate-800">
            {plan.budget.toLocaleString()}원 예산 식단 (예상 지출 {plan.estimatedCost.toLocaleString()}원)
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleFavorite}
            disabled={isToggling}
            title="즐겨찾기"
            className="p-2 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <Star className={`w-5 h-5 ${isFavorite ? "fill-orange-400 text-orange-400" : "text-slate-300"}`} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            title="삭제"
            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-slate-300 hover:text-red-500 transition-colors" />
          </button>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-colors ml-1" />
        </div>
      </div>
    </Link>
  );
}
