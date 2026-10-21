import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDb, resolveImageUrl } from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default async function ShopItemDetailPage({
  params,
}: {
  params: { it_id: string };
}) {
  const user = getSessionUser();
  const db = await getDb();

  const item = db.g5_shop_item.find((it) => String(it.it_id) === String(params.it_id));
  if (!item) {
    return notFound();
  }

  const qCount = db.graphit_item.filter((gi) => String(gi.it_id) === String(item.it_id)).length;
  const imgSrc = resolveImageUrl(item.it_img1, "/data/item", "/data/common/mobile_logo_img.png");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader user={user} />

      <main className="flex-1 py-10">
        <div id="sidx">
          {/* 상단 상품 요약 및 신청 박스 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm bg-white">
            <div className="md:col-span-5 flex items-center justify-center bg-gray-50 rounded-xl p-6 border border-gray-100">
              <img
                src={imgSrc}
                alt={item.it_name}
                className="max-h-72 max-w-full object-contain"
              />
            </div>

            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-[#0066F9] bg-blue-50 px-2.5 py-1 rounded">
                    {item.it_4 || "GRAPHME"}
                  </span>
                  <span className="text-xs text-gray-500">코드: {item.it_id}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-[#191919]">
                  {item.it_name}
                </h1>

                {item.it_basic && (
                  <p className="text-sm text-gray-600 mt-2">{item.it_basic}</p>
                )}

                <div className="mt-6 border-t border-b border-gray-100 py-4 space-y-2.5 text-sm">
                  <div className="flex items-center">
                    <span className="w-32 text-gray-500 font-medium">검사 대상</span>
                    <span className="font-semibold text-gray-800">{item.it_1 || "-"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-gray-500 font-medium">최적 연령</span>
                    <span className="font-semibold text-gray-800">{item.it_2 ? `${item.it_2}세 이상` : "-"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-gray-500 font-medium">문항수 / 소요시간</span>
                    <span className="font-semibold text-gray-800">
                      총 {qCount}문항 / 평균 {item.it_3 || 60}분 내외
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/shop/orderform?it_id=${item.it_id}`}
                  className="flex-1 text-center bg-[#0066F9] hover:bg-[#0052cc] text-white font-bold py-3.5 px-6 rounded-xl text-base transition shadow-sm"
                >
                  검사 신청하기
                </Link>
                <Link
                  href="/mypage"
                  className="text-center border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-5 rounded-xl text-sm transition"
                >
                  마이페이지
                </Link>
              </div>
            </div>
          </div>

          {/* 상품 상세 설명 (it_explan) */}
          {item.it_explan && (
            <div className="mt-10 border-t border-gray-200 pt-10">
              <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">
                상세 안내
              </h2>
              <div
                className="prose max-w-none mx-auto text-center [&_img]:mx-auto [&_img]:max-w-full [&_img]:h-auto"
                dangerouslySetInnerHTML={{ __html: item.it_explan }}
              />
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
