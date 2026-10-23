import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import GroupMemberDetailClient from './GroupMemberDetailClient';

export const dynamic = 'force-dynamic';

export default async function AdminGroupMemberDetailPage({
  params,
  searchParams,
}: {
  params: { mb_id: string };
  searchParams?: { group_code?: string };
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
    redirect('/adm/members/groups');
  }

  const memberMap = new Map(db.g5_member.map((m) => [m.mb_id, m]));
  const itemMap = new Map(db.g5_shop_item.map((it) => [String(it.it_id), it]));

  const itemQCountMap = new Map<string, number>();
  for (const gi of db.graphit_item) {
    const k = String(gi.it_id);
    itemQCountMap.set(k, (itemQCountMap.get(k) || 0) + 1);
  }

  const answerCountMap = new Map<string, number>();
  for (const ans of db.graphit_item_test) {
    if (ans.test_answer) {
      const k = `${ans.mb_id}::${ans.it_id}`;
      answerCountMap.set(k, (answerCountMap.get(k) || 0) + 1);
    }
  }

  const assignedUpper = new Set(
    String(member.mb_7 || '')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
  );

  const groups = db.graphit_group
    .filter(
      (g) =>
        String(g.mb_id || '').toLowerCase() === mbId.toLowerCase() ||
        assignedUpper.has(String(g.group_code || '').trim().toUpperCase())
    )
    .sort((a, b) => Number(b.group_no) - Number(a.group_no))
    .map((g) => {
      const itId = String(g.it_id || '');
      const shopItem = itemMap.get(itId);
      const codeUpper = String(g.group_code || '').trim().toUpperCase();
      const groupTests = db.graphit_test
        .filter((t) => String(t.group_code || '').trim().toUpperCase() === codeUpper)
        .sort((a, b) => Number(b.test_no) - Number(a.test_no));

      let beforeStart = 0;
      let inProgress = 0;
      let completed = 0;

      const students = groupTests.map((t) => {
        const stMb = memberMap.get(t.mb_id);
        const tItId = String(t.it_id || itId);
        const totalQ = itemQCountMap.get(tItId) || 1;
        const ansQ = Math.min(totalQ, answerCountMap.get(`${t.mb_id}::${tItId}`) || 0);
        const pct =
          t.test_status === '완료'
            ? 100
            : totalQ > 0
            ? Math.min(100, Math.round((ansQ / totalQ) * 100))
            : 0;

        if (pct >= 100 || t.test_status === '완료') completed++;
        else if (ansQ > 0 || t.test_status === '진행중') inProgress++;
        else beforeStart++;

        return {
          test_no: Number(t.test_no),
          mb_id: t.mb_id,
          mb_name: t.mb_name || stMb?.mb_name || '-',
          mb_hp: t.mb_hp || stMb?.mb_hp || '-',
          mb_sex: stMb?.mb_sex || '-',
          mb_birth: stMb?.mb_birth || '-',
          test_status: t.test_status || '시작전',
          test_datetime: t.test_datetime || '',
          end_datetime: t.end_datetime || '',
          progressPercent: pct,
        };
      });

      const quota = Number(g.group_member || 0);
      return {
        group_no: Number(g.group_no),
        group_code: g.group_code,
        group_member: quota,
        group_end: g.group_end || '-',
        reg_datetime: g.reg_datetime || '',
        it_id: itId,
        it_name: shopItem?.it_name || itId,
        stats: {
          unregistered: Math.max(0, quota - groupTests.length),
          beforeStart,
          inProgress,
          completed,
        },
        students,
      };
    });

  const items = db.g5_shop_item.map((it) => ({
    it_id: String(it.it_id),
    it_name: it.it_name,
  }));

  const allGroupCodes = db.graphit_group
    .sort((a, b) => Number(b.group_no) - Number(a.group_no))
    .map((g) => {
      const codeUpper = String(g.group_code || '').trim().toUpperCase();
      const cnt = db.graphit_test.filter(
        (t) => String(t.group_code || '').trim().toUpperCase() === codeUpper
      ).length;
      const it = itemMap.get(String(g.it_id));
      return {
        group_code: String(g.group_code).trim(),
        it_name: it?.it_name || String(g.it_id),
        applied_count: cnt,
      };
    });

  return (
    <GroupMemberDetailClient
      member={{
        mb_id: member.mb_id,
        mb_level: Number(member.mb_level || 3),
        mb_8: member.mb_8 || member.mb_name || member.mb_id,
        mb_10: member.mb_10 || member.mb_nick || '',
        mb_hp: member.mb_hp || '',
        mb_tel: member.mb_tel || '',
        mb_conum: member.mb_conum || member.mb_1 || '',
        mb_coemail: member.mb_coemail || member.mb_email || '',
        mb_addr1: member.mb_addr1 || '',
        mb_addr2: member.mb_addr2 || '',
        mb_memo: member.mb_memo || '',
        assignedCodes: groups.map((g) => g.group_code),
      }}
      groups={groups}
      items={items}
      allGroupCodes={allGroupCodes}
      initialCode={searchParams?.group_code}
    />
  );
}
