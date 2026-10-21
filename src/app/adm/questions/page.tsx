import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import QuestionsClient from './QuestionsClient';

export const dynamic = 'force-dynamic';

export default async function AdminQuestionsPage() {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/adm/questions');
  }
  if (user.mb_level < 9) {
    redirect('/mypage');
  }

  const db = await getDb();
  const questions = [...db.graphit_qa].sort(
    (a, b) => Number(b.qa_no) - Number(a.qa_no)
  );

  return <QuestionsClient questions={questions} />;
}
