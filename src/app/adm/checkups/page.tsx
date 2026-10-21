import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import CheckupsClient, { CheckupSummary } from './CheckupsClient';

export const dynamic = 'force-dynamic';

export default async function AdminCheckupsPage() {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/adm/checkups');
  }
  if (user.mb_level < 9) {
    redirect('/mypage');
  }

  const db = await getDb();

  const qCountMap = new Map<string, number>();
  for (const gi of db.graphit_item) {
    const k = String(gi.it_id);
    qCountMap.set(k, (qCountMap.get(k) || 0) + 1);
  }

  const appCountMap = new Map<string, number>();
  for (const t of db.graphit_test) {
    const k = String(t.it_id);
    appCountMap.set(k, (appCountMap.get(k) || 0) + 1);
  }

  const items: CheckupSummary[] = db.g5_shop_item.map((it) => {
    const id = String(it.it_id);
    return {
      it_id: id,
      it_name: it.it_name,
      it_price: Number(it.it_price || 0),
      it_use: Number(it.it_use ?? 1),
      it_img1: it.it_img1 || '',
      it_1: it.it_1 || '',
      it_2: it.it_2 || '',
      it_3: it.it_3 || '',
      it_4: it.it_4 || '',
      question_count: qCountMap.get(id) || 0,
      applicant_count: appCountMap.get(id) || 0,
    };
  });

  return <CheckupsClient items={items} />;
}
