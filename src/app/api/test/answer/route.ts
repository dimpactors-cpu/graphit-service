import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, formatKstNow } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: "로그인 후 이용하실 수 있습니다." }, { status: 401 });
    }

    const body = await req.json();
    const { it_id, item_seq, qa_no, test_answer, is_complete } = body;

    if (!it_id) {
      return NextResponse.json({ ok: false, message: "비정상적인 접근입니다." }, { status: 400 });
    }

    const db = await getDb();
    const now = formatKstNow();

    // Ensure user has applied for this test with a valid group_code
    let hasValidGroupTest = db.graphit_test.some(
      (t) =>
        t.mb_id === user.mb_id &&
        String(t.it_id) === String(it_id) &&
        String(t.group_code || "").trim() !== ""
    );

    if (!hasValidGroupTest) {
      try {
        const rawCookie = req.cookies.get("graphit_my_tests")?.value;
        if (rawCookie) {
          const cookieTests = JSON.parse(
            Buffer.from(rawCookie, "base64url").toString("utf-8")
          );
          hasValidGroupTest = cookieTests.some(
            (t: any) =>
              t.mb_id === user.mb_id &&
              String(t.it_id) === String(it_id) &&
              String(t.group_code || "").trim() !== ""
          );
        }
      } catch {
        // ignore
      }
    }

    if (!hasValidGroupTest) {
      return NextResponse.json(
        { ok: false, message: "단체코드를 입력하고 검사를 신청한 후 응시할 수 있습니다." },
        { status: 403 }
      );
    }

    // Update or insert answer if item_seq is provided
    if (item_seq !== undefined && item_seq !== null) {
      const seqNum = Number(item_seq);
      let resolvedQaNo = qa_no;
      if (!resolvedQaNo) {
        const mapped = db.graphit_item.find(
          (gi) => String(gi.it_id) === String(it_id) && Number(gi.item_seq) === seqNum
        );
        resolvedQaNo = mapped ? mapped.qa_no : 1;
      }

      const existing = db.graphit_item_test.find(
        (r) =>
          r.mb_id === user.mb_id &&
          String(r.it_id) === String(it_id) &&
          Number(r.item_seq) === seqNum
      );

      if (existing) {
        existing.test_answer = String(test_answer ?? "");
        existing.reg_datetime = now;
      } else {
        const maxSeqNo = db.graphit_item_test.reduce(
          (acc, r) => Math.max(acc, Number(r.seq_no || 0)),
          0
        );
        db.graphit_item_test.push({
          seq_no: maxSeqNo + 1,
          item_seq: seqNum,
          mb_id: user.mb_id,
          it_id: String(it_id),
          qa_no: Number(resolvedQaNo),
          test_answer: String(test_answer ?? ""),
          reg_datetime: now,
        });
      }
    }

    // Update graphit_test status
    const testRecord = db.graphit_test.find(
      (t) => t.mb_id === user.mb_id && String(t.it_id) === String(it_id)
    );
    const member = db.g5_member.find((m) => m.mb_id === user.mb_id);

    if (is_complete) {
      if (testRecord) {
        testRecord.test_status = "완료";
        testRecord.end_datetime = now;
      }
      if (member) {
        member.test_status = "완료";
      }
    } else {
      if (testRecord && testRecord.test_status !== "완료") {
        testRecord.test_status = "진행중";
      }
      if (member && member.test_status !== "완료") {
        member.test_status = "진행중";
      }
    }

    await saveDb(db);

    const res = NextResponse.json({
      ok: true,
      status: is_complete ? "완료" : "진행중",
    });

    try {
      const rawCookie = req.cookies.get("graphit_my_tests")?.value;
      if (rawCookie) {
        const cookieTests = JSON.parse(
          Buffer.from(rawCookie, "base64url").toString("utf-8")
        );
        const updated = cookieTests.map((t: any) => {
          if (t.mb_id === user.mb_id && String(t.it_id) === String(it_id)) {
            return {
              ...t,
              test_status: is_complete ? "완료" : "진행중",
              end_datetime: is_complete ? now : t.end_datetime,
            };
          }
          return t;
        });
        res.cookies.set(
          "graphit_my_tests",
          Buffer.from(JSON.stringify(updated), "utf-8").toString("base64url"),
          {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
          }
        );
      }
    } catch {
      // ignore
    }

    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "답변 저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
