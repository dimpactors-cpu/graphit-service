'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { GraphitQaRow } from '@/lib/db';
import { fileToDataUrl } from '@/lib/imageUpload';

const TENDENCY_KEYS = ['seL', 'foC', 'skI', 'reL', 'obJ'] as const;

const ALL_METRICS = [
  'seL', 'foC', 'skI', 'reL', 'obJ',
  'kwD', 'suM', 'coL', 'jdG', 'cpR', 'apP', 'frM', 'prM', 'stU', 'seT', 'cpS',
  'erR', 'inF', 'rbD', 'mmM', 'dcS', 'slD', 'prP', 'enP', 'flX', 'rsP', 'udT',
  'prR', 'adT', 'inT', 'cmA', 'inR', 'spT', 'rnE', 'stB', 'raG', 'slC', 'caE',
  'caD', 'scR', 'exP', 'laN', 'qlF', 'awD',
];

function parseTestNoNum(testNo?: string): number {
  if (!testNo) return 999999;
  const m = String(testNo).match(/No_(\d+)/i);
  return m ? Number(m[1]) : 999999;
}

function getTendencyMap(q: Partial<GraphitQaRow>): Record<string, number> | null {
  if (q.qa_tendency_map && Object.keys(q.qa_tendency_map).length > 0) {
    return q.qa_tendency_map;
  }
  const raw = String(q.qa_tendency || '').trim();
  if (/^[1-5]{5}$/.test(raw)) {
    return {
      seL: Number(raw[0]),
      foC: Number(raw[1]),
      skI: Number(raw[2]),
      reL: Number(raw[3]),
      obJ: Number(raw[4]),
    };
  }
  return null;
}

