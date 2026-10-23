import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import PersonalMemberDetailClient from './PersonalMemberDetailClient';

export const dynamic = 'force-dynamic';

export default async function AdminPersonalMemberDetailPage({
  params,
}: {
  params: { mb_id: string };
}) {
  const user = getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (user.mb_level < 9) {
    redirect('/mypage');
  }

  const mbId = decodeURIComponent(params.mb_id);
  const db = await getDb();
  const member = db.g5_member.find((m) => m.mb_id === mbId);
  if (!member) {
    redirect('/adm/members/personal');
  }

  const tests = db.graphit_test
    .filter((t) => t.mb_id === mbId)
    .sort((a, b) => Number(b.test_no) - Number(a.test_no))
    .map((t) => ({
      test_no: Number(t.test_no),
      od_id: String(t.od_id || ''),
      it_id: String(t.it_id || ''),
      it_name: t.it_name || '',
      group_code: t.group_code || '',
      test_status: t.test_status || '시작전',
      test_datetime: t.test_datetime || '',
      end_datetime: t.end_datetime || '',
    }));

  const orders = db.g5_shop_order
    .filter((o) => o.mb_id === mbId)
    .sort((a, b) => String(b.od_time || '').localeCompare(String(a.od_time || '')))
    .map((o) => ({
      od_id: String(o.od_id),
      od_cart_price: Number(o.od_cart_price || 0),
      od_receipt_price: Number(o.od_receipt_price || 0),
      od_status: o.od_status || '',
      od_settle_case: o.od_settle_case || '',
      od_time: o.od_time || '',
    }));

  const allGroupCodes = db.graphit_group
    .sort((a, b) => Number(b.group_no) - Number(a.group_no))
    .map((g) => ({
      group_code: String(g.group_code).trim(),
      it_name:
        db.g5_shop_item.find((it) => String(it.it_id) === String(g.it_id))
          ?.it_name || String(g.it_id),
    }));

  return (
    <PersonalMemberDetailClient
      member={{
        mb_no: Number(member.mb_no),
        mb_id: member.mb_id,
        mb_name: member.mb_name,
        mb_level: Number(member.mb_level || 2),
        mb_8: member.mb_8 || '',
        mb_10: member.mb_10 || member.mb_nick || '',
        mb_email: member.mb_email || '',
        mb_hp: member.mb_hp || '',
        mb_sex: member.mb_sex || '',
        mb_birth: member.mb_birth || '',
        mb_addr1: member.mb_addr1 || '',
        mb_addr2: member.mb_addr2 || '',
        mb_memo: member.mb_memo || '',
        mb_datetime: member.mb_datetime || '',
        mb_leave_date: member.mb_leave_date || '',
        mb_7: member.mb_7 || '',
      }}
      tests={tests}
      orders={orders}
      allGroupCodes={allGroupCodes}
    />
  );
}
