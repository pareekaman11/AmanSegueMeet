'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, ShieldCheck, Mail, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { validateEmailStrict, VALIDATION_LIMITS } from '@/lib/validation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const emailValidation = useMemo(() => {
    if (!email) return null;
    return validateEmailStrict(email);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailCheck = validateEmailStrict(email);
    if (!emailCheck.isValid) {
      setError(
        emailCheck.suggestion
          ? `${emailCheck.error} ${emailCheck.suggestion}`
          : (emailCheck.error || 'Please enter a valid, complete email address.')
      );
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (Array.isArray(msg)) {
        setError(msg.join('. '));
      } else {
        setError(msg || 'Unable to send reset link. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1 font-display">Forgot password</h1>
        <p className="text-slate-500 text-sm">Enter your verified email to receive a secure password reset link.</p>
      </div>

      {success ? (
        <div className="text-center space-y-4">
          <div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-lg border border-emerald-200">
            If an account exists with that email, a secure password reset link has been dispatched to your inbox.
          </div>
          <Link href="/login" className="block text-primary hover:underline font-semibold text-sm pt-2">
            Return to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <span>{error}</span>
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
          
          <Button type="submit" className="w-full h-11 bg-[#31327c] hover:bg-[#262762] text-white font-semibold shadow-sm mt-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Secure Link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>

          <div className="mt-4 text-center text-xs text-slate-500">
            Remembered your password?{" "}
            <Link href="/login" className="text-[#31327c] hover:underline font-semibold">
              Back to login
            </Link>
          </div>
        </form>
      )}

      <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>End-to-End Cryptographic Security</span>
      </div>
    </>
  );
}
