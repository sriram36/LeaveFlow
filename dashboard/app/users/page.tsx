"use client";

import { useQuery } from "@tanstack/react-query";
import { api, User } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, memo, useMemo, useCallback } from "react";
import { TableSkeleton } from "../components/skeleton";
import Link from "next/link";
import { Mail, Phone, ArrowRight, Shield } from "lucide-react";

export default memo(function UsersPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
    // Only HR and Admin can access this page
    if (!authLoading && user && user.role !== 'hr' && user.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: () => api.getUsers(roleFilter || undefined),
    enabled: isAuthenticated && (user?.role === 'hr' || user?.role === 'admin'),
    staleTime: 60000,
    refetchInterval: 300000,
    refetchOnWindowFocus: false,
  });

  const rows = useMemo(() => users ?? [], [users]);
  const userCount = useMemo(() => rows.length, [rows]);

  const handleRoleFilterChange = useCallback((value: string) => {
    setRoleFilter(value);
  }, []);

  if (authLoading || isLoading) {
    return (
      <main className="space-y-6">
        <div>
          <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
          <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse hidden md:block"></div>
          <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse hidden lg:block"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return <div className="text-red-600">Failed to load users.</div>;
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Team Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage team members and their roles ({userCount} total)</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
            className="text-sm border border-border/50 rounded-xl px-4 py-2.5 bg-card/50 backdrop-blur-sm shadow-sm hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          >
            <option value="">All Roles</option>
            <option value="worker">Worker</option>
            <option value="manager">Manager</option>
            <option value="hr">HR</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {!rows.length ? (
        <div className="card text-center py-20 px-6 border border-border/50 shadow-glass bg-card/30 backdrop-blur-md rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 -z-10"></div>
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
            <span className="text-muted-foreground text-sm font-medium">No Users</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No users found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rows.map((u) => (
            <div key={u.id} className="group relative flex flex-col p-5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-glass hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              {/* Subtle background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate max-w-[150px]" title={u.name}>{u.name}</h3>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex-shrink-0 ${roleColor(u.role)}`}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3 relative z-10">
                {u.email && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground group/item">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="truncate group-hover/item:text-foreground transition-colors">{u.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-muted-foreground group/item">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="truncate group-hover/item:text-foreground transition-colors">{u.phone}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 relative z-10">
                <Link 
                  href={`/users/${u.id}`} 
                  className="flex items-center justify-center w-full py-2 text-sm font-medium text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors group/btn"
                >
                  View Profile
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
});

function roleColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30';
    case 'hr':
      return 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30';
    case 'manager':
      return 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30';
    case 'worker':
      return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    default:
      return 'bg-muted text-muted-foreground border-transparent';
  }
}

