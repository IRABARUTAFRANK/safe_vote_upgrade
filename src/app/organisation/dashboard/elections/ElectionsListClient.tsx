"use client";

import React from "react";
import Link from "next/link";
import styles from "./elections.module.css";

interface Election {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
  candidateMethod: string;
  numberOfVoters: number;
  _count: {
    positions: number;
    ballots: number;
    voterCodes: number;
  };
}

interface ElectionsListClientProps {
  session: {
    memberId: string;
    orgId: string;
    email: string;
    fullName: string;
    orgName: string;
    orgStatus: string;
  };
  elections: Election[];
}

export default function ElectionsListClient({ session, elections }: ElectionsListClientProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "#64748b";
      case "ACTIVE": return "#10b981";
      case "CLOSED": return "#3b82f6";
      case "CANCELLED": return "#ef4444";
      default: return "#64748b";
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.pageTitle}>Manage Elections</h1>
            <p className={styles.pageSubtitle}>View and manage all your elections</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/organisation/dashboard" className={styles.backBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Dashboard
            </Link>
            <Link href="/organisation/dashboard/elections/new" className={styles.createBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Election
            </Link>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {elections.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            <h2>No Elections Yet</h2>
            <p>Create your first election to get started with voting.</p>
            <Link href="/organisation/dashboard/elections/new" className={styles.createBtn}>
              Create Your First Election
            </Link>
          </div>
        ) : (
          <div className={styles.electionsGrid}>
            {elections.map((election) => {
              const statusColor = getStatusColor(election.status);
              return (
                <Link 
                  key={election.id} 
                  href={`/organisation/dashboard/elections/${election.id}`}
                  className={styles.electionCard}
                >
                  <div className={styles.cardHeader}>
                    <span 
                      className={styles.statusBadge}
                      style={{ 
                        backgroundColor: `${statusColor}20`, 
                        color: statusColor,
                        borderColor: `${statusColor}40`,
                      }}
                    >
                      {election.status}
                    </span>
                    <span className={styles.methodBadge}>
                      {election.candidateMethod === "MANUAL" ? "Manual" : "Applications"}
                    </span>
                  </div>
                  
                  <h3 className={styles.electionTitle}>{election.title}</h3>
                  {election.description && (
                    <p className={styles.electionDesc}>{election.description}</p>
                  )}
                  
                  <div className={styles.electionDates}>
                    <span>{formatDate(election.startDate)} - {formatDate(election.endDate)}</span>
                  </div>
                  
                  <div className={styles.electionStats}>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{election._count.positions}</span>
                      <span className={styles.statLabel}>Positions</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{election._count.voterCodes}</span>
                      <span className={styles.statLabel}>Voters</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{election._count.ballots}</span>
                      <span className={styles.statLabel}>Votes</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
