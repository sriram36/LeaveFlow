"use client";

import { useQuery } from "@tanstack/react-query";
import { api, LeaveRequest } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { TableSkeleton } from "../../components/skeleton";
import Link from "next/link";
import { Download, Inbox, ArrowRight, FileText } from "lucide-react";
import { formatDateRange, formatDays, initials, leaveTypeLabel } from "../../lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState, ChangeEvent } from "react";

export default function HistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: requests, isLoading, error, refetch } = useQuery<LeaveRequest[]>({
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
          <Button onClick={() => refetch()} className="mt-4" size="sm">Try Again</Button>
        </div>
      </main>
    );
  }

  const rows: LeaveRequest[] = requests ?? [];

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Request history</h1>
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
          {rows.map((req, i) => (
            <HistoryCard key={req.id} req={req} index={i} />
          ))}
        </div>
      )}
    </main>
  );
}

function HistoryCard({ req, index }: { req: LeaveRequest; index: number }) {
  return (
    <div
      className="card p-4 transition-colors hover:border-primary/40 animate-slide-up"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms`, animationFillMode: 'both' }}
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-muted text-sm font-semibold text-primary">
            {initials(req.user?.name)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold text-foreground">{req.user?.name || 'Unknown'}</span>
              <StatusBadge status={req.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {leaveTypeLabel(req.leave_type)} · {formatDateRange(req.start_date, req.end_date)} · {formatDays(req.days)}
            </p>
            {req.reason && <p className="mt-1 truncate text-xs text-muted-foreground">{req.reason}</p>}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3 self-start sm:self-center">
          <span className="font-mono text-xs text-muted-foreground">#{req.id}</span>
          <Link href={`/requests/${req.id}`} className="btn btn-ghost gap-1 whitespace-nowrap border text-sm hover:border-primary">
            View <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
