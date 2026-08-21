"use client";

import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "SegueMeet restructured how our Secretariat coordinates board packs. Compiling and indexing 200-page packs now takes seconds rather than days.",
    role: "Company Secretary",
    orgType: "Financial Services Board",
  },
  {
    quote: "Live minuting combined with immediate conflict-of-interest declarations gives our Audit & Risk committee complete statutory confidence.",
    role: "Non-Executive Director",
    orgType: "Healthcare Foundation",
  },
  {
    quote: "Circular resolutions out-of-session keep strategic approvals moving without waiting weeks for the next formal board gathering.",
    role: "Board Chair",
    orgType: "Enterprise Technology Group",
  },
];

export default function LandingTestimonials() {
  return (
    <section id="testimonials" className="py-24 bg-muted/40 border-b border-border">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
            Governance Perspective
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Trusted by corporate secretaries and board directors
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <Quote className="w-6 h-6 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-card-foreground font-normal leading-relaxed mb-6">
                  "{t.quote}"
                </p>
              </div>
              <div className="border-t border-border/60 pt-4">
                <p className="font-semibold text-xs text-foreground">{t.role}</p>
                <p className="text-[11px] text-muted-foreground">{t.orgType}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
