"use client";

import Link from "next/link";
import LandingHeader from "@/src/components/landing/LandingHeader";
import LandingFooter from "@/src/components/landing/LandingFooter";
import LandingCTA from "@/src/components/landing/LandingCTA";
import { ArrowRight, Bookmark } from "lucide-react";

export default function ResourcesPage() {
  const resourceCategories = [
    {
      title: "Board & Committee Charters",
      description: "Standardized reference documents for corporate governance roles.",
      items: [
        {
          title: "Audit Committee Terms of Reference",
          category: "Charter Template",
          desc: "Key duties, quorum requirements, financial reporting oversight, and internal audit liaisons."
        },
        {
          title: "Board Chair & Company Secretary Roles Matrix",
          category: "Governance Guide",
          desc: "Clear demarcation of responsibilities for meeting agenda preparation, minutes sign-off, and statutory compliance."
        },
        {
          title: "Director Standing Interest Disclosure Policy",
          category: "Compliance Framework",
          desc: "Best practices for logging recurring conflicts of interest and managing voting recusals."
        }
      ]
    },
    {
      title: "Meeting Preparation & Minutes Guides",
      description: "Practical best-practice walkthroughs to elevate boardroom productivity.",
      items: [
        {
          title: "The Timed Agenda Preparation Checklist",
          category: "Checklist",
          desc: "How to budget meeting duration effectively and categorize items into Noting, Decision, and Discussion."
        },
        {
          title: "Statutory Standards for Minutes & Resolutions",
          category: "Best Practice",
          desc: "Structuring formal minutes, capturing attendee registers, and recording dual-signature confirmations."
        },
        {
          title: "Circular Resolutions & Out-of-Session Approvals",
          category: "Workflow Guide",
          desc: "When and how to execute valid circular resolutions between scheduled board meetings."
        }
      ]
    },
    {
      title: "Security & Statutory Compliance",
      description: "In-depth frameworks for data residency, auditability, and access control.",
      items: [
        {
          title: "Multi-Tenant Role-Based Access Control Architecture",
          category: "Security Whitepaper",
          desc: "Understanding how SegueMeet enforces organizational data isolation, committee fencing, and observer restrictions."
        },
        {
          title: "Immutable Audit Trails for Statutory Audits",
          category: "Compliance Brief",
          desc: "How before/after audit snapshots ensure complete non-repudiation for internal and external auditors."
        },
        {
          title: "Director Tenure Management & Expiry Alerts",
          category: "Governance Strategy",
          desc: "Tracking appointment dates, term renewals, and automated governance tenure thresholds."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      <LandingHeader />

      {/* Header */}
      <section className="bg-background text-foreground py-20 px-6 md:px-12 text-center border-b border-border">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-3">
            Governance Knowledge Base
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Governance Resources, Templates & Guides
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Equip your board secretariat, directors, and committee chairs with practical resources, compliance checklists, and governance frameworks.
          </p>
        </div>
      </section>

      {/* Resources Directory */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-16">
        {resourceCategories.map((cat, idx) => (
          <div key={idx} className="space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="text-2xl font-bold text-foreground">{cat.title}</h2>
              <p className="text-muted-foreground text-xs mt-1">{cat.description}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {cat.items.map((item, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground bg-muted px-2.5 py-0.5 rounded">
                        {item.category}
                      </span>
                      <Bookmark className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-bold text-card-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed mb-4">{item.desc}</p>
                  </div>

                  <Link
                    href="/signup"
                    className="inline-flex items-center text-xs font-semibold text-foreground hover:underline transition"
                  >
                    Access in SegueMeet <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
