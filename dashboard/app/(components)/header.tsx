"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
    router.refresh();
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-6 py-4 shadow-md mb-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all">
            📋 LeaveFlow
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-6 py-4 shadow-md mb-8">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all">
          📋 LeaveFlow
        </Link>
        {isAuthenticated && (
          <nav className="hidden md:flex gap-1">
            <Link href="/requests" className="px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm">
              📋 Pending
            </Link>
            <Link href="/requests/history" className="px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm">
              📊 History
            </Link>
            <Link href="/requests/calendar" className="px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm">
              📅 Calendar
            </Link>
            {(user?.role === 'hr' || user?.role === 'admin') && (
              <Link href="/users" className="px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm">
                👥 Users
              </Link>
            )}
            {(user?.role === 'hr' || user?.role === 'admin') && (
              <Link href="/holidays" className="px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm">
                🎉 Holidays
              </Link>
            )}
          </nav>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm">
        <ThemeToggle />
        {user && (
          <>
            <span className="hidden sm:inline font-semibold">{user.name}</span>
            <Badge variant="outline" className="capitalize shadow-sm">
              {user.role}
            </Badge>
          </>
        )}
        {isAuthenticated ? (
          <Button 
            onClick={handleLogout} 
            variant="outline"
            size="sm"
          >
            Logout
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link href="/">
              Login
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}

