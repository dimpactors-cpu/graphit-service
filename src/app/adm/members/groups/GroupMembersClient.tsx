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
  items = [],
}: {
  groups: GroupManagerSummary[];
  items?: Array<{ it_id: string; it_name: string }>;
}) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickCodeModal, setShowQuickCodeModal] = useState(false);

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
  const [submitting, setSubmitting] = useState(false);

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
            ? `신규 단체회원 및 단체코드 [${initCode.trim()}] 가 함께 등록되었습니다.`
            : '신규 단체회원 계정이 등록되었습니다.'
        );
        setShowAddModal(false);
        setNewId('');
        setNewGroupName('');
        setNewManagerName('');
        setInitCode('');
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
            onClick={() => setShowQuickCodeModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm transition"
          >
            + 빠른 단체코드 발급
          </button>
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

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
                <div className="text-xs font-extrabold text-indigo-950">
                  초기 단체코드 함께 발급 (선택사항 — 입력 시 즉시 사용 가능)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      발급할 단체코드
                    </label>
                    <input
                      type="text"
                      value={initCode}
                      onChange={(e) => setInitCode(e.target.value)}
                      placeholder="예: CAU2026A"
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
                  {submitting ? '등록 중...' : '단체회원 등록'}
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
