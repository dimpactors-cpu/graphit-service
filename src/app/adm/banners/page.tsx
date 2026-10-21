import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDb, getSiteConfig } from "@/lib/db";
import BannersClient from "./BannersClient";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const user = getSessionUser();
  if (!user) {
    redirect("/login?url=/adm/banners");
  }
  if (user.mb_level < 9) {
    redirect("/mypage");
  }

  const db = await getDb();
  const config = getSiteConfig(db);
  const items = db.g5_shop_item.map((it) => ({
    it_id: String(it.it_id),
    it_name: it.it_name,
  }));

  return <BannersClient initialConfig={config} items={items} />;
}
