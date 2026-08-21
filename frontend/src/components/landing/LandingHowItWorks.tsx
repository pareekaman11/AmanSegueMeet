"use client";

import { Calendar, FileText, CheckCircle2, Package, Vote } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Schedule & Prepare Agendas",
    description: "Create meeting instances, select templates, allocate timed sections, and attach committee documents.",
    icon: Calendar,
  },
  {
    number: "02",
    title: "Compile & Distribute Board Packs",
    description: "One-click merge into an indexed, paginated executive PDF for member review.",
    icon: Package,
  },
  {
    number: "03",
    title: "Execute Live Minuting & Record Votes",
    description: "Track attendance, log conflicts of interest, record motions, and tally member ballots live.",
    icon: Vote,
  },
  {
    number: "04",
    title: "Track Actions & Audit Directives",
    description: "Assign action items to owners with clear due dates, and capture dual digital signatures on confirmed minutes.",
    icon: CheckCircle2,
  },
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
            Governance Flow
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Structured workflow from agenda to execution
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded">
                      Step {step.number}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-card-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
