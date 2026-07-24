"use client";

import { useQuery } from "@tanstack/react-query";
import { api, User } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, memo, useMemo, useCallback } from "react";
import { TableSkeleton } from "../components/skeleton";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
        <TableSkeleton rows={5} />
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
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage team members and their roles ({userCount} total)</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-ring focus:border-ring"
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
        <div className="card text-center py-20 px-6 border border-border shadow-sm bg-card rounded-xl">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-muted-foreground text-sm font-medium">No Users</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No users found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search criteria.</p>
        </div>
      ) : (
        <div className="card overflow-hidden shadow-sm border border-border bg-card rounded-xl p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-foreground">Name</TableHead>
                <TableHead className="font-semibold text-foreground">Phone</TableHead>
                <TableHead className="font-semibold text-foreground">Email</TableHead>
                <TableHead className="font-semibold text-foreground">Role</TableHead>
                <TableHead className="font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/50 transition-colors group">
                  <TableCell className="font-semibold text-foreground group-hover:text-primary transition-colors max-w-[200px] truncate" title={u.name}>{u.name}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{u.phone}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate" title={u.email || ''}>{u.email || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${roleColor(u.role)}`}>
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/users/${u.id}`} className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-sm transition-colors hover:underline">
                      View →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
});

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
