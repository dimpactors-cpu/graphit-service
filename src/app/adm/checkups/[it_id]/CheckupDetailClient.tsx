'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { fileToDataUrl } from '@/lib/imageUpload';

export interface MappedQuestionRow {
  item_no: number;
  item_seq: number;
  item_timer: number;
  qa_no: number;
  qa_code: string;
  qa_type: string;
  qa_summary?: string;
  qa_subject: string;
  qa_content?: string;
  qa_file?: string | null;
  qa_q1?: string | null;
  qa_q2?: string | null;
  qa_q3?: string | null;
  qa_q4?: string | null;
  qa_q5?: string | null;
  qa_sub1: string;
  qa_sub2?: string;
  qa_level: string;
  qa_tendency?: string;
  qa_power?: string;
  qa_answer?: string;
  qa_metric?: string;
  qa_weight?: number | string;
  qa_tendency_map?: Record<string, number> | null;
  al_test_no?: string;
  al_q_code?: string;
}

export interface AvailableQuestionRow {
  qa_no: number;
  qa_code: string;
  qa_type: string;
  qa_subject: string;
  qa_sub1: string;
  qa_level: string;
}

interface CheckupDetailClientProps {
  item: {
    it_id: string;
    it_name: string;
    it_price: number;
    it_use: number;
    it_img1?: string;
    it_basic?: string;
    it_explan?: string;
    it_1: string;
    it_2: string;
    it_3: string;
    it_4: string;
  };
  initialMappings: MappedQuestionRow[];
  allQuestions: AvailableQuestionRow[];
}

