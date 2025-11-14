"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 650);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        // Show success animation
        setSuccess(true);
        
        // Wait for animation to complete before redirecting
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (err) {
      setError("Error signing in");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Success Overlay with Logo */}
      {success && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background animate-in fade-in-0 duration-300">
          <div className="flex flex-col items-center gap-8">
            {/* Animated Logo */}
            <div className="relative animate-in zoom-in-50 duration-500">
              {/* Rotating border */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary via-primary/50 to-primary animate-spin-slow blur-sm" 
                   style={{ animationDuration: '3s' }} />
              
              {/* Logo container */}
              <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-2xl">
                <span className="text-5xl font-black animate-in zoom-in-0 duration-700 delay-300">
                  M1
                </span>
              </div>
              
              {/* Success check mark - appears after logo */}
              <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-500 shadow-lg animate-in zoom-in-50 duration-500 delay-700">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
            
            {/* Loading text */}
            <div className="text-center space-y-3 animate-in slide-in-from-bottom-4 duration-700 delay-500">
              <h3 className="text-2xl font-bold">
                Welcome Back!
              </h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Loading your workspace...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl transition-all duration-[2000ms]",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )}
        />
        <div
          className={cn(
            "absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl transition-all duration-[2000ms] delay-300",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )}
        />
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl transition-all duration-[2000ms] delay-500",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )}
        />
      </div>

      {/* Login Card */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md px-4 transition-all duration-1000",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}
      >
        <Card
          className={cn(
            "border-2 shadow-2xl backdrop-blur-sm bg-background/80 transition-all duration-500",
            shake && "animate-shake",
            success && "scale-95 opacity-50 blur-sm"
          )}
        >
          <CardHeader className="space-y-6 pb-8 pt-10">
            {/* Logo */}
            <div
              className={cn(
                "flex justify-center transition-all duration-1000 delay-200",
                mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
              )}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                  <span className="text-3xl font-black">M1</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div
              className={cn(
                "space-y-2 text-center transition-all duration-1000 delay-300",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
            >
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome Back
              </h1>
              <CardDescription className="text-base">
                Sign in to your account to continue
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pb-10">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Input */}
              <div
                className={cn(
                  "space-y-2 transition-all duration-1000 delay-400",
                  mounted
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-5"
                )}
              >
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    disabled={loading}
                    className={cn(
                      "pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20",
                      error && "border-destructive focus:ring-destructive/20"
                    )}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div
                className={cn(
                  "space-y-2 transition-all duration-1000 delay-500",
                  mounted
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-5"
                )}
              >
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    disabled={loading}
                    className={cn(
                      "pl-10 pr-10 h-11 transition-all focus:ring-2 focus:ring-primary/20",
                      error && "border-destructive focus:ring-destructive/20"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert
                  variant="destructive"
                  className="animate-in fade-in-50 slide-in-from-top-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div
                className={cn(
                  "pt-2 transition-all duration-1000 delay-600",
                  mounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-5"
                )}
              >
                <Button
                  type="submit"
                  className={cn(
                    "w-full h-11 text-base font-medium group relative overflow-hidden transition-all duration-300",
                    success && "bg-green-600 hover:bg-green-600"
                  )}
                  disabled={loading || success}
                >
                  <span className="flex items-center justify-center gap-2">
                    {success ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 animate-in zoom-in-50" />
                        Success!
                      </>
                    ) : loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </form>

            {/* Footer */}
            <div
              className={cn(
                "pt-4 text-center transition-all duration-1000 delay-700",
                mounted ? "opacity-100" : "opacity-0"
              )}
            >
              <p className="text-sm text-muted-foreground">
                Secure authentication powered by{" "}
                <span className="font-semibold text-foreground">M1</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
