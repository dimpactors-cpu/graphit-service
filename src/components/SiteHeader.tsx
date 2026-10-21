import Link from "next/link";
import { SessionPayload } from "@/lib/auth";

export default function SiteHeader({ user }: { user: SessionPayload | null }) {
  return (
    <>
      {user && user.mb_level >= 9 && (
        <div className="bg-[#333] text-white text-xs shadow-sm">
          <div className="max-w-[1080px] mx-auto px-4 flex items-center justify-between h-10">
            <span>
              <strong className="text-[#e14d64] font-bold">관리자</strong> ({user.mb_name})로 접속하셨습니다.
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/adm"
                className="bg-[#e14d64] hover:bg-[#c83b52] text-white px-3 py-1.5 rounded font-semibold transition"
              >
                관리자 대시보드 (ADMIN)
              </Link>
            </div>
          </div>
        </div>
      )}

      <header className="w-full border-b border-gray-100 bg-white">
        <div id="sidx" className="py-5 flex items-center justify-between">
          <Link href="/" className="inline-block">
            <img
              src="/data/common/mobile_logo_img.png"
              alt="그래프잇 메인"
              className="w-[140px] sm:w-[152px] h-auto"
            />
          </Link>

          <ul className="flex items-center gap-3 sm:gap-5 text-sm sm:text-base font-medium text-[#222]">
            {user ? (
              <>
                <li className="text-gray-700">
                  <span className="font-semibold text-[#0066F9]">{user.mb_nick || user.mb_name}</span> 님
                  {user.mb_level === 3 && (
                    <span className="ml-1.5 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                      단체회원
                    </span>
                  )}
                </li>
                <li>
                  <Link href="/mypage" className="hover:text-[#0066F9] transition">
                    {user.mb_level === 3 ? "단체관리페이지" : "마이페이지"}
                  </Link>
                </li>
                {user.mb_level >= 9 && (
                  <li>
                    <Link href="/adm" className="text-[#e14d64] font-semibold hover:underline">
                      관리자
                    </Link>
                  </li>
                )}
                <li>
                  <a href="/api/auth/logout" className="text-gray-500 hover:text-black transition">
                    로그아웃
                  </a>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login" className="hover:text-[#0066F9] transition">
                    로그인
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-[#0066F9] transition">
                    회원가입
                  </Link>
                </li>
                <li>
                  <Link href="/mypage" className="hover:text-[#0066F9] transition">
                    마이페이지
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </header>
    </>
  );
}
