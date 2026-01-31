"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../dashboard.module.css";

interface Member {
  id: string;
  fullName: string;
  email: string | null;
  memberCode: string;
  role: string;
  _count: {
    ballots: number;
  };
}

interface VoterCode {
  id: string;
  code: string;
  status: string;
  usedAt: Date | null;
  createdAt: Date;
  election: {
    id: string;
    title: string;
    status: string;
  };
}

interface Election {
  id: string;
  title: string;
  status: string;
}

interface VotersClientProps {
  session: {
    memberId: string;
    orgId: string;
    email: string;
    fullName: string;
    orgName: string;
    orgStatus: string;
  };
  data: {
    members: Member[];
    voterCodes: VoterCode[];
    elections: Election[];
    stats: {
      totalMembers: number;
      totalVoterCodes: number;
      unusedCodes: number;
      usedCodes: number;
    };
  };
}

export default function VotersClient({ session, data }: VotersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"members" | "codes">("members");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterElection, setFilterElection] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 30000);
    
    return () => clearInterval(interval);
  }, [router]);

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  const filteredMembers = data.members.filter((member) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      member.fullName.toLowerCase().includes(search) ||
      member.memberCode.toLowerCase().includes(search) ||
      (member.email && member.email.toLowerCase().includes(search))
    );
  });

  const filteredCodes = data.voterCodes.filter((code) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!code.code.toLowerCase().includes(search)) return false;
    }
    if (filterElection !== "all" && code.election.id !== filterElection) return false;
    if (filterStatus !== "all" && code.status !== filterStatus) return false;
    return true;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UNUSED":
        return "#10b981";
      case "USED":
        return "#3b82f6";
      case "REVOKED":
        return "#ef4444";
      default:
        return "#64748b";
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.pageTitle}>Manage Voters</h1>
            <p className={styles.pageSubtitle}>{session.orgName}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button 
              onClick={handleRefresh} 
              disabled={isPending}
              title="Refresh data"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #e2e8f0)",
                backgroundColor: "transparent",
                color: "inherit",
                cursor: isPending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                opacity: isPending ? 0.6 : 1,
              }}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ animation: isPending ? "spin 1s linear infinite" : "none" }}
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {isPending ? "Refreshing..." : "Refresh"}
            </button>
            <Link href="/organisation/dashboard" className={styles.logoutBtn}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
      </header>

      <div className={styles.content}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{data.stats.totalMembers}</span>
              <span className={styles.statLabel}>Registered Voters</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{data.stats.totalVoterCodes}</span>
              <span className={styles.statLabel}>Total Voter Codes</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{data.stats.unusedCodes}</span>
              <span className={styles.statLabel}>Unused Codes</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{data.stats.usedCodes}</span>
              <span className={styles.statLabel}>Used Codes</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => setActiveTab("members")}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeTab === "members" ? "#3b82f6" : "var(--card-bg)",
                color: activeTab === "members" ? "white" : "inherit",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Registered Voters ({data.members.length})
            </button>
            <button
              onClick={() => setActiveTab("codes")}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeTab === "codes" ? "#3b82f6" : "var(--card-bg)",
                color: activeTab === "codes" ? "white" : "inherit",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Voter Codes ({data.voterCodes.length})
            </button>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder={activeTab === "members" ? "Search by name, email, or code..." : "Search by code..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: "1",
                minWidth: "200px",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #e2e8f0)",
                backgroundColor: "var(--input-bg, white)",
                color: "inherit",
              }}
            />
            {activeTab === "codes" && (
              <>
                <select
                  value={filterElection}
                  onChange={(e) => setFilterElection(e.target.value)}
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    backgroundColor: "var(--input-bg, white)",
                    color: "inherit",
                  }}
                >
                  <option value="all">All Elections</option>
                  {data.elections.map((election) => (
                    <option key={election.id} value={election.id}>
                      {election.title}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    backgroundColor: "var(--input-bg, white)",
                    color: "inherit",
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="UNUSED">Unused</option>
                  <option value="USED">Used</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </>
            )}
          </div>

          {activeTab === "members" && (
            <>
              {filteredMembers.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  <p>No registered voters found.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
                        <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Name</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Email</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Member Code</th>
                        <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Votes Cast</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.id} style={{ borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
                          <td style={{ padding: "0.75rem" }}>{member.fullName}</td>
                          <td style={{ padding: "0.75rem", color: "#64748b" }}>{member.email || "—"}</td>
                          <td style={{ padding: "0.75rem", fontFamily: "monospace" }}>{member.memberCode}</td>
                          <td style={{ padding: "0.75rem", textAlign: "center" }}>{member._count.ballots}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === "codes" && (
            <>
              {filteredCodes.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <p>No voter codes found.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
                        <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Code</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Election</th>
                        <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Status</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Created</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Used At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCodes.map((code) => (
                        <tr key={code.id} style={{ borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
                          <td style={{ padding: "0.75rem", fontFamily: "monospace", fontWeight: "500" }}>
                            {code.code}
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            <Link
                              href={`/organisation/dashboard/elections/${code.election.id}`}
                              style={{ color: "#3b82f6", textDecoration: "none" }}
                            >
                              {code.election.title}
                            </Link>
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "center" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: "500",
                                backgroundColor: `${getStatusColor(code.status)}20`,
                                color: getStatusColor(code.status),
                                border: `1px solid ${getStatusColor(code.status)}40`,
                              }}
                            >
                              {code.status}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem", color: "#64748b" }}>{formatDate(code.createdAt)}</td>
                          <td style={{ padding: "0.75rem", color: "#64748b" }}>{formatDate(code.usedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
