'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProfileFormClientProps {
  member: {
    mb_id: string;
    mb_name: string;
    mb_nick: string;
    mb_email: string;
    mb_hp: string;
    mb_tel: string;
    mb_sex: string;
    mb_birth: string;
    mb_1: string;
    mb_addr1: string;
    mb_addr2: string;
    mb_level: number;
  };
}

export default function ProfileFormClient({ member }: ProfileFormClientProps) {
  const router = useRouter();
  const [mbName, setMbName] = useState(member.mb_name || '');
  const [mbNick, setMbNick] = useState(member.mb_nick || '');
  const [mbEmail, setMbEmail] = useState(member.mb_email || '');
  const [mbHp, setMbHp] = useState(member.mb_hp || '');
  const [mbTel, setMbTel] = useState(member.mb_tel || '');
  const [mbSex, setMbSex] = useState(member.mb_sex || '');
  const [mbBirth, setMbBirth] = useState(member.mb_birth || '');
  const [mbAddr1, setMbAddr1] = useState(member.mb_addr1 || '');
  const [mbAddr2, setMbAddr2] = useState(member.mb_addr2 || '');
  const [password, setPassword] = useState('');
  const [passwordRe, setPasswordRe] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== passwordRe) {
      alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/member/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mb_name: mbName,
          mb_nick: mbNick,
          mb_email: mbEmail,
          mb_hp: mbHp,
          mb_tel: mbTel,
          mb_sex: mbSex,
          mb_birth: mbBirth,
          mb_addr1: mbAddr1,
          mb_addr2: mbAddr2,
          mb_password: password || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('개인정보가 저장되었습니다.');
        setPassword('');
        setPasswordRe('');
        router.refresh();
      } else {
        alert(data.message || '저장에 실패했습니다.');
      }
    } catch {
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            아이디 (변경불가)
          </label>
          <input
            type="text"
            value={member.mb_id}
            disabled
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            이름 / 단체명
          </label>
          <input
            type="text"
            value={mbName}
            onChange={(e) => setMbName(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            새 비밀번호 (변경 시에만 입력)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="변경할 비밀번호 입력"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            새 비밀번호 확인
          </label>
          <input
            type="password"
            value={passwordRe}
            onChange={(e) => setPasswordRe(e.target.value)}
            placeholder="비밀번호 재입력"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            휴대폰 번호
          </label>
          <input
            type="text"
            value={mbHp}
            onChange={(e) => setMbHp(e.target.value)}
            placeholder="010-0000-0000"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            이메일
          </label>
          <input
            type="email"
            value={mbEmail}
            onChange={(e) => setMbEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            성별
          </label>
          <select
            value={mbSex}
            onChange={(e) => setMbSex(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
          >
            <option value="">선택안함</option>
            <option value="남">남성</option>
            <option value="여">여성</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            출생년도
          </label>
          <input
            type="text"
            value={mbBirth}
            onChange={(e) => setMbBirth(e.target.value)}
            placeholder="예: 1998"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            기본주소
          </label>
          <input
            type="text"
            value={mbAddr1}
            onChange={(e) => setMbAddr1(e.target.value)}
            placeholder="도로명 또는 지번 주소"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none mb-2"
          />
          <input
            type="text"
            value={mbAddr2}
            onChange={(e) => setMbAddr2(e.target.value)}
            placeholder="상세주소"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Link
          href="/mypage"
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition disabled:opacity-50"
        >
          {loading ? '저장 중...' : '정보 수정 저장'}
        </button>
      </div>
    </form>
  );
}
