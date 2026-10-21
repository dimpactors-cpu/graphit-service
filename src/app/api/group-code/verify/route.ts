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
    const groupRow =
      db.graphit_group.find(
        (g) =>
          String(g.group_code || "").trim().toUpperCase() === codeClean &&
          (!it_id || String(g.it_id) === String(it_id))
      ) ||
      db.graphit_group.find(
        (g) => String(g.group_code || "").trim().toUpperCase() === codeClean
      );

    const today = formatKstDate();

    if (groupRow) {
      const owner = db.g5_member.find(
        (m) => m.mb_id === groupRow.mb_id && Number(m.mb_level) === 3
      );
      const groupName = owner?.mb_8 || groupRow.mb_id || "";
      const matchedItem = db.g5_shop_item.find(
        (it) => String(it.it_id) === String(groupRow.it_id)
      );

      return NextResponse.json({
        ok: true,
        result: "ok",
        group_code: groupRow.group_code,
        group_name: groupName,
        group_end: groupRow.group_end,
        it_id: String(groupRow.it_id),
        it_name: matchedItem?.it_name || "",
        is_expired_date: groupRow.group_end ? groupRow.group_end < today : false,
        message: "인증되었습니다.",
      });
    }

    // Fallback: match group member's mb_7, group_code, mb_id, or mb_8 if a group member was created directly
    const groupMember = db.g5_member.find(
      (m) =>
        Number(m.mb_level) === 3 &&
        (String(m.mb_7 || "").trim().toUpperCase() === codeClean ||
          String(m.group_code || "").trim().toUpperCase() === codeClean ||
          String(m.mb_id || "").trim().toUpperCase() === codeClean ||
          String(m.mb_8 || "").trim().toUpperCase() === codeClean)
    );

    if (groupMember) {
      const resolvedCode =
        groupMember.mb_7 || groupMember.group_code || String(group_code).trim();
      return NextResponse.json({
        ok: true,
        result: "ok",
        group_code: resolvedCode,
        group_name: groupMember.mb_8 || groupMember.mb_name || groupMember.mb_id,
        group_end: "2026-12-31",
        it_id: String(it_id || "1698900476"),
        is_expired_date: false,
        message: "인증되었습니다.",
      });
    }

    return NextResponse.json({ ok: false, message: "단체코드를 확인해주세요." });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "단체코드 확인 중 오류가 발생했습니다." }, { status: 500 });
  }
}
