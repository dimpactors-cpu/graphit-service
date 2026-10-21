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
  const [itemList, setItemList] = useState<CheckupSummary[]>(items);
  const [filterUse, setFilterUse] = useState<'all' | '1' | '0'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [itName, setItName] = useState('');
  const [it4, setIt4] = useState('');
  const [it1, setIt1] = useState('고등학생, 성인');
  const [it2, setIt2] = useState('만 15세 이상');
  const [it3, setIt3] = useState('50');
  const [itPrice, setItPrice] = useState('0');
  const [itUse, setItUse] = useState(1);
  const [itImg1, setItImg1] = useState('');
  const [itBasic, setItBasic] = useState('');
  const [saving, setSaving] = useState(false);

  const resolveThumb = (raw: string) => {
    if (!raw) return '/data/common/mobile_logo_img.png';
    if (raw.startsWith('data:') || raw.startsWith('http') || raw.startsWith('/'))
      return raw;
    return `/data/item/${raw}`;
  };

  const handleToggleUse = async (it_id: string, nextUse: number) => {
    const target = itemList.find((item) => String(item.it_id) === String(it_id));
    if (!target || Number(target.it_use) === nextUse) return;

    setTogglingId(it_id);
    // Optimistic update
    setItemList((prev) =>
      prev.map((item) =>
        String(item.it_id) === String(it_id) ? { ...item, it_use: nextUse } : item
      )
    );
    try {
      const res = await fetch('/api/admin/checkup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ it_id, it_use: nextUse }),
      });
      const data = await res.json();
      if (!data.ok) {
        // Revert on failure
        setItemList((prev) =>
          prev.map((item) =>
            String(item.it_id) === String(it_id)
              ? { ...item, it_use: target.it_use }
              : item
          )
        );
        alert(data.message || '노출 상태 변경에 실패했습니다.');
      } else {
        router.refresh();
      }
    } catch {
      setItemList((prev) =>
        prev.map((item) =>
          String(item.it_id) === String(it_id)
            ? { ...item, it_use: target.it_use }
            : item
        )
      );
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setTogglingId(null);
    }
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
          it_use: Number(itUse),
          it_img1: itImg1,
          it_basic: itBasic.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.item) {
          setItemList((prev) => [
            {
              it_id: String(data.item.it_id),
              it_name: data.item.it_name,
              it_price: Number(data.item.it_price || 0),
              it_use: Number(data.item.it_use ?? 1),
              it_img1: data.item.it_img1 || '',
              it_1: data.item.it_1 || '',
              it_2: data.item.it_2 || '',
              it_3: data.item.it_3 || '',
              it_4: data.item.it_4 || '',
              question_count: 0,
              applicant_count: 0,
            },
            ...prev.filter((p) => String(p.it_id) !== String(data.item.it_id)),
          ]);
        }
        alert('신규 검사 프로그램이 생성되었습니다.');
        setShowModal(false);
        setItName('');
        setIt4('');
        setItBasic('');
        setItImg1('');
        router.refresh();
      } else {
        alert(data.message || '생성 실패');
      }
    } catch {
      alert('서버 통신 오류');
    } finally {
      setSaving(false);
    }
  };

  const exposedCount = itemList.filter((it) => Number(it.it_use) === 1).length;
  const hiddenCount = itemList.filter((it) => Number(it.it_use) !== 1).length;
  const filteredItems = itemList.filter((it) => {
    if (filterUse === '1') return Number(it.it_use) === 1;
    if (filterUse === '0') return Number(it.it_use) !== 1;
    return true;
  });

  return (
    <AdminLayout
      title="검사관리 (검사 프로그램 및 출제문항 구성)"
      subtitle="각 온라인 검사 프로그램의 기본정보, 노출 여부(노출/비노출), 출제 문항 순서 및 문항별 제한시간(초)을 관리합니다."
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
      {/* 노출/비노출 필터 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterUse('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
              filterUse === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 ({itemList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterUse('1')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
              filterUse === '1'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            노출중 ({exposedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterUse('0')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
              filterUse === '0'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            비노출 ({hiddenCount})
          </button>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          💡 각 검사 카드 우측 상단에서 <strong className="text-slate-800">노출 / 비노출</strong>을 클릭하여 메인화면 노출 상태를 즉시 변경할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((it) => (
          <div
            key={it.it_id}
            className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition ${
              it.it_use
                ? 'border-slate-200 hover:border-indigo-300'
                : 'border-slate-200/80 bg-slate-50/40 opacity-85 hover:opacity-100'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={resolveThumb(it.it_img1)}
                    alt={it.it_name}
                    className="w-14 h-14 rounded-xl object-contain p-1 border border-slate-200 bg-slate-50 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px] font-bold">
                      {it.it_4 || it.it_id}
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 mt-0.5 truncate">
                      {it.it_name}
                    </h2>
                  </div>
                </div>

                {/* 노출 / 비노출 즉시 선택 스위치 */}
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={togglingId === it.it_id}
                    onClick={() => handleToggleUse(it.it_id, 1)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition ${
                      Number(it.it_use) === 1
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    노출
                  </button>
                  <button
                    type="button"
                    disabled={togglingId === it.it_id}
                    onClick={() => handleToggleUse(it.it_id, 0)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition ${
                      Number(it.it_use) !== 1
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    비노출
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 border border-slate-100 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">대상 / 권장연령</span>
                  <span className="font-semibold text-slate-800">
                    {it.it_1 || '-'} ({it.it_2 || '-'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">예상소요시간</span>
                  <span className="font-bold text-slate-900">
                    {it.it_3 || '50'}분
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
                    노출 여부
                  </label>
                  <select
                    value={itUse}
                    onChange={(e) => setItUse(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold bg-white"
                  >
                    <option value={1}>노출 (메인화면 공개)</option>
                    <option value={0}>비노출 (숨김)</option>
                  </select>
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
