import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, formatKstDate } from "@/lib/db";
import { getSessionUser, SESSION_COOKIE_NAME, signToken } from "@/lib/auth";
import { createHash } from "@/lib/password";

export async function PUT(req: NextRequest) {
  try {
    const user = getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const db = await getDb();
    const member = db.g5_member.find((m) => m.mb_id === user.mb_id);
    if (!member) {
      return NextResponse.json({ ok: false, message: "회원 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    if (body.mb_name) member.mb_name = body.mb_name;
    if (body.mb_nick) member.mb_nick = body.mb_nick;
    if (body.mb_email) member.mb_email = body.mb_email;
    if (body.mb_hp !== undefined) member.mb_hp = body.mb_hp;
    if (body.mb_tel !== undefined) member.mb_tel = body.mb_tel;
    if (body.mb_sex !== undefined) member.mb_sex = body.mb_sex;
    if (body.mb_birth !== undefined) member.mb_birth = body.mb_birth;
    if (body.mb_zip1 !== undefined) member.mb_zip1 = body.mb_zip1;
    if (body.mb_zip2 !== undefined) member.mb_zip2 = body.mb_zip2;
    if (body.mb_addr1 !== undefined) member.mb_addr1 = body.mb_addr1;
    if (body.mb_addr2 !== undefined) member.mb_addr2 = body.mb_addr2;
    if (body.mb_addr3 !== undefined) member.mb_addr3 = body.mb_addr3;
    if (body.mb_password && String(body.mb_password).trim() !== "") {
      member.mb_password = createHash(String(body.mb_password).trim());
    }

    await saveDb(db);

    const token = signToken({
      mb_id: member.mb_id,
      mb_name: member.mb_name,
      mb_nick: member.mb_nick || member.mb_name,
      mb_level: Number(member.mb_level || 2),
      mb_8: member.mb_8 || "",
      mb_7: member.mb_7 || "",
    });

    const res = NextResponse.json({ ok: true, message: "개인정보가 수정되었습니다." });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
    }
    if (user.mb_level >= 10) {
      return NextResponse.json({ ok: false, message: "최고관리자는 탈퇴할 수 없습니다." }, { status: 400 });
    }

    const db = await getDb();
    const member = db.g5_member.find((m) => m.mb_id === user.mb_id);
    if (member) {
      member.mb_leave_date = formatKstDate().replace(/-/g, "");
      await saveDb(db);
    }

    const res = NextResponse.json({ ok: true, message: "회원 탈퇴 처리가 완료되었습니다." });
    res.cookies.set(SESSION_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "오류가 발생했습니다." }, { status: 500 });
  }
}