export default function QuestionsClient({
  questions,
}: {
  questions: GraphitQaRow[];
}) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'AL' | 'n' | 'y' | 'TENDENCY'>('AL');
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<Partial<GraphitQaRow> | null>(null);
  const [saving, setSaving] = useState(false);

  const alCount = useMemo(
    () => questions.filter((q) => Boolean(q.al_test_no)).length,
    [questions]
  );

  const tendencyCount = useMemo(
    () => questions.filter((q) => Boolean(getTendencyMap(q))).length,
    [questions]
  );

  const filtered = useMemo(() => {
    const list = questions.filter((q) => {
      if (typeFilter === 'AL' && !q.al_test_no) return false;
      if (typeFilter === 'n' && q.qa_type !== 'n') return false;
      if (typeFilter === 'y' && q.qa_type !== 'y') return false;
      if (typeFilter === 'TENDENCY' && !getTendencyMap(q)) return false;

      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        return (
          (q.qa_code || '').toLowerCase().includes(kw) ||
          (q.al_q_code || '').toLowerCase().includes(kw) ||
          (q.al_test_no || '').toLowerCase().includes(kw) ||
          (q.qa_subject || '').toLowerCase().includes(kw) ||
          (q.qa_summary || '').toLowerCase().includes(kw) ||
          (q.qa_sub1 || '').toLowerCase().includes(kw) ||
          (q.qa_answer || '').toLowerCase().includes(kw) ||
          (q.qa_metric || '').toLowerCase().includes(kw)
        );
      }
      return true;
    });

    if (typeFilter === 'AL' || typeFilter === 'TENDENCY') {
      return [...list].sort((a, b) => {
        const na = parseTestNoNum(a.al_test_no);
        const nb = parseTestNoNum(b.al_test_no);
        if (na !== nb) return na - nb;
        return Number(a.qa_no) - Number(b.qa_no);
      });
    }
    return list;
  }, [questions, typeFilter, keyword]);

  const openNewModal = (qaType: 'n' | 'y') => {
    setEditing({
      qa_type: qaType,
      qa_code: '',
      qa_summary: '',
      qa_sub1: '',
      qa_sub2: '',
      qa_level: '중',
      qa_tendency: '',
      qa_power: '',
      qa_subject: '',
      qa_content: '',
      qa_file: '',
      qa_q1: '',
      qa_q2: '',
      qa_q3: '',
      qa_q4: '',
      qa_q5: '',
      qa_answer: '',
      qa_metric: '',
      qa_weight: 1,
      qa_tendency_map: null,
      al_test_no: '',
      al_q_code: '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (data.ok) {
        alert('문항 및 정답/배점 정보가 저장되었습니다.');
        setEditing(null);
        window.location.reload();
      } else {
        alert(data.message || '저장 실패');
      }
    } catch {
      alert('서버 통신 오류');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (qaNo: number | string) => {
    if (!confirm('해당 문항을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/question?qa_no=${qaNo}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        router.refresh();
      } else {
        alert(data.message || '삭제 실패');
      }
    } catch {
      alert('서버 통신 오류');
    }
  };

  const editingTendencyMap = editing ? getTendencyMap(editing) : null;

  return (
    <AdminLayout
      title="문항관리 (문항별 정답 · 배점 · 성향지표 통합관리)"
      subtitle="온라인 진단검사 문항 풀(Pool)과 al_data_set 기준 문항별 정답, 측정지표(44개), 배점 및 성향 보기 매핑(seL·foC·skI·reL·obJ)을 관리합니다."
      actions={
        <>
          <a
            href="/api/admin/excel?type=exam"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition"
          >
            📥 전체 문항 엑셀 다운로드
          </a>
          <button
            type="button"
            onClick={() => openNewModal('n')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition"
          >
            + 객관식 등록
          </button>
          <button
            type="button"
            onClick={() => openNewModal('y')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition"
          >
            + 주관식 등록
          </button>
        </>
      }
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'AL', label: `AL 데이터셋 문항 (No_1~No_208 · ${alCount}문항)` },
              { id: 'ALL', label: `전체 문항 DB (${questions.length})` },
              { id: 'TENDENCY', label: `성향검사 12345 매핑 (${tendencyCount})` },
              { id: 'n', label: '객관식 (5지선다)' },
              { id: 'y', label: '주관식 (단답/서술)' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                typeFilter === t.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="No_번호, 문항코드, 질문내용, 정답, 지표(seL, kwD 등) 검색..."
          className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs w-full lg:w-80 focus:border-indigo-600 focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="py-3 px-3 w-24 text-center">번호 / test_no</th>
                <th className="py-3 px-3 w-20 text-center">유형</th>
                <th className="py-3 px-3 w-44">문항식별코드 (Q_code)</th>
                <th className="py-3 px-3">질문 / 선택지 요약</th>
                <th className="py-3 px-3 w-44">정답 (답안)</th>
                <th className="py-3 px-3 w-64">지표 · 배점 / 성향 보기 매핑</th>
                <th className="py-3 px-3 w-24 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((q) => {
                const tMap = getTendencyMap(q);
                const ans = String(q.qa_answer ?? q.qa_sub2 ?? '').trim();
                const metric = String(q.qa_metric ?? q.qa_power ?? '').trim();
                const weight =
                  q.qa_weight !== undefined && q.qa_weight !== ''
                    ? Number(q.qa_weight)
                    : null;

                return (
                  <tr key={q.qa_no} className="hover:bg-slate-50/80 align-middle">
                    <td className="py-3 px-3 text-center">
                      {q.al_test_no ? (
                        <div className="inline-flex px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-extrabold mb-0.5">
                          {q.al_test_no}
                        </div>
                      ) : null}
                      <div className="font-mono text-[11px] text-slate-400">
                        #{q.qa_no}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          q.qa_type === 'y'
                            ? 'bg-purple-100 text-purple-800'
                            : tMap
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {q.qa_type === 'y'
                          ? '주관식'
                          : tMap
                          ? '성향5지'
                          : '객관식'}
                      </span>
                      {q.qa_file && (
                        <div className="mt-1">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            이미지
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono text-xs">
                      <div className="font-bold text-slate-800 break-all">
                        {q.qa_code}
                      </div>
                      {q.al_q_code && q.al_q_code !== q.qa_code && (
                        <div className="text-[11px] text-indigo-600 break-all mt-0.5">
                          AL: {q.al_q_code}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 line-clamp-2">
                        {q.qa_subject}
                      </div>
                      {q.qa_type !== 'y' && (q.qa_q1 || q.qa_q2) && (
                        <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                          {[q.qa_q1, q.qa_q2, q.qa_q3, q.qa_q4, q.qa_q5].map(
                            (choice, idx) =>
                              choice ? (
                                <span
                                  key={idx}
                                  className={
                                    !tMap && ans === String(idx + 1)
                                      ? 'font-extrabold text-emerald-700 underline'
                                      : ''
                                  }
                                >
                                  {idx + 1}) {choice}
                                </span>
                              ) : null
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {tMap ? (
                        <div className="text-xs">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                            성향 보기별 매핑 ({TENDENCY_KEYS.map((k) => tMap[k]).join('')})
                          </span>
                        </div>
                      ) : ans ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs break-all">
                            {q.qa_type === 'n' && /^[1-5]$/.test(ans)
                              ? `정답: ${ans}번 보기`
                              : `답안: ${ans}`}
                          </span>
                          {q.qa_type === 'n' &&
                            /^[1-5]$/.test(ans) &&
                            (q as any)[`qa_q${ans}`] && (
                              <div className="text-[11px] text-slate-500 line-clamp-1">
                                ({(q as any)[`qa_q${ans}`]})
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          정답 없음 (비채점/설문)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {tMap ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
                          <div className="grid grid-cols-5 text-center bg-amber-100/80 border-b border-amber-200 text-[10px] font-extrabold text-amber-900 py-1">
                            {TENDENCY_KEYS.map((k) => (
                              <div key={k}>{k}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-5 text-center py-1 text-xs font-extrabold text-slate-800 divide-x divide-amber-200/60">
                            {TENDENCY_KEYS.map((k) => (
                              <div key={k} title={`${k}: ${tMap[k]}번 보기`}>
                                {tMap[k]}번
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : metric ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-extrabold">
                            지표: {metric}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-xs font-extrabold">
                            배점: {weight !== null ? weight : 1}점
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">
                          {weight === 0 ? '배점 0점 (미반영 문항)' : '-'}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              ...q,
                              qa_answer: q.qa_answer ?? q.qa_sub2 ?? '',
                              qa_metric: q.qa_metric ?? q.qa_power ?? '',
                              qa_weight: q.qa_weight ?? (q.qa_metric ? 1 : 0),
                              qa_tendency_map: getTendencyMap(q),
                            })
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-300 hover:border-indigo-500 text-xs font-bold text-slate-700"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(q.qa_no)}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Question Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editing.qa_no ? `문항 수정 (#${editing.qa_no})` : '신규 문항 등록'} —{' '}
                  {editing.qa_type === 'y' ? '주관식' : '객관식'}
                </h3>
                {editing.al_test_no && (
                  <p className="text-xs text-indigo-600 font-bold mt-0.5">
                    AL 데이터셋 문항번호: {editing.al_test_no} (Q_code: {editing.al_q_code || editing.qa_code})
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-600 mb-1">
                    문항식별코드 (qa_code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editing.qa_code || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, qa_code: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    유형
                  </label>
                  <select
                    value={editing.qa_type || 'n'}
                    onChange={(e) =>
                      setEditing({ ...editing, qa_type: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                  >
                    <option value="n">객관식 (5지선다)</option>
                    <option value="y">주관식 (단답/서술)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    AL 문항번호 (test_no)
                  </label>
                  <input
                    type="text"
                    placeholder="예: No_1"
                    value={editing.al_test_no || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, al_test_no: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              {/* AL Dataset Answer & Scoring Box */}
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-indigo-950 text-sm">
                    🎯 문항별 정답 · 측정지표 · 배점 및 성향 매핑 설정 (al_data_set)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingTendencyMap) {
                        setEditing({
                          ...editing,
                          qa_tendency_map: null,
                          qa_tendency: '',
                        });
                      } else {
                        setEditing({
                          ...editing,
                          qa_tendency_map: { seL: 1, foC: 2, skI: 3, reL: 4, obJ: 5 },
                          qa_tendency: '12345',
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition ${
                      editingTendencyMap
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {editingTendencyMap
                      ? '성향 5지표(12345) 문항 해제'
                      : '+ 성향 5지표(seL~obJ) 문항으로 설정'}
                  </button>
                </div>

                {editingTendencyMap ? (
                  <div className="bg-white rounded-xl border border-amber-200 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-900">
                        성향 검사 지표별 보기 번호 매핑 (각 지표에 해당하는 보기 번호 1~5)
                      </span>
                      <span className="font-mono text-xs font-extrabold text-amber-700">
                        코드: {TENDENCY_KEYS.map((k) => editingTendencyMap[k] || 0).join('')}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {TENDENCY_KEYS.map((k) => (
                        <div
                          key={k}
                          className="rounded-xl border border-amber-200 bg-amber-50/40 p-2 text-center"
                        >
                          <label className="block font-mono font-extrabold text-amber-900 text-xs mb-1">
                            {k}
                          </label>
                          <select
                            value={editingTendencyMap[k] || 1}
                            onChange={(e) => {
                              const nextMap = {
                                ...editingTendencyMap,
                                [k]: Number(e.target.value),
                              };
                              setEditing({
                                ...editing,
                                qa_tendency_map: nextMap,
                                qa_tendency: TENDENCY_KEYS.map((key) => nextMap[key]).join(''),
                              });
                            }}
                            className="w-full rounded-lg border border-amber-300 bg-white px-2 py-1 text-center font-extrabold text-slate-900"
                          >
                            {[1, 2, 3, 4, 5].map((num) => (
                              <option key={num} value={num}>
                                {num}번 보기
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        정답 / 채점 답안 (답안)
                      </label>
                      <input
                        type="text"
                        placeholder={
                          editing.qa_type === 'y'
                            ? '예: {그릇}, 양, 량 / 13'
                            : '객관식 정답 번호 (1~5)'
                        }
                        value={editing.qa_answer ?? ''}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            qa_answer: e.target.value,
                            qa_sub2: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-extrabold text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        측정 지표 (seL ~ awD)
                      </label>
                      <input
                        type="text"
                        list="al-metrics-list"
                        placeholder="예: kwD, suM, seL..."
                        value={editing.qa_metric ?? ''}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            qa_metric: e.target.value,
                            qa_power: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono font-bold text-indigo-700"
                      />
                      <datalist id="al-metrics-list">
                        {ALL_METRICS.map((m) => (
                          <option key={m} value={m} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        배점 (가중치 점수)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={editing.qa_weight ?? 0}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            qa_weight: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    주제 분류 (qa_sub1)
                  </label>
                  <input
                    type="text"
                    placeholder="분류"
                    value={editing.qa_sub1 || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, qa_sub1: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    난이도 (qa_level)
                  </label>
                  <input
                    type="text"
                    value={editing.qa_level || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, qa_level: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    AL 원본코드 (al_q_code)
                  </label>
                  <input
                    type="text"
                    value={editing.al_q_code || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, al_q_code: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  질문 제목 (qa_subject) *
                </label>
                <input
                  type="text"
                  required
                  value={editing.qa_subject || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, qa_subject: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  지문 내용 (qa_content)
                </label>
                <textarea
                  rows={3}
                  value={editing.qa_content || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, qa_content: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  문항 첨부 이미지 (직접 업로드 또는 /data/test/ 내 파일명)
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={
                        editing.qa_file?.startsWith('data:')
                          ? '[직접 업로드된 문항 이미지]'
                          : editing.qa_file || ''
                      }
                      onChange={(e) =>
                        setEditing({ ...editing, qa_file: e.target.value })
                      }
                      placeholder="예: 3551888116_xxx.png"
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-2 font-mono"
                    />
                    <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold shrink-0 inline-flex items-center">
                      <span>📁 이미지 파일 업로드</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const dataUrl = await fileToDataUrl(file, 1000);
                          setEditing((prev) =>
                            prev ? { ...prev, qa_file: dataUrl } : prev
                          );
                        }}
                      />
                    </label>
                    {editing.qa_file && (
                      <button
                        type="button"
                        onClick={() => setEditing({ ...editing, qa_file: '' })}
                        className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 font-bold"
                      >
                        제거
                      </button>
                    )}
                  </div>
                  {editing.qa_file && (
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex justify-center">
                      <img
                        src={
                          editing.qa_file.startsWith('data:') ||
                          editing.qa_file.startsWith('http') ||
                          editing.qa_file.startsWith('/')
                            ? editing.qa_file
                            : `/data/test/${editing.qa_file}`
                        }
                        alt="문항 이미지 미리보기"
                        className="max-h-40 object-contain rounded"
                      />
                    </div>
                  )}
                </div>
              </div>

              {editing.qa_type !== 'y' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="font-bold text-slate-700">
                    객관식 선택지 1~5 (정답 또는 성향 매핑 확인)
                  </div>
                  {(['qa_q1', 'qa_q2', 'qa_q3', 'qa_q4', 'qa_q5'] as const).map(
                    (key, idx) => {
                      const choiceNum = idx + 1;
                      const isCorrect =
                        !editingTendencyMap &&
                        String(editing.qa_answer || '') === String(choiceNum);
                      const matchedTendencies = editingTendencyMap
                        ? TENDENCY_KEYS.filter(
                            (tk) => Number(editingTendencyMap[tk]) === choiceNum
                          )
                        : [];

                      return (
                        <div key={key} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!editingTendencyMap) {
                                setEditing({
                                  ...editing,
                                  qa_answer: String(choiceNum),
                                  qa_sub2: String(choiceNum),
                                });
                              }
                            }}
                            className={`w-20 py-1.5 rounded-lg font-extrabold text-center transition ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="클릭하여 이 보기를 정답으로 지정"
                          >
                            {choiceNum}번 {isCorrect ? '✓정답' : ''}
                          </button>
                          <input
                            type="text"
                            value={(editing[key] as string) || ''}
                            onChange={(e) =>
                              setEditing({ ...editing, [key]: e.target.value })
                            }
                            className={`flex-1 rounded-xl border px-3 py-1.5 ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-50/30 font-bold'
                                : 'border-slate-300'
                            }`}
                          />
                          {matchedTendencies.length > 0 && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-mono font-extrabold text-xs shrink-0">
                              지표: {matchedTendencies.join(', ')}
                            </span>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold"
                >
                  {saving ? '저장 중...' : '문항 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
