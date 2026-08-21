"use client";

import Link from "next/link";
import LandingHeader from "@/src/components/landing/LandingHeader";
import LandingFooter from "@/src/components/landing/LandingFooter";
import LandingCTA from "@/src/components/landing/LandingCTA";
import { buttonVariants } from "@/components/ui/button";
import { Check } from "lucide-react";

// TODO: placeholder pricing, confirm with leadership
const pricingTiers = [
  {
    name: "Starter",
    id: "starter",
    badge: "For Single Boards",
    priceMonthly: "$49", // TODO: placeholder pricing, confirm with leadership
    period: "month",
    description: "Essential meeting agendas, minutes, and action tracking for small boards and non-profits.",
    features: [
      "Up to 10 Board Members",
      "Timed Agenda Builder",
      "Live Minutes & Attendance Tracker",
      "Action Item Management",
      "Standard PDF Board Pack Exports",
      "Document Vault (5 GB Storage)",
      "Standard Email Support"
    ],
    buttonText: "Start 14-Day Trial",
    href: "/signup",
    popular: false
  },
  {
    name: "Professional",
    id: "professional",
    badge: "Most Popular",
    priceMonthly: "$149", // TODO: placeholder pricing, confirm with leadership
    period: "month",
    description: "Advanced governance platform for growing organisations with multiple committees and active decision registers.",
    features: [
      "Up to 30 Members & Observers",
      "Unlimited Sub-Committees (Audit, Risk, Remuneration)",
      "Between-Meetings Circular Resolutions",
      "Formal Decision Voting & Quorum Metrics",
      "Conflict of Interest Register",
      "Dual Digital Signature Workflow",
      "Document Vault (50 GB Storage)",
      "Annual Work Plan Planner",
      "Priority Support"
    ],
    buttonText: "Start 14-Day Trial",
    href: "/signup",
    popular: true
  },
  {
    name: "Enterprise",
    id: "enterprise",
    badge: "For Large Enterprises",
    priceMonthly: "Custom", // TODO: placeholder pricing, confirm with leadership
    period: "tailored",
    description: "Comprehensive governance security, multi-organization management, dedicated onboarding, and custom compliance needs.",
    features: [
      "Unlimited Members & Committees",
      "Multi-Organisation Administration",
      "Custom Role-Based Access Controls (RBAC)",
      "Full Immutable Audit Log Search & Export",
      "Dedicated Account Manager & Training",
      "Custom SLA & 99.9% Uptime Guarantee",
      "Unlimited Document Vault Storage",
      "Custom Data Residency & Security Reviews"
    ],
    buttonText: "Contact Sales",
    href: "/signup",
    popular: false
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      <LandingHeader />

      {/* Header */}
      <section className="bg-background text-foreground py-20 px-6 md:px-12 text-center border-b border-border">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-3">
            Transparent Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Simple plans for boards of every size
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Choose the plan that fits your board, committees, and compliance requirements. All plans include a 14-day trial.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-card text-card-foreground rounded-2xl border p-8 flex flex-col justify-between transition-all duration-200 relative ${
                tier.popular
                  ? "border-primary shadow-lg ring-1 ring-primary/20 lg:-translate-y-2"
                  : "border-border shadow-sm hover:shadow-md"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                  {tier.badge}
                </div>
              )}

              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-card-foreground">{tier.name}</h3>
                  <p className="text-muted-foreground text-xs mt-1 min-h-[32px]">{tier.description}</p>
                </div>

                <div className="mb-6 pb-6 border-b border-border flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-card-foreground tracking-tight">{tier.priceMonthly}</span>
                  <span className="text-muted-foreground text-xs font-medium">/{tier.period}</span>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Included Features:</div>
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-card-foreground font-medium">
                      <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={tier.href}
                className={buttonVariants({
                  variant: tier.popular ? "default" : "outline",
                  className: `w-full py-2.5 text-xs font-semibold rounded-lg transition duration-150 ${
                    tier.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border-border bg-card text-card-foreground hover:bg-accent"
                  }`
                })}
              >
                {tier.buttonText}
              </Link>
            </div>
          ))}
        </div>

        {/* Pricing Note */}
        <div className="mt-16 bg-muted/50 border border-border rounded-xl p-5 text-center max-w-2xl mx-auto">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Need customized enterprise terms, multi-entity configurations, or board training workshops? Reach out to our team during onboarding.
          </p>
        </div>
      </section>

      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
