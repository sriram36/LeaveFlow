"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameDay, parseISO, startOfMonth, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, LeaveRequest } from "../../lib/api";
import { useAuthGuard } from "../../lib/use-auth-guard";
import { leaveTypeLabel } from "../../lib/format";
import { DashboardSkeleton } from "../../components/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_COLOR: Record<LeaveRequest["leave_type"], string> = {
  casual: "bg-primary text-primary-foreground",
  sick: "bg-[hsl(var(--chart-5))] text-white",
  special: "bg-[hsl(var(--chart-4))] text-white",
};
const TYPE_PENDING: Record<LeaveRequest["leave_type"], string> = {
  casual: "border-primary text-primary",
  sick: "border-[hsl(var(--chart-5))] text-[hsl(var(--chart-5))]",
  special: "border-[hsl(var(--chart-4))] text-[hsl(var(--chart-4))]",
};

const NAME_COL = 176;
const DAY_COL = 36;

/** Who is away when: one row per person, one column per day of the month. */
export default function TeamTimelinePage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthGuard({ redirectTo: "/" });
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const year = month.getFullYear();

  const leavesQuery = useQuery({
    queryKey: ["leave-history", "all"],
    queryFn: () => api.getLeaveHistory(),
    enabled: isAuthenticated,
  });
  const holidaysQuery = useQuery({
    queryKey: ["holidays", year],
    queryFn: () => api.getHolidays(year),
    enabled: isAuthenticated,
  });
  const peopleQuery = useQuery({
    queryKey: ["timeline-people", user?.role],
    queryFn: () => (user?.role === "manager" ? api.getMyTeam() : api.getUsers()),
    enabled: isAuthenticated && Boolean(user),
  });

  const days = useMemo(() => eachDayOfInterval({ start: month, end: endOfMonth(month) }), [month]);

  const holidayByDay = useMemo(
    () => new Map((holidaysQuery.data ?? []).map((h) => [h.date, h.name])),
    [holidaysQuery.data]
  );

  const { people, byPerson, awayPerDay } = useMemo(() => {
    const monthStart = format(days[0], "yyyy-MM-dd");
    const monthEnd = format(days[days.length - 1], "yyyy-MM-dd");
    const map = new Map<number, Map<string, LeaveRequest>>();
    const away = new Map<string, Set<number>>();

    for (const leave of leavesQuery.data ?? []) {
      if (leave.status !== "approved" && leave.status !== "pending") continue;
      if (leave.end_date < monthStart || leave.start_date > monthEnd) continue;
      for (const day of eachDayOfInterval({ start: parseISO(leave.start_date), end: parseISO(leave.end_date) })) {
        const key = format(day, "yyyy-MM-dd");
        if (key < monthStart || key > monthEnd) continue;
        // Weekends and holidays are not leave days (they are not counted in "working days").
        if (getDay(day) === 0 || getDay(day) === 6 || holidayByDay.has(key)) continue;
        const person = map.get(leave.user_id) ?? new Map<string, LeaveRequest>();
        const existing = person.get(key);
        if (!existing || (existing.status === "pending" && leave.status === "approved")) person.set(key, leave);
        map.set(leave.user_id, person);
        if (leave.status === "approved") away.set(key, (away.get(key) ?? new Set()).add(leave.user_id));
      }
    }

    const list = (peopleQuery.data ?? [])
      .filter((p) => p.role !== "admin")
      .sort((a, b) => a.name.localeCompare(b.name));
    return { people: list, byPerson: map, awayPerDay: away };
  }, [days, holidayByDay, leavesQuery.data, peopleQuery.data]);

  if (authLoading || leavesQuery.isLoading || holidaysQuery.isLoading || peopleQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/3 animate-pulse rounded bg-muted" />
        <DashboardSkeleton />
      </div>
    );
  }

  if (leavesQuery.error || holidaysQuery.error || peopleQuery.error) {
    return (
      <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="font-medium text-destructive">Could not load the team timeline.</p>
        <Button size="sm" onClick={() => { leavesQuery.refetch(); holidaysQuery.refetch(); peopleQuery.refetch(); }}>
          Try again
        </Button>
      </div>
    );
  }

  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Team</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Who&apos;s away</h1>
          <p className="mt-1 text-muted-foreground">Approved leave is solid; requests still waiting are outlined.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setMonth(subMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[9rem] text-center font-semibold">{format(month, "MMMM yyyy")}</div>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
            Today
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <div
          className="grid min-w-max"
          style={{ gridTemplateColumns: `${NAME_COL}px repeat(${days.length}, ${DAY_COL}px)` }}
          role="table"
          aria-label={`Leave timeline for ${format(month, "MMMM yyyy")}`}
        >
          {/* Day header */}
          <div className="sticky left-0 z-10 border-b border-r border-border bg-card px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Team
          </div>
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const weekend = getDay(day) === 0 || getDay(day) === 6;
            const holiday = holidayByDay.get(key);
            const isToday = isSameDay(day, today);
            return (
              <div
                key={key}
                title={holiday ?? undefined}
                className={cn(
                  "flex flex-col items-center justify-center border-b border-border py-2 text-[11px] leading-tight",
                  weekend && "bg-muted/60",
                  holiday && "bg-warning/15"
                )}
              >
                <span className="text-muted-foreground">{format(day, "EEEEE")}</span>
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full font-semibold",
                    isToday && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
            );
          })}

          {/* How many are away each day */}
          <div className="sticky left-0 z-10 border-b border-r border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground">
            Away (approved)
          </div>
          {days.map((day) => {
            const count = awayPerDay.get(format(day, "yyyy-MM-dd"))?.size ?? 0;
            return (
              <div
                key={`away-${day.toISOString()}`}
                className={cn(
                  "flex items-center justify-center border-b border-border text-xs font-semibold",
                  count >= 3 ? "bg-primary/30 text-foreground" : count === 2 ? "bg-primary/20" : count === 1 ? "bg-primary/10" : ""
                )}
              >
                {count > 0 ? count : ""}
              </div>
            );
          })}

          {/* People */}
          {people.length === 0 && (
            <div className="col-span-full px-4 py-10 text-center text-sm text-muted-foreground">
              No team members to show yet.
            </div>
          )}
          {people.map((person) => {
            const leaves = byPerson.get(person.id);
            return (
              <PersonRow key={person.id} name={person.name} days={days} leaves={leaves} holidayByDay={holidayByDay} />
            );
          })}
        </div>
      </div>

      <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Legend">
        {(["casual", "sick", "special"] as const).map((type) => (
          <li key={type} className="flex items-center gap-2">
            <span className={cn("h-3.5 w-3.5 rounded", TYPE_COLOR[type])} /> {leaveTypeLabel(type)}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded border-2 border-dashed border-muted-foreground" /> Waiting for approval
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded bg-warning/30" /> Holiday
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded bg-muted" /> Weekend
        </li>
      </ul>
    </div>
  );
}

function PersonRow({
  name,
  days,
  leaves,
  holidayByDay,
}: {
  name: string;
  days: Date[];
  leaves?: Map<string, LeaveRequest>;
  holidayByDay: Map<string, string>;
}) {
  return (
    <>
      <div className="sticky left-0 z-10 truncate border-b border-r border-border bg-card px-4 py-2.5 text-sm font-medium">
        {name}
      </div>
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const weekend = getDay(day) === 0 || getDay(day) === 6;
        const leave = leaves?.get(key);
        const base = cn(
          "flex items-center justify-center border-b border-border p-1",
          weekend && "bg-muted/60",
          holidayByDay.has(key) && "bg-warning/15"
        );
        if (!leave) return <div key={key} className={base} />;
        const pending = leave.status === "pending";
        return (
          <div key={key} className={base}>
            <Link
              href={`/requests/${leave.id}`}
              title={`${name} · ${leaveTypeLabel(leave.leave_type)} · ${leave.status}`}
              aria-label={`${name}, ${leaveTypeLabel(leave.leave_type)}, ${leave.status}, ${format(day, "d MMMM")}`}
              className={cn(
                "h-6 w-full rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pending ? cn("border-2 border-dashed bg-transparent", TYPE_PENDING[leave.leave_type]) : TYPE_COLOR[leave.leave_type]
              )}
            />
          </div>
        );
      })}
    </>
  );
}
