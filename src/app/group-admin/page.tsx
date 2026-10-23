import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import {
  buildNoAnswersMap,
  computeResultBaseRow,
  generateStudentReport,
} from '@/lib/reportEngine';
import GroupAdminClient, {
  GroupManagerOption,
  AuthorizedGroupSummary,
} from './GroupAdminClient';
import type { StudentTestRecord } from '@/app/adm/tests/AdminTestsClient';

export const dynamic = 'force-dynamic';

export default async function GroupAdminPage({
  searchParams,
}: {
  searchParams?: { mb_id?: string; group_code?: string };
}) {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/group-admin');
  }
  if (user.mb_level < 3) {
    redirect('/mypage');
  }

  const db = await getDb();
  const isSuperAdmin = user.mb_level >= 9;

  // All level-3 group managers for super-admin switcher
  const level3Members = db.g5_member
    .filter((m) => Number(m.mb_level) === 3)
    .sort((a, b) => Number(b.mb_no) - Number(a.mb_no));

  const targetMbId =
    isSuperAdmin && searchParams?.mb_id
      ? searchParams.mb_id
      : isSuperAdmin
      ? level3Members[0]?.mb_id || user.mb_id
      : user.mb_id;

  const targetMember =
    db.g5_member.find(
      (m) => m.mb_id.toLowerCase() === targetMbId.toLowerCase()
    ) || {
      mb_id: user.mb_id,
      mb_name: user.mb_name,
      mb_nick: user.mb_nick || user.mb_name,
      mb_8: user.mb_8 || user.mb_name,
      mb_10: user.mb_nick || user.mb_name,
      mb_7: user.mb_7 || '',
      mb_hp: '',
      mb_tel: '',
      mb_email: '',
      mb_coemail: '',
      mb_conum: '',
      mb_1: '',
    };

  // Determine authorized group codes for targetMember
  const authorizedCodeSet = new Set<string>();
  for (const g of db.graphit_group) {
    if (
      String(g.mb_id || '').toLowerCase() === targetMember.mb_id.toLowerCase()
    ) {
      authorizedCodeSet.add(String(g.group_code || '').trim().toUpperCase());
    }
  }
  const extraCodes = String(targetMember.mb_7 || '')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
  for (const c of extraCodes) {
    authorizedCodeSet.add(c);
  }

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

  const itemQCountMap = new Map<string, number>();
  for (const gi of db.graphit_item) {
    const k = String(gi.it_id);
    itemQCountMap.set(k, (itemQCountMap.get(k) || 0) + 1);
  }

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

  // Build authorized groups summary
  const authorizedGroups: AuthorizedGroupSummary[] = db.graphit_group
    .filter((g) =>
      authorizedCodeSet.has(String(g.group_code || '').trim().toUpperCase())
    )
    .sort((a, b) => Number(b.group_no) - Number(a.group_no))
    .map((g) => {
      const codeUpper = String(g.group_code || '').trim().toUpperCase();
      const tests = db.graphit_test.filter(
        (t) => String(t.group_code || '').trim().toUpperCase() === codeUpper
      );
      const completed = tests.filter((t) => t.test_status === '완료').length;
      const inProgress = tests.filter((t) => t.test_status === '진행중').length;
      const beforeStart = Math.max(0, tests.length - completed - inProgress);
      const it = itemMap.get(String(g.it_id));
      const quota = Number(
        g.group_member || (g as any).group_limit || tests.length || 30
      );
      return {
        group_no: Number(g.group_no),
        group_code: String(g.group_code).trim(),
        group_member: quota,
        group_end: g.group_end || '2026-12-31',
        reg_datetime: g.reg_datetime || '',
        it_id: String(g.it_id || ''),
        it_name: it?.it_name || String(g.it_id || '-'),
        applied_count: tests.length,
        completed_count: completed,
        in_progress_count: inProgress,
        before_start_count: beforeStart,
      };
    });

  const groupOwnerNameMap = new Map<string, string>();
  for (const g of db.graphit_group) {
    const owner = memberMap.get(g.mb_id);
    groupOwnerNameMap.set(
      String(g.group_code || '').trim().toUpperCase(),
      owner?.mb_8 || owner?.mb_name || targetMember.mb_8 || targetMember.mb_name || ''
    );
  }

  const TENDENCY_LABELS: Record<string, string> = {
    seL: '자아(seL)',
    foC: '집중(foC)',
    skI: '기술(skI)',
    reL: '관계(reL)',
    obJ: '목적(obJ)',
  };

  const formatAnswerDisplay = (qa: any, raw: string) => {
    if (!qa || qa.qa_type !== 'n') return raw;
    const optText = (n: number | string) => {
      const s = String(n);
      if (s === '1') return qa.qa_q1 || '1번';
      if (s === '2') return qa.qa_q2 || '2번';
      if (s === '3') return qa.qa_q3 || '3번';
      if (s === '4') return qa.qa_q4 || '4번';
      if (s === '5') return qa.qa_q5 || '5번';
      return `${s}번`;
    };
    if (raw === 'TRUE') {
      return `⭕ 정답 (${qa.qa_answer}번: ${optText(qa.qa_answer)})`;
    }
    if (raw === 'FALSE') {
      return `❌ 오답 (정답 ${qa.qa_answer}번: ${optText(qa.qa_answer)})`;
    }
    if (TENDENCY_LABELS[raw] && qa.qa_tendency_map && qa.qa_tendency_map[raw]) {
      const ch = qa.qa_tendency_map[raw];
      return `${ch}번: ${optText(ch)} [${TENDENCY_LABELS[raw]}]`;
    }
    if (['1', '2', '3', '4', '5'].includes(raw)) {
      const base = `${raw}번: ${optText(raw)}`;
      if (qa.qa_answer && ['1', '2', '3', '4', '5'].includes(String(qa.qa_answer))) {
        const isCorrect = String(qa.qa_answer) === raw;
        return isCorrect
          ? `⭕ ${base} (정답)`
          : `❌ ${base} (정답: ${qa.qa_answer}번)`;
      }
      return base;
    }
    return raw;
  };

  // Build student test records belonging to authorized group codes (ordered 1..N by registration/student order)
  const matchingTests = db.graphit_test
    .filter((t) =>
      authorizedCodeSet.has(String(t.group_code || '').trim().toUpperCase())
    )
    .sort((a, b) => Number(a.test_no) - Number(b.test_no));

  const groupSeqCounters = new Map<string, number>();

  const records: StudentTestRecord[] = matchingTests.map((t) => {
    const cleanCodeUpper = String(t.group_code || '').trim().toUpperCase();
    const nextGroupSeq = (groupSeqCounters.get(cleanCodeUpper) || 0) + 1;
    groupSeqCounters.set(cleanCodeUpper, nextGroupSeq);
    const idx = nextGroupSeq - 1;
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
        return {
          item_seq: Number(a.item_seq),
          qa_no: Number(a.qa_no),
          qa_code: qa?.qa_code || '-',
          qa_type: qa?.qa_type || 'n',
          qa_subject: qa?.qa_subject || `문항 ${a.item_seq}`,
          raw_answer: raw,
          display_answer: formatAnswerDisplay(qa, raw),
          reg_datetime: a.reg_datetime || '',
        };
      });
    } else if (hasCompactAnswers) {
      const noAns: string[] = (t as any).no_answers;
      formattedAnswers = noAns.map((rawVal, i) => {
        const seq = i + 1;
        const qa = qaByTestNo.get(`No_${seq}`);
        const raw = String(rawVal ?? '');
        return {
          item_seq: seq,
          qa_no: Number(qa?.qa_no || 1000 + seq),
          qa_code: qa?.qa_code || `No_${seq}`,
          qa_type: qa?.qa_type || 'n',
          qa_subject: qa?.qa_subject || `문항 ${seq}`,
          raw_answer: raw,
          display_answer: formatAnswerDisplay(qa, raw),
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

    const cleanCode = String(t.group_code || '').trim();
    const resolvedGroupName =
      t.group_name ||
      groupOwnerNameMap.get(cleanCode.toUpperCase()) ||
      targetMember.mb_8 ||
      targetMember.mb_name ||
      '';

    let resultRow = undefined;
    let report = undefined;

    if (t.test_status === '완료' || formattedAnswers.length > 0) {
      const noMap = buildNoAnswersMap(t, rawAnswers, qaMap);
      resultRow = computeResultBaseRow(
        {
          seq: idx + 1,
          test_no: Number(t.test_no),
          od_id: String(t.od_id || ''),
          group_name: String(resolvedGroupName),
          group_code: cleanCode,
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
      group_code: cleanCode,
      group_name: resolvedGroupName,
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

  const managerOptions: GroupManagerOption[] = level3Members.map((m) => {
    const codes = new Set<string>();
    for (const g of db.graphit_group) {
      if (String(g.mb_id || '').toLowerCase() === m.mb_id.toLowerCase()) {
        codes.add(String(g.group_code).trim());
      }
    }
    for (const c of String(m.mb_7 || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      codes.add(c);
    }
    return {
      mb_id: m.mb_id,
      group_name: m.mb_8 || m.mb_name || m.mb_id,
      manager_name: m.mb_10 || m.mb_nick || m.mb_name || '',
      codes: Array.from(codes),
    };
  });

  return (
    <GroupAdminClient
      isSuperAdmin={isSuperAdmin}
      currentManager={{
        mb_id: targetMember.mb_id,
        group_name: targetMember.mb_8 || targetMember.mb_name || targetMember.mb_id,
        manager_name:
          targetMember.mb_10 || targetMember.mb_nick || targetMember.mb_name || '',
        mb_hp: targetMember.mb_hp || targetMember.mb_tel || '',
        mb_email: targetMember.mb_coemail || targetMember.mb_email || '',
        mb_conum: targetMember.mb_conum || targetMember.mb_1 || '',
      }}
      managerOptions={managerOptions}
      groups={authorizedGroups}
      records={records}
      initialGroupCode={searchParams?.group_code}
    />
  );
}
