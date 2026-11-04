"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RotateCw,
  ExternalLink,
  Trash2,
  Clock,
  Activity,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { websiteApi, type WebsiteStatusResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { LatencyChart } from "@/components/latency-chart";
import { TicksTable } from "@/components/ticks-table";

export default function WebsiteDetailPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const router = useRouter();
  const { websiteId } = use(params);

  const [data, setData] = useState<WebsiteStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await websiteApi.getStatus(websiteId);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load website status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [websiteId]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this monitor?")) return;
    try {
      await websiteApi.delete(websiteId);
      router.push("/dashboard");
    } catch (err) {
      alert("Failed to delete monitor");
    }
  };

  const ticks = data?.ticks || [];
  const latestTick = ticks[0];
  const upTicks = ticks.filter((t) => t.status === "Up").length;
  const uptimePercent = ticks.length > 0 ? ((upTicks / ticks.length) * 100).toFixed(1) : "100.0";
  const avgLatency =
    ticks.length > 0
      ? Math.round(ticks.reduce((acc, t) => acc + t.response_time_ms, 0) / ticks.length)
      : 0;

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-xs">Loading monitor metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Back to Monitors
          </Button>
        </Link>
        <Card className="border-destructive/40 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-destructive">{error || "Monitor not found"}</p>
          <Button variant="outline" size="sm" onClick={() => fetchData(true)}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/dashboard" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-1 gap-1">
            <ArrowLeft className="h-3 w-3" />
            Monitors
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight">{data.url}</h1>
            <a href={data.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-4 w-4" />
            </a>
            <StatusBadge status={latestTick?.status || "Pending"} />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="gap-1.5 text-xs"
          >
            <RotateCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Uptime Ratio</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{uptimePercent}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Based on last {ticks.length} checks</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{avgLatency} ms</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Latest: {latestTick?.response_time_ms ? `${latestTick.response_time_ms} ms` : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Pings Logged</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{ticks.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Recorded in PostgreSQL</p>
          </CardContent>
        </Card>
      </div>

      {/* Latency Chart */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Latency History</CardTitle>
          <CardDescription>Response time per probe check tick across regions</CardDescription>
        </CardHeader>
        <CardContent>
          <LatencyChart ticks={ticks} />
        </CardContent>
      </Card>

      {/* Recent Ticks Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Recent Check Log</CardTitle>
          <CardDescription>Most recent health checks executed by worker instances</CardDescription>
        </CardHeader>
        <TicksTable ticks={ticks} />
      </Card>
    </div>
  );
}
