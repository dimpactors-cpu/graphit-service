import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import TestIntroClient from './TestIntroClient';

export const dynamic = 'force-dynamic';

export default async function TestIntroPage({
  searchParams,
}: {
  searchParams?: { it_id?: string; test_idx?: string };
}) {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/mypage');
  }

  const db = await getDb();

  let itId = searchParams?.it_id || '';
  if (!itId && searchParams?.test_idx) {
    const t = db.graphit_test.find(
      (row) => Number(row.test_no) === Number(searchParams.test_idx)
    );
    if (t) itId = String(t.it_id);
  }
  if (!itId) {
    const myFirstTest = db.graphit_test.find((t) => t.mb_id === user.mb_id);
    if (myFirstTest) itId = String(myFirstTest.it_id);
  }

  if (!itId) {
    redirect('/mypage');
  }

  const shopItem = db.g5_shop_item.find((it) => String(it.it_id) === itId);
  const mappedQuestions = db.graphit_item
    .filter((gi) => String(gi.it_id) === itId)
    .sort((a, b) => Number(a.item_seq) - Number(b.item_seq));

  const userAnswers = db.graphit_item_test.filter(
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

  // If already completed all questions, redirect to result page
  if (mappedQuestions.length > 0 && answeredSeqSet.size >= mappedQuestions.length) {
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
        />
      </main>
      <SiteFooter />
    </div>
  );
}
