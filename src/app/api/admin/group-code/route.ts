import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, formatKstNow } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.mb_level < 9) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { group_code, group_end, group_member, mb_id, it_id } = body;

    if (!group_code || !group_end || !group_member || !mb_id || !it_id) {
      return NextResponse.json({ ok: false, message: "모든 항목을 입력해주세요." }, { status: 400 });
    }

    const db = await getDb();
    const codeClean = String(group_code).trim();

    if (db.graphit_group.some((g) => String(g.group_code).toUpperCase() === codeClean.toUpperCase())) {
      return NextResponse.json({ ok: false, message: "이미 등록된 단체코드입니다." }, { status: 400 });
    }

    const maxGroupNo = db.graphit_group.reduce((acc, g) => Math.max(acc, Number(g.group_no || 0)), 0);
    const newGroup = {
      group_no: maxGroupNo + 1,
      group_code: codeClean,
      group_end: String(group_end),
      group_member: Number(group_member),
      mb_id: String(mb_id),
      it_id: String(it_id),
      reg_datetime: formatKstNow(),
    };

    db.graphit_group.unshift(newGroup);

    // Also update member.mb_7 to latest group_code
    const member = db.g5_member.find((m) => m.mb_id === mb_id);
    if (member) {
      member.mb_7 = codeClean;
    }

    await saveDb(db);
    return NextResponse.json({ ok: true, group: newGroup });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "등록 실패" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.mb_level < 9) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const group_code = searchParams.get("group_code");
    if (!group_code) {
      return NextResponse.json({ ok: false, message: "삭제할 단체코드를 선택해주세요." }, { status: 400 });
    }

    const db = await getDb();
    const usedCnt = db.graphit_test.filter((t) => t.group_code === group_code).length;
    if (usedCnt > 0) {
      return NextResponse.json(
        { ok: false, message: "해당 단체코드로 진행 중인 검사 내역이 있어 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    db.graphit_group = db.graphit_group.filter((g) => g.group_code !== group_code);
    await saveDb(db);

    return NextResponse.json({ ok: true, message: "삭제되었습니다." });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "삭제 실패" }, { status: 500 });
  }
}
