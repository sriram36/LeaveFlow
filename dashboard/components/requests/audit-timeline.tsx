"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/app/lib/api";
import { formatTimestamp } from "@/app/lib/format";

const LABEL: Record<string, string> = {
  created: "Request created",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/** The request's audit log, oldest first. */
export function AuditTimeline({ requestId }: { requestId: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit", requestId],
    queryFn: () => api.getRequestAudit(requestId),
  });

  if (isLoading) return <div className="h-16 animate-pulse rounded-xl bg-muted/70" aria-label="Loading history" />;
  if (isError || !data) return <p className="text-sm text-muted-foreground">History is unavailable right now.</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No history recorded.</p>;

  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {data.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary"
            aria-hidden
          />
          <p className="text-sm font-medium text-foreground">
            {LABEL[entry.action] ?? entry.action}
            {entry.actor_name && <span className="font-normal text-muted-foreground"> · {entry.actor_name}</span>}
          </p>
          <p className="text-xs text-muted-foreground">{formatTimestamp(entry.created_at)}</p>
          {entry.details && <p className="mt-1 text-sm text-muted-foreground">&ldquo;{entry.details}&rdquo;</p>}
        </li>
      ))}
    </ol>
  );
}
