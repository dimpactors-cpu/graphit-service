import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, saveDb, formatKstNow, MY_ANSWERS_COOKIE } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const MY_TESTS_COOKIE = "graphit_my_tests";

export async function POST(req: NextRequest) {
  try {
    const user = getSessionUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "로그인 후 이용하실 수 있습니다." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      it_id,
      group_code,
      od_name,
      od_email,
      od_hp,
      od_tel,
      od_zip1,
      od_zip2,
      od_addr1,
      od_addr2,
      od_addr3,
      od_settle_case,
    } = body;

    const db = await getDb();
    let item =
      db.g5_shop_item.find((it) => String(it.it_id) === String(it_id)) ||
      db.g5_shop_item[0];
    if (!item) {
      return NextResponse.json(
        { ok: false, message: "선택한 검사 상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const member = db.g5_member.find((m) => m.mb_id === user.mb_id);
    const now = formatKstNow();
    const compactTs = now.replace(/[- :]/g, "");
    const randSuffix = String(Math.floor(10 + Math.random() * 89));
    const od_id = `${compactTs}${randSuffix}`;

    if (!group_code || String(group_code).trim() === "") {
      return NextResponse.json(
        { ok: false, message: "단체코드를 입력하고 인증해 주세요." },
        { status: 400 }
      );
    }

    const codeClean = String(group_code).trim().toUpperCase();
    const gRow = db.graphit_group.find(
      (g) => String(g.group_code || "").trim().toUpperCase() === codeClean
    );
    const groupMember = !gRow
      ? db.g5_member.find(
          (m) =>
            Number(m.mb_level) === 3 &&
            (String(m.mb_7 || "").trim().toUpperCase() === codeClean ||
              String(m.group_code || "").trim().toUpperCase() === codeClean ||
              String(m.mb_id || "").trim().toUpperCase() === codeClean ||
              String(m.mb_8 || "").trim().toUpperCase() === codeClean)
        )
      : undefined;

    if (!gRow && !groupMember) {
      return NextResponse.json(
        { ok: false, message: "유효하지 않은 단체코드입니다. 단체코드를 확인해 주세요." },
        { status: 400 }
      );
    }

    let resolvedGroupCode = gRow
      ? gRow.group_code
      : groupMember?.mb_7 || groupMember?.group_code || String(group_code).trim();
    let resolvedGroupName = "";
    let finalPrice = 0;
    const odStatus = "입금";

    if (gRow) {
      if (gRow.it_id) {
        const groupItem = db.g5_shop_item.find(
          (it) => String(it.it_id) === String(gRow.it_id)
        );
        if (groupItem) {
          item = groupItem;
        }
      }
      const gOwner = db.g5_member.find(
        (m) => m.mb_id === gRow.mb_id && Number(m.mb_level) === 3
      );
      resolvedGroupName = gOwner?.mb_8 || "";
    } else if (groupMember) {
      resolvedGroupName =
        groupMember.mb_8 || groupMember.mb_name || groupMember.mb_id || "";
    }

    const newOrder = {
      od_id,
      mb_id: user.mb_id,
      od_name: od_name || member?.mb_name || user.mb_name,
      od_email: od_email || member?.mb_email || "",
      od_tel: od_tel || od_hp || member?.mb_tel || member?.mb_hp || "",
      od_hp: od_hp || member?.mb_hp || "",
      od_zip1: od_zip1 || member?.mb_zip1 || "",
      od_zip2: od_zip2 || member?.mb_zip2 || "",
      od_addr1: od_addr1 || member?.mb_addr1 || "",
      od_addr2: od_addr2 || member?.mb_addr2 || "",
      od_addr3: od_addr3 || member?.mb_addr3 || "",
      od_cart_count: 1,
      od_cart_price: finalPrice,
      od_send_cost: 0,
      od_receipt_price: finalPrice,
      od_cancel_price: 0,
      od_misu: 0,
      od_status: odStatus,
      od_settle_case: resolvedGroupCode
        ? "단체코드인증"
        : od_settle_case || "무통장",
      od_time: now,
      od_delivery_company: "",
      od_invoice: "",
    };

    db.g5_shop_order.unshift(newOrder);

    // Clear previous answers for this (mb_id, it_id) so a newly applied test starts from question 1
    for (const ans of db.graphit_item_test) {
      if (ans.mb_id === user.mb_id && String(ans.it_id) === String(item.it_id)) {
        ans.test_answer = "";
        ans.reg_datetime = now;
      }
    }

    const maxTestNo = db.graphit_test.reduce(
      (acc, t) => Math.max(acc, Number(t.test_no || 0)),
      0
    );
    const newTest = {
      test_no: maxTestNo + 1,
      mb_name: od_name || member?.mb_name || user.mb_name,
      mb_id: user.mb_id,
      mb_hp: od_hp || member?.mb_hp || "",
      it_id: String(item.it_id),
      it_name: item.it_name,
      group_code: resolvedGroupCode,
      group_name: resolvedGroupName,
      test_status: "시작전",
      od_id,
      test_datetime: now,
      end_datetime: null,
    };

    db.graphit_test.unshift(newTest);

    if (member) {
      member.group_code = resolvedGroupCode;
      member.it_name = item.it_name;
      member.test_status = "시작전";
    }

    await saveDb(db);

    // Also persist to cookie so serverless functions on Vercel immediately see the new test
    let existingCookieTests: any[] = [];
    try {
      const rawCookie = cookies().get(MY_TESTS_COOKIE)?.value;
      if (rawCookie) {
        existingCookieTests = JSON.parse(
          Buffer.from(rawCookie, "base64url").toString("utf-8")
        );
      }
    } catch {
      existingCookieTests = [];
    }

    const updatedCookieTests = [
      newTest,
      ...existingCookieTests.filter(
        (t) =>
          !(t.mb_id === user.mb_id && String(t.it_id) === String(item.it_id))
      ),
    ].slice(0, 10);

    const res = NextResponse.json({
      ok: true,
      od_id,
      test_no: newTest.test_no,
      it_id: String(item.it_id),
      redirect_url: `/test?it_id=${encodeURIComponent(
        String(item.it_id)
      )}&test_idx=${newTest.test_no}&fresh=1`,
    });

    res.cookies.set(
      MY_TESTS_COOKIE,
      Buffer.from(JSON.stringify(updatedCookieTests), "utf-8").toString(
        "base64url"
      ),
      {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    res.cookies.delete(MY_ANSWERS_COOKIE);

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message || "신청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
