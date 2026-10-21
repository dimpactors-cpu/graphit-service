'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface DbSyncClientProps {
  hasCloudUrl: boolean;
  modeText: string;
  counts: Record<string, number>;
  ddlSql: string;
}

export default function DbSyncClient({
  hasCloudUrl,
  modeText,
  counts,
  ddlSql,
}: DbSyncClientProps) {
  const [customUrl, setCustomUrl] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResultMsg(null);
    try {
      const res = await fetch('/api/admin/db-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          databaseUrl: customUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      setResultMsg({
        ok: Boolean(data.ok),
        message: data.message || (data.ok ? '동기화 완료' : '동기화 실패'),
      });
    } catch {
      setResultMsg({
        ok: false,
        message: '서버와 통신 중 오류가 발생했습니다.',
      });
    } finally {
      setSyncing(false);
    }
  };

  const TABLE_LABELS: Record<string, string> = {
    g5_member: '회원 테이블 (g5_member: 개인/단체/관리자)',
    g5_shop_item: '검사 프로그램 테이블 (g5_shop_item)',
    graphit_group: '단체코드 테이블 (graphit_group)',
    graphit_qa: '검사 문항 풀 테이블 (graphit_qa)',
    graphit_item: '검사별 문항 매핑 테이블 (graphit_item)',
    graphit_test: '수강생 검사 신청·진행현황 (graphit_test)',
    graphit_item_test: '수강생 문항별 응답 상세 (graphit_item_test)',
    g5_shop_order: '주문·결제 내역 테이블 (g5_shop_order)',
  };

  return (
    <AdminLayout
      title="클라우드 DB 연동 및 백업 동기화 (Supabase / Neon PostgreSQL)"
      subtitle="20240516_slwlab_DB_Backup.sql의 전체 데이터를 외부 클라우드 PostgreSQL 데이터베이스와 실시간 동기화합니다."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Status & Sync Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-600">
                현재 데이터베이스 엔진 상태
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                {modeText}
              </h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                hasCloudUrl
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {hasCloudUrl ? 'DATABASE_URL 감지됨' : '로컬/폴백 모드 동작중'}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs text-slate-600 leading-relaxed space-y-2">
            <p className="font-bold text-slate-800">
              💡 Vercel 및 클라우드 DB(Supabase / Neon) 연동 안내
            </p>
            <p>
              1. 본 프로젝트는 <code>20240516_slwlab_DB_Backup.sql</code>의 모든 테이블과 레코드(총 27,000+행)가 내장되어 있어 별도 설정 없이도 즉시 조회·신청·검사 진행이 가능합니다.
            </p>
            <p>
              2. Vercel 프로젝트 환경변수(Environment Variables) 또는 로컬 <code>.env.local</code>에 <code>DATABASE_URL</code>(PostgreSQL Connection String)을 등록하면, 모든 신규 회원가입·단체코드 발급·검사 응답 데이터가 클라우드 DB에 영구 저장됩니다.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-700">
              PostgreSQL 연결 문자열 (DATABASE_URL 환경변수 미설정 시 직접 입력하여 즉시 초기화/동기화 가능)
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="password"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-mono focus:border-indigo-600 focus:outline-none"
              />
              <button
                type="button"
                disabled={syncing}
                onClick={handleSync}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition shrink-0 disabled:opacity-50"
              >
                {syncing ? '테이블 생성 및 동기화 중...' : '클라우드 DB 테이블 생성 및 전체 데이터 동기화 실행'}
              </button>
            </div>
          </div>

          {resultMsg && (
            <div
              className={`p-4 rounded-xl border text-xs font-bold ${
                resultMsg.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {resultMsg.message}
            </div>
          )}
        </div>

        {/* Loaded Record Counts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">
            로드된 백업/운영 DB 레코드 현황
          </h2>
          <div className="space-y-2.5">
            {Object.entries(counts).map(([table, cnt]) => (
              <div
                key={table}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <span className="font-semibold text-slate-700">
                  {TABLE_LABELS[table] || table}
                </span>
                <span className="font-extrabold text-indigo-600 font-mono">
                  {Number(cnt).toLocaleString()}건
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PostgreSQL DDL Viewer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-900 mb-2">
          PostgreSQL 호환 스키마 (supabase/schema.sql)
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          위 동기화 버튼을 누르면 아래 스키마가 자동으로 생성되며, Supabase SQL Editor에서 직접 실행하셔도 됩니다.
        </p>
        <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-96">
          {ddlSql}
        </pre>
      </div>
    </AdminLayout>
  );
}
