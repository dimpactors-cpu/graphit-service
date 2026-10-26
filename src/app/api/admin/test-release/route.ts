import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getSessionUser();
    if (!user || Number(user.mb_level) < 9) {
      return NextResponse.json(
        { ok: false, message: "통합관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { test_no, test_nos, result_open } = body;

    const db = await getDb();
    const targetNos = new Set<number>();
    if (Array.isArray(test_nos)) {
      for (const n of test_nos) targetNos.add(Number(n));
    }
    if (test_no !== undefined && test_no !== null) {
      targetNos.add(Number(test_no));
    }

    if (targetNos.size === 0) {
      return NextResponse.json(
        { ok: false, message: "대상 검사 번호가 지정되지 않았습니다." },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    for (const t of db.graphit_test) {
      if (targetNos.has(Number(t.test_no))) {
        t.result_open = Boolean(result_open);
        updatedCount++;
      }
    }

    await saveDb(db);

    return NextResponse.json({
      ok: true,
      updatedCount,
      result_open: Boolean(result_open),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        message: err?.message || "결과 공개 설정 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
