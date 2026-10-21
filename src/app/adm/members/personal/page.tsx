import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import PersonalMembersClient, { PersonalMemberSummary } from './PersonalMembersClient';

export const dynamic = 'force-dynamic';

export default async function AdminPersonalMembersPage() {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/adm/members/personal');
  }
  if (user.mb_level < 9) {
    redirect('/mypage');
  }

  const db = await getDb();

  // Map tests per member
  const testCounts = new Map<string, { total: number; completed: number; groupCode: string }>();
  for (const t of db.graphit_test) {
    const cur = testCounts.get(t.mb_id) || { total: 0, completed: 0, groupCode: '' };
    cur.total += 1;
    if (t.test_status === '완료') cur.completed += 1;
    if (t.group_code && !cur.groupCode) cur.groupCode = t.group_code;
    testCounts.set(t.mb_id, cur);
  }

  const members: PersonalMemberSummary[] = db.g5_member
    .filter((m) => Number(m.mb_level) === 2)
    .sort((a, b) => Number(b.mb_no) - Number(a.mb_no))
    .map((m) => {
      const tc = testCounts.get(m.mb_id);
      return {
        mb_no: Number(m.mb_no),
        mb_id: m.mb_id,
        mb_name: m.mb_name,
        mb_hp: m.mb_hp || '',
        mb_sex: m.mb_sex || '',
        mb_birth: m.mb_birth || '',
        mb_datetime: m.mb_datetime || '',
        mb_leave_date: m.mb_leave_date || '',
        group_code: m.group_code || m.mb_7 || tc?.groupCode || '',
        test_count: tc?.total || 0,
        completed_count: tc?.completed || 0,
      };
    });

  return <PersonalMembersClient members={members} />;
}
