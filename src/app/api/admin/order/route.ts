import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.mb_level < 9) {
    return NextResponse.json({ ok: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { od_id, od_status, od_delivery_company, od_invoice } = body;
    const db = await getDb();
    const order = db.g5_shop_order.find((o) => String(o.od_id) === String(od_id));

    if (!order) {
      return NextResponse.json({ ok: false, message: "주문 내역을 찾을 수 없습니다." }, { status: 404 });
    }

    if (od_status !== undefined) order.od_status = od_status;
    if (od_delivery_company !== undefined) order.od_delivery_company = od_delivery_company;
    if (od_invoice !== undefined) order.od_invoice = od_invoice;

    await saveDb(db);
    return NextResponse.json({ ok: true, order });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "오류가 발생했습니다." }, { status: 500 });
  }
}
