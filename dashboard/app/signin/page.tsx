"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { Button } from "@/components/ui/button";
import { Mail, Lock, ArrowRight, CalendarDays, Zap, MessageSquare, ChartBar as BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function SigninPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const coldStartTimer = setTimeout(() => {
      toast.info("The backend server is waking up. This can take up to 50 seconds...", {
        duration: 10000,
      });
    }, 3000);

    try {
      await login(email, password);
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const e = err as any;
      setError(e?.message || "Login failed");
    } finally {
      clearTimeout(coldStartTimer);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-accent relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
        </div>
        <div className="flex flex-col justify-between p-12 relative z-10 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">LeaveFlow</span>
          </Link>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              The modern way to manage team leave.
            </h2>
            <p className="text-white/80 text-lg">
              WhatsApp-native leave automation with AI-powered processing and real-time analytics.
            </p>
            <div className="space-y-3 pt-4">
              {[
                { icon: MessageSquare, text: "Apply for leave via WhatsApp" },
                { icon: Zap, text: "AI-powered instant validation" },
                { icon: BarChart3, text: "Real-time analytics dashboard" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/60 text-sm">Trusted by modern HR teams worldwide.</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">LeaveFlow</span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your LeaveFlow dashboard.</p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Forgot your password?</span>
              <Link href="/signin" className="text-sm font-semibold text-primary hover:underline">
                Reset it
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  Sign in to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink-0 mx-4 text-xs font-medium text-muted-foreground">OR</span>
              <div className="flex-grow border-t border-border" />
            </div>

            <Button
              type="button"
              onClick={() => {
                setEmail("demo@leaveflow.com");
                setPassword("demo123");
              }}
              variant="outline"
              className="w-full h-12"
              size="lg"
            >
              <Zap className="w-4 h-4 mr-2 text-primary" />
              Fill Demo Credentials
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