export default function CheckupDetailClient({
  item,
  initialMappings,
  allQuestions,
}: CheckupDetailClientProps) {
  const router = useRouter();
  const [itName, setItName] = useState(item.it_name);
  const [it4, setIt4] = useState(item.it_4);
  const [it1, setIt1] = useState(item.it_1);
  const [it2, setIt2] = useState(item.it_2);
  const [it3, setIt3] = useState(item.it_3);
  const [itPrice, setItPrice] = useState(String(item.it_price));
  const [itUse, setItUse] = useState(String(item.it_use));
  const [itImg1, setItImg1] = useState(item.it_img1 || '');
  const [itBasic, setItBasic] = useState(item.it_basic || '');
  const [savingInfo, setSavingInfo] = useState(false);

  const resolveThumb = (raw: string) => {
    if (!raw) return '/data/common/mobile_logo_img.png';
    if (raw.startsWith('data:') || raw.startsWith('http') || raw.startsWith('/'))
      return raw;
    return `/data/item/${raw}`;
  };

  const [mappings, setMappings] = useState<MappedQuestionRow[]>(initialMappings);
  const [savingMappings, setSavingMappings] = useState(false);

  // Add questions popup state
  const [showAddModal, setShowAddModal] = useState(false);
  const [qSearch, setQSearch] = useState('');
  const [selectedQaNos, setSelectedQaNos] = useState<number[]>([]);

  // Question detail / edit modal state
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);
  const [editingQa, setEditingQa] = useState<MappedQuestionRow | null>(null);
  const [savingQa, setSavingQa] = useState(false);

  const openQuestionModal = (idx: number) => {
    const target = mappings[idx];
    if (!target) return;
    setViewingIdx(idx);
    setEditingQa({ ...target });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQa) return;
    setSavingQa(true);
    try {
      const res = await fetch('/api/admin/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQa),
      });
      const data = await res.json();
      if (data.ok) {
        setMappings((prev) =>
          prev.map((m) =>
            m.qa_no === editingQa.qa_no
              ? {
                  ...m,
                  ...editingQa,
                }
              : m
          )
        );
        alert('문항 및 정답/배점 정보가 저장되었습니다.');
        router.refresh();
      } else {
        alert(data.message || '문항 저장 실패');
      }
    } catch {
      alert('서버 통신 오류');
    } finally {
      setSavingQa(false);
    }
  };

  const mappedQaSet = useMemo(
    () => new Set(mappings.map((m) => m.qa_no)),
    [mappings]
  );

  const availableQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (mappedQaSet.has(q.qa_no)) return false;
      if (qSearch.trim()) {
        const kw = qSearch.trim().toLowerCase();
        return (
          q.qa_code.toLowerCase().includes(kw) ||
          q.qa_subject.toLowerCase().includes(kw) ||
          q.qa_sub1.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [allQuestions, mappedQaSet, qSearch]);

  const handleSaveItemInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await fetch('/api/admin/checkup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          it_id: item.it_id,
          it_name: itName,
          it_4: it4,
          it_1: it1,
          it_2: it2,
          it_3: it3,
          it_price: Number(itPrice || 0),
          it_use: Number(itUse),
          it_img1: itImg1,
          it_basic: itBasic,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('검사 기본정보가 저장되었습니다.');
        router.refresh();
      } else {
        alert(data.message || '저장 실패');
      }
    } catch {
      alert('서버 오류');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveMappings = async () => {
    setSavingMappings(true);
    try {
      const res = await fetch('/api/admin/checkup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_mappings',
          mappings: mappings.map((m) => ({
            item_no: m.item_no,
            item_seq: Number(m.item_seq || 1),
            item_timer: Number(m.item_timer || 0),
          })),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('문항 노출순서 및 제한시간(초) 설정이 일괄 저장되었습니다.');
        router.refresh();
      } else {
        alert(data.message || '저장 실패');
      }
    } catch {
      alert('서버 오류');
    } finally {
      setSavingMappings(false);
    }
  };

  const handleDeleteMapping = async (itemNo: number) => {
    if (!confirm('이 문항을 검사 구성에서 제외하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/checkup?item_no=${itemNo}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        setMappings((prev) => prev.filter((m) => m.item_no !== itemNo));
        router.refresh();
      }
    } catch {
      alert('서버 오류');
    }
  };

  const handleAddSelectedQuestions = async () => {
    if (selectedQaNos.length === 0) {
      alert('추가할 문항을 선택해 주세요.');
      return;
    }
    try {
      const res = await fetch('/api/admin/checkup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_questions',
          it_id: item.it_id,
          qa_nos: selectedQaNos,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(`${selectedQaNos.length}개 문항이 추가되었습니다.`);
        setShowAddModal(false);
        setSelectedQaNos([]);
        window.location.reload();
      }
    } catch {
      alert('서버 오류');
    }
  };

  return (
    <AdminLayout
      title={`검사 상세 및 문항 구성 — ${item.it_name}`}
      subtitle="검사 기본정보와 출제 문항 목록, 문항별 제한시간(초) 및 노출순서를 설정합니다."
      actions={
        <Link
          href="/adm/checkups"
          className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          ← 검사관리 목록으로
        </Link>
      }
    >
      {/* Top: Item Basic Settings */}
      <form
        onSubmit={handleSaveItemInfo}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-base font-extrabold text-slate-900">
            검사 기본정보 설정
          </h2>
          <button
            type="submit"
            disabled={savingInfo}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition"
          >
            {savingInfo ? '저장 중...' : '기본정보 저장'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-500 mb-1">검사명</label>
            <input
              type="text"
              value={itName}
              onChange={(e) => setItName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-500 mb-1">
              검사식별코드 (it_4)
            </label>
            <input
              type="text"
              value={it4}
              onChange={(e) => setIt4(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-500 mb-1">
              금액 (원)
            </label>
            <input
              type="number"
              value={itPrice}
              onChange={(e) => setItPrice(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-500 mb-1">
              판매/노출 여부
            </label>
            <select
              value={itUse}
              onChange={(e) => setItUse(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
            >
              <option value="1">노출 및 신청가능 (1)</option>
              <option value="0">비노출 (0)</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-500 mb-1">대상</label>
            <input
              type="text"
              value={it1}
              onChange={(e) => setIt1(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-500 mb-1">
              최적연령
            </label>
            <input
              type="text"
              value={it2}
              onChange={(e) => setIt2(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-500 mb-1">
              예상소요시간(분)
            </label>
            <input
              type="text"
              value={it3}
              onChange={(e) => setIt3(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-500 mb-1">
              한줄 요약 설명
            </label>
            <input
              type="text"
              value={itBasic}
              onChange={(e) => setItBasic(e.target.value)}
              placeholder="검사 요약 설명"
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <img
              src={resolveThumb(itImg1)}
              alt="검사 대표 이미지"
              className="w-16 h-16 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1"
            />
            <div>
              <div className="font-bold text-slate-700">검사 대표 썸네일 이미지</div>
              <div className="text-slate-400">
                메인 화면 카드 및 검사 상세 페이지에 표시되는 대표 이미지입니다.
              </div>
            </div>
          </div>
          <label className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold transition shrink-0">
            <span>📁 대표 썸네일 이미지 변경 업로드</span>
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
      </form>

      {/* Bottom: Mapped Questions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              구성된 검사 문항 목록 (총 {mappings.length}문항)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              제한시간(초)을 0으로 설정하면 시간제한이 없으며, 양수로 설정하면 시간 초과 시 자동 제출됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold transition"
            >
              + 문항 추가하기
            </button>
            <button
              type="button"
              disabled={savingMappings}
              onClick={handleSaveMappings}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition"
            >
              {savingMappings ? '저장 중...' : '순서 및 제한시간 일괄저장'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="py-3 px-3 w-24 text-center">노출순서</th>
                <th className="py-3 px-3 w-28 text-center">제한시간(초)</th>
                <th className="py-3 px-3 w-20 text-center">유형</th>
                <th className="py-3 px-3 w-40">문항식별코드</th>
                <th className="py-3 px-3">질문 제목 (클릭 시 문항 상세조회)</th>
                <th className="py-3 px-3 w-36">정답 (답안)</th>
                <th className="py-3 px-3 w-52">지표·배점 / 성향매핑</th>
                <th className="py-3 px-3 w-28 text-center">조회 / 제외</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mappings.map((m, idx) => (
                <tr key={m.item_no} className="hover:bg-indigo-50/40 transition">
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      value={m.item_seq}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMappings((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, item_seq: val } : row
                          )
                        );
                      }}
                      className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center font-bold text-xs"
                    />
                    {m.al_test_no && (
                      <div className="text-[10px] font-mono font-bold text-indigo-600 mt-0.5">
                        {m.al_test_no}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min={0}
                      value={m.item_timer}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMappings((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, item_timer: val } : row
                          )
                        );
                      }}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-center font-bold text-indigo-600 text-xs"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        m.qa_type === 'y'
                          ? 'bg-purple-100 text-purple-800'
                          : m.qa_tendency_map
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {m.qa_type === 'y'
                        ? '주관식'
                        : m.qa_tendency_map
                        ? '성향5지'
                        : '객관식'}
                    </span>
                  </td>
                  <td
                    onClick={() => openQuestionModal(idx)}
                    className="py-2.5 px-3 font-mono text-xs text-indigo-700 hover:underline cursor-pointer break-all font-bold"
                    title="클릭하여 문항 상세 조회"
                  >
                    {m.qa_code}
                  </td>
                  <td
                    onClick={() => openQuestionModal(idx)}
                    className="py-2.5 px-3 cursor-pointer group"
                    title="클릭하여 문항 상세 조회"
                  >
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2">
                      <span className="text-indigo-600 font-extrabold mr-1">Q.</span>
                      {m.qa_subject}
                    </div>
                    {m.qa_type !== 'y' && (m.qa_q1 || m.qa_q2) && (
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {[m.qa_q1, m.qa_q2, m.qa_q3, m.qa_q4, m.qa_q5]
                          .map((c, i) => (c ? `${i + 1}) ${c}` : null))
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => openQuestionModal(idx)}
                    className="py-2.5 px-3 text-xs cursor-pointer"
                  >
                    {m.qa_tendency_map ? (
                      <span className="font-mono font-bold text-amber-800">
                        성향 ({['seL', 'foC', 'skI', 'reL', 'obJ'].map((k) => m.qa_tendency_map?.[k]).join('')})
                      </span>
                    ) : m.qa_answer ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold break-all">
                        {m.qa_type === 'n' && /^[1-5]$/.test(String(m.qa_answer))
                          ? `${m.qa_answer}번`
                          : m.qa_answer}
                      </span>
                    ) : (
                      <span className="text-slate-400">무배점</span>
                    )}
                  </td>
                  <td
                    onClick={() => openQuestionModal(idx)}
                    className="py-2.5 px-3 text-xs cursor-pointer"
                  >
                    {m.qa_tendency_map ? (
                      <div className="grid grid-cols-5 text-center rounded border border-amber-200 bg-amber-50/60 text-[10px] font-mono font-bold text-amber-900 py-0.5">
                        {(['seL', 'foC', 'skI', 'reL', 'obJ'] as const).map((k) => (
                          <div key={k}>
                            {k}:{m.qa_tendency_map?.[k]}
                          </div>
                        ))}
                      </div>
                    ) : m.qa_metric ? (
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold">
                          {m.qa_metric}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold">
                          {m.qa_weight}점
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">0점</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openQuestionModal(idx)}
                        className="px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[11px] font-extrabold text-indigo-700"
                      >
                        조회
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMapping(m.item_no)}
                        className="px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-[11px] font-bold text-rose-600"
                      >
                        제외
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Questions Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-extrabold text-slate-900">
                검사 문항 추가 ({selectedQaNos.length}개 선택됨)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <input
                type="text"
                value={qSearch}
                onChange={(e) => setQSearch(e.target.value)}
                placeholder="문항코드, 질문내용 검색..."
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
              />
              <button
                type="button"
                onClick={handleAddSelectedQuestions}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold"
              >
                선택한 문항 추가하기
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <th className="py-2 px-3 w-12 text-center">선택</th>
                    <th className="py-2 px-3 w-20">유형</th>
                    <th className="py-2 px-3 w-36">문항코드</th>
                    <th className="py-2 px-3">질문 제목</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {availableQuestions.map((q) => {
                    const checked = selectedQaNos.includes(q.qa_no);
                    return (
                      <tr
                        key={q.qa_no}
                        onClick={() =>
                          setSelectedQaNos((prev) =>
                            checked
                              ? prev.filter((id) => id !== q.qa_no)
                              : [...prev, q.qa_no]
                          )
                        }
                        className="hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="w-4 h-4 accent-indigo-600"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          {q.qa_type === 'y' ? '주관식' : '객관식'}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{q.qa_code}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {q.qa_subject}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Question Detail & Edit Modal */}
      {editingQa && viewingIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
          onClick={() => {
            setEditingQa(null);
            setViewingIdx(null);
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Prev / Next navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono text-xs font-extrabold">
                    노출순서 #{editingQa.item_seq}
                  </span>
                  {editingQa.al_test_no && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-extrabold">
                      {editingQa.al_test_no}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                      editingQa.qa_type === 'y'
                        ? 'bg-purple-100 text-purple-800'
                        : editingQa.qa_tendency_map
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {editingQa.qa_type === 'y'
                      ? '주관식 문항'
                      : editingQa.qa_tendency_map
                      ? '성향 5지선다 문항'
                      : '객관식 5지선다 문항'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1.5">
                  문항 상세 조회 및 수정 —{' '}
                  <span className="font-mono text-indigo-600">{editingQa.qa_code}</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={viewingIdx <= 0}
                  onClick={() => openQuestionModal(viewingIdx - 1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  ◀ 이전 문항
                </button>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {viewingIdx + 1} / {mappings.length}
                </span>
                <button
                  type="button"
                  disabled={viewingIdx >= mappings.length - 1}
                  onClick={() => openQuestionModal(viewingIdx + 1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  다음 문항 ▶
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingQa(null);
                    setViewingIdx(null);
                  }}
                  className="ml-2 text-slate-400 hover:text-slate-700 font-bold text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Live Exam Screen Preview Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 mb-6">
              <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                수험자 검사 화면 미리보기
              </div>
              <div className="text-base font-extrabold text-slate-900 mb-3">
                <span className="text-indigo-600 mr-1.5">Q.</span>
                {editingQa.qa_subject}
              </div>

              {editingQa.qa_content && (
                <div className="rounded-xl bg-white border border-slate-200 p-3.5 text-xs text-slate-700 whitespace-pre-line mb-3 leading-relaxed">
                  {editingQa.qa_content}
                </div>
              )}

              {editingQa.qa_file && (
                <div className="rounded-xl bg-white border border-slate-200 p-3 mb-3 flex justify-center">
                  <img
                    src={
                      editingQa.qa_file.startsWith('data:') ||
                      editingQa.qa_file.startsWith('http') ||
                      editingQa.qa_file.startsWith('/')
                        ? editingQa.qa_file
                        : `/data/test/${editingQa.qa_file}`
                    }
                    alt="문항 첨부 이미지"
                    className="max-h-56 object-contain rounded"
                  />
                </div>
              )}

              {editingQa.qa_type !== 'y' ? (
                <div className="space-y-1.5 mt-2">
                  {(['qa_q1', 'qa_q2', 'qa_q3', 'qa_q4', 'qa_q5'] as const).map(
                    (key, i) => {
                      const choiceNum = i + 1;
                      const text = editingQa[key];
                      if (!text) return null;
                      const isCorrect =
                        !editingQa.qa_tendency_map &&
                        String(editingQa.qa_answer || '') === String(choiceNum);
                      const tendencyKeys = editingQa.qa_tendency_map
                        ? (['seL', 'foC', 'skI', 'reL', 'obJ'] as const).filter(
                            (k) => Number(editingQa.qa_tendency_map?.[k]) === choiceNum
                          )
                        : [];

                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-extrabold'
                              : 'border-slate-200 bg-white text-slate-800 font-semibold'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-extrabold ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {choiceNum}
                            </span>
                            <span>{text}</span>
                          </div>
                          {isCorrect && (
                            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-extrabold shrink-0">
                              ✓ 정답
                            </span>
                          )}
                          {tendencyKeys.length > 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-mono text-[11px] font-extrabold shrink-0">
                              성향지표: {tendencyKeys.join(', ')}
                            </span>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-white border border-purple-200 p-3 text-xs">
                  <span className="font-extrabold text-purple-800 mr-2">
                    주관식 채점 기준 답안:
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {editingQa.qa_answer || '(비채점 설문/서술 문항)'}
                  </span>
                </div>
              )}
            </div>

            {/* Direct Edit Form */}
            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
                <div className="font-extrabold text-indigo-950">
                  🎯 정답 · 측정지표 · 배점 및 성향 보기 매핑 설정
                </div>

                {editingQa.qa_tendency_map ? (
                  <div className="grid grid-cols-5 gap-2">
                    {(['seL', 'foC', 'skI', 'reL', 'obJ'] as const).map((k) => (
                      <div
                        key={k}
                        className="rounded-xl border border-amber-200 bg-white p-2 text-center"
                      >
                        <label className="block font-mono font-extrabold text-amber-900 mb-1">
                          {k}
                        </label>
                        <select
                          value={editingQa.qa_tendency_map?.[k] || 1}
                          onChange={(e) => {
                            const nextMap = {
                              ...(editingQa.qa_tendency_map || {}),
                              [k]: Number(e.target.value),
                            };
                            setEditingQa({
                              ...editingQa,
                              qa_tendency_map: nextMap,
                            });
                          }}
                          className="w-full rounded-lg border border-amber-300 px-2 py-1 text-center font-extrabold"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}번 보기
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        정답 / 채점 답안
                      </label>
                      <input
                        type="text"
                        value={editingQa.qa_answer || ''}
                        onChange={(e) =>
                          setEditingQa({
                            ...editingQa,
                            qa_answer: e.target.value,
                            qa_sub2: e.target.value,
                          })
                        }
                        placeholder="객관식 1~5 또는 주관식 정답"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-extrabold text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        측정 지표 (seL ~ awD)
                      </label>
                      <input
                        type="text"
                        value={editingQa.qa_metric || ''}
                        onChange={(e) =>
                          setEditingQa({
                            ...editingQa,
                            qa_metric: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono font-bold text-indigo-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        배점 (가중치)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingQa.qa_weight ?? 0}
                        onChange={(e) =>
                          setEditingQa({
                            ...editingQa,
                            qa_weight: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  질문 제목 (qa_subject)
                </label>
                <input
                  type="text"
                  value={editingQa.qa_subject || ''}
                  onChange={(e) =>
                    setEditingQa({ ...editingQa, qa_subject: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  지문 내용 (qa_content)
                </label>
                <textarea
                  rows={2}
                  value={editingQa.qa_content || ''}
                  onChange={(e) =>
                    setEditingQa({ ...editingQa, qa_content: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </div>

              {editingQa.qa_type !== 'y' && (
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-600">객관식 선택지 1~5 수정</div>
                  {(['qa_q1', 'qa_q2', 'qa_q3', 'qa_q4', 'qa_q5'] as const).map(
                    (key, i) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-16 font-bold text-slate-500">
                          선택지 {i + 1}
                        </span>
                        <input
                          type="text"
                          value={(editingQa[key] as string) || ''}
                          onChange={(e) =>
                            setEditingQa({ ...editingQa, [key]: e.target.value })
                          }
                          className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5"
                        />
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingQa(null);
                    setViewingIdx(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={savingQa}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold"
                >
                  {savingQa ? '저장 중...' : '문항 변경사항 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
