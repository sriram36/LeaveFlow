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
import { MessageSquare, Users, Calendar, CircleCheck as CheckCircle, ArrowRight, ChartBar as BarChart3, Clock, Zap, Shield, ChevronRight, Play, Sparkles, Globe, Lock, UserCheck, CalendarDays, FileText, Settings } from "lucide-react";

const LandingPage = memo(function LandingPage() {
  return (
    <div className="relative">
      {/* Top Nav */}
      <nav className="absolute top-0 w-full z-50 px-6 py-5 flex items-center justify-between max-w-7xl mx-auto left-0 right-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <CalendarDays className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">LeaveFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/signin"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-full px-5">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10" />
        <div className="absolute top-32 left-1/4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob -z-10" />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000 -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <Link
            href="/signup"
            className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20 hover:shadow-sm transition-all cursor-pointer group mb-8"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            <span>Manage leaves the WhatsApp way</span>
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.05]">
            Leave Management,
            <br />
            <span className="gradient-text">Reimagined for Teams</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed mt-6">
            Approve requests in seconds, not days. AI-powered processing, WhatsApp
            integration, and powerful analytics — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-8">
            <Link href="/signup">
              <Button size="lg" className="px-8 text-base">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/requests">
              <Button size="lg" variant="outline" className="px-8 text-base">
                <Play className="w-4 h-4 mr-2" />
                View Demo
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              No card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              7-day free trial
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-border bg-card/50 py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "80%", label: "Less admin work" },
            { value: "3s", label: "Avg. processing time" },
            { value: "24/7", label: "WhatsApp availability" },
            { value: "100%", label: "Audit-ready" },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              An end-to-end solution
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to streamline leave management, from submission to analytics.
            </p>
          </div>

          <div className="space-y-12">
            {[
              {
                num: "01",
                title: "Request via WhatsApp",
                desc: "Employees submit leave requests directly through WhatsApp. Natural language processing understands what they need, instantly validates against policies, and checks team availability.",
                icon: MessageSquare,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                num: "02",
                title: "Intelligent Processing",
                desc: "AI analyzes requests for policy compliance, detects conflicts, checks leave balances, and identifies potential issues — all automatically. Managers see smart recommendations for faster decisions.",
                icon: Zap,
                color: "text-accent",
                bg: "bg-accent/10",
              },
              {
                num: "03",
                title: "Instant Approvals",
                desc: "Managers approve or reject requests instantly via WhatsApp. Employees get immediate confirmation, HR maintains complete audit trails, and the team calendar updates automatically.",
                icon: CheckCircle,
                color: "text-success",
                bg: "bg-success/10",
              },
              {
                num: "04",
                title: "Analytics & Insights",
                desc: "Comprehensive dashboards show leave patterns, utilization rates, team trends, and predictive analytics. Make data-driven workforce planning decisions with confidence.",
                icon: BarChart3,
                color: "text-warning",
                bg: "bg-warning/10",
              },
            ].map((step, i) => (
              <div
                key={i}
                className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-8 animate-fade-in`}
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
              >
                <div className="flex-1">
                  <div className={`inline-flex items-center justify-center w-14 h-14 ${step.bg} rounded-xl mb-5`}>
                    <step.icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-lg">{step.desc}</p>
                </div>
                <div className="flex-1 h-48 bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl border border-border/60 flex items-center justify-center">
                  <span className={`text-6xl font-bold ${step.color} opacity-20`}>{step.num}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-card/50 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything your team needs
            </h2>
            <p className="text-lg text-muted-foreground">Powerful features designed for modern teams</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, title: "WhatsApp Integration", desc: "Manage leaves directly via WhatsApp. Real-time notifications, instant approvals.", color: "text-primary", bg: "bg-primary/10" },
              { icon: Zap, title: "AI-Powered Processing", desc: "Natural language understanding, smart validation, conflict detection, automated workflows.", color: "text-accent", bg: "bg-accent/10" },
              { icon: Calendar, title: "Team Calendar", desc: "Visual leave overview, prevent double-booking, plan team capacity with ease.", color: "text-success", bg: "bg-success/10" },
              { icon: BarChart3, title: "Advanced Analytics", desc: "Leave patterns, utilization rates, team trends. Data-driven workforce planning.", color: "text-warning", bg: "bg-warning/10" },
              { icon: Users, title: "Role-Based Access", desc: "Worker, Manager, HR, Admin. Granular permissions for every team member.", color: "text-destructive", bg: "bg-destructive/10" },
              { icon: Shield, title: "Enterprise Security", desc: "End-to-end encryption, audit logs, compliance ready. Your data is protected.", color: "text-primary", bg: "bg-primary/10" },
            ].map((feature, i) => (
              <Link href="/signup" key={i} className="group animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
                <div className="bg-card rounded-xl border border-border/60 p-6 hover:border-primary/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className={`w-12 h-12 ${feature.bg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Enterprise-grade security
            </h2>
            <p className="text-lg text-muted-foreground">
              Your data stays yours. Always encrypted, always secure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: "Data Encryption", desc: "All data is encrypted at rest and in transit using industry-standard algorithms.", color: "text-primary", bg: "bg-primary/10" },
              { icon: Shield, title: "Compliance", desc: "SOC 2 Type II and GDPR compliant, trusted by thousands of businesses for secure operations.", color: "text-accent", bg: "bg-accent/10" },
              { icon: Globe, title: "Your Data, Your Control", desc: "Your data is only accessible to your team and is never used to train models.", color: "text-success", bg: "bg-success/10" },
            ].map((item, i) => (
              <div key={i} className="bg-card rounded-xl border border-border/60 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
                <div className={`w-11 h-11 ${item.bg} rounded-lg flex items-center justify-center mb-4`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Loved by teams everywhere
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what HR managers and team leads say about LeaveFlow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "We cut our leave approval time from 2 days to under 5 minutes. The WhatsApp integration is a game changer.",
                name: "Sarah Chen",
                role: "HR Director, TechCorp",
                initials: "SC",
              },
              {
                quote: "My team loves that they can request leave from their phone without logging into anything. It just works.",
                name: "Marcus Johnson",
                role: "Engineering Manager, FlowOps",
                initials: "MJ",
              },
              {
                quote: "The analytics dashboard gives me a clear picture of leave patterns across the whole company. Invaluable for planning.",
                name: "Priya Patel",
                role: "VP People, GrowthLab",
                initials: "PP",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border/60 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-1 mb-4 text-warning">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M10 1l2.928 5.934 6.55.95-4.739 4.619 1.118 6.523L10 16.987l-5.857 3.039 1.118-6.523L.522 7.884l6.55-.95z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent -z-10" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Ready to simplify leave management?
          </h2>
          <p className="text-lg text-white/90">
            Join thousands of teams already using LeaveFlow to streamline their leave processes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 text-base">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/requests">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 text-base"
              >
                <Play className="w-4 h-4 mr-2" />
                View Demo
              </Button>
            </Link>
          </div>
          <p className="text-white/70 text-sm">
            No credit card required — 7-day free trial — Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold tracking-tight text-foreground">LeaveFlow</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                WhatsApp-native leave automation with AI-powered processing and real-time analytics for modern teams.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/signup" className="hover:text-primary transition-colors">Get Started</Link></li>
                <li><Link href="/requests" className="hover:text-primary transition-colors">Demo</Link></li>
                <li><Link href="/requests/calendar" className="hover:text-primary transition-colors">Calendar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="cursor-default">About</span></li>
                <li><span className="cursor-default">Privacy</span></li>
                <li><span className="cursor-default">Contact</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 LeaveFlow. All rights reserved.</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
});

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
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
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
            <CardTitle>Recent Activity</CardTitle>
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
    <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
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
