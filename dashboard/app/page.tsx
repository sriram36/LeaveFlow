"use client";

import Link from "next/link";
import { useState, useEffect, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "./lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Users,
  Calendar,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Clock,
  TrendingUp,
  Smartphone,
  Zap,
  Shield,
  Star,
  ChevronRight,
  Play,
  Sparkles,
  Globe,
  Lock,
  BarChart,
  UserCheck,
  CalendarDays,
  FileText,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin
} from "lucide-react";

const LandingPage = memo(() => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  LeaveFlow
                </span>
              </div>
              <div className="hidden md:flex space-x-6">
                <a href="#features" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-medium">
                  Features
                </a>
                <a href="#pricing" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-medium">
                  Pricing
                </a>
                <a href="#faq" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-medium">
                  FAQ
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                Sign In
              </Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-32 sm:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-950/20 dark:to-slate-900 -z-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              WhatsApp-powered leave management
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Manage leaves effortlessly
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-400">
              WhatsApp-powered leave management. Approve requests in seconds, not days. AI-powered automation for busy teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 font-semibold">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-3 font-semibold">
                View Demo
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>No card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>7-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Built for teams that value simplicity, speed, and reliability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Feature 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  WhatsApp Integration
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage leave requests directly through WhatsApp. Real-time notifications, instant approvals, zero friction.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  AI-Powered
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Natural language processing understands requests. Smart validation, conflict detection, and automated workflows.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Team Calendar
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Visual overview of who's on leave when. Prevent double-booking and plan team capacity effortlessly.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Analytics & Reports
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Insights into leave patterns, utilization rates, and team trends. Data-driven workforce planning.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Role-Based Access
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Worker, Manager, HR, Admin roles with granular permissions. Each team member sees what they need.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Enterprise Security
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  End-to-end encryption, audit logs, compliance ready. Your data is protected at every step.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600 dark:bg-indigo-900/20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white dark:text-slate-50 mb-4">
            Ready to simplify leave management?
          </h2>
          <p className="text-lg text-indigo-100 dark:text-slate-300 mb-8">
            Join hundreds of teams that ship faster with LeaveFlow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 font-semibold px-8 py-3">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600 font-semibold px-8 py-3">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-white">LeaveFlow</span>
              </div>
              <p className="text-sm">
                Modern leave management for modern teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm">© 2024 LeaveFlow. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <a href="#" className="hover:text-white transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
});

const DashboardHome = memo(() => {
  const { user } = useAuth();

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: () => api.getPendingRequests(),
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: balance } = useQuery({
    queryKey: ['my-balance'],
    queryFn: () => api.getMyBalance(),
    staleTime: 60000,
    refetchInterval: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => [],
    staleTime: 30000,
  });

  const pendingCount = useMemo(() => pendingRequests?.length || 0, [pendingRequests]);
  const balanceData = useMemo(() => balance || { casual: 0, sick: 0, special: 0 }, [balance]);
  const activityData = useMemo(() => recentActivity || [], [recentActivity]);
  const totalBalance = useMemo(() => (balanceData.casual || 0) + (balanceData.sick || 0) + (balanceData.special || 0), [balanceData]);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBalance}</div>
              <p className="text-xs text-muted-foreground">
                Days remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-muted-foreground">
                Active users
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest leave requests and approvals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity?.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {activity.user?.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <UserCheck className="w-4 h-4 mr-2" />
                Review Requests
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <CalendarDays className="w-4 h-4 mr-2" />
                View Calendar
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </CardContent>
          </Card>
        </div>
    </div>
  );
});

export default memo(function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <DashboardHome />;
  }

  return <LandingPage />;
});