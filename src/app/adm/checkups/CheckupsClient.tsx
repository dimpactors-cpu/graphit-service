'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { fileToDataUrl } from '@/lib/imageUpload';

export interface CheckupSummary {
  it_id: string;
  it_name: string;
  it_price: number;
  it_use: number;
  it_img1: string;
  it_1: string;
  it_2: string;
  it_3: string;
  it_4: string;
  question_count: number;
  applicant_count: number;
}

export default function CheckupsClient({ items }: { items: CheckupSummary[] }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [itName, setItName] = useState('');
  const [it4, setIt4] = useState('');
  const [it1, setIt1] = useState('고등학생, 성인');
  const [it2, setIt2] = useState('만 15세 이상');
  const [it3, setIt3] = useState('50');
  const [itPrice, setItPrice] = useState('50000');
  const [itImg1, setItImg1] = useState('');
  const [itBasic, setItBasic] = useState('');
  const [saving, setSaving] = useState(false);

  const resolveThumb = (raw: string) => {
    if (!raw) return '/data/common/mobile_logo_img.png';
    if (raw.startsWith('data:') || raw.startsWith('http') || raw.startsWith('/'))
      return raw;
    return `/data/item/${raw}`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/checkup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          it_name: itName.trim(),
          it_4: it4.trim(),
          it_1: it1.trim(),
          it_2: it2.trim(),
          it_3: it3.trim(),
          it_price: Number(itPrice || 0),
          it_img1: itImg1,
          it_basic: itBasic.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('신규 검사 프로그램이 생성되었습니다.');
        setShowModal(false);
        window.location.reload();
      } else {
        alert(data.message || '생성 실패');
      }
    } catch {
      alert('서버 통신 오류');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="검사관리 (검사 프로그램 및 출제문항 구성)"
      subtitle="각 온라인 검사 프로그램의 기본정보, 가격, 출제 문항 순서 및 문항별 제한시간(초)을 관리합니다."
      actions={
        <>
          <a
            href="/api/admin/excel?type=item"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition"
          >
            📥 검사별 매핑문항 엑셀 다운로드
          </a>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition"
          >
            + 신규 검사 프로그램 등록
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((it) => (
          <div
            key={it.it_id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={resolveThumb(it.it_img1)}
                    alt={it.it_name}
                    className="w-14 h-14 rounded-xl object-contain p-1 border border-slate-200 bg-slate-50"
                  />
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px] font-bold">
                      {it.it_4 || it.it_id}
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                      {it.it_name}
                    </h2>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                    it.it_use
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {it.it_use ? '판매/노출중' : '비노출'}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 border border-slate-100 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">대상 / 권장연령</span>
                  <span className="font-semibold text-slate-800">
                    {it.it_1 || '-'} ({it.it_2 || '-'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">예상소요시간 / 금액</span>
                  <span className="font-bold text-slate-900">
                    {it.it_3 || '50'}분 · {Number(it.it_price || 0).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">매핑된 출제 문항수</span>
                  <span className="font-extrabold text-indigo-600">
                    {it.question_count}문항
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">누적 응시 수강생</span>
                  <span className="font-bold text-emerald-700">
                    {it.applicant_count}명
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/adm/checkups/${it.it_id}`}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold text-center transition"
              >
                문항 구성 및 제한시간 설정 →
              </Link>
              <Link
                href={`/shop/item/${it.it_id}`}
                className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold"
              >
                미리보기
              </Link>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              신규 검사 프로그램 등록
            </h3>
            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  검사명 *
                </label>
                <input
                  type="text"
                  required
                  value={itName}
                  onChange={(e) => setItName(e.target.value)}
                  placeholder="예: 그래프잇 사고력 진단검사"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  검사식별코드
                </label>
                <input
                  type="text"
                  value={it4}
                  onChange={(e) => setIt4(e.target.value)}
                  placeholder="예: GRAPHIT-2026"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    대상
                  </label>
                  <input
                    type="text"
                    value={it1}
                    onChange={(e) => setIt1(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    권장연령
                  </label>
                  <input
                    type="text"
                    value={it2}
                    onChange={(e) => setIt2(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    소요시간(분)
                  </label>
                  <input
                    type="text"
                    value={it3}
                    onChange={(e) => setIt3(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    금액 (원)
                  </label>
                  <input
                    type="number"
                    value={itPrice}
                    onChange={(e) => setItPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  한줄 소개 (선택)
                </label>
                <input
                  type="text"
                  value={itBasic}
                  onChange={(e) => setItBasic(e.target.value)}
                  placeholder="예: 적성과 인지 역량을 진단하는 검사입니다."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  검사 대표 썸네일 이미지 업로드 (선택)
                </label>
                <div className="flex items-center gap-3">
                  {itImg1 && (
                    <img
                      src={resolveThumb(itImg1)}
                      alt="미리보기"
                      className="w-12 h-12 rounded-lg object-contain border border-slate-200 bg-slate-50"
                    />
                  )}
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold inline-block">
                    <span>📁 썸네일 이미지 파일 선택</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const dataUrl = await fileToDataUrl(file, 800);
                        setItImg1(dataUrl);
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold"
                >
                  {saving ? '등록 중...' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
