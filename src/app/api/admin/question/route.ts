import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, formatKstNow } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function cleanSubject(val: string | undefined | null): string {
  if (!val) return "";
  return String(val).replace(/^\s*Q\.\s*/i, "").trim();
}

function cleanChoice(val: string | undefined | null): string {
  if (!val) return "";
  return String(val).replace(/^\s*[1-5]\s*\.\s*/, "").trim();
}

export async function POST(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.mb_level < 9) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const db = await getDb();

    if (body.qa_no) {
      // Update existing question
      const q = db.graphit_qa.find((r) => Number(r.qa_no) === Number(body.qa_no));
      if (!q) {
        return NextResponse.json({ ok: false, message: "문항을 찾을 수 없습니다." }, { status: 404 });
      }
      q.qa_code = body.qa_code ?? q.qa_code;
      q.qa_type = body.qa_type ?? q.qa_type;
      q.qa_summary = body.qa_summary ?? q.qa_summary;
      q.qa_sub1 = body.qa_sub1 ?? q.qa_sub1;
      q.qa_sub2 = body.qa_sub2 ?? q.qa_sub2;
      q.qa_level = body.qa_level ?? q.qa_level;
      q.qa_tendency = body.qa_tendency ?? q.qa_tendency;
      q.qa_power = body.qa_power ?? q.qa_power;
      q.qa_subject = body.qa_subject !== undefined ? cleanSubject(body.qa_subject) : q.qa_subject;
      q.qa_content = body.qa_content ?? q.qa_content;
      if (body.qa_file !== undefined) q.qa_file = body.qa_file;
      q.qa_q1 = body.qa_q1 !== undefined ? cleanChoice(body.qa_q1) : q.qa_q1;
      q.qa_q2 = body.qa_q2 !== undefined ? cleanChoice(body.qa_q2) : q.qa_q2;
      q.qa_q3 = body.qa_q3 !== undefined ? cleanChoice(body.qa_q3) : q.qa_q3;
      q.qa_q4 = body.qa_q4 !== undefined ? cleanChoice(body.qa_q4) : q.qa_q4;
      q.qa_q5 = body.qa_q5 !== undefined ? cleanChoice(body.qa_q5) : q.qa_q5;

      await saveDb(db);
      return NextResponse.json({ ok: true, question: q });
    } else {
      // Create new question
      const maxQaNo = db.graphit_qa.reduce((acc, r) => Math.max(acc, Number(r.qa_no || 0)), 0);
      const newQ = {
        qa_no: maxQaNo + 1,
        qa_code: body.qa_code || `QA-${maxQaNo + 1}`,
        qa_type: body.qa_type || "n",
        qa_summary: body.qa_summary || "",
        qa_sub1: body.qa_sub1 || "",
        qa_sub2: body.qa_sub2 || "",
        qa_level: body.qa_level || "",
        qa_tendency: body.qa_tendency || "",
        qa_power: body.qa_power || "",
        qa_subject: cleanSubject(body.qa_subject),
        qa_content: body.qa_content || "",
        qa_file: body.qa_file || "",
        qa_q1: cleanChoice(body.qa_q1),
        qa_q2: cleanChoice(body.qa_q2),
        qa_q3: cleanChoice(body.qa_q3),
        qa_q4: cleanChoice(body.qa_q4),
        qa_q5: cleanChoice(body.qa_q5),
        reg_datetime: formatKstNow(),
      };
      db.graphit_qa.unshift(newQ);
      await saveDb(db);
      return NextResponse.json({ ok: true, question: newQ });
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "문항 저장 오류" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.mb_level < 9) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const qa_no = searchParams.get("qa_no");
    if (!qa_no) {
      return NextResponse.json({ ok: false, message: "문항 번호가 필요합니다." }, { status: 400 });
    }

    const db = await getDb();
    db.graphit_qa = db.graphit_qa.filter((q) => Number(q.qa_no) !== Number(qa_no));
    db.graphit_item = db.graphit_item.filter((gi) => Number(gi.qa_no) !== Number(qa_no));
    await saveDb(db);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "삭제 오류" }, { status: 500 });
  }
}
