'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from './actions';
import styles from '../../styles/auth.module.css';

export default function VoteLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!identifier || !password) {
      setMessage('Please provide your voter ID and password.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('memberCode', identifier);
      formData.append('password', password);

      const result = await login(formData);

      if (result.success) {
        setMessage('Login successful! Redirecting to your dashboard...');
        setMessageType('success');
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/vote/dashboard');
        }, 1000);
      } else {
        setMessage(result.error || 'Login failed. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authWrapper}>
        {/* Left Panel - Branding */}
        <div className={styles.brandPanel}>
          <div className={styles.brandContent}>
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
              Your Vote Matters. Make It Count.
            </h2>
            <p className={styles.brandDescription}>
              Sign in securely to access your ballot and participate in elections that shape your organization's future.
            </p>

            <div className={styles.brandFeatures}>
              <div className={styles.brandFeature}>
                <div className={styles.brandFeatureIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <span>Your vote is completely anonymous</span>
              </div>
              <div className={styles.brandFeature}>
                <div className={styles.brandFeatureIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <span>Encrypted & tamper-proof</span>
              </div>
              <div className={styles.brandFeature}>
                <div className={styles.brandFeatureIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                </div>
                <span>Vote from any device</span>
              </div>
            </div>
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
              <h1 className={styles.formTitle}>Voter Login</h1>
              <p className={styles.formSubtitle}>
                Sign in with your voter credentials to access your ballot and cast your vote.
              </p>
            </div>

            <div className={styles.formCard}>
              <form onSubmit={handleSubmit}>
                <div className={styles.fieldGroup}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Email or Voter ID</label>
                    <input 
                      type="text"
                      className={styles.fieldInput}
                      value={identifier} 
                      onChange={e => setIdentifier(e.target.value)} 
                      placeholder="you@example.org or VOTER-XXXX"
                    />
                    <p className={styles.helpText}>Enter the email or voter ID provided by your organization.</p>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Password / PIN</label>
                    <div className={styles.passwordWrapper}>
                      <input 
                        type={showPassword ? "text" : "password"}
                        className={styles.fieldInput}
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password or PIN"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button 
                        type="button" 
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
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
                </div>

                <div className={styles.checkboxRow}>
                  <label className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      className={styles.checkbox}
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    Remember me on this device
                  </label>
                  <Link href="/vote/forgot-password" className={styles.forgotLink}>
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className={styles.spinner}></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In to Vote
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
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

                <div className={styles.divider}>or</div>

                <div className={styles.formFooter} style={{ marginTop: 0, textAlign: 'left' }}>
                  <p className={styles.formFooterText}>
                    Are you an organization admin?{' '}
                    <Link href="/organisation/login" className={styles.formFooterLink}>Organization Login</Link>
                  </p>
                </div>
              </form>
            </div>

            <div className={styles.formFooter}>
              <p className={styles.formFooterText}>
                Want to run elections for your organization?{' '}
                <Link href="/register" className={styles.formFooterLink}>Register here</Link>
              </p>
            </div>

            <div className={styles.securityBadge}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Your vote is private & anonymous
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

