import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, formatKstNow } from "@/lib/db";
import { createHash } from "@/lib/password";
import { signToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mb_id,
      mb_password,
      mb_name,
      mb_nick,
      mb_email,
      mb_sex,
      mb_birth,
      mb_hp,
      mb_tel,
      mb_zip1,
      mb_zip2,
      mb_addr1,
      mb_addr2,
      mb_addr3,
      mb_mailling,
      mb_sms,
    } = body;

    if (!mb_id || !mb_password || !mb_name) {
      return NextResponse.json({ ok: false, message: "필수 항목(아이디, 비밀번호, 이름)을 입력해주세요." }, { status: 400 });
    }

    const db = await getDb();
    const exists = db.g5_member.some((m) => m.mb_id.toLowerCase() === String(mb_id).trim().toLowerCase());
    if (exists) {
      return NextResponse.json({ ok: false, message: "이미 사용중인 아이디(이메일)입니다." }, { status: 400 });
    }

    const maxNo = db.g5_member.reduce((acc, m) => Math.max(acc, Number(m.mb_no || 0)), 0);
    const now = formatKstNow();

    const newMember = {
      mb_no: maxNo + 1,
      mb_id: String(mb_id).trim(),
      mb_password: createHash(String(mb_password)),
      mb_name: String(mb_name).trim(),
      mb_nick: String(mb_nick || mb_name).trim(),
      mb_email: String(mb_email || mb_id).trim(),
      mb_level: 2,
      mb_sex: mb_sex || "남자",
      mb_birth: mb_birth || "",
      mb_tel: mb_tel || mb_hp || "",
      mb_hp: mb_hp || "",
      mb_zip1: mb_zip1 || "",
      mb_zip2: mb_zip2 || "",
      mb_addr1: mb_addr1 || "",
      mb_addr2: mb_addr2 || "",
      mb_addr3: mb_addr3 || "",
      mb_addr_jibeon: "",
      mb_point: 0,
      mb_today_login: now,
      mb_datetime: now,
      mb_leave_date: "",
      mb_intercept_date: "",
      mb_memo: "",
      mb_mailling: mb_mailling ? 1 : 0,
      mb_sms: mb_sms ? 1 : 0,
      mb_1: "",
      mb_2: "",
      mb_3: "",
      mb_4: "",
      mb_5: "",
      mb_6: "",
      mb_7: "",
      mb_8: "",
      mb_9: "",
      mb_10: "",
      mb_conum: null,
      mb_coemail: null,
      it_name: null,
      test_datetime: null,
      test_status: "시작전",
      group_name: null,
      test_end: null,
      group_code: "",
    };

    db.g5_member.unshift(newMember);
    await saveDb(db);

    const token = signToken({
      mb_id: newMember.mb_id,
      mb_name: newMember.mb_name,
      mb_nick: newMember.mb_nick,
      mb_level: 2,
    });

    const res = NextResponse.json({ ok: true, member: newMember });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "회원가입 중 오류가 발생했습니다." }, { status: 500 });
  }
}
