import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import OrdersClient from './OrdersClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/adm/orders');
  }
  if (user.mb_level < 9) {
    redirect('/mypage');
  }

  const db = await getDb();
  const orders = [...db.g5_shop_order].sort((a, b) =>
    String(b.od_time || '').localeCompare(String(a.od_time || ''))
  );

  return <OrdersClient orders={orders} />;
}
