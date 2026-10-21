import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getDb, getSiteConfig, resolveImageUrl } from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import QuickGroupCodeBar from "@/components/QuickGroupCodeBar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = getSessionUser();
  const db = await getDb();
  const siteConfig = getSiteConfig(db);

  // Active items (plus all items in ca_id 10)
  const activeItems = db.g5_shop_item.filter((it) => Number(it.it_use) === 1);
  const allItems = db.g5_shop_item;
  const extraTopBanners = (siteConfig.extra_banners || []).filter(
    (b) => b.position === "top" && b.is_visible
  );
  const extraBottomBanners = (siteConfig.extra_banners || []).filter(
    (b) => b.position === "bottom" && b.is_visible
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader user={user} siteConfig={siteConfig} />

      {/* 상단 배너 (관리자 배너·로고 설정 연동) */}
      {siteConfig.top_banner.is_visible && (
        <div
          className="w-full"
          style={{
            backgroundColor: siteConfig.top_banner.bg_color || "#FFCFDE",
          }}
        >
          <div id="sidx" className="flex justify-center">
            <Link
              href={siteConfig.top_banner.link_url || "/shop/item/1698900476"}
              className="block"
            >
              <img
                src={siteConfig.top_banner.image_url || "/data/banner/1.png"}
                alt={siteConfig.top_banner.alt_text}
                className="max-w-full h-auto mx-auto"
              />
            </Link>
          </div>
        </div>
      )}

      {/* 추가 상단 배너 */}
      {extraTopBanners.map((bn) => (
        <div
          key={bn.id}
          className="w-full"
          style={{ backgroundColor: bn.bg_color || "#ffffff" }}
        >
          <div id="sidx" className="flex justify-center">
            <Link href={bn.link_url || "#"} className="block">
              <img
                src={bn.image_url}
                alt={bn.title}
                className="max-w-full h-auto mx-auto"
              />
            </Link>
          </div>
        </div>
      ))}

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
              const imgSrc = resolveImageUrl(
                item.it_img1,
                "/data/item",
                siteConfig.logo_url || "/data/common/mobile_logo_img.png"
              );

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
                        <span className="text-xs text-gray-400 block">
                          검사 비용 (단체코드 0원)
                        </span>
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

          {/* 단체코드 빠른 입력 바 */}
          <QuickGroupCodeBar />

          {/* 전체 등록 검사 및 빠른 메뉴 */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm sm:text-base text-gray-800">
                이미 신청하셨거나 진행 중인 검사가 있으신가요?
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
                    <div className="text-[11px] text-gray-400">
                      {it.it_4} · {it.it_1}
                    </div>
                  </div>
                  <span className="text-[#0066F9] font-semibold">상세 →</span>
                </Link>
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* 추가 하단 배너 */}
      {extraBottomBanners.map((bn) => (
        <div
          key={bn.id}
          className="w-full"
          style={{ backgroundColor: bn.bg_color || "#ffffff" }}
        >
          <div id="sidx" className="flex justify-center">
            <a
              href={bn.link_url || "#"}
              target={bn.open_new_tab ? "_blank" : undefined}
              rel={bn.open_new_tab ? "noreferrer" : undefined}
              className="block"
            >
              <img
                src={bn.image_url}
                alt={bn.title}
                className="max-w-full h-auto mx-auto"
              />
            </a>
          </div>
        </div>
      ))}

      {/* 하단 배너 (관리자 배너·로고 설정 연동) */}
      {siteConfig.bottom_banner.is_visible && (
        <div
          className="w-full"
          style={{
            backgroundColor: siteConfig.bottom_banner.bg_color || "#D5E1EF",
          }}
        >
          <div id="sidx" className="flex justify-center">
            <a
              href={
                siteConfig.bottom_banner.link_url ||
                "https://pf.kakao.com/_HxhcYxj/chat"
              }
              target={siteConfig.bottom_banner.open_new_tab ? "_blank" : "_self"}
              rel="noreferrer"
              className="block"
            >
              <img
                src={siteConfig.bottom_banner.image_url || "/data/banner/2.png"}
                alt={siteConfig.bottom_banner.alt_text}
                className="max-w-full h-auto mx-auto"
              />
            </a>
          </div>
        </div>
      )}

      <SiteFooter siteConfig={siteConfig} />
    </div>
  );
}
