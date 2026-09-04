"use client";

import Link from "next/link";
import { useState, memo, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";
import { Button } from "@/components/ui/button";
import { CalendarDays, CircleCheck as CheckCircle, Zap, MessageSquare, ChartBar as BarChart3 } from "lucide-react";

export default memo(function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "manager" as "manager" | "hr" | "admin",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isFormValid = useMemo(() => {
    return (
      formData.name.trim() &&
      formData.email.trim() &&
      formData.phone.trim() &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword &&
      formData.phone.match(/^\+?[1-9]\d{1,14}$/)
    );
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      if (!isFormValid) {
        setError("Please fill in all fields correctly");
        return;
      }

      setLoading(true);

      try {
        await api.register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
        });

        setSuccess("Account created successfully! You can now sign in.");

        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          role: "manager",
        });
      } catch (err: unknown) {
        const e = err as any;
        setError(e.response?.data?.detail || e.message || "Registration failed");
      } finally {
        setLoading(false);
      }
    },
    [formData, isFormValid]
  );

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
              Start managing leave like a pro.
            </h2>
            <p className="text-white/80 text-lg">
              Get set up in minutes. Your team will love the simplicity.
            </p>
            <div className="space-y-3 pt-4">
              {[
                { icon: MessageSquare, text: "WhatsApp-native leave requests" },
                { icon: Zap, text: "AI-powered validation & processing" },
                { icon: BarChart3, text: "Analytics & team calendar" },
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

          <p className="text-white/60 text-sm">Free 7-day trial. No credit card required.</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 my-auto animate-slide-up">
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">LeaveFlow</span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h1>
            <p className="text-muted-foreground">Get started with LeaveFlow in minutes.</p>
          </div>

          <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
            <p className="text-xs text-warning font-medium">
              Note: In production, new accounts require admin approval. For testing, instant access is enabled.
            </p>
          </div>

          {success && (
            <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{success}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Phone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="+1234567890"
                />
                <p className="text-xs text-muted-foreground">Include country code</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="role" className="text-sm font-medium text-foreground">
                  Role *
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                >
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12"
              size="lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/signin" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
});
