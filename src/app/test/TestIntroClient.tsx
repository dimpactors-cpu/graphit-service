'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AGREEMENT_ITEMS = [
  '검사는 조용하고 집중할 수 있는 환경에서 진행해 주세요.',
  '각 문항에는 제한시간이 설정되어 있을 수 있으며, 제한시간 초과 시 자동으로 다음 문항으로 넘어갑니다.',
  '한 번 제출하여 넘어간 이전 문항으로는 되돌아갈 수 없습니다.',
  '검사 도중 브라우저를 닫거나 중단하더라도 마이페이지에서 이어서 진행할 수 있습니다.',
  '외부 검색이나 타인의 도움 없이 본인의 생각과 실력으로 성실히 응답해 주세요.',
  '검사 문항 및 이미지의 무단 캡처, 복제, 유포 행위는 저작권법에 의해 금지됩니다.',
  '모든 문항의 응답이 완료되면 최종 제출되며 이후 수정이 불가능합니다.',
];

interface TestIntroClientProps {
  itId: string;
  testIdx?: number;
  itName: string;
  totalQuestions: number;
  answeredQuestions: number;
  nextSeq: number;
  isFresh?: boolean;
}

export default function TestIntroClient({
  itId,
  testIdx,
  itName,
  totalQuestions,
  answeredQuestions,
  nextSeq,
  isFresh = false,
}: TestIntroClientProps) {
  const router = useRouter();
  const [checked, setChecked] = useState<boolean[]>(
    new Array(AGREEMENT_ITEMS.length).fill(false)
  );

  const allChecked = checked.every(Boolean);

  const toggleAll = (val: boolean) => {
    setChecked(new Array(AGREEMENT_ITEMS.length).fill(val));
  };

  const toggleIndex = (idx: number) => {
    setChecked((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const handleStart = () => {
    if (!allChecked) {
      alert('검사 유의사항을 모두 확인하고 체크해 주세요.');
      return;
    }
    router.push(
      `/test/run?it_id=${encodeURIComponent(itId)}${
        testIdx ? `&test_idx=${testIdx}` : ''
      }&seq=${nextSeq}${isFresh ? '&fresh=1' : ''}`
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm">
        <div className="text-center border-b border-slate-100 pb-6 mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
            온라인 진단검사 안내
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {itName}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            총 <strong className="text-slate-800">{totalQuestions}문항</strong> 중 현재{' '}
            <strong className="text-indigo-600">{answeredQuestions}문항</strong>을 완료하셨습니다.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between bg-slate-900 text-white rounded-2xl px-5 py-4">
            <label className="flex items-center gap-3 cursor-pointer select-none font-bold text-sm sm:text-base w-full">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => toggleAll(e.target.checked)}
                className="w-5 h-5 rounded accent-indigo-500"
              />
              <span>검사 진행 유의사항 전체 확인 및 동의</span>
            </label>
          </div>

          <div className="space-y-2.5 pt-2">
            {AGREEMENT_ITEMS.map((text, idx) => (
              <label
                key={idx}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition select-none text-sm ${
                  checked[idx]
                    ? 'border-indigo-300 bg-indigo-50/40 text-slate-900 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked[idx]}
                  onChange={() => toggleIndex(idx)}
                  className="mt-0.5 w-4 h-4 rounded accent-indigo-600 shrink-0"
                />
                <span>
                  <strong className="text-indigo-600 mr-1.5">[{idx + 1}]</strong>
                  {text}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <Link
            href="/mypage"
            className="px-6 py-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            마이페이지로 돌아가기
          </Link>
          <button
            type="button"
            onClick={handleStart}
            className={`flex-1 py-3.5 rounded-xl text-base font-extrabold text-white shadow-sm transition ${
              allChecked
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-slate-400 hover:bg-slate-500'
            }`}
          >
            {answeredQuestions > 0 ? `${nextSeq}번 문항부터 이어서 시작하기 →` : '검사 시작하기 →'}
          </button>
        </div>
      </div>
    </div>
  );
}
