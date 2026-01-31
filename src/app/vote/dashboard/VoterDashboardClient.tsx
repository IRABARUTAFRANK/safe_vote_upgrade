"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getActiveElections,
  getVotingHistory,
  castVote,
  logoutVoterAction,
  getElectionsForApplication,
  submitCandidateApplication,
  getMyApplications,
  getAccountStatus,
} from "./actions";
import voterStyles from "./voter-dashboard.module.css";

interface Election {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
  canVote: boolean;
  hasVoted: boolean;
  positions: Array<{
    id: string;
    name: string;
    description: string | null;
    minVotes: number;
    maxVotes: number;
    candidates: Array<{
      id: string;
      name: string;
      bio: string | null;
      photoUrl: string | null;
    }>;
  }>;
}

interface ApplicationElection {
  id: string;
  title: string;
  applicationStartDate: Date | null;
  applicationEndDate: Date | null;
  positions: Array<{
    id: string;
    name: string;
  }>;
  applicationForm: Array<{
    id: string;
    fieldName: string;
    fieldType: string;
    isRequired: boolean;
    options: string | null;
    placeholder: string | null;
  }>;
  applications: Array<{
    id: string;
    positionId: string;
    status: string;
  }>;
}

interface MyApplication {
  id: string;
  status: string;
  submittedAt: Date;
  election: { id: string; title: string; status: string };
  position: { id: string; name: string };
}

interface VotingHistory {
  id: string;
  createdAt: Date;
  election: {
    id: string;
    title: string;
    status: string;
    _count: { ballots: number };
  };
}

type TabType = "elections" | "apply" | "applications" | "history";

interface VoterSession {
  memberId: string;
  orgId: string;
  electionId: string | null;
  fullName: string;
  memberCode: string;
  orgName: string;
}

interface VoterDashboardClientProps {
  session: VoterSession;
}

