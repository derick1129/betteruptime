"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  RotateCw,
  Search,
  ExternalLink,
  ChevronRight,
  Trash2,
  Globe2,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { websiteApi, type Website } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { AddWebsiteModal } from "@/components/add-website-modal";

export default function DashboardPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWebsites = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      const res = await websiteApi.list();
      setWebsites(res.websites || []);
    } catch (err) {
      console.error("Failed to fetch websites", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to stop monitoring and delete this website?")) {
      return;
    }
    try {
      setDeletingId(id);
      await websiteApi.delete(id);
      setWebsites((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      alert("Failed to delete website");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    return websites.filter((w) =>
      w.url.toLowerCase().includes(search.toLowerCase())
    );
  }, [websites, search]);

  return (
    <div className="space-y-8">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitors</h1>
          <p className="text-xs text-muted-foreground">
            Manage your monitored endpoints and inspect check history.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchWebsites(true)}
            disabled={refreshing || loading}
            className="gap-1.5 text-xs"
          >
            <RotateCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <AddWebsiteModal onCreated={() => fetchWebsites(true)} />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Monitors</CardTitle>
            <Globe2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{websites.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Targets</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-500">{websites.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Probing Strategy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">Redis Streams + Consumer Groups</div>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <p className="text-xs">Loading monitors...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm font-medium">No monitors found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {websites.length === 0
                ? "Start by adding your first website URL to monitor its availability and response times."
                : "No monitors match your search query."}
            </p>
            {websites.length === 0 && (
              <div className="pt-2">
                <AddWebsiteModal onCreated={() => fetchWebsites(true)} />
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target URL</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((website) => (
                <TableRow key={website.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/dashboard/${website.id}`}
                        className="hover:underline text-foreground font-semibold flex items-center gap-1.5"
                      >
                        {website.url}
                      </Link>
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {website.timeAdded ? new Date(website.timeAdded).toLocaleDateString() : "Just now"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status="Pending" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link href={`/dashboard/${website.id}`}>
                        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                          Inspect
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(e, website.id)}
                        disabled={deletingId === website.id}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
