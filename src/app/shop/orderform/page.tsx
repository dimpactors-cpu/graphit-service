import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import OrderFormClient from "./OrderFormClient";

export const dynamic = "force-dynamic";

export default async function OrderFormPage({
  searchParams,
}: {
  searchParams: { it_id?: string };
}) {
  const user = getSessionUser();
  const it_id = searchParams.it_id || "1698900476";

  if (!user) {
    redirect(`/login?url=${encodeURIComponent(`/shop/orderform?it_id=${it_id}`)}`);
  }

  const db = await getDb();
  const item = db.g5_shop_item.find((it) => String(it.it_id) === String(it_id)) || db.g5_shop_item[0];
  const member = db.g5_member.find((m) => m.mb_id === user.mb_id);

  // Sample available group codes for quick helper reference
  const sampleGroupCodes = db.graphit_group.slice(0, 6).map((g) => ({
    group_code: g.group_code,
    it_id: String(g.it_id),
    group_end: g.group_end,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteHeader user={user} />

      <main className="flex-1 py-10">
        <div id="sidx">
          <h1 className="text-2xl font-bold text-[#191919] mb-6">주문서 작성 / 검사 신청</h1>
          <OrderFormClient
            item={item}
            member={member || null}
            sampleGroupCodes={sampleGroupCodes}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
