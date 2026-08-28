"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, LeaveRequest } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { DashboardSkeleton } from "../../components/skeleton";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export default function RequestDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ['leave-request', id],
    queryFn: () => api.getLeaveRequest(id),
    enabled: isAuthenticated && !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => api.approveLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-request', id] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-history'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.rejectLeave(id, reason),
    onSuccess: () => {
      setShowRejectModal(false);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ['leave-request', id] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-history'] });
    },
  });

  if (authLoading || isLoading) {
    return (
      <main className="space-y-6">
        <div>
          <div className="h-9 bg-muted rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-5 bg-muted rounded w-1/3 animate-pulse"></div>
        </div>
        <DashboardSkeleton />
      </main>
    );
  }

  if (error || !detail) {
    return <div className="text-destructive">Failed to load request or not found.</div>;
  }

  const badge = badgeForStatus(detail.status);
  const canAction = detail.status === 'pending' && (user?.role === 'manager' || user?.role === 'hr' || user?.role === 'admin');

  return (
    <main className="space-y-6 max-w-4xl">
      <Link href="/requests" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
        ← Back to Pending Requests
      </Link>

      <div className="card shadow-xl border overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xl flex-shrink-0">
                {detail.user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Request #{detail.id}</h1>
                <p className="text-sm text-muted-foreground">{detail.user?.name || 'Unknown'} · {detail.user?.phone}</p>
              </div>
            </div>
            <span className={`inline-flex items-center px-4 py-1.5 text-sm rounded-full font-bold shadow-sm self-start sm:self-auto ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Leave Type</span>
            <span className="font-semibold text-foreground capitalize">{detail.leave_type}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration</span>
            <span className="font-semibold text-foreground capitalize">{detail.duration_type.replace('_', ' ')}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Days</span>
            <span className="font-semibold text-foreground">{detail.days} working day(s)</span>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date Range</span>
            <span className="font-semibold text-foreground">{detail.start_date} → {detail.end_date}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Submitted</span>
            <span className="font-medium text-foreground">{new Date(detail.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Reason */}
        <div className="px-6 pb-4">
          <div className="p-4 bg-muted/40 rounded-xl border">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-2">Reason</span>
            <p className="text-foreground leading-relaxed break-words">{detail.reason || 'No reason provided'}</p>
          </div>
        </div>

        {/* Rejection Reason */}
        {detail.rejection_reason && (
          <div className="px-6 pb-4">
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
              <span className="text-xs font-semibold uppercase tracking-wide text-destructive block mb-2">Rejection Reason</span>
              <p className="text-destructive leading-relaxed">{detail.rejection_reason}</p>
            </div>
          </div>
        )}

        {/* Attachments */}
        {detail.attachments && detail.attachments.length > 0 && (
          <div className="px-6 pb-4">
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl">
              <span className="text-xs font-semibold uppercase tracking-wide text-accent mb-3 block">
                📎 Attachments ({detail.attachments.length})
              </span>
              <div className="space-y-2">
                {detail.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-3 p-3 bg-background rounded border hover:border-accent/50 transition-colors">
                    <div className="flex-shrink-0">
                      {attachment.file_type?.includes('image') ? (
                        <span className="text-2xl">🖼️</span>
                      ) : attachment.file_type?.includes('pdf') ? (
                        <span className="text-2xl">📄</span>
                      ) : attachment.file_type?.includes('video') ? (
                        <span className="text-2xl">🎥</span>
                      ) : (
                        <span className="text-2xl">📎</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.file_type || 'Attachment'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(attachment.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded transition-colors"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {canAction && (
          <div className="px-6 py-4 border-t bg-muted/30 flex flex-wrap gap-3">
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="btn bg-success text-success-foreground hover:bg-success/90 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
            >
              {approveMutation.isPending ? 'Approving...' : '✓ Approve Request'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="btn bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
            >
              ✕ Reject Request
            </button>
          </div>
        )}

        {!canAction && detail.status === 'pending' && (
          <div className="px-6 py-4 border-t">
            <p className="text-muted-foreground text-sm">You don&apos;t have permission to approve or reject this request.</p>
          </div>
        )}
      </div>


      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl p-8 w-full max-w-md border">
            <h3 className="text-2xl font-bold mb-4">Reject Leave Request</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Please provide a reason for rejection. This will be sent to the employee via WhatsApp.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border-2 rounded-lg p-4 text-sm mb-6 bg-background focus:ring-2 focus:ring-destructive focus:border-destructive transition-all"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="btn bg-muted hover:bg-muted/80 flex-1 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate(rejectReason)}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="btn bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 flex-1 shadow-md hover:shadow-lg transition-all"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
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
