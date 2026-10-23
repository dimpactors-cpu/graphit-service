"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SessionPayload } from "@/lib/auth";
import type { SiteConfig } from "@/lib/db";

let cachedClientConfig: SiteConfig | null = null;

export default function SiteHeader({
  user,
  siteConfig,
}: {
  user: SessionPayload | null;
  siteConfig?: SiteConfig;
}) {
  const [cfg, setCfg] = useState<SiteConfig | null>(
    siteConfig || cachedClientConfig
  );

  useEffect(() => {
    if (siteConfig) {
      cachedClientConfig = siteConfig;
      setCfg(siteConfig);
      return;
    }
    fetch("/api/admin/site-config")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d.config) {
          cachedClientConfig = d.config;
          setCfg(d.config);
        }
      })
      .catch(() => {});
  }, [siteConfig]);

  const logoSrc = cfg?.logo_url || "/data/common/mobile_logo_img.png";
  const logoWidth = cfg?.logo_width || 152;
  const siteTitle = cfg?.site_title || "그래프잇 메인";

  return (
    <>
      {user && user.mb_level >= 9 && (
        <div className="bg-[#333] text-white text-xs shadow-sm">
          <div className="max-w-[1080px] mx-auto px-4 flex items-center justify-between h-10">
            <span>
              <strong className="text-[#e14d64] font-bold">관리자</strong> (
              {user.mb_name})로 접속하셨습니다.
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/group-admin"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded font-semibold transition"
              >
                단체관리자 센터
              </Link>
              <Link
                href="/adm/banners"
                className="bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded font-semibold transition"
              >
                배너/로고 설정
              </Link>
              <Link
                href="/adm"
                className="bg-[#e14d64] hover:bg-[#c83b52] text-white px-3 py-1.5 rounded font-semibold transition"
              >
                관리자 대시보드 (ADMIN)
              </Link>
            </div>
          </div>
        </div>
      )}

      {user && user.mb_level === 3 && (
        <div className="bg-indigo-950 text-white text-xs shadow-sm">
          <div className="max-w-[1080px] mx-auto px-4 flex items-center justify-between h-10">
            <span>
              <strong className="text-indigo-300 font-bold">
                단체관리자 (학교/기관 담당자)
              </strong>{' '}
              ({user.mb_8 || user.mb_name}) 계정으로 접속하셨습니다.
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/group-admin"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded font-bold transition"
              >
                📊 단체관리자 전용 센터 (응시현황·결과조회)
              </Link>
            </div>
          </div>
        </div>
      )}

      <header className="w-full border-b border-gray-100 bg-white">
        <div id="sidx" className="py-5 flex items-center justify-between">
          <Link href="/" className="inline-block">
            <img
              src={logoSrc}
              alt={siteTitle}
              style={{ width: `${logoWidth}px` }}
              className="max-w-[220px] h-auto object-contain"
            />
          </Link>

          <ul className="flex items-center gap-3 sm:gap-5 text-sm sm:text-base font-medium text-[#222]">
            {user ? (
              <>
                <li className="text-gray-700">
                  <span className="font-semibold text-[#0066F9]">
                    {user.mb_nick || user.mb_name}
                  </span>{" "}
                  님
                  {user.mb_level === 3 && (
                    <span className="ml-1.5 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                      단체회원
                    </span>
                  )}
                </li>
                {user.mb_level === 3 && (
                  <li>
                    <Link
                      href="/group-admin"
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      단체관리자 센터
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    href="/mypage"
                    className="hover:text-[#0066F9] transition"
                  >
                    마이페이지
                  </Link>
                </li>
                {user.mb_level >= 9 && (
                  <li>
                    <Link
                      href="/adm"
                      className="text-[#e14d64] font-semibold hover:underline"
                    >
                      관리자
                    </Link>
                  </li>
                )}
                <li>
                  <a
                    href="/api/auth/logout"
                    className="text-gray-500 hover:text-black transition"
                  >
                    로그아웃
                  </a>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-[#0066F9] transition"
                  >
                    로그인
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-[#0066F9] transition"
                  >
                    회원가입
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mypage"
                    className="hover:text-[#0066F9] transition"
                  >
                    마이페이지
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </header>
    </>
  );
}
