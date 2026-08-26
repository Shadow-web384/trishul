import React from 'react';
import { PLACEHOLDERS } from '../data/placeholders';

export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">Find answers to common questions about Trishul.</p>
      </div>

      <div className="space-y-4">
        {PLACEHOLDERS.FAQ.map((item, index) => (
          <details key={index} className="group border border-border rounded-lg bg-card overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-medium marker:content-none hover:bg-muted/50 transition-colors">
              {item.question}
              <svg className="h-5 w-5 transition-transform group-open:-rotate-180 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-4 pt-2 text-muted-foreground border-t border-border">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
