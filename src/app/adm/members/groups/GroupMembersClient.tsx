'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export interface GroupManagerSummary {
  mb_no: number;
  mb_id: string;
  group_name: string;
  manager_name: string;
  mb_hp: string;
  mb_tel: string;
  mb_conum: string;
  mb_coemail: string;
  mb_datetime: string;
  codes: Array<{
    group_no: number;
    group_code: string;
    group_member: number;
    applied_count: number;
    completed_count: number;
    group_end: string;
    it_name: string;
  }>;
}

export default function GroupMembersClient({
  groups,
}: {
  groups: GroupManagerSummary[];
}) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add modal state
  const [newId, setNewId] = useState('');
  const [newPassword, setNewPassword] = useState('1234');
  const [newGroupName, setNewGroupName] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [newHp, setNewHp] = useState('');
  const [newConum, setNewConum] = useState('');
  const [newCoemail, setNewCoemail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return groups;
    const kw = keyword.trim().toLowerCase();
    return groups.filter(
      (g) =>
        g.mb_id.toLowerCase().includes(kw) ||
        g.group_name.toLowerCase().includes(kw) ||
        g.manager_name.toLowerCase().includes(kw) ||
        g.codes.some((c) => c.group_code.toLowerCase().includes(kw))
    );
  }, [groups, keyword]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newGroupName.trim()) {
      alert('단체 아이디와 단체명을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mb_id: newId.trim(),
          mb_password: newPassword || '1234',
          mb_name: newGroupName.trim(),
          mb_nick: newManagerName.trim() || newGroupName.trim(),
          mb_8: newGroupName.trim(),
          mb_10: newManagerName.trim(),
          mb_hp: newHp.trim(),
          mb_conum: newConum.trim(),
          mb_coemail: newCoemail.trim(),
          mb_level: 3,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('신규 단체회원 계정이 등록되었습니다.');
        setShowAddModal(false);
        setNewId('');
        setNewGroupName('');
        setNewManagerName('');
        window.location.reload();
      } else {
        alert(data.message || '등록 실패');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="단체관리 및 단체코드 발급"
      subtitle="단체회원(학교/기관/기업) 계정 및 단체코드를 발급·관리하고 단체별 수강생 진행현황을 조회합니다."
      actions={
        <>
          <a
            href="/api/admin/excel?type=group"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
          >
            📥 단체 구성원 엑셀 다운로드 (.xls)
          </a>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition"
          >
            + 신규 단체회원 등록
          </button>
        </>
      }
    >
      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs font-bold text-slate-600">
          등록된 단체기관 총 <strong className="text-indigo-600">{filtered.length}</strong>곳
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="단체명, 단체아이디, 담당자, 단체코드 검색..."
          className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs w-full sm:w-80 focus:border-indigo-600 focus:outline-none"
        />
      </div>

      {/* Group List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="py-3.5 px-4">단체아이디</th>
                <th className="py-3.5 px-4">단체명 (기관/학교)</th>
                <th className="py-3.5 px-4">담당자 / 연락처</th>
                <th className="py-3.5 px-4">사업자번호 / 이메일</th>
                <th className="py-3.5 px-4">발급된 단체코드 (신청/정원)</th>
                <th className="py-3.5 px-4">등록일</th>
                <th className="py-3.5 px-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((g) => (
                <tr key={g.mb_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-4 font-bold text-slate-900">{g.mb_id}</td>
                  <td className="py-4 px-4">
                    <div className="font-extrabold text-indigo-950 text-sm">
                      {g.group_name}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-600">
                    <div className="font-bold text-slate-800">{g.manager_name || '-'}</div>
                    <div>{g.mb_hp || g.mb_tel || '-'}</div>
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-500">
                    <div>{g.mb_conum || '-'}</div>
                    <div>{g.mb_coemail || '-'}</div>
                  </td>
                  <td className="py-4 px-4">
                    {g.codes.length === 0 ? (
                      <span className="text-xs text-slate-400">발급된 코드 없음</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {g.codes.map((c) => (
                          <Link
                            key={c.group_no}
                            href={`/adm/members/groups/${encodeURIComponent(g.mb_id)}?group_code=${encodeURIComponent(c.group_code)}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition"
                          >
                            <span>{c.group_code}</span>
                            <span className="text-[11px] text-indigo-600 font-normal">
                              ({c.applied_count}/{c.group_member}명)
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-500">
                    {(g.mb_datetime || '').slice(0, 10)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Link
                      href={`/adm/members/groups/${encodeURIComponent(g.mb_id)}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition inline-block"
                    >
                      단체코드/수강생 관리 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Group Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">
                신규 단체회원(기관/학교) 등록
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    단체 로그인 아이디 *
                  </label>
                  <input
                    type="text"
                    required
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="예: cau2026"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    초기 비밀번호 *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    단체명 (학교/기관명) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="예: 중앙대학교"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    대표자 / 담당자명
                  </label>
                  <input
                    type="text"
                    value={newManagerName}
                    onChange={(e) => setNewManagerName(e.target.value)}
                    placeholder="예: 홍길동"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    연락처
                  </label>
                  <input
                    type="text"
                    value={newHp}
                    onChange={(e) => setNewHp(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    사업자등록번호
                  </label>
                  <input
                    type="text"
                    value={newConum}
                    onChange={(e) => setNewConum(e.target.value)}
                    placeholder="000-00-00000"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  전자세금계산서 이메일
                </label>
                <input
                  type="email"
                  value={newCoemail}
                  onChange={(e) => setNewCoemail(e.target.value)}
                  placeholder="tax@example.com"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold"
                >
                  {submitting ? '등록 중...' : '단체회원 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
