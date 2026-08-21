"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingCTA() {
  return (
    <section className="py-24 bg-card border-b border-border text-card-foreground text-center">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
          Ready to streamline your board governance?
        </h2>
        <p className="mb-8 text-base text-muted-foreground max-w-xl mx-auto">
          Start your 14-day free trial or sign in to access your organization's workspace.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/signup"
            className={buttonVariants({ size: "lg", className: "w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 font-semibold" })}
          >
            Try for Free <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link
            href="/pricing"
            className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto border-border bg-background text-foreground hover:bg-accent px-8 h-12 font-medium" })}
          >
            View Pricing Plans
          </Link>
        </div>
      </div>
    </section>
  );
}
