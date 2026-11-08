import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./lib/providers";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "./components/error-boundary";
import { Toaster } from "sonner";
import { Inter, Fraunces } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-serif" });

export const metadata = {
  title: "LeaveFlow — leave requests that start as a WhatsApp message",
  description: "Employees request leave on WhatsApp; managers approve from a live dashboard. Audit-logged, role-based and safe under concurrent approvals.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230a6358' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z'/><path d='M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'/></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary" suppressHydrationWarning>
        <ThemeProvider defaultTheme="system" storageKey="leaveflow-theme">
          <ErrorBoundary>
            <Providers>
              <AppShell>{children}</AppShell>
              <Toaster richColors position="top-right" />
            </Providers>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
