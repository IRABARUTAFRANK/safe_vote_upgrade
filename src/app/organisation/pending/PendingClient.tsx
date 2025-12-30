"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./pending.module.css";

interface PendingClientProps {
  session: {
    memberId: string;
    orgId: string;
    email: string;
    fullName: string;
    orgName: string;
    orgStatus: string;
  } | null;
  organisation: {
    id: string;
    name: string;
    status: string;
    orgCode: string | null;
  } | null;
}

export default function PendingClient({ session, organisation }: PendingClientProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  // If organization is approved and user is logged in, redirect to dashboard
  useEffect(() => {
    if (session && organisation && organisation.status === "APPROVED") {
      router.push("/organisation/dashboard");
    }
  }, [session, organisation, router]);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    router.refresh();
    setTimeout(() => setIsChecking(false), 1000);
  };

  const status = organisation?.status || "PENDING";

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4"/>
            <path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 4.6 9c-1 .6-1.7 1.8-1.7 3s.7 2.4 1.7 3c-.3 1.5.2 3 1.5 3.8a3.6 3.6 0 0 0 4.9 1.5c.6 1.1 1.8 1.7 3 1.7s2.4-.6 3-1.7a3.6 3.6 0 0 0 4.4-4.3c1-.6 1.7-1.8 1.7-3s-.7-2.4-1.7-3c.3-1.5-.2-3-1.5-3.8a3.6 3.6 0 0 0-4.9-1.5A3.6 3.6 0 0 0 12 3z"/>
          </svg>
          <h1 className={styles.brandTitle}>SafeVote</h1>
        </div>

        <div className={styles.card}>
          {status === "PENDING" && (
            <>
              <div className={styles.iconContainer}>
                <svg className={styles.pendingIcon} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h2 className={styles.title}>Registration Pending</h2>
              <p className={styles.subtitle}>
                Thank you for registering <strong>{organisation?.name || "your organization"}</strong> with SafeVote!
              </p>
              <p className={styles.description}>
                Your registration is currently under review. Our team will verify your organization details and approve your account within 24 hours.
              </p>
              <div className={styles.infoBox}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p>You will receive an email notification once your account is approved. You can also check back here to see your status.</p>
              </div>
            </>
          )}

          {status === "APPROVED" && (
            <>
              <div className={styles.iconContainer}>
                <svg className={styles.approvedIcon} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 className={styles.title}>Access Granted!</h2>
              <p className={styles.subtitle}>
                Congratulations! <strong>{organisation?.name}</strong> has been approved.
              </p>
              <p className={styles.description}>
                Your organization account is now active. You can now log in with your email, password, and organization code to access your dashboard.
              </p>
              {organisation?.orgCode && (
                <div className={styles.codeBox}>
                  <span className={styles.codeLabel}>Your Organization Code:</span>
                  <span className={styles.codeValue}>{organisation.orgCode}</span>
                </div>
              )}
            </>
          )}

          {status === "REJECTED" && (
            <>
              <div className={styles.iconContainer}>
                <svg className={styles.rejectedIcon} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 className={styles.title}>Registration Rejected</h2>
              <p className={styles.subtitle}>
                Unfortunately, your registration for <strong>{organisation?.name}</strong> has been rejected.
              </p>
              <p className={styles.description}>
                If you believe this is an error, please contact our support team for assistance.
              </p>
            </>
          )}

          <div className={styles.actions}>
            {status === "PENDING" && (
              <button
                className={styles.checkBtn}
                onClick={handleCheckStatus}
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Checking...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      <path d="M12 2v10l4 4"/>
                    </svg>
                    Check Status
                  </>
                )}
              </button>
            )}

            {status === "APPROVED" && (
              <Link href="/organisation/login" className={styles.loginBtn}>
                Go to Login
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
            )}

            <Link href="/" className={styles.homeLink}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

