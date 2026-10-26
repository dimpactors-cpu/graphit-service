import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import {
  getDb,
  isTestResultOpen,
  getAnswersForTest,
  GraphitTestRow,
} from '@/lib/db';
import {
  buildNoAnswersMap,
  computeResultBaseRow,
  generateStudentReport,
} from '@/lib/reportEngine';
import GraphmeReportView from '@/components/GraphmeReportView';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function TestResultPage({
  searchParams,
}: {
  searchParams?: {
    it_id?: string;
    test_idx?: string;
    mb_id?: string;
    submitted?: string;
  };
}) {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/mypage');
  }

  const db = await getDb();
  const isAdmin = user.mb_level >= 9;
  const isJustSubmitted = searchParams?.submitted === '1';

  const combinedTests: GraphitTestRow[] = [...db.graphit_test];
  try {
    const rawCookie = cookies().get('graphit_my_tests')?.value;
    if (rawCookie) {
      const cookieTests = JSON.parse(
        Buffer.from(rawCookie, 'base64url').toString('utf-8')
      ) as GraphitTestRow[];
      for (const ct of cookieTests) {
        const existingIdx = combinedTests.findIndex(
          (t) => Number(t.test_no) === Number(ct.test_no)
        );
        if (existingIdx < 0) {
          combinedTests.unshift(ct);
        }
      }
    }
  } catch {
    // ignore
  }

  let testRecord = searchParams?.test_idx
    ? combinedTests.find(
        (t) => Number(t.test_no) === Number(searchParams.test_idx)
      )
    : undefined;

  if (!testRecord && searchParams?.it_id) {
    const targetMbId =
      isAdmin && searchParams?.mb_id ? searchParams.mb_id : user.mb_id;
    testRecord =
      combinedTests.find(
        (t) =>
          t.mb_id === targetMbId &&
          String(t.it_id) === String(searchParams.it_id) &&
          t.test_status === '완료'
      ) ||
      combinedTests.find(
        (t) =>
          t.mb_id === targetMbId &&
          String(t.it_id) === String(searchParams.it_id)
      );
  }
  if (!testRecord) {
    testRecord =
      combinedTests.find(
        (t) => t.mb_id === user.mb_id && t.test_status === '완료'
      ) || combinedTests.find((t) => t.mb_id === user.mb_id);
  }

  // If non-admin tries to view another user's test_idx, fallback to their own
  if (testRecord && !isAdmin && testRecord.mb_id !== user.mb_id) {
    // Allow group owners (level 3) to view students in their group
    const me = db.g5_member.find(
      (m) => m.mb_id.toLowerCase() === user.mb_id.toLowerCase()
    );
    const userGroups = new Set<string>(
      db.graphit_group
        .filter((g) => String(g.mb_id || '').toLowerCase() === user.mb_id.toLowerCase())
        .map((g) => String(g.group_code || '').trim().toUpperCase())
    );
    for (const c of String(me?.mb_7 || user.mb_7 || '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)) {
      userGroups.add(c);
    }
    const recCodeUpper = String(testRecord.group_code || '').trim().toUpperCase();
    if (!userGroups.has(recCodeUpper)) {
      testRecord = combinedTests.find((t) => t.mb_id === user.mb_id);
    }
  }

  const itId = String(testRecord?.it_id || searchParams?.it_id || '');
  const shopItem = db.g5_shop_item.find((it) => String(it.it_id) === itId);
  const qaMap = new Map(db.graphit_qa.map((q) => [Number(q.qa_no), q]));

  const canShowReport =
    !isJustSubmitted &&
    Boolean(testRecord) &&
    (isAdmin || isTestResultOpen(testRecord!));

  let resultRow = undefined;
  let reportData = undefined;

  if (testRecord && canShowReport) {
    const rawAnswers = getAnswersForTest(db, testRecord);
    const noAnswersMap = buildNoAnswersMap(testRecord, rawAnswers, qaMap);
    resultRow = computeResultBaseRow(
      {
        seq: Number(testRecord.test_no) || 1,
        test_no: Number(testRecord.test_no) || 1,
        od_id: String(testRecord.od_id || testRecord.test_no || ''),
        group_name: String(testRecord.group_name || ''),
        group_code: String(testRecord.group_code || ''),
        mb_id: String(testRecord.mb_id || ''),
        mb_name: String(testRecord.mb_name || ''),
        mb_hp: String(testRecord.mb_hp || ''),
        it_id: itId,
        it_name: String(shopItem?.it_name || testRecord.it_name || ''),
        it_code: String(shopItem?.it_4 || ''),
        test_date: String(
          testRecord.end_datetime &&
            !String(testRecord.end_datetime).startsWith('0000')
            ? testRecord.end_datetime
            : testRecord.test_datetime || ''
        ).slice(0, 10),
      },
      noAnswersMap,
      db.graphit_qa
    );
    reportData = generateStudentReport(resultRow);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 print:bg-white">
      <div className="print:hidden">
        <SiteHeader user={user} />
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 print:p-0 print:max-w-none">
        {reportData && resultRow ? (
          <div>
            {/* Top navigation bar (hidden in print) */}
            <div className="print:hidden flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                  ✓ 진단검사 완료 및 결과지 생성됨
                </span>
                <span className="text-xs text-slate-500">
                  완료일시: {testRecord?.end_datetime || testRecord?.test_datetime || '-'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link
                    href="/adm/tests"
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold transition"
                  >
                    ← 관리자 결과/응시 관리로 돌아가기
                  </Link>
                )}
                {user.mb_level === 3 && (
                  <Link
                    href="/group-admin"
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition"
                  >
                    ← 단체관리자 센터로 돌아가기
                  </Link>
                )}
                <Link
                  href="/mypage"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition"
                >
                  마이페이지로 이동
                </Link>
              </div>
            </div>

            <GraphmeReportView
              report={reportData}
              resultRow={resultRow}
              canViewRawDb={isAdmin}
            />
          </div>
        ) : (
          <div className="max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl font-extrabold mx-auto mb-6">
              ✓
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
              온라인 진단검사 제출 완료
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4 leading-snug">
              응답이 잘 제출되었습니다.
            </h1>
            <p className="text-sm sm:text-base text-slate-700 font-semibold leading-relaxed mb-8 bg-slate-50 border border-slate-200 rounded-2xl p-5">
              응답이 잘 제출되었습니다.
              <br />
              분석에는 최대 하루 정도 시간이 소요되며,
              <br />
              결과는 마이페이지에서 확인할 수 있습니다
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/mypage"
                className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold shadow-sm transition"
              >
                마이페이지로 이동
              </Link>
              <Link
                href="/"
                className="flex-1 py-3.5 rounded-2xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-bold transition"
              >
                메인 화면으로
              </Link>
            </div>
          </div>
        )}
      </main>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}
