'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { GraphitQaRow } from '@/lib/db';
import { fileToDataUrl } from '@/lib/imageUpload';

export default function QuestionsClient({
  questions,
}: {
  questions: GraphitQaRow[];
}) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'n' | 'y'>('ALL');
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<Partial<GraphitQaRow> | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (typeFilter !== 'ALL' && q.qa_type !== typeFilter) return false;
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        return (
          (q.qa_code || '').toLowerCase().includes(kw) ||
          (q.qa_subject || '').toLowerCase().includes(kw) ||
          (q.qa_summary || '').toLowerCase().includes(kw) ||
          (q.qa_sub1 || '').toLowerCase().includes(kw)
        );
      }
      return true;
    });
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
        alert('문항이 저장되었습니다.');
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

  return (
    <AdminLayout
      title="문항관리 (객관식 / 주관식 문항 DB)"
      subtitle="온라인 진단검사에 사용되는 전체 문항 풀(Pool)을 등록·수정·삭제합니다."
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
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          {(
            [
              { id: 'ALL', label: `전체 문항 (${questions.length})` },
              { id: 'n', label: '객관식 (5지선다)' },
              { id: 'y', label: '주관식 (서술형)' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                typeFilter === t.id
                  ? 'bg-slate-900 text-white'
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
          placeholder="문항코드, 질문내용, 분류 검색..."
          className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs w-full sm:w-80 focus:border-indigo-600 focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="py-3 px-4 w-16 text-center">번호</th>
                <th className="py-3 px-4 w-20 text-center">유형</th>
                <th className="py-3 px-4 w-44">문항식별코드</th>
                <th className="py-3 px-4">질문 / 요약</th>
                <th className="py-3 px-4 w-36">주제분류 / 난이도</th>
                <th className="py-3 px-4 w-24 text-center">이미지</th>
                <th className="py-3 px-4 w-28 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((q) => (
                <tr key={q.qa_no} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                    {q.qa_no}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        q.qa_type === 'y'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {q.qa_type === 'y' ? '주관식' : '객관식'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-bold text-slate-700">
                    {q.qa_code}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 line-clamp-1">
                      {q.qa_subject}
                    </div>
                    {q.qa_summary && (
                      <div className="text-xs text-slate-500 line-clamp-1">
                        {q.qa_summary}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    <div>
                      {q.qa_sub1 || '-'} / {q.qa_sub2 || '-'}
                    </div>
                    <div className="text-slate-400">난이도: {q.qa_level || '-'}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {q.qa_file ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        포함됨
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditing({ ...q })}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Question Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editing.qa_no ? `문항 수정 (#${editing.qa_no})` : '신규 문항 등록'} —{' '}
                {editing.qa_type === 'y' ? '주관식' : '객관식'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    문항식별코드 *
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
                    난이도
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    주제 1분류 / 2분류
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="1분류"
                      value={editing.qa_sub1 || ''}
                      onChange={(e) =>
                        setEditing({ ...editing, qa_sub1: e.target.value })
                      }
                      className="w-1/2 rounded-xl border border-slate-300 px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="2분류"
                      value={editing.qa_sub2 || ''}
                      onChange={(e) =>
                        setEditing({ ...editing, qa_sub2: e.target.value })
                      }
                      className="w-1/2 rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    성향 / 역량
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="성향"
                      value={editing.qa_tendency || ''}
                      onChange={(e) =>
                        setEditing({ ...editing, qa_tendency: e.target.value })
                      }
                      className="w-1/2 rounded-xl border border-slate-300 px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="역량"
                      value={editing.qa_power || ''}
                      onChange={(e) =>
                        setEditing({ ...editing, qa_power: e.target.value })
                      }
                      className="w-1/2 rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>
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
                  <div className="font-bold text-slate-700">객관식 선택지 1~5</div>
                  {(['qa_q1', 'qa_q2', 'qa_q3', 'qa_q4', 'qa_q5'] as const).map(
                    (key, idx) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-14 font-bold text-slate-500">
                          선택지 {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={(editing[key] as string) || ''}
                          onChange={(e) =>
                            setEditing({ ...editing, [key]: e.target.value })
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
