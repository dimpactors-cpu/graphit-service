import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb, formatKstDate } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/adm');
  }
  if (user.mb_level < 9) {
    redirect('/mypage');
  }

  const db = await getDb();
  const today = formatKstDate();

  const activeMembers = db.g5_member.filter((m) => !m.mb_leave_date);
  const personalMembers = activeMembers.filter(
    (m) => Number(m.mb_level) === 2
  ).length;
  const groupManagers = activeMembers.filter(
    (m) => Number(m.mb_level) === 3
  ).length;

  const todayMembers = activeMembers.filter((m) =>
    String(m.mb_datetime || '').startsWith(today)
  ).length;

  const totalTests = db.graphit_test.length;
  const completedTests = db.graphit_test.filter(
    (t) => t.test_status === '완료'
  ).length;
  const inProgressTests = db.graphit_test.filter(
    (t) => t.test_status === '진행중'
  ).length;
  const beforeStartTests = totalTests - completedTests - inProgressTests;

  const todayTests = db.graphit_test.filter((t) =>
    String(t.test_datetime || '').startsWith(today)
  ).length;

  const recentTests = [...db.graphit_test]
    .sort((a, b) => Number(b.test_no) - Number(a.test_no))
    .slice(0, 12)
    .map((t) => ({
      test_no: Number(t.test_no),
      mb_id: t.mb_id,
      mb_name: t.mb_name,
      mb_hp: t.mb_hp,
      it_id: String(t.it_id),
      it_name: t.it_name,
      group_code: t.group_code,
      group_name: t.group_name,
      test_status: t.test_status,
      test_datetime: t.test_datetime,
      end_datetime: t.end_datetime,
    }));

  const memberMap = new Map(db.g5_member.map((m) => [m.mb_id, m]));
  const itemMap = new Map(db.g5_shop_item.map((it) => [String(it.it_id), it]));

  const recentGroups = [...db.graphit_group]
    .sort((a, b) => Number(b.group_no) - Number(a.group_no))
    .slice(0, 8)
    .map((g) => {
      const owner = memberMap.get(g.mb_id);
      const item = itemMap.get(String(g.it_id));
      const appliedCount = db.graphit_test.filter(
        (t) => t.group_code === g.group_code
      ).length;
      return {
        group_no: Number(g.group_no),
        group_code: g.group_code,
        group_name: owner?.mb_8 || owner?.mb_name || g.mb_id,
        mb_id: g.mb_id,
        it_name: item?.it_name || String(g.it_id),
        group_member: Number(g.group_member || 0),
        applied_count: appliedCount,
        group_end: g.group_end || '-',
      };
    });

  return (
    <AdminDashboardClient
      stats={{
        totalMembers: activeMembers.length,
        personalMembers,
        groupManagers,
        totalTests,
        completedTests,
        inProgressTests,
        beforeStartTests,
        todayMembers,
        todayTests,
        totalGroups: db.graphit_group.length,
        totalQuestions: db.graphit_qa.length,
        totalItems: db.g5_shop_item.length,
        isCloudDbConnected: Boolean(process.env.DATABASE_URL),
      }}
      recentTests={recentTests}
      recentGroups={recentGroups}
    />
  );
}
