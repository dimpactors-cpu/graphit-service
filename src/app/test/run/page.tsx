import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import { getDb, getAnswersForTest } from '@/lib/db';
import TestRunnerClient, { TestQuestionItem } from './TestRunnerClient';

export const dynamic = 'force-dynamic';

export default async function TestRunPage({
  searchParams,
}: {
  searchParams?: {
    it_id?: string;
    test_idx?: string;
    seq?: string;
    fresh?: string;
  };
}) {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?url=/mypage');
  }

  const db = await getDb();
  const isFresh = searchParams?.fresh === '1';

  // Merge user's test records from DB and cookie
  const userTests = [...db.graphit_test.filter((t) => t.mb_id === user.mb_id)];
  try {
    const rawCookie = cookies().get('graphit_my_tests')?.value;
    if (rawCookie) {
      const cookieTests = JSON.parse(
        Buffer.from(rawCookie, 'base64url').toString('utf-8')
      );
      for (const ct of cookieTests) {
        if (
          ct.mb_id === user.mb_id &&
          !userTests.some(
            (existing) =>
              Number(existing.test_no) === Number(ct.test_no) ||
              String(existing.od_id) === String(ct.od_id)
          )
        ) {
          userTests.unshift(ct);
        }
      }
    }
  } catch {
    // ignore
  }

  const validGroupTests = userTests.filter(
    (t) => String(t.group_code || '').trim() !== ''
  );

  let matchedTest = searchParams?.test_idx
    ? validGroupTests.find(
        (t) => Number(t.test_no) === Number(searchParams.test_idx)
      )
    : undefined;

  if (!matchedTest && searchParams?.it_id) {
    matchedTest =
      validGroupTests.find(
        (t) =>
          String(t.it_id) === String(searchParams.it_id) &&
          t.test_status !== '완료'
      ) ||
      validGroupTests.find(
        (t) => String(t.it_id) === String(searchParams.it_id)
      );
  }

  if (!matchedTest) {
    matchedTest =
      validGroupTests.find((t) => t.test_status !== '완료') ||
      validGroupTests[0];
  }

  if (!matchedTest) {
    const targetItId = searchParams?.it_id || '1698900476';
    redirect(`/shop/orderform?it_id=${encodeURIComponent(targetItId)}`);
  }

  const itId = String(matchedTest.it_id || searchParams?.it_id || '1698900476');
  const testIdx = Number(matchedTest.test_no);

  const shopItem = db.g5_shop_item.find((it) => String(it.it_id) === itId);
  const qaMap = new Map(db.graphit_qa.map((q) => [Number(q.qa_no), q]));

  const userAnswers = isFresh ? [] : getAnswersForTest(db, matchedTest);
  const answerBySeq = new Map(
    userAnswers.map((a) => [Number(a.item_seq), a.test_answer])
  );

  let mappedItems = db.graphit_item
    .filter((gi) => String(gi.it_id) === itId)
    .sort((a, b) => Number(a.item_seq) - Number(b.item_seq));

  if (mappedItems.length === 0) {
    mappedItems = db.graphit_item
      .filter((gi) => String(gi.it_id) === '1680499166')
      .sort((a, b) => Number(a.item_seq) - Number(b.item_seq));
  }

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
  if (isFresh) {
    initialIndex = 0;
  } else if (searchParams?.seq) {
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
      testIdx={testIdx}
      itName={shopItem?.it_name || '그래프잇 온라인 진단검사'}
      questions={questions}
      initialIndex={initialIndex}
    />
  );
}
