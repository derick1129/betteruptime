import type { WebsiteTick } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";

export function TicksTable({ ticks }: { ticks: WebsiteTick[] }) {
  if (!ticks || ticks.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        No checks recorded yet. Regional probe workers ping this target on their scheduled cycles.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Region</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Response Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ticks.map((tick) => (
          <TableRow key={tick.id}>
            <TableCell className="text-xs text-muted-foreground font-mono">
              {new Date(tick.createdAt).toLocaleTimeString()}
            </TableCell>
            <TableCell className="text-xs font-medium">
              {tick.region?.name || "us-east-1"}
            </TableCell>
            <TableCell>
              <StatusBadge status={tick.status} />
            </TableCell>
            <TableCell className="text-right text-xs font-mono font-semibold">
              <span className={tick.status === "Down" ? "text-rose-500" : "text-foreground"}>
                {tick.response_time_ms} ms
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
