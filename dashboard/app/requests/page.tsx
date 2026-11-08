"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { CircleCheck, History } from "lucide-react";
import { api, LeaveRequest } from "../lib/api";
import { useAuthGuard } from "../lib/use-auth-guard";
import { formatDateRange, formatDays, initials, leaveTypeLabel, startsIn } from "../lib/format";
import { DashboardSkeleton } from "../components/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RequestDetail } from "@/components/requests/request-detail";
import { useRequestActions } from "@/components/requests/use-request-actions";
import { cn } from "@/lib/utils";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export default function RequestsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthGuard({
    allowedRoles: ["manager", "hr", "admin"],
    redirectTo: "/",
  });
  const isDesktop = useIsDesktop();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["pending-requests", user?.id, user?.role],
    queryFn: () => api.getPendingRequests(),
    enabled: Boolean(isAuthenticated && user && ["manager", "hr", "admin"].includes(user.role)),
    refetchOnMount: "always",
  });

  const rows = useMemo(() => data ?? [], [data]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rejectSignal, setRejectSignal] = useState(0);

  const selected = rows.find((r) => r.id === selectedId);

  // Keep a valid selection as the list changes.
  useEffect(() => {
    if (rows.length === 0) setSelectedId(null);
    else if (!rows.some((r) => r.id === selectedId)) setSelectedId(rows[0].id);
  }, [rows, selectedId]);

  // After a decision, move to the neighbouring request.
  const actions = useRequestActions((decided) => {
    const index = rows.findIndex((r) => r.id === decided.id);
    const next = rows[index + 1] ?? rows[index - 1];
    setSelectedId(next ? next.id : null);
    setSheetOpen(false);
  });

  const move = useCallback(
    (step: number) => {
      if (rows.length === 0) return;
      const index = rows.findIndex((r) => r.id === selectedId);
      setSelectedId(rows[Math.min(rows.length - 1, Math.max(0, index + step))].id);
    },
    [rows, selectedId]
  );

  // Keyboard: J/K (or arrows) move, A approves, R opens the reject box. Ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)) return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        move(1);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        move(-1);
      } else if (e.key === "a" && selected && !actions.busy) {
        actions.approve.mutate(selected.id);
      } else if (e.key === "r" && selected) {
        e.preventDefault();
        setRejectSignal((n) => n + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, selected, actions]);

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/3 animate-pulse rounded bg-muted" />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="font-medium text-destructive">
          {error instanceof Error ? error.message : "Could not load requests."}
        </p>
        <Button size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Inbox</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Leave requests</h1>
          <p className="mt-1 text-muted-foreground">
            {rows.length === 0 ? "Nothing waiting for you." : `${rows.length} waiting for your decision.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden items-center gap-3 text-xs text-muted-foreground xl:flex" aria-label="Keyboard shortcuts">
            <span><Kbd>J</Kbd> <Kbd>K</Kbd> move</span>
            <span><Kbd>A</Kbd> approve</span>
            <span><Kbd>R</Kbd> reject</span>
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/requests/history">
              <History className="h-4 w-4" /> History
            </Link>
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary-muted text-primary">
            <CircleCheck className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold">You&apos;re all caught up</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            New requests appear here the moment an employee sends them on WhatsApp.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <ul className="space-y-2 lg:max-h-[calc(100vh-15rem)] lg:overflow-y-auto lg:pr-1" aria-label="Pending requests">
            {rows.map((request) => (
              <li key={request.id}>
                <RequestRow
                  request={request}
                  selected={request.id === selectedId}
                  onSelect={() => {
                    setSelectedId(request.id);
                    if (!isDesktop) setSheetOpen(true);
                  }}
                />
              </li>
            ))}
          </ul>

          {isDesktop && selected && (
            <section
              aria-label="Request details"
              className="sticky top-24 hidden max-h-[calc(100vh-8rem)] self-start overflow-y-auto rounded-2xl border border-border bg-card p-6 lg:block"
            >
              <RequestDetail request={selected} actions={actions} rejectSignal={rejectSignal} />
            </section>
          )}
        </div>
      )}

      {!isDesktop && (
        <Sheet open={sheetOpen && Boolean(selected)} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader className="sr-only">
              <SheetTitle>Request details</SheetTitle>
            </SheetHeader>
            {selected && (
              <div className="pt-6">
                <RequestDetail request={selected} actions={actions} rejectSignal={rejectSignal} />
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

function RequestRow({
  request,
  selected,
  onSelect,
}: {
  request: LeaveRequest;
  selected: boolean;
  onSelect: () => void;
}) {
  const soon = ["today", "tomorrow"].includes(startsIn(request.start_date));
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={cn(
        "w-full rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary ring-1 ring-primary/40" : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-sm font-semibold text-primary">
          {initials(request.user?.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold">{request.user?.name ?? "Unknown"}</p>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {formatDays(request.days)}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {leaveTypeLabel(request.leave_type)} · {formatDateRange(request.start_date, request.end_date)}
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {soon && <span className="rounded-full bg-warning/20 px-1.5 py-0.5 font-semibold text-[hsl(30_80%_26%)] dark:text-warning">Starts {startsIn(request.start_date)}</span>}
            <span>{formatDistanceToNow(parseISO(request.created_at), { addSuffix: true })}</span>
          </p>
        </div>
      </div>
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[11px] font-semibold text-foreground">
      {children}
    </kbd>
  );
}
