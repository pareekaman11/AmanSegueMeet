"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2, Eye, EyeOff, AlertCircle, ShieldCheck, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { validateEmailStrict, VALIDATION_LIMITS } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailValidation = useMemo(() => {
    if (!email) return null;
    return validateEmailStrict(email);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const emailCheck = validateEmailStrict(email);
    if (!emailCheck.isValid) {
      setError(
        emailCheck.suggestion
          ? `${emailCheck.error} ${emailCheck.suggestion}`
          : (emailCheck.error || "Please enter a valid, complete email address.")
      );
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length > VALIDATION_LIMITS.PASSWORD.MAX) {
      setError(`Password cannot exceed ${VALIDATION_LIMITS.PASSWORD.MAX} characters.`);
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password
      });
      login(res.data.accessToken, res.data.user);
      router.push("/my-home");
    } catch (err: any) {
      if (!err.response) {
        setError("Unable to connect to the server. Please try again later.");
      } else {
        const msg = err.response?.data?.message;
        if (Array.isArray(msg)) {
          setError(msg.join(". "));
        } else {
          setError(msg || "Invalid email or password.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <Lock className="w-3 h-3" /> Login Here
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
        <p className="text-sm text-slate-500 mt-1">Secure Access</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={email}
            maxLength={VALIDATION_LIMITS.EMAIL.MAX}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10"
          />
          {email && emailValidation && !emailValidation.isValid && emailValidation.suggestedEmail && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setEmail(emailValidation.suggestedEmail!)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded transition-colors"
              >
                <Sparkles className="w-3 h-3 text-blue-600" />
                Fix email: {emailValidation.suggestedEmail}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
            <Link href="/forgot-password" className="text-xs text-[#31327c] hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              maxLength={VALIDATION_LIMITS.PASSWORD.MAX}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10 h-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-[#31327c] hover:bg-[#262762] text-white font-semibold shadow-sm mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>End-to-End Secure</span>
      </div>

      <div className="mt-4 text-center text-xs text-slate-500">
        Don't have an account?{" "}
        <Link href="/signup" className="text-[#31327c] hover:underline font-semibold">
          Create account
        </Link>
      </div>
    </div>
  );
}
