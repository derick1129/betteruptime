"use client";

import Link from "next/link";
import { Activity, LayoutDashboard, LogOut, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">BetterUptime</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#architecture" className="hover:text-foreground transition-colors">
            Architecture
          </Link>
          <Link href="#demo" className="hover:text-foreground transition-colors">
            Live Preview
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={logout} className="text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/signin">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="gap-1.5">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
