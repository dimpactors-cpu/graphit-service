import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import TestIntroClient from './TestIntroClient';

export const dynamic = 'force-dynamic';

export default async function TestIntroPage({
  searchParams,
}: {
  searchParams?: { it_id?: string; test_idx?: string; fresh?: string };
}) {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?url=/mypage');
  }

  const db = await getDb();
  const isFresh = searchParams?.fresh === '1';

  let itId = searchParams?.it_id || '';
  if (!itId && searchParams?.test_idx) {
    const t = db.graphit_test.find(
      (row) => Number(row.test_no) === Number(searchParams.test_idx)
    );
    if (t) itId = String(t.it_id);
  }

  // Also check cookie tests if not found in db
  if (!itId) {
    try {
      const rawCookie = cookies().get('graphit_my_tests')?.value;
      if (rawCookie) {
        const cookieTests = JSON.parse(
          Buffer.from(rawCookie, 'base64url').toString('utf-8')
        );
        const myCookieTest = cookieTests.find(
          (t: any) => t.mb_id === user.mb_id
        );
        if (myCookieTest?.it_id) {
          itId = String(myCookieTest.it_id);
        }
      }
    } catch {
      // ignore
    }
  }

  if (!itId) {
    const myFirstTest = db.graphit_test.find((t) => t.mb_id === user.mb_id);
    if (myFirstTest) itId = String(myFirstTest.it_id);
  }

  // Fallback to default test item if still empty
  if (!itId) {
    itId = '1698900476';
  }

  const shopItem = db.g5_shop_item.find((it) => String(it.it_id) === itId);
  let mappedQuestions = db.graphit_item
    .filter((gi) => String(gi.it_id) === itId)
    .sort((a, b) => Number(a.item_seq) - Number(b.item_seq));

  // If an item (e.g. 1680499211) has 0 mapped questions in backup DB, fallback to 1680499166
  if (mappedQuestions.length === 0) {
    mappedQuestions = db.graphit_item
      .filter((gi) => String(gi.it_id) === '1680499166')
      .sort((a, b) => Number(a.item_seq) - Number(b.item_seq));
  }

  const userAnswers = isFresh
    ? []
    : db.graphit_item_test.filter(
        (ans) =>
          ans.mb_id === user.mb_id &&
          String(ans.it_id) === itId &&
          ans.test_answer !== undefined &&
          ans.test_answer !== ''
      );

  const answeredSeqSet = new Set(userAnswers.map((a) => Number(a.item_seq)));
  let nextSeq = 1;
  for (const mq of mappedQuestions) {
    if (!answeredSeqSet.has(Number(mq.item_seq))) {
      nextSeq = Number(mq.item_seq);
      break;
    }
  }

  // Only redirect to result if NOT a fresh application and all questions are answered
  if (
    !isFresh &&
    mappedQuestions.length > 0 &&
    answeredSeqSet.size >= mappedQuestions.length
  ) {
    redirect(`/test/result?it_id=${encodeURIComponent(itId)}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SiteHeader user={user} />
      <main className="flex-1">
        <TestIntroClient
          itId={itId}
          itName={shopItem?.it_name || '그래프잇 진단검사'}
          totalQuestions={mappedQuestions.length}
          answeredQuestions={answeredSeqSet.size}
          nextSeq={nextSeq}
          isFresh={isFresh}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
