import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import TestRunnerClient, { TestQuestionItem } from './TestRunnerClient';

export const dynamic = 'force-dynamic';

export default async function TestRunPage({
  searchParams,
}: {
  searchParams?: { it_id?: string; seq?: string };
}) {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/mypage');
  }

  const db = await getDb();
  let itId = searchParams?.it_id || '';
  if (!itId) {
    const firstTest = db.graphit_test.find((t) => t.mb_id === user.mb_id);
    if (firstTest) itId = String(firstTest.it_id);
  }
  if (!itId) {
    redirect('/mypage');
  }

  const shopItem = db.g5_shop_item.find((it) => String(it.it_id) === itId);
  const qaMap = new Map(db.graphit_qa.map((q) => [Number(q.qa_no), q]));

  const userAnswers = db.graphit_item_test.filter(
    (ans) => ans.mb_id === user.mb_id && String(ans.it_id) === itId
  );
  const answerBySeq = new Map(
    userAnswers.map((a) => [Number(a.item_seq), a.test_answer])
  );

  const mappedItems = db.graphit_item
    .filter((gi) => String(gi.it_id) === itId)
    .sort((a, b) => Number(a.item_seq) - Number(b.item_seq));

  const questions: TestQuestionItem[] = mappedItems.map((gi) => {
    const qa = qaMap.get(Number(gi.qa_no));
    return {
      item_seq: Number(gi.item_seq),
      item_timer: Number(gi.item_timer || 0),
      qa_no: Number(gi.qa_no),
      qa_code: qa?.qa_code || '',
      qa_type: qa?.qa_type || 'n',
      qa_subject: qa?.qa_subject || `문항 ${gi.item_seq}`,
      qa_content: qa?.qa_content || '',
      qa_file: qa?.qa_file || '',
      qa_q1: qa?.qa_q1 || '1번',
      qa_q2: qa?.qa_q2 || '2번',
      qa_q3: qa?.qa_q3 || '3번',
      qa_q4: qa?.qa_q4 || '4번',
      qa_q5: qa?.qa_q5 || '5번',
      existingAnswer: answerBySeq.get(Number(gi.item_seq)) || '',
    };
  });

  let initialIndex = 0;
  if (searchParams?.seq) {
    const requestedSeq = Number(searchParams.seq);
    const idx = questions.findIndex((q) => q.item_seq === requestedSeq);
    if (idx >= 0) initialIndex = idx;
  } else {
    const firstUnanswered = questions.findIndex(
      (q) => !q.existingAnswer || q.existingAnswer === ''
    );
    if (firstUnanswered >= 0) initialIndex = firstUnanswered;
  }

  return (
    <TestRunnerClient
      itId={itId}
      itName={shopItem?.it_name || '그래프잇 온라인 진단검사'}
      questions={questions}
      initialIndex={initialIndex}
    />
  );
}
