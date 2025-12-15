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
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 sm:pt-28 sm:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900/80 -z-10"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 right-10 w-72 h-72 bg-teal-200 dark:bg-teal-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-teal-100 dark:from-indigo-900/40 dark:to-teal-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-medium border border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-shadow duration-300">
              <Sparkles className="w-4 h-4 mr-2" />
              WhatsApp-powered leave management
            </div>
            
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight bg-gradient-to-r from-indigo-600 to-teal-600 dark:from-indigo-400 dark:to-teal-400 bg-clip-text text-transparent">
              Simplify Leaves,<br/>Empower Teams
            </h1>
            
            <p className="max-w-3xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              WhatsApp-powered leave management that works the way teams think. Approve requests in seconds, not days. AI automates the rest.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-10 py-6 font-semibold rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="px-10 py-6 font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2">
                View Demo
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600 dark:text-slate-400 pt-4">
              <div className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors">
                <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="font-medium">No card required</span>
              </div>
              <div className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors">
                <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="font-medium">7-day free trial</span>
              </div>
              <div className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors">
                <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="font-medium">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Powerful features, simple interface
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Everything your team needs to manage leaves efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent dark:from-indigo-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  WhatsApp Integration
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage leaves directly via WhatsApp. Real-time notifications, instant approvals, zero friction.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent dark:from-teal-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/50 dark:to-teal-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  AI-Powered Processing
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Natural language understanding. Smart validation, conflict detection, and automated workflows.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/50 dark:to-purple-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Team Calendar
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Visual leave overview. Prevent double-booking and plan team capacity with ease.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Advanced Analytics
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Leave patterns, utilization rates, team trends. Data-driven workforce planning.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-pink-500 dark:hover:border-pink-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-transparent dark:from-pink-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/50 dark:to-pink-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Role-Based Access
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Worker, Manager, HR, Admin. Granular permissions for every team member.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/50 dark:to-green-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Enterprise Security
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  End-to-end encryption, audit logs, compliance ready. Your data is protected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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