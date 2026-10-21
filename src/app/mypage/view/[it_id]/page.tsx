import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import MypageSidebar from '@/components/MypageSidebar';

export const dynamic = 'force-dynamic';

export default async function MypageViewItemPage({
  params,
}: {
  params: { it_id: string };
}) {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/mypage');
  }

  const db = await getDb();
  const memberRow = db.g5_member.find((m) => m.mb_id === user.mb_id);
  if (!memberRow) {
    redirect('/login');
  }

  const itId = String(params.it_id);
  const shopItem = db.g5_shop_item.find((it) => String(it.it_id) === itId);

  const myTestsForItem = db.graphit_test
    .filter((t) => t.mb_id === memberRow.mb_id && String(t.it_id) === itId)
    .sort((a, b) => Number(b.test_no) - Number(a.test_no));

  const orderMap = new Map(db.g5_shop_order.map((o) => [String(o.od_id), o]));

  const normalizedMember = {
    mb_id: memberRow.mb_id,
    mb_name: memberRow.mb_name,
    mb_nick: memberRow.mb_nick,
    mb_level: Number(memberRow.mb_level),
    mb_1: memberRow.mb_1,
    mb_2: memberRow.mb_2,
    mb_3: memberRow.mb_3,
    mb_email: memberRow.mb_email,
    mb_hp: memberRow.mb_hp,
    mb_tel: memberRow.mb_tel,
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SiteHeader user={user} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <MypageSidebar member={normalizedMember} activeTab="history" />

          <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  #구매 내역 상세
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {shopItem?.it_name || '그래프잇 진단검사'} 신청 및 결제 상세 내역입니다.
                </p>
              </div>
              <Link
                href="/mypage"
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                ← 목록으로 돌아가기
              </Link>
            </div>

            {shopItem && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6">
                <img
                  src={
                    shopItem.it_img1
                      ? shopItem.it_img1.startsWith('data:') ||
                        shopItem.it_img1.startsWith('http') ||
                        shopItem.it_img1.startsWith('/')
                        ? shopItem.it_img1
                        : `/data/item/${shopItem.it_img1}`
                      : '/data/common/mobile_logo_img.png'
                  }
                  alt={shopItem.it_name}
                  className="w-16 h-16 rounded-xl object-contain p-1 border border-slate-200 bg-white"
                />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">{shopItem.it_name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    대상: {shopItem.it_1 || '전연령'} | 권장연령: {shopItem.it_2 || '-'} | 소요시간: {shopItem.it_3 || '50'}분
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                    <th className="py-3.5 px-4">신청번호(주문번호)</th>
                    <th className="py-3.5 px-4">검사명</th>
                    <th className="py-3.5 px-4">결제/신청방식</th>
                    <th className="py-3.5 px-4 text-right">결제금액</th>
                    <th className="py-3.5 px-4 text-center">진행상태</th>
                    <th className="py-3.5 px-4">신청일시</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myTestsForItem.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        해당 검사의 신청 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    myTestsForItem.map((t) => {
                      const od = orderMap.get(String(t.od_id));
                      const settleCase = t.group_code
                        ? `단체코드 (${t.group_code})`
                        : od?.od_settle_case || '일반신청';
                      const price = t.group_code
                        ? 0
                        : Number(od?.od_receipt_price || od?.od_cart_price || shopItem?.it_price || 0);

                      return (
                        <tr key={t.test_no} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                            {t.od_id || `TEST-${t.test_no}`}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {t.it_name || shopItem?.it_name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">{settleCase}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {price.toLocaleString()}원
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                t.test_status === '완료'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : t.test_status === '진행중'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {t.test_status || '시작전'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {t.test_datetime || od?.od_time || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
