"use client";

import React, { useState } from 'react';
import Link from "next/link";
import styles from "./page.module.css";
import ThemeToggle from "./components/ThemeToggle";

export default function HomePage() {
  const [regMsg, setRegMsg] = useState('');
  const [loginMsg, setLoginMsg] = useState('');

  // simple register handler (placeholder)
  function handleRegister(e: React.FormEvent){
    e.preventDefault();
    setRegMsg('Registration submitted (placeholder)');
  }

  function handleLogin(e: React.FormEvent){
    e.preventDefault();
    setLoginMsg('Login submitted (placeholder)');
  }

  return (
    <div className={styles.container}>
      {/* --- NAV --- */}
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4"/>
              <path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 4.6 9c-1 .6-1.7 1.8-1.7 3s.7 2.4 1.7 3c-.3 1.5.2 3 1.5 3.8a3.6 3.6 0 0 0 4.9 1.5c.6 1.1 1.8 1.7 3 1.7s2.4-.6 3-1.7a3.6 3.6 0 0 0 4.4-4.3c1-.6 1.7-1.8 1.7-3s-.7-2.4-1.7-3c.3-1.5-.2-3-1.5-3.8a3.6 3.6 0 0 0-4.9-1.5A3.6 3.6 0 0 0 12 3z"/>
            </svg>
          </div>
          <div className={styles.title}>SafeVote</div>
        </div>

        <div className={styles.navLinks}>
          <Link href="#features">Features</Link>
          <Link href="#how-it-works">How it Works</Link>
          <Link href="#faq">FAQ</Link>
        </div>

        <div className={styles.navActions}>
          <Link href="/vote/login" className={styles.btnSecondary}>Voter Login</Link>
          <Link href="/register" className={styles.btnPrimary}>Get Started</Link>
          <div style={{marginLeft:6}}>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* --- HERO WITH VIDEO BACKGROUND --- */}
      <header className={styles.hero}>
        {/* Video Background */}
        <div className={styles.videoContainer}>
          <video
            autoPlay
            muted
            loop
            playsInline
            className={styles.heroVideo}
          >
            <source src="/videos/behind.mp4" type="video/mp4" />
          </video>
          <div className={styles.videoOverlay}></div>
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Secure, Modern & <span>Transparent</span> Voting for Organizations
            </h1>
            <p className={styles.heroLead}>
              SafeVote provides organisations with a cutting-edge voting platform that ensures complete anonymity, full auditability, and instant certified results. Built for schools, NGOs, corporations, and community groups.
            </p>

            <div className={styles.ctaRow}>
              <Link href="/register" className={styles.btnPrimary}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Register Organization
              </Link>
              <Link href="/organisation/login" className={styles.btnSecondary}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Organisation Login
              </Link>
            </div>

            <div className={styles.trustBadges}>
              <div className={styles.trustBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                End-to-End Encrypted
              </div>
              <div className={styles.trustBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Audit-Ready
              </div>
              <div className={styles.trustBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
                Mobile-First
              </div>
            </div>
          </div>

          <div className={styles.heroArt}>
            {/* Global Stats Glass Card */}
            <div className={styles.glassCard}>
              <div className={styles.glassCardHeader}>
                <div className={styles.glassCardIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <span>Global Platform Stats</span>
              </div>
              
              <div className={styles.statsRow}>
                <div className={styles.statBox}>
                  <div className={styles.statNumber}>2.5M+</div>
                  <div className={styles.statLabel}>Votes Cast</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statNumber}>850+</div>
                  <div className={styles.statLabel}>Organizations</div>
                </div>
              </div>
              
              <div className={styles.statsRow}>
                <div className={styles.statBox}>
                  <div className={styles.statNumber}>45+</div>
                  <div className={styles.statLabel}>Countries</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statNumber}>99.9%</div>
                  <div className={styles.statLabel}>Uptime</div>
                </div>
              </div>

              <div className={styles.glassCardFooter}>
                <div className={styles.liveIndicator}></div>
                <span>Platform operational worldwide</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- STATS --- */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <h4>99.9%</h4>
            <p>Uptime Guarantee</p>
          </div>
          <div className={styles.statItem}>
            <h4>256-bit</h4>
            <p>Encryption</p>
          </div>
          <div className={styles.statItem}>
            <h4>{"<"}3s</h4>
            <p>Results Delivery</p>
          </div>
          <div className={styles.statItem}>
            <h4>100%</h4>
            <p>Audit Trail</p>
          </div>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresGrid}>
          <h2>Why Choose SafeVote?</h2>
          <p>A platform engineered to be secure, transparent, and effortless for administrators and voters alike.</p>

          <div className={styles.featureCards}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3>Secret Ballot & Privacy</h3>
              <p>Voter choices are cryptographically encrypted and anonymized. Administrators cannot link ballots to identities under any circumstances.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <h3>Instant, Verifiable Results</h3>
              <p>Results are computed and certified the moment polls close, complete with tamper-evident audit trails for independent verification.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              </div>
              <h3>Mobile-Friendly Voting</h3>
              <p>Voters can participate seamlessly from any smartphone, tablet, or desktop browser — no app installation required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div>
          <h2>How It Works</h2>
          <ol>
            <li>
              <div className={styles.stepNum}>1</div>
              <div>
                <h4>Register Your Organization</h4>
                <div>Complete a brief registration form with your organisation details. Our team verifies and approves eligible organisations within 24 hours.</div>
              </div>
            </li>
            <li>
              <div className={styles.stepNum}>2</div>
              <div>
                <h4>Configure Your Election</h4>
                <div>Create positions, add candidates with photos and bios, and securely upload your voter list through our intuitive dashboard.</div>
              </div>
            </li>
            <li>
              <div className={styles.stepNum}>3</div>
              <div>
                <h4>Launch & Certify Results</h4>
                <div>Open polls with one click. When voting closes, certified, tamper-evident results are generated and available instantly.</div>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className={styles.ctaSection}>
        <h2>Ready to Modernize Your Elections?</h2>
        <p>Join hundreds of organizations already using SafeVote for secure, transparent elections.</p>
        <Link href="/register" className={styles.btnPrimary}>
          Start Free Trial
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className={styles.faq}>
        <div>
          <h3>Frequently Asked Questions</h3>
          <details>
            <summary>Is voting truly anonymous?</summary>
            <div>Yes — all votes are encrypted using industry-standard cryptography and stored in a way that makes it mathematically impossible to link votes back to voter identities.</div>
          </details>

          <details>
            <summary>Can I audit the election results?</summary>
            <div>Absolutely. Every election produces tamper-evident logs, cryptographic checksums, and detailed audit trails so authorized auditors can independently verify all results.</div>
          </details>

          <details>
            <summary>What types of organizations can use SafeVote?</summary>
            <div>SafeVote is designed for schools, universities, NGOs, corporations, unions, associations, and any community group that needs secure, professional elections.</div>
          </details>

          <details>
            <summary>How quickly can we set up an election?</summary>
            <div>Most organizations can set up their first election within minutes of account approval. Our intuitive dashboard guides you through every step.</div>
          </details>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className={styles.footer}>
        <div>
          <div>© {new Date().getFullYear()} SafeVote — Secure Voting for Organisations</div>
          <div className={styles.footerLinks}>
            <Link href="/register">Register Organization</Link>
            <Link href="/vote/login">Voter Login</Link>
            <Link href="#features">Features</Link>
            <Link href="#faq">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
