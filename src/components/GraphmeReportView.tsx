'use client';

import React, { useState } from 'react';
import type { StudentReportData, ResultBaseRow } from '@/lib/reportEngine';

interface Props {
  report: StudentReportData;
  resultRow?: ResultBaseRow;
  canViewRawDb?: boolean;
  hideToolbar?: boolean;
  forceBwMode?: boolean;
  breakAfterLastPage?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

export default function GraphmeReportView({
  report,
  resultRow,
  canViewRawDb = false,
  hideToolbar = false,
  forceBwMode = false,
  breakAfterLastPage = false,
  onClose,
  isModal = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 1 | 2 | 3 | 4>('all');
  const [bwMode, setBwMode] = useState(false);
  const [showRawDbModal, setShowRawDbModal] = useState(false);
  const isBw = forceBwMode || bwMode;

  const handlePrint = () => {
    setActiveTab('all');
    const prevTitle = document.title;
    const safeGroup = (report.groupName || '그래프미').replace(/[\\/:*?"<>|\s]+/g, '_');
    const safeName = (report.name || '수강생').replace(/[\\/:*?"<>|\s]+/g, '_');
    document.title = `${safeGroup}_${safeName}_진단결과지`;
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = prevTitle;
      }, 500);
    }, 150);
  };

  const dirItems = [
    { title: '관계의 방향', ...report.directions.relationship },
    { title: '에너지의 방향', ...report.directions.energy },
    { title: '시간의 방향', ...report.directions.time },
    { title: '전략의 방향', ...report.directions.strategy },
    { title: '갈등의 방향', ...report.directions.conflict },
  ];

  const studyPairs = [
    {
      category: '학습 시점',
      leftLabel: '예습',
      leftVal: report.studyPlanRatios.prep,
      rightLabel: '복습',
      rightVal: report.studyPlanRatios.review,
    },
    {
      category: '학습 방식',
      leftLabel: '개념정리',
      leftVal: report.studyPlanRatios.concept,
      rightLabel: '문제풀이',
      rightVal: report.studyPlanRatios.problem,
    },
    {
      category: '개인 학습',
      leftLabel: '독학',
      leftVal: report.studyPlanRatios.selfStudy,
      rightLabel: '1:1 과외',
      rightVal: report.studyPlanRatios.tutoring1on1,
    },
    {
      category: '집단 학습',
      leftLabel: '그룹과외',
      leftVal: report.studyPlanRatios.groupTutoring,
      rightLabel: '학원',
      rightVal: report.studyPlanRatios.academy,
    },
    {
      category: '학습 공간',
      leftLabel: '독립형공간',
      leftVal: report.studyPlanRatios.independentSpace,
      rightLabel: '개방형공간',
      rightVal: report.studyPlanRatios.openSpace,
    },
  ];

  const congruencePct = Math.round(report.selfCongruenceRate * 1000) / 10;

  return (
    <div
      className={`report-print-wrapper ${isBw ? 'grayscale contrast-125' : ''}`}
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Top Action Bar (Hidden in Print) */}
      {!hideToolbar && (
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold">
            📊 그래프미 진단검사 결과지
          </span>
          <span className="text-sm font-extrabold text-slate-900">
            {report.name}님
          </span>
          <span className="text-xs text-slate-500">
            ({report.groupName} · #{report.serialNo})
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
            통합유형: {report.totalLitType} ({report.mbti})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            {[
              { key: 'all', label: '전체 4페이지' },
              { key: 1, label: '1. 자아실현' },
              { key: 2, label: '2. 습관' },
              { key: 3, label: '3. 진로/역량' },
              { key: 4, label: '4. 학습' },
            ].map((t) => (
              <button
                key={String(t.key)}
                type="button"
                onClick={() => setActiveTab(t.key as any)}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  activeTab === t.key
                    ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setBwMode(!bwMode)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition ${
              bwMode
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {bwMode ? '🎨 컬러 모드로 보기' : '⚫ 흑백(원본) 모드로 보기'}
          </button>

          {canViewRawDb && resultRow && (
            <button
              type="button"
              onClick={() => setShowRawDbModal(true)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              🧮 결과DB 수치 보기
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition"
          >
            🖨️ 결과지 인쇄 / PDF 저장
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition"
            >
              ✕ 닫기
            </button>
          )}
        </div>
      </div>
      )}

      {/* Pages Container */}
      <div className="report-print-wrapper space-y-8 print:space-y-0">
        {/* ================= PAGE 1: 자아실현 로드맵 ================= */}
        <section
          data-report-page="1"
          className={`report-print-page bg-white border-2 border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm print:shadow-none print:rounded-2xl print:border-2 print:border-slate-800 print:break-after-page print:break-inside-avoid ${
            activeTab !== 'all' && activeTab !== 1 ? 'hidden print:block' : ''
          }`}
        >
          {/* Page Header */}
          <div className="flex items-end justify-between border-b-2 border-slate-900 pb-4 mb-5">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-slate-500">
                Self-Realization Roadmap
              </div>
              <h2 className="text-2xl sm:text-3xl print:text-3xl font-black text-slate-900 mt-0.5">
                자아실현 로드맵
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500">
                  {report.groupName}
                </div>
                <div className="text-sm font-black text-slate-900">
                  {report.name}님 ·{' '}
                  <span className="text-indigo-700">{report.totalLitType}</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg font-black">
                01
              </div>
            </div>
          </div>

          {/* Intro Notice */}
          <div className="bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm print:text-sm text-slate-700 leading-relaxed mb-6">
            본 결과지는 그래프미 검사과정에서 나타난{' '}
            <strong className="font-extrabold text-slate-900">
              {report.name}
            </strong>
            님의 모습을 설명하고 있습니다. 검사 결과에 좋고 나쁨은 없으며,{' '}
            <strong className="font-extrabold text-slate-900">
              {report.name}
            </strong>
            님의 발전적 미래를 위한 참고 자료로 활용해 주시기 바랍니다.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 print:!grid-cols-12 gap-6">
            {/* Left 7 cols: 나는 어떤 방향으로 향하고 있을까? */}
            <div className="lg:col-span-7 print:!col-span-7 border border-slate-300 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mb-1.5">
                      DIRECTION ANALYSIS
                    </span>
                    <h3 className="text-lg font-black text-slate-900">
                      나는 어떤 방향으로 향하고 있을까?
                    </h3>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 leading-snug">
                    0에 가까울수록 조화로운 상태이며,
                    <br />
                    지수가 커질수록 해당 특성이 두드러집니다.
                  </div>
                </div>
                <p className="text-xs text-slate-600 mb-5">
                  여러 결정이 모여 한 사람의 발자취가 생겨나죠. 나는 어떤 방향으로
                  움직이는 사람일까요?
                </p>

                {/* 5 Diverging Bars */}
                <div className="space-y-4">
                  <div className="flex items-center text-[11px] font-bold text-slate-400 px-24">
                    <span className="flex-1 text-left">-50</span>
                    <span className="text-slate-700 font-extrabold">
                      balance (0)
                    </span>
                    <span className="flex-1 text-right">+50</span>
                  </div>

                  {dirItems.map((d) => {
                    const clamped = Math.max(-50, Math.min(50, d.score));
                    const pct = (Math.abs(clamped) / 50) * 50; // 0..50% width from center
                    const isNeg = d.score < 0;
                    return (
                      <div
                        key={d.title}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3"
                      >
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-500">{d.title}</span>
                          <span className="text-slate-900 font-extrabold">
                            {d.dominant} 성향 ({d.score > 0 ? '+' : ''}
                            {d.score.toFixed(1)})
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-16 text-right text-xs font-extrabold ${
                              isNeg ? 'text-indigo-700' : 'text-slate-500'
                            }`}
                          >
                            {d.leftLabel}
                          </span>
                          <div className="flex-1 h-5 bg-white border border-slate-300 rounded-full relative overflow-hidden">
                            {/* Center line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-800 z-10" />
                            {/* Bar */}
                            {isNeg ? (
                              <div
                                className="absolute top-0.5 bottom-0.5 bg-indigo-600 rounded-l-full"
                                style={{
                                  right: '50%',
                                  width: `${Math.max(2, pct)}%`,
                                }}
                              />
                            ) : (
                              <div
                                className="absolute top-0.5 bottom-0.5 bg-slate-800 rounded-r-full"
                                style={{
                                  left: '50%',
                                  width: `${Math.max(2, pct)}%`,
                                }}
                              />
                            )}
                          </div>
                          <span
                            className={`w-16 text-left text-xs font-extrabold ${
                              !isNeg ? 'text-slate-900' : 'text-slate-500'
                            }`}
                          >
                            {d.rightLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Type summary footer */}
              <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold">
                    측정 유형 (Test)
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {report.litType}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold">
                    자가진단 유형 (Survey)
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {report.survLitType}
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-xl p-2.5 border border-indigo-200">
                  <div className="text-[11px] text-indigo-600 font-bold">
                    종합 유형 (Total)
                  </div>
                  <div className="text-sm font-black text-indigo-900 mt-0.5">
                    {report.totalLitType} ({report.mbti})
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 cols: 자아일치도 + 직업가치관 */}
            <div className="lg:col-span-5 print:!col-span-5 flex flex-col gap-6">
              {/* 내가 생각하는 나 / 남이 생각하는 나 */}
              <div className="border border-slate-300 rounded-2xl p-5">
                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mb-1.5">
                  SELF-CONGRUENCE
                </span>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  내가 생각하는 나 · 남이 생각하는 나
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  내가 생각하는 모습과 측정된 모습은 얼마나 일치할까요? 일치율의
                  크기에 따라 좋고 나쁨은 없습니다. 각 모습이 합쳐져 지금의 내
                  모습이 되는 것이니까요!
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-5">
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="12"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="12"
                        strokeDasharray={`${congruencePct * 2.513} 251.3`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black text-slate-900">
                        {congruencePct}%
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        일치율
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="font-extrabold text-slate-900 text-sm">
                      자아일치율 지수: {report.selfCongruenceRate.toFixed(2)}
                    </div>
                    <div className="text-slate-600">
                      • 측정치와 자가진단 편차:{' '}
                      <strong>{report.selfEvaluationGap.toFixed(1)}%p</strong>
                    </div>
                    <div className="text-slate-500 text-[11px] leading-snug">
                      스스로 인식하는 성향({report.survLitType})과 실제 문항 수행을
                      통해 측정된 성향({report.litType})의 조화도를 나타냅니다.
                    </div>
                  </div>
                </div>
              </div>

              {/* 나는 어떤 가치관을 가지고 있을까? */}
              <div className="border border-slate-300 rounded-2xl p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mb-1.5">
                    CORE WORK VALUES
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mb-1.5">
                    나는 어떤 가치관을 가지고 있을까?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    나의 가치를 중심으로 일할 때 비로소 가슴이 뛰고 지속할 동력을
                    얻게 됩니다.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {report.coreValues.map((val, i) => (
                    <div
                      key={i}
                      className="rounded-xl border-2 border-slate-800 bg-slate-50 py-3.5 px-2 text-center flex flex-col items-center justify-center"
                    >
                      <span className="text-[10px] font-bold text-slate-400 mb-0.5">
                        VALUE 0{i + 1}
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Page Footer */}
          <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>GRAPHME INTEGRATED DIAGNOSTIC REPORT</span>
            <span>SERIAL NO. {report.serialNo} · PAGE 01 / 04</span>
          </div>
        </section>

        {/* ================= PAGE 2: 습관 로드맵 ================= */}
        <section
          data-report-page="2"
          className={`report-print-page bg-white border-2 border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm print:shadow-none print:rounded-2xl print:border-2 print:border-slate-800 print:break-after-page print:break-inside-avoid ${
            activeTab !== 'all' && activeTab !== 2 ? 'hidden print:block' : ''
          }`}
        >
          {/* Page Header */}
          <div className="flex items-end justify-between border-b-2 border-slate-900 pb-4 mb-5">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-slate-500">
                Habit Roadmap
              </div>
              <h2 className="text-2xl sm:text-3xl print:text-3xl font-black text-slate-900 mt-0.5">
                습관 로드맵
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500">
                  {report.groupName}
                </div>
                <div className="text-sm font-black text-slate-900">
                  {report.name}님 ·{' '}
                  <span className="text-indigo-700">{report.totalLitType}</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg font-black">
                02
              </div>
            </div>
          </div>

          {/* Intro Notice */}
          <div className="bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm print:text-sm text-slate-700 leading-relaxed mb-6">
            본 결과지는 그래프미 검사과정에서 나타난{' '}
            <strong className="font-extrabold text-slate-900">
              {report.name}
            </strong>
            님의 모습을 설명하고 있습니다. 검사 결과에 좋고 나쁨은 없으며,{' '}
            <strong className="font-extrabold text-slate-900">
              {report.name}
            </strong>
            님의 발전적 미래를 위한 참고 자료로 활용해 주시기 바랍니다.
          </div>

          {/* Section 1: 습관 특성 요약 */}
          <div className="border border-slate-300 rounded-2xl p-5 mb-6">
            <div className="flex flex-col sm:flex-row print:!flex-row sm:items-center print:!items-center justify-between gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mb-1">
                  HABIT KEYWORDS
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  습관 특성 요약
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs sm:text-sm print:text-sm font-extrabold tracking-tight"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Habit Distribution Bar */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                <span>정보 수용 및 처리 습관 분포 ({report.principle})</span>
                <span>
                  자기화 {report.habitDistribution.selfPct.toFixed(1)}% · 몰입+기술{' '}
                  {report.habitDistribution.focusSkillPct.toFixed(1)}% · 관계+객관{' '}
                  {report.habitDistribution.relObjPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-300">
                <div
                  className="bg-indigo-600 h-full"
                  style={{ width: `${report.habitDistribution.selfPct}%` }}
                  title="자기화"
                />
                <div
                  className="bg-slate-700 h-full"
                  style={{ width: `${report.habitDistribution.focusSkillPct}%` }}
                  title="몰입+기술"
                />
                <div
                  className="bg-slate-400 h-full"
                  style={{ width: `${report.habitDistribution.relObjPct}%` }}
                  title="관계+객관"
                />
              </div>
            </div>
          </div>

          {/* Section 2: 지금 내가 세상을 바라보는 태도 */}
          <div className="border border-slate-300 rounded-2xl p-5 mb-6">
            <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mb-1">
              ATTITUDE IN LIFE & WORK
            </span>
            <h3 className="text-lg font-black text-slate-900 mb-4">
              지금 내가 세상을 바라보는 태도
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 print:!grid-cols-2 gap-4">
              <div className="bg-slate-50 border-2 border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                    💬
                  </span>
                  <h4 className="text-sm font-black text-slate-900">
                    {report.name}님의 관계에서의 태도
                  </h4>
                </div>
                <blockquote className="text-xs sm:text-sm print:text-sm text-slate-800 font-semibold leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-slate-200">
                  “{report.relationshipAttitude}”
                </blockquote>
              </div>

              <div className="bg-slate-50 border-2 border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                    💼
                  </span>
                  <h4 className="text-sm font-black text-slate-900">
                    {report.name}님의 업무에서의 태도
                  </h4>
                </div>
                <blockquote className="text-xs sm:text-sm print:text-sm text-slate-800 font-semibold leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-slate-200">
                  “{report.workAttitude}”
                </blockquote>
              </div>
            </div>
          </div>

          {/* Section 3: 사소하지만 확실한 변화를 만드는 인생 습관 */}
          <div className="border-2 border-slate-900 bg-slate-50 rounded-2xl p-6">
            <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mb-1.5">
              LIFE HABIT SOLUTION
            </span>
            <h3 className="text-lg font-black text-slate-900 mb-3">
              사소하지만 확실한 변화를 만드는 인생 습관
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-white border border-slate-200 rounded-xl p-5 font-medium">
              {report.lifeHabitAdvice}
            </p>
          </div>

          {/* Page Footer */}
          <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>GRAPHME INTEGRATED DIAGNOSTIC REPORT</span>
            <span>SERIAL NO. {report.serialNo} · PAGE 02 / 04</span>
          </div>
        </section>

        {/* ================= PAGE 3: 진로 로드맵 ================= */}
        <section
          data-report-page="3"
          className={`report-print-page bg-white border-2 border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm print:shadow-none print:rounded-2xl print:border-2 print:border-slate-800 print:break-after-page print:break-inside-avoid ${
            activeTab !== 'all' && activeTab !== 3 ? 'hidden print:block' : ''
          }`}
        >
          {/* Page Header */}
          <div className="flex items-end justify-between border-b-2 border-slate-900 pb-4 mb-5">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-slate-500">
                Career Roadmap
              </div>
              <h2 className="text-2xl sm:text-3xl print:text-3xl font-black text-slate-900 mt-0.5">
                진로 로드맵
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500">
                  {report.groupName}
                </div>
                <div className="text-sm font-black text-slate-900">
                  {report.name}님 ·{' '}
                  <span className="text-indigo-700">{report.totalLitType}</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg font-black">
                03
              </div>
            </div>
          </div>

          {/* Intro Notice */}
          <div className="bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm print:text-sm text-slate-700 leading-relaxed mb-6">
            본 결과지는 그래프미 검사과정에서 나타난{' '}
            <strong className="font-extrabold text-slate-900">
              {report.name}
            </strong>
            님의 모습을 설명하고 있습니다. 검사 결과에 좋고 나쁨은 없으며,{' '}
            <strong className="font-extrabold text-slate-900">
              {report.name}
            </strong>
            님의 발전적 미래를 위한 참고 자료로 활용해 주시기 바랍니다.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 print:!grid-cols-12 gap-6">
            {/* Left 7 cols: 15대 성과역량 그래프 */}
            <div className="lg:col-span-7 print:!col-span-7 border border-slate-300 rounded-2xl p-5">
              <div className="flex flex-wrap print:!flex-nowrap items-start justify-between gap-3 mb-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mb-1">
                    15 PERFORMANCE COMPETENCIES
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    내가 잘하는 것 · 내가 어려워하는 것
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    진로 선택에서 중요한 것은 잘하는 것을 파악하는 것입니다. 평균
                    지수(MAI)를 기준으로 강점과 약점을 파악해 보세요.
                  </p>
                </div>
                <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-right shrink-0">
                  <div className="text-[10px] font-bold text-slate-300">
                    나의 평균 지수 (MAI)
                  </div>
                  <div className="text-xl font-black">
                    {report.maiAverage.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* 5 Competency Categories x 3 items */}
              <div className="space-y-3">
                {report.competencies.map((cat) => (
                  <div
                    key={cat.category}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3"
                  >
                    <div className="text-xs font-black text-slate-800 mb-2 flex items-center justify-between">
                      <span>■ {cat.category}</span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        점선: 평균 지수 ({report.maiAverage.toFixed(1)})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {cat.items.map((item) => {
                        const isStrong = item.score >= report.maiAverage;
                        const widthPct = Math.max(
                          2,
                          Math.min(100, item.score)
                        );
                        const maiLeftPct = Math.max(
                          0,
                          Math.min(100, report.maiAverage)
                        );
                        return (
                          <div
                            key={item.name}
                            className="flex items-center gap-2.5 text-xs"
                          >
                            <span
                              className={`w-16 font-bold shrink-0 ${
                                isStrong
                                  ? 'text-slate-900 font-extrabold'
                                  : 'text-slate-500'
                              }`}
                            >
                              {item.label}
                            </span>
                            <div className="flex-1 h-4 bg-white border border-slate-300 rounded-full relative overflow-hidden">
                              {/* MAI Reference Line */}
                              <div
                                className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-rose-500 z-10"
                                style={{ left: `${maiLeftPct}%` }}
                                title={`나의 평균 지수 (MAI): ${report.maiAverage.toFixed(1)}`}
                              />
                              <div
                                className={`h-full rounded-full ${
                                  isStrong ? 'bg-slate-900' : 'bg-slate-400'
                                }`}
                                style={{ width: `${widthPct}%` }}
                              />
                            </div>
                            <span
                              className={`w-12 text-right font-mono text-xs ${
                                isStrong
                                  ? 'font-black text-slate-900'
                                  : 'font-semibold text-slate-500'
                              }`}
                            >
                              {item.score.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 cols: 진로 영역 적합도 + 조직/직무 환경 */}
            <div className="lg:col-span-5 print:!col-span-5 flex flex-col gap-6">
              {/* 진로 영역 적합도: 취업 vs 창업 vs 연구 */}
              <div className="border border-slate-300 rounded-2xl p-5">
                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mb-1">
                  CAREER PATH FIT
                </span>
                <h3 className="text-lg font-black text-slate-900 mb-3">
                  진로 영역 적합도 (취업 vs 창업 vs 연구)
                </h3>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      label: '취업',
                      score: report.careerFit.employment,
                      desc: '기존 기업 시스템 내에서 안정적으로 일하는 것',
                    },
                    {
                      label: '창업',
                      score: report.careerFit.entrepreneurship,
                      desc: '자율성을 기반으로 새로운 사업을 시작하는 것',
                    },
                    {
                      label: '연구',
                      score: report.careerFit.research,
                      desc: '지식 확장을 위해 체계적으로 탐구하는 것',
                    },
                  ].map((cf) => {
                    const pct = Math.max(0, Math.min(100, cf.score));
                    return (
                      <div
                        key={cf.label}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center flex flex-col items-center justify-between"
                      >
                        <div className="text-sm font-black text-slate-900 mb-2">
                          {cf.label}
                        </div>
                        <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                          <svg
                            className="w-16 h-16 -rotate-90"
                            viewBox="0 0 100 100"
                          >
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="12"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke="#1e293b"
                              strokeWidth="12"
                              strokeDasharray={`${pct * 2.387} 238.7`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-xs font-black text-slate-900">
                            {cf.score.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {cf.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 마음이 편해지는 곳 / 마음이 불편해지는 곳 */}
              <div className="border-2 border-slate-900 bg-slate-50 rounded-2xl p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mb-1">
                    ORGANIZATIONAL FIT
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mb-3">
                    마음이 편해지는 곳 · 마음이 불편해지는 곳
                  </h3>
                  <p className="text-xs sm:text-sm print:text-sm text-slate-800 leading-relaxed bg-white border border-slate-200 rounded-xl p-4 font-medium mb-4">
                    {report.orgFit.fullNarrative}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 print:!grid-cols-2 gap-2 text-xs">
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                    <div className="text-[10px] font-bold text-indigo-600">
                      잠재력 발휘 조직
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {report.orgFit.potentialOrg}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                    <div className="text-[10px] font-bold text-emerald-600">
                      견딜 수 있는 환경
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {report.orgFit.tolerableEnv}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                    <div className="text-[10px] font-bold text-rose-600">
                      힘들어하는 환경
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {report.orgFit.stressfulEnv}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                    <div className="text-[10px] font-bold text-slate-600">
                      잘 맞는 직무 특성
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {report.orgFit.suitableJob}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Footer */}
          <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>GRAPHME INTEGRATED DIAGNOSTIC REPORT</span>
            <span>SERIAL NO. {report.serialNo} · PAGE 03 / 04</span>
          </div>
        </section>

        {/* ================= PAGE 4: 학습 로드맵 ================= */}
        <section
          data-report-page="4"
          className={`report-print-page bg-white border-2 border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm print:shadow-none print:rounded-2xl print:border-2 print:border-slate-800 print:break-inside-avoid ${
            breakAfterLastPage ? 'print:break-after-page' : ''
          } ${
            activeTab !== 'all' && activeTab !== 4 ? 'hidden print:block' : ''
          }`}
        >
          {/* Page Header */}
          <div className="flex items-end justify-between border-b-2 border-slate-900 pb-4 mb-5">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-slate-500">
                Study Roadmap
              </div>
              <h2 className="text-2xl sm:text-3xl print:text-3xl font-black text-slate-900 mt-0.5">
                학습 로드맵
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500">
                  {report.groupName}
                </div>
                <div className="text-sm font-black text-slate-900">
                  {report.name}님 ·{' '}
                  <span className="text-indigo-700">{report.totalLitType}</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg font-black">
                04
              </div>
            </div>
          </div>

          {/* Intro Notice */}
          <div className="bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm print:text-sm text-slate-700 leading-relaxed mb-6">
            본 결과지는 그래프미 검사과정에서 나타난{' '}
            <strong className="font-extrabold text-slate-900">
              {report.name}
            </strong>
            님의 모습을 설명하고 있습니다. 검사 결과에 좋고 나쁨은 없으며,{' '}
            <strong className="font-extrabold text-slate-900">
              {report.name}
            </strong>
            님의 발전적 미래를 위한 참고 자료로 활용해 주시기 바랍니다.
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:!grid-cols-2 gap-6 mb-6">
            {/* 강점과 추천 학습법 */}
            <div className="border-2 border-slate-800 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mb-1.5">
                  STRENGTH & RECOMMENDED METHOD
                </span>
                <h3 className="text-lg font-black text-slate-900 mb-3">
                  강점과 추천 학습법
                </h3>
                <div className="space-y-3 text-xs sm:text-sm print:text-sm text-slate-800 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 font-medium">
                  <p>{report.studyStrength.paragraph1}</p>
                  <p>{report.studyStrength.paragraph2}</p>
                </div>
              </div>
            </div>

            {/* 약점과 추천 학습법 */}
            <div className="border-2 border-slate-800 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mb-1.5">
                  WEAKNESS & ALTERNATIVE STRATEGY
                </span>
                <h3 className="text-lg font-black text-slate-900 mb-3">
                  약점과 추천 학습법
                </h3>
                <div className="space-y-3 text-xs sm:text-sm print:text-sm text-slate-800 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 font-medium">
                  <p>{report.studyWeakness.paragraph1}</p>
                  <p>{report.studyWeakness.paragraph2}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 최적 학습 플랜 */}
          <div className="border border-slate-300 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold mb-1">
                  OPTIMAL STUDY PLAN
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  최적 학습 플랜
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                각 원과 비율은 학습 효과를 높일 수 있는 상황별 최적 비율을 상대적으로
                표현한 것입니다.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 print:!grid-cols-5 gap-3">
              {studyPairs.map((pair) => {
                const lPct = Math.round(pair.leftVal * 100);
                const rPct = Math.round(pair.rightVal * 100);
                const lSize = 28 + Math.round(pair.leftVal * 32);
                const rSize = 28 + Math.round(pair.rightVal * 32);
                return (
                  <div
                    key={pair.category}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between"
                  >
                    <div className="text-xs font-extrabold text-slate-500 text-center mb-3">
                      {pair.category}
                    </div>

                    {/* Proportional Circles */}
                    <div className="flex items-center justify-around h-20 mb-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`rounded-full flex items-center justify-center text-xs font-black ${
                            lPct >= rPct
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                          style={{ width: lSize, height: lSize }}
                        >
                          {lPct}%
                        </div>
                        <span className="text-xs font-bold text-slate-800 mt-1.5">
                          {pair.leftLabel}
                        </span>
                      </div>

                      <span className="text-[11px] font-bold text-slate-400">
                        vs
                      </span>

                      <div className="flex flex-col items-center">
                        <div
                          className={`rounded-full flex items-center justify-center text-xs font-black ${
                            rPct > lPct
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                          style={{ width: rSize, height: rSize }}
                        >
                          {rPct}%
                        </div>
                        <span className="text-xs font-bold text-slate-800 mt-1.5">
                          {pair.rightLabel}
                        </span>
                      </div>
                    </div>

                    {/* Bar */}
                    <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden flex">
                      <div
                        className="bg-slate-900 h-full"
                        style={{
                          width: `${(lPct / (lPct + rPct || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page Footer */}
          <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>GRAPHME INTEGRATED DIAGNOSTIC REPORT</span>
            <span>SERIAL NO. {report.serialNo} · PAGE 04 / 04</span>
          </div>
        </section>
      </div>

      {/* Raw ResultDB Modal (Super-Admin Only) */}
      {canViewRawDb && showRawDbModal && resultRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">
                  🧮 결과DB (result_base_set) 산출 데이터 — {resultRow.mb_name} (
                  {resultRow.mb_id})
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  엑셀 결과DB 시트(표1)와 동일한 산출 공식으로 계산된 전체 지표입니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRawDbModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold"
              >
                ✕ 닫기
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <div>
                <h4 className="font-extrabold text-slate-900 mb-2">
                  1. 진단 유형 및 종합 지수
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    ['측정 유형 (lit_type)', resultRow.lit_type],
                    ['자가 유형 (surv_lit_type)', resultRow.surv_lit_type],
                    ['통합 유형 (total_lit_type)', resultRow.total_lit_type],
                    ['자아일치도', resultRow.자아일치도.toFixed(2)],
                    ['자기평가정도', resultRow.자기평가정도.toFixed(2)],
                    ['진로_취업', resultRow.진로_취업.toFixed(2)],
                    ['진로_창업', resultRow.진로_창업.toFixed(2)],
                    ['진로_연구', resultRow.진로_연구.toFixed(2)],
                    ['기업가정신 (ENT)', resultRow.ENT.toFixed(2)],
                    ['전공적합 (MJR)', resultRow.MJR.toFixed(2)],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    >
                      <div className="text-[11px] text-slate-500">{k}</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 mb-2">
                  2. 5대 방향성 지표
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    ['관계', `${resultRow.관계} (${resultRow.관계점수.toFixed(2)})`],
                    ['에너지', `${resultRow.에너지} (${resultRow.에너지점수.toFixed(2)})`],
                    ['시간', `${resultRow.시간} (${resultRow.시간점수.toFixed(2)})`],
                    ['전략(생각)', `${resultRow.전략} (${resultRow.전략점수.toFixed(2)})`],
                    ['갈등', `${resultRow.갈등} (${resultRow.갈등점수.toFixed(2)})`],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    >
                      <div className="text-[11px] text-slate-500">{k}</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 mb-2">
                  3. 15대 성과역량 점수
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    ['정보처리', resultRow.정보처리],
                    ['전제추론', resultRow.전제추론],
                    ['성장추구(심화탐구)', resultRow.성장추구],
                    ['목적이해', resultRow.목적이해],
                    ['맥락파악', resultRow.맥락파악],
                    ['동시처리', resultRow.동시처리],
                    ['위험관리', resultRow.위험관리],
                    ['변화관리', resultRow.변화관리],
                    ['과정관리', resultRow.과정관리],
                    ['수용능력', resultRow.수용능력],
                    ['비판능력', resultRow.비판능력],
                    ['활용능력', resultRow.활용능력],
                    ['타인이해', resultRow.타인이해],
                    ['자기성찰', resultRow.자기성찰],
                    ['관계대응', resultRow.관계대응],
                  ].map(([k, v]) => (
                    <div
                      key={String(k)}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    >
                      <div className="text-[11px] text-slate-500">{k}</div>
                      <div className="text-sm font-black text-indigo-700 mt-0.5">
                        {Number(v).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 mb-2">
                  4. 성향 지표 (seL ~ obJ) 및 역량 지표 (kwD ~ dcS)
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="p-2 font-bold">지표</th>
                        <th className="p-2 font-bold">측정치</th>
                        <th className="p-2 font-bold">자가진단 (surv)</th>
                        <th className="p-2 font-bold">통합 (total)</th>
                        <th className="p-2 font-bold">편차 (diff)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(['seL', 'foC', 'skI', 'reL', 'obJ'] as const).map((h) => (
                        <tr key={h}>
                          <td className="p-2 font-extrabold text-indigo-700">
                            {h} (성향)
                          </td>
                          <td className="p-2 font-mono">
                            {resultRow[h].toFixed(2)}
                          </td>
                          <td className="p-2 font-mono">
                            {resultRow[`surv_${h}`].toFixed(2)}
                          </td>
                          <td className="p-2 font-mono font-bold">
                            {resultRow[`total_${h}`].toFixed(2)}
                          </td>
                          <td className="p-2 font-mono">
                            {resultRow[`diff_${h}`].toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {(
                        [
                          'kwD', 'suM', 'coL', 'jdG',
                          'cpR', 'apP', 'frM', 'prM',
                          'stU', 'seT', 'cpS', 'erR',
                          'inF', 'rbD', 'mmM', 'dcS',
                        ] as const
                      ).map((c) => (
                        <tr key={c}>
                          <td className="p-2 font-extrabold text-slate-800">
                            {c} (역량 · 정답률 {resultRow[`${c}_pct`].toFixed(1)}%)
                          </td>
                          <td className="p-2 font-mono">
                            {resultRow[c].toFixed(2)}
                          </td>
                          <td className="p-2 font-mono">
                            {resultRow[`surv_${c}`].toFixed(2)}
                          </td>
                          <td className="p-2 font-mono font-bold">
                            {resultRow[`total_${c}`].toFixed(2)}
                          </td>
                          <td className="p-2 font-mono">
                            {resultRow[`diff_${c}`].toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
