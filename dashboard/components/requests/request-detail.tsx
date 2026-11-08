"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FileText, Paperclip, X } from "lucide-react";
import { LeaveRequest } from "@/app/lib/api";
import { useAuth } from "@/app/lib/auth-context";
import { formatDateRange, formatDays, initials, leaveTypeLabel, startsIn } from "@/app/lib/format";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ApprovalChecks } from "@/components/requests/approval-checks";
import { AuditTimeline } from "@/components/requests/audit-timeline";
import type { RequestActions } from "@/components/requests/use-request-actions";

/**
 * Everything about one request: facts, checks, decision buttons and history.
 * `rejectSignal` lets the page open the reject box from a keyboard shortcut.
 */
export function RequestDetail({
  request,
  actions,
  rejectSignal = 0,
}: {
  request: LeaveRequest;
  actions: RequestActions;
  rejectSignal?: number;
}) {
  const { user } = useAuth();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const canDecide =
    request.status === "pending" && (user?.role === "manager" || user?.role === "hr" || user?.role === "admin");

  // A different request, or one that was decided, closes the reject box.
  useEffect(() => {
    setRejecting(false);
    setReason("");
  }, [request.id, request.status]);

  useEffect(() => {
    if (rejectSignal > 0 && canDecide) {
      setRejecting(true);
      setTimeout(() => reasonRef.current?.focus(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rejectSignal]);

  const submitRejection = () => {
    if (reason.trim()) actions.reject.mutate({ id: request.id, reason: reason.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted text-base font-semibold text-primary">
            {initials(request.user?.name)}
          </div>
          <div>
            <h2 className="text-xl font-semibold leading-tight">{request.user?.name ?? "Unknown employee"}</h2>
            <p className="text-sm text-muted-foreground">Request #{request.id}</p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <Fact label="Type" value={leaveTypeLabel(request.leave_type)} />
        <Fact label="Working days" value={formatDays(request.days)} />
        <Fact label="Dates" value={formatDateRange(request.start_date, request.end_date)} />
        <Fact label="Starts" value={startsIn(request.start_date)} />
        {request.duration_type !== "full" && <Fact label="Duration" value={request.duration_type.replace("_", " ")} />}
      </dl>

      <div className="rounded-xl border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason</p>
        <p className="mt-1.5 break-words text-sm leading-relaxed">{request.reason || "No reason given"}</p>
      </div>

      {request.rejection_reason && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Rejection reason</p>
          <p className="mt-1.5 text-sm leading-relaxed">{request.rejection_reason}</p>
        </div>
      )}

      {request.attachments && request.attachments.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" /> Attachments
          </p>
          {request.attachments.map((a) => (
            <a
              key={a.id}
              href={a.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              <FileText className="h-4 w-4 text-muted-foreground" /> {a.file_type || "Attachment"}
            </a>
          ))}
        </div>
      )}

      {request.status === "pending" && (
        <section aria-labelledby={`checks-${request.id}`} className="space-y-2">
          <h3 id={`checks-${request.id}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Checks
          </h3>
          <ApprovalChecks request={request} />
        </section>
      )}

      {canDecide && (
        <div className="space-y-3">
          {rejecting ? (
            <div className="space-y-3 rounded-xl border border-destructive/30 p-4">
              <label htmlFor={`reason-${request.id}`} className="text-sm font-medium">
                Why is it being rejected? The employee sees this on WhatsApp.
              </label>
              <textarea
                id={`reason-${request.id}`}
                ref={reasonRef}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setRejecting(false);
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitRejection();
                }}
                rows={3}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. Release week, please pick another date"
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setRejecting(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={!reason.trim() || actions.busy}
                  onClick={submitRejection}
                >
                  {actions.reject.isPending ? "Rejecting…" : "Confirm rejection"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button className="flex-1" disabled={actions.busy} onClick={() => actions.approve.mutate(request.id)}>
                <Check className="h-4 w-4" />
                {actions.approve.isPending ? "Approving…" : "Approve"}
              </Button>
              <Button variant="outline" className="flex-1" disabled={actions.busy} onClick={() => setRejecting(true)}>
                <X className="h-4 w-4" /> Reject
              </Button>
            </div>
          )}
        </div>
      )}

      {request.status === "pending" && !canDecide && (
        <p className="text-sm text-muted-foreground">You don&apos;t have permission to decide this request.</p>
      )}

      <section aria-labelledby={`history-${request.id}`} className="space-y-3">
        <h3 id={`history-${request.id}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          History
        </h3>
        <AuditTimeline requestId={request.id} />
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium first-letter:uppercase">{value}</dd>
    </div>
  );
}
