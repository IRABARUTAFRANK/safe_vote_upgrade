"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../styles/auth.module.css';
import { registerOrganisation } from '@/app/register/actions'; 

export default function RegisterPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('NGO');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    
    // Validation
    if (!orgName.trim() || !adminName.trim() || !email.trim()) {
      setMessage('Organization name, admin full name and contact email are required.');
      setMessageType('error');
      return;
    }

    if (password !== confirm) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);

    // Create FormData object to send to the Server Action
    const formData = new FormData();
    formData.append('org_name', orgName);
    formData.append('org_type', orgType);
    formData.append('full_name', adminName);
    formData.append('contact_email', email);
    formData.append('password', password);

    const result = await registerOrganisation(formData);

    if (result.success) {
      setMessageType('success');
      setMessage('Registration successful! Your organization is pending approval. Redirecting...');
      // Redirect to pending page since new orgs start as PENDING
      setTimeout(() => router.push('/organisation/pending'), 2000);
    } else {
      setMessageType('error');
      setMessage(result.error || 'Registration failed.');
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
              Start Running Secure Elections Today
            </h2>
            <p className={styles.brandDescription}>
              Join hundreds of organizations worldwide who trust SafeVote for their voting needs. Set up your first election in minutes.
            </p>

            <div className={styles.brandFeatures}>
              <div className={styles.brandFeature}>
                <div className={styles.brandFeatureIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <span>End-to-end encrypted voting</span>
              </div>
              <div className={styles.brandFeature}>
                <div className={styles.brandFeatureIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <span>Instant certified results</span>
              </div>
              <div className={styles.brandFeature}>
                <div className={styles.brandFeatureIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <span>Unlimited voters per election</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Modified Form */}
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
              <h1 className={styles.formTitle}>Register Your Organization</h1>
              <p className={styles.formSubtitle}>Create an account to start running secure elections.</p>
            </div>

            <div className={styles.formCard}>
              <form onSubmit={handleSubmit}>
                <div className={styles.fieldGroup}>
                  {/* Organization Name */}
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Organization Name</label>
                    <input 
                      type="text"
                      className={styles.fieldInput}
                      value={orgName} 
                      onChange={e => setOrgName(e.target.value)} 
                      placeholder="University of Science"
                      required
                    />
                  </div>

                  {/* Organization Type - New field from your DB diagram */}
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Organization Type</label>
                    <select 
                      className={styles.fieldInput} 
                      value={orgType}
                      onChange={e => setOrgType(e.target.value)}
                    >
                      <option value="SCHOOL">Educational Institution</option>
                      <option value="NGO">Non-Profit / NGO</option>
                      <option value="CORP">Corporation</option>
                      <option value="COMMUNITY">Community Group</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {/* Admin Name */}
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Admin Full Name</label>
                    <input 
                      type="text"
                      className={styles.fieldInput}
                      value={adminName} 
                      onChange={e => setAdminName(e.target.value)} 
                      placeholder="John Smith"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Admin Email (contact_email)</label>
                    <input 
                      type="email"
                      className={styles.fieldInput}
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder="admin@org.com"
                      required
                    />
                  </div>

                  {/* Password Row */}
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Password</label>
                      <input 
                        type="password"
                        className={styles.fieldInput}
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Confirm</label>
                      <input 
                        type="password"
                        className={styles.fieldInput}
                        value={confirm} 
                        onChange={e => setConfirm(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Create Organization Account'}
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

                <p className={styles.termsText}>
                  By registering, you agree to our{' '}
                  <Link href="/terms" className={styles.termsLink}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className={styles.termsLink}>Privacy Policy</Link>
                </p>
              </form>
            </div>

            <div className={styles.formFooter}>
              <p className={styles.formFooterText}>
                Already have an account?{' '}
                <Link href="/organisation/login" className={styles.formFooterLink}>Sign in here</Link>
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