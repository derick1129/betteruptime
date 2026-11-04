import { Activity } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/20 py-12 text-sm text-muted-foreground">
      <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-foreground">BetterUptime</span>
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()}</span>
        </div>
        <p className="text-xs text-center md:text-left">
          Distributed website health & latency monitoring built on Turborepo, Redis Streams & PostgreSQL.
        </p>
        <div className="flex space-x-6 text-xs">
          <Link href="/signin" className="hover:text-foreground transition-colors">Sign In</Link>
          <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
