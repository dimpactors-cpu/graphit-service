'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export interface TestQuestionItem {
  item_seq: number;
  item_timer: number;
  qa_no: number;
  qa_code: string;
  qa_type: string; // 'n' 객관식, 'y' 주관식
  qa_subject: string;
  qa_content: string;
  qa_file: string;
  qa_q1: string;
  qa_q2: string;
  qa_q3: string;
  qa_q4: string;
  qa_q5: string;
  existingAnswer?: string;
}

interface TestRunnerClientProps {
  itId: string;
  itName: string;
  questions: TestQuestionItem[];
  initialIndex: number;
}

export default function TestRunnerClient({
  itId,
  itName,
  questions,
  initialIndex,
}: TestRunnerClientProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const currentQ = questions[currentIndex];

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(
    currentQ?.item_timer ? Number(currentQ.item_timer) : 0
  );

  const submittingRef = useRef(false);

  // Reset answer & timer when question index changes
  useEffect(() => {
    const q = questions[currentIndex];
    if (!q) return;
    setSelectedAnswer(q.existingAnswer || '');
    setTimeLeft(q.item_timer ? Number(q.item_timer) : 0);
    submittingRef.current = false;
    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex, questions]);

  // Prevent browser back navigation during test
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      alert('검사 중에는 이전 문항으로 돌아갈 수 없습니다.');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const submitCurrentQuestion = useCallback(
    async (answerValue: string, isAutoTimeout = false) => {
      if (submittingRef.current || !currentQ) return;
      if (!isAutoTimeout && !answerValue.trim()) {
        alert(
          currentQ.qa_type === 'y'
            ? '답변을 입력해 주세요.'
            : '보기 문항 중 하나를 선택해 주세요.'
        );
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);

      const isLast = currentIndex >= questions.length - 1;

      try {
        const res = await fetch('/api/test/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            it_id: itId,
            item_seq: currentQ.item_seq,
            qa_no: currentQ.qa_no,
            test_answer: answerValue.trim(),
            is_complete: isLast,
          }),
        });
        const data = await res.json();
        if (!data.ok) {
          alert(data.message || '답변 저장에 실패했습니다.');
          submittingRef.current = false;
          setSubmitting(false);
          return;
        }

        if (isLast) {
          router.push(`/test/result?it_id=${encodeURIComponent(itId)}`);
          router.refresh();
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      } catch {
        alert('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [currentIndex, currentQ, itId, questions.length, router]
  );

  // Per-question countdown timer
  useEffect(() => {
    if (!currentQ || !currentQ.item_timer || Number(currentQ.item_timer) <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          const fallbackAnswer = currentQ.qa_type === 'y' ? '모름' : '5';
          submitCurrentQuestion(
            selectedAnswer.trim() ? selectedAnswer : fallbackAnswer,
            true
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, currentQ, selectedAnswer, submitCurrentQuestion]);

  if (!currentQ) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600 mb-4">출제된 문항이 없습니다.</p>
        <Link
          href="/mypage"
          className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold"
        >
          마이페이지로 이동
        </Link>
      </div>
    );
  }

  const totalCount = questions.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalCount) * 100);
  const options = [
    currentQ.qa_q1,
    currentQ.qa_q2,
    currentQ.qa_q3,
    currentQ.qa_q4,
    currentQ.qa_q5,
  ];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/mypage"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 shrink-0"
            >
              나가기
            </Link>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
              {itName}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {currentQ.item_timer > 0 && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                  timeLeft <= 10
                    ? 'bg-rose-100 text-rose-700 animate-pulse'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <span>⏱ 제한시간</span>
                <span className="font-mono text-sm">{formatTimer(timeLeft)}</span>
              </div>
            )}
            <span className="text-xs sm:text-sm font-extrabold text-indigo-600">
              {currentIndex + 1} / {totalCount}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Question Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold">
              문항 {currentIndex + 1}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {currentQ.qa_type === 'y' ? '주관식 문항' : '객관식 5지선다'}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug mb-3 whitespace-pre-line">
            {currentQ.qa_subject}
          </h2>

          {currentQ.qa_content && (
            <div className="text-sm sm:text-base text-slate-700 leading-relaxed mb-6 whitespace-pre-line bg-slate-50 rounded-2xl p-4 border border-slate-100">
              {currentQ.qa_content}
            </div>
          )}

          {currentQ.qa_file && (
            <div className="my-6 flex justify-center bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80">
              <img
                src={
                  currentQ.qa_file.startsWith('data:') ||
                  currentQ.qa_file.startsWith('http') ||
                  currentQ.qa_file.startsWith('/')
                    ? currentQ.qa_file
                    : `/data/test/${currentQ.qa_file}`
                }
                alt={`문항 ${currentIndex + 1} 이미지`}
                className="max-h-[460px] w-auto object-contain rounded-lg select-none"
                draggable={false}
              />
            </div>
          )}

          {/* Answer Input Area */}
          {currentQ.qa_type === 'y' ? (
            <div className="mt-6 space-y-3">
              <label className="block text-xs font-bold text-slate-600">
                답변 작성 (최대 500자)
              </label>
              <textarea
                rows={4}
                maxLength={500}
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="여기에 정답 또는 본인의 생각을 입력해 주세요."
                className="w-full rounded-2xl border border-slate-300 p-4 text-sm sm:text-base focus:border-indigo-600 focus:outline-none"
              />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setSelectedAnswer('모름')}
                  className="text-slate-500 hover:text-indigo-600 font-semibold underline"
                >
                  잘 모르겠어요 (&apos;모름&apos; 자동입력)
                </button>
                <span>{selectedAnswer.length} / 500자</span>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {options.map((optText, idx) => {
                const optNum = String(idx + 1);
                const isSelected = selectedAnswer === optNum;
                const labelText =
                  optText && optText.trim() !== '' ? optText : `${optNum}번`;

                return (
                  <button
                    key={optNum}
                    type="button"
                    onClick={() => setSelectedAnswer(optNum)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {optNum}
                    </span>
                    <span className="text-sm sm:text-base font-semibold leading-snug">
                      {labelText}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Submit / Next Button */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={() => submitCurrentQuestion(selectedAnswer, false)}
              className="w-full sm:w-auto min-w-[200px] px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-extrabold shadow-sm transition disabled:opacity-50"
            >
              {submitting
                ? '저장 중...'
                : currentIndex >= totalCount - 1
                ? '최종 제출 및 검사 완료 ✓'
                : '다음 문항으로 →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
