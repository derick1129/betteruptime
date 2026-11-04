import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "BetterUptime - High-Performance Website Uptime Monitoring",
  description: "Distributed multi-region website uptime and latency monitoring powered by Redis Streams and PostgreSQL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
