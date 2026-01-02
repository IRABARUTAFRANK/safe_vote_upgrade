"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addPosition,
  deletePosition,
  addCandidate,
  deleteCandidate,
  updateElectionStatus,
  getElectionStats,
} from "../actions";
import styles from "./electionDetail.module.css";

interface ElectionDetailClientProps {
  session: {
    memberId: string;
    orgId: string;
    email: string;
    fullName: string;
    orgName: string;
    orgStatus: string;
  };
  election: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    status: string;
    positions: Array<{
      id: string;
      name: string;
      candidates: Array<{
        id: string;
        name: string;
        _count: { votes: number };
      }>;
      _count: { votes: number };
    }>;
    _count: { ballots: number };
  };
}

export default function ElectionDetailClient({ session, election: initialElection }: ElectionDetailClientProps) {
  const router = useRouter();
  const [election, setElection] = useState(initialElection);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPositionName, setNewPositionName] = useState("");
  const [newCandidateName, setNewCandidateName] = useState("");
  const [addingPosition, setAddingPosition] = useState<string | null>(null);
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());

  // Fetch real-time stats
  useEffect(() => {
    const fetchStats = async () => {
      const result = await getElectionStats(election.id);
      if (result.success && result.data) {
        setStats(result.data);
      }
    };

    fetchStats();
    // Refresh stats every 5 seconds if election is active
    if (election.status === "ACTIVE") {
      const interval = setInterval(fetchStats, 5000);
      return () => clearInterval(interval);
    }
  }, [election.id, election.status]);

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPositionName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await addPosition(election.id, newPositionName);
      if (result.success && result.data) {
        // Refresh election data
        router.refresh();
        setNewPositionName("");
      } else {
        setError(result.error || "Failed to add position");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePosition = async (positionId: string) => {
    if (!confirm("Are you sure you want to delete this position? All candidates will also be deleted.")) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await deletePosition(positionId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Failed to delete position");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCandidate = async (positionId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await addCandidate(positionId, newCandidateName);
      if (result.success) {
        router.refresh();
        setNewCandidateName("");
        setAddingPosition(null);
      } else {
        setError(result.error || "Failed to add candidate");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm("Are you sure you want to delete this candidate?")) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteCandidate(candidateId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Failed to delete candidate");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "ACTIVE" && election.positions.length === 0) {
      setError("Please add at least one position before activating the election");
      return;
    }

    if (newStatus === "ACTIVE") {
      const hasCandidates = election.positions.every((p) => p.candidates.length > 0);
      if (!hasCandidates) {
        setError("All positions must have at least one candidate before activating");
        return;
      }
    }

    if (!confirm(`Are you sure you want to change the election status to ${newStatus}?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateElectionStatus(election.id, newStatus);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Failed to update status");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePosition = (positionId: string) => {
    const newExpanded = new Set(expandedPositions);
    if (newExpanded.has(positionId)) {
      newExpanded.delete(positionId);
    } else {
      newExpanded.add(positionId);
    }
    setExpandedPositions(newExpanded);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "#64748b";
      case "ACTIVE":
        return "#10b981";
      case "CLOSED":
        return "#3b82f6";
      case "CANCELLED":
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
            <h1 className={styles.pageTitle}>{election.title}</h1>
            <p className={styles.pageSubtitle}>Manage positions, candidates, and monitor voting progress</p>
          </div>
          <Link href="/organisation/dashboard" className={styles.backBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        {error && (
          <div className={styles.errorMessage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Election Info & Stats */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Election Information</h2>
              <div className={styles.electionMeta}>
                <span className={styles.statusBadge} style={{ backgroundColor: `${getStatusColor(election.status)}20`, color: getStatusColor(election.status), borderColor: `${getStatusColor(election.status)}40` }}>
                  {election.status}
                </span>
                <span className={styles.metaItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Starts: {formatDate(election.startDate)}
                </span>
                <span className={styles.metaItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Ends: {formatDate(election.endDate)}
                </span>
              </div>
            </div>
            <div className={styles.statusActions}>
              {election.status === "DRAFT" && (
                <button
                  onClick={() => handleStatusChange("ACTIVE")}
                  className={styles.activateBtn}
                  disabled={isLoading}
                >
                  Activate Election
                </button>
              )}
              {election.status === "ACTIVE" && (
                <button
                  onClick={() => handleStatusChange("CLOSED")}
                  className={styles.closeBtn}
                  disabled={isLoading}
                >
                  Close Election
                </button>
              )}
            </div>
          </div>

          {/* Real-time Stats */}
          {stats && (
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statValue}>{stats.totalVoters || 0}</div>
                <div className={styles.statLabel}>Total Voters</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>{stats.votesCast || 0}</div>
                <div className={styles.statLabel}>Votes Cast</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>
                  {stats.participationRate ? `${stats.participationRate.toFixed(1)}%` : "0%"}
                </div>
                <div className={styles.statLabel}>Participation Rate</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>{election.positions.length}</div>
                <div className={styles.statLabel}>Positions</div>
              </div>
            </div>
          )}
        </div>

        {/* Add Position */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Add Position</h2>
          </div>
          <form onSubmit={handleAddPosition} className={styles.addForm}>
            <input
              type="text"
              value={newPositionName}
              onChange={(e) => setNewPositionName(e.target.value)}
              className={styles.input}
              placeholder="e.g., President, Secretary, Treasurer"
              required
              disabled={isLoading || election.status !== "DRAFT"}
            />
            <button
              type="submit"
              className={styles.addBtn}
              disabled={isLoading || election.status !== "DRAFT"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Position
            </button>
          </form>
        </div>

        {/* Positions List */}
        <div className={styles.positionsList}>
          {election.positions.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
              <p>No positions added yet. Add your first position above.</p>
            </div>
          ) : (
            election.positions.map((position) => (
              <div key={position.id} className={styles.positionCard}>
                <div className={styles.positionHeader}>
                  <div className={styles.positionInfo}>
                    <h3 className={styles.positionName}>{position.name}</h3>
                    <span className={styles.positionMeta}>
                      {position.candidates.length} candidate{position.candidates.length !== 1 ? "s" : ""} • {position._count.votes} vote{position._count.votes !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className={styles.positionActions}>
                    {election.status === "DRAFT" && (
                      <button
                        onClick={() => handleDeletePosition(position.id)}
                        className={styles.deleteBtn}
                        disabled={isLoading}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => togglePosition(position.id)}
                      className={styles.toggleBtn}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: expandedPositions.has(position.id) ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {expandedPositions.has(position.id) && (
                  <div className={styles.positionContent}>
                    {/* Add Candidate */}
                    {election.status === "DRAFT" && (
                      <form
                        onSubmit={(e) => handleAddCandidate(position.id, e)}
                        className={styles.addCandidateForm}
                      >
                        <input
                          type="text"
                          value={addingPosition === position.id ? newCandidateName : ""}
                          onChange={(e) => {
                            setNewCandidateName(e.target.value);
                            setAddingPosition(position.id);
                          }}
                          className={styles.input}
                          placeholder="Candidate name"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="submit"
                          className={styles.addBtn}
                          disabled={isLoading}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          Add Candidate
                        </button>
                      </form>
                    )}

                    {/* Candidates List */}
                    <div className={styles.candidatesList}>
                      {position.candidates.length === 0 ? (
                        <p className={styles.emptyCandidates}>No candidates added yet</p>
                      ) : (
                        position.candidates.map((candidate) => (
                          <div key={candidate.id} className={styles.candidateCard}>
                            <div className={styles.candidateInfo}>
                              <span className={styles.candidateName}>{candidate.name}</span>
                              {election.status !== "DRAFT" && (
                                <span className={styles.voteCount}>
                                  {candidate._count.votes} vote{candidate._count.votes !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                            {election.status === "DRAFT" && (
                              <button
                                onClick={() => handleDeleteCandidate(candidate.id)}
                                className={styles.deleteBtn}
                                disabled={isLoading}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

