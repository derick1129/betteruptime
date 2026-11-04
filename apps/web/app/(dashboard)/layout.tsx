"use client";

import Link from "next/link";
import { Activity, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Activity className="h-4 w-4" />
              </div>
              <span className="font-bold text-base tracking-tight">BetterUptime</span>
            </Link>
            <nav className="flex items-center space-x-4 text-xs font-medium text-muted-foreground">
              <Link href="/dashboard" className="text-foreground hover:text-foreground">
                Monitors
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Logged in as <strong className="text-foreground">{user?.username || "Admin"}</strong>
            </span>
            <Button size="sm" variant="outline" onClick={logout} className="gap-1.5 text-xs">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
