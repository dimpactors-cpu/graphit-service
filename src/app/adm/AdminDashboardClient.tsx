'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';

interface AdminDashboardClientProps {
  stats: {
    totalMembers: number;
    personalMembers: number;
    groupManagers: number;
    totalTests: number;
    completedTests: number;
    inProgressTests: number;
    beforeStartTests: number;
    todayMembers: number;
    todayTests: number;
    totalGroups: number;
    totalQuestions: number;
    totalItems: number;
    isCloudDbConnected: boolean;
  };
  recentTests: Array<{
    test_no: number;
    mb_id: string;
    mb_name: string;
    mb_hp: string;
    it_id: string;
    it_name: string;
    group_code: string;
    group_name: string;
    test_status: string;
    test_datetime: string;
    end_datetime: string | null;
  }>;
  recentGroups: Array<{
    group_no: number;
    group_code: string;
    group_name: string;
    mb_id: string;
    it_name: string;
    group_member: number;
    applied_count: number;
    group_end: string;
  }>;
}

export default function AdminDashboardClient({
  stats,
  recentTests,
  recentGroups,
}: AdminDashboardClientProps) {
  const [frDate, setFrDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [stx, setStx] = useState('');

  const buildExcelUrl = (type: string, extraSfl = '') => {
    const params = new URLSearchParams({ type });
    if (frDate) params.set('fr_date', frDate);
    if (toDate) params.set('to_date', toDate);
    if (extraSfl) params.set('sfl', extraSfl);
    if (stx.trim()) params.set('stx', stx.trim());
    return `/api/admin/excel?${params.toString()}`;
  };

  return (
    <AdminLayout
      title="관리자 대시보드 (DASHBOARD)"
      subtitle="전체 회원 현황, 수강생 검사 신청이력, 단체코드 현황 및 엑셀 데이터 추출을 한눈에 관리합니다."
      actions={
        <Link
          href="/adm/db-sync"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
            stats.isCloudDbConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              stats.isCloudDbConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          {stats.isCloudDbConnected
            ? 'Cloud PostgreSQL 연동됨'
            : '로컬 백업 DB 모드 (클라우드 DB 연동 설정 가능)'}
        </Link>
      }
    >
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">
            총 가입 회원수
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.totalMembers.toLocaleString()}
            <span className="text-sm font-normal text-slate-500 ml-1">명</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>개인 {stats.personalMembers}명 / 단체 {stats.groupManagers}곳</span>
            <span className="text-indigo-600 font-bold">오늘 +{stats.todayTests}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">
            총 수강생 검사신청
          </div>
          <div className="text-3xl font-extrabold text-indigo-600">
            {stats.totalTests.toLocaleString()}
            <span className="text-sm font-normal text-slate-500 ml-1">건</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span className="text-emerald-600 font-bold">완료 {stats.completedTests}</span>
            <span>·</span>
            <span className="text-blue-600 font-bold">진행중 {stats.inProgressTests}</span>
            <span>·</span>
            <span className="text-amber-600 font-bold">시작전 {stats.beforeStartTests}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">
            발급된 단체코드
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.totalGroups.toLocaleString()}
            <span className="text-sm font-normal text-slate-500 ml-1">개</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            단체관리자 계정 {stats.groupManagers}개 운영 중
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">
            등록 문항 및 검사프로그램
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.totalQuestions.toLocaleString()}
            <span className="text-sm font-normal text-slate-500 ml-1">문항</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            검사 프로그램 총 {stats.totalItems}종
          </div>
        </div>
      </div>

      {/* Excel Download Center (Replicating adm/index.php excel1~excel9) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              📊 통합 엑셀 다운로드 센터
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              기간 또는 검색어(단체코드, 이름, 아이디 등)를 지정하여 수강생 검사결과, 개인/단체회원, 문항 데이터를 엑셀(.xls)로 즉시 다운로드합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={frDate}
              onChange={(e) => setFrDate(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
            />
            <span className="text-slate-400 text-xs">~</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
            />
            <input
              type="text"
              value={stx}
              onChange={(e) => setStx(e.target.value)}
              placeholder="단체코드 / 이름 / 아이디 필터"
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs w-48 focus:border-indigo-600 focus:outline-none"
            />
            {(frDate || toDate || stx) && (
              <button
                type="button"
                onClick={() => {
                  setFrDate('');
                  setToDate('');
                  setStx('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <a
            href={buildExcelUrl('test')}
            className="flex flex-col justify-between p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 transition"
          >
            <span className="text-xs font-extrabold text-emerald-800">
              1. 수강생 검사결과 + 문항답변
            </span>
            <span className="text-[11px] text-emerald-600 mt-2 font-semibold">
              📥 엑셀 다운로드 (.xls)
            </span>
          </a>

          <a
            href={buildExcelUrl('group')}
            className="flex flex-col justify-between p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 transition"
          >
            <span className="text-xs font-extrabold text-indigo-800">
              2. 단체코드별 수강생 명단
            </span>
            <span className="text-[11px] text-indigo-600 mt-2 font-semibold">
              📥 엑셀 다운로드 (.xls)
            </span>
          </a>

          <a
            href={buildExcelUrl('member')}
            className="flex flex-col justify-between p-4 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 transition"
          >
            <span className="text-xs font-extrabold text-blue-800">
              3. 개인회원 전체 내역
            </span>
            <span className="text-[11px] text-blue-600 mt-2 font-semibold">
              📥 엑셀 다운로드 (.xls)
            </span>
          </a>

          <a
            href={buildExcelUrl('exam')}
            className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
          >
            <span className="text-xs font-extrabold text-slate-800">
              4. 전체 검사문항 DB (272문항)
            </span>
            <span className="text-[11px] text-slate-600 mt-2 font-semibold">
              📥 엑셀 다운로드 (.xls)
            </span>
          </a>

          <a
            href={buildExcelUrl('item')}
            className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
          >
            <span className="text-xs font-extrabold text-slate-800">
              5. 검사프로그램별 매핑문항
            </span>
            <span className="text-[11px] text-slate-600 mt-2 font-semibold">
              📥 엑셀 다운로드 (.xls)
            </span>
          </a>
        </div>
      </div>

      {/* Two Column Recent Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Student Applications */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-900">
              최근 수강생 검사 신청이력
            </h2>
            <Link
              href="/adm/tests"
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              전체 검사현황 조회 →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
                  <th className="py-2.5 px-3">이름 (아이디)</th>
                  <th className="py-2.5 px-3">검사명</th>
                  <th className="py-2.5 px-3">단체코드</th>
                  <th className="py-2.5 px-3 text-center">상태</th>
                  <th className="py-2.5 px-3">신청일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTests.map((t) => (
                  <tr key={t.test_no} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{t.mb_name}</div>
                      <div className="text-xs text-slate-400">{t.mb_id}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {t.it_name}
                    </td>
                    <td className="py-2.5 px-3">
                      {t.group_code ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-bold">
                          {t.group_code}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">개인신청</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          t.test_status === '완료'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.test_status === '진행중'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.test_status || '시작전'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">
                      {(t.test_datetime || '').slice(0, 16)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Group Codes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-slate-900">
              단체코드 신청 현황
            </h2>
            <Link
              href="/adm/members/groups"
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              단체관리 →
            </Link>
          </div>

          <div className="space-y-3">
            {recentGroups.map((g) => (
              <Link
                key={g.group_no}
                href={`/adm/members/groups/${encodeURIComponent(g.mb_id)}?group_code=${encodeURIComponent(g.group_code)}`}
                className="block p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-xs font-extrabold">
                    {g.group_code}
                  </span>
                  <span className="text-xs font-bold text-indigo-600">
                    신청 {g.applied_count} / {g.group_member}명
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-800 truncate">
                  {g.group_name} ({g.mb_id})
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex justify-between">
                  <span className="truncate max-w-[160px]">{g.it_name}</span>
                  <span>~{g.group_end}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
