"use client";

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
  UserPlus
} from "lucide-react";
import { useTheme } from "next-themes";
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
    <aside className={cn("w-[280px] border-r border-border/50 bg-background/50 backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-40", className)}>
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 mb-10 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-300">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            LeaveFlow
          </span>
        </Link>

        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Menu</div>
        <nav className="space-y-1.5">
          {filteredNav.map((item) => {
            const isActive = pathname.startsWith(item.href) && 
              (item.href !== "/requests" || pathname === "/requests");
              
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "text-primary bg-primary/10 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                )}
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "group-hover:scale-110 transition-transform")} />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 space-y-6">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-1 bg-muted/40 rounded-full border border-border/50 backdrop-blur-md">
          <button
            onClick={() => setTheme("light")}
            className={cn("p-2 rounded-full transition-all", theme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme("system")}
            className={cn("p-2 rounded-full transition-all", theme === "system" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Laptop className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={cn("p-2 rounded-full transition-all", theme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-muted/50 transition-all text-left border border-transparent hover:border-border/50 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center font-semibold text-primary border border-primary/20 shadow-inner group-hover:scale-105 transition-transform">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground capitalize truncate font-medium">{user?.role || "Role"}</p>
              </div>
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
