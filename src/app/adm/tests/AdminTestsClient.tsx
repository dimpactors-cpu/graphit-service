'use client';

import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';

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
  const [statusFilter, setStatusFilter] = useState<'ALL' | '완료' | '진행중' | '시작전'>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [itemFilter, setItemFilter] = useState<string>('ALL');
  const [keyword, setKeyword] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<StudentTestRecord | null>(null);

  const filtered = useMemo(() => {
    return records.filter((r) => {
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
          r.od_id.toLowerCase().includes(kw);
        if (!match) return false;
      }
      return true;
    });
  }, [records, statusFilter, groupFilter, itemFilter, keyword]);

  return (
    <AdminLayout
      title="수강생 검사 신청이력 및 진행현황 조회"
      subtitle="전체 수강생의 검사 신청 내역, 단체코드별 응시 현황, 실시간 진행률 및 문항별 응답 결과를 조회합니다."
      actions={
        <a
          href={`/api/admin/excel?type=test&stx=${encodeURIComponent(
            groupFilter !== 'ALL' && groupFilter !== 'PERSONAL' ? groupFilter : keyword
          )}`}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
        >
          📥 현재 조건 엑셀 다운로드 (.xls)
        </a>
      }
    >
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(['ALL', '완료', '진행중', '시작전'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
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
            조회된 수강생 이력: <strong className="text-indigo-600">{filtered.length}</strong>건
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              단체코드 필터
            </label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
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
              onChange={(e) => setItemFilter(e.target.value)}
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
              통합 검색 (이름 / 아이디 / 연락처 / 단체코드)
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="검색어 입력..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-indigo-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="py-3.5 px-4 text-center w-14">번호</th>
                <th className="py-3.5 px-4">단체명 / 단체코드</th>
                <th className="py-3.5 px-4">수강생 정보</th>
                <th className="py-3.5 px-4">연락처 / 성별·생년</th>
                <th className="py-3.5 px-4">검사 프로그램</th>
                <th className="py-3.5 px-4 text-center">진행률 (응답문항)</th>
                <th className="py-3.5 px-4 text-center">상태</th>
                <th className="py-3.5 px-4">신청일 / 완료일</th>
                <th className="py-3.5 px-4 text-center">문항답변</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    검색 조건에 해당하는 수강생 신청이력이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
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
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>{r.mb_hp || '-'}</div>
                      <div className="text-slate-400">
                        {r.mb_sex || '-'} · {r.mb_birth || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {r.it_name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-slate-700">
                          {r.progressPercent}% ({r.answeredQuestions}/{r.totalQuestions})
                        </span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                      <div>시작: {(r.test_datetime || '-').slice(0, 16)}</div>
                      {r.end_datetime && (
                        <div className="text-emerald-700 font-medium">
                          완료: {r.end_datetime.slice(0, 16)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(r)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-xs font-bold text-slate-700 transition"
                      >
                        응답보기 ({r.answers.length})
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Student Question-by-Question Answers */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
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
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
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
                      <th className="py-2.5 px-3 w-20 text-center">선택번호</th>
                      <th className="py-2.5 px-3">응답 내용</th>
                      <th className="py-2.5 px-3 w-36">응답일시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecord.answers.map((ans) => (
                      <tr key={ans.item_seq} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                          {ans.item_seq}
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
    </AdminLayout>
  );
}
