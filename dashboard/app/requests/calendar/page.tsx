"use client";

import { useQuery } from "@tanstack/react-query";
import { api, LeaveRequest, Holiday } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { DashboardSkeleton } from "../../components/skeleton";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight, ChartBar as BarChart3, Inbox, Calendar as CalendarIcon, Sparkles } from "lucide-react";

export default function CalendarPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const year = currentMonth.getFullYear();

  const { data: leaves, isLoading: leavesLoading, error: leavesError, refetch: refetchLeaves } = useQuery({
    queryKey: ['leave-history-calendar', year],
    queryFn: () => api.getLeaveHistory('approved'),
    enabled: isAuthenticated,
  });

  const { data: holidays, isLoading: holidaysLoading, error: holidaysError, refetch: refetchHolidays } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => api.getHolidays(year),
    enabled: isAuthenticated,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate padding for start of month (Sunday = 0)
  const startPadding = getDay(monthStart);

  const getLeavesForDay = useMemo(() => {
    return (day: Date): LeaveRequest[] => {
      if (!leaves) return [];
      return leaves.filter((leave) => {
        const start = parseISO(leave.start_date);
        const end = parseISO(leave.end_date);
        return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end);
      });
    };
  }, [leaves]);

  const getHolidayForDay = useMemo(() => {
    return (day: Date): Holiday | undefined => {
      if (!holidays) return undefined;
      const dateStr = format(day, 'yyyy-MM-dd');
      return holidays.find(h => h.date === dateStr);
    };
  }, [holidays]);

  if (authLoading || leavesLoading || holidaysLoading) {
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

  if (leavesError || holidaysError) {
    return (
      <main className="space-y-6">
        <div className="card border-destructive/20 bg-destructive/5 p-8 text-center rounded-xl">
          <p className="text-destructive font-medium">Failed to load calendar data. Please try again.</p>
          <button onClick={() => { refetchLeaves(); refetchHolidays(); }} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all">
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Leave Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">View team availability and plan coverage seamlessly</p>
        </div>
        <div className="flex gap-3">
          <Link href="/requests/history" className="inline-flex items-center justify-center px-4 py-2 bg-card border border-border/50 rounded-xl shadow-sm hover:bg-muted/50 transition-colors text-sm font-medium">
            <BarChart3 className="w-4 h-4 mr-2 text-primary" />
            History
          </Link>
          <Link href="/requests" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all text-sm font-medium">
            <Inbox className="w-4 h-4 mr-2" />
            Pending
          </Link>
        </div>
      </div>

      <div className="card border-border/50 shadow-glass bg-card/50 backdrop-blur-md rounded-2xl overflow-hidden relative">
        {/* Decorative Background gradient */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/5 to-transparent -z-10"></div>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-6 pb-8">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border/50 shadow-sm hover:bg-muted hover:scale-105 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mt-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{days.length} Days</span>
            </div>
          </div>
          
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border/50 shadow-sm hover:bg-muted hover:scale-105 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3 sm:gap-4">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Empty cells for start padding */}
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[120px] bg-muted/20 rounded-xl border border-dashed border-border/30 opacity-50" />
            ))}

            {/* Days */}
            {days.map((day) => {
              const dayLeaves = getLeavesForDay(day);
              const holiday = getHolidayForDay(day);
              const isWeekend = getDay(day) === 0 || getDay(day) === 6;
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[120px] p-2.5 rounded-xl border transition-all duration-300 relative group flex flex-col ${
                    isToday
                      ? 'border-primary shadow-md bg-primary/5 ring-1 ring-primary/20'
                      : isWeekend
                      ? 'bg-muted/30 border-border/30'
                      : holiday
                      ? 'bg-warning/5 border-warning/30 shadow-sm'
                      : 'bg-background border-border/50 hover:border-primary/40 hover:shadow-glass hover:-translate-y-0.5'
                  }`}
                >
                  {/* Today Indicator Line */}
                  {isToday && <div className="absolute top-0 inset-x-2 h-1 bg-primary rounded-b-md"></div>}

                  <div className={`text-sm font-bold mb-2 flex items-center justify-between ${
                    isToday ? 'text-primary' : isWeekend ? 'text-muted-foreground' : 'text-foreground'
                  }`}>
                    <span className={`flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-primary text-primary-foreground shadow-sm' : ''}`}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1.5 overflow-hidden">
                    {holiday && (
                      <div className="flex items-center text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-warning/20 to-warning/10 text-warning px-2 py-1 rounded-md border border-warning/20 truncate" title={holiday.name}>
                        <Sparkles className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{holiday.name}</span>
                      </div>
                    )}

                    {dayLeaves.slice(0, 3).map((leave) => (
                      <Link
                        key={leave.id}
                        href={`/requests/${leave.id}`}
                        className={`block text-[10px] sm:text-xs font-medium px-2 py-1 rounded-md truncate hover:brightness-95 transition-all ${
                          leave.leave_type === 'sick'
                            ? 'bg-destructive/10 text-destructive border border-destructive/20'
                            : leave.leave_type === 'casual'
                            ? 'bg-success/10 text-success border border-success/20'
                            : 'bg-accent/10 text-accent border border-accent/20'
                        }`}
                        title={`${leave.user?.name} - ${leave.leave_type}`}
                      >
                        {leave.user?.name?.split(' ')[0] || 'User'}
                      </Link>
                    ))}

                    {dayLeaves.length > 3 && (
                      <div className="text-[10px] font-semibold text-muted-foreground text-center pt-1">
                        +{dayLeaves.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="border-t border-border/50 bg-muted/30 p-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Legend</p>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <LegendItem color="bg-success/10 border-success/20" label="Casual Leave" />
            <LegendItem color="bg-destructive/10 border-destructive/20" label="Sick Leave" />
            <LegendItem color="bg-accent/10 border-accent/20" label="Special Leave" />
            <LegendItem color="bg-warning/10 border-warning/20" label="Holiday" />
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
                <span className="w-1.5 h-1.5 bg-primary-foreground rounded-full"></span>
              </span>
              <span className="text-sm font-medium text-foreground">Today</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-4 h-4 rounded-md border shadow-sm ${color}`}></span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}

