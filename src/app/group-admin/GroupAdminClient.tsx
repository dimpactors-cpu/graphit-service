'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GraphmeReportView from '@/components/GraphmeReportView';
import BulkPdfDownloadModal from '@/components/BulkPdfDownloadModal';
import type { StudentTestRecord } from '@/app/adm/tests/AdminTestsClient';

export interface GroupManagerOption {
  mb_id: string;
  group_name: string;
  manager_name: string;
  codes: string[];
}

export interface AuthorizedGroupSummary {
  group_no: number;
  group_code: string;
  group_member: number;
  group_end: string;
  reg_datetime: string;
  it_id: string;
  it_name: string;
  applied_count: number;
  completed_count: number;
  in_progress_count: number;
  before_start_count: number;
}

interface GroupAdminClientProps {
  isSuperAdmin: boolean;
  currentManager: {
    mb_id: string;
    group_name: string;
    manager_name: string;
    mb_hp: string;
    mb_email: string;
    mb_conum: string;
  };
  managerOptions: GroupManagerOption[];
  groups: AuthorizedGroupSummary[];
  records: StudentTestRecord[];
  initialGroupCode?: string;
}

export default function GroupAdminClient({
  isSuperAdmin,
  currentManager,
  managerOptions,
  groups,
  records,
  initialGroupCode,
}: GroupAdminClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'result_db' | 'codes'>('list');
  const [dbColGroup, setDbColGroup] = useState<
    'summary' | 'competency' | 'direction' | 'ability' | 'roadmap_aq'
  >('summary');
  const [groupFilter, setGroupFilter] = useState<string>(
    initialGroupCode || 'ALL'
  );
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | '완료' | '진행중' | '시작전'
  >('ALL');
  const [keyword, setKeyword] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<StudentTestRecord | null>(
    null
  );
  const [reportModalRecord, setReportModalRecord] =
    useState<StudentTestRecord | null>(null);
  const [showBulkPdfModal, setShowBulkPdfModal] = useState<boolean>(false);
  const [checkedTestNos, setCheckedTestNos] = useState<number[]>([]);
  const [page, setPage] = useState<number>(1);
  const pageSize = 50;

  const scopedRecords = useMemo(() => {
    if (groupFilter === 'ALL') return records;
    const gfUpper = groupFilter.trim().toUpperCase();
    return records.filter(
      (r) => r.group_code.trim().toUpperCase() === gfUpper
    );
  }, [records, groupFilter]);

  const kpiStats = useMemo(() => {
    const targetGroups =
      groupFilter === 'ALL'
        ? groups
        : groups.filter(
            (g) =>
              g.group_code.trim().toUpperCase() ===
              groupFilter.trim().toUpperCase()
          );
    const totalQuota = targetGroups.reduce((a, g) => a + g.group_member, 0);
    const totalApplied = scopedRecords.length;
    const completed = scopedRecords.filter(
      (r) => r.test_status === '완료'
    ).length;
    const inProgress = scopedRecords.filter(
      (r) => r.test_status === '진행중'
    ).length;
    const beforeStart = Math.max(0, totalApplied - completed - inProgress);
    const completionRate =
      totalApplied > 0 ? Math.round((completed / totalApplied) * 100) : 0;

    // Top diagnostic types
    const typeCounts = new Map<string, number>();
    for (const r of scopedRecords) {
      const lt = r.resultRow?.total_lit_type;
      if (lt) {
        typeCounts.set(lt, (typeCounts.get(lt) || 0) + 1);
      }
    }
    const topTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      totalQuota,
      totalApplied,
      completed,
      inProgress,
      beforeStart,
      completionRate,
      topTypes,
    };
  }, [groups, scopedRecords, groupFilter]);

  const filtered = useMemo(() => {
    return scopedRecords.filter((r) => {
      if (viewMode === 'result_db' && !r.resultRow) return false;
      if (statusFilter !== 'ALL' && r.test_status !== statusFilter)
        return false;
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        const match =
          r.mb_name.toLowerCase().includes(kw) ||
          r.mb_id.toLowerCase().includes(kw) ||
          r.mb_hp.toLowerCase().includes(kw) ||
          r.group_code.toLowerCase().includes(kw) ||
          r.od_id.toLowerCase().includes(kw) ||
          (r.resultRow?.total_lit_type || '').toLowerCase().includes(kw) ||
          (r.resultRow?.aq_group || '').toLowerCase().includes(kw);
        if (!match) return false;
      }
      return true;
    });
  }, [scopedRecords, viewMode, statusFilter, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Build Excel export URLs scoped to current group filter (or first authorized code)
  const activeExportGroupCode = useMemo(() => {
    if (groupFilter !== 'ALL') return groupFilter;
    if (groups.length === 1) return groups[0].group_code;
    return '';
  }, [groupFilter, groups]);

  const resultDbExportUrl = useMemo(() => {
    const params = new URLSearchParams({ type: 'result_db' });
    if (activeExportGroupCode) {
      params.set('group_code', activeExportGroupCode);
    }
    if (keyword.trim()) {
      params.set('stx', keyword.trim());
    }
    return `/api/admin/excel?${params.toString()}`;
  }, [activeExportGroupCode, keyword]);

  const testExportUrl = useMemo(() => {
    const params = new URLSearchParams({ type: 'test' });
    if (activeExportGroupCode) {
      params.set('group_code', activeExportGroupCode);
    }
    if (keyword.trim()) {
      params.set('stx', keyword.trim());
    }
    return `/api/admin/excel?${params.toString()}`;
  }, [activeExportGroupCode, keyword]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col print:min-h-0 print:bg-white">
      {/* Top Group Admin Header (Hidden in Print) */}
      <header className="print:hidden bg-indigo-950 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between py-3.5 gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500 text-white text-xs font-extrabold tracking-wider">
                GROUP ADMIN
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                    {currentManager.group_name} — 단체관리자 센터
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-200 text-[11px] font-bold">
                    담당자: {currentManager.manager_name || currentManager.mb_id}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-300">
                  소속 수강생 실시간 응시현황 · 결과DB 산출값 · 4페이지 결과지 및 엑셀 다운로드 통합 관리
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {isSuperAdmin && (
                <div className="flex items-center gap-2 bg-indigo-900/90 border border-indigo-700 px-3 py-1.5 rounded-xl">
                  <span className="text-amber-300 font-extrabold text-[11px]">
                    🔑 기관 전환:
                  </span>
                  <select
                    value={currentManager.mb_id}
                    onChange={(e) => {
                      router.push(
                        `/group-admin?mb_id=${encodeURIComponent(e.target.value)}`
                      );
                    }}
                    className="bg-indigo-950 text-white rounded-lg px-2.5 py-1 text-xs font-bold border border-indigo-700 focus:outline-none"
                  >
                    {managerOptions.map((m) => (
                      <option key={m.mb_id} value={m.mb_id}>
                        {m.group_name} ({m.mb_id}) — 코드 {m.codes.length}개
                      </option>
                    ))}
                  </select>
                  <Link
                    href="/adm/members/groups"
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold transition"
                  >
                    통합관리자(/adm) ↗
                  </Link>
                </div>
              )}

              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-indigo-100 transition"
              >
                사이트 홈 ↗
              </Link>
              <Link
                href="/mypage"
                className="px-3 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-indigo-100 transition"
              >
                마이페이지
              </Link>
              <a
                href="/api/auth/logout"
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 transition"
              >
                로그아웃
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 print:p-0 print:max-w-none">
        {/* All dashboard & table content hidden when printing a student report */}
        <div className="print:hidden space-y-6">
          {/* Top Title & Excel Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-extrabold">
                  학교/기관 전용 대시보드
                </span>
                {groups.map((g) => (
                  <button
                    key={g.group_code}
                    type="button"
                    onClick={() => {
                      setGroupFilter(
                        groupFilter === g.group_code ? 'ALL' : g.group_code
                      );
                      setPage(1);
                    }}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold transition ${
                      groupFilter === g.group_code
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    #{g.group_code} ({g.applied_count}명)
                  </button>
                ))}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {currentManager.group_name} 수강생 응시현황 및 진단결과 조회
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBulkPdfModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition"
              >
                📦 수강생 PDF 결과지 일괄다운로드
                {checkedTestNos.length > 0
                  ? ` (선택 ${checkedTestNos.length}명)`
                  : ''}
              </button>
              <a
                href={testExportUrl}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
              >
                📥 수강생 응시결과 엑셀 다운로드 (.xls)
              </a>
            </div>
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                총 신청 인원 / 배정 정원
              </div>
              <div className="text-3xl font-black text-slate-900">
                {kpiStats.totalApplied.toLocaleString()}
                <span className="text-sm font-bold text-slate-400 ml-1">
                  / {kpiStats.totalQuota.toLocaleString()}명
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                담당 단체코드 총{' '}
                <strong className="text-indigo-600">{groups.length}개</strong> 기준
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm">
              <div className="text-xs font-bold text-emerald-600 uppercase mb-1">
                검사 완료 인원 (완료율)
              </div>
              <div className="text-3xl font-black text-emerald-700">
                {kpiStats.completed.toLocaleString()}
                <span className="text-sm font-bold text-emerald-600 ml-1.5">
                  명 ({kpiStats.completionRate}%)
                </span>
              </div>
              <div className="mt-2 w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, kpiStats.completionRate)}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                미완료 현황 (진행중 / 시작전)
              </div>
              <div className="flex items-baseline gap-4 mt-1">
                <div>
                  <span className="text-xs font-bold text-blue-600 mr-1">
                    진행중
                  </span>
                  <span className="text-2xl font-black text-blue-700">
                    {kpiStats.inProgress}명
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-600 mr-1">
                    시작전
                  </span>
                  <span className="text-2xl font-black text-amber-700">
                    {kpiStats.beforeStart}명
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                완료 즉시 결과지 및 결과DB 자동 산출
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1.5">
                주요 통합 진단유형 분포 (Top 4)
              </div>
              {kpiStats.topTypes.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">
                  완료된 진단 데이터가 없습니다.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {kpiStats.topTypes.map(([tName, cnt]) => (
                    <button
                      key={tName}
                      type="button"
                      onClick={() => {
                        setKeyword(keyword === tName ? '' : tName);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                        keyword === tName
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                      }`}
                    >
                      {tName} ({cnt}명)
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-2xl bg-slate-200/80 p-1.5 gap-1">
              <button
                type="button"
                onClick={() => {
                  setViewMode('list');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 수강생 응시현황 및 결과지 ({scopedRecords.length}명)
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('codes');
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                  viewMode === 'codes'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏫 담당 단체코드 및 기관 정보 ({groups.length}개)
              </button>
            </div>
          </div>

          {/* Filter Bar for list and result_db */}
          {viewMode !== 'codes' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {(['ALL', '완료', '진행중', '시작전'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setStatusFilter(st);
                        setPage(1);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                        statusFilter === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'ALL' ? `전체 (${scopedRecords.length})` : st}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-bold text-slate-500">
                  조회된 수강생:{' '}
                  <strong className="text-indigo-600">{filtered.length}</strong>명
                  {totalPages > 1 && ` (페이지 ${currentPage} / ${totalPages})`}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    담당 단체코드 선택
                  </label>
                  <select
                    value={groupFilter}
                    onChange={(e) => {
                      setGroupFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="ALL">
                      전체 담당 단체코드 ({groups.length}개 · 총 {records.length}명)
                    </option>
                    {groups.map((g) => (
                      <option key={g.group_code} value={g.group_code}>
                        [{g.group_code}] {g.it_name} (신청 {g.applied_count} / 완료{' '}
                        {g.completed_count}명)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    수강생 검색 (이름 / 아이디 / 연락처 / 진단유형 / 직무그룹)
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setPage(1);
                    }}
                    placeholder="예: 김소진, 전소윤, 참고형, 조감형, A_list..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* VIEW 1: 수강생 응시현황 및 결과지 */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                      <th className="py-3.5 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={
                            pagedRecords.filter((r) => Boolean(r.report)).length > 0 &&
                            pagedRecords
                              .filter((r) => Boolean(r.report))
                              .every((r) => checkedTestNos.includes(r.test_no))
                          }
                          onChange={(e) => {
                            const pageIds = pagedRecords
                              .filter((r) => Boolean(r.report))
                              .map((r) => r.test_no);
                            if (e.target.checked) {
                              setCheckedTestNos((prev) =>
                                Array.from(new Set([...prev, ...pageIds]))
                              );
                            } else {
                              const set = new Set(pageIds);
                              setCheckedTestNos((prev) =>
                                prev.filter((id) => !set.has(id))
                              );
                            }
                          }}
                          className="rounded text-indigo-600 cursor-pointer"
                          title="현재 페이지 결과지 생성 수강생 전체 선택"
                        />
                      </th>
                      <th className="py-3.5 px-4 text-center w-14">번호</th>
                      <th className="py-3.5 px-4">단체코드</th>
                      <th className="py-3.5 px-4">수강생 정보</th>
                      <th className="py-3.5 px-4">검사 프로그램</th>
                      <th className="py-3.5 px-4 text-center">진단 유형 (통합)</th>
                      <th className="py-3.5 px-4 text-center">AQ 직무그룹</th>
                      <th className="py-3.5 px-4 text-center">진행률</th>
                      <th className="py-3.5 px-4 text-center">상태</th>
                      <th className="py-3.5 px-4">응시 일시</th>
                      <th className="py-3.5 px-4 text-center">결과지 · 응답 조회</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="py-16 text-center text-slate-400"
                        >
                          조회된 수강생 응시 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      pagedRecords.map((r, idx) => (
                        <tr
                          key={r.test_no}
                          className="hover:bg-slate-50/80 transition"
                        >
                          <td className="py-3.5 px-3 text-center">
                            {r.report ? (
                              <input
                                type="checkbox"
                                checked={checkedTestNos.includes(r.test_no)}
                                onChange={() => {
                                  setCheckedTestNos((prev) =>
                                    prev.includes(r.test_no)
                                      ? prev.filter((id) => id !== r.test_no)
                                      : [...prev, r.test_no]
                                  );
                                }}
                                className="rounded text-indigo-600 cursor-pointer"
                              />
                            ) : (
                              <span className="text-slate-300 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-slate-600">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-extrabold">
                              {r.group_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900">
                              {r.mb_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {r.mb_id}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {r.mb_hp || '-'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">
                              {r.it_name}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {r.resultRow ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-extrabold">
                                  {r.resultRow.total_lit_type}
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                  측정:{r.resultRow.lit_type} / 자가:
                                  {r.resultRow.surv_lit_type}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {r.resultRow ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold">
                                  {r.resultRow.aq_group}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5">
                                  {r.resultRow.aq_max_1}/{r.resultRow.aq_max_2}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs font-bold text-slate-700">
                                {r.progressPercent}% ({r.answeredQuestions}/
                                {r.totalQuestions})
                              </span>
                              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    r.test_status === '완료'
                                      ? 'bg-emerald-500'
                                      : r.answeredQuestions > 0
                                      ? 'bg-blue-500'
                                      : 'bg-slate-300'
                                  }`}
                                  style={{
                                    width: `${Math.min(100, r.progressPercent)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                r.test_status === '완료'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.test_status === '진행중'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.test_status || '시작전'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            <div>{(r.test_datetime || '-').slice(0, 16)}</div>
                            {r.end_datetime &&
                              !r.end_datetime.startsWith('0000') && (
                                <div className="text-emerald-700 font-medium">
                                  완료: {r.end_datetime.slice(0, 16)}
                                </div>
                              )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {r.report && (
                                <button
                                  type="button"
                                  onClick={() => setReportModalRecord(r)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-2xs transition"
                                >
                                  📊 결과지 보기
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedRecord(r)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:border-slate-500 text-xs font-bold text-slate-700 transition"
                              >
                                응답 ({r.answers.length})
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: 결과 DB (result_base_set) 산출 테이블 */}
          {viewMode === 'result_db' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="py-3 px-3 text-center">연번</th>
                      <th className="py-3 px-3">단체코드</th>
                      <th className="py-3 px-3">아이디</th>
                      <th className="py-3 px-3">이름</th>
                      <th className="py-3 px-3 text-center">결과지</th>

                      {dbColGroup === 'summary' && (
                        <>
                          <th className="py-3 px-3 text-center bg-indigo-900">
                            lit_type
                          </th>
                          <th className="py-3 px-3 text-center bg-indigo-900">
                            surv_lit_type
                          </th>
                          <th className="py-3 px-3 text-center bg-indigo-800">
                            total_lit_type
                          </th>
                          <th className="py-3 px-3 text-right">자아일치도</th>
                          <th className="py-3 px-3 text-right">자기평가정도</th>
                          <th className="py-3 px-3 text-center">관계 (점수)</th>
                          <th className="py-3 px-3 text-center">에너지 (점수)</th>
                          <th className="py-3 px-3 text-center">시간 (점수)</th>
                          <th className="py-3 px-3 text-center">전략 (점수)</th>
                          <th className="py-3 px-3 text-center">갈등 (점수)</th>
                          <th className="py-3 px-3 text-right bg-emerald-900">
                            진로_취업
                          </th>
                          <th className="py-3 px-3 text-right bg-emerald-900">
                            진로_창업
                          </th>
                          <th className="py-3 px-3 text-right bg-emerald-900">
                            진로_연구
                          </th>
                          <th className="py-3 px-3 text-center bg-amber-900">
                            aq_group (1,2순위)
                          </th>
                        </>
                      )}

                      {dbColGroup === 'competency' && (
                        <>
                          {[
                            '정보처리',
                            '전제추론',
                            '성장추구',
                            '목적이해',
                            '맥락파악',
                            '동시처리',
                            '위험관리',
                            '변화관리',
                            '과정관리',
                            '수용능력',
                            '비판능력',
                            '활용능력',
                            '타인이해',
                            '자기성찰',
                            '관계대응',
                          ].map((c) => (
                            <th
                              key={c}
                              className="py-3 px-2.5 text-right bg-slate-800"
                            >
                              {c}
                            </th>
                          ))}
                        </>
                      )}

                      {dbColGroup === 'direction' && (
                        <>
                          {['seL', 'foC', 'skI', 'reL', 'obJ'].map((h) => (
                            <th
                              key={h}
                              className="py-3 px-2.5 text-right bg-indigo-950"
                            >
                              {h}
                            </th>
                          ))}
                          {[
                            'surv_seL',
                            'surv_foC',
                            'surv_skI',
                            'surv_reL',
                            'surv_obJ',
                          ].map((h) => (
                            <th
                              key={h}
                              className="py-3 px-2.5 text-right bg-slate-800"
                            >
                              {h}
                            </th>
                          ))}
                          {[
                            'total_seL',
                            'total_foC',
                            'total_skI',
                            'total_reL',
                            'total_obJ',
                          ].map((h) => (
                            <th
                              key={h}
                              className="py-3 px-2.5 text-right bg-emerald-950"
                            >
                              {h}
                            </th>
                          ))}
                          <th className="py-3 px-2.5 text-right">ENT</th>
                          <th className="py-3 px-2.5 text-right">MJR</th>
                          <th className="py-3 px-2.5 text-right">BEL</th>
                          <th className="py-3 px-2.5 text-right">CPR</th>
                        </>
                      )}

                      {dbColGroup === 'ability' && (
                        <>
                          {[
                            'kwD',
                            'suM',
                            'coL',
                            'jdG',
                            'cpR',
                            'apP',
                            'frM',
                            'prM',
                            'stU',
                            'seT',
                            'cpS',
                            'erR',
                            'inF',
                            'rbD',
                            'mmM',
                            'dcS',
                          ].map((c) => (
                            <th
                              key={c}
                              className="py-3 px-2.5 text-right bg-slate-800"
                            >
                              {c} (정답률%)
                            </th>
                          ))}
                        </>
                      )}

                      {dbColGroup === 'roadmap_aq' && (
                        <>
                          {[
                            { k: 'motive_A_pct', l: 'motive_A%(성취)' },
                            { k: 'motive_B_pct', l: 'motive_B%(성장)' },
                            { k: 'perception_A_pct', l: 'perception_A%(원리)' },
                            { k: 'perception_B_pct', l: 'perception_B%(직관)' },
                            { k: 'path_A_pct', l: 'path_A%(예습)' },
                            { k: 'path_B_pct', l: 'path_B%(출제자)' },
                            { k: 'path_C_pct', l: 'path_C%(반복)' },
                            { k: 'path_D_pct', l: 'path_D%(복습)' },
                            { k: 'space_A_pct', l: 'space_A%(개방)' },
                            { k: 'space_B_pct', l: 'space_B%(독립)' },
                          ].map((col) => (
                            <th
                              key={col.k}
                              className="py-3 px-2.5 text-right bg-indigo-950"
                            >
                              {col.l}
                            </th>
                          ))}
                          <th className="py-3 px-2.5 text-center bg-amber-900">
                            aq_group
                          </th>
                          <th className="py-3 px-2.5 text-center bg-amber-900">
                            aq_max_1
                          </th>
                          <th className="py-3 px-2.5 text-center bg-amber-900">
                            aq_max_2
                          </th>
                          {[
                            'aq_logic',
                            'aq_social',
                            'aq_practical',
                            'aq_principle',
                            'aq_creative',
                          ].map((col) => (
                            <th
                              key={col}
                              className="py-3 px-2.5 text-right bg-slate-800"
                            >
                              {col}
                            </th>
                          ))}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedRecords.map((r) => {
                      const dbRow = r.resultRow!;
                      return (
                        <tr
                          key={r.test_no}
                          className="hover:bg-slate-50 transition"
                        >
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                            {dbRow.seq}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-indigo-700 font-bold">
                            {dbRow.group_code || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {dbRow.mb_id}
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-slate-900">
                            {dbRow.mb_name}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setReportModalRecord(r)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold"
                            >
                              📊 결과지
                            </button>
                          </td>

                          {dbColGroup === 'summary' && (
                            <>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-700 bg-indigo-50/40">
                                {dbRow.lit_type}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-700 bg-indigo-50/40">
                                {dbRow.surv_lit_type}
                              </td>
                              <td className="py-2.5 px-3 text-center font-black text-indigo-700 bg-indigo-50">
                                {dbRow.total_lit_type}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">
                                {dbRow.자아일치도.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">
                                {dbRow.자기평가정도.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {dbRow.관계} ({dbRow.관계점수.toFixed(1)})
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {dbRow.에너지} ({dbRow.에너지점수.toFixed(1)})
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {dbRow.시간} ({dbRow.시간점수.toFixed(1)})
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {dbRow.전략} ({dbRow.전략점수.toFixed(1)})
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {dbRow.갈등} ({dbRow.갈등점수.toFixed(1)})
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40">
                                {dbRow.진로_취업.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40">
                                {dbRow.진로_창업.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40">
                                {dbRow.진로_연구.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-amber-900 bg-amber-50/40">
                                <span className="font-extrabold">
                                  {dbRow.aq_group}
                                </span>{' '}
                                <span className="text-[10px] text-slate-500">
                                  ({dbRow.aq_max_1}/{dbRow.aq_max_2})
                                </span>
                              </td>
                            </>
                          )}

                          {dbColGroup === 'competency' && (
                            <>
                              {(
                                [
                                  '정보처리',
                                  '전제추론',
                                  '성장추구',
                                  '목적이해',
                                  '맥락파악',
                                  '동시처리',
                                  '위험관리',
                                  '변화관리',
                                  '과정관리',
                                  '수용능력',
                                  '비판능력',
                                  '활용능력',
                                  '타인이해',
                                  '자기성찰',
                                  '관계대응',
                                ] as const
                              ).map((c) => (
                                <td
                                  key={c}
                                  className="py-2.5 px-2.5 text-right font-mono"
                                >
                                  {dbRow[c].toFixed(2)}
                                </td>
                              ))}
                            </>
                          )}

                          {dbColGroup === 'direction' && (
                            <>
                              {(
                                ['seL', 'foC', 'skI', 'reL', 'obJ'] as const
                              ).map((h) => (
                                <td
                                  key={h}
                                  className="py-2.5 px-2.5 text-right font-mono bg-indigo-50/30"
                                >
                                  {dbRow[h].toFixed(1)}
                                </td>
                              ))}
                              {(
                                [
                                  'surv_seL',
                                  'surv_foC',
                                  'surv_skI',
                                  'surv_reL',
                                  'surv_obJ',
                                ] as const
                              ).map((h) => (
                                <td
                                  key={h}
                                  className="py-2.5 px-2.5 text-right font-mono"
                                >
                                  {dbRow[h].toFixed(1)}
                                </td>
                              ))}
                              {(
                                [
                                  'total_seL',
                                  'total_foC',
                                  'total_skI',
                                  'total_reL',
                                  'total_obJ',
                                ] as const
                              ).map((h) => (
                                <td
                                  key={h}
                                  className="py-2.5 px-2.5 text-right font-mono font-bold bg-emerald-50/30"
                                >
                                  {dbRow[h].toFixed(1)}
                                </td>
                              ))}
                              <td className="py-2.5 px-2.5 text-right font-mono">
                                {dbRow.ENT.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-2.5 text-right font-mono">
                                {dbRow.MJR.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-2.5 text-right font-mono">
                                {dbRow.BEL.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-2.5 text-right font-mono">
                                {dbRow.CPR.toFixed(2)}
                              </td>
                            </>
                          )}

                          {dbColGroup === 'ability' && (
                            <>
                              {(
                                [
                                  'kwD',
                                  'suM',
                                  'coL',
                                  'jdG',
                                  'cpR',
                                  'apP',
                                  'frM',
                                  'prM',
                                  'stU',
                                  'seT',
                                  'cpS',
                                  'erR',
                                  'inF',
                                  'rbD',
                                  'mmM',
                                  'dcS',
                                ] as const
                              ).map((c) => (
                                <td
                                  key={c}
                                  className="py-2.5 px-2.5 text-right font-mono"
                                >
                                  <span className="font-bold text-slate-900">
                                    {dbRow[c].toFixed(1)}
                                  </span>{' '}
                                  <span className="text-[10px] text-slate-400">
                                    ({dbRow[`${c}_pct`].toFixed(0)}%)
                                  </span>
                                </td>
                              ))}
                            </>
                          )}

                          {dbColGroup === 'roadmap_aq' && (
                            <>
                              {(
                                [
                                  'motive_A_pct',
                                  'motive_B_pct',
                                  'perception_A_pct',
                                  'perception_B_pct',
                                  'path_A_pct',
                                  'path_B_pct',
                                  'path_C_pct',
                                  'path_D_pct',
                                  'space_A_pct',
                                  'space_B_pct',
                                ] as const
                              ).map((k) => (
                                <td
                                  key={k}
                                  className="py-2.5 px-2.5 text-right font-mono bg-indigo-50/30"
                                >
                                  {dbRow[k].toFixed(0)}%
                                </td>
                              ))}
                              <td className="py-2.5 px-2.5 text-center font-mono font-extrabold text-amber-800 bg-amber-50/50">
                                {dbRow.aq_group}
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-mono text-amber-900">
                                {dbRow.aq_max_1}
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-mono text-amber-900">
                                {dbRow.aq_max_2}
                              </td>
                              {(
                                [
                                  'aq_logic',
                                  'aq_social',
                                  'aq_practical',
                                  'aq_principle',
                                  'aq_creative',
                                ] as const
                              ).map((k) => (
                                <td
                                  key={k}
                                  className="py-2.5 px-2.5 text-right font-mono"
                                >
                                  {dbRow[k].toFixed(1)}
                                </td>
                              ))}
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: 담당 단체코드 및 기관 정보 */}
          {viewMode === 'codes' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                  🏫 기관 및 담당자 계정 정보
                </h2>
                <dl className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <dt className="text-slate-500 font-semibold">담당자 아이디</dt>
                    <dd className="font-mono font-bold text-slate-900">
                      {currentManager.mb_id}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <dt className="text-slate-500 font-semibold">학교 / 기관명</dt>
                    <dd className="font-extrabold text-indigo-900">
                      {currentManager.group_name}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <dt className="text-slate-500 font-semibold">담당자명</dt>
                    <dd className="font-bold text-slate-800">
                      {currentManager.manager_name || '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <dt className="text-slate-500 font-semibold">연락처</dt>
                    <dd className="font-semibold text-slate-700">
                      {currentManager.mb_hp || '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <dt className="text-slate-500 font-semibold">이메일</dt>
                    <dd className="font-semibold text-slate-700">
                      {currentManager.mb_email || '-'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">
                  🔑 부여된 단체코드 현황 ({groups.length}개)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                        <th className="py-3 px-4">단체코드</th>
                        <th className="py-3 px-4">검사 프로그램</th>
                        <th className="py-3 px-4 text-center">신청 / 정원</th>
                        <th className="py-3 px-4 text-center">완료 / 진행중</th>
                        <th className="py-3 px-4">유효기간</th>
                        <th className="py-3 px-4 text-center">바로가기</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groups.map((g) => (
                        <tr key={g.group_code} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-extrabold text-xs">
                              {g.group_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {g.it_name}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            {g.applied_count} / {g.group_member}명
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-emerald-700 font-extrabold">
                              완료 {g.completed_count}
                            </span>
                            <span className="text-slate-300 mx-1">·</span>
                            <span className="text-blue-600 font-bold">
                              진행 {g.in_progress_count}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            ~ {g.group_end}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setGroupFilter(g.group_code);
                                setViewMode('list');
                                setPage(1);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition"
                            >
                              수강생 조회 →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          {viewMode !== 'codes' && totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-40"
              >
                ◀ 이전
              </button>
              <span className="text-xs font-extrabold text-slate-700 px-3">
                {currentPage} / {totalPages} 페이지 (총 {filtered.length}건)
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-40"
              >
                다음 ▶
              </button>
            </div>
          )}
        </div>

        {/* Modal for 4-Page Student Report (Printed cleanly without table chrome) */}
        {reportModalRecord && reportModalRecord.report && (
          <div className="report-print-wrapper fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 print:static print:bg-white print:p-0 print:overflow-visible">
            <div className="report-print-wrapper max-w-6xl mx-auto print:max-w-none">
              <div className="print:hidden flex items-center justify-between bg-slate-900 text-white px-5 py-3.5 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500 text-xs font-extrabold">
                    결과지 생성기
                  </span>
                  <span className="text-sm font-extrabold">
                    {reportModalRecord.mb_name} ({reportModalRecord.mb_id}) —{' '}
                    {reportModalRecord.group_name || reportModalRecord.it_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/test/result?test_idx=${reportModalRecord.test_no}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300 transition"
                  >
                    ↗ 전용 결과지 페이지(새 창)로 열기
                  </Link>
                  <button
                    type="button"
                    onClick={() => setReportModalRecord(null)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-extrabold text-white transition"
                  >
                    ✕ 닫기
                  </button>
                </div>
              </div>

              <div className="report-print-wrapper bg-slate-100 p-4 sm:p-6 rounded-b-2xl print:bg-white print:p-0">
                <GraphmeReportView
                  report={reportModalRecord.report}
                  resultRow={reportModalRecord.resultRow}
                  onClose={() => setReportModalRecord(null)}
                  isModal
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal for Student Question-by-Question Answers */}
        {selectedRecord && (
          <div className="print:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <span className="text-xs font-bold text-indigo-600">
                    수강생 문항별 상세 응답 이력
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {selectedRecord.mb_name} ({selectedRecord.mb_id}) —{' '}
                    {selectedRecord.it_name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRecord.report && (
                    <button
                      type="button"
                      onClick={() => {
                        const rec = selectedRecord;
                        setSelectedRecord(null);
                        setReportModalRecord(rec);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold"
                    >
                      📊 이 학생의 결과지 보기
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {selectedRecord.answers.length === 0 ? (
                  <p className="py-12 text-center text-slate-400">
                    아직 제출된 문항 답변 데이터가 없습니다.
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600">
                        <th className="py-2.5 px-3 w-16 text-center">순번</th>
                        <th className="py-2.5 px-3 w-36">문항코드</th>
                        <th className="py-2.5 px-3">질문 요약</th>
                        <th className="py-2.5 px-3 w-24 text-center">
                          응답/채점값
                        </th>
                        <th className="py-2.5 px-3">응답 내용</th>
                        <th className="py-2.5 px-3 w-36">응답일시</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedRecord.answers.map((ans) => (
                        <tr key={ans.item_seq} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                            No_{ans.item_seq}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs text-slate-600">
                            {ans.qa_code}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 font-medium">
                            {ans.qa_subject}
                          </td>
                          <td className="py-2.5 px-3 text-center font-extrabold text-indigo-600">
                            {ans.raw_answer}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-semibold">
                            {ans.display_answer}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-400">
                            {(ans.reg_datetime || '').slice(0, 19)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bulk PDF Download Modal */}
        <BulkPdfDownloadModal
          isOpen={showBulkPdfModal}
          onClose={() => setShowBulkPdfModal(false)}
          records={filtered}
          preselectedTestNos={checkedTestNos}
          groupTitle={
            groupFilter !== 'ALL'
              ? `${currentManager.group_name}_${groupFilter}`
              : currentManager.group_name
          }
        />
      </main>
    </div>
  );
}
