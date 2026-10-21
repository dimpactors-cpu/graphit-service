'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface MypageSidebarProps {
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
  activeTab?: 'history' | 'profile' | 'faq';
  // Group mode props
  groups?: Array<{
    gr_idx: number;
    gr_code: string;
    gr_cnt: number;
    sdate: string;
    edate: string;
    it_id: string;
    it_name?: string;
    stats: {
      unregistered: number;
      beforeStart: number;
      inProgress: number;
      completed: number;
    };
  }>;
  selectedCode?: string;
  onSelectCode?: (code: string) => void;
}

export default function MypageSidebar({
  member,
  activeTab = 'history',
  groups = [],
  selectedCode,
  onSelectCode,
}: MypageSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isGroup = member.mb_level === 3;

  const selectedGroup = groups.find((g) => g.gr_code === selectedCode) || groups[0];

  const handleLeave = async () => {
    if (!confirm('정말로 회원에서 탈퇴하시겠습니까?\n탈퇴 후에는 동일 계정으로 로그인이 제한됩니다.')) {
      return;
    }
    try {
      const res = await fetch('/api/member/profile', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        alert('회원탈퇴가 처리되었습니다.');
        router.push('/');
        router.refresh();
      } else {
        alert(data.error || '처리 중 오류가 발생했습니다.');
      }
    } catch {
      alert('서버 통신 오류가 발생했습니다.');
    }
  };

  if (isGroup) {
    return (
      <aside className="w-full lg:w-[340px] shrink-0 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full mb-1">
                단체관리자 (Lv.3)
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">단체관리페이지</h2>
            </div>
            <Link
              href="/mypage/profile"
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg px-2.5 py-1.5"
            >
              정보변경
            </Link>
          </div>

          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500 font-medium">단체명</dt>
              <dd className="font-bold text-slate-900">{member.mb_name}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500 font-medium">분류</dt>
              <dd className="font-semibold text-slate-800">{member.mb_3 || '-'}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500 font-medium">사업자번호</dt>
              <dd className="font-semibold text-slate-800">{member.mb_1 || '-'}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500 font-medium">담당자명</dt>
              <dd className="font-semibold text-slate-800">{member.mb_nick || '-'}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <dt className="text-slate-500 font-medium">담당자 이메일</dt>
              <dd className="font-semibold text-slate-800 truncate max-w-[180px]">{member.mb_2 || member.mb_email || '-'}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500 font-medium">연락처</dt>
              <dd className="font-semibold text-slate-800">{member.mb_hp || member.mb_tel || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* Group code selector & status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            단체코드 선택
          </label>
          {groups.length > 0 ? (
            <>
              <select
                value={selectedGroup?.gr_code || ''}
                onChange={(e) => {
                  if (onSelectCode) {
                    onSelectCode(e.target.value);
                  } else {
                    router.push(`/mypage?group_code=${encodeURIComponent(e.target.value)}`);
                  }
                }}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:outline-none mb-4"
              >
                {groups.map((g) => (
                  <option key={g.gr_idx} value={g.gr_code}>
                    {g.gr_code} {g.it_name ? `(${g.it_name})` : ''}
                  </option>
                ))}
              </select>

              {selectedGroup && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-50 p-3.5 text-xs space-y-1.5 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">대상 검사</span>
                      <span className="font-bold text-slate-800">{selectedGroup.it_name || selectedGroup.it_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">유효기간</span>
                      <span className="font-semibold text-slate-700">
                        {selectedGroup.sdate} ~ {selectedGroup.edate}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-sm font-bold text-slate-700">총 신청인원</span>
                      <span className="text-2xl font-extrabold text-indigo-600">
                        {selectedGroup.gr_cnt}
                        <span className="text-sm font-normal text-slate-500 ml-0.5">명</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-center">
                        <div className="text-xs text-slate-500 mb-1">미등록</div>
                        <div className="text-lg font-extrabold text-slate-700">
                          {selectedGroup.stats.unregistered}
                          <span className="text-xs font-normal ml-0.5">명</span>
                        </div>
                      </div>
                      <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-3 text-center">
                        <div className="text-xs text-amber-700 mb-1">시작전</div>
                        <div className="text-lg font-extrabold text-amber-700">
                          {selectedGroup.stats.beforeStart}
                          <span className="text-xs font-normal ml-0.5">명</span>
                        </div>
                      </div>
                      <div className="rounded-xl bg-blue-50/70 border border-blue-200/70 p-3 text-center">
                        <div className="text-xs text-blue-700 mb-1">진행중</div>
                        <div className="text-lg font-extrabold text-blue-700">
                          {selectedGroup.stats.inProgress}
                          <span className="text-xs font-normal ml-0.5">명</span>
                        </div>
                      </div>
                      <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/70 p-3 text-center">
                        <div className="text-xs text-emerald-700 mb-1">검사완료</div>
                        <div className="text-lg font-extrabold text-emerald-700">
                          {selectedGroup.stats.completed}
                          <span className="text-xs font-normal ml-0.5">명</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">등록된 단체코드가 없습니다.</p>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-[260px] shrink-0">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-4">
          <span className="inline-block px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full mb-1">
            개인회원
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">마이페이지</h2>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {member.mb_name} ({member.mb_id})
          </p>
        </div>

        <nav className="space-y-1.5">
          <Link
            href="/mypage"
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition ${
              activeTab === 'history' && pathname?.startsWith('/mypage') && pathname !== '/mypage/profile'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>검사내역</span>
            <span>→</span>
          </Link>
          <Link
            href="/mypage/profile"
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition ${
              activeTab === 'profile' || pathname === '/mypage/profile'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>개인정보변경</span>
            <span>→</span>
          </Link>
          <Link
            href="/bbs/faq"
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition ${
              activeTab === 'faq' || pathname === '/bbs/faq'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>자주하는질문</span>
            <span>→</span>
          </Link>
          <button
            type="button"
            onClick={handleLeave}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition text-left"
          >
            <span>회원탈퇴</span>
            <span>×</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
