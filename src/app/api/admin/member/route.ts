import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, formatKstNow } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createHash } from "@/lib/password";

function checkAdmin() {
  const user = getSessionUser();
  return user && user.mb_level >= 9;
}

export async function POST(req: NextRequest) {
  if (!checkAdmin()) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const db = await getDb();

    if (!body.mb_id || !body.mb_name) {
      return NextResponse.json({ ok: false, message: "아이디와 이름을 입력해주세요." }, { status: 400 });
    }

    if (db.g5_member.some((m) => m.mb_id.toLowerCase() === String(body.mb_id).trim().toLowerCase())) {
      return NextResponse.json({ ok: false, message: "이미 존재하는 아이디입니다." }, { status: 400 });
    }

    const maxNo = db.g5_member.reduce((acc, m) => Math.max(acc, Number(m.mb_no || 0)), 0);
    const now = formatKstNow();

    const newMember = {
      mb_no: maxNo + 1,
      mb_id: String(body.mb_id).trim(),
      mb_password: createHash(String(body.mb_password || "1234")),
      mb_name: String(body.mb_name).trim(),
      mb_nick: String(body.mb_nick || body.mb_name).trim(),
      mb_email: String(body.mb_email || body.mb_id).trim(),
      mb_level: Number(body.mb_level || 3),
      mb_sex: body.mb_sex || "남자",
      mb_birth: body.mb_birth || "",
      mb_tel: body.mb_tel || "",
      mb_hp: body.mb_hp || "",
      mb_zip1: body.mb_zip1 || "",
      mb_zip2: body.mb_zip2 || "",
      mb_addr1: body.mb_addr1 || "",
      mb_addr2: body.mb_addr2 || "",
      mb_addr3: body.mb_addr3 || "",
      mb_addr_jibeon: "",
      mb_point: 0,
      mb_today_login: now,
      mb_datetime: now,
      mb_leave_date: "",
      mb_intercept_date: "",
      mb_memo: body.mb_memo || "",
      mb_mailling: 1,
      mb_sms: 1,
      mb_1: "",
      mb_2: "",
      mb_3: "",
      mb_4: "",
      mb_5: "",
      mb_6: "",
      mb_7: body.mb_7 || "",
      mb_8: body.mb_8 || "",
      mb_9: "",
      mb_10: body.mb_10 || "",
      mb_conum: body.mb_conum || "",
      mb_coemail: body.mb_coemail || "",
      it_name: null,
      test_datetime: null,
      test_status: "",
      group_name: body.mb_8 || "",
      test_end: null,
      group_code: body.mb_7 || "",
    };

    db.g5_member.unshift(newMember);

    if (body.initial_group_code && String(body.initial_group_code).trim() !== "") {
      const codeClean = String(body.initial_group_code).trim();
      const exists = db.graphit_group.some(
        (g) => String(g.group_code).trim().toUpperCase() === codeClean.toUpperCase()
      );
      if (!exists) {
        const maxGroupNo = db.graphit_group.reduce(
          (acc, g) => Math.max(acc, Number(g.group_no || 0)),
          0
        );
        db.graphit_group.unshift({
          group_no: maxGroupNo + 1,
          group_code: codeClean,
          group_end: String(body.initial_group_end || "2026-12-31"),
          group_member: Number(body.initial_group_member || 30),
          mb_id: newMember.mb_id,
          it_id: String(body.initial_it_id || db.g5_shop_item[0]?.it_id || "1698900476"),
          reg_datetime: now,
        });
        newMember.mb_7 = codeClean;
        newMember.group_code = codeClean;
      }
    }

    await saveDb(db);

    return NextResponse.json({ ok: true, member: newMember });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAdmin()) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { mb_id, new_password } = body;
    const db = await getDb();
    const member = db.g5_member.find((m) => m.mb_id === mb_id);

    if (!member) {
      return NextResponse.json({ ok: false, message: "존재하지 않는 회원자료입니다." }, { status: 404 });
    }

    if (new_password && String(new_password).trim() !== "") {
      member.mb_password = createHash(String(new_password).trim());
    }

    const fields = [
      "mb_name",
      "mb_nick",
      "mb_email",
      "mb_sex",
      "mb_birth",
      "mb_hp",
      "mb_tel",
      "mb_zip1",
      "mb_zip2",
      "mb_addr1",
      "mb_addr2",
      "mb_addr3",
      "mb_memo",
      "mb_7",
      "mb_8",
      "mb_10",
      "mb_conum",
      "mb_coemail",
      "mb_level",
    ] as const;

    for (const f of fields) {
      if (body[f] !== undefined) {
        (member as any)[f] = body[f];
      }
    }

    await saveDb(db);
    return NextResponse.json({ ok: true, message: "저장되었습니다." });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}
