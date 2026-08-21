"use client";

import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-background text-muted-foreground py-16 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">
        {/* Brand */}
        <div className="space-y-3">
          <div className="text-xl font-bold tracking-tight text-foreground">
            Segue<span className="text-muted-foreground font-medium">Meet</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enterprise board governance, minutes, board pack compiler, and decisions register.
          </p>
          <p className="text-[11px] text-muted-foreground/80 pt-2">
            © {new Date().getFullYear()} SegueMeet. All rights reserved.
          </p>
        </div>

        {/* Navigation columns */}
        <div>
          <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-foreground">Product</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/product" className="hover:text-foreground transition">Platform Overview</Link></li>
            <li><Link href="/features" className="hover:text-foreground transition">Features & Modules</Link></li>
            <li><Link href="/pricing" className="hover:text-foreground transition">Pricing & Plans</Link></li>
            <li><Link href="/login" className="hover:text-foreground transition">Sign In</Link></li>
            <li><Link href="/signup" className="hover:text-foreground transition">Register</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-foreground">Resources</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/resources" className="hover:text-foreground transition">Governance Hub</Link></li>
            <li><Link href="/resources" className="hover:text-foreground transition">Charter Templates</Link></li>
            <li><Link href="/resources" className="hover:text-foreground transition">Meeting Checklists</Link></li>
            <li><Link href="/resources" className="hover:text-foreground transition">Security Overview</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-foreground">Company & Compliance</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/about" className="hover:text-foreground transition">About SegueMeet</Link></li>
            <li><Link href="/about" className="hover:text-foreground transition">Governance Principles</Link></li>
            <li><Link href="/about" className="hover:text-foreground transition">Multi-Tenancy & RBAC</Link></li>
            <li><Link href="/about" className="hover:text-foreground transition">Immutable Audit Trails</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
