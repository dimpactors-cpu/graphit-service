'use client';

import React, { useState, useMemo, useRef } from 'react';
import GraphmeReportView from '@/components/GraphmeReportView';
import type { StudentTestRecord } from '@/app/adm/tests/AdminTestsClient';

interface BulkPdfDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: StudentTestRecord[];
  preselectedTestNos?: number[];
  groupTitle?: string;
}

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensurePdfLibraries() {
  const w = window as any;
  if (!w.html2canvas) {
    await loadScriptOnce(
      'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
    );
  }
  if (!w.jspdf) {
    await loadScriptOnce(
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
    );
  }
  if (!w.JSZip) {
    await loadScriptOnce(
      'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
    );
  }
  return {
    html2canvas: w.html2canvas,
    jsPDF: w.jspdf.jsPDF,
    JSZip: w.JSZip,
  };
}

export default function BulkPdfDownloadModal({
  isOpen,
  onClose,
  records,
  preselectedTestNos = [],
  groupTitle = '그래프미_단체',
}: BulkPdfDownloadModalProps) {
  const validRecords = useMemo(
    () => records.filter((r) => Boolean(r.report)),
    [records]
  );

  const [selectedNos, setSelectedNos] = useState<number[]>(() => {
    if (preselectedTestNos.length > 0) return preselectedTestNos;
    return validRecords.map((r) => r.test_no);
  });
  const [searchKw, setSearchKw] = useState('');
  const [bwMode, setBwMode] = useState(false);

  // Zip generation state
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [currentRenderRecord, setCurrentRenderRecord] =
    useState<StudentTestRecord | null>(null);
  const [progressIndex, setProgressIndex] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const cancelRef = useRef(false);
  const offscreenContainerRef = useRef<HTMLDivElement | null>(null);

  // Combined print mode state
  const [isBulkPrintMode, setIsBulkPrintMode] = useState(false);

  // Sync selection when modal opens with new preselectedTestNos
  React.useEffect(() => {
    if (isOpen) {
      if (preselectedTestNos.length > 0) {
        setSelectedNos(preselectedTestNos);
      } else {
        setSelectedNos(validRecords.map((r) => r.test_no));
      }
      setIsBulkPrintMode(false);
    }
  }, [isOpen, preselectedTestNos, validRecords]);

  const filteredList = useMemo(() => {
    if (!searchKw.trim()) return validRecords;
    const kw = searchKw.trim().toLowerCase();
    return validRecords.filter(
      (r) =>
        r.mb_name.toLowerCase().includes(kw) ||
        r.mb_id.toLowerCase().includes(kw) ||
        r.group_code.toLowerCase().includes(kw) ||
        (r.resultRow?.total_lit_type || '').toLowerCase().includes(kw)
    );
  }, [validRecords, searchKw]);

  const selectedRecords = useMemo(() => {
    const set = new Set(selectedNos);
    return validRecords.filter((r) => set.has(r.test_no));
  }, [validRecords, selectedNos]);

  if (!isOpen) return null;

  const toggleOne = (testNo: number) => {
    setSelectedNos((prev) =>
      prev.includes(testNo)
        ? prev.filter((n) => n !== testNo)
        : [...prev, testNo]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredList.map((r) => r.test_no);
    setSelectedNos((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const deselectAllFiltered = () => {
    const filteredSet = new Set(filteredList.map((r) => r.test_no));
    setSelectedNos((prev) => prev.filter((id) => !filteredSet.has(id)));
  };

  // Option 1: Generate Individual Student PDFs and download as a single .zip file
  const handleDownloadZip = async () => {
    if (selectedRecords.length === 0) {
      alert('다운로드할 수강생을 1명 이상 선택해 주세요.');
      return;
    }

    setIsGeneratingZip(true);
    cancelRef.current = false;
    setProgressIndex(0);
    setProgressTotal(selectedRecords.length);
    setStatusMessage('PDF 변환 엔진을 불러오는 중입니다...');

    try {
      const { html2canvas, jsPDF, JSZip } = await ensurePdfLibraries();
      const zip = new JSZip();
      let generatedCount = 0;

      for (let i = 0; i < selectedRecords.length; i++) {
        if (cancelRef.current) break;
        const rec = selectedRecords[i];
        setProgressIndex(i + 1);
        setStatusMessage(
          `[${i + 1} / ${selectedRecords.length}] ${rec.mb_name} (${
            rec.mb_id
          }) 학생 4페이지 PDF 생성 중...`
        );

        // Render this student's report in the offscreen container
        setCurrentRenderRecord(rec);

        // Wait for React to paint the 4 sections and web fonts to be ready
        await new Promise((r) => setTimeout(r, 180));
        if ((document as any).fonts?.ready) {
          await (document as any).fonts.ready;
        }

        const container = offscreenContainerRef.current;
        if (!container) continue;

        const sections = Array.from(
          container.querySelectorAll('section[data-report-page]')
        ) as HTMLElement[];

        if (sections.length === 0) continue;

        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });

        const pageWidthMm = 210;
        const pageHeightMm = 297;
        const marginMm = 6;
        const maxW = pageWidthMm - marginMm * 2;
        const maxH = pageHeightMm - marginMm * 2;

        // Compensate for html2canvas CJK font baseline downward offset (~0.26 * fontSize)
        const ctxProto = CanvasRenderingContext2D.prototype;
        const origFillText = ctxProto.fillText;
        ctxProto.fillText = function (
          text: string,
          x: number,
          y: number,
          maxWidth?: number
        ) {
          const m = (this.font || '').match(/(\d+(?:\.\d+)?)px/);
          const fontSize = m ? parseFloat(m[1]) : 12;
          const adjustedY = y - fontSize * 0.26;
          if (maxWidth !== undefined) {
            return origFillText.call(this, text, x, adjustedY, maxWidth);
          }
          return origFillText.call(this, text, x, adjustedY);
        };

        try {
          for (let p = 0; p < sections.length; p++) {
            const sec = sections[p];
            const canvas = await html2canvas(sec, {
              scale: 1.8,
              useCORS: true,
              backgroundColor: '#ffffff',
              logging: false,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const ratio = canvas.width / canvas.height;
            let drawW = maxW;
            let drawH = drawW / ratio;
            if (drawH > maxH) {
              drawH = maxH;
              drawW = drawH * ratio;
            }
            const offsetX = (pageWidthMm - drawW) / 2;
            const offsetY = marginMm;

            if (p > 0) {
              pdf.addPage();
            }
            pdf.addImage(imgData, 'JPEG', offsetX, offsetY, drawW, drawH, undefined, 'FAST');
          }
        } finally {
          ctxProto.fillText = origFillText;
        }

        const safeName = (rec.mb_name || '수강생').replace(/[\\/:*?"<>|]/g, '_');
        const safeId = (rec.mb_id || String(rec.test_no)).replace(/[\\/:*?"<>|]/g, '_');
        const safeCode = (rec.group_code || 'GROUP').replace(/[\\/:*?"<>|]/g, '_');
        const fileName = `${String(i + 1).padStart(3, '0')}_${safeCode}_${safeName}(${safeId})_결과지.pdf`;

        const pdfBlob = pdf.output('blob');
        zip.file(fileName, pdfBlob);
        generatedCount++;
      }

      setCurrentRenderRecord(null);

      if (generatedCount > 0) {
        setStatusMessage(`생성된 ${generatedCount}명의 PDF를 ZIP 파일로 압축 중입니다...`);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        const safeTitle = groupTitle.replace(/[\\/:*?"<>|\s]+/g, '_');
        a.href = url;
        a.download = `${safeTitle}_결과지_일괄다운로드(${generatedCount}명).zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch (err: any) {
      alert(
        `일괄 PDF 생성 중 오류가 발생했습니다: ${
          err?.message || '통합 PDF 인쇄 모드를 이용해 주세요.'
        }`
      );
    } finally {
      setIsGeneratingZip(false);
      setCurrentRenderRecord(null);
      setStatusMessage('');
    }
  };

  // Option 2: Combined High-Res Vector PDF Save / Bulk Print
  const handleBulkPrintPdf = () => {
    if (selectedRecords.length === 0) {
      alert('인쇄/저장할 수강생을 1명 이상 선택해 주세요.');
      return;
    }
    setIsBulkPrintMode(true);
    setTimeout(() => {
      window.print();
    }, 350);
  };

  return (
    <>
      {/* Main Bulk Download Control Modal (Hidden in Print) */}
      <div className="print:hidden fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500 text-xs font-extrabold">
                  PDF 일괄다운로드 센터
                </span>
                <h3 className="text-base sm:text-lg font-extrabold">
                  수강생 4페이지 진단 결과지 일괄 다운로드
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                선택한 수강생들의 결과지를 개별 PDF 파일(.zip 압축)로 일괄 내려받거나, 하나의 통합 PDF로 한 번에 저장·인쇄할 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              disabled={isGeneratingZip}
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 disabled:opacity-40"
            >
              ✕ 닫기
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* Progress Banner when generating ZIP */}
            {isGeneratingZip && (
              <div className="p-5 rounded-2xl bg-indigo-950 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-extrabold text-indigo-200">
                    ⏳ {statusMessage}
                  </span>
                  <span className="text-sm font-black text-amber-300">
                    {progressTotal > 0
                      ? `${Math.round((progressIndex / progressTotal) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full h-3 bg-indigo-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-200"
                    style={{
                      width: `${
                        progressTotal > 0
                          ? Math.min(100, Math.round((progressIndex / progressTotal) * 100))
                          : 5
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <span>
                    학생 1명당 4페이지씩 고해상도 A4 PDF로 변환하여 ZIP 파일에 담고 있습니다. 잠시만 기다려 주세요.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      cancelRef.current = true;
                    }}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold shrink-0"
                  >
                    중단하고 현재까지 생성분 ZIP 받기
                  </button>
                </div>
              </div>
            )}

            {/* Top Controls: Filter, Quick Select, Color Mode */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isGeneratingZip}
                  onClick={selectAllFiltered}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-slate-800 transition"
                >
                  ✓ 전체 선택 ({filteredList.length}명)
                </button>
                <button
                  type="button"
                  disabled={isGeneratingZip}
                  onClick={deselectAllFiltered}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                >
                  선택 해제
                </button>
                {validRecords.length > 30 && (
                  <>
                    <button
                      type="button"
                      disabled={isGeneratingZip}
                      onClick={() =>
                        setSelectedNos(
                          filteredList.slice(0, 30).map((r) => r.test_no)
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition"
                    >
                      1~30번 선택
                    </button>
                    <button
                      type="button"
                      disabled={isGeneratingZip}
                      onClick={() =>
                        setSelectedNos(
                          filteredList.slice(30, 60).map((r) => r.test_no)
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition"
                    >
                      31~60번 선택
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isGeneratingZip}
                  onClick={() => setBwMode(!bwMode)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                    bwMode
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {bwMode ? '⚫ 흑백(원본) 모드로 출력' : '🎨 컬러 모드로 출력'}
                </button>
                <input
                  type="text"
                  value={searchKw}
                  onChange={(e) => setSearchKw(e.target.value)}
                  placeholder="이름, 아이디, 유형 검색..."
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs w-48 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Student Selection List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-slate-700">
                  다운로드 대상 수강생 선택 (총{' '}
                  <strong className="text-indigo-600">
                    {selectedRecords.length}
                  </strong>
                  명 선택됨 / 전체 {validRecords.length}명)
                </span>
                <span className="text-[11px] text-slate-400">
                  총 {selectedRecords.length * 4}페이지 분량
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50/50">
                {filteredList.map((r, idx) => {
                  const checked = selectedNos.includes(r.test_no);
                  return (
                    <label
                      key={r.test_no}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        checked
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isGeneratingZip}
                        checked={checked}
                        onChange={() => toggleOne(r.test_no)}
                        className="rounded text-indigo-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-slate-900 truncate">
                            {idx + 1}. {r.mb_name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-extrabold shrink-0">
                            {r.resultRow?.total_lit_type || '-'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {r.mb_id} · {r.group_code}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              • <strong>개별 PDF(.zip)</strong>: 학생별 파일로 분리되어 압축 다운로드됩니다.
              <br />• <strong>통합 PDF 저장</strong>: 인쇄 창에서 &apos;PDF로 저장&apos;을 선택하면 선택된 전원 결과지가 즉시 저장됩니다.
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isGeneratingZip || selectedRecords.length === 0}
                onClick={handleBulkPrintPdf}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm transition disabled:opacity-40"
              >
                🖨️ 통합 PDF 일괄 저장 / 인쇄 ({selectedRecords.length}명)
              </button>
              <button
                type="button"
                disabled={isGeneratingZip || selectedRecords.length === 0}
                onClick={handleDownloadZip}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition disabled:opacity-40"
              >
                {isGeneratingZip
                  ? `⏳ ZIP 생성 중 (${progressIndex}/${progressTotal})...`
                  : `📦 학생별 개별 PDF (.zip) 일괄다운로드 (${selectedRecords.length}명)`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Offscreen Render Container for Individual Student PDF -> ZIP Conversion */}
      {currentRenderRecord && currentRenderRecord.report && (
        <div
          aria-hidden="true"
          className="print:hidden"
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: '1020px',
            background: '#ffffff',
            zIndex: -1,
          }}
          ref={offscreenContainerRef}
        >
          <GraphmeReportView
            report={currentRenderRecord.report}
            hideToolbar
            forceBwMode={bwMode}
          />
        </div>
      )}

      {/* Print-Only Container for Combined Vector PDF / Bulk Print */}
      {isBulkPrintMode && (
        <div className="hidden print:block print:bg-white print:p-0">
          {selectedRecords.map((rec, idx) =>
            rec.report ? (
              <div key={rec.test_no}>
                <GraphmeReportView
                  report={rec.report}
                  hideToolbar
                  forceBwMode={bwMode}
                  breakAfterLastPage={idx < selectedRecords.length - 1}
                />
              </div>
            ) : null
          )}
        </div>
      )}
    </>
  );
}
