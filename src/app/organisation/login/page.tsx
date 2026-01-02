"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../../styles/auth.module.css";
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
      // Check organization status and redirect accordingly
      setTimeout(() => {
        // The dashboard will check status and redirect if needed
        router.push("/organisation/dashboard");
      }, 1000);
    } else {
      setMessage(result.error || "Invalid organization code");
      setMessageType("error");
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authWrapper}>
        {/* Left Panel - Image with Overlay */}
        <div className={styles.imagePanel}>
          <img 
            src="/images/vote.jpg" 
            alt="Voting" 
            className={styles.imagePanelBg}
          />
          <div className={styles.imagePanelOverlay}></div>
          <div className={styles.imagePanelContent}>
            <div className={styles.brandLogo}>
              <div className={styles.brandMark}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 4.6 9c-1 .6-1.7 1.8-1.7 3s.7 2.4 1.7 3c-.3 1.5.2 3 1.5 3.8a3.6 3.6 0 0 0 4.9 1.5c.6 1.1 1.8 1.7 3 1.7s2.4-.6 3-1.7a3.6 3.6 0 0 0 4.4-4.3c1-.6 1.7-1.8 1.7-3s-.7-2.4-1.7-3c.3-1.5-.2-3-1.5-3.8a3.6 3.6 0 0 0-4.9-1.5A3.6 3.6 0 0 0 12 3z"/>
                </svg>
              </div>
              <span className={styles.brandTitle}>SafeVote</span>
            </div>

            <h2 className={styles.brandHeadline}>
              {step === 1 ? "Organization Admin Login" : "Verify Organization Code"}
            </h2>
            <p className={styles.brandDescription}>
              {step === 1 
                ? "Sign in to manage your organization's elections and members."
                : "Enter your organization code to complete the login process."}
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className={styles.formPanel}>
          <div className={styles.formContainer}>
            <Link href="/" className={styles.backLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Home
            </Link>

            <div className={styles.mobileLogo}>
              <div className={styles.mobileLogoMark}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 4.6 9c-1 .6-1.7 1.8-1.7 3s.7 2.4 1.7 3c-.3 1.5.2 3 1.5 3.8a3.6 3.6 0 0 0 4.9 1.5c.6 1.1 1.8 1.7 3 1.7s2.4-.6 3-1.7a3.6 3.6 0 0 0 4.4-4.3c1-.6 1.7-1.8 1.7-3s-.7-2.4-1.7-3c.3-1.5-.2-3-1.5-3.8a3.6 3.6 0 0 0-4.9-1.5A3.6 3.6 0 0 0 12 3z"/>
                </svg>
              </div>
              <span className={styles.mobileLogoTitle}>SafeVote</span>
            </div>

            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>
                {step === 1 ? "Organization Login" : "Enter Organization Code"}
              </h1>
              <p className={styles.formSubtitle}>
                {step === 1 
                  ? "Sign in with your email and password"
                  : "Two-factor authentication: Enter your organization code"}
              </p>
            </div>

            <div className={styles.formCard}>
              <form onSubmit={step === 1 ? handleStep1 : handleStep2}>
                {step === 1 ? (
                  <>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Email Address</label>
                      <input 
                        type="email"
                        className={styles.fieldInput}
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="admin@organization.com"
                        required
                        autoFocus
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Password</label>
                      <div className={styles.passwordInput}>
                        <input 
                          type={showPassword ? "text" : "password"}
                          className={styles.fieldInput}
                          value={password} 
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                        />
                        <button
                          type="button"
                          className={styles.passwordToggle}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Organization Code</label>
                      <input 
                        type="text"
                        className={styles.fieldInput}
                        value={orgCode} 
                        onChange={e => setOrgCode(e.target.value.toUpperCase())} 
                        placeholder="SV-XXXX"
                        required
                        autoFocus
                        style={{ textAlign: "center", fontFamily: "monospace", letterSpacing: "0.1em", fontSize: "1.1rem" }}
                      />
                      <p className={styles.fieldHint}>
                        Enter the organization code provided by SafeVote after approval
                      </p>
                    </div>

                    <button
                      type="button"
                      className={styles.backStepBtn}
                      onClick={() => {
                        setStep(1);
                        setOrgCode("");
                        setMessage("");
                      }}
                    >
                      ← Back to Email/Password
                    </button>
                  </>
                )}

                <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      {step === 1 ? "Signing in..." : "Verifying..."}
                    </>
                  ) : (
                    step === 1 ? "Continue" : "Complete Login"
                  )}
                </button>

                {message && (
                  <div className={`${styles.message} ${messageType === 'error' ? styles.messageError : styles.messageSuccess}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {messageType === 'error' ? (
                        <>
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </>
                      ) : (
                        <>
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </>
                      )}
                    </svg>
                    {message}
                  </div>
                )}
              </form>
            </div>

            <div className={styles.formFooter}>
              <p className={styles.formFooterText}>
                Don't have an account?{' '}
                <Link href="/register" className={styles.formFooterLink}>Register your organization</Link>
              </p>
            </div>

            <div className={styles.securityBadge}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              256-bit SSL Encrypted Connection
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

