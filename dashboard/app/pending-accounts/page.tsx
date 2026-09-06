"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "../components/skeleton";
import { useEffect, useState, memo, useCallback, useMemo } from "react";
import { CircleCheck as CheckCircle, UserCheck, UserX } from "lucide-react";

export default memo(function PendingAccountsPage() {
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
    // Only Admin can access this page
    if (!authLoading && currentUser && currentUser.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, currentUser, router]);

  const { data: pendingAccounts, isLoading } = useQuery({
    queryKey: ['pending-accounts'],
    queryFn: () => api.getPendingAccounts(),
    enabled: isAuthenticated && currentUser?.role === 'admin',
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });

  const accountsList = useMemo(() => pendingAccounts ?? [], [pendingAccounts]);
  const accountCount = useMemo(() => accountsList.length, [accountsList]);

  const approveMutation = useMutation({
    mutationFn: (userId: number) => api.approveAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setMessage({ type: 'success', text: 'Account approved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: Error) => {
      setMessage({ type: 'error', text: error.message || 'Failed to approve account' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: number) => api.rejectAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setMessage({ type: 'success', text: 'Account rejected successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: Error) => {
      setMessage({ type: 'error', text: error.message || 'Failed to reject account' });
    },
  });

  const handleApprove = useCallback((userId: number) => {
    approveMutation.mutate(userId);
  }, [approveMutation]);

  const handleReject = useCallback((userId: number) => {
    rejectMutation.mutate(userId);
  }, [rejectMutation]);

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

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pending Account Approvals</h1>
        <p className="text-muted-foreground">
          Approve or reject manager and HR account creation requests
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {!pendingAccounts || pendingAccounts.length === 0 ? (
        <div className="card text-center py-16 px-6 border border-border shadow-sm bg-card rounded-xl">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">All caught up</h3>
          <p className="text-sm text-muted-foreground">No pending account approvals right now.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingAccounts.map((account, i) => (
            <div
              key={account.id}
              className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow animate-slide-up"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold truncate">{account.name}</h3>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        account.role === 'manager'
                          ? 'bg-primary/10 text-primary'
                          : account.role === 'hr'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {account.role.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground break-words">
                    <div className="truncate" title={account.phone}>
                      <span className="font-medium">Phone:</span> {account.phone}
                    </div>
                    {account.email && (
                      <div className="truncate" title={account.email}>
                        <span className="font-medium">Email:</span> {account.email}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Requested:</span>{' '}
                      {new Date(account.created_at).toLocaleDateString()} at{' '}
                      {new Date(account.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => approveMutation.mutate(account.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="px-4 py-2 bg-success text-success-foreground rounded-md hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    {approveMutation.isPending ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to reject ${account.name}'s account request?`)) {
                        rejectMutation.mutate(account.id);
                      }
                    }}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    <UserX className="w-4 h-4" />
                    {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
});
