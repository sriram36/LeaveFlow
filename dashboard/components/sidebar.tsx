"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Settings,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  BarChart3,
  UserPlus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
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
      href: "/requests",
      icon: LayoutDashboard,
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
      icon: Sparkles,
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
    <aside className={cn("border-r border-border bg-background flex flex-col justify-between h-screen sticky top-0 transition-all duration-300 z-40 group", className, isCollapsed ? "w-full md:w-[80px]" : "w-full md:w-[280px]")}>
      
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 hidden md:flex"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className="p-4 sm:p-6 overflow-hidden">
        <Link href="/" className={cn("flex items-center gap-3 mb-10", isCollapsed ? "justify-center" : "")}>
          <div className="w-8 h-8 min-w-[32px] rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight text-foreground truncate">
              LeaveFlow
            </span>
          )}
        </Link>

        {!isCollapsed && <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Menu</div>}
        <nav className="space-y-1.5">
          {filteredNav.map((item) => {
            const isActive = pathname.startsWith(item.href) && 
              (item.href !== "/requests" || pathname === "/requests");
              
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "text-primary-foreground bg-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <item.icon className={cn("w-4.5 h-4.5 min-w-[18px]", isActive ? "text-primary-foreground" : "")} />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 sm:p-6 space-y-6 overflow-hidden">
        {/* Theme Toggle */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-1 bg-muted/40 rounded-full border border-border/50 backdrop-blur-md">
            <button onClick={() => setTheme("light")} className={cn("p-2 rounded-full transition-all", theme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}><Sun className="w-4 h-4" /></button>
            <button onClick={() => setTheme("system")} className={cn("p-2 rounded-full transition-all", theme === "system" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}><Laptop className="w-4 h-4" /></button>
            <button onClick={() => setTheme("dark")} className={cn("p-2 rounded-full transition-all", theme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}><Moon className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex justify-center p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn("flex items-center w-full rounded-md hover:bg-muted/50 transition-colors text-left", isCollapsed ? "p-1 justify-center" : "gap-3 p-2")}>
              <div className="w-8 h-8 min-w-[32px] rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground border border-border shadow-sm">
                {user?.name?.charAt(0) || "U"}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize truncate">{user?.role || "Role"}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-xl shadow-2xl shadow-black/10 border-border/50 backdrop-blur-xl bg-background/95">
            <DropdownMenuLabel className="font-semibold text-foreground">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg hover:bg-muted/50 focus:bg-muted/50">
              <Link href="/profile" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={logout}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive rounded-lg hover:bg-destructive/10 focus:bg-destructive/10"
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
