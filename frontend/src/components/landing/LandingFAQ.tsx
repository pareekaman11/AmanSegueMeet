"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What makes SegueMeet different from standard video conferencing tools?",
    answer: "SegueMeet is a dedicated board governance and corporate secretarial operating system. It handles structured timed agendas, digital board pack compilation, live minutes, conflict-of-interest declarations, statutory vote tracking, and immutable audit trails.",
  },
  {
    question: "How does SegueMeet handle security, role permissions, and multi-tenancy?",
    answer: "SegueMeet isolates each organisation's data with strict multi-tenancy. Access is enforced through granular Role-Based Access Control (Board Admin, Chair, Secretary, Member, and Observer) with committee-level document fencing.",
  },
  {
    question: "Can we vote on resolutions outside of scheduled meetings?",
    answer: "Yes. SegueMeet includes a dedicated 'Between Meetings' module for proposing and voting on circular resolutions with automated voting close dates, live quorum metrics, and automatic archival into the Decisions Register.",
  },
  {
    question: "How does board pack compilation work?",
    answer: "You can compile all meeting agendas, board memos, and document attachments into a single consolidated PDF pack with an automated hyperlinked table of contents and continuous pagination with one click.",
  },
  {
    question: "Does SegueMeet provide an audit trail for compliance?",
    answer: "Yes. All substantive changes — including minute edits, vote ballots, attendance logs, and agenda modifications — generate immutable before-and-after audit logs stored for statutory compliance.",
  },
];

export default function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-background border-b border-border">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
            Questions & Answers
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-border rounded-xl bg-card overflow-hidden transition-colors"
              >
                <button
                  className="w-full text-left px-5 py-4 flex justify-between items-center focus:outline-none"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <span className="font-semibold text-sm text-card-foreground pr-4">{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-foreground" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
