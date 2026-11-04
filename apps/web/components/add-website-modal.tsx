"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { websiteApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddWebsiteModal({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let formattedUrl = url.trim();
    if (!formattedUrl) {
      setError("Please provide a valid website URL");
      return;
    }

    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    try {
      setLoading(true);
      await websiteApi.create(formattedUrl);
      setUrl("");
      setOpen(false);
      onCreated();
    } catch (err: any) {
      setError(err.message || "Failed to add website");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Website
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Monitor a New Website</DialogTitle>
            <DialogDescription>
              Enter the target URL. Our regional probe workers will ping it periodically.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            {error && (
              <p className="text-xs text-rose-500 font-medium">{error}</p>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Target URL</label>
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                autoFocus
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Start Monitoring
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
