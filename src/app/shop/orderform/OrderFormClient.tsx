"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ShopItemRow, MemberRow } from "@/lib/db";

export default function OrderFormClient({
  item,
  member,
  sampleGroupCodes,
  initialGroupCode = "",
}: {
  item: ShopItemRow;
  member: MemberRow | null;
  sampleGroupCodes: { group_code: string; it_id: string; group_end: string }[];
  initialGroupCode?: string;
}) {
  const router = useRouter();

  const [groupCode, setGroupCode] = useState(initialGroupCode);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifiedGroupName, setVerifiedGroupName] = useState("");
  const [resolvedItId, setResolvedItId] = useState(String(item.it_id));
  const [resolvedItName, setResolvedItName] = useState(item.it_name);
  const [odName, setOdName] = useState(member?.mb_name || "");
  const [odHp, setOdHp] = useState(member?.mb_hp || member?.mb_tel || "");
  const [odEmail, setOdEmail] = useState(member?.mb_email || member?.mb_id || "");
  const [odAddr1, setOdAddr1] = useState(member?.mb_addr1 || "");
  const [odAddr2, setOdAddr2] = useState(member?.mb_addr2 || "");
  const [settleCase, setSettleCase] = useState("무통장");
  const [submitting, setSubmitting] = useState(false);

  const originalPrice = Number(item.it_price || 0);
  const finalPrice = codeVerified ? 0 : originalPrice;

  useEffect(() => {
    if (initialGroupCode && initialGroupCode.trim() && !codeVerified) {
      fetch("/api/group-code/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_code: initialGroupCode.trim(),
          it_id: item.it_id,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.ok && data.result === "ok") {
            setCodeVerified(true);
            setGroupCode(data.group_code);
            setVerifiedGroupName(data.group_name || "");
            if (data.it_id) setResolvedItId(String(data.it_id));
            if (data.it_name) setResolvedItName(data.it_name);
            setSettleCase("무통장");
          }
        })
        .catch(() => {});
    }
  }, [initialGroupCode, item.it_id]);

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
      if (data.it_id) setResolvedItId(String(data.it_id));
      if (data.it_name) setResolvedItName(data.it_name);
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

    if (!codeVerified && !groupCode.trim()) {
      alert("단체코드를 입력하고 인증을 완료해 주세요. 단체코드가 있어야 검사를 신청할 수 있습니다.");
      return;
    }

    setSubmitting(true);
    try {
      let finalGroupCode = codeVerified ? groupCode.trim() : "";
      let submitItId = resolvedItId || String(item.it_id);
      if (!codeVerified) {
        const vRes = await fetch("/api/group-code/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ group_code: groupCode.trim(), it_id: item.it_id }),
        });
        const vData = await vRes.json();
        if (vData.ok && vData.result === "ok") {
          finalGroupCode = vData.group_code;
          if (vData.it_id) submitItId = String(vData.it_id);
          setCodeVerified(true);
        } else {
          alert(vData.message || "유효한 단체코드를 입력 및 인증해 주세요.");
          setSubmitting(false);
          return;
        }
      }

      if (!finalGroupCode) {
        alert("단체코드 인증이 필요합니다.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          it_id: submitItId,
          group_code: finalGroupCode,
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
      window.location.href =
        data.redirect_url ||
        `/test?it_id=${encodeURIComponent(submitItId)}&fresh=1`;
    } catch (err: any) {
      alert(err?.message || "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* 좌측: 신청검사 및 수강생 정보 */}
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
              <h3 className="text-lg font-bold text-gray-900 mt-1">
                {resolvedItName || item.it_name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">대상: {item.it_1}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#191919] border-b pb-3 mb-4">
            신청하시는 분 (수강생 정보)
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
              단체코드 인증 <span className="text-red-600">(필수) *</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={groupCode}
                readOnly={codeVerified}
                onChange={(e) => setGroupCode(e.target.value)}
                placeholder="발급받으신 단체코드를 입력해 주세요."
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
            {codeVerified ? (
              <p className="mt-2 text-xs text-green-700 font-semibold">
                ✓ 단체코드({groupCode}{verifiedGroupName ? ` · ${verifiedGroupName}` : ""}) 인증 완료
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-red-600 font-medium">
                * 단체코드를 입력하고 [인증]을 완료해야 검사를 수행할 수 있습니다.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !codeVerified}
            className="mt-2 w-full py-3.5 bg-[#0066F9] hover:bg-[#0052cc] text-white font-bold text-base rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? "처리 중..."
              : codeVerified
              ? "검사 신청 완료하기"
              : "단체코드 인증 후 신청 가능"}
          </button>
        </div>
      </div>
    </form>
  );
}
