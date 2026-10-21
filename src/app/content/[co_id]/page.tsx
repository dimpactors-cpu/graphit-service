import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function ContentPage({
  params,
}: {
  params: { co_id: string };
}) {
  const user = getSessionUser();
  const db = await getDb();
  const content = db.g5_content.find((c) => c.co_id === params.co_id);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SiteHeader user={user} />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4 mb-6">
            {content?.co_subject || params.co_id}
          </h1>
          <div
            className="prose max-w-none text-sm text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: content?.co_content || '<p>등록된 내용이 없습니다.</p>',
            }}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
