"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, Sun, Moon, Laptop, ChartBar as BarChart3, UserPlus, Inbox, Calendar } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      roles: ["manager", "hr", "admin", "worker"],
    },
    {
      title: "Requests",
      href: "/requests",
      icon: Inbox,
      roles: ["manager", "hr", "admin", "worker"],
    },
    {
      title: "History",
      href: "/requests/history",
      icon: BarChart3,
      roles: ["manager", "hr", "admin", "worker"],
    },
    {
      title: "Calendar",
      href: "/requests/calendar",
      icon: CalendarDays,
      roles: ["manager", "hr", "admin", "worker"],
    },
    {
      title: "Team",
      href: "/users",
      icon: Users,
      roles: ["hr", "admin"],
    },
    {
      title: "Holidays",
      href: "/holidays",
      icon: Calendar,
      roles: ["manager", "hr", "admin", "worker"],
    },
    {
      title: "Pending Accounts",
      href: "/pending-accounts",
      icon: UserPlus,
      roles: ["admin"],
    },
  ];

  const filteredNav = navItems.filter((item) =>
    !item.roles || item.roles.includes(user?.role || "")
  );

  if (!user) return null;

  return (
    <aside
      className={cn(
        "border-r border-border bg-card flex flex-col justify-between h-screen sticky top-0 transition-all duration-300 z-40 group",
        isCollapsed ? "w-full md:w-[72px]" : "w-full md:w-[256px]",
        className
      )}
    >
      <div className="p-4 overflow-hidden">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2.5 mb-8 px-2",
            isCollapsed && "justify-center"
          )}
        >
          <div className="w-9 h-9 min-w-[36px] rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <CalendarDays className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight text-foreground">
              LeaveFlow
            </span>
          )}
        </Link>

        {!isCollapsed && (
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Menu
          </div>
        )}
        <nav className="space-y-1">
          {filteredNav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href) &&
                  (item.href !== "/requests" || pathname === "/requests");

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  isCollapsed && "justify-center"
                )}
              >
                <item.icon className="w-[18px] h-[18px] min-w-[18px]" />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 space-y-4 overflow-hidden">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-1 bg-muted rounded-full border border-border/60">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "p-1.5 rounded-full transition-all",
                theme === "light"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme("system")}
              className={cn(
                "p-1.5 rounded-full transition-all",
                theme === "system"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Laptop className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "p-1.5 rounded-full transition-all",
                theme === "dark"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center w-full rounded-lg hover:bg-muted transition-colors text-left",
                isCollapsed ? "p-1.5 justify-center" : "gap-3 p-2"
              )}
            >
              <div className="w-8 h-8 min-w-[32px] rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                {user?.name?.charAt(0) || "U"}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize truncate">
                    {user?.role || "Role"}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border/60">
            <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg hover:bg-muted">
              <Link href="/profile" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive rounded-lg hover:bg-destructive/5"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
