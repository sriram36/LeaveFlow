"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { DashboardSkeleton } from "../../components/skeleton";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User as UserIcon, Mail, Phone, Shield, Briefcase, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

export default function UserDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
    // Only HR and Admin can access this page
    if (!authLoading && currentUser && currentUser.role !== 'hr' && currentUser.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, currentUser, router]);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.getUser(id),
    enabled: isAuthenticated && !!id && (currentUser?.role === 'hr' || currentUser?.role === 'admin'),
  });

  const { data: managers, isError: managersError } = useQuery({
    queryKey: ['managers'],
    queryFn: () => api.getManagers(),
    enabled: isAuthenticated && (currentUser?.role === 'hr' || currentUser?.role === 'admin'),
    retry: 1,
  });

  const { data: leaveHistory } = useQuery({
    queryKey: ['user-leave-history', id],
    queryFn: () => api.getLeaveHistory(undefined, id),
    enabled: isAuthenticated && !!id && (currentUser?.role === 'hr' || currentUser?.role === 'admin'),
  });

  useEffect(() => {
    if (user) {
      setSelectedManager(user.manager_id || null);
    }
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <main className="space-y-6">
        <div>
          <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
        </div>
        <DashboardSkeleton />
      </main>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground">User Not Found</h2>
        <p className="text-muted-foreground mt-2">The user you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
        <Link href="/users" className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-sm">
          Return to Directory
        </Link>
      </div>
    );
  }

  const handleManagerUpdate = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    setUpdateMessage(null);
    
    try {
      await api.adminUpdateUser(user.id, {
        name: user.name,
        phone: user.phone,
        email: user.email || '',
        role: user.role,
        manager_id: selectedManager
      });

      setUpdateMessage({ type: 'success', text: 'Manager assigned successfully!' });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err) {
      console.error('Manager update error:', err);
      setUpdateMessage({ type: 'error', text: 'Failed to assign manager. Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const balance = user.leave_balance;
  const stats = {
    total: leaveHistory?.length || 0,
    approved: leaveHistory?.filter(l => l.status === 'approved').length || 0,
    pending: leaveHistory?.filter(l => l.status === 'pending').length || 0,
    rejected: leaveHistory?.filter(l => l.status === 'rejected').length || 0,
  };

  return (
    <main className="max-w-7xl mx-auto space-y-8 pb-12">
      <Link href="/users" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Users
      </Link>

      {/* Profile Card */}
      <div className="card border-border/50 shadow-glass bg-card/50 backdrop-blur-md rounded-3xl overflow-hidden p-0 relative">
        {/* Decorative Header Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/80 to-indigo-600/80 relative">
          <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-[2px]"></div>
        </div>

        <div className="px-6 sm:px-8 pb-8 relative">
          {/* Profile Avatar Header */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
            <div className="relative -mt-14 sm:-mt-12 z-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-xl border-4 border-card flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
              {user.name?.charAt(0)}
            </div>
            
            <div className="flex-1 min-w-0 pb-1 mt-4 lg:mt-0">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground truncate">{user.name}</h1>
                  <p className="text-muted-foreground mt-1 text-sm font-medium">#{user.id.toString().padStart(4, '0')}</p>
                </div>
                <div className={`inline-flex self-start lg:self-center items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm flex-shrink-0 ${roleColor(user.role)}`}>
                  {user.role === 'admin' ? <Shield className="w-4 h-4 mr-2" /> : <Briefcase className="w-4 h-4 mr-2" />}
                  <span className="capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Inside Profile Card */}
          <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Phone Number</p>
                <p className="text-sm font-semibold truncate text-foreground">{user.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Email Address</p>
                <p className="text-sm font-semibold truncate text-foreground">{user.email || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Balances Card */}
        <div className="card border-border/50 shadow-glass bg-card/50 backdrop-blur-md rounded-3xl p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Leave Balances ({new Date().getFullYear()})</h3>
          
          {balance ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <BalanceCard title="Casual" days={balance.casual} color="bg-green-500" />
              <BalanceCard title="Sick" days={balance.sick} color="bg-red-500" />
              <BalanceCard title="Special" days={balance.special} color="bg-purple-500" />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-muted/30 border border-dashed border-border/50 rounded-lg p-6 min-h-[100px]">
              <p className="text-sm text-muted-foreground font-medium">No balance data available</p>
            </div>
          )}
        </div>

        {/* Manager Assignment Card */}
        {user.role === 'worker' && (
          <div className="card border-border/50 shadow-glass bg-card/50 backdrop-blur-md rounded-3xl p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Reporting To</h3>
            
            {managersError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-medium text-red-700 dark:text-red-400">
                Failed to load managers.
              </div>
            )}

            <div className="space-y-4">
              <select
                value={selectedManager || ''}
                onChange={(e) => setSelectedManager(e.target.value ? Number(e.target.value) : null)}
                disabled={isUpdating || managersError || !managers}
                className="w-full h-11 px-4 border border-border/60 rounded-lg bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
              >
                <option value="">-- No Manager Assigned --</option>
                {managers?.map((manager: { id: number; name: string; phone: string }) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleManagerUpdate}
                disabled={isUpdating || managersError || !managers}
                className="w-full h-11 bg-primary text-primary-foreground rounded-lg shadow-sm hover:shadow-md hover:bg-primary/90 disabled:opacity-50 font-semibold text-sm transition-all"
              >
                {isUpdating ? 'Saving...' : 'Save Assignment'}
              </button>
              
              {updateMessage && (
                <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  updateMessage.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {updateMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {updateMessage.text}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Statistics Card */}
      <div className="card border-border/50 shadow-glass bg-card/50 backdrop-blur-md rounded-3xl p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Request Statistics</h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatBlock icon={<Calendar />} label="Total" value={stats.total} color="text-blue-500" />
          <StatBlock icon={<CheckCircle />} label="Approved" value={stats.approved} color="text-emerald-500" />
          <StatBlock icon={<Clock />} label="Pending" value={stats.pending} color="text-amber-500" />
          <StatBlock icon={<XCircle />} label="Rejected" value={stats.rejected} color="text-red-500" />
        </div>
      </div>

      {/* Recent Leave History Card */}
      <div className="card border-border/50 shadow-glass bg-card/50 backdrop-blur-md rounded-3xl p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Recent Leave Requests</h3>
        {!leaveHistory || leaveHistory.length === 0 ? (
          <p className="text-muted-foreground">No leave requests yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {leaveHistory.slice(0, 10).map((leave) => (
              <div key={leave.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-4 first:pt-0 last:pb-0">
                <div>
                  <div className="font-semibold text-foreground">Request #{leave.id}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {leave.start_date} → {leave.end_date}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize mt-1">
                    {leave.leave_type} Leave
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center min-w-[90px] justify-center px-3 py-1 text-xs font-bold rounded-full ${statusColor(leave.status)}`}>
                    {leave.status}
                  </span>
                  <Link href={`/requests/${leave.id}`} className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors text-sm">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function roleColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400';
    case 'hr':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
    case 'manager':
      return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
    case 'worker':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
    case 'cancelled':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function BalanceCard({ title, days, color }: { title: string, days: number, color: string }) {
  return (
    <div className="p-4 rounded-xl border border-border/40 bg-muted/20 relative overflow-hidden group hover:bg-muted/40 transition-colors">
      <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
      <p className="text-xs font-bold text-muted-foreground uppercase">{title}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-foreground">{days}</span>
        <span className="text-sm font-medium text-muted-foreground">days</span>
      </div>
    </div>
  );
}

function StatBlock({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/30 bg-muted/10 text-center">
      <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-2 ${color}`}>
        {icon}
      </div>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">{label}</span>
    </div>
  );
}
