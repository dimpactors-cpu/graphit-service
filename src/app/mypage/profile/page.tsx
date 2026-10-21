import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import MypageSidebar from '@/components/MypageSidebar';
import ProfileFormClient from './ProfileFormClient';

export const dynamic = 'force-dynamic';

export default async function MypageProfilePage() {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/mypage/profile');
  }

  const db = await getDb();
  const memberRow = db.g5_member.find((m) => m.mb_id === user.mb_id);
  if (!memberRow) {
    redirect('/login');
  }

  const isGroup = Number(memberRow.mb_level) === 3;
  const normalizedMember = {
    mb_id: memberRow.mb_id,
    mb_name: isGroup ? memberRow.mb_8 || memberRow.mb_name : memberRow.mb_name,
    mb_nick: isGroup ? memberRow.mb_10 || memberRow.mb_nick : memberRow.mb_nick,
    mb_level: Number(memberRow.mb_level),
    mb_1: isGroup ? memberRow.mb_conum || memberRow.mb_1 : memberRow.mb_1,
    mb_2: isGroup ? memberRow.mb_coemail || memberRow.mb_email : memberRow.mb_2,
    mb_3: memberRow.mb_3,
    mb_email: memberRow.mb_email,
    mb_hp: memberRow.mb_hp,
    mb_tel: memberRow.mb_tel,
    mb_sex: memberRow.mb_sex || '',
    mb_birth: memberRow.mb_birth || '',
    mb_addr1: memberRow.mb_addr1 || '',
    mb_addr2: memberRow.mb_addr2 || '',
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SiteHeader user={user} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <MypageSidebar member={normalizedMember} activeTab="profile" />

          <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="border-b border-slate-100 pb-5 mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900">
                #개인정보변경
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                회원님의 기본 정보 및 비밀번호를 안전하게 변경할 수 있습니다.
              </p>
            </div>

            <ProfileFormClient member={normalizedMember} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