export default function VoterDashboardClient({ session }: VoterDashboardClientProps) {
  const router = useRouter();
  const [elections, setElections] = useState<Election[]>([]);
  const [applicationElections, setApplicationElections] = useState<ApplicationElection[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [history, setHistory] = useState<VotingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("elections");
  const [accountStatus, setAccountStatus] = useState<{
    hasActiveElections: boolean;
    activeElectionsCount: number;
    canApplyCount: number;
    hasVotedCount: number;
  } | null>(null);

  // Voting state
  const [votingElection, setVotingElection] = useState<Election | null>(null);
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Application state
  const [applyingElection, setApplyingElection] = useState<ApplicationElection | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [formResponses, setFormResponses] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [electionsResult, historyResult, appElectionsResult, myAppsResult, statusResult] = await Promise.all([
        getActiveElections(),
        getVotingHistory(),
        getElectionsForApplication(),
        getMyApplications(),
        getAccountStatus(),
      ]);

      if (electionsResult.success && electionsResult.data) {
        setElections(electionsResult.data);
      }
      if (historyResult.success && historyResult.data) {
        setHistory(historyResult.data);
      }
      if (appElectionsResult.success && appElectionsResult.data) {
        setApplicationElections(appElectionsResult.data);
      }
      if (myAppsResult.success && myAppsResult.data) {
        setMyApplications(myAppsResult.data);
      }
      if (statusResult.success && statusResult.data) {
        setAccountStatus(statusResult.data);
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Refresh when user returns to tab (e.g. after creating election elsewhere)
  useEffect(() => {
    const onFocus = () => loadData();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }
  }, [loadData]);


  async function handleLogout() {
    await logoutVoterAction();
    router.push("/vote/login");
  }

  // Voting handlers
  function handleStartVoting(election: Election) {
    setVotingElection(election);
    setSelectedVotes({});
    setMessage(null);
  }

  function handleCancelVoting() {
    setVotingElection(null);
    setSelectedVotes({});
    setMessage(null);
  }

  function handleCandidateSelect(positionId: string, candidateId: string, maxVotes: number) {
    setSelectedVotes((prev) => {
      const current = prev[positionId] || [];
      if (current.includes(candidateId)) {
        return { ...prev, [positionId]: current.filter((id) => id !== candidateId) };
      } else if (current.length < maxVotes) {
        return { ...prev, [positionId]: [...current, candidateId] };
      }
      return prev;
    });
  }

  async function handleSubmitVote() {
    if (!votingElection) return;

    const votes = Object.entries(selectedVotes).map(([positionId, candidateIds]) => ({
      positionId,
      candidateIds,
    }));

    for (const position of votingElection.positions) {
      const positionVotes = selectedVotes[position.id] || [];
      if (positionVotes.length < position.minVotes) {
        setMessage({
          type: "error",
          text: `Please select at least ${position.minVotes} candidate(s) for "${position.name}"`,
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await castVote(votingElection.id, votes);
      if (result.success) {
        setMessage({ type: "success", text: "Your vote has been submitted successfully!" });
        setTimeout(() => {
          setVotingElection(null);
          loadData();
        }, 2000);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to submit vote" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred while submitting your vote" });
    } finally {
      setSubmitting(false);
    }
  }

  // Application handlers
  function handleStartApplication(election: ApplicationElection) {
    setApplyingElection(election);
    setSelectedPosition("");
    setFormResponses({});
    setMessage(null);
  }

  function handleCancelApplication() {
    setApplyingElection(null);
    setSelectedPosition("");
    setFormResponses({});
    setMessage(null);
  }

  async function handleSubmitApplication() {
    if (!applyingElection || !selectedPosition) return;

    const responses = Object.entries(formResponses).map(([fieldId, value]) => ({
      fieldId,
      value,
    }));

    setSubmitting(true);
    try {
      const result = await submitCandidateApplication(applyingElection.id, selectedPosition, responses);
      if (result.success) {
        setMessage({ type: "success", text: "Application submitted successfully!" });
        setTimeout(() => {
          setApplyingElection(null);
          loadData();
        }, 2000);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to submit application" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred while submitting your application" });
    } finally {
      setSubmitting(false);
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "#f59e0b";
      case "APPROVED": return "#10b981";
      case "REJECTED": return "#ef4444";
      default: return "#64748b";
    }
  };

  if (loading && elections.length === 0 && applicationElections.length === 0 && history.length === 0) {
    return (
      <div className={voterStyles.container}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div className={voterStyles.spinner}></div>
        </div>
      </div>
    );
  }

  // Voting Modal
  if (votingElection) {
    const totalPositions = votingElection.positions.length;
    const votedPositions = Object.keys(selectedVotes).filter(
      (posId) => (selectedVotes[posId] || []).length >= (votingElection.positions.find(p => p.id === posId)?.minVotes || 1)
    ).length;

    return (
      <div className={voterStyles.container}>
        <header className={voterStyles.header}>
          <div className={voterStyles.headerContent}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <h1 className={voterStyles.pageTitle} style={{ marginBottom: "0.25rem" }}>Cast Your Vote</h1>
                <p className={voterStyles.pageSubtitle} style={{ color: "#94a3b8" }}>{votingElection.title}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                backgroundColor: "var(--card-bg, #1e293b)",
                border: "1px solid var(--border-color, #334155)",
              }}>
                <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Progress: </span>
                <span style={{ color: "#3b82f6", fontWeight: "600" }}>{votedPositions}/{totalPositions}</span>
              </div>
              <button className={voterStyles.logoutBtn} onClick={handleCancelVoting} style={{ 
                backgroundColor: "transparent",
                border: "1px solid var(--border-color, #334155)"
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Cancel
              </button>
            </div>
          </div>
        </header>

        <div className={voterStyles.content} style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
          {message && (
            <div style={{
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              borderRadius: "12px",
              backgroundColor: message.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
              color: message.type === "error" ? "#ef4444" : "#10b981",
              border: `1px solid ${message.type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {message.type === "error" ? (
                  <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
                ) : (
                  <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
                )}
              </svg>
              {message.text}
            </div>
          )}

          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{
              backgroundColor: "var(--card-bg, #1e293b)",
              borderRadius: "12px",
              padding: "1.25rem",
              border: "1px solid var(--border-color, #334155)",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div>
                <p style={{ color: "#e2e8f0", fontWeight: "500", marginBottom: "0.25rem" }}>Voting Instructions</p>
                <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                  Select your preferred candidate(s) for each position. Click on a candidate card to select or deselect.
                </p>
              </div>
            </div>
          </div>

          {votingElection.positions.map((position, index) => {
            const positionVotes = selectedVotes[position.id] || [];
            const isComplete = positionVotes.length >= position.minVotes;

            return (
              <div 
                key={position.id} 
                style={{ 
                  marginBottom: "2rem",
                  backgroundColor: "var(--card-bg, #0f172a)",
                  borderRadius: "16px",
                  border: isComplete ? "2px solid rgba(16, 185, 129, 0.5)" : "1px solid var(--border-color, #1e293b)",
                  overflow: "hidden",
                }}
              >
                <div style={{
                  padding: "1.25rem 1.5rem",
                  backgroundColor: isComplete ? "rgba(16, 185, 129, 0.05)" : "var(--card-bg, #1e293b)",
                  borderBottom: "1px solid var(--border-color, #334155)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      backgroundColor: isComplete ? "#10b981" : "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      color: "white",
                    }}>
                      {isComplete ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div>
                      <h2 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#f1f5f9", marginBottom: "0.25rem" }}>
                        {position.name}
                      </h2>
                      <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
                        {position.description || `Select ${position.minVotes === position.maxVotes ? position.minVotes : `${position.minVotes}-${position.maxVotes}`} candidate(s)`}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "20px",
                    backgroundColor: isComplete ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)",
                    color: isComplete ? "#10b981" : "#3b82f6",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}>
                    <span>{positionVotes.length}</span>
                    <span>/</span>
                    <span>{position.maxVotes}</span>
                    <span style={{ marginLeft: "0.25rem" }}>selected</span>
                  </div>
                </div>

                <div style={{ padding: "1.5rem" }}>
                  <div style={{ 
                    display: "grid", 
                    gap: "1rem", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" 
                  }}>
                    {position.candidates.map((candidate) => {
                      const isSelected = positionVotes.includes(candidate.id);
                      return (
                        <div
                          key={candidate.id}
                          onClick={() => handleCandidateSelect(position.id, candidate.id, position.maxVotes)}
                          style={{
                            padding: "1.25rem",
                            borderRadius: "12px",
                            border: isSelected ? "2px solid #3b82f6" : "1px solid var(--border-color, #334155)",
                            backgroundColor: isSelected ? "rgba(59, 130, 246, 0.1)" : "var(--card-bg, #1e293b)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            transform: isSelected ? "scale(1.02)" : "scale(1)",
                            position: "relative",
                          }}
                        >
                          {isSelected && (
                            <div style={{
                              position: "absolute",
                              top: "-8px",
                              right: "-8px",
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              backgroundColor: "#3b82f6",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 2px 8px rgba(59, 130, 246, 0.5)",
                            }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            {candidate.photoUrl ? (
                              <img
                                src={candidate.photoUrl}
                                alt={candidate.name}
                                style={{ 
                                  width: "60px", 
                                  height: "60px", 
                                  borderRadius: "12px", 
                                  objectFit: "cover",
                                  border: isSelected ? "2px solid #3b82f6" : "2px solid var(--border-color, #334155)",
                                }}
                              />
                            ) : (
                              <div style={{
                                width: "60px",
                                height: "60px",
                                borderRadius: "12px",
                                background: isSelected 
                                  ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
                                  : "linear-gradient(135deg, #475569 0%, #334155 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.5rem",
                                fontWeight: "700",
                                color: "white",
                              }}>
                                {candidate.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div style={{ flex: 1 }}>
                              <h3 style={{ 
                                fontWeight: "600", 
                                marginBottom: "0.375rem", 
                                color: isSelected ? "#3b82f6" : "#f1f5f9",
                                fontSize: "1rem",
                              }}>
                                {candidate.name}
                              </h3>
                              {candidate.bio && (
                                <p style={{ 
                                  fontSize: "0.875rem", 
                                  color: "#94a3b8",
                                  lineHeight: "1.4",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}>
                                  {candidate.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ 
            display: "flex", 
            gap: "1rem", 
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "2rem",
            padding: "1.5rem",
            backgroundColor: "var(--card-bg, #1e293b)",
            borderRadius: "12px",
            border: "1px solid var(--border-color, #334155)",
          }}>
            <div>
              <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                {votedPositions === totalPositions 
                  ? "You have completed all selections. Ready to submit!"
                  : `Complete ${totalPositions - votedPositions} more position(s) to submit your vote.`
                }
              </p>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={handleCancelVoting} style={{
                padding: "0.875rem 1.5rem",
                borderRadius: "10px",
                border: "1px solid var(--border-color, #334155)",
                backgroundColor: "transparent",
                cursor: "pointer",
                color: "#e2e8f0",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Cancel
              </button>
              <button 
                onClick={handleSubmitVote} 
                disabled={submitting || votedPositions < totalPositions} 
                style={{
                  padding: "0.875rem 2rem",
                  borderRadius: "10px",
                  border: "none",
                  background: votedPositions === totalPositions 
                    ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" 
                    : "#475569",
                  color: "white",
                  cursor: (submitting || votedPositions < totalPositions) ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: votedPositions === totalPositions ? "0 4px 14px rgba(59, 130, 246, 0.4)" : "none",
                }}
              >
                {submitting ? (
                  <>
                    <div style={{
                      width: "18px",
                      height: "18px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Submit Vote
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Application Modal
  if (applyingElection) {
    const availablePositions = applyingElection.positions.filter(
      (p) => !applyingElection.applications.some((a) => a.positionId === p.id)
    );

    return (
      <div className={voterStyles.container}>
        <header className={voterStyles.header}>
          <div className={voterStyles.headerContent}>
            <div>
              <h1 className={voterStyles.pageTitle}>Apply as Candidate</h1>
              <p className={voterStyles.pageSubtitle}>{applyingElection.title}</p>
            </div>
            <button className={voterStyles.logoutBtn} onClick={handleCancelApplication}>Cancel</button>
          </div>
        </header>

        <div className={voterStyles.content}>
          {message && (
            <div style={{
              padding: "1rem",
              marginBottom: "1rem",
              borderRadius: "8px",
              backgroundColor: message.type === "error" ? "#fee2e2" : "#d1fae5",
              color: message.type === "error" ? "#dc2626" : "#059669",
            }}>
              {message.text}
            </div>
          )}

          <div className={voterStyles.card}>
            <div className={voterStyles.cardHeader}>
              <h2 className={voterStyles.cardTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <polyline points="16 11 18 13 22 9"/>
                </svg>
                Select Position
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                Choose the position you want to apply for
              </p>
            </div>
            {availablePositions.length === 0 ? (
              <div style={{ 
                padding: "2rem", 
                textAlign: "center", 
                backgroundColor: "rgba(16, 185, 129, 0.05)", 
                borderRadius: "12px",
                border: "1px solid rgba(16, 185, 129, 0.2)"
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem" }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p style={{ color: "#10b981", fontWeight: "600" }}>All applications submitted!</p>
                <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                  You have already applied for all available positions.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "0.5rem" }}>
                {availablePositions.map((position) => {
                  const isSelected = selectedPosition === position.id;
                  return (
                    <button
                      key={position.id}
                      onClick={() => setSelectedPosition(position.id)}
                      style={{
                        padding: "1rem 1.25rem",
                        borderRadius: "12px",
                        border: isSelected ? "2px solid #3b82f6" : "2px solid var(--border-color, #e2e8f0)",
                        backgroundColor: isSelected ? "rgba(59, 130, 246, 0.1)" : "var(--card-bg, white)",
                        cursor: "pointer",
                        color: "inherit",
                        fontWeight: isSelected ? "600" : "500",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        textAlign: "center",
                      }}
                    >
                      {isSelected && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      {position.name}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedPosition && applyingElection.applicationForm.length > 0 && (
              <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-color, #e2e8f0)", paddingTop: "1.5rem" }}>
                <h3 style={{ marginBottom: "1.5rem", fontWeight: "600", fontSize: "1.125rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Application Form
                </h3>
                {applyingElection.applicationForm.map((field) => (
                  <div key={field.id} style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.95rem" }}>
                      {field.fieldName}
                      {field.isRequired && <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>}
                    </label>
                    
                    {field.fieldType === "textarea" ? (
                      <textarea
                        value={formResponses[field.id] || ""}
                        onChange={(e) => setFormResponses({ ...formResponses, [field.id]: e.target.value })}
                        placeholder={field.placeholder || `Enter ${field.fieldName.toLowerCase()}...`}
                        style={{
                          width: "100%",
                          padding: "0.875rem",
                          borderRadius: "10px",
                          border: "2px solid var(--border-color, #e2e8f0)",
                          backgroundColor: "var(--input-bg, white)",
                          color: "inherit",
                          minHeight: "120px",
                          resize: "vertical",
                          fontSize: "0.95rem",
                          transition: "border-color 0.2s, box-shadow 0.2s",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "var(--border-color, #e2e8f0)";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    ) : field.fieldType === "select" ? (
                      <select
                        value={formResponses[field.id] || ""}
                        onChange={(e) => setFormResponses({ ...formResponses, [field.id]: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.875rem",
                          borderRadius: "10px",
                          border: "2px solid var(--border-color, #e2e8f0)",
                          backgroundColor: "var(--input-bg, white)",
                          color: "inherit",
                          fontSize: "0.95rem",
                          cursor: "pointer",
                          appearance: "none",
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 0.75rem center",
                          paddingRight: "2.5rem",
                        }}
                      >
                        <option value="">Select {field.fieldName.toLowerCase()}...</option>
                        {field.options?.split(",").map((opt) => (
                          <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                        ))}
                      </select>
                    ) : field.fieldType === "file" ? (
                      <div style={{ position: "relative" }}>
                        <input
                          type="file"
                          id={`file-${field.id}`}
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // For now, store the file name. In production, you'd upload to a server
                              setFormResponses({ ...formResponses, [field.id]: file.name });
                            }
                          }}
                          style={{ display: "none" }}
                        />
                        <label
                          htmlFor={`file-${field.id}`}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "2rem",
                            borderRadius: "12px",
                            border: "2px dashed var(--border-color, #cbd5e1)",
                            backgroundColor: "var(--input-bg, #f8fafc)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            textAlign: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#3b82f6";
                            e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-color, #cbd5e1)";
                            e.currentTarget.style.backgroundColor = "var(--input-bg, #f8fafc)";
                          }}
                        >
                          <div style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "12px",
                            backgroundColor: "rgba(59, 130, 246, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "1rem",
                          }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="17 8 12 3 7 8"/>
                              <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                          </div>
                          {formResponses[field.id] ? (
                            <div>
                              <p style={{ fontWeight: "600", color: "#10b981", marginBottom: "0.25rem" }}>
                                ✓ File selected
                              </p>
                              <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                                {formResponses[field.id]}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p style={{ fontWeight: "600", color: "#3b82f6", marginBottom: "0.25rem" }}>
                                Click to upload image
                              </p>
                              <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                                PNG, JPG, GIF up to 5MB
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formResponses[field.id] || ""}
                        onChange={(e) => setFormResponses({ ...formResponses, [field.id]: e.target.value })}
                        placeholder={field.placeholder || `Enter ${field.fieldName.toLowerCase()}...`}
                        style={{
                          width: "100%",
                          padding: "0.875rem",
                          borderRadius: "10px",
                          border: "2px solid var(--border-color, #e2e8f0)",
                          backgroundColor: "var(--input-bg, white)",
                          color: "inherit",
                          fontSize: "0.95rem",
                          transition: "border-color 0.2s, box-shadow 0.2s",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3b82f6";
                          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "var(--border-color, #e2e8f0)";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedPosition && (
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button onClick={handleCancelApplication} style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  color: "inherit",
                }}>
                  Cancel
                </button>
                <button onClick={handleSubmitApplication} disabled={submitting} style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#10b981",
                  color: "white",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                }}>
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className={voterStyles.container}>
      <header className={voterStyles.header}>
        <div className={voterStyles.headerContent}>
          <div>
            <h1 className={voterStyles.pageTitle}>Voter Dashboard</h1>
            <p className={voterStyles.pageSubtitle}>Cast your vote and apply as candidate</p>
            <div className={voterStyles.welcomeBadge}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {session.fullName} · {session.orgName}
            </div>
          </div>
          <button className={voterStyles.logoutBtn} onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      <div className={voterStyles.content}>
        {/* Account Status Banner */}
        {accountStatus && !accountStatus.hasActiveElections && history.length > 0 && (
          <div style={{
            padding: "1.25rem",
            marginBottom: "1.5rem",
            borderRadius: "12px",
            backgroundColor: "rgba(251, 191, 36, 0.1)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p style={{ color: "#f59e0b", fontWeight: "600", marginBottom: "0.25rem" }}>No Active Elections</p>
              <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                All elections have ended. You have voted in {accountStatus.hasVotedCount} election(s). 
                Your account will remain accessible for viewing history.
              </p>
            </div>
          </div>
        )}

        <div className={voterStyles.tabRow}>
          {[
            { key: "elections", label: "Vote", count: elections.filter((e) => e.canVote).length },
            { key: "apply", label: "Apply as Candidate", count: applicationElections.length },
            { key: "applications", label: "My Applications", count: myApplications.length },
            { key: "history", label: "History", count: history.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={activeTab === tab.key ? `${voterStyles.tabBtn} ${voterStyles.tabBtnActive}` : voterStyles.tabBtn}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
          <button
            onClick={() => loadData()}
            disabled={loading}
            className={voterStyles.refreshBtn}
            title="Refresh data"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }}
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Elections Tab */}
        {activeTab === "elections" && (
          <div className={voterStyles.card}>
            <div className={voterStyles.cardHeader}>
              <h2 className={voterStyles.cardTitle}>Active Elections</h2>
            </div>
            {elections.length === 0 ? (
              <div className={voterStyles.emptyState}>
                <svg className={voterStyles.emptyStateIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                <p>No active elections at the moment.</p>
                <p className={voterStyles.emptyStateHint}>Elections you can vote in will appear here when they are open and you are linked with the correct voter code.</p>
              </div>
            ) : (
              <div className={voterStyles.electionsList}>
                {elections.map((election) => (
                  <div key={election.id} className={voterStyles.electionItem}>
                    <div>
                      <h3 className={voterStyles.electionTitle}>{election.title}</h3>
                      <div className={voterStyles.electionMeta}>
                        <span className={voterStyles.statusBadge} style={{
                          backgroundColor: election.hasVoted ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)",
                          color: election.hasVoted ? "#10b981" : "#3b82f6",
                          borderColor: election.hasVoted ? "#10b981" : "#3b82f6",
                        }}>
                          {election.hasVoted ? "Voted" : "Open"}
                        </span>
                        <span className={voterStyles.metaText}>{election.positions.length} position(s)</span>
                        <span className={voterStyles.metaText}>Ends: {formatDate(election.endDate)}</span>
                      </div>
                    </div>
                    {election.canVote && !election.hasVoted && (
                      <button onClick={() => handleStartVoting(election)} className={voterStyles.voteNowBtn}>
                        Vote Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Apply Tab */}
        {activeTab === "apply" && (
          <div className={voterStyles.card}>
            <div className={voterStyles.cardHeader}>
              <h2 className={voterStyles.cardTitle}>Apply as Candidate</h2>
            </div>
            {applicationElections.length === 0 ? (
              <div className={voterStyles.emptyState}>
                <svg className={voterStyles.emptyStateIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p>No elections are currently accepting candidate applications.</p>
                <p className={voterStyles.emptyStateHint}>
                  If you expect to see an election here, make sure you signed in with the voter code issued for that election, and that the organisation has opened applications (Candidate method: Application) for that election.
                </p>
              </div>
            ) : (
              <div className={voterStyles.electionsList}>
                {applicationElections.map((election) => {
                  const appliedCount = election.applications.length;
                  const totalPositions = election.positions.length;
                  return (
                    <div key={election.id} className={voterStyles.electionItem}>
                      <div>
                        <h3 className={voterStyles.electionTitle}>{election.title}</h3>
                        <div className={voterStyles.electionMeta}>
                          <span className={voterStyles.metaText}>{totalPositions} position(s)</span>
                          <span className={voterStyles.metaText}>Applied: {appliedCount}/{totalPositions}</span>
                          {election.applicationEndDate && (
                            <span className={voterStyles.metaText}>
                              Deadline: {formatDate(election.applicationEndDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      {appliedCount < totalPositions && (
                        <button onClick={() => handleStartApplication(election)} className={voterStyles.applyBtn}>
                          Apply
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Applications Tab */}
        {activeTab === "applications" && (
          <div className={voterStyles.card}>
            <div className={voterStyles.cardHeader}>
              <h2 className={voterStyles.cardTitle}>My Applications</h2>
            </div>
            {myApplications.length === 0 ? (
              <div className={voterStyles.emptyState}>
                <svg className={voterStyles.emptyStateIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                </svg>
                <p>You haven&apos;t submitted any applications yet.</p>
              </div>
            ) : (
              <div className={voterStyles.electionsList}>
                {myApplications.map((app) => (
                  <div key={app.id} className={voterStyles.electionItem}>
                    <div>
                      <h3 className={voterStyles.electionTitle}>{app.election.title}</h3>
                      <div className={voterStyles.electionMeta}>
                        <span className={voterStyles.metaText}>Position: {app.position.name}</span>
                        <span className={voterStyles.statusBadge} style={{
                          backgroundColor: `${getStatusColor(app.status)}20`,
                          color: getStatusColor(app.status),
                          borderColor: getStatusColor(app.status),
                        }}>
                          {app.status}
                        </span>
                        <span className={voterStyles.metaText}>Submitted: {formatDate(app.submittedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className={voterStyles.card}>
            <div className={voterStyles.cardHeader}>
              <h2 className={voterStyles.cardTitle}>Voting History</h2>
            </div>
            {history.length === 0 ? (
              <div className={voterStyles.emptyState}>
                <svg className={voterStyles.emptyStateIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4" />
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                </svg>
                <p>You haven&apos;t voted in any elections yet.</p>
              </div>
            ) : (
              <div className={voterStyles.electionsList}>
                {history.map((ballot) => (
                  <div key={ballot.id} className={voterStyles.electionItem}>
                    <div>
                      <h3 className={voterStyles.electionTitle}>{ballot.election.title}</h3>
                      <div className={voterStyles.electionMeta}>
                        <span className={voterStyles.statusBadge} style={{
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          color: "#10b981",
                          borderColor: "#10b981",
                        }}>
                          Voted
                        </span>
                        <span className={voterStyles.metaText}>Voted on: {formatDate(ballot.createdAt)}</span>
                        <span className={voterStyles.metaText}>Total votes: {ballot.election._count.ballots}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
