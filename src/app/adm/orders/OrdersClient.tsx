'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { ShopOrderRow } from '@/lib/db';

const STATUS_OPTIONS = ['주문', '입금', '준비', '배송', '완료', '취소'];

export default function OrdersClient({ orders }: { orders: ShopOrderRow[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.od_status !== statusFilter) return false;
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        return (
          String(o.od_id).toLowerCase().includes(kw) ||
          (o.od_name || '').toLowerCase().includes(kw) ||
          (o.mb_id || '').toLowerCase().includes(kw) ||
          (o.od_hp || '').toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [orders, statusFilter, keyword]);

  const handleStatusChange = async (odId: string | number, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          od_id: odId,
          od_status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        router.refresh();
      } else {
        alert(data.message || '상태 변경 실패');
      }
    } catch {
      alert('서버 통신 오류');
    }
  };

  return (
    <AdminLayout
      title="주문내역 관리 (영카트 주문·결제 이력)"
      subtitle="수강생이 신청·결제한 주문 내역 및 결제 상태를 관리합니다."
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 ({orders.length})
          </button>
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="주문번호, 주문자명, 아이디, 연락처 검색..."
          className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs w-full sm:w-80 focus:border-indigo-600 focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="py-3.5 px-4">주문번호</th>
                <th className="py-3.5 px-4">주문자 (아이디)</th>
                <th className="py-3.5 px-4">연락처</th>
                <th className="py-3.5 px-4">결제수단</th>
                <th className="py-3.5 px-4 text-right">주문금액</th>
                <th className="py-3.5 px-4 text-right">입금금액</th>
                <th className="py-3.5 px-4 text-center">주문상태 변경</th>
                <th className="py-3.5 px-4">주문일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((o) => (
                <tr key={String(o.od_id)} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700">
                    {o.od_id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-slate-900">{o.od_name}</div>
                    <div className="text-xs text-slate-400">{o.mb_id}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {o.od_hp || o.od_tel || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                    {o.od_settle_case || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {Number(o.od_cart_price || 0).toLocaleString()}원
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-indigo-600">
                    {Number(o.od_receipt_price || 0).toLocaleString()}원
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <select
                      value={o.od_status || '입금'}
                      onChange={(e) => handleStatusChange(o.od_id, e.target.value)}
                      className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-800"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {(o.od_time || '').slice(0, 16)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
