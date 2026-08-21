'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  KeyRound, 
  ShieldCheck, 
  Check, 
  X 
} from 'lucide-react';
import { api } from '@/lib/api';
import { evaluatePasswordStrength, VALIDATION_LIMITS } from '@/lib/validation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const passwordMetrics = useMemo(() => {
    return evaluatePasswordStrength(password);
  }, [password]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Reset token is missing or invalid.');
      return;
    }

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password.length > VALIDATION_LIMITS.PASSWORD.MAX) {
      setError(`Password cannot exceed ${VALIDATION_LIMITS.PASSWORD.MAX} characters.`);
      return;
    }

    if (passwordMetrics.passedCount < 5) {
      setError('Password does not satisfy all required security policies (12-72 characters, uppercase, lowercase, number, special character).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', { 
        token, 
        newPassword: password, 
        passwordConfirmation: confirmPassword 
      });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (Array.isArray(msg)) {
        setError(msg.join('. '));
      } else {
        setError(msg || 'Failed to reset password. The token may be expired or already used.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="mx-auto w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 font-display">Password Reset Successfully</h1>
          <p className="text-slate-500 text-sm">Your password has been securely updated. You can now log in with your new credentials.</p>
        </div>
        <Button onClick={() => router.push('/login')} className="w-full h-11 bg-[#31327c] hover:bg-[#262762] text-white font-semibold">
          Sign In Now
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1 font-display">Create New Password</h1>
        <p className="text-slate-500 text-sm">Set a strong, production-grade password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}
        
        {/* New Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-slate-700">New Password</Label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">
                {password.length}/{VALIDATION_LIMITS.PASSWORD.MAX}
              </span>
              {password && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  passwordMetrics.strengthLabel === 'Enterprise Grade' || passwordMetrics.strengthLabel === 'Strong'
                    ? 'bg-emerald-100 text-emerald-800'
                    : passwordMetrics.strengthLabel === 'Fair'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  Security: {passwordMetrics.strengthLabel}
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              disabled={!token || isLoading}
              placeholder="Enter new password (12-20 chars)"
              value={password}
              minLength={VALIDATION_LIMITS.PASSWORD.MIN}
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

          {/* Strength Progress */}
          {password && (
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  passwordMetrics.strengthPercentage <= 40
                    ? 'bg-red-500 w-1/4'
                    : passwordMetrics.strengthPercentage <= 80
                    ? 'bg-amber-500 w-3/4'
                    : 'bg-emerald-600 w-full'
                }`}
              />
            </div>
          )}

          {/* Checklist */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs text-slate-600">
            <div className="font-semibold text-[11px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              Security Policy Requirements (12 - 20 characters)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <div className={`flex items-center gap-1.5 text-[11px] ${passwordMetrics.hasMinLength && passwordMetrics.hasMaxLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordMetrics.hasMinLength && passwordMetrics.hasMaxLength ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {passwordMetrics.hasMinLength && passwordMetrics.hasMaxLength ? '✓' : '•'}
                </span>
                12 to 20 characters ({password.length}/20)
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] ${passwordMetrics.hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordMetrics.hasUppercase ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {passwordMetrics.hasUppercase ? '✓' : '•'}
                </span>
                1 uppercase letter (A-Z)
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] ${passwordMetrics.hasLowercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordMetrics.hasLowercase ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {passwordMetrics.hasLowercase ? '✓' : '•'}
                </span>
                1 lowercase letter (a-z)
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] ${passwordMetrics.hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordMetrics.hasNumber ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {passwordMetrics.hasNumber ? '✓' : '•'}
                </span>
                1 number (0-9)
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] sm:col-span-2 ${passwordMetrics.hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordMetrics.hasSpecial ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {passwordMetrics.hasSpecial ? '✓' : '•'}
                </span>
                1 special symbol (!@#$%^&*...)
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">Confirm New Password</Label>
            {confirmPassword && (
              passwordsMatch ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  <Check className="w-3 h-3" /> Passwords Match
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  <X className="w-3 h-3" /> Mismatch
                </span>
              )
            )}
          </div>
          <div className="relative">
            <Input 
              id="confirmPassword" 
              type={showConfirmPassword ? "text" : "password"} 
              disabled={!token || isLoading}
              placeholder="Re-enter your new password"
              value={confirmPassword}
              maxLength={VALIDATION_LIMITS.PASSWORD.MAX}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`pr-10 h-10 ${
                confirmPassword && !passwordsMatch ? 'border-red-300 focus-visible:ring-red-400' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-11 bg-[#31327c] hover:bg-[#262762] text-white font-semibold shadow-sm mt-2" 
          disabled={!token || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Encrypting & Updating...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>

        <div className="mt-4 text-center text-xs text-slate-500">
          <Link href="/login" className="text-[#31327c] hover:underline font-semibold">
            Back to login
          </Link>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Zero Plaintext Cryptographic Verification</span>
      </div>
    </>
  );
}
