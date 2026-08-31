"use client";

import { useQuery } from "@tanstack/react-query";
import { api, LeaveRequest } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { TableSkeleton } from "../../components/skeleton";
import Link from "next/link";
import { Download, Inbox, Calendar as CalendarIcon, ArrowRight, Clock, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, ChangeEvent } from "react";

type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export default function HistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: requests, isLoading, error } = useQuery<LeaveRequest[]>({
    queryKey: ['leave-history', statusFilter],
    queryFn: () => api.getLeaveHistory(statusFilter || undefined),
    enabled: isAuthenticated,
  });

  const handleExportCSV = () => {
    if (!requests || requests.length === 0) return;

    const headers = ['ID', 'Employee', 'Start Date', 'End Date', 'Days', 'Type', 'Duration', 'Status', 'Reason', 'Created At'];
    const csvData: (string | number)[][] = requests.map((req: LeaveRequest) => [
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
  };

  if (authLoading || isLoading) {
    return (
      <main className="space-y-6">
        <div>
          <div className="h-9 bg-muted rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-5 bg-muted rounded w-1/3 animate-pulse"></div>
        </div>
        <TableSkeleton rows={5} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-6">
        <div className="card border-destructive/20 bg-destructive/5 p-8 text-center rounded-xl">
          <p className="text-destructive font-medium">Failed to load history. Please try again.</p>
        </div>
      </main>
    );
  }

  const rows: LeaveRequest[] = requests ?? [];

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Request History</h1>
          <p className="text-sm text-muted-foreground mt-1">View and export past leave requests</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="btn text-sm bg-success text-success-foreground hover:bg-success/90 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </button>
          <Link href="/requests" className="btn btn-primary text-sm shadow-md hover:shadow-lg transition-all">
            <Inbox className="w-4 h-4 mr-1.5" /> View Pending
          </Link>
        </div>
      </div>

      {!rows.length ? (
        <div className="card text-center py-16 px-6 border border-border shadow-sm bg-card rounded-xl">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No history yet</h3>
          <p className="text-sm text-muted-foreground">Past leave requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((req) => (
            <HistoryCard key={req.id} req={req} />
          ))}
        </div>
      )}
    </main>
  );
}

function HistoryCard({ req }: { req: LeaveRequest }) {
  const badge = badgeForStatus(req.status);
  return (
    <div className="card hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200 p-4">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        
        {/* Left: Avatar + Name + Meta */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm flex-shrink-0">
            {req.user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground truncate">{req.user?.name || 'Unknown'}</span>
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="inline-flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {req.start_date} → {req.end_date}</span>
              <span>•</span>
              <span className="capitalize">{req.leave_type}</span>
              <span>•</span>
              <span>{req.days} day(s)</span>
            </div>
            {req.reason && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{req.reason}</p>
            )}
          </div>
        </div>

        {/* Right: Request ID + View button */}
        <div className="flex items-center gap-3 flex-shrink-0 self-start sm:self-center">
          <span className="text-xs font-mono text-muted-foreground">#{req.id}</span>
          <Link href={`/requests/${req.id}`} className="btn btn-ghost border text-sm hover:border-primary transition-all whitespace-nowrap gap-1">
            View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function badgeForStatus(status: LeaveStatus) {
  switch (status) {
    case "pending":
      return { label: "Pending", className: "bg-warning/10 text-warning" };
    case "approved":
      return { label: "Approved", className: "bg-success/10 text-success" };
    case "rejected":
      return { label: "Rejected", className: "bg-destructive/10 text-destructive" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-muted text-muted-foreground" };
    default:
      return { label: status, className: "bg-muted text-muted-foreground" };
  }
}
