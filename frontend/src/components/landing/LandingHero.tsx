"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Menu, X, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function LandingHero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section className="relative min-h-[90vh] bg-background text-foreground flex flex-col justify-between border-b border-border">
      {/* Background subtle radial effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/60 via-background to-background pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 bg-background/80 backdrop-blur border-b border-border/60 relative z-20">
        <Link href="/" className="text-xl font-bold tracking-tight text-foreground hover:opacity-90 transition">
          Segue<span className="text-muted-foreground font-medium">Meet</span>
        </Link>
        <ul className="hidden md:flex space-x-8 text-sm font-medium">
          <li><Link href="/product" className="text-muted-foreground hover:text-foreground transition">Product</Link></li>
          <li><Link href="/features" className="text-muted-foreground hover:text-foreground transition">Features</Link></li>
          <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground transition">Pricing</Link></li>
          <li><Link href="/resources" className="text-muted-foreground hover:text-foreground transition">Resources</Link></li>
          <li><Link href="/about" className="text-muted-foreground hover:text-foreground transition">About</Link></li>
        </ul>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "text-foreground hover:bg-accent font-medium" })}
          >
            Login
          </Link>
          <Link
            href="/signup"
            className={buttonVariants({ variant: "default", size: "sm", className: "hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 font-medium" })}
          >
            Try for Free
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md text-foreground hover:bg-accent transition focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 py-4 space-y-3 relative z-20">
          <Link href="/product" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">Product</Link>
          <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">Features</Link>
          <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">Pricing</Link>
          <Link href="/resources" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">Resources</Link>
          <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">About</Link>
          <div className="pt-2 border-t border-border">
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className={buttonVariants({ variant: "default", className: "w-full bg-primary text-primary-foreground text-center" })}
            >
              Try for Free
            </Link>
          </div>
        </div>
      )}

      {/* Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5 text-foreground" />
          Enterprise Board Governance Platform
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
          Governance without the chaos
        </h1>
        <p className="max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed font-normal">
          Build structured agendas, capture live minutes, track action items, and compile executive board packs in one unified, auditable workspace.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className={buttonVariants({ size: "lg", className: "w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-semibold shadow-sm" })}
          >
            Try for Free <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto border-border bg-card text-card-foreground hover:bg-accent px-8 h-12 text-base font-medium" })}
          >
            Login to Workspace
          </Link>
        </div>

        {/* Feature badges */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-foreground" />
            <span>Strict Multi-Tenant Isolation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-foreground" />
            <span>Immutable Audit Logging</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-foreground" />
            <span>Dual Digital Signatures</span>
          </div>
        </div>
      </div>

      <div className="h-6" />
    </section>
  );
}
