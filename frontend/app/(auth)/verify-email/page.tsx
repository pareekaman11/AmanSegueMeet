"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    api.get(`/auth/verify?token=${token}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message || "Email verified successfully.");
      })
      .catch((err) => {
        setStatus("error");
        const msg = err.response?.data?.message || "Verification link has expired or is invalid.";
        setMessage(msg);
      });
  }, [token]);

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center mb-4">
        {status === "loading" && <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />}
        {status === "success" && <CheckCircle2 className="h-12 w-12 text-green-500" />}
        {status === "error" && <XCircle className="h-12 w-12 text-red-500" />}
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
        {status === "loading" && "Verifying your email"}
        {status === "success" && "Email Verified"}
        {status === "error" && "Verification Failed"}
      </h2>
      
      <p className="text-slate-600">{message}</p>
      
      {status !== "loading" && (
        <Link href="/login">
          <Button className="w-full mt-4">Go to Login</Button>
        </Link>
      )}
    </div>
  );
}
