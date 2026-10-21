import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = getSessionUser();
  const db = await getDb();

  // Active items (plus all items in ca_id 10)
  const activeItems = db.g5_shop_item.filter((it) => Number(it.it_use) === 1);
  const allItems = db.g5_shop_item;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader user={user} />

      {/* 상단 배너 (boxbanner10.skin.php - 상단배너) */}
      <div className="w-full" style={{ backgroundColor: "#fff3b8" }}>
        <div id="sidx" className="flex justify-center">
          <Link href="/shop/item/1698900476" className="block">
            <img
              src="/data/banner/1.png"
              alt="상단배너 - 그래프미 CAU 전용"
              className="max-w-full h-auto mx-auto"
            />
          </Link>
        </div>
      </div>

      {/* 온라인 진단검사 상품 섹션 */}
      <section className="py-14 bg-white">
        <div id="sidx">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold tracking-wider uppercase text-[#0066F9] bg-blue-50 px-3 py-1 rounded-full mb-2">
              GRAPHIT ONLINE ASSESSMENT
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#222]">
              어떤 검사를 찾으시나요?
            </h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2">
              개인 신청 또는 단체코드를 인증하여 온라인 진로·역량 진단을 바로 시작하실 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeItems.map((item) => {
              const qCount = db.graphit_item.filter(
                (gi) => String(gi.it_id) === String(item.it_id)
              ).length;
              const imgSrc = item.it_img1
                ? `/data/item/${item.it_img1}`
                : "/data/common/mobile_logo_img.png";

              return (
                <div
                  key={item.it_id}
                  className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col bg-white"
                >
                  <Link
                    href={`/shop/item/${item.it_id}`}
                    className="h-48 bg-gray-50 flex items-center justify-center p-4 overflow-hidden border-b border-gray-100"
                  >
                    <img
                      src={imgSrc}
                      alt={item.it_name}
                      className="max-h-full max-w-full object-contain hover:scale-105 transition"
                    />
                  </Link>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-[#0066F9] bg-blue-50 px-2.5 py-0.5 rounded">
                          {item.it_4 || "GRAPHME"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {qCount}문항 · 약 {item.it_3 || 60}분
                        </span>
                      </div>
                      <Link href={`/shop/item/${item.it_id}`}>
                        <h3 className="text-lg font-bold text-[#191919] hover:text-[#0066F9] transition">
                          {item.it_name}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                        대상: {item.it_1 || "전 연령"} (최적연령 {item.it_2 || 20}세+)
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 block">검사 비용 (단체코드 0원)</span>
                        <strong className="text-lg font-extrabold text-[#191919]">
                          {Number(item.it_price || 0) === 0
                            ? "무료 (인터벌)"
                            : `${Number(item.it_price).toLocaleString()}원`}
                        </strong>
                      </div>
                      <Link
                        href={`/shop/item/${item.it_id}`}
                        className="bg-[#0066F9] hover:bg-[#0052cc] text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                      >
                        신청하기 →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 전체 등록 검사 및 빠른 메뉴 */}
          <div className="mt-10 bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm sm:text-base text-gray-800">
                이미 신청하셨거나 단체코드를 보유하고 계신가요?
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                마이페이지에서 신청이력·검사현황 조회 및 이어하기가 가능하며, 단체회원은 단체 진행현황을 실시간 확인할 수 있습니다.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/mypage"
                className="bg-[#222] hover:bg-black text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg transition"
              >
                검사내역 / 신청이력 조회
              </Link>
              {user && user.mb_level >= 9 ? (
                <Link
                  href="/adm"
                  className="bg-[#e14d64] hover:bg-[#c83b52] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                  관리자 현황판
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>

          {/* 비노출(과거) 검사 아카이브 목록 */}
          <details className="mt-6 text-xs text-gray-500">
            <summary className="cursor-pointer font-medium hover:text-gray-800">
              전체 등록 검사 프로그램 목록 보기 ({allItems.length}종)
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {allItems.map((it) => (
                <Link
                  key={it.it_id}
                  href={`/shop/item/${it.it_id}`}
                  className="p-3 rounded border border-gray-200 hover:border-[#0066F9] bg-white flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-gray-800">{it.it_name}</div>
                    <div className="text-[11px] text-gray-400">{it.it_4} · {it.it_1}</div>
                  </div>
                  <span className="text-[#0066F9] font-semibold">상세 →</span>
                </Link>
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* 중앙 배너 (boxbanner10.skin.php - 배너중앙) */}
      <div className="w-full" style={{ backgroundColor: "#000000" }}>
        <div id="sidx" className="flex justify-center">
          <a
            href="https://pf.kakao.com/_HxhcYxj/chat"
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <img
              src="/data/banner/2.png"
              alt="배너중앙 - 카카오톡 문의"
              className="max-w-full h-auto mx-auto"
            />
          </a>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
