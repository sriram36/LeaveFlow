"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, parseISO } from "date-fns";
import { ArrowRight, CalendarClock, CircleCheck, Download, Inbox, UserMinus } from "lucide-react";
import { useAuth } from "./lib/auth-context";
import { api, LeaveRequest } from "./lib/api";
import { formatDateRange, formatDays, initials, leaveTypeLabel, startsIn } from "./lib/format";
import { DashboardSkeleton } from "./components/skeleton";
import { AnalyticsChart } from "@/components/analytics-chart";
import { TeamAvailability } from "@/components/team-availability";
import { StatusBadge } from "@/components/status-badge";
import { LandingPage } from "@/components/landing/landing-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

const DashboardHome = memo(function DashboardHome() {
  const { user } = useAuth();

  const stats = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => api.getDashboardStats() });
  const today = useQuery({ queryKey: ["today-leaves"], queryFn: () => api.getTodayLeaves() });
  const history = useQuery({ queryKey: ["leave-history", "all"], queryFn: () => api.getLeaveHistory() });

  const [exporting, setExporting] = useState(false);

  const { upcoming30, thisWeek, recent } = useMemo(() => {
    const all = history.data ?? [];
    const now = new Date();
    const todayKey = format(now, "yyyy-MM-dd");
    const weekKey = format(addDays(now, 7), "yyyy-MM-dd");
    const monthKey = format(addDays(now, 30), "yyyy-MM-dd");
    const approved = all.filter((r) => r.status === "approved");
    return {
      upcoming30: approved.filter((r) => r.start_date >= todayKey && r.start_date <= monthKey).length,
      thisWeek: approved
        .filter((r) => r.end_date >= todayKey && r.start_date <= weekKey)
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .slice(0, 5),
      recent: all.slice(0, 6),
    };
  }, [history.data]);

  const exportCsv = async () => {
    try {
      setExporting(true);
      const rows = history.data ?? (await api.getLeaveHistory());
      if (!rows.length) return;
      const header = ["ID", "Employee", "Start Date", "End Date", "Days", "Type", "Duration", "Status", "Reason", "Created At"];
      const lines = rows.map((r: LeaveRequest) =>
        [r.id, r.user?.name || "Unknown", r.start_date, r.end_date, r.days, r.leave_type, r.duration_type, r.status,
          `"${(r.reason || "").replace(/"/g, '""')}"`, r.created_at].join(",")
      );
      const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leave-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (stats.isLoading || today.isLoading || history.isLoading) return <DashboardSkeleton />;

  const firstName = user?.name?.split(" ")[0] || "there";
  const pending = stats.data?.pending_count ?? 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Overview</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {pending
              ? `${pending} ${pending === 1 ? "request is" : "requests are"} waiting for your decision.`
              : "Nothing is waiting for you. Here is how the team looks."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={exporting}>
            <Download className="h-4 w-4" /> {exporting ? "Exporting…" : "Export CSV"}
          </Button>
          <Button asChild>
            <Link href="/requests">
              Review requests <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi href="/requests" icon={Inbox} label="Pending requests" value={pending} note="Waiting for approval" tone="amber" />
        <Kpi href="/requests/history" icon={CircleCheck} label="Approved today" value={stats.data?.approved_today ?? 0} note="Decisions made today" tone="green" />
        <Kpi href="/requests/calendar" icon={UserMinus} label="Away today" value={today.data?.count ?? 0} note="On approved leave" tone="blue" />
        <Kpi href="/requests/calendar" icon={CalendarClock} label="Upcoming leave" value={upcoming30} note="Starting in the next 30 days" tone="teal" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnalyticsChart data={stats.data?.monthly_trends ?? []} />
        </div>
        <TeamAvailability total={stats.data?.active_users ?? 0} away={today.data?.count ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="text-lg">Recent requests</CardTitle>
              <CardDescription>The latest requests, newest first</CardDescription>
            </div>
            <Link href="/requests/history" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No requests yet. They appear here when someone sends one on WhatsApp.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-4 font-semibold">Employee</th>
                      <th className="hidden pb-2 pr-4 font-semibold sm:table-cell">Type</th>
                      <th className="pb-2 pr-4 font-semibold">Dates</th>
                      <th className="pb-2 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r) => (
                      <tr key={r.id} className="border-b border-border/60 last:border-0">
                        <td className="py-3 pr-4">
                          <Link href={`/requests/${r.id}`} className="flex items-center gap-3 font-medium hover:underline">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-muted text-xs font-semibold text-primary">
                              {initials(r.user?.name)}
                            </span>
                            {r.user?.name ?? "Unknown"}
                          </Link>
                        </td>
                        <td className="hidden py-3 pr-4 text-muted-foreground sm:table-cell">{leaveTypeLabel(r.leave_type)}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatDateRange(r.start_date, r.end_date)}
                          <span className="ml-2 text-xs">({formatDays(r.days)})</span>
                        </td>
                        <td className="py-3 text-right">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Away this week</CardTitle>
            <CardDescription>Approved leave in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {thisWeek.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Everyone is in this week.</p>
            ) : (
              <ul className="space-y-4">
                {thisWeek.map((r) => (
                  <li key={r.id}>
                    <Link href={`/requests/${r.id}`} className="flex items-center gap-3 hover:opacity-80">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-muted text-xs font-semibold text-primary">
                        {initials(r.user?.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{r.user?.name ?? "Unknown"}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {leaveTypeLabel(r.leave_type)} · {formatDateRange(r.start_date, r.end_date)}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {parseISO(r.start_date) <= new Date() ? "now" : startsIn(r.start_date)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

const TONES = {
  amber: "bg-warning/15 text-[hsl(30_80%_28%)] dark:text-warning",
  green: "bg-success/15 text-success",
  blue: "bg-[hsl(var(--chart-4)/0.15)] text-[hsl(var(--chart-4))]",
  teal: "bg-primary-muted text-primary",
} as const;

function Kpi({
  href, icon: Icon, label, value, note, tone,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  note: string;
  tone: keyof typeof TONES;
}) {
  return (
    <Link href={href} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardContent className="flex items-start gap-4 p-5">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-3xl font-semibold leading-none">{value}</p>
            <p className="mt-2 text-sm font-medium">{label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default memo(function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) return <DashboardSkeleton />;
  if (isAuthenticated) return <DashboardHome />;
  return <LandingPage />;
});
