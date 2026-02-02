'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, validateCode, createAccount } from './actions';

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
        setVoterCode(result.memberCode);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 to-secondary/20 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">SafeVote</span>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4">Your Vote Matters.</h2>
          <p className="text-lg text-white/70 mb-8 max-w-md">
            Sign in with the voter code from your organisation to access your ballot and elections.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <span>Use the code your organisation gave you</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <span>First time? Create your account with that code</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span>Your vote is private & anonymous</span>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

          {/* Step 1: Enter voter code */}
          {step === 'code' && (
            <div className="card bg-base-100 shadow-2xl">
              <div className="card-body">
                <h1 className="text-2xl font-bold text-base-content mb-2">Voter Sign In</h1>
                <p className="text-base-content/60 mb-6">
                  Enter the voter code provided by your organisation.
                </p>
                
                <form onSubmit={handleContinueWithCode}>
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Voter Code</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-lg text-center tracking-widest font-mono uppercase"
                      value={voterCode}
                      onChange={e => setVoterCode(e.target.value)}
                      placeholder="e.g. AB123"
                      autoComplete="off"
                      autoFocus
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        Spaces are ignored. Use the code from your election invite.
                      </span>
                    </label>
                  </div>

                  {message && (
                    <div className={`alert ${messageType === 'error' ? 'alert-error' : 'alert-success'} mb-4`}>
                      <span>{message}</span>
                    </div>
                  )}

                  <button type="submit" className={`btn btn-primary btn-lg w-full ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                    {isLoading ? 'Checking...' : (
                      <>
                        Continue
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Step 2a: Login with password */}
          {step === 'login' && (
            <div className="card bg-base-100 shadow-2xl">
              <div className="card-body">
                <h1 className="text-2xl font-bold text-base-content mb-2">Enter Your Password</h1>
                <p className="text-base-content/60 mb-1">Voter code:</p>
                <code className="bg-base-200 px-3 py-1 rounded-lg text-lg font-mono tracking-widest mb-6">{voterCode}</code>
                
                <form onSubmit={handleLogin}>
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
                        autoFocus
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
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>

                  <button 
                    type="button" 
                    onClick={handleUseDifferentCode}
                    className="btn btn-ghost btn-sm w-full mt-4"
                  >
                    Use a different voter code
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Step 2b: Create account */}
          {step === 'register' && (
            <div className="card bg-base-100 shadow-2xl">
              <div className="card-body">
                <h1 className="text-2xl font-bold text-base-content mb-2">Create Your Account</h1>
                <p className="text-base-content/60 mb-1">Voter code:</p>
                <code className="bg-base-200 px-3 py-1 rounded-lg text-lg font-mono tracking-widest mb-6">{voterCode}</code>
                
                <form onSubmit={handleRegister}>
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Full Name *</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                      autoFocus
                    />
                  </div>

                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Email (optional)</span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>

                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Password *</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        className="input input-bordered w-full pr-12"
                        value={registerPassword}
                        onChange={e => setRegisterPassword(e.target.value)}
                        placeholder="Create a strong password"
                      />
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-sm absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      >
                        {showRegisterPassword ? (
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
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        Min 8 characters with uppercase, lowercase, number & special character.
                      </span>
                    </label>
                  </div>

                  {message && (
                    <div className={`alert ${messageType === 'error' ? 'alert-error' : 'alert-success'} mb-4`}>
                      <span>{message}</span>
                    </div>
                  )}

                  <button type="submit" className={`btn btn-primary btn-lg w-full ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account & Sign In'}
                  </button>

                  <button 
                    type="button" 
                    onClick={handleUseDifferentCode}
                    className="btn btn-ghost btn-sm w-full mt-4"
                  >
                    Use a different voter code
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-base-content/60 text-sm">
              Organisation admin? <Link href="/organisation/login" className="link link-primary">Organisation login</Link>
            </p>
            <p className="text-base-content/60 text-sm">
              Want to run elections? <Link href="/register" className="link link-primary">Register your organisation</Link>
            </p>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-base-content/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Your vote is private & anonymous
          </div>
        </div>
      </div>
    </div>
  );
}
