import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb, POSTGRES_DDL } from '@/lib/db';
import DbSyncClient from './DbSyncClient';

export const dynamic = 'force-dynamic';

export default async function AdminDbSyncPage() {
  const user = getSessionUser();
  if (!user) {
    redirect('/login?redirect=/adm/db-sync');
  }
  if (user.mb_level < 9) {
    redirect('/mypage');
  }

  const db = await getDb();
  const hasCloudUrl = Boolean(process.env.DATABASE_URL);

  return (
    <DbSyncClient
      hasCloudUrl={hasCloudUrl}
      modeText={
        hasCloudUrl
          ? 'Cloud PostgreSQL (Supabase / Neon 실시간 연동중)'
          : '내장 백업 DB + 런타임 저장소 모드 (DATABASE_URL 설정 시 즉시 클라우드 전환)'
      }
      counts={{
        g5_member: db.g5_member.length,
        g5_shop_item: db.g5_shop_item.length,
        graphit_group: db.graphit_group.length,
        graphit_qa: db.graphit_qa.length,
        graphit_item: db.graphit_item.length,
        graphit_test: db.graphit_test.length,
        graphit_item_test: db.graphit_item_test.length,
        g5_shop_order: db.g5_shop_order.length,
      }}
      ddlSql={POSTGRES_DDL}
    />
  );
}
