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
    const db = await getDb();
    const now = formatKstNow();

    if (body.it_id) {
      const item = db.g5_shop_item.find((it) => String(it.it_id) === String(body.it_id));
      if (!item) {
        return NextResponse.json({ ok: false, message: "검사를 찾을 수 없습니다." }, { status: 404 });
      }
      if (body.it_4 !== undefined) item.it_4 = body.it_4;
      if (body.it_name !== undefined) item.it_name = body.it_name;
      if (body.it_1 !== undefined) item.it_1 = body.it_1;
      if (body.it_2 !== undefined) item.it_2 = body.it_2;
      if (body.it_3 !== undefined) item.it_3 = body.it_3;
      if (body.it_price !== undefined) item.it_price = Number(body.it_price);
      if (body.it_use !== undefined) item.it_use = Number(body.it_use);
      if (body.it_basic !== undefined) item.it_basic = body.it_basic;
      if (body.it_explan !== undefined) item.it_explan = body.it_explan;
      if (body.it_img1 !== undefined) item.it_img1 = body.it_img1;
      item.it_update_time = now;

      await saveDb(db);
      return NextResponse.json({ ok: true, item });
    } else {
      const newItId = String(Math.floor(Date.now() / 1000));
      const newItem = {
        it_id: newItId,
        ca_id: "10",
        it_name: body.it_name || "",
        it_basic: body.it_basic || "",
        it_explan: body.it_explan || "",
        it_cust_price: Number(body.it_price || 0),
        it_price: Number(body.it_price || 0),
        it_use: 1,
        it_time: now,
        it_update_time: now,
        it_img1: body.it_img1 || "",
        it_img2: "",
        it_img3: "",
        it_1: body.it_1 || "",
        it_2: body.it_2 || "",
        it_3: body.it_3 || "",
        it_4: body.it_4 || "",
        it_5: "",
      };
      db.g5_shop_item.unshift(newItem);
      await saveDb(db);
      return NextResponse.json({ ok: true, item: newItem });
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "오류 발생" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.mb_level < 9) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const db = await getDb();

    // Case 1: Add questions to checkup (popup add)
    if (body.action === "add_questions" && body.it_id && Array.isArray(body.qa_nos)) {
      const currentItems = db.graphit_item.filter((gi) => String(gi.it_id) === String(body.it_id));
      let maxSeq = currentItems.reduce((acc, gi) => Math.max(acc, Number(gi.item_seq || 0)), 0);
      let maxItemNo = db.graphit_item.reduce((acc, gi) => Math.max(acc, Number(gi.item_no || 0)), 0);

      for (const qaNo of body.qa_nos) {
        const alreadyExists = currentItems.some((gi) => Number(gi.qa_no) === Number(qaNo));
        if (!alreadyExists) {
          maxSeq += 1;
          maxItemNo += 1;
          db.graphit_item.push({
            item_no: maxItemNo,
            it_id: String(body.it_id),
            qa_no: Number(qaNo),
            item_seq: maxSeq,
            item_timer: 0,
          });
        }
      }
      await saveDb(db);
      return NextResponse.json({ ok: true });
    }

    // Case 2: Bulk update item_timer and item_seq
    if (body.action === "update_mappings" && Array.isArray(body.mappings)) {
      for (const m of body.mappings) {
        const row = db.graphit_item.find((gi) => Number(gi.item_no) === Number(m.item_no));
        if (row) {
          row.item_timer = Number(m.item_timer || 0);
          row.item_seq = Number(m.item_seq || 1);
        }
      }
      await saveDb(db);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "오류 발생" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.mb_level < 9) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const item_no = searchParams.get("item_no");
    if (!item_no) {
      return NextResponse.json({ ok: false, message: "item_no가 필요합니다." }, { status: 400 });
    }

    const db = await getDb();
    db.graphit_item = db.graphit_item.filter((gi) => Number(gi.item_no) !== Number(item_no));
    await saveDb(db);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "삭제 실패" }, { status: 500 });
  }
}
