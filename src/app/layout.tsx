import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "그래프잇 (Graphit) - 온라인 진단검사 및 수강생 신청이력 조회 서비스",
  description: "주식회사 에스엘더블유랩 그래프잇(그래프미) 온라인 진로역량 진단검사 및 수강생 신청이력 조회 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-white text-[#191919]">
        {children}
      </body>
    </html>
  );
}
