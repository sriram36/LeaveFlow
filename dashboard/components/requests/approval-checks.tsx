"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CircleCheck, Info } from "lucide-react";
import { api, LeaveRequest } from "@/app/lib/api";
import { formatDays, plural, rangesOverlap, startsIn } from "@/app/lib/format";
import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "info";
interface Check {
  tone: Tone;
  text: string;
}

const ICON = { ok: CircleCheck, warn: AlertTriangle, info: Info } as const;
const COLOR = {
  ok: "text-success",
  warn: "text-[hsl(30_80%_30%)] dark:text-warning",
  info: "text-muted-foreground",
} as const;

/**
 * What a manager wants to know before deciding. Everything here comes from data the API
 * already returns: the requester's balance, teammates' leave, and the start date.
 * (Overlap with the requester's own leave is rejected when the request is created, so it is not re-checked.)
 */
export function ApprovalChecks({ request }: { request: LeaveRequest }) {
  const balanceQuery = useQuery({
    queryKey: ["balance", request.user_id],
    queryFn: () => api.getUserBalance(request.user_id),
  });
  const historyQuery = useQuery({
    queryKey: ["leave-history", "all"],
    queryFn: () => api.getLeaveHistory(),
  });

  if (balanceQuery.isLoading || historyQuery.isLoading) {
    return <div className="h-24 animate-pulse rounded-xl bg-muted/70" aria-label="Loading checks" />;
  }

  const checks: Check[] = [];

  if (balanceQuery.data) {
    // Days are reserved when a request is created, so the balance already excludes this request.
    const left = balanceQuery.data[request.leave_type];
    checks.push({
      tone: left <= 1 ? "warn" : "ok",
      text: `${formatDays(left)} of ${request.leave_type} leave left after this request`,
    });
  }

  if (historyQuery.data) {
    const teamId = request.user?.manager_id;
    const teammates = historyQuery.data.filter(
      (r) =>
        r.id !== request.id &&
        r.user_id !== request.user_id &&
        teamId != null &&
        r.user?.manager_id === teamId &&
        (r.status === "approved" || r.status === "pending") &&
        rangesOverlap(r.start_date, r.end_date, request.start_date, request.end_date)
    );
    const off = teammates.filter((r) => r.status === "approved");
    const waiting = teammates.filter((r) => r.status === "pending");
    const names = (list: LeaveRequest[]) =>
      [...new Set(list.map((r) => r.user?.name?.split(" ")[0] ?? "Someone"))].join(", ");

    if (teamId == null) {
      checks.push({ tone: "info", text: "No team is assigned, so team coverage can't be checked" });
    } else if (off.length === 0 && waiting.length === 0) {
      checks.push({ tone: "ok", text: "No teammates are off on these dates" });
    } else {
      if (off.length > 0) {
        checks.push({
          tone: off.length >= 2 ? "warn" : "info",
          text: `${plural(new Set(off.map((r) => r.user_id)).size, "teammate")} already approved off: ${names(off)}`,
        });
      }
      if (waiting.length > 0) {
        checks.push({
          tone: "info",
          text: `${plural(waiting.length, "other request")} pending for these dates: ${names(waiting)}`,
        });
      }
    }
  }

  const when = startsIn(request.start_date);
  if (when === "today" || when === "tomorrow") {
    checks.push({ tone: "warn", text: `Short notice: starts ${when}` });
  } else {
    checks.push({ tone: "info", text: `Starts ${when}` });
  }

  return (
    <ul className="space-y-2 rounded-xl bg-muted/60 p-4 text-sm" aria-label="Checks before approving">
      {checks.map((check) => {
        const Icon = ICON[check.tone];
        return (
          <li key={check.text} className="flex items-start gap-2.5 text-foreground/90">
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", COLOR[check.tone])} aria-hidden />
            <span>{check.text}</span>
          </li>
        );
      })}
    </ul>
  );
}
