'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import GraphmeReportView from '@/components/GraphmeReportView';
import BulkPdfDownloadModal from '@/components/BulkPdfDownloadModal';
import type { ResultBaseRow, StudentReportData } from '@/lib/reportEngine';

export interface StudentTestRecord {
  test_no: number;
  od_id: string;
  mb_id: string;
  mb_name: string;
  mb_hp: string;
  mb_sex: string;
  mb_birth: string;
  it_id: string;
  it_name: string;
  group_code: string;
  group_name: string;
  test_status: string;
  test_datetime: string;
  end_datetime: string;
  totalQuestions: number;
  answeredQuestions: number;
  progressPercent: number;
  answers: Array<{
    item_seq: number;
    qa_no: number;
    qa_code: string;
    qa_type: string;
    qa_subject: string;
    raw_answer: string;
    display_answer: string;
    reg_datetime: string;
  }>;
  resultRow?: ResultBaseRow;
  report?: StudentReportData;
}

interface AdminTestsClientProps {
  records: StudentTestRecord[];
  groupCodes: Array<{ code: string; name: string }>;
  items: Array<{ it_id: string; it_name: string }>;
}

export default function AdminTestsClient({
  records,
  groupCodes,
  items,
}: AdminTestsClientProps) {
  const [viewMode, setViewMode] = useState<'list' | 'result_db'>('list');
  const [dbColGroup, setDbColGroup] = useState<'summary' | 'competency' | 'direction' | 'ability' | 'roadmap_aq'>('summary');
  const [statusFilter, setStatusFilter] = useState<'ALL' | '완료' | '진행중' | '시작전'>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [itemFilter, setItemFilter] = useState<string>('ALL');
  const [keyword, setKeyword] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<StudentTestRecord | null>(null);
  const [reportModalRecord, setReportModalRecord] = useState<StudentTestRecord | null>(null);
  const [showBulkPdfModal, setShowBulkPdfModal] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 50;

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (viewMode === 'result_db' && !r.resultRow) return false;
      if (statusFilter !== 'ALL' && r.test_status !== statusFilter) return false;
      if (groupFilter === 'PERSONAL' && r.group_code) return false;
      if (groupFilter !== 'ALL' && groupFilter !== 'PERSONAL' && r.group_code !== groupFilter) {
        return false;
      }
      if (itemFilter !== 'ALL' && r.it_id !== itemFilter) return false;
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        const match =
          r.mb_name.toLowerCase().includes(kw) ||
          r.mb_id.toLowerCase().includes(kw) ||
          r.mb_hp.toLowerCase().includes(kw) ||
          r.group_code.toLowerCase().includes(kw) ||
          r.group_name.toLowerCase().includes(kw) ||
          r.od_id.toLowerCase().includes(kw) ||
          (r.resultRow?.total_lit_type || '').toLowerCase().includes(kw);
        if (!match) return false;
      }
      return true;
    });
  }, [records, viewMode, statusFilter, groupFilter, itemFilter, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const resultDbExportUrl = useMemo(() => {
    const params = new URLSearchParams({ type: 'result_db' });
    if (groupFilter !== 'ALL' && groupFilter !== 'PERSONAL') {
      params.set('group_code', groupFilter);
    }
    if (itemFilter !== 'ALL') {
      params.set('it_id', itemFilter);
    }
    if (keyword.trim()) {
      params.set('stx', keyword.trim());
    }
    return `/api/admin/excel?${params.toString()}`;
  }, [groupFilter, itemFilter, keyword]);

  return (
    <AdminLayout
      title="수강생 검사 신청이력 · 결과DB 및 결과지 관리"
      subtitle="전체 수강생의 검사 신청 내역, 문항별 응답, AL 데이터셋 기반 결과DB(result_base_set) 산출 및 4페이지 결과지를 통합 관리합니다."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBulkPdfModal(true)}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold shadow-sm transition"
          >
            📦 수강생 PDF 결과지 일괄다운로드
          </button>
          <a
            href={`${resultDbExportUrl}&format=xls`}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition"
          >
            📊 결과DB 엑셀 다운로드 (.xls)
          </a>
          <a
            href={`${resultDbExportUrl}&format=csv`}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold shadow-sm transition"
          >
            📄 결과DB CSV (result_base_set.csv)
          </a>
          <a
            href={`/api/admin/excel?type=test&stx=${encodeURIComponent(
              groupFilter !== 'ALL' && groupFilter !== 'PERSONAL' ? groupFilter : keyword
            )}`}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
          >
            📥 응시내역+지표 엑셀 다운로드 (.xls)
          </a>
        </div>
      }
    >
      <div className="print:hidden">
      {/* Top View Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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
            📋 응시이력 및 결과지 생성기
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('result_db');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition ${
              viewMode === 'result_db'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗄️ 결과 DB (result_base_set) 산출 테이블
          </button>
        </div>

        {viewMode === 'result_db' && (
          <div className="inline-flex flex-wrap rounded-xl bg-white border border-slate-200 p-1 gap-1 text-xs font-bold">
            {[
              { key: 'summary', label: '1. 유형 · 방향성 · 진로 · AQ 요약' },
              { key: 'competency', label: '2. 15대 성과역량 (정보처리~관계대응)' },
              { key: 'direction', label: '3. 성향 지표 (seL~obJ)' },
              { key: 'ability', label: '4. 16대 기초역량 (kwD~dcS)' },
              { key: 'roadmap_aq', label: '5. 학습비율(motive~space) · AQ성취지수' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDbColGroup(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  dbColGroup === tab.key
                    ? 'bg-slate-900 text-white font-extrabold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 space-y-4">
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
                {st === 'ALL' ? `전체 (${records.length})` : st}
              </button>
            ))}
          </div>

          <div className="text-xs font-bold text-slate-500">
            조회된 수강생: <strong className="text-indigo-600">{filtered.length}</strong>명
            {totalPages > 1 && ` (페이지 ${currentPage} / ${totalPages})`}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              단체코드 필터
            </label>
            <select
              value={groupFilter}
              onChange={(e) => {
                setGroupFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800"
            >
              <option value="ALL">전체 (단체 + 개인)</option>
              <option value="PERSONAL">개인 일반신청 (단체코드 없음)</option>
              {groupCodes.map((g) => (
                <option key={g.code} value={g.code}>
                  [{g.code}] {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              검사 프로그램 필터
            </label>
            <select
              value={itemFilter}
              onChange={(e) => {
                setItemFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800"
            >
              <option value="ALL">모든 검사 프로그램</option>
              {items.map((it) => (
                <option key={it.it_id} value={it.it_id}>
                  {it.it_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              통합 검색 (이름 / 아이디 / 단체명 / 주문번호 / 유형)
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              placeholder="예: 김소진, 전소윤, 차의과학대, 참고형..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-indigo-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: 응시이력 및 결과지 관리 ================= */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                  <th className="py-3.5 px-4 text-center w-14">번호</th>
                  <th className="py-3.5 px-4">단체명 / 단체코드</th>
                  <th className="py-3.5 px-4">수강생 정보</th>
                  <th className="py-3.5 px-4">검사 프로그램</th>
                  <th className="py-3.5 px-4 text-center">진단 유형 (통합)</th>
                  <th className="py-3.5 px-4 text-center">진행률</th>
                  <th className="py-3.5 px-4 text-center">상태</th>
                  <th className="py-3.5 px-4">응시 일시</th>
                  <th className="py-3.5 px-4 text-center">결과지 · 응답 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      검색 조건에 해당하는 수강생 신청이력이 없습니다.
                    </td>
                  </tr>
                ) : (
                  pagedRecords.map((r) => (
                    <tr key={r.test_no} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                        {r.test_no}
                      </td>
                      <td className="py-3.5 px-4">
                        {r.group_code ? (
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-extrabold">
                              {r.group_code}
                            </span>
                            <div className="text-xs text-slate-500 mt-0.5 font-medium">
                              {r.group_name || '-'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">개인신청</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{r.mb_name}</div>
                        <div className="text-xs text-slate-500">{r.mb_id}</div>
                        <div className="text-[11px] text-slate-400">{r.mb_hp || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{r.it_name}</div>
                        {r.od_id && (
                          <div className="text-[11px] font-mono text-slate-400">
                            주문번호: {r.od_id}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {r.resultRow ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-extrabold">
                              {r.resultRow.total_lit_type}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              측정:{r.resultRow.lit_type} / 자가:{r.resultRow.surv_lit_type}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-slate-700">
                            {r.progressPercent}% ({r.answeredQuestions}/{r.totalQuestions})
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
                              style={{ width: `${Math.min(100, r.progressPercent)}%` }}
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
                        {r.end_datetime && !r.end_datetime.startsWith('0000') && (
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

      {/* ================= VIEW 2: 결과 DB (result_base_set) 산출 테이블 ================= */}
      {viewMode === 'result_db' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-3 px-3 text-center">연번</th>
                  <th className="py-3 px-3">주문번호</th>
                  <th className="py-3 px-3">단체명</th>
                  <th className="py-3 px-3">아이디</th>
                  <th className="py-3 px-3">이름</th>
                  <th className="py-3 px-3 text-center">결과지</th>

                  {dbColGroup === 'summary' && (
                    <>
                      <th className="py-3 px-3 text-center bg-indigo-900">lit_type</th>
                      <th className="py-3 px-3 text-center bg-indigo-900">surv_lit_type</th>
                      <th className="py-3 px-3 text-center bg-indigo-800">total_lit_type</th>
                      <th className="py-3 px-3 text-right">자아일치도</th>
                      <th className="py-3 px-3 text-right">자기평가정도</th>
                      <th className="py-3 px-3 text-center">관계 (점수)</th>
                      <th className="py-3 px-3 text-center">에너지 (점수)</th>
                      <th className="py-3 px-3 text-center">시간 (점수)</th>
                      <th className="py-3 px-3 text-center">전략 (점수)</th>
                      <th className="py-3 px-3 text-center">갈등 (점수)</th>
                      <th className="py-3 px-3 text-right bg-emerald-900">진로_취업</th>
                      <th className="py-3 px-3 text-right bg-emerald-900">진로_창업</th>
                      <th className="py-3 px-3 text-right bg-emerald-900">진로_연구</th>
                      <th className="py-3 px-3 text-center bg-amber-900">aq_group (1,2순위)</th>
                    </>
                  )}

                  {dbColGroup === 'competency' && (
                    <>
                      {[
                        '정보처리', '전제추론', '성장추구',
                        '목적이해', '맥락파악', '동시처리',
                        '위험관리', '변화관리', '과정관리',
                        '수용능력', '비판능력', '활용능력',
                        '타인이해', '자기성찰', '관계대응',
                      ].map((c) => (
                        <th key={c} className="py-3 px-2.5 text-right bg-slate-800">
                          {c}
                        </th>
                      ))}
                    </>
                  )}

                  {dbColGroup === 'direction' && (
                    <>
                      {['seL', 'foC', 'skI', 'reL', 'obJ'].map((h) => (
                        <th key={h} className="py-3 px-2.5 text-right bg-indigo-950">
                          {h}
                        </th>
                      ))}
                      {['surv_seL', 'surv_foC', 'surv_skI', 'surv_reL', 'surv_obJ'].map((h) => (
                        <th key={h} className="py-3 px-2.5 text-right bg-slate-800">
                          {h}
                        </th>
                      ))}
                      {['total_seL', 'total_foC', 'total_skI', 'total_reL', 'total_obJ'].map((h) => (
                        <th key={h} className="py-3 px-2.5 text-right bg-emerald-950">
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
                        'kwD', 'suM', 'coL', 'jdG',
                        'cpR', 'apP', 'frM', 'prM',
                        'stU', 'seT', 'cpS', 'erR',
                        'inF', 'rbD', 'mmM', 'dcS',
                      ].map((c) => (
                        <th key={c} className="py-3 px-2.5 text-right bg-slate-800">
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
                        <th key={col.k} className="py-3 px-2.5 text-right bg-indigo-950">
                          {col.l}
                        </th>
                      ))}
                      <th className="py-3 px-2.5 text-center bg-amber-900">aq_group</th>
                      <th className="py-3 px-2.5 text-center bg-amber-900">aq_max_1</th>
                      <th className="py-3 px-2.5 text-center bg-amber-900">aq_max_2</th>
                      {[
                        'aq_logic',
                        'aq_social',
                        'aq_practical',
                        'aq_principle',
                        'aq_creative',
                      ].map((col) => (
                        <th key={col} className="py-3 px-2.5 text-right bg-slate-800">
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
                    <tr key={r.test_no} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                        {dbRow.seq}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {dbRow.od_id || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {dbRow.group_name || '-'}
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
                            <span className="font-extrabold">{dbRow.aq_group}</span>{' '}
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
                              '정보처리', '전제추론', '성장추구',
                              '목적이해', '맥락파악', '동시처리',
                              '위험관리', '변화관리', '과정관리',
                              '수용능력', '비판능력', '활용능력',
                              '타인이해', '자기성찰', '관계대응',
                            ] as const
                          ).map((c) => (
                            <td key={c} className="py-2.5 px-2.5 text-right font-mono">
                              {dbRow[c].toFixed(2)}
                            </td>
                          ))}
                        </>
                      )}

                      {dbColGroup === 'direction' && (
                        <>
                          {(['seL', 'foC', 'skI', 'reL', 'obJ'] as const).map((h) => (
                            <td key={h} className="py-2.5 px-2.5 text-right font-mono bg-indigo-50/30">
                              {dbRow[h].toFixed(1)}
                            </td>
                          ))}
                          {(['surv_seL', 'surv_foC', 'surv_skI', 'surv_reL', 'surv_obJ'] as const).map((h) => (
                            <td key={h} className="py-2.5 px-2.5 text-right font-mono">
                              {dbRow[h].toFixed(1)}
                            </td>
                          ))}
                          {(['total_seL', 'total_foC', 'total_skI', 'total_reL', 'total_obJ'] as const).map((h) => (
                            <td key={h} className="py-2.5 px-2.5 text-right font-mono font-bold bg-emerald-50/30">
                              {dbRow[h].toFixed(1)}
                            </td>
                          ))}
                          <td className="py-2.5 px-2.5 text-right font-mono">{dbRow.ENT.toFixed(2)}</td>
                          <td className="py-2.5 px-2.5 text-right font-mono">{dbRow.MJR.toFixed(2)}</td>
                          <td className="py-2.5 px-2.5 text-right font-mono">{dbRow.BEL.toFixed(2)}</td>
                          <td className="py-2.5 px-2.5 text-right font-mono">{dbRow.CPR.toFixed(2)}</td>
                        </>
                      )}

                      {dbColGroup === 'ability' && (
                        <>
                          {(
                            [
                              'kwD', 'suM', 'coL', 'jdG',
                              'cpR', 'apP', 'frM', 'prM',
                              'stU', 'seT', 'cpS', 'erR',
                              'inF', 'rbD', 'mmM', 'dcS',
                            ] as const
                          ).map((c) => (
                            <td key={c} className="py-2.5 px-2.5 text-right font-mono">
                              <span className="font-bold text-slate-900">{dbRow[c].toFixed(1)}</span>{' '}
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
                            <td key={k} className="py-2.5 px-2.5 text-right font-mono bg-indigo-50/30">
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
                            <td key={k} className="py-2.5 px-2.5 text-right font-mono">
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

      {/* Pagination */}
      {totalPages > 1 && (
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

      {/* Modal for 4-Page Student Report (결과지 생성기) */}
      {reportModalRecord && reportModalRecord.report && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 print:static print:bg-white print:p-0 print:overflow-visible">
          <div className="max-w-6xl mx-auto print:max-w-none">
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

            <div className="bg-slate-100 p-4 sm:p-6 rounded-b-2xl print:bg-white print:p-0">
              <GraphmeReportView
                report={reportModalRecord.report}
                resultRow={reportModalRecord.resultRow}
                canViewRawDb
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
                      <th className="py-2.5 px-3 w-24 text-center">응답/채점값</th>
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
        groupTitle={
          groupFilter !== 'ALL' && groupFilter !== 'PERSONAL'
            ? `그래프미_${groupFilter}`
            : '그래프미_수강생'
        }
      />
    </AdminLayout>
  );
}
