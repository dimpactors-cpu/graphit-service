import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import MypageSidebar from '@/components/MypageSidebar';
import FaqAccordionClient from './FaqAccordionClient';

export const dynamic = 'force-dynamic';

export default async function FaqPage() {
  const user = getSessionUser();
  const db = await getDb();
  const memberRow = user ? db.g5_member.find((m) => m.mb_id === user.mb_id) : null;

  const faqs = [...db.g5_write_faq].sort(
    (a, b) => Number(a.wr_id) - Number(b.wr_id)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SiteHeader user={user} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {memberRow && (
            <MypageSidebar
              member={{
                mb_id: memberRow.mb_id,
                mb_name: memberRow.mb_name,
                mb_nick: memberRow.mb_nick,
                mb_level: Number(memberRow.mb_level),
                mb_1: memberRow.mb_1,
                mb_2: memberRow.mb_2,
                mb_3: memberRow.mb_3,
                mb_email: memberRow.mb_email,
                mb_hp: memberRow.mb_hp,
                mb_tel: memberRow.mb_tel,
              }}
              activeTab="faq"
            />
          )}

          <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="border-b border-slate-100 pb-5 mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900">
                #자주하는질문 (FAQ)
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                그래프잇 온라인 검사 이용과 관련하여 자주 묻는 질문과 답변입니다.
              </p>
            </div>

            <FaqAccordionClient faqs={faqs} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
