import { NextRequest, NextResponse } from "next/server";
import { getDb, formatKstDate } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { group_code, it_id } = await req.json();
    if (!group_code) {
      return NextResponse.json({ ok: false, message: "단체코드를 입력해주세요." });
    }

    const db = await getDb();
    const codeClean = String(group_code).trim().toUpperCase();

    // Match group_code (and it_id if specified)
    const groupRow = db.graphit_group.find(
      (g) =>
        String(g.group_code || "").trim().toUpperCase() === codeClean &&
        (!it_id || String(g.it_id) === String(it_id))
    ) || db.graphit_group.find(
      (g) => String(g.group_code || "").trim().toUpperCase() === codeClean
    );

    if (!groupRow) {
      return NextResponse.json({ ok: false, message: "단체코드를 확인해주세요." });
    }

    const owner = db.g5_member.find((m) => m.mb_id === groupRow.mb_id && Number(m.mb_level) === 3);
    const groupName = owner?.mb_8 || groupRow.mb_id || "";
    const today = formatKstDate();

    return NextResponse.json({
      ok: true,
      result: "ok",
      group_code: groupRow.group_code,
      group_name: groupName,
      group_end: groupRow.group_end,
      it_id: String(groupRow.it_id),
      is_expired_date: groupRow.group_end ? groupRow.group_end < today : false,
      message: "인증되었습니다.",
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "단체코드 확인 중 오류가 발생했습니다." }, { status: 500 });
  }
}
