"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl =
    searchParams.get("url") || searchParams.get("redirect") || "/mypage";

  const [mbId, setMbId] = useState("");
  const [mbPassword, setMbPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mb_id: mbId, mb_password: mbPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "로그인에 실패했습니다.");
        setLoading(false);
        return;
      }
      if (data.user?.mb_level >= 9 && redirectUrl === "/mypage") {
        router.push("/adm");
      } else if (data.user?.mb_level === 3 && redirectUrl === "/mypage") {
        router.push("/group-admin");
      } else {
        router.push(redirectUrl);
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteHeader user={null} />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-[#191919]">로그인</h1>
              <p className="text-sm text-gray-500 mt-1">
                그래프잇(Graphit) 회원 아이디로 로그인해 주세요.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="mb_id" className="block text-xs font-semibold text-gray-700 mb-1">
                  아이디 (또는 이메일)
                </label>
                <input
                  id="mb_id"
                  type="text"
                  required
                  value={mbId}
                  onChange={(e) => setMbId(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="w-full h-11 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0066F9]"
                />
              </div>

              <div>
                <label htmlFor="mb_password" className="block text-xs font-semibold text-gray-700 mb-1">
                  비밀번호
                </label>
                <input
                  id="mb_password"
                  type="password"
                  required
                  value={mbPassword}
                  onChange={(e) => setMbPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full h-11 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0066F9]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#0066F9] hover:bg-[#0052cc] text-white font-bold text-sm rounded transition disabled:opacity-50"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
              <span>아직 회원이 아니신가요?</span>
              <Link
                href={
                  redirectUrl && redirectUrl !== "/mypage"
                    ? `/register?url=${encodeURIComponent(redirectUrl)}`
                    : "/register"
                }
                className="font-bold text-[#0066F9] hover:underline"
              >
                회원가입하기 →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
