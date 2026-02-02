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
      setError(null);
      const [electionsResult, historyResult, appElectionsResult, myAppsResult, statusResult] = await Promise.all([
        getActiveElections(),
        getVotingHistory(),
        getElectionsForApplication(),
        getMyApplications(),
        getAccountStatus(),
      ]);

      if (electionsResult.success && electionsResult.data) {
        setElections(electionsResult.data);
      } else if (!electionsResult.success) {
        console.error("Elections fetch error:", electionsResult.error);
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
      console.error("Load data error:", err);
      setError("Failed to load data. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING": return "badge-warning";
      case "APPROVED": return "badge-success";
      case "REJECTED": return "badge-error";
      default: return "badge-ghost";
    }
  };

  // Loading state
  if (loading && elections.length === 0 && applicationElections.length === 0 && history.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">Loading your dashboard...</p>
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
      <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300">
        {/* Voting Header */}
        <div className="navbar bg-base-100/80 backdrop-blur-lg sticky top-0 z-50 border-b border-base-content/10">
          <div className="flex-1 gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-base-content">Cast Your Vote</h1>
              <p className="text-sm text-base-content/60">{votingElection.title}</p>
            </div>
          </div>
          <div className="flex-none gap-4">
            <div className="badge badge-lg badge-primary gap-2">
              <span className="font-semibold">{votedPositions}/{totalPositions}</span>
              <span className="opacity-70">positions</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleCancelVoting}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Message Alert */}
          {message && (
            <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"} mb-6 shadow-lg`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {message.type === "error" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <span>{message.text}</span>
            </div>
          )}

          {/* Instructions Card */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body py-4">
              <div className="flex items-center gap-3">
                <div className="text-info">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-base-content">Voting Instructions</h3>
                  <p className="text-sm text-base-content/60">Click on candidate cards to select or deselect your choices for each position.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Positions */}
          {votingElection.positions.map((position, index) => {
            const positionVotes = selectedVotes[position.id] || [];
            const isComplete = positionVotes.length >= position.minVotes;

            return (
              <div key={position.id} className={`card bg-base-100 shadow-xl mb-6 ${isComplete ? "ring-2 ring-success" : ""}`}>
                <div className="card-body">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${isComplete ? "bg-success" : "bg-primary"}`}>
                        {isComplete ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div>
                        <h2 className="card-title text-lg">{position.name}</h2>
                        <p className="text-sm text-base-content/60">
                          {position.description || `Select ${position.minVotes === position.maxVotes ? position.minVotes : `${position.minVotes}-${position.maxVotes}`} candidate(s)`}
                        </p>
                      </div>
                    </div>
                    <div className={`badge ${isComplete ? "badge-success" : "badge-primary"} badge-lg gap-1`}>
                      <span className="font-bold">{positionVotes.length}</span>
                      <span>/</span>
                      <span>{position.maxVotes}</span>
                      <span className="ml-1">selected</span>
                    </div>
                  </div>

                  <div className="divider my-2"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {position.candidates.map((candidate) => {
                      const isSelected = positionVotes.includes(candidate.id);
                      return (
                        <div
                          key={candidate.id}
                          onClick={() => handleCandidateSelect(position.id, candidate.id, position.maxVotes)}
                          className={`card cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                            isSelected 
                              ? "bg-primary/10 border-2 border-primary shadow-lg" 
                              : "bg-base-200 border-2 border-transparent hover:border-primary/30"
                          }`}
                        >
                          <div className="card-body p-4">
                            <div className="flex items-center gap-3">
                              {candidate.photoUrl ? (
                                <div className="avatar">
                                  <div className={`w-14 h-14 rounded-xl ring-2 ${isSelected ? "ring-primary" : "ring-base-300"}`}>
                                    <img src={candidate.photoUrl} alt={candidate.name} />
                                  </div>
                                </div>
                              ) : (
                                <div className="avatar placeholder">
                                  <div className={`w-14 h-14 rounded-xl ${isSelected ? "bg-primary text-primary-content" : "bg-base-300 text-base-content"}`}>
                                    <span className="text-xl font-bold">{candidate.name.charAt(0)}</span>
                                  </div>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base-content truncate">{candidate.name}</h3>
                                {candidate.bio && (
                                  <p className="text-xs text-base-content/60 line-clamp-2">{candidate.bio}</p>
                                )}
                              </div>
                              {isSelected && (
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                    <svg className="w-5 h-5 text-primary-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
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

          {/* Submit Button */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-base-content/60">
                    You&apos;ve completed <span className="font-bold text-primary">{votedPositions}</span> of <span className="font-bold">{totalPositions}</span> positions
                  </p>
                </div>
                <button
                  onClick={handleSubmitVote}
                  disabled={submitting || votedPositions < totalPositions}
                  className={`btn btn-lg ${votedPositions === totalPositions ? "btn-success" : "btn-primary"} ${submitting ? "loading" : ""}`}
                >
                  {submitting ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {submitting ? "Submitting..." : "Submit Vote"}
                </button>
              </div>
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
      <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300">
        <div className="navbar bg-base-100/80 backdrop-blur-lg sticky top-0 z-50 border-b border-base-content/10">
          <div className="flex-1 gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-primary flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-base-content">Apply as Candidate</h1>
              <p className="text-sm text-base-content/60">{applyingElection.title}</p>
            </div>
          </div>
          <div className="flex-none">
            <button className="btn btn-ghost btn-sm" onClick={handleCancelApplication}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {message && (
            <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"} mb-6 shadow-lg`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={message.type === "error" ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
              </svg>
              <span>{message.text}</span>
            </div>
          )}

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">Select Position</h2>
              
              <div className="form-control w-full mb-6">
                <select
                  className="select select-bordered select-lg w-full"
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                >
                  <option value="">Choose a position to apply for...</option>
                  {availablePositions.map((pos) => (
                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                  ))}
                </select>
              </div>

              {selectedPosition && applyingElection.applicationForm.length > 0 && (
                <>
                  <div className="divider">Application Form</div>
                  <div className="space-y-4">
                    {applyingElection.applicationForm.map((field) => (
                      <div key={field.id} className="form-control w-full">
                        <label className="label">
                          <span className="label-text font-medium">
                            {field.fieldName}
                            {field.isRequired && <span className="text-error ml-1">*</span>}
                          </span>
                        </label>
                        {field.fieldType === "textarea" ? (
                          <textarea
                            className="textarea textarea-bordered h-24"
                            placeholder={field.placeholder || ""}
                            value={formResponses[field.id] || ""}
                            onChange={(e) => setFormResponses({ ...formResponses, [field.id]: e.target.value })}
                          />
                        ) : field.fieldType === "select" && field.options ? (
                          <select
                            className="select select-bordered"
                            value={formResponses[field.id] || ""}
                            onChange={(e) => setFormResponses({ ...formResponses, [field.id]: e.target.value })}
                          >
                            <option value="">Select an option...</option>
                            {field.options.split(",").map((opt) => (
                              <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.fieldType === "email" ? "email" : field.fieldType === "number" ? "number" : "text"}
                            className="input input-bordered"
                            placeholder={field.placeholder || ""}
                            value={formResponses[field.id] || ""}
                            onChange={(e) => setFormResponses({ ...formResponses, [field.id]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="card-actions justify-end mt-6">
                <button className="btn btn-ghost" onClick={handleCancelApplication}>Cancel</button>
                <button
                  className={`btn btn-success ${submitting ? "loading" : ""}`}
                  onClick={handleSubmitApplication}
                  disabled={!selectedPosition || submitting}
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300">
      {/* Header */}
      <div className="navbar bg-base-100/80 backdrop-blur-lg sticky top-0 z-50 border-b border-base-content/10 px-4 lg:px-8">
        <div className="flex-1 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-base-content">Voter Dashboard</h1>
            <p className="text-xs text-base-content/60">{session.orgName}</p>
          </div>
        </div>
        <div className="flex-none gap-2">
          <div className="badge badge-success badge-outline gap-1 hidden sm:flex">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
            {session.fullName}
          </div>
          <button className="btn btn-ghost btn-sm text-error" onClick={handleLogout}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-6 shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
            <button className="btn btn-sm btn-ghost" onClick={loadData}>Retry</button>
          </div>
        )}

        {/* Account Status Banner */}
        {accountStatus && !accountStatus.hasActiveElections && history.length > 0 && (
          <div className="alert alert-warning mb-6 shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold">No Active Elections</h3>
              <p className="text-sm">All elections have ended. You have voted in {accountStatus.hasVotedCount} election(s).</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats stats-vertical lg:stats-horizontal shadow-xl w-full mb-6 bg-base-100">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-title">Active Elections</div>
            <div className="stat-value text-primary">{elections.filter(e => e.canVote && !e.hasVoted).length}</div>
            <div className="stat-desc">Ready to vote</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-success">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="stat-title">Votes Cast</div>
            <div className="stat-value text-success">{history.length}</div>
            <div className="stat-desc">Elections participated</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-secondary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="stat-title">Applications</div>
            <div className="stat-value text-secondary">{myApplications.length}</div>
            <div className="stat-desc">{myApplications.filter(a => a.status === "PENDING").length} pending</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 p-1 mb-6 shadow-lg">
          {[
            { key: "elections", label: "Vote", count: elections.filter((e) => e.canVote).length, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            { key: "apply", label: "Apply", count: applicationElections.length, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
            { key: "applications", label: "My Apps", count: myApplications.length, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { key: "history", label: "History", count: history.length, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`tab tab-lg flex-1 gap-2 ${activeTab === tab.key ? "tab-active bg-primary text-primary-content rounded-lg" : ""}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="badge badge-sm">{tab.count}</span>
            </button>
          ))}
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="btn btn-ghost btn-sm ml-2"
            title="Refresh"
          >
            <svg className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Tab Content */}
        <div className="card bg-base-100 shadow-xl">
          {/* Elections Tab */}
          {activeTab === "elections" && (
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Active Elections
              </h2>
              {elections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
                    <svg className="w-10 h-10 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-base-content/60 mb-2">No active elections</h3>
                  <p className="text-base-content/40 max-w-md mx-auto">Elections you can vote in will appear here when they are open and you are linked with the correct voter code.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {elections.map((election) => (
                    <div key={election.id} className="flex items-center justify-between p-4 rounded-xl bg-base-200 hover:bg-base-300 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base-content mb-1">{election.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className={`badge ${election.hasVoted ? "badge-success" : "badge-primary"}`}>
                            {election.hasVoted ? "Voted" : "Open"}
                          </span>
                          <span className="badge badge-ghost">{election.positions.length} position(s)</span>
                          <span className="text-xs text-base-content/60">Ends: {formatDate(election.endDate)}</span>
                        </div>
                      </div>
                      {election.canVote && !election.hasVoted && (
                        <button onClick={() => handleStartVoting(election)} className="btn btn-primary btn-sm">
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
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Apply as Candidate
              </h2>
              {applicationElections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
                    <svg className="w-10 h-10 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-base-content/60 mb-2">No open applications</h3>
                  <p className="text-base-content/40 max-w-md mx-auto">No elections are currently accepting candidate applications.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applicationElections.map((election) => {
                    const appliedCount = election.applications.length;
                    const totalPositions = election.positions.length;
                    return (
                      <div key={election.id} className="flex items-center justify-between p-4 rounded-xl bg-base-200 hover:bg-base-300 transition-colors">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base-content mb-1">{election.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="badge badge-ghost">{totalPositions} position(s)</span>
                            <span className="badge badge-outline">Applied: {appliedCount}/{totalPositions}</span>
                            {election.applicationEndDate && (
                              <span className="text-xs text-base-content/60">Deadline: {formatDate(election.applicationEndDate)}</span>
                            )}
                          </div>
                        </div>
                        {appliedCount < totalPositions && (
                          <button onClick={() => handleStartApplication(election)} className="btn btn-success btn-sm">
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

          {/* Applications Tab */}
          {activeTab === "applications" && (
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Applications
              </h2>
              {myApplications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
                    <svg className="w-10 h-10 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-base-content/60 mb-2">No applications</h3>
                  <p className="text-base-content/40">You haven&apos;t submitted any applications yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 rounded-xl bg-base-200">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base-content mb-1">{app.election.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-base-content/60">Position: {app.position.name}</span>
                          <span className={`badge ${getStatusBadgeClass(app.status)}`}>{app.status}</span>
                          <span className="text-xs text-base-content/60">Submitted: {formatDate(app.submittedAt)}</span>
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
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Voting History
              </h2>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
                    <svg className="w-10 h-10 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-base-content/60 mb-2">No voting history</h3>
                  <p className="text-base-content/40">You haven&apos;t voted in any elections yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((ballot) => (
                    <div key={ballot.id} className="flex items-center justify-between p-4 rounded-xl bg-base-200">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base-content mb-1">{ballot.election.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="badge badge-success">Voted</span>
                          <span className="text-sm text-base-content/60">Voted on: {formatDate(ballot.createdAt)}</span>
                          <span className="text-sm text-base-content/60">Total votes: {ballot.election._count.ballots}</span>
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
    </div>
  );
}
