"use client";

import Link from "next/link";
import LandingHeader from "@/src/components/landing/LandingHeader";
import LandingFooter from "@/src/components/landing/LandingFooter";
import LandingCTA from "@/src/components/landing/LandingCTA";
import { ShieldCheck, Target, Lock, Layers, CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  const principles = [
    {
      title: "Clarity Over Complexity",
      desc: "Board management software should simplify governance, not introduce administrative friction. Every workflow in SegueMeet is designed for clarity and speed.",
      icon: Target
    },
    {
      title: "Statutory Rigor & Compliance",
      desc: "Governance decisions carry legal weight. SegueMeet maintains immutable audit trails, structured attendance records, and dual-signature validations that stand up to audit.",
      icon: ShieldCheck
    },
    {
      title: "Confidentiality by Architecture",
      desc: "Board materials are strictly sensitive. Our platform employs strict multi-tenant isolation, committee fencing, and granular role-based permissions.",
      icon: Lock
    },
    {
      title: "Continuous Governance",
      desc: "Boards don't only operate during formal meetings. Out-of-session circular resolutions, action tracking, and annual work plans keep governance active year-round.",
      icon: Layers
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      <LandingHeader />

      {/* Header */}
      <section className="bg-background text-foreground py-20 px-6 md:px-12 text-center border-b border-border">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-3">
            About SegueMeet
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Empowering Boards with Modern Governance Technology
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            We built SegueMeet to eliminate the administrative chaos of corporate governance and provide board secretaries and directors with a modern, secure, and unified operating system.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Our Purpose</h2>
            <h3 className="text-3xl font-bold text-foreground leading-tight">
              Transforming Boardrooms from Paperwork to Strategic Execution
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Traditional board secretarial work has long been burdened by scattered email chains, fragmented document versions, tedious PDF collation, and manual action-item chasing.
            </p>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              SegueMeet replaces disjointed tools with a unified governance platform that handles the full board lifecycle — from agenda creation and one-click board packs to live minuting, conflict tracking, and auditable circular resolutions.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
            <h4 className="text-base font-bold text-card-foreground">Platform Standards</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-card-foreground block">Strict Multi-Tenancy</span>
                  Full tenant isolation ensuring complete data privacy across organizations.
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-card-foreground block">Role-Based Access Control (RBAC)</span>
                  Enforced authorization across Board Admins, Chairs, Secretaries, Members, and Observers.
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-card-foreground block">Complete Audit Trails</span>
                  Immutable change logs recording entity snapshots for comprehensive statutory compliance.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-20 px-6 md:px-12 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Our Governance Principles</h2>
            <h3 className="text-3xl font-bold tracking-tight text-foreground">What Guides Platform Development</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {principles.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-card-foreground mb-2">{p.title}</h4>
                    <p className="text-muted-foreground text-xs leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
