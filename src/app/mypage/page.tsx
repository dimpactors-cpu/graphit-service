import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import {
  getDb,
  isTestResultOpen,
  getAnswersForTest,
  GraphitTestRow,
} from '@/lib/db';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import MypageClient from './MypageClient';

export const dynamic = 'force-dynamic';

export default async function MypagePage({
  searchParams,
}: {
  searchParams?: { group_code?: string };
}) {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?url=/mypage');
  }

  const db = await getDb();
  const memberRow = db.g5_member.find((m) => m.mb_id === user.mb_id) || {
    mb_no: 9999,
    mb_id: user.mb_id,
    mb_password: '',
    mb_name: user.mb_name,
    mb_nick: user.mb_nick || user.mb_name,
    mb_email: user.mb_id,
    mb_level: user.mb_level || 2,
    mb_sex: '',
    mb_birth: '',
    mb_tel: '',
    mb_hp: '',
    mb_zip1: '',
    mb_zip2: '',
    mb_addr1: '',
    mb_addr2: '',
    mb_addr3: '',
    mb_addr_jibeon: '',
    mb_point: 0,
    mb_today_login: '',
    mb_datetime: '',
    mb_leave_date: '',
    mb_intercept_date: '',
    mb_memo: '',
    mb_mailling: 1,
    mb_sms: 1,
    mb_1: '',
    mb_2: '',
    mb_3: '',
    mb_4: '',
    mb_5: '',
    mb_6: '',
    mb_7: user.mb_7 || '',
    mb_8: user.mb_8 || '',
    mb_9: '',
    mb_10: '',
    mb_conum: null,
    mb_coemail: null,
    it_name: null,
    test_datetime: null,
    test_status: '',
    group_name: null,
    test_end: null,
    group_code: null,
  };

  const isGroup = Number(memberRow.mb_level) === 3;

  // Map item question counts
  const itemQuestionCountMap = new Map<string, number>();
  for (const gi of db.graphit_item) {
    const key = String(gi.it_id);
    itemQuestionCountMap.set(key, (itemQuestionCountMap.get(key) || 0) + 1);
  }

  // Map shop items
  const shopItemMap = new Map(
    db.g5_shop_item.map((it) => [String(it.it_id), it])
  );

  // Merge cookie tests with db.graphit_test so serverless instances always show newly applied tests
  const combinedTests: GraphitTestRow[] = [
    ...db.graphit_test.filter((t) => t.mb_id === memberRow.mb_id),
  ];
  try {
    const rawCookie = cookies().get('graphit_my_tests')?.value;
    if (rawCookie) {
      const cookieTests = JSON.parse(
        Buffer.from(rawCookie, 'base64url').toString('utf-8')
      ) as GraphitTestRow[];
      for (const ct of cookieTests) {
        if (
          ct.mb_id === memberRow.mb_id &&
          !combinedTests.some(
            (existing) =>
              Number(existing.test_no) === Number(ct.test_no) ||
              String(existing.od_id) === String(ct.od_id)
          )
        ) {
          combinedTests.unshift(ct);
        }
      }
    }
  } catch {
    // ignore malformed cookie
  }

  // Personal tests
  const myTests = combinedTests
    .sort((a, b) => Number(b.test_no) - Number(a.test_no))
    .map((t) => {
      const itId = String(t.it_id);
      const shopItem = shopItemMap.get(itId);
      const totalQ = itemQuestionCountMap.get(itId) || 7;
      const testAnswers = getAnswersForTest(db, t);
      const answeredQ = Math.min(totalQ, testAnswers.length);
      const progressPercent =
        t.test_status === '완료'
          ? 100
          : totalQ > 0
          ? Math.min(100, Math.round((answeredQ / totalQ) * 100))
          : 0;

      return {
        test_idx: Number(t.test_no),
        it_id: itId,
        it_name: shopItem?.it_name || t.it_name || '그래프잇 진단검사',
        it_basic: shopItem?.it_basic || '',
        it_img1: shopItem?.it_img1 || '',
        gr_code: t.group_code || '',
        test_status: t.test_status || '시작전',
        regdate: t.test_datetime || '',
        totalQuestions: totalQ,
        answeredQuestions: t.test_status === '완료' ? totalQ : answeredQ,
        progressPercent,
        isResultOpen: isTestResultOpen(t),
      };
    });

  // Group dashboard data if mb_level === 3
  const memberByIdMap = new Map(db.g5_member.map((m) => [m.mb_id, m]));
  const myGroups = isGroup
    ? db.graphit_group
        .filter((g) => g.mb_id === memberRow.mb_id)
        .sort((a, b) => Number(b.group_no) - Number(a.group_no))
        .map((g) => {
          const itId = String(g.it_id || '');
          const shopItem = shopItemMap.get(itId);
          const groupTests = db.graphit_test.filter(
            (t) => t.group_code === g.group_code
          );

          let beforeStart = 0;
          let inProgress = 0;
          let completed = 0;

          const students = groupTests.map((t) => {
            const stMember = memberByIdMap.get(t.mb_id);
            const tItId = String(t.it_id || itId);
            const totalQ = itemQuestionCountMap.get(tItId) || 7;
            const testAnswers = getAnswersForTest(db, t);
            const answeredQ = Math.min(totalQ, testAnswers.length);
            const progressPercent =
              t.test_status === '완료'
                ? 100
                : totalQ > 0
                ? Math.min(100, Math.round((answeredQ / totalQ) * 100))
                : 0;

            if (progressPercent >= 100 || t.test_status === '완료') {
              completed++;
            } else if (answeredQ > 0 || t.test_status === '진행중') {
              inProgress++;
            } else {
              beforeStart++;
            }

            return {
              test_idx: Number(t.test_no),
              mb_id: t.mb_id,
              mb_name: t.mb_name || stMember?.mb_name || '-',
              mb_sex: stMember?.mb_sex || '-',
              mb_birth: stMember?.mb_birth || '-',
              mb_1: stMember?.mb_1 || '-',
              mb_hp: t.mb_hp || stMember?.mb_hp || '-',
              regdate: t.test_datetime || '',
              test_status: t.test_status || '시작전',
              totalQuestions: totalQ,
              answeredQuestions: t.test_status === '완료' ? totalQ : answeredQ,
              progressPercent,
              isResultOpen: isTestResultOpen(t),
            };
          });

          const totalQuota = Number(g.group_member) || 0;
          const unregistered = Math.max(0, totalQuota - groupTests.length);

          return {
            gr_idx: Number(g.group_no),
            gr_code: g.group_code,
            gr_cnt: totalQuota,
            sdate: (g.reg_datetime || '').slice(0, 10),
            edate: g.group_end || '-',
            it_id: itId,
            it_name: shopItem?.it_name || '그래프잇 검사',
            stats: {
              unregistered,
              beforeStart,
              inProgress,
              completed,
            },
            students,
          };
        })
    : [];

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
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SiteHeader user={user} />
      <main className="flex-1">
        <MypageClient
          member={normalizedMember}
          personalTests={myTests}
          groups={myGroups}
          initialGroupCode={searchParams?.group_code}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
