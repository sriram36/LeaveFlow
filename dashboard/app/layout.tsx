import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./lib/providers";
import { Header } from "./(components)/header";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "./components/error-boundary";
import { PageTransition } from "@/components/page-transition";
import { Toaster } from "sonner";
import { Inter, Outfit } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "LeaveFlow Dashboard",
  description: "Manager dashboard for leave approvals",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary" suppressHydrationWarning>
        <ThemeProvider defaultTheme="system" storageKey="leaveflow-theme">
          <ErrorBoundary>
            <Providers>
              <div className="flex min-h-screen">
                {/* Fixed Sidebar for Desktop */}
                <Sidebar className="hidden md:flex" />
                
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                  <Header />
                  <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
                    <PageTransition>
                      {children}
                    </PageTransition>
                  </main>
                </div>
              </div>
              <Toaster richColors position="top-right" />
            </Providers>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
