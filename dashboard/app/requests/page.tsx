"use client";

import { useQuery } from "@tanstack/react-query";
import { api, LeaveRequest } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TableSkeleton } from "../components/skeleton";
import { ErrorMessage } from "../components/loading";

type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export default function RequestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: requests, isLoading, error, refetch } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: () => api.getPendingRequests(),
    enabled: isAuthenticated,
    staleTime: 10000,  // Consider data fresh for 10 seconds
    refetchInterval: 30000,  // Refetch every 30 seconds
    refetchOnWindowFocus: true,  // Refetch when window regains focus
  });

  useEffect(() => {
    console.log('[Requests Page] Data:', requests);
    console.log('[Requests Page] Loading:', isLoading);
    console.log('[Requests Page] Error:', error);
  }, [requests, isLoading, error]);

  if (authLoading) {
    return (
      <main className="space-y-6">
        <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <TableSkeleton rows={3} />
      </main>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load requests';
    return (
      <main className="space-y-6">
        <h1 className="text-3xl font-bold">Pending Requests</h1>
        <ErrorMessage message={errorMessage} onRetry={() => refetch()} />
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Pending Requests</h1>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <TableSkeleton rows={5} />
      </main>
    );
  }

  const rows = requests ?? [];

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pending Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and approve leave requests from your team</p>
        </div>
        <div className="flex gap-3">
          <Link href="/requests/history" className="btn btn-ghost border border-slate-300 text-sm">
            📊 View History
          </Link>
          <Link href="/requests/calendar" className="btn btn-ghost border border-slate-300 text-sm">
            📅 Calendar
          </Link>
        </div>
      </div>

      {!rows.length ? (
        <div className="card text-center py-16 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-xl font-semibold text-foreground mb-2">All caught up!</p>
          <p className="text-muted-foreground">No pending requests right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((req) => (
            <RequestCard key={req.id} req={req} />
          ))}
        </div>
      )}
    </main>
  );
}

function RequestCard({ req }: { req: LeaveRequest }) {
  const badge = badgeForStatus(req.status);
  return (
    <div className="card hover:border-primary/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl font-bold text-foreground">#{req.id}</span>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badge.className}`}>{badge.label}</span>
          </div>
          <div className="text-base text-foreground font-semibold mb-2">
            {req.user?.name || "Unknown"}
            <span className="text-muted-foreground font-normal text-sm ml-2">({req.user?.phone})</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded">
              📅 {req.start_date} → {req.end_date}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded capitalize">
              {req.leave_type}
            </span>
            {req.duration_type !== 'full' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">
                {req.duration_type.replace('half_', 'Half ')}
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{req.reason}</div>
        </div>
        <Link
          href={`/requests/${req.id}`}
          className="btn btn-primary text-sm shadow-md hover:shadow-lg transition-all whitespace-nowrap"
        >
          Review →
        </Link>
      </div>
    </div>
  );
}

function badgeForStatus(status: LeaveStatus) {
  switch (status) {
    case "pending":
      return { label: "Pending", className: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400" };
    case "approved":
      return { label: "Approved", className: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400" };
    case "rejected":
      return { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-muted text-muted-foreground" };
    default:
      return { label: status, className: "bg-muted text-muted-foreground" };
  }
}
