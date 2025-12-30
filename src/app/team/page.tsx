"use client";

import React from "react";
import Link from "next/link";
import styles from "./team.module.css";

// Team members data (12 people - random names, will be edited later)
const teamMembers = [
  { id: 1, name: "Kamanzi Kevin", role: "Founder", avatar: "KK" },
  { id: 2, name: "Benaiah Rhema", role: "Developer", avatar: "BR" },
  { id: 3, name: "Irabaruta Frank", role: "Developer", avatar: "IF" },
  { id: 4, name: "Niyigaba Cedric", role: "Developer", avatar: "NC" },
  { id: 5, name: "Iradukunda Elissa", role: "Developer", avatar: "IE" },
  { id: 6, name: "Allelua Blaise Emergency", role: "UX Designer", avatar: "ABE" },
  { id: 7, name: "Ufitamahoro Baraka Regis", role: "Developer", avatar: "UBR" },
  { id: 8, name: "Izere Heritier", role: "Developer", avatar: "IH" },
  { id: 9, name: "Nshimayesu Jean d'amour", role: "UX Designer", avatar: "NJD" },
  { id: 10, name: "Ikuzwe Alain Salvador", role: "Developer", avatar: "IAS" },
  { id: 11, name: "Abijuru Igiraneza Alpha", role: "Marketing specialist", avatar: "AIA" },
  { id: 12, name: "Isingizwe Chance Noella", role: "Marketing specialist", avatar: "ICN" },
];

// Generate gradient colors for avatars
const getAvatarGradient = (index: number) => {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    "linear-gradient(135deg, #ff8a80 0%, #ea6100 100%)",
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  ];
  return gradients[index % gradients.length];
};

export default function TeamPage() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </Link>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4"/>
              <path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 4.6 9c-1 .6-1.7 1.8-1.7 3s.7 2.4 1.7 3c-.3 1.5.2 3 1.5 3.8a3.6 3.6 0 0 0 4.9 1.5c.6 1.1 1.8 1.7 3 1.7s2.4-.6 3-1.7a3.6 3.6 0 0 0 4.4-4.3c1-.6 1.7-1.8 1.7-3s-.7-2.4-1.7-3c.3-1.5-.2-3-1.5-3.8a3.6 3.6 0 0 0-4.9-1.5A3.6 3.6 0 0 0 12 3z"/>
            </svg>
            <h1 className={styles.brandTitle}>SafeVote</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h2 className={styles.heroTitle}>Meet the SafeVote Team</h2>
          <p className={styles.heroSubtitle}>
            We're a passionate group of 12 professionals dedicated to making secure, transparent voting accessible to organizations worldwide.
          </p>
        </div>
      </section>

      {/* Team Grid */}
      <section className={styles.teamSection}>
        <div className={styles.teamGrid}>
          {teamMembers.map((member, index) => (
            <div key={member.id} className={styles.memberCard}>
              <div 
                className={styles.avatar}
                style={{ background: getAvatarGradient(index) }}
              >
                <span className={styles.avatarText}>{member.avatar}</span>
              </div>
              <h3 className={styles.memberName}>{member.name}</h3>
              <p className={styles.memberRole}>{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Join Us in Building the Future of Voting</h2>
          <p className={styles.ctaText}>
            Interested in working with us? We're always looking for talented individuals who share our vision.
          </p>
          <Link href="/register" className={styles.ctaButton}>
            Get Started with SafeVote
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer Credit */}
      <footer className={styles.footer}>
        <div className={styles.footerCredit}>
          <span>Built with ❤️ by</span>
          <span className={styles.creditName}>Frank</span>
        </div>
      </footer>
    </div>
  );
}

