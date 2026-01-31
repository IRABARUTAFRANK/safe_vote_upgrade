'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { validateCode, login, createAccount } from './actions';
import styles from '../../styles/auth.module.css';

type Step = 'code' | 'login' | 'register';

interface CodeInfo {
  memberCode: string;
  hasAccount: boolean;
  fullName?: string;
  email?: string | null;
  orgName?: string;
  electionTitle?: string;
}

export default function VoteLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('code');
  const [codeInfo, setCodeInfo] = useState<CodeInfo | null>(null);
  
  // Step 1: Code entry
  const [voterCode, setVoterCode] = useState('');
  
  // Step 2a: Login
  const [password, setPassword] = useState('');
  
  // Step 2b: Registration
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('error');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Validate code
  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!voterCode.trim()) {
      setMessage('Please enter your voter code.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('memberCode', voterCode);

      const result = await validateCode(formData);

      if (result.success) {
        setCodeInfo({
          memberCode: result.memberCode!,
          hasAccount: result.hasAccount,
          fullName: result.fullName,
          email: result.email,
          orgName: result.orgName,
          electionTitle: result.electionTitle,
        });

        if (result.hasAccount) {
          setStep('login');
          setMessage(`Welcome back, ${result.fullName || 'Voter'}! Please enter your password.`);
          setMessageType('info');
        } else {
          setStep('register');
          setMessage(`Valid code for ${result.electionTitle || 'election'}. Create your account to continue.`);
          setMessageType('info');
        }
      } else {
        setMessage(result.error || 'Invalid voter code.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Code validation error:', error);
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2a: Login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!password) {
      setMessage('Please enter your password.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('memberCode', codeInfo?.memberCode || voterCode);
      formData.append('password', password);

      const result = await login(formData);

      if (result.success) {
        setMessage('Login successful! Redirecting to your dashboard...');
        setMessageType('success');
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

  // Step 2b: Register
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!fullName.trim()) {
      setMessage('Please enter your full name.');
      setMessageType('error');
      return;
    }

    if (!newPassword) {
      setMessage('Please enter a password.');
      setMessageType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters long.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('memberCode', codeInfo?.memberCode || voterCode);
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('password', newPassword);
      formData.append('confirmPassword', confirmPassword);

      const result = await createAccount(formData);

      if (result.success) {
        setMessage('Account created successfully! Redirecting to your dashboard...');
        setMessageType('success');
        setTimeout(() => {
          router.push('/vote/dashboard');
        }, 1000);
      } else {
        setMessage(result.error || 'Failed to create account. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }

  // Go back to code entry
  function handleBack() {
    setStep('code');
    setCodeInfo(null);
    setPassword('');
    setFullName('');
    setEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('');
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
              Sign in securely to access your ballot and participate in elections that shape your organization&apos;s future.
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
                <span>Encrypted &amp; tamper-proof</span>
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

            {/* Step Indicator */}
            <div className={styles.stepIndicator} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                flex: 1, 
                height: '4px', 
                borderRadius: '2px',
                backgroundColor: 'var(--color-primary, #3b82f6)'
              }} />
              <div style={{ 
                flex: 1, 
                height: '4px', 
                borderRadius: '2px',
                backgroundColor: step !== 'code' ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'
              }} />
            </div>

            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>
                {step === 'code' && 'Voter Login'}
                {step === 'login' && 'Enter Your Password'}
                {step === 'register' && 'Create Your Account'}
              </h1>
              <p className={styles.formSubtitle}>
                {step === 'code' && 'Enter your voter code to continue.'}
                {step === 'login' && `Logging in as ${codeInfo?.fullName || 'Voter'}`}
                {step === 'register' && `Setting up your account for ${codeInfo?.electionTitle || 'the election'}`}
              </p>
            </div>

            <div className={styles.formCard}>
              {/* Step 1: Code Entry */}
              {step === 'code' && (
                <form onSubmit={handleCodeSubmit}>
                  <div className={styles.fieldGroup}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Voter Code</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={voterCode}
                        onChange={e => setVoterCode(e.target.value.toUpperCase())}
                        placeholder="e.g., AB123"
                        autoFocus
                        autoComplete="off"
                      />
                      <p className={styles.helpText}>
                        Enter the 5-character voter code provided by your organization (e.g., AB123).
                      </p>
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className={styles.spinner}></div>
                        Verifying...
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

                  {message && (
                    <div className={`${styles.message} ${
                      messageType === 'error' ? styles.messageError : 
                      messageType === 'success' ? styles.messageSuccess : 
                      styles.messageInfo
                    }`}>
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
              )}

              {/* Step 2a: Login */}
              {step === 'login' && (
                <form onSubmit={handleLogin}>
                  <div className={styles.fieldGroup}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Voter Code</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={codeInfo?.memberCode || voterCode}
                        disabled
                        style={{ backgroundColor: 'var(--color-bg-muted, #f3f4f6)' }}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Password</label>
                      <div className={styles.passwordWrapper}>
                        <input 
                          type={showPassword ? "text" : "password"}
                          className={styles.fieldInput}
                          value={password} 
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          autoFocus
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
                    <div className={`${styles.message} ${
                      messageType === 'error' ? styles.messageError : 
                      messageType === 'success' ? styles.messageSuccess : 
                      styles.messageInfo
                    }`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {messageType === 'error' ? (
                          <>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </>
                        ) : messageType === 'info' ? (
                          <>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
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

                  <button 
                    type="button" 
                    className={styles.backLink} 
                    onClick={handleBack}
                    style={{ marginTop: '1rem', display: 'inline-flex' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"/>
                      <polyline points="12 19 5 12 12 5"/>
                    </svg>
                    Use a different code
                  </button>
                </form>
              )}

              {/* Step 2b: Register */}
              {step === 'register' && (
                <form onSubmit={handleRegister}>
                  <div className={styles.fieldGroup}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Voter Code</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={codeInfo?.memberCode || voterCode}
                        disabled
                        style={{ backgroundColor: 'var(--color-bg-muted, #f3f4f6)' }}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Full Name *</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Enter your full name"
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
                        placeholder="your.email@example.com"
                      />
                      <p className={styles.helpText}>
                        Optional: Used for account recovery if needed.
                      </p>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Password *</label>
                      <div className={styles.passwordWrapper}>
                        <input 
                          type={showPassword ? "text" : "password"}
                          className={styles.fieldInput}
                          value={newPassword} 
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Create a password"
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
                      <p className={styles.helpText}>
                        Min 8 characters with uppercase, lowercase, number, and special character.
                      </p>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Confirm Password *</label>
                      <input 
                        type={showPassword ? "text" : "password"}
                        className={styles.fieldInput}
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className={styles.spinner}></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account &amp; Sign In
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                          <polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </>
                    )}
                  </button>

                  {message && (
                    <div className={`${styles.message} ${
                      messageType === 'error' ? styles.messageError : 
                      messageType === 'success' ? styles.messageSuccess : 
                      styles.messageInfo
                    }`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {messageType === 'error' ? (
                          <>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </>
                        ) : messageType === 'info' ? (
                          <>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
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

                  <button 
                    type="button" 
                    className={styles.backLink} 
                    onClick={handleBack}
                    style={{ marginTop: '1rem', display: 'inline-flex' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"/>
                      <polyline points="12 19 5 12 12 5"/>
                    </svg>
                    Use a different code
                  </button>
                </form>
              )}

              <div className={styles.divider}>or</div>

              <div className={styles.formFooter} style={{ marginTop: 0, textAlign: 'left' }}>
                <p className={styles.formFooterText}>
                  Are you an organization admin?{' '}
                  <Link href="/organisation/login" className={styles.formFooterLink}>Organization Login</Link>
                </p>
              </div>
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
              Your vote is private &amp; anonymous
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
