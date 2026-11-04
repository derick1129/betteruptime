import Link from "next/link";
import { Activity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Activity className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight">BetterUptime</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
