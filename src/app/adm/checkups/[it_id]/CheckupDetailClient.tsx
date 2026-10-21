'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';

export interface MappedQuestionRow {
  item_no: number;
  item_seq: number;
  item_timer: number;
  qa_no: number;
  qa_code: string;
  qa_type: string;
  qa_subject: string;
  qa_sub1: string;
  qa_level: string;
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
  const [savingInfo, setSavingInfo] = useState(false);

  const [mappings, setMappings] = useState<MappedQuestionRow[]>(initialMappings);
  const [savingMappings, setSavingMappings] = useState(false);

  // Add questions popup state
  const [showAddModal, setShowAddModal] = useState(false);
  const [qSearch, setQSearch] = useState('');
  const [selectedQaNos, setSelectedQaNos] = useState<number[]>([]);

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
                <th className="py-3 px-4 w-24 text-center">노출순서</th>
                <th className="py-3 px-4 w-32 text-center">제한시간(초)</th>
                <th className="py-3 px-4 w-20 text-center">유형</th>
                <th className="py-3 px-4 w-40">문항식별코드</th>
                <th className="py-3 px-4">질문 제목</th>
                <th className="py-3 px-4 w-28">분류/난이도</th>
                <th className="py-3 px-4 w-20 text-center">제외</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mappings.map((m, idx) => (
                <tr key={m.item_no} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-center">
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
                  </td>
                  <td className="py-2.5 px-4 text-center">
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
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        m.qa_type === 'y'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {m.qa_type === 'y' ? '주관식' : '객관식'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-600">
                    {m.qa_code}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 line-clamp-1">
                    {m.qa_subject}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-500">
                    {m.qa_sub1 || '-'} ({m.qa_level || '-'})
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteMapping(m.item_no)}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      제외
                    </button>
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
    </AdminLayout>
  );
}
