import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function TestResultPage({
  searchParams,
}: {
  searchParams?: { it_id?: string; test_idx?: string };
}) {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/mypage');
  }

  const db = await getDb();
  let testRecord = searchParams?.test_idx
    ? db.graphit_test.find(
        (t) => Number(t.test_no) === Number(searchParams.test_idx)
      )
    : undefined;

  if (!testRecord && searchParams?.it_id) {
    testRecord = db.graphit_test.find(
      (t) =>
        t.mb_id === user.mb_id && String(t.it_id) === String(searchParams.it_id)
    );
  }
  if (!testRecord) {
    testRecord = db.graphit_test.find((t) => t.mb_id === user.mb_id);
  }

  const itId = String(testRecord?.it_id || searchParams?.it_id || '');
  const shopItem = db.g5_shop_item.find((it) => String(it.it_id) === itId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SiteHeader user={user} />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl font-extrabold mx-auto mb-6">
            ✓
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
            온라인 진단검사 제출 완료
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
            검사가 완료되었습니다!
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8">
            모든 문항에 성실히 응답해 주셔서 감사합니다.
            <br />
            응답하신 데이터는 정상적으로 저장 및 제출되었습니다.
          </p>

          {testRecord && (
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-left text-xs sm:text-sm space-y-2 mb-8">
              <div className="flex justify-between">
                <span className="text-slate-500">응시자</span>
                <span className="font-bold text-slate-900">
                  {testRecord.mb_name} ({testRecord.mb_id})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">검사 프로그램</span>
                <span className="font-bold text-slate-900">
                  {shopItem?.it_name || testRecord.it_name}
                </span>
              </div>
              {testRecord.group_code && (
                <div className="flex justify-between">
                  <span className="text-slate-500">소속 단체코드</span>
                  <span className="font-bold text-indigo-600">
                    {testRecord.group_code}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">완료 일시</span>
                <span className="font-semibold text-slate-700">
                  {testRecord.end_datetime || testRecord.test_datetime || '-'}
                </span>
              </div>
            </div>
          )}

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
      </main>
      <SiteFooter />
    </div>
  );
}
