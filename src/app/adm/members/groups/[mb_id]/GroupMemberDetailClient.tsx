'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';

interface GroupCodeDetail {
  group_no: number;
  group_code: string;
  group_member: number;
  group_end: string;
  reg_datetime: string;
  it_id: string;
  it_name: string;
  stats: {
    unregistered: number;
    beforeStart: number;
    inProgress: number;
    completed: number;
  };
  students: Array<{
    test_no: number;
    mb_id: string;
    mb_name: string;
    mb_hp: string;
    mb_sex: string;
    mb_birth: string;
    test_status: string;
    test_datetime: string;
    end_datetime: string;
    progressPercent: number;
  }>;
}

interface GroupMemberDetailClientProps {
  member: {
    mb_id: string;
    mb_8: string; // 단체명
    mb_10: string; // 대표자/담당자
    mb_hp: string;
    mb_tel: string;
    mb_conum: string;
    mb_coemail: string;
    mb_addr1: string;
    mb_addr2: string;
    mb_memo: string;
  };
  groups: GroupCodeDetail[];
  items: Array<{ it_id: string; it_name: string }>;
  initialCode?: string;
}

export default function GroupMemberDetailClient({
  member,
  groups,
  items,
  initialCode,
}: GroupMemberDetailClientProps) {
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState(
    initialCode || groups[0]?.group_code || ''
  );

  // Edit group info state
  const [mb8, setMb8] = useState(member.mb_8 || '');
  const [mb10, setMb10] = useState(member.mb_10 || '');
  const [mbHp, setMbHp] = useState(member.mb_hp || '');
  const [mbConum, setMbConum] = useState(member.mb_conum || '');
  const [mbCoemail, setMbCoemail] = useState(member.mb_coemail || '');
  const [mbAddr1, setMbAddr1] = useState(member.mb_addr1 || '');
  const [mbMemo, setMbMemo] = useState(member.mb_memo || '');
  const [newPassword, setNewPassword] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // New group code registration state
  const [newCode, setNewCode] = useState('');
  const [newItId, setNewItId] = useState(items[0]?.it_id || '');
  const [newQuota, setNewQuota] = useState('30');
  const [newEndDate, setNewEndDate] = useState('2026-12-31');
  const [creatingCode, setCreatingCode] = useState(false);

  const currentGroup = useMemo(() => {
    return groups.find((g) => g.group_code === selectedCode) || groups[0];
  }, [groups, selectedCode]);

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await fetch('/api/admin/member', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mb_id: member.mb_id,
          mb_name: mb8,
          mb_8: mb8,
          mb_10: mb10,
          mb_hp: mbHp,
          mb_conum: mbConum,
          mb_coemail: mbCoemail,
          mb_addr1: mbAddr1,
          mb_memo: mbMemo,
          new_password: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('단체 정보가 수정되었습니다.');
        setNewPassword('');
        router.refresh();
      } else {
        alert(data.message || '수정 실패');
      }
    } catch {
      alert('서버 통신 오류');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newItId || !newQuota || !newEndDate) {
      alert('모든 항목을 입력해 주세요.');
      return;
    }
    setCreatingCode(true);
    try {
      const res = await fetch('/api/admin/group-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mb_id: member.mb_id,
          group_code: newCode.trim(),
          it_id: newItId,
          group_member: Number(newQuota),
          group_end: newEndDate,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const createdCode = newCode.trim();
        alert(`단체코드 [${createdCode}] 가 등록되었습니다.`);
        setNewCode('');
        window.location.href = `/adm/members/groups/${encodeURIComponent(
          member.mb_id
        )}?group_code=${encodeURIComponent(createdCode)}`;
      } else {
        alert(data.message || '단체코드 등록 실패');
      }
    } catch {
      alert('서버 통신 오류');
    } finally {
      setCreatingCode(false);
    }
  };

  const handleDeleteCode = async (codeToDelete: string) => {
    if (!confirm(`정말로 단체코드 [${codeToDelete}] 를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(
        `/api/admin/group-code?group_code=${encodeURIComponent(codeToDelete)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.ok) {
        alert('단체코드가 삭제되었습니다.');
        window.location.href = `/adm/members/groups/${encodeURIComponent(
          member.mb_id
        )}`;
      } else {
        alert(data.message || '삭제할 수 없습니다.');
      }
    } catch {
      alert('서버 통신 오류');
    }
  };

  return (
    <AdminLayout
      title={`단체 상세관리 — ${member.mb_8} (${member.mb_id})`}
      subtitle="단체 기본정보 수정, 신규 단체코드 발급 및 코드별 수강생 검사 진행현황을 관리합니다."
      actions={
        <Link
          href="/adm/members/groups"
          className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          ← 단체 목록으로
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left: Group Info Form */}
        <form
          onSubmit={handleSaveMember}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3.5"
        >
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            1. 단체 기본정보 수정
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                단체 아이디
              </label>
              <input
                type="text"
                disabled
                value={member.mb_id}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                새 비밀번호 (변경시)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="변경시 입력"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                단체명
              </label>
              <input
                type="text"
                value={mb8}
                onChange={(e) => setMb8(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                대표자 / 담당자명
              </label>
              <input
                type="text"
                value={mb10}
                onChange={(e) => setMb10(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                연락처
              </label>
              <input
                type="text"
                value={mbHp}
                onChange={(e) => setMbHp(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                사업자등록번호
              </label>
              <input
                type="text"
                value={mbConum}
                onChange={(e) => setMbConum(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              세금계산서 이메일
            </label>
            <input
              type="text"
              value={mbCoemail}
              onChange={(e) => setMbCoemail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={savingInfo}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition"
          >
            {savingInfo ? '저장 중...' : '단체 기본정보 저장'}
          </button>
        </form>

        {/* Middle: Register New Group Code */}
        <form
          onSubmit={handleCreateCode}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3.5"
        >
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            2. 신규 단체코드 발급 등록
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              발급할 단체코드 *
            </label>
            <input
              type="text"
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="예: CAU2026A"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-extrabold uppercase focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              대상 검사 프로그램 *
            </label>
            <select
              value={newItId}
              onChange={(e) => setNewItId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800"
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
              <label className="block text-xs font-bold text-slate-600 mb-1">
                신청가능 정원(명) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={newQuota}
                onChange={(e) => setNewQuota(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                검사 종료(만료)일 *
              </label>
              <input
                type="date"
                required
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={creatingCode}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition"
            >
              {creatingCode ? '등록 중...' : '+ 단체코드 발급 등록'}
            </button>
          </div>
        </form>

        {/* Right: Group Code Selector & Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              3. 단체코드별 현황 조회 및 삭제
            </h2>

            {groups.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                발급된 단체코드가 없습니다.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <select
                    value={currentGroup?.group_code || ''}
                    onChange={(e) => setSelectedCode(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-extrabold text-slate-900"
                  >
                    {groups.map((g) => (
                      <option key={g.group_no} value={g.group_code}>
                        {g.group_code} ({g.it_name})
                      </option>
                    ))}
                  </select>
                  {currentGroup && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCode(currentGroup.group_code)}
                      className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                    >
                      코드삭제
                    </button>
                  )}
                </div>

                {currentGroup && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">대상 검사</span>
                        <span className="font-bold text-slate-800">{currentGroup.it_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">유효기간</span>
                        <span className="font-semibold text-slate-700">
                          {currentGroup.reg_datetime.slice(0, 10)} ~ {currentGroup.group_end}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">총 배정인원</span>
                        <span className="font-extrabold text-indigo-600">
                          {currentGroup.group_member}명
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-100">
                        <div className="text-[11px] text-slate-500">미등록</div>
                        <div className="text-base font-extrabold text-slate-800">
                          {currentGroup.stats.unregistered}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50">
                        <div className="text-[11px] text-amber-700">시작전</div>
                        <div className="text-base font-extrabold text-amber-700">
                          {currentGroup.stats.beforeStart}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-50">
                        <div className="text-[11px] text-blue-700">진행중</div>
                        <div className="text-base font-extrabold text-blue-700">
                          {currentGroup.stats.inProgress}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50">
                        <div className="text-[11px] text-emerald-700">검사완료</div>
                        <div className="text-base font-extrabold text-emerald-700">
                          {currentGroup.stats.completed}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Students list under selected group_code */}
      {currentGroup && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                단체코드 [{currentGroup.group_code}] 소속 수강생 신청·진행현황 ({currentGroup.students.length}명)
              </h2>
            </div>
            <a
              href={`/api/admin/excel?type=test&stx=${encodeURIComponent(currentGroup.group_code)}`}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition"
            >
              📥 이 단체코드 결과 엑셀 다운로드
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <th className="py-3 px-4 w-14 text-center">No.</th>
                  <th className="py-3 px-4">아이디 (이메일)</th>
                  <th className="py-3 px-4">수강생 이름</th>
                  <th className="py-3 px-4">연락처</th>
                  <th className="py-3 px-4 text-center">성별 / 생년</th>
                  <th className="py-3 px-4 text-center">진행률</th>
                  <th className="py-3 px-4 text-center">진행상태</th>
                  <th className="py-3 px-4">신청일시 / 완료일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentGroup.students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      해당 단체코드로 신청한 수강생이 없습니다.
                    </td>
                  </tr>
                ) : (
                  currentGroup.students.map((st, idx) => (
                    <tr key={st.test_no} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-center text-xs text-slate-400">
                        {currentGroup.students.length - idx}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{st.mb_id}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">{st.mb_name}</td>
                      <td className="py-3 px-4 text-slate-600">{st.mb_hp || '-'}</td>
                      <td className="py-3 px-4 text-center text-xs text-slate-500">
                        {st.mb_sex || '-'} / {st.mb_birth || '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-600">
                        {st.progressPercent}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            st.test_status === '완료'
                              ? 'bg-emerald-100 text-emerald-800'
                              : st.test_status === '진행중'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {st.test_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {st.test_datetime}
                        {st.end_datetime ? ` ~ ${st.end_datetime}` : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
