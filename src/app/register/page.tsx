"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    mb_id: "",
    mb_password: "",
    mb_password_re: "",
    mb_name: "",
    mb_nick: "",
    mb_email: "",
    mb_sex: "남자",
    mb_birth: "20040101",
    mb_hp: "",
    mb_addr1: "",
    mb_addr2: "",
    mb_mailling: true,
    mb_sms: true,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.mb_password !== form.mb_password_re) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          mb_email: form.mb_email || form.mb_id,
          mb_nick: form.mb_nick || form.mb_name,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "회원가입 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }
      router.push("/mypage");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteHeader user={null} />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-[#191919] mb-1">회원가입</h1>
          <p className="text-sm text-gray-500 mb-6">
            그래프잇 온라인 검사 및 신청이력 조회를 위해 회원정보를 입력해 주세요.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  아이디 (이메일) *
                </label>
                <input
                  type="text"
                  required
                  value={form.mb_id}
                  onChange={(e) => setForm({ ...form, mb_id: e.target.value, mb_email: e.target.value })}
                  placeholder="example@email.com"
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  이름 (실명) *
                </label>
                <input
                  type="text"
                  required
                  value={form.mb_name}
                  onChange={(e) => setForm({ ...form, mb_name: e.target.value, mb_nick: e.target.value })}
                  placeholder="홍길동"
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  비밀번호 *
                </label>
                <input
                  type="password"
                  required
                  value={form.mb_password}
                  onChange={(e) => setForm({ ...form, mb_password: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  비밀번호 확인 *
                </label>
                <input
                  type="password"
                  required
                  value={form.mb_password_re}
                  onChange={(e) => setForm({ ...form, mb_password_re: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  휴대폰번호 *
                </label>
                <input
                  type="text"
                  required
                  value={form.mb_hp}
                  onChange={(e) => setForm({ ...form, mb_hp: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  성별
                </label>
                <select
                  value={form.mb_sex}
                  onChange={(e) => setForm({ ...form, mb_sex: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                >
                  <option value="남자">남자</option>
                  <option value="여자">여자</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  생년월일 (8자리)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={form.mb_birth}
                  onChange={(e) => setForm({ ...form, mb_birth: e.target.value })}
                  placeholder="20040101"
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  기본주소
                </label>
                <input
                  type="text"
                  value={form.mb_addr1}
                  onChange={(e) => setForm({ ...form, mb_addr1: e.target.value })}
                  placeholder="기본주소"
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  상세주소
                </label>
                <input
                  type="text"
                  value={form.mb_addr2}
                  onChange={(e) => setForm({ ...form, mb_addr2: e.target.value })}
                  placeholder="상세주소"
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#0066F9] hover:bg-[#0052cc] text-white font-bold text-sm rounded transition"
              >
                {loading ? "가입 처리 중..." : "회원가입 완료"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
