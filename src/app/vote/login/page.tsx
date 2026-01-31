'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, validateCode, createAccount } from './actions';
import styles from '../../styles/auth.module.css';

type Step = 'code' | 'login' | 'register';

export default function VoteLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('code');
  const [voterCode, setVoterCode] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [isLoading, setIsLoading] = useState(false);

  function clearMessage() {
    setMessage('');
  }

  // Step 1: Validate voter code
  async function handleContinueWithCode(e: React.FormEvent) {
    e.preventDefault();
    clearMessage();
    const code = (voterCode || '').trim();
    if (!code) {
      setMessage('Please enter your voter code.');
      setMessageType('error');
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('memberCode', code);
      const result = await validateCode(formData);
      if (result.success && result.memberCode) {
        setVoterCode(result.memberCode); // keep normalized code
        if (result.hasAccount) {
          setStep('login');
        } else {
          setStep('register');
        }
      } else {
        setMessage(result.error || 'Invalid voter code.');
        setMessageType('error');
      }
    } catch {
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2a: Login with password
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    clearMessage();
    if (!password) {
      setMessage('Please enter your password.');
      setMessageType('error');
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('memberCode', voterCode);
      formData.append('password', password);
      const result = await login(formData);
      if (result.success) {
        setMessage('Login successful! Redirecting...');
        setMessageType('success');
        setTimeout(() => router.push('/vote/dashboard'), 800);
      } else {
        setMessage(result.error || 'Login failed.');
        setMessageType('error');
        if (result.needsRegistration) {
          setStep('register');
          setMessage('No account for this code. Please create your account below.');
        }
      }
    } catch {
      setMessage('An error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2b: Register (create account)
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    clearMessage();
    if (!fullName.trim()) {
      setMessage('Please enter your full name.');
      setMessageType('error');
      return;
    }
    if (!registerPassword) {
      setMessage('Please enter a password.');
      setMessageType('error');
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('memberCode', voterCode);
      formData.append('fullName', fullName.trim());
      formData.append('email', email.trim());
      formData.append('password', registerPassword);
      const result = await createAccount(formData);
      if (result.success) {
        setMessage('Account created! Signing you in...');
        setMessageType('success');
        const loginFormData = new FormData();
        loginFormData.append('memberCode', voterCode);
        loginFormData.append('password', registerPassword);
        const loginResult = await login(loginFormData);
        if (loginResult.success) {
          router.push('/vote/dashboard');
        } else {
          setMessage(loginResult.error || 'Account created. Please sign in with your new password below.');
          setMessageType('error');
          setStep('login');
          setPassword(registerPassword);
        }
      } else {
        setMessage(result.error || 'Registration failed.');
        setMessageType('error');
      }
    } catch {
      setMessage('An error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }

  function handleUseDifferentCode(e?: React.MouseEvent) {
    e?.preventDefault();
    setStep('code');
    setVoterCode('');
    setPassword('');
    setFullName('');
    setEmail('');
    setRegisterPassword('');
    setMessage('');
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authWrapper}>
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
            <h2 className={styles.brandHeadline}>Your Vote Matters.</h2>
            <p className={styles.brandDescription}>
              Sign in with the voter code from your organisation to access your ballot and elections.
            </p>
            <div className={styles.brandFeatures}>
              <div className={styles.brandFeature}>
                <div className={styles.brandFeatureIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <span>Use the code your organisation gave you</span>
              </div>
              <div className={styles.brandFeature}>
                <div className={styles.brandFeatureIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <span>First time? Create your account with that code</span>
              </div>
            </div>
          </div>
        </div>

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

            {/* Step 1: Enter voter code */}
            {step === 'code' && (
              <>
                <div className={styles.formHeader}>
                  <h1 className={styles.formTitle}>Voter sign in</h1>
                  <p className={styles.formSubtitle}>
                    Enter the voter code provided by your organisation (e.g. 5-character code).
                  </p>
                </div>
                <div className={styles.formCard}>
                  <form onSubmit={handleContinueWithCode}>
                    <div className={styles.fieldGroup}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Voter code</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={voterCode}
                          onChange={e => setVoterCode(e.target.value)}
                          placeholder="e.g. AB123"
                          autoComplete="off"
                          autoFocus
                        />
                        <p className={styles.helpText}>Spaces are ignored. Use the code from your election invite.</p>
                      </div>
                    </div>
                    {message && (
                      <div className={`${styles.message} ${messageType === 'error' ? styles.messageError : styles.messageSuccess}`}>
                        {message}
                      </div>
                    )}
                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className={styles.spinner}></div>
                          Checking...
                        </>
                      ) : (
                        <>
                          Continue
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* Step 2a: Enter password (existing account) */}
            {step === 'login' && (
              <>
                <div className={styles.formHeader}>
                  <h1 className={styles.formTitle}>Enter your password</h1>
                  <p className={styles.formSubtitle}>
                    Voter code: <strong style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>{voterCode}</strong>
                  </p>
                </div>
                <div className={styles.formCard}>
                  <form onSubmit={handleLogin}>
                    <div className={styles.fieldGroup}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Password</label>
                        <div className={styles.passwordWrapper}>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className={styles.fieldInput}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            style={{ paddingRight: '2.5rem' }}
                            autoFocus
                          />
                          <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                            {showPassword ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    {message && (
                      <div className={`${styles.message} ${messageType === 'error' ? styles.messageError : styles.messageSuccess}`}>
                        {message}
                      </div>
                    )}
                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                      {isLoading ? <><div className={styles.spinner}></div> Signing in...</> : <>Sign in</>}
                    </button>
                    <button type="button" onClick={handleUseDifferentCode} className={styles.formFooterLink} style={{ marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>
                      Use a different voter code
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* Step 2b: Create account (new voter) */}
            {step === 'register' && (
              <>
                <div className={styles.formHeader}>
                  <h1 className={styles.formTitle}>Create your account</h1>
                  <p className={styles.formSubtitle}>
                    Voter code: <strong style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>{voterCode}</strong> — set your name and password.
                  </p>
                </div>
                <div className={styles.formCard}>
                  <form onSubmit={handleRegister}>
                    <div className={styles.fieldGroup}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Full name *</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="Your full name"
                          autoComplete="name"
                          autoFocus
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Email (optional)</label>
                        <input
                          type="email"
                          className={styles.fieldInput}
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          autoComplete="email"
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Password *</label>
                        <div className={styles.passwordWrapper}>
                          <input
                            type={showRegisterPassword ? 'text' : 'password'}
                            className={styles.fieldInput}
                            value={registerPassword}
                            onChange={e => setRegisterPassword(e.target.value)}
                            placeholder="At least 8 chars, with upper, lower, number, special"
                            style={{ paddingRight: '2.5rem' }}
                          />
                          <button type="button" className={styles.passwordToggle} onClick={() => setShowRegisterPassword(!showRegisterPassword)} tabIndex={-1}>
                            {showRegisterPassword ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                          </button>
                        </div>
                        <p className={styles.helpText}>Min 8 characters, with uppercase, lowercase, number and special character.</p>
                      </div>
                    </div>
                    {message && (
                      <div className={`${styles.message} ${messageType === 'error' ? styles.messageError : styles.messageSuccess}`}>
                        {message}
                      </div>
                    )}
                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                      {isLoading ? <><div className={styles.spinner}></div> Creating account...</> : <>Create account & sign in</>}
                    </button>
                    <button type="button" onClick={handleUseDifferentCode} className={styles.formFooterLink} style={{ marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>
                      Use a different voter code
                    </button>
                  </form>
                </div>
              </>
            )}

            <div className={styles.formFooter}>
              <p className={styles.formFooterText}>
                Organisation admin? <Link href="/organisation/login" className={styles.formFooterLink}>Organisation login</Link>
              </p>
              <p className={styles.formFooterText}>
                Want to run elections? <Link href="/register" className={styles.formFooterLink}>Register your organisation</Link>
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
