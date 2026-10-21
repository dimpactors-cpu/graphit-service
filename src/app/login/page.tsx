"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("url") || "/mypage";

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
      } else {
        router.push(redirectUrl);
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "오류가 발생했습니다.");
      setLoading(false);
    }
  }

  async function handleDemoLogin(targetId: string, goTo?: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mb_id: targetId, demoBypass: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "로그인에 실패했습니다.");
        setLoading(false);
        return;
      }
      router.push(goTo || redirectUrl);
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
              <Link href="/register" className="font-bold text-[#0066F9] hover:underline">
                회원가입하기 →
              </Link>
            </div>
          </div>

          {/* 권한별 원클릭 테스트 로그인 패널 (백업 DB 실제 계정 연동) */}
          <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0066F9] uppercase tracking-wider">
                권한별 빠른 접속 (SQL 백업 실제 계정)
              </span>
              <span className="text-[11px] bg-blue-50 text-[#0066F9] px-2 py-0.5 rounded font-medium">
                원클릭 체험
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              기존 그누보드5 DB 백업(`20240516_slwlab_DB_Backup.sql`)에 저장된 권한별 실제 계정으로 즉시 접속하여 기능을 확인하실 수 있습니다.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("admin", "/adm")}
                className="w-full text-left px-3.5 py-2.5 rounded-lg border border-gray-200 hover:border-[#e14d64] hover:bg-red-50/40 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    1. 최고관리자 (<code className="text-[#e14d64]">admin</code> · 레벨 10)
                  </div>
                  <div className="text-[11px] text-gray-500">
                    전체 수강생 신청/검사현황 조회, 개인/단체관리, 문항/검사관리, 엑셀 다운로드
                  </div>
                </div>
                <span className="text-xs font-bold text-[#e14d64] shrink-0 ml-2">관리자 접속 →</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("cau001", "/mypage")}
                className="w-full text-left px-3.5 py-2.5 rounded-lg border border-gray-200 hover:border-indigo-600 hover:bg-indigo-50/40 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    2. 단체회원 - 중앙대학교 (<code className="text-indigo-600">cau001</code> · 레벨 3)
                  </div>
                  <div className="text-[11px] text-gray-500">
                    단체코드(METACAU2403 등) 신청인원·미등록·시작전·진행중·검사완료 실시간 현황 조회
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 shrink-0 ml-2">단체 현황 →</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("group001", "/mypage")}
                className="w-full text-left px-3.5 py-2.5 rounded-lg border border-gray-200 hover:border-indigo-600 hover:bg-indigo-50/40 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    3. 단체회원 - SLW LAB (<code className="text-indigo-600">group001</code> · 레벨 3)
                  </div>
                  <div className="text-[11px] text-gray-500">
                    다중 단체코드(TESTCAU2404, GROUP1207 등) 전환 및 소속 수강생 이력 조회
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 shrink-0 ml-2">단체 현황 →</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("test008@test008.com", "/mypage")}
                className="w-full text-left px-3.5 py-2.5 rounded-lg border border-gray-200 hover:border-[#0066F9] hover:bg-blue-50/40 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    4. 개인회원 - 수강생 (<code className="text-[#0066F9]">test008@test008.com</code> · 레벨 2)
                  </div>
                  <div className="text-[11px] text-gray-500">
                    내 검사내역 조회, 온라인 문항 검사 응시(시작하기/이어서하기), 구매상세내역 확인
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0066F9] shrink-0 ml-2">수강생 접속 →</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
