'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';

interface PersonalMemberDetailProps {
  member: {
    mb_no: number;
    mb_id: string;
    mb_name: string;
    mb_level?: number;
    mb_8?: string;
    mb_10?: string;
    mb_email: string;
    mb_hp: string;
    mb_sex: string;
    mb_birth: string;
    mb_addr1: string;
    mb_addr2: string;
    mb_memo: string;
    mb_datetime: string;
    mb_leave_date: string;
    mb_7: string;
  };
  tests: Array<{
    test_no: number;
    od_id: string;
    it_id: string;
    it_name: string;
    group_code: string;
    test_status: string;
    test_datetime: string;
    end_datetime: string;
  }>;
  orders: Array<{
    od_id: string;
    od_cart_price: number;
    od_receipt_price: number;
    od_status: string;
    od_settle_case: string;
    od_time: string;
  }>;
  allGroupCodes?: Array<{
    group_code: string;
    it_name: string;
  }>;
}

export default function PersonalMemberDetailClient({
  member,
  tests,
  orders,
  allGroupCodes = [],
}: PersonalMemberDetailProps) {
  const router = useRouter();
  const [mbName, setMbName] = useState(member.mb_name || '');
  const [mbLevel, setMbLevel] = useState<number>(member.mb_level || 2);
  const [mb8, setMb8] = useState(member.mb_8 || '');
  const [mb10, setMb10] = useState(member.mb_10 || '');
  const [assignedCodes, setAssignedCodes] = useState<string[]>(
    String(member.mb_7 || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
  );
  const [mbHp, setMbHp] = useState(member.mb_hp || '');
  const [mbSex, setMbSex] = useState(member.mb_sex || '');
  const [mbBirth, setMbBirth] = useState(member.mb_birth || '');
  const [mbAddr1, setMbAddr1] = useState(member.mb_addr1 || '');
  const [mbAddr2, setMbAddr2] = useState(member.mb_addr2 || '');
  const [mbMemo, setMbMemo] = useState(member.mb_memo || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/member', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mb_id: member.mb_id,
          mb_name: mbName,
          mb_level: mbLevel,
          mb_8: mb8,
          mb_10: mb10,
          assigned_group_codes: assignedCodes,
          mb_hp: mbHp,
          mb_sex: mbSex,
          mb_birth: mbBirth,
          mb_addr1: mbAddr1,
          mb_addr2: mbAddr2,
          mb_memo: mbMemo,
          new_password: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('회원 정보가 수정되었습니다.');
        setNewPassword('');
        router.refresh();
      } else {
        alert(data.message || '수정에 실패했습니다.');
      }
    } catch {
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title={`개인회원 상세정보 — ${member.mb_name} (${member.mb_id})`}
      subtitle="개인회원의 기본 정보 수정 및 신청한 검사/결제 이력을 확인합니다."
      actions={
        <Link
          href="/adm/members/personal"
          className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          ← 목록으로 돌아가기
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Member Form */}
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            기본 정보 수정
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              아이디 (이메일)
            </label>
            <input
              type="text"
              value={member.mb_id}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              이름
            </label>
            <input
              type="text"
              value={mbName}
              onChange={(e) => setMbName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              비밀번호 초기화/변경 (입력 시 변경됨)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="변경 시에만 새 비밀번호 입력"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
            />
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
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                성별 / 생년월일
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={mbSex}
                  onChange={(e) => setMbSex(e.target.value)}
                  placeholder="성별"
                  className="w-1/2 rounded-xl border border-slate-300 px-2.5 py-2 text-xs"
                />
                <input
                  type="text"
                  value={mbBirth}
                  onChange={(e) => setMbBirth(e.target.value)}
                  placeholder="생년"
                  className="w-1/2 rounded-xl border border-slate-300 px-2.5 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              주소
            </label>
            <input
              type="text"
              value={mbAddr1}
              onChange={(e) => setMbAddr1(e.target.value)}
              placeholder="기본주소"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs mb-1.5"
            />
            <input
              type="text"
              value={mbAddr2}
              onChange={(e) => setMbAddr2(e.target.value)}
              placeholder="상세주소"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              관리자 메모
            </label>
            <textarea
              rows={3}
              value={mbMemo}
              onChange={(e) => setMbMemo(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs"
            />
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
            <div className="text-xs font-extrabold text-indigo-950">
              🔑 계정 권한(등급) 및 단체관리자(학교 담당자) 지정
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                회원 권한 등급
              </label>
              <select
                value={mbLevel}
                onChange={(e) => setMbLevel(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-extrabold text-slate-900"
              >
                <option value={2}>Lv.2 일반 수강생 (개인회원)</option>
                <option value={3}>Lv.3 단체관리자 (학교/기관 담당자)</option>
                <option value={10}>Lv.10 통합관리자 (최고관리자)</option>
              </select>
            </div>

            {mbLevel === 3 && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      소속 학교/기관명
                    </label>
                    <input
                      type="text"
                      value={mb8}
                      onChange={(e) => setMb8(e.target.value)}
                      placeholder="예: 차의과학대학교"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      담당자명/부서
                    </label>
                    <input
                      type="text"
                      value={mb10}
                      onChange={(e) => setMb10(e.target.value)}
                      placeholder="예: 학생처 담당자"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    열람/관리할 단체코드 선택 ({assignedCodes.length}개)
                  </label>
                  <div className="max-h-32 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 space-y-1 text-xs">
                    {allGroupCodes.map((gc) => {
                      const checked = assignedCodes.includes(gc.group_code);
                      return (
                        <label
                          key={gc.group_code}
                          className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setAssignedCodes(
                                  assignedCodes.filter((c) => c !== gc.group_code)
                                );
                              } else {
                                setAssignedCodes([
                                  ...assignedCodes,
                                  gc.group_code,
                                ]);
                              }
                            }}
                          />
                          <span className="font-mono font-bold">
                            {gc.group_code}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            ({gc.it_name})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition disabled:opacity-50"
          >
            {saving ? '저장 중...' : '회원정보 및 권한 수정 저장'}
          </button>
        </form>

        {/* Test & Order History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              수강생 검사 신청 내역 ({tests.length}건)
            </h2>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <th className="py-2.5 px-3">주문/신청번호</th>
                  <th className="py-2.5 px-3">검사명</th>
                  <th className="py-2.5 px-3">단체코드</th>
                  <th className="py-2.5 px-3 text-center">상태</th>
                  <th className="py-2.5 px-3">신청일 / 완료일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      검사 신청 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  tests.map((t) => (
                    <tr key={t.test_no}>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {t.od_id || `TEST-${t.test_no}`}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {t.it_name}
                      </td>
                      <td className="py-2.5 px-3">
                        {t.group_code || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            t.test_status === '완료'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.test_status === '진행중'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.test_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {t.test_datetime}
                        {t.end_datetime ? ` ~ ${t.end_datetime}` : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              결제/주문 내역 ({orders.length}건)
            </h2>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <th className="py-2.5 px-3">주문번호</th>
                  <th className="py-2.5 px-3">결제수단</th>
                  <th className="py-2.5 px-3 text-right">주문금액</th>
                  <th className="py-2.5 px-3 text-center">주문상태</th>
                  <th className="py-2.5 px-3">주문일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      결제 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.od_id}>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {o.od_id}
                      </td>
                      <td className="py-2.5 px-3">{o.od_settle_case || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {Number(o.od_cart_price || 0).toLocaleString()}원
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-indigo-600">
                        {o.od_status}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{o.od_time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
