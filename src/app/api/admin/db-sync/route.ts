import { NextRequest, NextResponse } from "next/server";
import { getDb, syncRelationalTablesToCloud } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = getSessionUser();
  if (!user || user.mb_level < 9) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const db = await getDb();
  const hasCloudUrl = Boolean(process.env.DATABASE_URL);

  return NextResponse.json({
    ok: true,
    hasCloudUrl,
    mode: hasCloudUrl ? "Cloud PostgreSQL (Supabase / Neon)" : "내장 백업 DB + 런타임 영구 저장소 (DATABASE_URL 설정 시 즉시 클라우드 전환)",
    counts: {
      g5_member: db.g5_member.length,
      g5_shop_item: db.g5_shop_item.length,
      graphit_group: db.graphit_group.length,
      graphit_qa: db.graphit_qa.length,
      graphit_item: db.graphit_item.length,
      graphit_test: db.graphit_test.length,
      graphit_item_test: db.graphit_item_test.length,
      g5_shop_order: db.g5_shop_order.length,
    },
  });
}

export async function POST(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.mb_level < 9) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const result = await syncRelationalTablesToCloud(body.databaseUrl);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "동기화 오류" }, { status: 500 });
  }
}
