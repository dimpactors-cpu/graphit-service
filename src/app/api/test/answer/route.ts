import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, formatKstNow, MY_ANSWERS_COOKIE } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: "로그인 후 이용하실 수 있습니다." }, { status: 401 });
    }

    const body = await req.json();
    const {
      it_id,
      test_no,
      item_seq,
      qa_no,
      test_answer,
      answers,
      is_complete,
    } = body;

    if (!it_id) {
      return NextResponse.json({ ok: false, message: "비정상적인 접근입니다." }, { status: 400 });
    }

    const db = await getDb();
    const now = formatKstNow();

    // Find target test record by test_no or latest incomplete test for (mb_id, it_id)
    let testRecord = test_no
      ? db.graphit_test.find(
          (t) =>
            t.mb_id === user.mb_id &&
            Number(t.test_no) === Number(test_no)
        )
      : undefined;

    if (!testRecord) {
      const sameItemTests = db.graphit_test
        .filter(
          (t) =>
            t.mb_id === user.mb_id &&
            String(t.it_id) === String(it_id) &&
            String(t.group_code || "").trim() !== ""
        )
        .sort((a, b) => Number(b.test_no) - Number(a.test_no));
      testRecord =
        sameItemTests.find((t) => t.test_status !== "완료") ||
        sameItemTests[0];
    }

    if (!testRecord) {
      try {
        const rawCookie = req.cookies.get("graphit_my_tests")?.value;
        if (rawCookie) {
          const cookieTests = JSON.parse(
            Buffer.from(rawCookie, "base64url").toString("utf-8")
          );
          const matchedCookieTest =
            (test_no
              ? cookieTests.find(
                  (t: any) =>
                    t.mb_id === user.mb_id &&
                    Number(t.test_no) === Number(test_no)
                )
              : undefined) ||
            cookieTests.find(
              (t: any) =>
                t.mb_id === user.mb_id &&
                String(t.it_id) === String(it_id) &&
                String(t.group_code || "").trim() !== ""
            );
          if (matchedCookieTest) {
            db.graphit_test.unshift(matchedCookieTest);
            testRecord = matchedCookieTest;
          }
        }
      } catch {
        // ignore
      }
    }

    if (!testRecord || String(testRecord.group_code || "").trim() === "") {
      return NextResponse.json(
        { ok: false, message: "단체코드를 입력하고 검사를 신청한 후 응시할 수 있습니다." },
        { status: 403 }
      );
    }

    const resolvedTestNo = Number(testRecord.test_no);
    if (!testRecord.test_answers || typeof testRecord.test_answers !== "object") {
      testRecord.test_answers = {};
    }

    const itemsToSave: Array<{
      item_seq: number;
      qa_no?: number;
      test_answer: string;
    }> = [];

    if (Array.isArray(answers)) {
      for (const a of answers) {
        if (a && a.item_seq !== undefined && a.item_seq !== null) {
          itemsToSave.push({
            item_seq: Number(a.item_seq),
            qa_no: a.qa_no ? Number(a.qa_no) : undefined,
            test_answer: String(a.test_answer ?? ""),
          });
        }
      }
    }

    if (item_seq !== undefined && item_seq !== null) {
      const seqNum = Number(item_seq);
      const existingIdx = itemsToSave.findIndex((x) => x.item_seq === seqNum);
      if (existingIdx >= 0) {
        itemsToSave[existingIdx] = {
          item_seq: seqNum,
          qa_no: qa_no ? Number(qa_no) : itemsToSave[existingIdx].qa_no,
          test_answer: String(test_answer ?? ""),
        };
      } else {
        itemsToSave.push({
          item_seq: seqNum,
          qa_no: qa_no ? Number(qa_no) : undefined,
          test_answer: String(test_answer ?? ""),
        });
      }
    }

    let maxSeqNo = db.graphit_item_test.reduce(
      (acc, r) => Math.max(acc, Number(r.seq_no || 0)),
      0
    );

    for (const entry of itemsToSave) {
      const seqNum = Number(entry.item_seq);
      let resolvedQaNo = entry.qa_no;
      if (!resolvedQaNo) {
        const mapped = db.graphit_item.find(
          (gi) => String(gi.it_id) === String(it_id) && Number(gi.item_seq) === seqNum
        );
        resolvedQaNo = mapped ? Number(mapped.qa_no) : 1000 + seqNum;
      }

      const ansVal = String(entry.test_answer ?? "");
      testRecord.test_answers[String(seqNum)] = ansVal;

      const existing = db.graphit_item_test.find(
        (r) =>
          r.mb_id === user.mb_id &&
          String(r.it_id) === String(it_id) &&
          Number(r.test_no || 0) === resolvedTestNo &&
          Number(r.item_seq) === seqNum
      );

      if (existing) {
        existing.test_answer = ansVal;
        existing.reg_datetime = now;
        existing.test_no = resolvedTestNo;
      } else {
        maxSeqNo += 1;
        db.graphit_item_test.push({
          seq_no: maxSeqNo,
          item_seq: seqNum,
          mb_id: user.mb_id,
          it_id: String(it_id),
          qa_no: Number(resolvedQaNo),
          test_answer: ansVal,
          reg_datetime: now,
          test_no: resolvedTestNo,
        });
      }
    }

    const member = db.g5_member.find((m) => m.mb_id === user.mb_id);

    if (is_complete) {
      if (testRecord) {
        testRecord.test_status = "완료";
        testRecord.end_datetime = now;
        testRecord.result_open = false;
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
      test_no: resolvedTestNo,
      status: is_complete ? "완료" : "진행중",
    });

    try {
      const myItemAnswers = db.graphit_item_test.filter(
        (r) =>
          r.mb_id === user.mb_id &&
          String(r.it_id) === String(it_id) &&
          Number(r.test_no || 0) === resolvedTestNo &&
          r.test_answer !== undefined &&
          r.test_answer !== ""
      );
      res.cookies.set(
        MY_ANSWERS_COOKIE,
        Buffer.from(JSON.stringify(myItemAnswers), "utf-8").toString("base64url"),
        {
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        }
      );
    } catch {
      // ignore
    }

    try {
      const rawCookie = req.cookies.get("graphit_my_tests")?.value;
      if (rawCookie) {
        const cookieTests = JSON.parse(
          Buffer.from(rawCookie, "base64url").toString("utf-8")
        );
        const updated = cookieTests.map((t: any) => {
          if (
            t.mb_id === user.mb_id &&
            Number(t.test_no) === resolvedTestNo
          ) {
            return {
              ...t,
              test_status: is_complete ? "완료" : "진행중",
              end_datetime: is_complete ? now : t.end_datetime,
              result_open: is_complete ? false : t.result_open,
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
