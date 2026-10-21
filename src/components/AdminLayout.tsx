'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/adm', label: '대시보드', exact: true },
  { href: '/adm/tests', label: '수강생 검사현황' },
  { href: '/adm/members/personal', label: '개인회원' },
  { href: '/adm/members/groups', label: '단체관리 (단체코드)' },
  { href: '/adm/questions', label: '문항관리' },
  { href: '/adm/checkups', label: '검사관리' },
  { href: '/adm/orders', label: '주문내역' },
  { href: '/adm/banners', label: '배너·로고 설정' },
  { href: '/adm/db-sync', label: '클라우드 DB 연동' },
];

export default function AdminLayout({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/adm" className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-extrabold tracking-wider">
                  ADMIN
                </span>
                <span className="text-lg font-extrabold tracking-tight text-white">
                  그래프잇 관리자 센터
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                사이트 홈으로 ↗
              </Link>
              <Link
                href="/mypage"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                마이페이지
              </Link>
              <a
                href="/api/auth/logout"
                className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 transition"
              >
                로그아웃
              </a>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-2 pt-1 no-scrollbar border-t border-slate-800">
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              {title && (
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
