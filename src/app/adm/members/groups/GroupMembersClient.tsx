'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';

export interface ExistingGroupCodeOption {
  group_no: number;
  group_code: string;
  group_member: number;
  applied_count: number;
  completed_count: number;
  group_end: string;
  it_name: string;
  owner_id: string;
}

export interface CandidateMemberOption {
  mb_id: string;
  mb_name: string;
  mb_level: number;
  mb_8: string;
  mb_10: string;
  mb_hp: string;
  mb_7: string;
}

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
  items = [],
  allGroupCodes = [],
  candidateMembers = [],
}: {
  groups: GroupManagerSummary[];
  items?: Array<{ it_id: string; it_name: string }>;
  allGroupCodes?: ExistingGroupCodeOption[];
  candidateMembers?: CandidateMemberOption[];
}) {
  const [keyword, setKeyword] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickCodeModal, setShowQuickCodeModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);

  // Add modal state
  const [newId, setNewId] = useState('');
  const [newPassword, setNewPassword] = useState('1234');
  const [newGroupName, setNewGroupName] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [newHp, setNewHp] = useState('');
  const [newConum, setNewConum] = useState('');
  const [newCoemail, setNewCoemail] = useState('');
  const [initCode, setInitCode] = useState('');
  const [initItId, setInitItId] = useState(items[0]?.it_id || '1698900476');
  const [initQuota, setInitQuota] = useState('30');
  const [initEnd, setInitEnd] = useState('2026-12-31');
  const [newAssignedCodes, setNewAssignedCodes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Grant permission modal state (existing member -> group manager Lv.3)
  const [memberSearch, setMemberSearch] = useState('');
  const [grantMbId, setGrantMbId] = useState('');
  const [grantGroupName, setGrantGroupName] = useState('');
  const [grantManagerName, setGrantManagerName] = useState('');
  const [grantPassword, setGrantPassword] = useState('');
  const [grantCodes, setGrantCodes] = useState<string[]>([]);

  // Quick group code modal state
  const [quickMbId, setQuickMbId] = useState(groups[0]?.mb_id || '');
  const [quickCode, setQuickCode] = useState('');
  const [quickItId, setQuickItId] = useState(items[0]?.it_id || '1698900476');
  const [quickQuota, setQuickQuota] = useState('30');
  const [quickEnd, setQuickEnd] = useState('2026-12-31');

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

  const filteredCandidates = useMemo(() => {
    if (!memberSearch.trim()) return candidateMembers.slice(0, 30);
    const kw = memberSearch.trim().toLowerCase();
    return candidateMembers
      .filter(
        (m) =>
          m.mb_id.toLowerCase().includes(kw) ||
          m.mb_name.toLowerCase().includes(kw) ||
          m.mb_8.toLowerCase().includes(kw)
      )
      .slice(0, 30);
  }, [candidateMembers, memberSearch]);

  const selectCandidateForGrant = (m: CandidateMemberOption) => {
    setGrantMbId(m.mb_id);
    setGrantGroupName(m.mb_8 || m.mb_name);
    setGrantManagerName(m.mb_10 || m.mb_name);
    const ownedCodes = allGroupCodes
      .filter((g) => g.owner_id.toLowerCase() === m.mb_id.toLowerCase())
      .map((g) => g.group_code);
    const savedCodes = String(m.mb_7 || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    setGrantCodes(Array.from(new Set([...ownedCodes, ...savedCodes])));
  };

  const toggleCodeInList = (
    code: string,
    list: string[],
    setter: (v: string[]) => void
  ) => {
    if (list.includes(code)) {
      setter(list.filter((c) => c !== code));
    } else {
      setter([...list, code]);
    }
  };

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
          assigned_group_codes: newAssignedCodes,
          initial_group_code: initCode.trim() || undefined,
          initial_it_id: initItId,
          initial_group_member: Number(initQuota || 30),
          initial_group_end: initEnd,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(
          initCode.trim()
            ? `신규 단체관리자 계정 및 단체코드 [${initCode.trim()}] 가 함께 등록되었습니다.`
            : '신규 단체관리자(학교 담당자) 계정이 등록되었습니다.'
        );
        setShowAddModal(false);
        setNewId('');
        setNewGroupName('');
        setNewManagerName('');
        setInitCode('');
        setNewAssignedCodes([]);
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

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantMbId.trim() || !grantGroupName.trim()) {
      alert('권한을 부여할 회원 아이디와 학교/기관명을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/member', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mb_id: grantMbId.trim(),
          mb_level: 3,
          mb_8: grantGroupName.trim(),
          mb_10: grantManagerName.trim(),
          mb_nick: grantManagerName.trim() || grantGroupName.trim(),
          assigned_group_codes: grantCodes,
          new_password: grantPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(
          `[${grantMbId}] 계정에 단체관리자(학교 담당자, Lv.3) 권한 및 담당 단체코드(${grantCodes.length}개)가 부여되었습니다.`
        );
        setShowGrantModal(false);
        window.location.reload();
      } else {
        alert(data.message || '권한 부여 실패');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMbId || !quickCode.trim() || !quickItId) {
      alert('단체기관과 발급할 단체코드를 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/group-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mb_id: quickMbId,
          group_code: quickCode.trim(),
          it_id: quickItId,
          group_member: Number(quickQuota || 30),
          group_end: quickEnd,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(`단체코드 [${quickCode.trim()}] 가 즉시 발급되었습니다.`);
        setShowQuickCodeModal(false);
        setQuickCode('');
        window.location.reload();
      } else {
        alert(data.message || '단체코드 발급 실패');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="단체관리자(학교 담당자) 계정 권한 및 단체코드 관리"
      subtitle="학교/기관 담당자 계정(Lv.3)을 생성하거나 기존 회원에게 단체관리자 권한 및 담당 단체코드 열람 권한을 부여합니다."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/excel?type=group"
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
          >
            📥 단체 구성원 엑셀 (.xls)
          </a>
          <button
            type="button"
            onClick={() => setShowQuickCodeModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm transition"
          >
            + 빠른 단체코드 발급
          </button>
          <button
            type="button"
            onClick={() => setShowGrantModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-sm transition"
          >
            🔑 기존 회원에게 단체관리자 권한 부여
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition"
          >
            + 신규 학교/단체 담당자 계정 생성
          </button>
        </div>
      }
    >
      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs font-bold text-slate-600">
          등록된 단체관리자(학교/기관 담당자) 계정 총{' '}
          <strong className="text-indigo-600">{filtered.length}</strong>개
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="학교/단체명, 담당자 아이디, 담당자명, 단체코드 검색..."
          className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs w-full sm:w-80 focus:border-indigo-600 focus:outline-none"
        />
      </div>

      {/* Group List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="py-3.5 px-4">담당자 아이디</th>
                <th className="py-3.5 px-4">단체명 (학교/기관)</th>
                <th className="py-3.5 px-4">담당자 / 연락처</th>
                <th className="py-3.5 px-4">담당 단체코드 (신청/정원)</th>
                <th className="py-3.5 px-4">등록일</th>
                <th className="py-3.5 px-4 text-center">
                  학교 담당자 화면 · 권한 관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((g) => (
                <tr key={g.mb_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-4">
                    <div className="font-extrabold text-slate-900 font-mono">
                      {g.mb_id}
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">
                      단체관리자 (Lv.3)
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-extrabold text-indigo-950 text-sm">
                      {g.group_name}
                    </div>
                    {g.mb_coemail && (
                      <div className="text-xs text-slate-400">
                        {g.mb_coemail}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-600">
                    <div className="font-bold text-slate-800">
                      {g.manager_name || '-'}
                    </div>
                    <div>{g.mb_hp || g.mb_tel || '-'}</div>
                  </td>
                  <td className="py-4 px-4">
                    {g.codes.length === 0 ? (
                      <span className="text-xs text-slate-400">
                        배정된 단체코드 없음
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {g.codes.map((c) => (
                          <Link
                            key={c.group_no}
                            href={`/group-admin?mb_id=${encodeURIComponent(
                              g.mb_id
                            )}&group_code=${encodeURIComponent(c.group_code)}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition"
                          >
                            <span>{c.group_code}</span>
                            <span className="text-[11px] text-indigo-600 font-normal">
                              (완료 {c.completed_count}/{c.applied_count}명)
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
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      <Link
                        href={`/group-admin?mb_id=${encodeURIComponent(
                          g.mb_id
                        )}`}
                        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition inline-block shadow-2xs"
                      >
                        📊 단체관리자 페이지 보기
                      </Link>
                      <Link
                        href={`/adm/members/groups/${encodeURIComponent(
                          g.mb_id
                        )}`}
                        className="px-3 py-2 rounded-xl border border-slate-300 hover:border-slate-500 bg-white text-slate-700 text-xs font-bold transition inline-block"
                      >
                        권한·코드 설정 →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Existing Member Group Manager Permission Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="text-xs font-extrabold text-amber-600">
                  계정 권한 부여 (Lv.3 단체관리자 지정)
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  기존 회원에게 학교/기관 단체관리자 권한 및 단체코드 부여
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGrantModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrantPermission} className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <label className="block font-extrabold text-slate-700">
                  1. 대상 회원 검색 및 선택 (또는 아래에 직접 아이디 입력)
                </label>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="이름, 아이디(이메일), 소속기관명으로 회원 검색..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs"
                />
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
                  {filteredCandidates.map((m) => (
                    <button
                      key={m.mb_id}
                      type="button"
                      onClick={() => selectCandidateForGrant(m)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50 transition ${
                        grantMbId === m.mb_id ? 'bg-indigo-50 font-bold' : ''
                      }`}
                    >
                      <div>
                        <span className="font-extrabold text-slate-900">
                          {m.mb_name}
                        </span>{' '}
                        <span className="font-mono text-slate-500">
                          ({m.mb_id})
                        </span>
                        {m.mb_8 && (
                          <span className="ml-2 text-indigo-700 font-semibold">
                            · {m.mb_8}
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                        Lv.{m.mb_level}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    대상 회원 아이디 *
                  </label>
                  <input
                    type="text"
                    required
                    value={grantMbId}
                    onChange={(e) => setGrantMbId(e.target.value)}
                    placeholder="권한을 부여할 회원 아이디"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    비밀번호 재설정 (선택 — 입력 시 변경)
                  </label>
                  <input
                    type="text"
                    value={grantPassword}
                    onChange={(e) => setGrantPassword(e.target.value)}
                    placeholder="유지하려면 비워두세요"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    학교 / 기관명 (단체명) *
                  </label>
                  <input
                    type="text"
                    required
                    value={grantGroupName}
                    onChange={(e) => setGrantGroupName(e.target.value)}
                    placeholder="예: 차의과학대학교, 중앙대학교"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    담당자명 / 부서명
                  </label>
                  <input
                    type="text"
                    value={grantManagerName}
                    onChange={(e) => setGrantManagerName(e.target.value)}
                    placeholder="예: 학생역량개발처 홍길동"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1.5">
                  2. 열람·관리 권한을 부여할 단체코드 선택 (복수 선택 가능)
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50">
                  {allGroupCodes.map((gc) => {
                    const checked = grantCodes.includes(gc.group_code);
                    return (
                      <label
                        key={gc.group_code}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                          checked
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-extrabold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleCodeInList(
                              gc.group_code,
                              grantCodes,
                              setGrantCodes
                            )
                          }
                          className="rounded text-indigo-600"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-mono font-extrabold text-xs">
                            {gc.group_code}{' '}
                            <span className="text-[10px] text-emerald-700 font-bold">
                              (신청 {gc.applied_count}명 / 완료{' '}
                              {gc.completed_count}명)
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {gc.it_name}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold"
                >
                  {submitting
                    ? '권한 부여 중...'
                    : '🔑 단체관리자(Lv.3) 권한 부여 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Group Manager Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="text-xs font-extrabold text-indigo-600">
                  신규 학교/기관 담당자 계정 생성 (Lv.3)
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  신규 단체관리자 계정 등록 및 단체코드 배정
                </h3>
              </div>
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
                    담당자 로그인 아이디 *
                  </label>
                  <input
                    type="text"
                    required
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="예: cha_manager"
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
                    placeholder="예: 차의과학대학교"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    담당자명 / 부서
                  </label>
                  <input
                    type="text"
                    value={newManagerName}
                    onChange={(e) => setNewManagerName(e.target.value)}
                    placeholder="예: 홍길동 담당관"
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
                    담당자 이메일
                  </label>
                  <input
                    type="email"
                    value={newCoemail}
                    onChange={(e) => setNewCoemail(e.target.value)}
                    placeholder="manager@univ.ac.kr"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Assign existing group codes */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  기존 단체코드 열람 권한 배정 (선택)
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-2xl p-2.5 grid grid-cols-2 gap-1.5 bg-slate-50 text-xs">
                  {allGroupCodes.map((gc) => {
                    const checked = newAssignedCodes.includes(gc.group_code);
                    return (
                      <label
                        key={gc.group_code}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                          checked
                            ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-900'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleCodeInList(
                              gc.group_code,
                              newAssignedCodes,
                              setNewAssignedCodes
                            )
                          }
                        />
                        <span className="truncate">
                          {gc.group_code} ({gc.applied_count}명)
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
                <div className="text-xs font-extrabold text-indigo-950">
                  신규 단체코드 함께 발급 (선택사항)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      발급할 신규 단체코드
                    </label>
                    <input
                      type="text"
                      value={initCode}
                      onChange={(e) => setInitCode(e.target.value)}
                      placeholder="예: CHA2026A"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-extrabold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      대상 검사 프로그램
                    </label>
                    <select
                      value={initItId}
                      onChange={(e) => setInitItId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold"
                    >
                      {items.map((it) => (
                        <option key={it.it_id} value={it.it_id}>
                          {it.it_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      신청 정원(명)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={initQuota}
                      onChange={(e) => setInitQuota(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      만료일
                    </label>
                    <input
                      type="date"
                      value={initEnd}
                      onChange={(e) => setInitEnd(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>
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
                  {submitting ? '등록 중...' : '단체관리자 계정 생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Group Code Issue Modal */}
      {showQuickCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">
                빠른 단체코드 발급
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickCodeModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickCreateCode} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  소속 단체기관 선택 *
                </label>
                <select
                  value={quickMbId}
                  onChange={(e) => setQuickMbId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-bold text-slate-800"
                >
                  {groups.map((g) => (
                    <option key={g.mb_id} value={g.mb_id}>
                      {g.group_name} ({g.mb_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  발급할 단체코드 *
                </label>
                <input
                  type="text"
                  required
                  value={quickCode}
                  onChange={(e) => setQuickCode(e.target.value)}
                  placeholder="예: GRAPHIT2026"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-extrabold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  대상 검사 프로그램 *
                </label>
                <select
                  value={quickItId}
                  onChange={(e) => setQuickItId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-bold text-slate-800"
                >
                  {items.map((it) => (
                    <option key={it.it_id} value={it.it_id}>
                      {it.it_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    신청가능 정원(명) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quickQuota}
                    onChange={(e) => setQuickQuota(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    만료일 *
                  </label>
                  <input
                    type="date"
                    required
                    value={quickEnd}
                    onChange={(e) => setQuickEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickCodeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold"
                >
                  {submitting ? '발급 중...' : '+ 단체코드 즉시 발급'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
