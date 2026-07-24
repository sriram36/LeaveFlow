"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Bell, Menu, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/sidebar";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests', user?.id, user?.role],
    queryFn: () => api.getPendingRequests(),
    enabled: Boolean(isAuthenticated && mounted && user && (user.role === 'manager' || user.role === 'hr' || user.role === 'admin')),
    staleTime: 10000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const pendingCount = pendingRequests?.length || 0;
  
  if (!mounted || !isAuthenticated) return null;

  // Format the path nicely
  const pathTitle = pathname === "/" ? "Dashboard" : 
    pathname.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ');

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/50 bg-background/70 backdrop-blur-xl px-4 sm:px-6 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] bg-background/95 backdrop-blur-xl border-r-border/50">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Dynamic Title based on route */}
        <h2 className="hidden sm:block text-sm font-medium text-muted-foreground tracking-wide">
          {pathTitle}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Bell Icon Notification */}
        {(user?.role === 'manager' || user?.role === 'hr' || user?.role === 'admin') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-muted/50 rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px] shadow-lg animate-pulse">
                    {pendingCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-2xl shadow-black/10 border-border/50">
              <DropdownMenuLabel className="flex justify-between items-center px-4 py-3 border-b border-border/50">
                <span className="font-semibold text-foreground">Notifications</span>
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {pendingCount} New
                  </Badge>
                )}
              </DropdownMenuLabel>
              <div className="max-h-[300px] overflow-y-auto p-1">
                {pendingRequests && pendingRequests.length > 0 ? (
                  pendingRequests.slice(0, 5).map(req => (
                    <DropdownMenuItem key={req.id} asChild className="p-3 mb-1 cursor-pointer rounded-lg hover:bg-muted/50 focus:bg-muted/50">
                      <Link href={`/requests/${req.id}`} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center w-full">
                          <span className="font-medium text-sm text-foreground">{req.user?.name}</span>
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{req.days}d</span>
                        </div>
                        <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
                          <span className="capitalize">{req.leave_type} Leave</span>
                          <span>{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No pending requests! You&apos;re all caught up.
                  </div>
                )}
              </div>
              {pendingCount > 5 && (
                <div className="p-2 border-t border-border/50">
                  <Link href="/requests" className="block text-center text-sm font-medium text-primary hover:underline">
                    View all {pendingCount} requests
                  </Link>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
