import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import GroupMembersClient, {
  GroupManagerSummary,
  ExistingGroupCodeOption,
  CandidateMemberOption,
} from './GroupMembersClient';

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

  const allGroupCodes: ExistingGroupCodeOption[] = db.graphit_group
    .sort((a, b) => Number(b.group_no) - Number(a.group_no))
    .map((g) => {
      const codeUpper = String(g.group_code || '').trim().toUpperCase();
      const tests = db.graphit_test.filter(
        (t) => String(t.group_code || '').trim().toUpperCase() === codeUpper
      );
      const completed = tests.filter((t) => t.test_status === '완료').length;
      const it = itemMap.get(String(g.it_id));
      const quota = Number(
        g.group_member || (g as any).group_limit || tests.length || 30
      );
      return {
        group_no: Number(g.group_no),
        group_code: String(g.group_code).trim(),
        group_member: quota,
        applied_count: tests.length,
        completed_count: completed,
        group_end: g.group_end || '2026-12-31',
        it_name: it?.it_name || String(g.it_id),
        owner_id: g.mb_id || '',
      };
    });

  const groups: GroupManagerSummary[] = db.g5_member
    .filter((m) => Number(m.mb_level) === 3)
    .sort((a, b) => Number(b.mb_no) - Number(a.mb_no))
    .map((m) => {
      const assignedUpper = new Set(
        String(m.mb_7 || '')
          .split(',')
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean)
      );

      const myCodes = allGroupCodes.filter(
        (g) =>
          g.owner_id.toLowerCase() === m.mb_id.toLowerCase() ||
          assignedUpper.has(g.group_code.toUpperCase())
      );

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

  const candidateMembers: CandidateMemberOption[] = db.g5_member
    .sort((a, b) => Number(b.mb_no) - Number(a.mb_no))
    .map((m) => ({
      mb_id: m.mb_id,
      mb_name: m.mb_name || m.mb_id,
      mb_level: Number(m.mb_level || 2),
      mb_8: m.mb_8 || '',
      mb_10: m.mb_10 || m.mb_nick || '',
      mb_hp: m.mb_hp || '',
      mb_7: m.mb_7 || '',
    }));

  return (
    <GroupMembersClient
      groups={groups}
      items={shopItems}
      allGroupCodes={allGroupCodes}
      candidateMembers={candidateMembers}
    />
  );
}
