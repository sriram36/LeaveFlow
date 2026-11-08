"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api } from "../../lib/api";
import { useAuthGuard } from "../../lib/use-auth-guard";
import { DashboardSkeleton } from "../../components/skeleton";
import { RequestDetail } from "@/components/requests/request-detail";
import { useRequestActions } from "@/components/requests/use-request-actions";

export default function RequestDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard({ redirectTo: "/" });
  const actions = useRequestActions();

  const { data, isLoading, error } = useQuery({
    queryKey: ["leave-request", id],
    queryFn: () => api.getLeaveRequest(id),
    enabled: isAuthenticated && Number.isFinite(id),
  });

  const back = (
    <Link href="/requests" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
      <ArrowLeft className="h-4 w-4" /> Back to requests
    </Link>
  );

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        {back}
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl space-y-6">
        {back}
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium text-destructive">This request could not be loaded, or it does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {back}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <RequestDetail request={data} actions={actions} />
      </div>
    </div>
  );
}
