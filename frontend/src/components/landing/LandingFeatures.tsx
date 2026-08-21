"use client";

import { 
  CalendarDays, 
  FileText, 
  CheckSquare, 
  FolderLock, 
  ShieldCheck, 
  Package, 
  Vote, 
  Users2 
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Timed Agenda Builder",
    description: "Structure timed sections and items tagged for noting, decision, or discussion with reusable governance templates.",
  },
  {
    icon: FileText,
    title: "Live Minutes & Attendance",
    description: "Record attendance registers, attendee status, discussion points, and dual digital signature confirmations.",
  },
  {
    icon: CheckSquare,
    title: "Action Item Tracking",
    description: "Assign responsible directors, track ISO due dates, monitor progress, and close items in real time.",
  },
  {
    icon: Package,
    title: "Consolidated Board Packs",
    description: "Generate single-file PDF board packs with automated table of contents, pagination, and secure distribution.",
  },
  {
    icon: Vote,
    title: "Decisions & Circular Resolutions",
    description: "Execute formal in-session votes or out-of-session circular approvals with live quorum metrics.",
  },
  {
    icon: ShieldCheck,
    title: "Immutable Audit Trail",
    description: "Maintain complete non-repudiation with snapshot logging of every vote, minute change, and agenda modification.",
  },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="py-24 bg-muted/40 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
            Platform Capabilities
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Everything required for rigorous board governance
          </h2>
          <p className="text-muted-foreground text-sm mt-3">
            Designed specifically for Corporate Secretaries, Chairs, and Non-Executive Directors.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-muted text-foreground flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-card-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{f.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
