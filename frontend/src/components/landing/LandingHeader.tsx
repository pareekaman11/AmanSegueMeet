"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function LandingHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Product", href: "/product" },
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Resources", href: "/resources" },
    { label: "About", href: "/about" },
  ];

  return (
    <header className="w-full bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50 transition-colors">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5 md:px-12">
        <Link href="/" className="text-xl font-bold tracking-tight text-foreground hover:opacity-90 transition">
          Segue<span className="text-muted-foreground font-medium">Meet</span>
        </Link>
        <ul className="hidden md:flex items-center space-x-8 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`transition-colors duration-150 py-1 ${
                    isActive
                      ? "text-foreground font-semibold border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center space-x-3">
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
        <div className="md:hidden bg-background border-b border-border px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-border flex flex-col gap-2">
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
    </header>
  );
}
