import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import {
  buildNoAnswersMap,
  computeResultBaseRow,
  generateStudentReport,
} from '@/lib/reportEngine';
import AdminTestsClient, { StudentTestRecord } from './AdminTestsClient';

export const dynamic = 'force-dynamic';

export default async function AdminTestsPage() {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/adm/tests');
  }
  if (user.mb_level < 9) {
    redirect('/mypage');
  }

  const db = await getDb();
  const memberMap = new Map(db.g5_member.map((m) => [m.mb_id, m]));
  const itemMap = new Map(db.g5_shop_item.map((it) => [String(it.it_id), it]));
  const qaMap = new Map(db.graphit_qa.map((q) => [Number(q.qa_no), q]));
  const qaByTestNo = new Map<string, any>();
  for (const q of db.graphit_qa) {
    if (q.al_test_no) qaByTestNo.set(String(q.al_test_no), q);
    else if (Number(q.qa_no) >= 1001 && Number(q.qa_no) <= 1208) {
      qaByTestNo.set(`No_${Number(q.qa_no) - 1000}`, q);
    }
  }

  // Question counts per item
  const itemQCountMap = new Map<string, number>();
  for (const gi of db.graphit_item) {
    const k = String(gi.it_id);
    itemQCountMap.set(k, (itemQCountMap.get(k) || 0) + 1);
  }

  // Group answers by `${mb_id}::${it_id}`
  const answersByKey = new Map<string, typeof db.graphit_item_test>();
  for (const ans of db.graphit_item_test) {
    const key = `${ans.mb_id}::${ans.it_id}`;
    let arr = answersByKey.get(key);
    if (!arr) {
      arr = [];
      answersByKey.set(key, arr);
    }
    arr.push(ans);
  }

  const records: StudentTestRecord[] = [...db.graphit_test]
    .sort((a, b) => Number(b.test_no) - Number(a.test_no))
    .map((t, idx) => {
      const mb = memberMap.get(t.mb_id);
      const itId = String(t.it_id || '');
      const item = itemMap.get(itId);
      const rawAnswers = answersByKey.get(`${t.mb_id}::${itId}`) || [];
      const hasCompactAnswers =
        Array.isArray((t as any).no_answers) && (t as any).no_answers.length > 0;
      const totalQ = hasCompactAnswers
        ? (t as any).no_answers.length
        : itemQCountMap.get(itId) || 208;

      let formattedAnswers: StudentTestRecord['answers'] = [];

      if (rawAnswers.length > 0) {
        const sortedAnswers = [...rawAnswers].sort(
          (a, b) => Number(a.item_seq) - Number(b.item_seq)
        );
        formattedAnswers = sortedAnswers.map((a) => {
          const qa = qaMap.get(Number(a.qa_no));
          const raw = String(a.test_answer ?? '');
          let display = raw;
          if (qa && qa.qa_type === 'n') {
            if (raw === '1') display = qa.qa_q1 || '1번';
            else if (raw === '2') display = qa.qa_q2 || '2번';
            else if (raw === '3') display = qa.qa_q3 || '3번';
            else if (raw === '4') display = qa.qa_q4 || '4번';
            else if (raw === '5') display = qa.qa_q5 || '5번';
          }
          return {
            item_seq: Number(a.item_seq),
            qa_no: Number(a.qa_no),
            qa_code: qa?.qa_code || '-',
            qa_type: qa?.qa_type || 'n',
            qa_subject: qa?.qa_subject || `문항 ${a.item_seq}`,
            raw_answer: raw,
            display_answer: display,
            reg_datetime: a.reg_datetime || '',
          };
        });
      } else if (hasCompactAnswers) {
        const noAns: string[] = (t as any).no_answers;
        formattedAnswers = noAns.map((rawVal, i) => {
          const seq = i + 1;
          const qa = qaByTestNo.get(`No_${seq}`);
          const raw = String(rawVal ?? '');
          let display = raw;
          if (qa && qa.qa_type === 'n') {
            if (raw === '1') display = qa.qa_q1 || '1번';
            else if (raw === '2') display = qa.qa_q2 || '2번';
            else if (raw === '3') display = qa.qa_q3 || '3번';
            else if (raw === '4') display = qa.qa_q4 || '4번';
            else if (raw === '5') display = qa.qa_q5 || '5번';
            else if (raw === 'TRUE') display = `정답 (${qa.qa_answer}번)`;
            else if (raw === 'FALSE') display = `오답 (정답: ${qa.qa_answer}번)`;
          }
          return {
            item_seq: seq,
            qa_no: Number(qa?.qa_no || 1000 + seq),
            qa_code: qa?.qa_code || `No_${seq}`,
            qa_type: qa?.qa_type || 'n',
            qa_subject: qa?.qa_subject || `문항 ${seq}`,
            raw_answer: raw,
            display_answer: display,
            reg_datetime: t.end_datetime || t.test_datetime || '',
          };
        });
      }

      const answeredCount = Math.min(totalQ, formattedAnswers.length);
      const progressPercent =
        t.test_status === '완료'
          ? 100
          : totalQ > 0
          ? Math.min(100, Math.round((answeredCount / totalQ) * 100))
          : 0;

      let resultRow = undefined;
      let report = undefined;

      if (t.test_status === '완료' || formattedAnswers.length > 0) {
        const noMap = buildNoAnswersMap(t, rawAnswers, qaMap);
        resultRow = computeResultBaseRow(
          {
            seq: idx + 1,
            test_no: Number(t.test_no),
            od_id: String(t.od_id || ''),
            group_name: String(t.group_name || ''),
            group_code: String(t.group_code || ''),
            mb_id: t.mb_id,
            mb_name: t.mb_name || mb?.mb_name || '-',
            mb_hp: t.mb_hp || mb?.mb_hp || '-',
            it_id: itId,
            it_name: item?.it_name || t.it_name || '-',
            it_code: String(item?.it_4 || ''),
            test_date: String(
              t.end_datetime && !String(t.end_datetime).startsWith('0000')
                ? t.end_datetime
                : t.test_datetime || ''
            ).slice(0, 10),
          },
          noMap,
          db.graphit_qa
        );
        report = generateStudentReport(resultRow);
      }

      return {
        test_no: Number(t.test_no),
        od_id: String(t.od_id || ''),
        mb_id: t.mb_id,
        mb_name: t.mb_name || mb?.mb_name || '-',
        mb_hp: t.mb_hp || mb?.mb_hp || '-',
        mb_sex: mb?.mb_sex || '-',
        mb_birth: mb?.mb_birth || '-',
        it_id: itId,
        it_name: item?.it_name || t.it_name || '-',
        group_code: t.group_code || '',
        group_name: t.group_name || '',
        test_status: t.test_status || '시작전',
        test_datetime: t.test_datetime || '',
        end_datetime: t.end_datetime || '',
        totalQuestions: totalQ,
        answeredQuestions: t.test_status === '완료' ? totalQ : answeredCount,
        progressPercent,
        answers: formattedAnswers,
        resultRow,
        report,
      };
    });

  const groupCodes = [...db.graphit_group]
    .sort((a, b) => Number(b.group_no) - Number(a.group_no))
    .map((g) => {
      const owner = memberMap.get(g.mb_id);
      return {
        code: g.group_code,
        name:
          g.group_code === 'CHAUNIV240522'
            ? '2024-1차의과학대학교'
            : owner?.mb_8 || owner?.mb_name || g.mb_id,
      };
    });

  const items = db.g5_shop_item.map((it) => ({
    it_id: String(it.it_id),
    it_name: it.it_name,
  }));

  return (
    <AdminTestsClient
      records={records}
      groupCodes={groupCodes}
      items={items}
    />
  );
}
