"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "./lib/api";

export default function HomePage() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: () => api.getPendingRequests(),
    enabled: isAuthenticated && mounted,
    staleTime: 10000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const { data: balance } = useQuery({
    queryKey: ['my-balance'],
    queryFn: () => api.getMyBalance(),
    enabled: isAuthenticated && mounted,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/requests");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      
      // If it's a role restriction error, show more details
      if (errorMessage.includes('restricted') || errorMessage.includes('worker')) {
        setError("⚠️ Dashboard Access Restricted\n\nThis dashboard is only for Managers, HR, and Admin users.\n\nWorkers should apply for leave using WhatsApp.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || isLoading) {
    return (
      <main className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  if (isAuthenticated) {
    const pendingCount = pendingRequests?.length || 0;
    const totalBalance = (balance?.casual || 0) + (balance?.sick || 0) + (balance?.special || 0);

    return (
      <main className="space-y-8">
        {/* Welcome Header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium mb-2">Welcome back</p>
            <h1 className="text-4xl font-bold mb-3">{user?.name}</h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium capitalize">
                {user?.role}
              </span>
              <span className="text-blue-100">•</span>
              <span className="text-blue-100 text-sm">Ready to manage leaves efficiently</span>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-3xl font-bold text-foreground">{pendingCount}</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Pending Requests</h3>
              <p className="text-sm text-muted-foreground">Awaiting your approval</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-3xl font-bold text-foreground">{totalBalance}</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Leave Balance</h3>
              <p className="text-sm text-muted-foreground">Total days available</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-3xl font-bold text-foreground">24h</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Quick Response</h3>
              <p className="text-sm text-muted-foreground">Average approval time</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Link href="/requests" className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">Review Requests</h3>
                <p className="text-sm text-muted-foreground">Approve or reject pending leave applications</p>
              </div>
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link href="/requests/calendar" className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">View Calendar</h3>
                <p className="text-sm text-muted-foreground">Check team availability and plan ahead</p>
              </div>
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link href="/requests/history" className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-primary hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">History & Reports</h3>
                <p className="text-sm text-muted-foreground">Export data and analyze leave patterns</p>
              </div>
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </section>

        {/* Admin Quick Links */}
        {(user?.role === 'hr' || user?.role === 'admin') && (
          <section className="rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Admin Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/users" className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent hover:border-primary transition-all group">
                <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="font-medium">Manage Users</span>
              </Link>
              <Link href="/holidays" className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent hover:border-primary transition-all group">
                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <span className="font-medium">Manage Holidays</span>
              </Link>
            </div>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Marketing */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"/>
            </svg>
            WhatsApp-Native Leave Management
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Modern Leave
              </span>
              <br />
              <span className="text-foreground">Management System</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Streamline your team's leave approval process with real-time WhatsApp notifications and intelligent automation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold">Instant Approvals</h3>
              </div>
              <p className="text-sm text-muted-foreground">One-click approve or reject with automatic WhatsApp notifications</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6z" />
                  </svg>
                </div>
                <h3 className="font-semibold">Smart Analytics</h3>
              </div>
              <p className="text-sm text-muted-foreground">Track leave patterns and generate detailed reports</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold">Team Calendar</h3>
              </div>
              <p className="text-sm text-muted-foreground">Visual calendar shows who's off and avoids conflicts</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-semibold">Secure & Compliant</h3>
              </div>
              <p className="text-sm text-muted-foreground">Enterprise-grade security with role-based access</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-indigo-500/20 rounded-3xl blur-3xl"></div>
          <div className="relative rounded-2xl border border-border bg-card shadow-2xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
              <p className="text-muted-foreground">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  placeholder="you@company.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : "Sign In"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                  Create one now
                </Link>
              </p>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-center text-blue-700 dark:text-blue-300">
                  ℹ️ <strong>Dashboard Access:</strong> Only for Managers, HR & Admin
                  <br />
                  <span className="text-blue-600 dark:text-blue-400">Workers should apply for leave via WhatsApp</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
