"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Loader2,
  X,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ShieldCheck,
  Lock,
  KeyRound,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  validateEmailStrict,
  validateName,
  validateOrganisationName,
  validatePhysicalAddress,
  evaluatePasswordStrength,
  VALIDATION_LIMITS
} from "@/lib/validation";

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
];

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  // Step 2 State
  const [organisationName, setOrganisationName] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [country, setCountry] = useState("India");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Success State
  const [isSuccess, setIsSuccess] = useState(false);

  // Real-time security and validation metrics
  const nameValidation = useMemo(() => {
    if (!name) return null;
    return validateName(name);
  }, [name]);

  const emailValidation = useMemo(() => {
    if (!email) return null;
    return validateEmailStrict(email);
  }, [email]);

  const passwordMetrics = useMemo(() => {
    return evaluatePasswordStrength(password);
  }, [password]);

  const passwordsMatch = useMemo(() => {
    if (!passwordConfirmation) return null;
    return password === passwordConfirmation;
  }, [password, passwordConfirmation]);

  const addressValidation = useMemo(() => {
    if (!physicalAddress) return null;
    return validatePhysicalAddress(physicalAddress);
  }, [physicalAddress]);

  const orgNameValidation = useMemo(() => {
    if (!organisationName) return null;
    return validateOrganisationName(organisationName);
  }, [organisationName]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    const nameCheck = validateName(name);
    if (!nameCheck.isValid) {
      setError(nameCheck.error || "Full Name is required.");
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
      setError("Password is required.");
      return;
    }

    if (password.length > VALIDATION_LIMITS.PASSWORD.MAX) {
      setError(`Password cannot exceed ${VALIDATION_LIMITS.PASSWORD.MAX} characters.`);
      return;
    }

    if (passwordMetrics.passedCount < 5) {
      setError("Password does not meet all security requirements. Please verify the checklist below.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwords do not match. Please re-enter your password confirmation.");
      return;
    }

    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orgCheck = validateOrganisationName(organisationName);
    if (!orgCheck.isValid) {
      setError(orgCheck.error || "Organisation name is required.");
      return;
    }

    if (physicalAddress) {
      const addressCheck = validatePhysicalAddress(physicalAddress);
      if (!addressCheck.isValid) {
        setError(addressCheck.error || "Physical address is invalid.");
        return;
      }
    }

    if (!termsAccepted) {
      setError("You must accept the Terms of Use and AI Terms.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        passwordConfirmation,
        organisationName: organisationName.trim(),
        physicalAddress: physicalAddress.trim() || undefined,
        country
      });
      setIsSuccess(true);
    } catch (err: any) {
      if (!err.response) {
        setError("Unable to connect to the server. Please try again later.");
      } else {
        const msg = err.response?.data?.message;
        if (Array.isArray(msg)) {
          setError(msg.join(". "));
        } else {
          setError(msg || "Failed to register account.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="mx-auto w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Account Created Successfully</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
          We have sent a secure verification link to <span className="font-semibold text-slate-800">{email}</span>. Please verify your email before logging in.
        </p>
        <div className="pt-2">
          <Link href="/login">
            <Button className="w-full h-11 bg-[#31327c] hover:bg-[#282965]">Go to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <Lock className="w-3 h-3" />
          </span>
          <span className="text-xs text-slate-400 font-medium">Step {step} of 2</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {step === 1 ? "Create your account" : "Set up your organisation"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {step === 1 ? "Register with production-grade encryption & security." : "Configure your board portal workspace."}
        </p>
      </div>

      <form onSubmit={step === 1 ? handleNext : handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <span className="text-[11px] text-slate-400">
                  {name.length}/{VALIDATION_LIMITS.NAME.MAX}
                </span>
              </div>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Nayan Mishra"
                value={name}
                minLength={VALIDATION_LIMITS.NAME.MIN}
                maxLength={VALIDATION_LIMITS.NAME.MAX}
                onChange={(e) => setName(e.target.value)}
                className={`h-10 ${name && nameValidation && !nameValidation.isValid ? 'border-red-300 focus-visible:ring-red-400' : ''}`}
              />
              {name && nameValidation && !nameValidation.isValid && (
                <div className="text-[11px] text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{nameValidation.error}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                {email && emailValidation && (
                  emailValidation.isValid ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" /> Valid Domain
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      <AlertCircle className="w-3 h-3" /> Incomplete / Invalid
                    </span>
                  )
                )}
              </div>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                maxLength={VALIDATION_LIMITS.EMAIL.MAX}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-10 ${email && emailValidation && !emailValidation.isValid
                    ? "border-amber-400 focus-visible:ring-amber-400"
                    : ""
                  }`}
              />
              {email && emailValidation && !emailValidation.isValid && (
                <div className="space-y-1 mt-1">
                  <div className="text-[11px] text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{emailValidation.error} {emailValidation.suggestion}</span>
                  </div>
                  {emailValidation.suggestedEmail && (
                    <button
                      type="button"
                      onClick={() => setEmail(emailValidation.suggestedEmail!)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      Fix email: {emailValidation.suggestedEmail}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    {password.length}/{VALIDATION_LIMITS.PASSWORD.MAX}
                  </span>
                  {password && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${passwordMetrics.strengthLabel === 'Enterprise Grade' || passwordMetrics.strengthLabel === 'Strong'
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
                  placeholder="Enter strong password (12-20 chars)"
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

              {/* Password Strength Progress Bar */}
              {password && (
                <div className="space-y-1.5 pt-1">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordMetrics.strengthPercentage <= 40
                          ? 'bg-red-500 w-1/4'
                          : passwordMetrics.strengthPercentage <= 80
                            ? 'bg-amber-500 w-3/4'
                            : 'bg-emerald-600 w-full'
                        }`}
                    />
                  </div>
                </div>
              )}

              {/* Security Requirement Checklist */}
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
                <Label htmlFor="passwordConfirmation" className="text-xs font-semibold text-slate-700">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                {passwordConfirmation && (
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
                  id="passwordConfirmation"
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="Re-type your password"
                  value={passwordConfirmation}
                  maxLength={VALIDATION_LIMITS.PASSWORD.MAX}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className={`pr-10 h-10 ${passwordConfirmation && !passwordsMatch ? 'border-red-300 focus-visible:ring-red-400' : ''
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPasswordConfirm ? "Hide password confirmation" : "Show password confirmation"}
                >
                  {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-[15px] font-semibold bg-[#31327c] hover:bg-[#262762] text-white shadow-sm mt-3">
              Continue to Organisation Setup
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {/* Organisation Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="organisationName" className="text-xs font-semibold text-slate-700">
                  Organisation Name <span className="text-red-500">*</span>
                </Label>
                <span className="text-[11px] text-slate-400">
                  {organisationName.length}/{VALIDATION_LIMITS.ORGANISATION_NAME.MAX}
                </span>
              </div>
              <Input
                id="organisationName"
                type="text"
                placeholder="e.g. Acme Corporation"
                value={organisationName}
                minLength={VALIDATION_LIMITS.ORGANISATION_NAME.MIN}
                maxLength={VALIDATION_LIMITS.ORGANISATION_NAME.MAX}
                onChange={(e) => setOrganisationName(e.target.value)}
                className={`h-10 ${organisationName && orgNameValidation && !orgNameValidation.isValid ? 'border-red-300 focus-visible:ring-red-400' : ''}`}
              />
              {organisationName && orgNameValidation && !orgNameValidation.isValid && (
                <div className="text-[11px] text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{orgNameValidation.error}</span>
                </div>
              )}
            </div>

            {/* Physical Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="physicalAddress" className="text-xs font-semibold text-slate-700">
                  Physical Address <span className="text-slate-400 font-normal">(Optional, 5-100 chars)</span>
                </Label>
                <span className="text-[11px] text-slate-400">
                  {physicalAddress.length}/{VALIDATION_LIMITS.PHYSICAL_ADDRESS.MAX}
                </span>
              </div>
              <div className="relative">
                <Input
                  id="physicalAddress"
                  type="text"
                  placeholder="e.g. 100 Innovation Way, Suite 400"
                  value={physicalAddress}
                  maxLength={VALIDATION_LIMITS.PHYSICAL_ADDRESS.MAX}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  className={`pr-10 h-10 ${physicalAddress && addressValidation && !addressValidation.isValid ? 'border-red-300 focus-visible:ring-red-400' : ''}`}
                />
                {physicalAddress && (
                  <button
                    type="button"
                    onClick={() => setPhysicalAddress("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {physicalAddress && addressValidation && !addressValidation.isValid && (
                <div className="text-[11px] text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{addressValidation.error}</span>
                </div>
              )}
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Country / Jurisdiction</Label>
              <Select value={country} onValueChange={(val) => setCountry(val || "")}>
                <SelectTrigger className="w-full h-10 border-slate-200">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Terms Acceptance */}
            <div className="flex items-start gap-3 py-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <Label htmlFor="terms" className="text-xs font-normal text-slate-700 leading-snug cursor-pointer">
                I have read and accept the <Link href="#" className="text-blue-600 font-medium hover:underline">Terms of Use</Link> and <Link href="#" className="text-blue-600 font-medium hover:underline">AI Processing Terms</Link>. <span className="text-red-500">*</span>
              </Label>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                type="submit"
                className="w-full h-11 text-[15px] font-semibold bg-[#31327c] hover:bg-[#262762] text-white shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Encrypted Account...
                  </>
                ) : (
                  "Create Account & Start Trial"
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors text-center"
              >
                ← Back to personal details
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Trust & Security Guarantee Badge */}
      <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Bcrypt-12 Hashed • 256-Bit SSL • SOC-2 Isolation</span>
      </div>

      {step === 1 && (
        <div className="mt-4 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#31327c] hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
