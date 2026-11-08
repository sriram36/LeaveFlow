"use client";

import Link from "next/link";
import { useState, useEffect, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./lib/auth-context";
import { DashboardSkeleton } from "./components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { api, LeaveRequest } from "./lib/api";
import { AnalyticsChart } from "@/components/analytics-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, CircleCheck as CheckCircle, ArrowRight, ChartBar as BarChart3, Clock, Zap, UserCheck, CalendarDays, FileText, Settings } from "lucide-react";
import { LandingPage } from "@/components/landing/landing-page";

const DashboardHome = memo(function DashboardHome() {
  const { user } = useAuth();

  const { data: pendingRequests, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-requests', user?.id, user?.role],
    queryFn: () => api.getPendingRequests(),
    enabled: Boolean(
      user && (user.role === 'manager' || user.role === 'hr' || user.role === 'admin')
    ),
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['my-balance'],
    queryFn: () => api.getMyBalance(),
    staleTime: 60000,
    refetchInterval: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
    enabled: Boolean(
      user && (user.role === 'manager' || user.role === 'hr' || user.role === 'admin')
    ),
    staleTime: 30000,
  });

  const pendingCount = useMemo(
    () => stats?.pending_count ?? (pendingRequests?.length || 0),
    [stats, pendingRequests]
  );
  const balanceData = useMemo(() => balance || { casual: 0, sick: 0, special: 0 }, [balance]);
  const activityData = useMemo(() => stats?.recent_activity || [], [stats]);
  const totalBalance = useMemo(
    () => (balanceData.casual || 0) + (balanceData.sick || 0) + (balanceData.special || 0),
    [balanceData]
  );

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      const history = await api.getLeaveHistory();
      if (!history || history.length === 0) return;

      const headers = [
        'ID', 'Employee', 'Start Date', 'End Date', 'Days', 'Type', 'Duration', 'Status', 'Reason', 'Created At',
      ];
      const csvData: (string | number)[][] = history.map((req: LeaveRequest) => [
        req.id,
        req.user?.name || 'Unknown',
        req.start_date,
        req.end_date,
        req.days,
        req.leave_type,
        req.duration_type,
        req.status,
        `"${(req.reason || '').replace(/"/g, '""')}"`,
        req.created_at,
      ]);

      const csv = [headers.join(','), ...csvData.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leave-history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate report", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (pendingLoading || balanceLoading || statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Overview</p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {user?.name?.split(" ")[0] || "there"}.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Review pending requests, see who is off, and keep an eye on leave patterns.</p>
        </div>
        <Link href="/requests" className="shrink-0">
          <Button className="rounded-xl">
            Review requests
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Requests"
          value={pendingCount}
          subtitle="Awaiting approval"
          icon={Clock}
          color="text-warning"
          bg="bg-warning/10"
        />
        <StatCard
          title="Leave Balance"
          value={totalBalance}
          subtitle="Days remaining"
          icon={Calendar}
          color="text-primary"
          bg="bg-primary/10"
        />
        <StatCard
          title="Approved Today"
          value={stats?.approved_today || 0}
          subtitle="Approved today"
          icon={CheckCircle}
          color="text-success"
          bg="bg-success/10"
        />
        <StatCard
          title="Team Members"
          value={stats?.active_users || 0}
          subtitle="Active users"
          icon={Users}
          color="text-accent"
          bg="bg-accent/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics */}
        <div className="lg:col-span-2">
          <AnalyticsChart data={stats?.monthly_trends || []} />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <p className="eyebrow mb-2">At a glance</p>
              <CardTitle className="text-xl">Quick actions</CardTitle>
            </div>
            <Zap className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/requests" className="block group">
              <Button className="w-full justify-start" variant="outline">
                <UserCheck className="w-4 h-4 mr-2 text-primary" />
                Review Requests
              </Button>
            </Link>
            <Link href="/requests/calendar" className="block group">
              <Button className="w-full justify-start" variant="outline">
                <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                View Calendar
              </Button>
            </Link>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full justify-start"
              variant="outline"
            >
              <BarChart3 className="w-4 h-4 mr-2 text-primary" />
              {isGenerating ? "Generating..." : "Generate Report"}
            </Button>
            <Link href="/users" className="block group">
              <Button className="w-full justify-start" variant="outline">
                <Settings className="w-4 h-4 mr-2 text-primary" />
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <p className="eyebrow mb-2">The latest</p>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest leave requests and approvals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activityData.length > 0 ? (
                activityData.slice(0, 5).map((activity, index: number) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {activity.user?.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{activity.user}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.action}</p>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full flex-shrink-0">
                      {activity.time}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                    <FileText className="w-7 h-7" />
                  </div>
                  <p className="text-foreground font-medium">No recent activity</p>
                  <p className="text-sm text-muted-foreground">New activity will appear here.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}) {
  return (
    <Card className="group hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default memo(function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return <DashboardSkeleton />;
  }

  if (isAuthenticated) {
    return <DashboardHome />;
  }

  return <LandingPage />;
});
