import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import GroupMembersClient, { GroupManagerSummary } from './GroupMembersClient';

export const dynamic = 'force-dynamic';

export default async function AdminGroupMembersPage() {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/adm/members/groups');
  }
  if (user.mb_level < 9) {
    redirect('/mypage');
  }

  const db = await getDb();
  const itemMap = new Map(db.g5_shop_item.map((it) => [String(it.it_id), it]));

  const groups: GroupManagerSummary[] = db.g5_member
    .filter((m) => Number(m.mb_level) === 3)
    .sort((a, b) => Number(b.mb_no) - Number(a.mb_no))
    .map((m) => {
      const myCodes = db.graphit_group
        .filter((g) => g.mb_id === m.mb_id)
        .sort((a, b) => Number(b.group_no) - Number(a.group_no))
        .map((g) => {
          const tests = db.graphit_test.filter(
            (t) => t.group_code === g.group_code
          );
          const completed = tests.filter((t) => t.test_status === '완료').length;
          const it = itemMap.get(String(g.it_id));
          return {
            group_no: Number(g.group_no),
            group_code: g.group_code,
            group_member: Number(g.group_member || 0),
            applied_count: tests.length,
            completed_count: completed,
            group_end: g.group_end || '-',
            it_name: it?.it_name || String(g.it_id),
          };
        });

      return {
        mb_no: Number(m.mb_no),
        mb_id: m.mb_id,
        group_name: m.mb_8 || m.mb_name || m.mb_id,
        manager_name: m.mb_10 || m.mb_nick || m.mb_name || '',
        mb_hp: m.mb_hp || '',
        mb_tel: m.mb_tel || '',
        mb_conum: m.mb_conum || m.mb_1 || '',
        mb_coemail: m.mb_coemail || m.mb_email || '',
        mb_datetime: m.mb_datetime || '',
        codes: myCodes,
      };
    });

  const shopItems = db.g5_shop_item.map((it) => ({
    it_id: String(it.it_id),
    it_name: it.it_name,
  }));

  return <GroupMembersClient groups={groups} items={shopItems} />;
}
