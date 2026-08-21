"use client";

import Link from "next/link";
import LandingHeader from "@/src/components/landing/LandingHeader";
import LandingFooter from "@/src/components/landing/LandingFooter";
import LandingCTA from "@/src/components/landing/LandingCTA";
import { buttonVariants } from "@/components/ui/button";
import {
  CalendarDays,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Package,
  Vote,
  ShieldCheck,
  FolderLock,
  Users2,
  Bell,
  Clock,
  Sparkles,
  PenTool,
  AlertCircle
} from "lucide-react";

export default function FeaturesPage() {
  const featureCategories = [
    {
      title: "Meeting Preparation & Agenda Builder",
      description: "Structured workflows to create, organize, and distribute board agendas with zero friction.",
      features: [
        {
          title: "Timed Section & Item Hierarchy",
          desc: "Structure meeting items with allocated time budgets, section headers, and automated duration calculations.",
          icon: CalendarDays
        },
        {
          title: "Purpose-Driven Agenda Items",
          desc: "Tag each item as For Noting, For Decision, or For Discussion so directors arrive prepared.",
          icon: FileSpreadsheet
        },
        {
          title: "Pre-Built Governance Templates",
          desc: "Instantly spin up Board, Audit Committee, or AGM agendas using standardized organizational templates.",
          icon: Sparkles
        },
        {
          title: "Document Attachment & Linking",
          desc: "Attach board papers directly to individual agenda items with seamless version syncing.",
          icon: FolderLock
        }
      ]
    },
    {
      title: "Live Minuting, Quorum & Conflict Management",
      description: "Fast, accurate meeting documentation during the live session.",
      features: [
        {
          title: "Real-Time Attendance & Quorum Tracking",
          desc: "Record Present, Apologies, and In Attendance statuses with live quorum verification.",
          icon: Users2
        },
        {
          title: "Conflict of Interest Declarations",
          desc: "Formally log member conflicts with recorded actions: Abstained, Left Room, or Noted.",
          icon: AlertCircle
        },
        {
          title: "Live Minutes Editor",
          desc: "Capture verbatim discussion points, conclusions, and resolutions linked directly to agenda items.",
          icon: FileText
        },
        {
          title: "Dual Digital Signatures",
          desc: "Chair and Secretary confirmation workflow with cryptographic signature hashes.",
          icon: PenTool
        }
      ]
    },
    {
      title: "Board Packs & Automated Distribution",
      description: "One-click compilation of board papers into a unified, secure executive PDF.",
      features: [
        {
          title: "Single-File PDF Compilation",
          desc: "Merge agendas, board memos, reports, and appendices into a consolidated PDF pack.",
          icon: Package
        },
        {
          title: "Dynamic Table of Contents & Pagination",
          desc: "Automated hyperlinked index, continuous page numbering, and header/footer watermarking.",
          icon: FileSpreadsheet
        },
        {
          title: "Pack Versioning & Archival",
          desc: "Maintain clear historical revisions with Draft, Published, and Archived lifecycle states.",
          icon: Clock
        },
        {
          title: "Secure Member Distribution",
          desc: "Distribute board packs instantly with role-based access restrictions and email alerts.",
          icon: Bell
        }
      ]
    },
    {
      title: "Decisions Register & Circular Resolutions",
      description: "Formal decision recording during sessions and out-of-session circular approvals.",
      features: [
        {
          title: "Central Decisions Register",
          desc: "Searchable historical log of every board decision, associated meeting, and outcome.",
          icon: Vote
        },
        {
          title: "Circular Resolutions Between Meetings",
          desc: "Propose urgent out-of-session resolutions with automated voting close dates.",
          icon: Clock
        },
        {
          title: "Digital Ballots & Quorum Metrics",
          desc: "Directors cast In Favour, Against, or Abstain votes with live tally computation.",
          icon: CheckSquare
        },
        {
          title: "Pass / Fail Determination",
          desc: "Automatic outcome calculation (Passed, Failed, Tied) when voting thresholds or deadlines are met.",
          icon: ShieldCheck
        }
      ]
    },
    {
      title: "Action Tracking, Committees & Annual Work Plan",
      description: "Accountability mechanisms to ensure board directives are executed on time.",
      features: [
        {
          title: "Action Items with Assignees & Deadlines",
          desc: "Track tasks with clear owners, ISO due dates, and statuses: Open, In Progress, Completed, Overdue.",
          icon: CheckSquare
        },
        {
          title: "Sub-Committee Management",
          desc: "Create and manage Committees (Audit, Remuneration, Risk) with selective document access.",
          icon: Users2
        },
        {
          title: "Annual Governance Work Plan",
          desc: "Map statutory filings, quarterly reviews, and cyclical board responsibilities across the year.",
          icon: CalendarDays
        },
        {
          title: "Interest Register & Tenure Tracking",
          desc: "Track director standing interests, board tenure limits, and automated expiry alerts.",
          icon: ShieldCheck
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
            Features & Capabilities
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Everything your Board needs to govern with confidence
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Engineered to streamline corporate secretarial duties, accelerate director decision-making, and uphold governance compliance.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className={buttonVariants({ size: "lg", className: "bg-primary text-primary-foreground hover:bg-primary/90 font-medium" })}
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className={buttonVariants({ variant: "outline", size: "lg", className: "border-border bg-card text-card-foreground hover:bg-accent font-medium" })}
            >
              View Pricing Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-20">
        {featureCategories.map((cat, idx) => (
          <div key={idx} className="space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="text-2xl font-bold text-foreground">{cat.title}</h2>
              <p className="text-muted-foreground text-xs mt-1">{cat.description}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {cat.features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center mb-3">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-card-foreground mb-1.5">{f.title}</h3>
                      <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
