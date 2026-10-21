"use client";

import { useEffect, useState } from "react";
import type { SiteConfig } from "@/lib/db";

export default function SiteFooter({
  siteConfig,
}: {
  siteConfig?: SiteConfig;
}) {
  const [modalType, setModalType] = useState<
    "privacy" | "terms" | "email" | null
  >(null);
  const [cfg, setCfg] = useState<SiteConfig | null>(siteConfig || null);

  useEffect(() => {
    if (siteConfig) {
      setCfg(siteConfig);
      return;
    }
    fetch("/api/admin/site-config")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d.config) {
          setCfg(d.config);
        }
      })
      .catch(() => {});
  }, [siteConfig]);

  const f = cfg?.footer || {
    company_name: "주식회사 에스엘더블유랩",
    ceo_name: "이용석",
    address: "서울 광진구 용마산로 1길 21, 2층",
    biz_no: "592-86-02423",
    email: "corp@graphit.world",
    tel: "02-6956-0285",
    sales_no: "2023-서울광진-1794",
  };

  return (
    <footer
      id="ft"
      className="mt-auto bg-[#333] text-[#eaeaea] text-xs sm:text-[13px] leading-relaxed"
    >
      <div className="max-w-[1080px] mx-auto px-4 py-10">
        <ul className="flex flex-wrap items-center gap-4 pb-6 text-sm font-normal border-b border-neutral-700 mb-5">
          <li>
            <button
              type="button"
              onClick={() => setModalType("privacy")}
              className="hover:text-white underline-offset-4 hover:underline"
            >
              개인정보처리방침
            </button>
          </li>
          <li className="text-neutral-500">|</li>
          <li>
            <button
              type="button"
              onClick={() => setModalType("terms")}
              className="hover:text-white underline-offset-4 hover:underline"
            >
              서비스이용약관
            </button>
          </li>
          <li className="text-neutral-500">|</li>
          <li>
            <button
              type="button"
              onClick={() => setModalType("email")}
              className="hover:text-white underline-offset-4 hover:underline"
            >
              이메일무단수집거부
            </button>
          </li>
        </ul>

        <div className="space-y-1 text-[#ccc]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-white">{f.company_name}</span>
            <span className="text-neutral-500">|</span>
            <span>대표 : {f.ceo_name}</span>
            <span className="text-neutral-500">|</span>
            <span>주소 : {f.address}</span>
            <span className="text-neutral-500">|</span>
            <span>사업자등록번호 : {f.biz_no}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>E-mail : {f.email}</span>
            <span className="text-neutral-500">|</span>
            <span>전화 : {f.tel}</span>
            <span className="text-neutral-500">|</span>
            <span>통신판매업신고번호 : {f.sales_no}</span>
            <span className="text-neutral-500">|</span>
            <span>
              Copyright &copy; {f.company_name}. All Rights Reserved.
            </span>
          </div>
        </div>
      </div>

      {modalType && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setModalType(null)}
        >
          <div
            className="bg-white text-[#222] rounded-lg max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-base">
                {modalType === "privacy" && "개인정보처리방침"}
                {modalType === "terms" && "서비스이용약관"}
                {modalType === "email" && "이메일무단수집거부"}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-gray-500 hover:text-black text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-sm leading-6 text-gray-700 space-y-2">
              {modalType === "privacy" && (
                <p>
                  {f.company_name}(이하 &lsquo;회사&rsquo;)은 개인정보보호법에
                  따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와
                  관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은
                  처리방침을 두고 있습니다. 수집된 성적 및 진단 응답 데이터는
                  진단 리포트 생성 및 결과 분석 목적으로만 활용됩니다.
                </p>
              )}
              {modalType === "terms" && (
                <p>
                  본 약관은 {f.company_name}이 제공하는 그래프잇(Graphit) 및
                  그래프미(Graphme) 온라인 진단검사 관련 제반 서비스의 이용과
                  관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한
                  사항을 규정함을 목적으로 합니다.
                </p>
              )}
              {modalType === "email" && (
                <p>
                  본 웹사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나
                  그 밖의 기술적 장치를 이용하여 무단으로 수집되는 것을 거부하며,
                  이를 위반시 정보통신망법에 의해 형사처벌됨을 유념하시기
                  바랍니다.
                </p>
              )}
            </div>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="bg-[#2778c4] text-white px-6 py-2 rounded font-medium text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
