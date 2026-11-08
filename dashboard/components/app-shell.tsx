"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { Header } from "@/app/(components)/header";
import { Sidebar } from "@/components/sidebar";
import { PageTransition } from "@/components/page-transition";

const PUBLIC_PATHS = ["/signin", "/signup"];

/**
 * Signed-in users get the sidebar + header. Visitors, and the sign-in/sign-up
 * pages, are rendered full-width with no app chrome (the landing page is one of them).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated || PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar className="hidden md:flex" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
