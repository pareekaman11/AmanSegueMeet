"use client";

import Link from "next/link";
import LandingHeader from "@/src/components/landing/LandingHeader";
import LandingFooter from "@/src/components/landing/LandingFooter";
import LandingCTA from "@/src/components/landing/LandingCTA";
import { buttonVariants } from "@/components/ui/button";
import { 
  CalendarDays, 
  FileText, 
  CheckSquare, 
  Package, 
  Vote, 
  ShieldCheck, 
  Users2, 
  ArrowRight,
  Sparkles,
  Layers,
  Clock
} from "lucide-react";

export default function ProductPage() {
  const lifecyclePhases = [
    {
      step: "01",
      phase: "Before the Meeting",
      title: "Preparation & Agenda Drafting",
      description: "Eliminate last-minute document scrambles. Secretariats and Chairs build structured, timed agendas with purpose-driven items, upload governance materials, and distribute automated board notifications.",
      capabilities: [
        "Timed Agenda Builder with Noting, Decision, and Discussion item purposes",
        "Multi-folder Document Vault with committee visibility controls",
        "Automated Meeting Notice distribution and RSVP tracking"
      ],
      icon: CalendarDays,
    },
    {
      step: "02",
      phase: "During the Meeting",
      title: "Live Minuting & Decision Recording",
      description: "Execute smooth, disciplined meetings with live attendance registers, instant conflict-of-interest declarations, formal vote tracking, and real-time minutes drafting.",
      capabilities: [
        "Live Attendance & Quorum calculation with guest observer roles",
        "Conflict of Interest register with noted abstentions and room exits",
        "Formal decision voting with In Favour, Against, and Abstain tallies"
      ],
      icon: Vote,
    },
    {
      step: "03",
      phase: "After the Meeting",
      title: "Compiled Packs, Action Execution & Audit",
      description: "Turn meeting records into accountable execution. Export single-file consolidated board packs, assign trackable action items to owners with due dates, and capture dual-signature confirmations.",
      capabilities: [
        "One-click Board Pack compilation into unified, paginated PDF exports",
        "Action Item distribution with automated owner notifications and status lifecycle",
        "Minutes sign-off workflows with immutable audit logging for every change"
      ],
      icon: Package,
    },
    {
      step: "04",
      phase: "Between Meetings",
      title: "Out-of-Session Circular Resolutions",
      description: "Governance doesn't pause between board sessions. Propose and vote on urgent approvals and circular resolutions with secure, auditable voting deadlines.",
      capabilities: [
        "Circular resolution creation with deadline enforcement",
        "Digital ballot voting with real-time pass/fail threshold metrics",
        "Automatic archiving into the central Decisions Register"
      ],
      icon: Layers,
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      <LandingHeader />

      {/* Hero Section */}
      <section className="bg-background text-foreground py-20 px-6 md:px-12 text-center border-b border-border relative">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Complete Board Lifecycle
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            The unified platform for modern board governance
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            SegueMeet unifies meeting preparation, live minuting, action tracking, decision registries, and compliance audit into one intuitive, secure workspace.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/signup"
              className={buttonVariants({ size: "lg", className: "w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 font-semibold" })}
            >
              Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              href="/features"
              className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto border-border bg-card text-card-foreground hover:bg-accent px-8 h-12 font-medium" })}
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Lifecycle Walkthrough */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">End-to-End Workflow</h2>
          <p className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            How SegueMeet powers governance at every stage
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {lifecyclePhases.map((phase) => {
            const Icon = phase.icon;
            return (
              <div
                key={phase.step}
                className="bg-card text-card-foreground border border-border rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 bg-muted text-muted-foreground rounded">
                      Phase {phase.step}
                    </span>
                    <div className="p-2.5 rounded-lg bg-muted text-foreground">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    {phase.phase}
                  </span>
                  <h3 className="text-xl font-bold text-card-foreground mb-3">{phase.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-6">{phase.description}</p>
                  
                  <div className="space-y-2.5 pt-4 border-t border-border">
                    {phase.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-card-foreground font-medium">
                        <CheckSquare className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="bg-muted/40 text-foreground py-20 px-6 md:px-12 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-3 text-foreground">Engineered for Enterprise Governance</h2>
            <p className="text-muted-foreground text-xs">Built from the ground up for strict organizational compliance and confidentiality.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <ShieldCheck className="w-7 h-7 text-foreground mb-3" />
              <h3 className="text-base font-bold text-card-foreground mb-2">Role-Based Access Control</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Strict multi-tenant role isolation ensuring Board Admins, Chairs, Secretaries, Members, and Observers see only authorized materials.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <Clock className="w-7 h-7 text-foreground mb-3" />
              <h3 className="text-base font-bold text-card-foreground mb-2">Immutable Audit Logging</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Comprehensive before-and-after audit logs track every agenda update, vote cast, minute edit, and document version for statutory compliance.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <Users2 className="w-7 h-7 text-foreground mb-3" />
              <h3 className="text-base font-bold text-card-foreground mb-2">Committee Segregation</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Dedicated workspaces for Audit, Remuneration, and Governance committees with selective document visibility and member rosters.
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
