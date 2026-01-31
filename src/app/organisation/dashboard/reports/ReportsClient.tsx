"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../dashboard.module.css";

interface CandidateResult {
  id: string;
  name: string;
  votes: number;
  percentage: string;
}

interface PositionResult {
  id: string;
  name: string;
  totalVotes: number;
  maxWinners: number;
  candidates: CandidateResult[];
  winner: CandidateResult | null;
}

interface ElectionSummary {
  id: string;
  title: string;
  status: string;
  startDate: Date;
  endDate: Date;
  totalVotes: number;
  totalVoters: number;
  participationRate: string;
  positionResults: PositionResult[];
}

interface ReportsClientProps {
  session: {
    memberId: string;
    orgId: string;
    email: string;
    fullName: string;
    orgName: string;
    orgStatus: string;
  };
  data: {
    overallStats: {
      totalElections: number;
      activeElections: number;
      closedElections: number;
      draftElections: number;
      totalVoterCodes: number;
      usedCodes: number;
      unusedCodes: number;
      totalBallots: number;
      totalMembers: number;
    };
    participationRate: string;
    electionSummaries: ElectionSummary[];
    votesTimeline: Array<{ date: string; votes: number }>;
  };
}

export default function ReportsClient({ session, data }: ReportsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedElection, setSelectedElection] = useState<string>(
    data.electionSummaries.length > 0 ? data.electionSummaries[0].id : ""
  );
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

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

  const selectedElectionData = data.electionSummaries.find(
    (e) => e.id === selectedElection
  );

  const handleExport = () => {
    if (!selectedElectionData) return;

    const fileName = `${selectedElectionData.title.replace(/[^a-z0-9]/gi, "_")}_report`;

    if (exportFormat === "csv") {
      let csvContent = "Position,Candidate,Votes,Percentage\n";
      selectedElectionData.positionResults.forEach((pos) => {
        pos.candidates.forEach((cand) => {
          csvContent += `"${pos.name}","${cand.name}",${cand.votes},${cand.percentage}%\n`;
        });
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.csv`;
      link.click();
    } else {
      const jsonData = {
        election: {
          title: selectedElectionData.title,
          status: selectedElectionData.status,
          startDate: selectedElectionData.startDate,
          endDate: selectedElectionData.endDate,
          totalVotes: selectedElectionData.totalVotes,
          totalVoters: selectedElectionData.totalVoters,
          participationRate: selectedElectionData.participationRate,
        },
        results: selectedElectionData.positionResults,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: "application/json;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.json`;
      link.click();
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.pageTitle}>Reports & Analytics</h1>
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
        </div>
      </header>

      <div className={styles.content}>
        {/* Overall Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{data.overallStats.totalElections}</span>
              <span className={styles.statLabel}>Total Elections</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{data.overallStats.totalBallots}</span>
              <span className={styles.statLabel}>Total Votes Cast</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{data.overallStats.totalMembers}</span>
              <span className={styles.statLabel}>Registered Voters</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{data.participationRate}%</span>
              <span className={styles.statLabel}>Participation Rate</span>
            </div>
          </div>
        </div>

        {/* Voter Code Usage */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Voter Code Usage</h2>
          </div>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", padding: "1rem 0" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ marginBottom: "0.5rem", display: "flex", justifyContent: "space-between" }}>
                <span>Used Codes</span>
                <span style={{ fontWeight: "600" }}>{data.overallStats.usedCodes}</span>
              </div>
              <div style={{
                height: "8px",
                borderRadius: "4px",
                backgroundColor: "var(--border-color, #e2e8f0)",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${data.overallStats.totalVoterCodes > 0
                    ? (data.overallStats.usedCodes / data.overallStats.totalVoterCodes) * 100
                    : 0}%`,
                  backgroundColor: "#10b981",
                  borderRadius: "4px",
                }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ marginBottom: "0.5rem", display: "flex", justifyContent: "space-between" }}>
                <span>Unused Codes</span>
                <span style={{ fontWeight: "600" }}>{data.overallStats.unusedCodes}</span>
              </div>
              <div style={{
                height: "8px",
                borderRadius: "4px",
                backgroundColor: "var(--border-color, #e2e8f0)",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${data.overallStats.totalVoterCodes > 0
                    ? (data.overallStats.unusedCodes / data.overallStats.totalVoterCodes) * 100
                    : 0}%`,
                  backgroundColor: "#f59e0b",
                  borderRadius: "4px",
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Election Results */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Election Results</h2>
            {data.electionSummaries.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as "csv" | "json")}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    backgroundColor: "var(--input-bg, white)",
                    color: "inherit",
                  }}
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
                <button
                  onClick={handleExport}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                </button>
              </div>
            )}
          </div>

          {data.electionSummaries.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
              <p>No elections yet. Create your first election to see reports.</p>
              <Link href="/organisation/dashboard/elections/new" className={styles.createBtn}>
                Create Election
              </Link>
            </div>
          ) : (
            <>
              {/* Election Selector */}
              <div style={{ marginBottom: "1.5rem" }}>
                <select
                  value={selectedElection}
                  onChange={(e) => setSelectedElection(e.target.value)}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    backgroundColor: "var(--input-bg, white)",
                    color: "inherit",
                    fontSize: "1rem",
                  }}
                >
                  {data.electionSummaries.map((election) => (
                    <option key={election.id} value={election.id}>
                      {election.title} ({election.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedElectionData && (
                <>
                  {/* Election Overview */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                    padding: "1rem",
                    backgroundColor: "var(--card-bg-alt, #f8fafc)",
                    borderRadius: "8px",
                  }}>
                    <div>
                      <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Status</div>
                      <div style={{
                        display: "inline-block",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        backgroundColor: `${getStatusColor(selectedElectionData.status)}20`,
                        color: getStatusColor(selectedElectionData.status),
                        marginTop: "0.25rem",
                      }}>
                        {selectedElectionData.status}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Period</div>
                      <div style={{ fontWeight: "500", marginTop: "0.25rem" }}>
                        {formatDate(selectedElectionData.startDate)} - {formatDate(selectedElectionData.endDate)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Votes Cast</div>
                      <div style={{ fontWeight: "600", fontSize: "1.25rem", marginTop: "0.25rem" }}>
                        {selectedElectionData.totalVotes}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Participation</div>
                      <div style={{ fontWeight: "600", fontSize: "1.25rem", marginTop: "0.25rem" }}>
                        {selectedElectionData.participationRate}%
                      </div>
                    </div>
                  </div>

                  {/* Position Results */}
                  {selectedElectionData.positionResults.length === 0 ? (
                    <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>
                      No positions configured for this election.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      {selectedElectionData.positionResults.map((position) => (
                        <div key={position.id} style={{
                          border: "1px solid var(--border-color, #e2e8f0)",
                          borderRadius: "8px",
                          padding: "1rem",
                        }}>
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                          }}>
                            <h3 style={{ fontWeight: "600", margin: 0 }}>{position.name}</h3>
                            <span style={{ color: "#64748b", fontSize: "0.875rem" }}>
                              {position.totalVotes} vote{position.totalVotes !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {position.candidates.length === 0 ? (
                            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
                              No candidates for this position.
                            </p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              {position.candidates.map((candidate, idx) => (
                                <div key={candidate.id} style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "1rem",
                                }}>
                                  <div style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    backgroundColor: idx === 0 && position.totalVotes > 0 ? "#10b981" : "#e2e8f0",
                                    color: idx === 0 && position.totalVotes > 0 ? "white" : "#64748b",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                  }}>
                                    {idx + 1}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                      <span style={{ fontWeight: idx === 0 ? "600" : "400" }}>
                                        {candidate.name}
                                        {idx === 0 && position.totalVotes > 0 && (
                                          <span style={{
                                            marginLeft: "0.5rem",
                                            padding: "0.125rem 0.5rem",
                                            borderRadius: "9999px",
                                            fontSize: "0.625rem",
                                            backgroundColor: "#10b98120",
                                            color: "#10b981",
                                          }}>
                                            WINNER
                                          </span>
                                        )}
                                      </span>
                                      <span style={{ color: "#64748b", fontSize: "0.875rem" }}>
                                        {candidate.votes} ({candidate.percentage}%)
                                      </span>
                                    </div>
                                    <div style={{
                                      height: "6px",
                                      borderRadius: "3px",
                                      backgroundColor: "var(--border-color, #e2e8f0)",
                                      overflow: "hidden",
                                    }}>
                                      <div style={{
                                        height: "100%",
                                        width: `${candidate.percentage}%`,
                                        backgroundColor: idx === 0 ? "#10b981" : "#3b82f6",
                                        borderRadius: "3px",
                                        transition: "width 0.3s ease",
                                      }} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* All Elections Summary Table */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>All Elections Summary</h2>
          </div>

          {data.electionSummaries.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>
              No elections to display.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Election</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Status</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Positions</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Votes</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Participation</th>
                    <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: "600" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.electionSummaries.map((election) => (
                    <tr key={election.id} style={{ borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
                      <td style={{ padding: "0.75rem" }}>
                        <Link
                          href={`/organisation/dashboard/elections/${election.id}`}
                          style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "500" }}
                        >
                          {election.title}
                        </Link>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          backgroundColor: `${getStatusColor(election.status)}20`,
                          color: getStatusColor(election.status),
                        }}>
                          {election.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        {election.positionResults.length}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center", fontWeight: "500" }}>
                        {election.totalVotes}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        {election.participationRate}%
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <Link
                          href={`/organisation/dashboard/elections/${election.id}`}
                          style={{
                            padding: "0.375rem 0.75rem",
                            borderRadius: "6px",
                            backgroundColor: "#3b82f620",
                            color: "#3b82f6",
                            textDecoration: "none",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                          }}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
