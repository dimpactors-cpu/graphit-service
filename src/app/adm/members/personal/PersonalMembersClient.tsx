'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';

export interface PersonalMemberSummary {
  mb_no: number;
  mb_id: string;
  mb_name: string;
  mb_hp: string;
  mb_sex: string;
  mb_birth: string;
  mb_datetime: string;
  mb_leave_date: string;
  group_code: string;
  test_count: number;
  completed_count: number;
}

export default function PersonalMembersClient({
  members,
}: {
  members: PersonalMemberSummary[];
}) {
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PERSONAL' | 'GROUP_STUDENT'>('ALL');

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (filterType === 'PERSONAL' && m.group_code) return false;
      if (filterType === 'GROUP_STUDENT' && !m.group_code) return false;
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        return (
          m.mb_id.toLowerCase().includes(kw) ||
          m.mb_name.toLowerCase().includes(kw) ||
          (m.mb_hp || '').toLowerCase().includes(kw) ||
          (m.group_code || '').toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [members, filterType, keyword]);

  return (
    <AdminLayout
      title="개인회원 관리 (수강생 명단)"
      subtitle="일반 개인회원 및 단체코드로 가입·신청한 수강생 회원 정보를 조회하고 수정합니다."
      actions={
        <a
          href="/api/admin/excel?type=member"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
        >
          📥 개인회원 엑셀 다운로드 (.xls)
        </a>
      }
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'ALL', label: `전체 (${members.length})` },
              { id: 'PERSONAL', label: '일반 개인회원' },
              { id: 'GROUP_STUDENT', label: '단체코드 소속 수강생' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="이름, 아이디(이메일), 연락처, 단체코드 검색"
          className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs w-full sm:w-72 focus:border-indigo-600 focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="py-3.5 px-4 text-center w-16">번호</th>
                <th className="py-3.5 px-4">아이디 (이메일)</th>
                <th className="py-3.5 px-4">이름</th>
                <th className="py-3.5 px-4">연락처</th>
                <th className="py-3.5 px-4 text-center">성별 / 생년</th>
                <th className="py-3.5 px-4">소속 단체코드</th>
                <th className="py-3.5 px-4 text-center">검사신청/완료</th>
                <th className="py-3.5 px-4">가입일시</th>
                <th className="py-3.5 px-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    조회된 회원이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.mb_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                      {m.mb_no}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {m.mb_id}
                      {m.mb_leave_date && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                          탈퇴
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {m.mb_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{m.mb_hp || '-'}</td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-600">
                      {m.mb_sex || '-'} / {m.mb_birth || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.group_code ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-bold">
                          {m.group_code}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">일반개인</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-bold">
                      <span className="text-indigo-600">{m.test_count}건</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-emerald-600">완료 {m.completed_count}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {(m.mb_datetime || '').slice(0, 16)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/adm/members/personal/${encodeURIComponent(m.mb_id)}`}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-xs font-bold text-slate-700 transition"
                      >
                        상세/수정
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
