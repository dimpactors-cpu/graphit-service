import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import CheckupDetailClient, {
  MappedQuestionRow,
  AvailableQuestionRow,
} from './CheckupDetailClient';

export const dynamic = 'force-dynamic';

export default async function AdminCheckupDetailPage({
  params,
}: {
  params: { it_id: string };
}) {
  const user = getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (user.mb_level < 9) {
    redirect('/mypage');
  }

  const itId = String(params.it_id);
  const db = await getDb();
  const shopItem = db.g5_shop_item.find((it) => String(it.it_id) === itId);
  if (!shopItem) {
    redirect('/adm/checkups');
  }

  const qaMap = new Map(db.graphit_qa.map((q) => [Number(q.qa_no), q]));

  const initialMappings: MappedQuestionRow[] = db.graphit_item
    .filter((gi) => String(gi.it_id) === itId)
    .sort((a, b) => Number(a.item_seq) - Number(b.item_seq))
    .map((gi) => {
      const qa = qaMap.get(Number(gi.qa_no));
      return {
        item_no: Number(gi.item_no),
        item_seq: Number(gi.item_seq),
        item_timer: Number(gi.item_timer || 0),
        qa_no: Number(gi.qa_no),
        qa_code: qa?.qa_code || '-',
        qa_type: qa?.qa_type || 'n',
        qa_subject: qa?.qa_subject || `문항 #${gi.qa_no}`,
        qa_sub1: qa?.qa_sub1 || '',
        qa_level: qa?.qa_level || '',
        qa_answer: qa?.qa_answer || qa?.qa_sub2 || '',
        qa_metric: qa?.qa_metric || qa?.qa_power || '',
        qa_weight: qa?.qa_weight ?? 0,
        qa_tendency_map: qa?.qa_tendency_map || null,
        al_test_no: qa?.al_test_no || '',
      };
    });

  const allQuestions: AvailableQuestionRow[] = [...db.graphit_qa]
    .sort((a, b) => Number(b.qa_no) - Number(a.qa_no))
    .map((q) => ({
      qa_no: Number(q.qa_no),
      qa_code: q.qa_code || '',
      qa_type: q.qa_type || 'n',
      qa_subject: q.qa_subject || '',
      qa_sub1: q.qa_sub1 || '',
      qa_level: q.qa_level || '',
    }));

  return (
    <CheckupDetailClient
      item={{
        it_id: String(shopItem.it_id),
        it_name: shopItem.it_name || '',
        it_price: Number(shopItem.it_price || 0),
        it_use: Number(shopItem.it_use ?? 1),
        it_img1: shopItem.it_img1 || '',
        it_basic: shopItem.it_basic || '',
        it_explan: shopItem.it_explan || '',
        it_1: shopItem.it_1 || '',
        it_2: shopItem.it_2 || '',
        it_3: shopItem.it_3 || '',
        it_4: shopItem.it_4 || '',
      }}
      initialMappings={initialMappings}
      allQuestions={allQuestions}
    />
  );
}
