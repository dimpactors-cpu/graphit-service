"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickGroupCodeBar() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleQuickStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      alert("발급받으신 단체코드를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/group-code/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_code: code.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.result === "ok") {
        const targetItId = data.it_id || "1698900476";
        router.push(
          `/shop/orderform?it_id=${encodeURIComponent(
            targetItId
          )}&group_code=${encodeURIComponent(data.group_code)}`
        );
      } else {
        alert(data.message || "단체코드를 확인해주세요.");
      }
    } catch {
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleQuickStart}
      className="mt-8 bg-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <div>
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[11px] font-bold mb-1">
          단체코드 빠른 검사 신청
        </span>
        <h3 className="text-base sm:text-lg font-extrabold text-white">
          학교·기관에서 발급받은 단체코드가 있으신가요?
        </h3>
        <p className="text-xs text-indigo-200 mt-0.5">
          단체코드를 입력하면 해당 기관에 배정된 검사 프로그램으로 자동 연결됩니다.
        </p>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="단체코드 입력 (예: METACAU2403)"
          className="flex-1 md:w-64 h-11 px-4 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-bold placeholder:font-normal focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-11 px-5 rounded-xl bg-[#0066F9] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-extrabold shrink-0 transition"
        >
          {loading ? "확인 중..." : "단체코드로 바로 신청 →"}
        </button>
      </div>
    </form>
  );
}
