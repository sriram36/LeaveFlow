"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Holiday } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { TableSkeleton } from "../components/skeleton";
import { useRouter } from "next/navigation";
import { useEffect, useState, memo, useCallback, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default memo(function HolidaysPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const canEdit = user?.role === 'hr' || user?.role === 'admin';

  const { data: holidays, isLoading, error } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => api.getHolidays(year),
    enabled: Boolean(isAuthenticated),
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const holidaysList = useMemo(() => holidays ?? [], [holidays]);
  const holidayCount = useMemo(() => holidaysList.length, [holidaysList]);

  const addMutation = useMutation({
    mutationFn: () => api.createHoliday(newDate, newName, newDescription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', year] });
      setShowAddForm(false);
      setNewDate('');
      setNewName('');
      setNewDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', year] });
    },
  });

  const handleYearChange = useCallback((newYear: number) => {
    setYear(newYear);
  }, []);

  const handleAddHoliday = useCallback(() => {
    if (newDate && newName) {
      addMutation.mutate();
    }
  }, [newDate, newName, addMutation]);

  const handleDeleteHoliday = useCallback((id: number) => {
    if (confirm('Are you sure you want to delete this holiday?')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

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
    return <div className="text-red-600">Failed to load holidays.</div>;
  }

  const sortedHolidays = [...(holidays || [])].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Holidays</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage company holidays and observances</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {[year - 1, year, year + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {canEdit && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary text-sm shadow-md hover:shadow-lg transition-all"
            >
              + Add Holiday
            </button>
          )}
        </div>
      </div>

      {/* Add Holiday Form */}
      {showAddForm && (
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-lg">
          <h3 className="font-semibold mb-3">Add New Holiday</h3>
          <div className="grid gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm bg-background"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Holiday Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Independence Day"
                  className="w-full border rounded px-3 py-2 text-sm bg-background"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Description (optional)</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g., National holiday celebrating independence"
                className="w-full border rounded px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewDate('');
                  setNewName('');
                  setNewDescription('');
                }}
                className="btn bg-muted hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={() => addMutation.mutate()}
                disabled={!newDate || !newName || addMutation.isPending}
                className="btn btn-primary disabled:opacity-50"
              >
                {addMutation.isPending ? 'Adding...' : 'Add Holiday'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Holidays List */}
      {sortedHolidays.length === 0 ? (
        <div className="card text-center py-8 text-muted-foreground">
          No holidays configured for {year}.
        </div>
      ) : (
        <div className="card overflow-hidden shadow-sm border border-border bg-card rounded-xl p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-foreground">Date</TableHead>
                <TableHead className="font-semibold text-foreground">Day</TableHead>
                <TableHead className="font-semibold text-foreground">Holiday Name</TableHead>
                <TableHead className="font-semibold text-foreground">Description</TableHead>
                {canEdit && <TableHead className="font-semibold text-foreground">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHolidays.map((holiday) => {
                const date = parseISO(holiday.date);
                const isPast = date < new Date();
                return (
                  <TableRow key={holiday.id} className={`hover:bg-muted/50 transition-colors ${isPast ? 'opacity-60' : ''}`}>
                    <TableCell className="font-semibold">{holiday.date}</TableCell>
                    <TableCell className="text-muted-foreground font-medium">{format(date, 'EEEE')}</TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">
                        {holiday.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {holiday.description || '-'}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${holiday.name}"?`)) {
                              deleteMutation.mutate(holiday.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="text-destructive hover:underline text-sm font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <strong>Note:</strong> Holidays are automatically excluded when calculating leave days. 
        If an employee applies for leave that includes a holiday, that day will not be counted.
      </div>
    </main>
  );
});
