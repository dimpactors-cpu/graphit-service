'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import MypageSidebar from '@/components/MypageSidebar';

interface PersonalTestItem {
  test_idx: number;
  it_id: string;
  it_name: string;
  it_basic: string;
  it_img1: string;
  gr_code: string;
  test_status: string;
  regdate: string;
  totalQuestions: number;
  answeredQuestions: number;
  progressPercent: number;
}

interface GroupStudentRow {
  test_idx: number;
  mb_id: string;
  mb_name: string;
  mb_sex: string;
  mb_birth: string;
  mb_1: string;
  mb_hp: string;
  regdate: string;
  test_status: string;
  totalQuestions: number;
  answeredQuestions: number;
  progressPercent: number;
}

interface GroupData {
  gr_idx: number;
  gr_code: string;
  gr_cnt: number;
  sdate: string;
  edate: string;
  it_id: string;
  it_name: string;
  stats: {
    unregistered: number;
    beforeStart: number;
    inProgress: number;
    completed: number;
  };
  students: GroupStudentRow[];
}

interface MypageClientProps {
  member: {
    mb_id: string;
    mb_name: string;
    mb_nick: string;
    mb_level: number;
    mb_1?: string;
    mb_2?: string;
    mb_3?: string;
    mb_email?: string;
    mb_hp?: string;
    mb_tel?: string;
  };
  personalTests: PersonalTestItem[];
  groups: GroupData[];
  initialGroupCode?: string;
}

