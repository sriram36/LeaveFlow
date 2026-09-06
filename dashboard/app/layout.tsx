import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./lib/providers";
import { Header } from "./(components)/header";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "./components/error-boundary";
import { PageTransition } from "@/components/page-transition";
import { Toaster } from "sonner";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] });

export const metadata = {
  title: "LeaveFlow — Leave Management, Reimagined",
  description: "WhatsApp-native leave automation and approval platform for modern teams.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='4' width='18' height='18' rx='2' ry='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary" suppressHydrationWarning>
        <ThemeProvider defaultTheme="system" storageKey="leaveflow-theme">
          <ErrorBoundary>
            <Providers>
              <div className="flex min-h-screen">
                <Sidebar className="hidden md:flex" />
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
