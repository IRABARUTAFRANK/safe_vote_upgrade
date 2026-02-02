"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginOrgAdmin } from "./actions";

export default function OrgLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [isLoading, setIsLoading] = useState(false);
  const [tempData, setTempData] = useState<{ orgId: string; memberId: string } | null>(null);

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    if (!email || !password) {
      setMessage("Please provide your email and password.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const result = await loginOrgAdmin(formData);

    if (result.success && result.orgId && result.memberId) {
      setTempData({ orgId: result.orgId, memberId: result.memberId });
      setStep(2);
      setMessage("");
    } else {
      setMessage(result.error || "Login failed");
      setMessageType("error");
    }
    setIsLoading(false);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    if (!orgCode || !tempData) {
      setMessage("Please provide your organization code.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("orgId", tempData.orgId);
    formData.append("memberId", tempData.memberId);
    formData.append("orgCode", orgCode);

    const result = await loginOrgAdmin(formData);

    if (result.success) {
      setMessageType("success");
      setMessage("Login successful! Redirecting...");
      setTimeout(() => {
        router.push("/organisation/dashboard");
      }, 1000);
    } else {
      setMessage(result.error || "Invalid organization code");
      setMessageType("error");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary/20 to-primary/20 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">SafeVote</span>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4">
            {step === 1 ? "Organization Admin Login" : "Verify Organization Code"}
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-md">
            {step === 1 
              ? "Sign in to manage your organization's elections and members."
              : "Enter your organization code to complete the login process."}
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Manage elections with ease</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span>Add voters and candidates</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span>Get instant certified results</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">SafeVote</span>
          </div>

          <Link href="/" className="btn btn-ghost btn-sm mb-6 gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          {/* Step Indicator */}
          <ul className="steps steps-horizontal w-full mb-8">
            <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Credentials</li>
            <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Verify Code</li>
          </ul>

          {/* Step 1: Email & Password */}
          {step === 1 && (
            <div className="card bg-base-100 shadow-2xl">
              <div className="card-body">
                <h1 className="text-2xl font-bold text-base-content mb-2">Organization Login</h1>
                <p className="text-base-content/60 mb-6">
                  Sign in with your email and password
                </p>
                
                <form onSubmit={handleStep1}>
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Email Address</span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@organization.com"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input input-bordered w-full pr-12"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-sm absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {message && (
                    <div className={`alert ${messageType === 'error' ? 'alert-error' : 'alert-success'} mb-4`}>
                      <span>{message}</span>
                    </div>
                  )}

                  <button type="submit" className={`btn btn-primary btn-lg w-full ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Continue'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Step 2: Organization Code */}
          {step === 2 && (
            <div className="card bg-base-100 shadow-2xl">
              <div className="card-body">
                <h1 className="text-2xl font-bold text-base-content mb-2">Enter Organization Code</h1>
                <p className="text-base-content/60 mb-6">
                  Two-factor authentication: Enter your organization code
                </p>
                
                <form onSubmit={handleStep2}>
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Organization Code</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-lg text-center tracking-widest font-mono uppercase"
                      value={orgCode}
                      onChange={e => setOrgCode(e.target.value.toUpperCase())}
                      placeholder="SV-XXXX"
                      required
                      autoFocus
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        Enter the organization code provided by SafeVote after approval
                      </span>
                    </label>
                  </div>

                  {message && (
                    <div className={`alert ${messageType === 'error' ? 'alert-error' : 'alert-success'} mb-4`}>
                      <span>{message}</span>
                    </div>
                  )}

                  <button type="submit" className={`btn btn-primary btn-lg w-full ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Complete Login'}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => {
                      setStep(1);
                      setOrgCode("");
                      setMessage("");
                    }}
                    className="btn btn-ghost btn-sm w-full mt-4"
                  >
                    ← Back to Email/Password
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-base-content/60 text-sm">
              Don&apos;t have an account? <Link href="/register" className="link link-primary">Register your organization</Link>
            </p>
            <p className="text-base-content/60 text-sm">
              <Link href="/organisation/pending" className="link link-primary">Check registration status</Link>
            </p>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-base-content/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            256-bit SSL Encrypted Connection
          </div>
        </div>
      </div>
    </div>
  );
}
