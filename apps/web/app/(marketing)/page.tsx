import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
  Server,
  Layers,
  Database,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 flex flex-col items-center text-center px-4 bg-gradient-to-b from-background via-muted/10 to-background border-b border-border/40">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Distributed Probing Engine Active
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Uptime monitoring that <span className="text-emerald-500">never misses a beat</span>.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal">
            High-frequency multi-region health checks backed by Redis Streams consumer groups and fault-tolerant message acknowledgments.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2 h-12 px-8 text-base">
                Start Monitoring Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Live Simulation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Simulation Card */}
      <section id="demo" className="w-full py-16 px-4 max-w-5xl">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Multi-Region Probing In Action</h2>
          <p className="text-sm text-muted-foreground">Real-time check distribution across regional probe workers</p>
        </div>

        <Card className="border border-border/80 bg-card/60 backdrop-blur shadow-2xl overflow-hidden">
          <div className="border-b border-border/60 bg-muted/40 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-muted-foreground ml-2">target: https://api.production.internal</span>
            </div>
            <Badge variant="success" className="gap-1.5 font-mono text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              100% Operational
            </Badge>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border/60 p-4 bg-background/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-emerald-500" /> us-east-1
                  </span>
                  <span className="text-emerald-500 font-mono font-medium">99.98%</span>
                </div>
                <div className="text-2xl font-bold font-mono">42 ms</div>
                <p className="text-xs text-muted-foreground mt-1">Worker #1 • XACK committed</p>
              </div>

              <div className="rounded-lg border border-border/60 p-4 bg-background/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-emerald-500" /> eu-west-1
                  </span>
                  <span className="text-emerald-500 font-mono font-medium">100.0%</span>
                </div>
                <div className="text-2xl font-bold font-mono">118 ms</div>
                <p className="text-xs text-muted-foreground mt-1">Worker #2 • XACK committed</p>
              </div>

              <div className="rounded-lg border border-border/60 p-4 bg-background/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-emerald-500" /> ap-south-1
                  </span>
                  <span className="text-emerald-500 font-mono font-medium">99.95%</span>
                </div>
                <div className="text-2xl font-bold font-mono">184 ms</div>
                <p className="text-xs text-muted-foreground mt-1">Worker #1 • XACK committed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Feature Grid */}
      <section id="features" className="w-full py-16 px-4 bg-muted/10 border-t border-border/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Engineered for Zero Downtime Blindspots</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              How BetterUptime distributes and guarantees verification checks at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-border/60">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                  <Layers className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Redis Streams Queue</CardTitle>
                <CardDescription>
                  Decoupled producers and consumers batch target checks with persistent in-memory append logs.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border/60">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Zero Dropped Pings</CardTitle>
                <CardDescription>
                  Pending Entries List (PEL) and explicit XACK acknowledgments ensure no check is ever lost on crash.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border/60">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                  <Zap className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Millisecond Precision</CardTitle>
                <CardDescription>
                  High-frequency HTTP latency benchmarking with detailed per-region response time history.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="w-full py-16 px-4 border-t border-border/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Distributed Architecture</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Fault-tolerant event-driven pipeline designed for continuous global verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-border/60 bg-card space-y-2">
              <div className="h-8 w-8 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <Cpu className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm">1. Target Scheduler</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Polls monitored targets and batches check jobs into regional Redis Streams.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card space-y-2">
              <div className="h-8 w-8 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm">2. Redis Streams</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provides guaranteed at-least-once job delivery across consumer groups.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card space-y-2">
              <div className="h-8 w-8 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <Globe2 className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm">3. Regional Workers</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Execute HTTP latency probes concurrently from edge locations and commit XACKs.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card space-y-2">
              <div className="h-8 w-8 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <Database className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm">4. Persistent Store</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Records historical ticks in PostgreSQL for latency trending and uptime calculations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-4 text-center border-t border-border/40">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Ready to monitor your services?</h2>
          <p className="text-muted-foreground text-sm">
            Sign up in seconds and get instant alerts for your websites and APIs.
          </p>
          <Link href="/signup">
            <Button size="lg" className="h-11 px-8 gap-2">
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