export default function MypageClient({
  member,
  personalTests,
  groups,
  initialGroupCode,
}: MypageClientProps) {
  const isGroup = member.mb_level === 3;
  const [selectedCode, setSelectedCode] = useState<string>(
    initialGroupCode || groups[0]?.gr_code || ''
  );
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | '시작전' | '진행중' | '완료'>('ALL');
  const [sortBy, setSortBy] = useState<'regdate' | 'name' | 'status'>('regdate');

  const currentGroup = useMemo(() => {
    return groups.find((g) => g.gr_code === selectedCode) || groups[0];
  }, [groups, selectedCode]);

  const filteredStudents = useMemo(() => {
    if (!currentGroup) return [];
    let list = [...currentGroup.students];
    if (statusFilter !== 'ALL') {
      list = list.filter((s) => {
        const computedStatus =
          s.progressPercent >= 100 || s.test_status === '완료'
            ? '완료'
            : s.answeredQuestions > 0 || s.test_status === '진행중'
            ? '진행중'
            : '시작전';
        return computedStatus === statusFilter;
      });
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.mb_name.toLowerCase().includes(kw) ||
          s.mb_id.toLowerCase().includes(kw) ||
          (s.mb_hp || '').toLowerCase().includes(kw)
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'name') return a.mb_name.localeCompare(b.mb_name, 'ko');
      if (sortBy === 'status') return b.progressPercent - a.progressPercent;
      return (b.regdate || '').localeCompare(a.regdate || '');
    });
    return list;
  }, [currentGroup, statusFilter, searchKeyword, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <MypageSidebar
          member={member}
          activeTab="history"
          groups={groups}
          selectedCode={currentGroup?.gr_code}
          onSelectCode={setSelectedCode}
        />

        <div className="flex-1 w-full min-w-0">
          {isGroup ? (
            <div className="space-y-4">
              <div className="bg-indigo-950 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-500 text-[11px] font-extrabold mb-1">
                    학교 · 기관 담당자 전용 기능
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold">
                    수강생 4페이지 결과지 열람·인쇄 및 결과DB 산출 테이블은 「단체관리자 센터」에서 확인하실 수 있습니다.
                  </h2>
                </div>
                <Link
                  href="/group-admin"
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-950 text-xs sm:text-sm font-extrabold shrink-0 transition text-center"
                >
                  📊 단체관리자 전용 페이지로 이동 →
                </Link>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    #상세진행현황
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    선택한 단체코드({currentGroup?.gr_code || '-'})로 신청한 수강생들의 실시간 검사 이력을 조회합니다.
                  </p>
                </div>

                {currentGroup && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold">
                      코드: {currentGroup.gr_code}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                      신청 {currentGroup.students.length} / 정원 {currentGroup.gr_cnt}명
                    </span>
                    <a
                      href={`/api/admin/excel?type=test&stx=${encodeURIComponent(
                        currentGroup.gr_code
                      )}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition"
                    >
                      📥 수강생 결과 엑셀 다운로드
                    </a>
                  </div>
                )}
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between mb-5">
                <div className="flex flex-wrap gap-2">
                  {(['ALL', '시작전', '진행중', '완료'] as const).map((st) => (
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
                      {st === 'ALL' ? '전체보기' : st === '완료' ? '검사완료' : st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'regdate' | 'name' | 'status')}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    <option value="regdate">신청일시순</option>
                    <option value="name">이름순</option>
                    <option value="status">진행률순</option>
                  </select>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="이름, 아이디(이메일), 연락처 검색"
                    className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs w-56 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Student Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                      <th className="py-3.5 px-4 text-center w-14">No.</th>
                      <th className="py-3.5 px-4">아이디 (이메일)</th>
                      <th className="py-3.5 px-4">이름</th>
                      <th className="py-3.5 px-4 text-center">성별</th>
                      <th className="py-3.5 px-4 text-center">출생년도</th>
                      <th className="py-3.5 px-4">학력</th>
                      <th className="py-3.5 px-4">연락처</th>
                      <th className="py-3.5 px-4">신청일시</th>
                      <th className="py-3.5 px-4 text-center">진행률</th>
                      <th className="py-3.5 px-4 text-center">진행상황</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          해당 조건의 수강생 신청 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st, idx) => {
                        const isDone = st.progressPercent >= 100 || st.test_status === '완료';
                        const isInProgress = !isDone && (st.answeredQuestions > 0 || st.test_status === '진행중');
                        return (
                          <tr key={st.test_idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-400">
                              {filteredStudents.length - idx}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-800">{st.mb_id}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">{st.mb_name}</td>
                            <td className="py-3.5 px-4 text-center text-slate-600">
                              {st.mb_sex === 'M' || st.mb_sex === '남' ? '남' : st.mb_sex === 'F' || st.mb_sex === '여' ? '여' : st.mb_sex || '-'}
                            </td>
                            <td className="py-3.5 px-4 text-center text-slate-600">{st.mb_birth || '-'}</td>
                            <td className="py-3.5 px-4 text-xs text-slate-600">{st.mb_1 || '-'}</td>
                            <td className="py-3.5 px-4 text-xs text-slate-600">{st.mb_hp || '-'}</td>
                            <td className="py-3.5 px-4 text-xs text-slate-500">
                              {st.regdate ? st.regdate.slice(0, 16) : '-'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-bold text-slate-700">
                                  {st.progressPercent}% ({st.answeredQuestions}/{st.totalQuestions})
                                </span>
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isDone ? 'bg-emerald-500' : isInProgress ? 'bg-blue-500' : 'bg-slate-300'
                                    }`}
                                    style={{ width: `${Math.min(100, st.progressPercent)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isDone ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                    검사완료
                                  </span>
                                  <Link
                                    href={`/test/result?test_idx=${st.test_idx}`}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition"
                                  >
                                    📊 결과지
                                  </Link>
                                </div>
                              ) : isInProgress ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                  진행중
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                  시작전
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">#검사내역</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    신청하신 검사의 진행 상태를 확인하고 검사를 시작하거나 이어서 진행할 수 있습니다.
                  </p>
                </div>
                <Link
                  href="/"
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                >
                  + 다른 검사 신청하기
                </Link>
              </div>

              {personalTests.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-slate-400 font-medium mb-4">신청하신 검사 내역이 없습니다.</p>
                  <Link
                    href="/"
                    className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition"
                  >
                    검사 프로그램 보러가기
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {personalTests.map((item) => {
                    const isCompleted =
                      item.progressPercent >= 100 || item.test_status === '완료';
                    const isStarted =
                      !isCompleted && (item.answeredQuestions > 0 || item.test_status === '진행중');
                    const imgSrc = item.it_img1
                      ? item.it_img1.startsWith('data:') ||
                        item.it_img1.startsWith('http') ||
                        item.it_img1.startsWith('/')
                        ? item.it_img1
                        : `/data/item/${item.it_img1}`
                      : '/data/common/mobile_logo_img.png';

                    return (
                      <div
                        key={item.test_idx}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 transition bg-slate-50/40"
                      >
                        <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                          <img
                            src={imgSrc}
                            alt={item.it_name}
                            className="w-20 h-20 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {item.gr_code && (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                                  단체코드: {item.gr_code}
                                </span>
                              )}
                              <span className="text-xs text-slate-400">
                                신청일: {item.regdate ? item.regdate.slice(0, 10) : '-'}
                              </span>
                            </div>

                            <Link
                              href={`/mypage/view/${item.it_id}`}
                              className="group inline-flex items-center gap-1.5 text-lg font-extrabold text-slate-900 hover:text-indigo-600 transition"
                            >
                              <span>{item.it_name}</span>
                              <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600">
                                상세내역 &gt;
                              </span>
                            </Link>

                            {/* Progress Bar */}
                            <div className="mt-3 max-w-md">
                              <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-slate-500">
                                  진행 문항: {item.answeredQuestions} / {item.totalQuestions}문항
                                </span>
                                <span className="text-indigo-600 font-bold">
                                  {item.progressPercent}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isCompleted
                                      ? 'bg-emerald-500'
                                      : isStarted
                                      ? 'bg-indigo-600'
                                      : 'bg-slate-400'
                                  }`}
                                  style={{ width: `${Math.min(100, item.progressPercent)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-end shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          {isCompleted ? (
                            <Link
                              href={`/test/result?test_idx=${item.test_idx}`}
                              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition text-center min-w-[140px]"
                            >
                              📊 결과지 보기
                            </Link>
                          ) : isStarted ? (
                            <Link
                              href={`/test?it_id=${item.it_id}&test_idx=${item.test_idx}`}
                              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition text-center min-w-[120px]"
                            >
                              이어서하기
                            </Link>
                          ) : (
                            <Link
                              href={`/test?it_id=${item.it_id}&test_idx=${item.test_idx}`}
                              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition text-center min-w-[120px]"
                            >
                              시작하기
                            </Link>
                          )}
                          <Link
                            href={`/mypage/view/${item.it_id}`}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1"
                          >
                            신청상세보기 →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
