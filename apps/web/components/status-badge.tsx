import { Badge } from "@/components/ui/badge";

export function StatusBadge({
  status,
}: {
  status: "Up" | "Down" | "Unknow" | "Pending" | string;
}) {
  if (status === "Up") {
    return (
      <Badge variant="success" className="gap-1.5 font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Operational
      </Badge>
    );
  }

  if (status === "Down") {
    return (
      <Badge variant="danger" className="gap-1.5 font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Downtime
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5 font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      Pending
    </Badge>
  );
}
