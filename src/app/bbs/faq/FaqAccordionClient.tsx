'use client';

import React, { useState } from 'react';

interface FaqItem {
  wr_id: number | string;
  wr_subject: string;
  wr_content: string;
  wr_datetime: string;
}

export default function FaqAccordionClient({ faqs }: { faqs: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | number | null>(
    faqs[0]?.wr_id ?? null
  );

  return (
    <div className="space-y-3">
      {faqs.map((faq, idx) => {
        const isOpen = openId === faq.wr_id;
        return (
          <div
            key={faq.wr_id}
            className="rounded-2xl border border-slate-200 overflow-hidden bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : faq.wr_id)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-extrabold shrink-0">
                  Q{idx + 1}
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900">
                  {faq.wr_subject}
                </span>
              </div>
              <span className="text-slate-400 font-bold text-lg">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && (
              <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {faq.wr_content.replace(/<[^>]*>/g, '')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
