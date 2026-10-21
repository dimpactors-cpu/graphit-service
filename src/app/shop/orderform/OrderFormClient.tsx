"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ShopItemRow, MemberRow } from "@/lib/db";

export default function OrderFormClient({
  item,
  member,
  sampleGroupCodes,
}: {
  item: ShopItemRow;
  member: MemberRow | null;
  sampleGroupCodes: { group_code: string; it_id: string; group_end: string }[];
}) {
  const router = useRouter();

  const [groupCode, setGroupCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifiedGroupName, setVerifiedGroupName] = useState("");
  const [odName, setOdName] = useState(member?.mb_name || "");
  const [odHp, setOdHp] = useState(member?.mb_hp || member?.mb_tel || "");
  const [odEmail, setOdEmail] = useState(member?.mb_email || member?.mb_id || "");
  const [odAddr1, setOdAddr1] = useState(member?.mb_addr1 || "");
  const [odAddr2, setOdAddr2] = useState(member?.mb_addr2 || "");
  const [settleCase, setSettleCase] = useState("무통장");
  const [submitting, setSubmitting] = useState(false);

  const originalPrice = Number(item.it_price || 0);
  const finalPrice = codeVerified ? 0 : originalPrice;

  async function handleVerifyCode() {
    if (!groupCode.trim()) {
      alert("단체코드를 입력해주세요.");
      return;
    }

    const res = await fetch("/api/group-code/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_code: groupCode.trim(), it_id: item.it_id }),
    });
    const data = await res.json();
    if (data.ok && data.result === "ok") {
      alert("인증되었습니다.");
      setCodeVerified(true);
      setGroupCode(data.group_code);
      setVerifiedGroupName(data.group_name || "");
      setSettleCase("무통장");
    } else {
      setGroupCode("");
      alert(data.message || "단체코드를 확인해주세요.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!odName.trim()) {
      alert("신청자 성명을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          it_id: item.it_id,
          group_code: codeVerified ? groupCode : "",
          od_name: odName,
          od_hp: odHp,
          od_tel: odHp,
          od_email: odEmail,
          od_addr1: odAddr1,
          od_addr2: odAddr2,
          od_settle_case: settleCase,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.message || "신청 처리 중 오류가 발생했습니다.");
        setSubmitting(false);
        return;
      }
      router.push("/mypage");
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* 좌측: 주문상품 및 신청자 정보 */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#191919] border-b pb-3 mb-4">
            신청 검사 정보
          </h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#0066F9] bg-blue-50 px-2 py-0.5 rounded">
                {item.it_4 || "GRAPHME"}
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-1">{item.it_name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">대상: {item.it_1}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">상품금액</div>
              <div className="text-lg font-bold text-gray-900">
                {originalPrice.toLocaleString()}원
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#191919] border-b pb-3 mb-4">
            주문하시는 분 (수강생 정보)
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  이름 *
                </label>
                <input
                  type="text"
                  required
                  value={odName}
                  onChange={(e) => setOdName(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  휴대폰번호 *
                </label>
                <input
                  type="text"
                  required
                  value={odHp}
                  onChange={(e) => setOdHp(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                E-mail *
              </label>
              <input
                type="email"
                required
                value={odEmail}
                onChange={(e) => setOdEmail(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  기본주소
                </label>
                <input
                  type="text"
                  value={odAddr1}
                  onChange={(e) => setOdAddr1(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  상세주소
                </label>
                <input
                  type="text"
                  value={odAddr2}
                  onChange={(e) => setOdAddr2(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 우측: 단체코드 인증 및 결제 합계 (sod_right 복원) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-[#eceff4] border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
            <label className="block text-xs font-bold text-gray-800 mb-2">
              단체코드 인증
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={groupCode}
                readOnly={codeVerified}
                onChange={(e) => setGroupCode(e.target.value)}
                placeholder="단체이신가요? 코드를 입력해 주세요."
                className={`flex-1 h-10 px-3 border border-gray-300 rounded text-xs ${
                  codeVerified ? "bg-[#cecece] text-gray-800 font-bold" : "bg-white"
                }`}
              />
              {!codeVerified ? (
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  className="px-4 h-10 bg-[#333] hover:bg-black text-white text-xs font-bold rounded shrink-0"
                >
                  인증
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCodeVerified(false);
                    setGroupCode("");
                    setVerifiedGroupName("");
                  }}
                  className="px-3 h-10 bg-gray-500 text-white text-xs font-bold rounded shrink-0"
                >
                  취소
                </button>
              )}
            </div>
            {codeVerified && (
              <p className="mt-2 text-xs text-green-700 font-semibold">
                ✓ 단체코드({groupCode}{verifiedGroupName ? ` · ${verifiedGroupName}` : ""}) 인증 완료 (결제금액 0원)
              </p>
            )}

            {sampleGroupCodes.length > 0 && !codeVerified && (
              <div className="mt-2.5 pt-2 border-t border-gray-100">
                <span className="block text-[11px] text-gray-400 mb-1">
                  등록된 단체코드 클릭 시 자동 입력:
                </span>
                <div className="flex flex-wrap gap-1">
                  {sampleGroupCodes.map((g) => (
                    <button
                      key={g.group_code}
                      type="button"
                      onClick={() => setGroupCode(g.group_code)}
                      className="text-[11px] bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-[#0066F9] px-2 py-0.5 rounded border border-gray-200"
                    >
                      {g.group_code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 금액 요약 */}
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            <div className="grid grid-cols-2 text-center py-3">
              <div className="border-r border-gray-100">
                <span className="block text-xs text-gray-500 font-semibold">주문금액</span>
                <strong className="text-sm text-gray-900">{originalPrice.toLocaleString()}원</strong>
              </div>
              <div>
                <span className="block text-xs text-gray-500 font-semibold">단체할인</span>
                <strong className="text-sm text-[#0066F9]">
                  {codeVerified ? `-${originalPrice.toLocaleString()}원` : "0원"}
                </strong>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">총 결제금액</span>
              <strong id="ct_tot_price" className="text-xl font-extrabold text-[#ff006c]">
                {finalPrice.toLocaleString()}원
              </strong>
            </div>
          </div>

          {/* 결제수단 선택 (단체코드 미인증 시 노출) */}
          {!codeVerified && finalPrice > 0 && (
            <div id="od_pay_sl" className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-xs font-bold text-gray-700 mb-2">결제수단 선택</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {["신용카드", "계좌이체", "가상계좌", "무통장"].map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-2 p-2.5 border rounded cursor-pointer font-medium ${
                      settleCase === method
                        ? "border-[#ff006c] bg-pink-50/30 text-[#ff006c]"
                        : "border-gray-200 text-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="od_settle_case"
                      value={method}
                      checked={settleCase === method}
                      onChange={() => setSettleCase(method)}
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full py-3.5 bg-[#0066F9] hover:bg-[#0052cc] text-white font-bold text-base rounded-lg shadow transition disabled:opacity-50"
          >
            {submitting ? "처리 중..." : "주문 / 검사 신청 완료하기"}
          </button>
        </div>
      </div>
    </form>
  );
}
