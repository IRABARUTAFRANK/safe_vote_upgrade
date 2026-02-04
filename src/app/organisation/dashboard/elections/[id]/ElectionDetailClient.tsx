"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addPosition,
  deletePosition,
  updatePosition,
  addCandidate,
  deleteCandidate,
  updateElectionStatus,
  updateElectionSettings,
  getElectionStats,
  getVoterCodes,
  generateAdditionalVoterCodes,
  addApplicationFormField,
  deleteApplicationFormField,
  toggleRealTimeResults,
} from "../actions";
import styles from "./electionDetail.module.css";

interface Position {
  id: string;
  name: string;
  description: string | null;
  maxWinners: number;
  minVotes: number;
  maxVotes: number;
  candidates: Array<{
    id: string;
    name: string;
    bio: string | null;
    photoUrl: string | null;
    _count: { votes: number };
  }>;
  _count: { votes: number; applications: number };
}

interface FormField {
  id: string;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  options: string | null;
  placeholder: string | null;
}

interface Election {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
  candidateMethod: string;
  applicationStartDate: Date | null;
  applicationEndDate: Date | null;
  numberOfVoters: number;
  showRealTimeResults: boolean;
  positions: Position[];
  applicationForm: FormField[];
  _count: { ballots: number; voterCodes: number; applications: number };
  voterCodeStats: Array<{ status: string; _count: { status: number } }>;
  applicationStats: Array<{ status: string; _count: { status: number } }>;
}

interface ElectionDetailClientProps {
  session: {
    memberId: string;
    orgId: string;
    email: string;
    fullName: string;
    orgName: string;
    orgStatus: string;
  };
  election: Election;
}

type TabType = "positions" | "voters" | "applications" | "results" | "settings";

export default function ElectionDetailClient({ session, election: initialElection }: ElectionDetailClientProps) {
  const router = useRouter();
  const [election, setElection] = useState(initialElection);
  const [activeTab, setActiveTab] = useState<TabType>("positions");
  const [stats, setStats] = useState<any>(null);
  const [voterCodes, setVoterCodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Live "now" value so time-based messages auto-refresh while the page is open
  const [now, setNow] = useState<Date>(new Date());
  
  const [newPositionName, setNewPositionName] = useState("");
  const [newPositionMaxWinners, setNewPositionMaxWinners] = useState(1);
  const [newCandidateData, setNewCandidateData] = useState({ name: "", bio: "" });
  const [addingPosition, setAddingPosition] = useState<string | null>(null);
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());
  const [additionalVoters, setAdditionalVoters] = useState("");
  
  const [newFormField, setNewFormField] = useState({
    fieldName: "",
    fieldType: "text",
    isRequired: false,
    options: "",
    placeholder: "",
  });

  // Settings form state
  const formatDateForInput = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  const [settingsForm, setSettingsForm] = useState({
    title: initialElection.title,
    description: initialElection.description || "",
    startDate: formatDateForInput(initialElection.startDate),
    endDate: formatDateForInput(initialElection.endDate),
    applicationStartDate: formatDateForInput(initialElection.applicationStartDate),
    applicationEndDate: formatDateForInput(initialElection.applicationEndDate),
  });

  // Periodically update "now" so application status text updates without manual refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 30000); // every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateElectionSettings(election.id, {
        title: settingsForm.title,
        description: settingsForm.description,
        startDate: settingsForm.startDate,
        endDate: settingsForm.endDate,
        applicationStartDate: settingsForm.applicationStartDate || null,
        applicationEndDate: settingsForm.applicationEndDate || null,
      });

      if (result.success) {
        setSuccess("Settings saved successfully");
        setTimeout(() => setSuccess(null), 3000);
        router.refresh();
      } else {
        setError(result.error || "Failed to save settings");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      const result = await getElectionStats(election.id);
      if (result.success && result.data) {
        setStats(result.data);
      }
    };

    fetchStats();
    if (election.status === "ACTIVE") {
      const interval = setInterval(fetchStats, 5000);
      return () => clearInterval(interval);
    }
  }, [election.id, election.status]);

  const loadVoterCodes = async () => {
    const result = await getVoterCodes(election.id);
    if (result.success && result.data) {
      setVoterCodes(result.data);
    }
  };

  useEffect(() => {
    if (activeTab === "voters") {
      loadVoterCodes();
    }
  }, [activeTab, election.id]);

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPositionName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await addPosition(election.id, {
        name: newPositionName,
        maxWinners: newPositionMaxWinners,
      });
      if (result.success) {
        router.refresh();
        setNewPositionName("");
        setNewPositionMaxWinners(1);
        setSuccess("Position added successfully");
        setTimeout(() => setSuccess(null), 3000);
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
    if (!newCandidateData.name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await addCandidate(positionId, {
        name: newCandidateData.name,
        bio: newCandidateData.bio || undefined,
      });
      if (result.success) {
        router.refresh();
        setNewCandidateData({ name: "", bio: "" });
        setAddingPosition(null);
        setSuccess("Candidate added successfully");
        setTimeout(() => setSuccess(null), 3000);
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
        if (election.candidateMethod === "APPLICATION") {
          // For APPLICATION mode, warn but allow activation if user confirms
          if (!confirm("Some positions don't have candidates yet. In APPLICATION mode, make sure you have approved candidate applications before activating. Continue anyway?")) {
            return;
          }
        } else {
          setError("All positions must have at least one candidate before activating");
          return;
        }
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
        setSuccess(`Election ${newStatus.toLowerCase()} successfully`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to update status");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMoreCodes = async () => {
    const count = parseInt(additionalVoters, 10);
    if (isNaN(count) || count < 1) {
      setError("Please enter a valid number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateAdditionalVoterCodes(election.id, count);
      if (result.success) {
        router.refresh();
        loadVoterCodes();
        setAdditionalVoters("");
        setSuccess(`Generated ${result.data?.generated || count} new voter codes`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to generate codes");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFormField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormField.fieldName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await addApplicationFormField(election.id, {
        fieldName: newFormField.fieldName,
        fieldType: newFormField.fieldType,
        isRequired: newFormField.isRequired,
        options: newFormField.options || undefined,
        placeholder: newFormField.placeholder || undefined,
      });
      if (result.success) {
        router.refresh();
        setNewFormField({
          fieldName: "",
          fieldType: "text",
          isRequired: false,
          options: "",
          placeholder: "",
        });
        setSuccess("Form field added successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to add form field");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFormField = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this form field?")) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteApplicationFormField(fieldId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Failed to delete form field");
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
      case "DRAFT": return "#64748b";
      case "ACTIVE": return "#10b981";
      case "CLOSED": return "#3b82f6";
      case "CANCELLED": return "#ef4444";
      default: return "#64748b";
    }
  };

  const getVoterCodeStatusCount = (status: string) => {
    const stat = election.voterCodeStats?.find((s) => s.status === status);
    return stat?._count?.status || 0;
  };

  const printVoterCodes = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const codesHtml = voterCodes.map((code) => `
      <div style="display: inline-block; width: 200px; padding: 16px; margin: 8px; border: 2px dashed #ccc; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 4px;">${code.code}</div>
        <div style="font-size: 12px; color: #666; margin-top: 8px;">${election.title}</div>
      </div>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Voter Codes - ${election.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            .codes { display: flex; flex-wrap: wrap; justify-content: center; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Voter Codes for ${election.title}</h1>
          <p style="text-align: center;">Total: ${voterCodes.length} codes</p>
          <div class="codes">${codesHtml}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.pageTitle}>{election.title}</h1>
            <p className={styles.pageSubtitle}>{election.description || "Manage positions, candidates, and monitor voting progress"}</p>
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
            <button onClick={() => setError(null)} className={styles.dismissBtn}>×</button>
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {success}
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
                <span className={styles.methodBadge}>
                  {election.candidateMethod === "MANUAL" ? "Manual Candidates" : "Application Portal"}
                </span>
              </div>
            </div>
            <div className={styles.statusActions}>
              {election.status === "DRAFT" && (
                <button onClick={() => handleStatusChange("ACTIVE")} className={styles.activateBtn} disabled={isLoading}>
                  Activate Election
                </button>
              )}
              {election.status === "ACTIVE" && (
                <button onClick={() => handleStatusChange("CLOSED")} className={styles.closeBtn} disabled={isLoading}>
                  Close Election
                </button>
              )}
            </div>
          </div>

          {stats && (
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statValue}>{stats.totalVoters || election._count.voterCodes || 0}</div>
                <div className={styles.statLabel}>Total Voter Codes</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>{stats.usedCodes || getVoterCodeStatusCount("USED")}</div>
                <div className={styles.statLabel}>Codes Used</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>{stats.votesCast || election._count.ballots || 0}</div>
                <div className={styles.statLabel}>Votes Cast</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>
                  {stats.participationRate ? `${stats.participationRate.toFixed(1)}%` : "0%"}
                </div>
                <div className={styles.statLabel}>Participation</div>
              </div>
            </div>
          )}

          {/* Real-time Results Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", marginTop: "1rem", borderTop: "1px solid var(--border-color, #e2e8f0)" }}>
            <div>
              <h4 style={{ fontWeight: "600", marginBottom: "0.25rem" }}>Real-time Results</h4>
              <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                {election.showRealTimeResults 
                  ? "Voters can see live vote counts during the election"
                  : "Results are hidden until you announce them"}
              </p>
            </div>
            <button
              onClick={async () => {
                setIsLoading(true);
                const result = await toggleRealTimeResults(election.id, !election.showRealTimeResults);
                if (result.success) {
                  setElection({ ...election, showRealTimeResults: !election.showRealTimeResults });
                  setSuccess(election.showRealTimeResults ? "Real-time results disabled" : "Real-time results enabled");
                  setTimeout(() => setSuccess(null), 3000);
                } else {
                  setError(result.error || "Failed to update setting");
                }
                setIsLoading(false);
              }}
              disabled={isLoading}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: election.showRealTimeResults ? "#10b981" : "#64748b",
                color: "white",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontWeight: "500",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {election.showRealTimeResults ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Visible
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                  Hidden
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === "positions" ? styles.activeTab : ""}`} onClick={() => setActiveTab("positions")}>
            Positions & Candidates
          </button>
          <button className={`${styles.tab} ${activeTab === "voters" ? styles.activeTab : ""}`} onClick={() => setActiveTab("voters")}>
            Voter Codes ({election._count.voterCodes})
          </button>
          {election.candidateMethod === "APPLICATION" && (
            <button className={`${styles.tab} ${activeTab === "applications" ? styles.activeTab : ""}`} onClick={() => setActiveTab("applications")}>
              Applications ({election._count.applications})
            </button>
          )}
          <button className={`${styles.tab} ${activeTab === "results" ? styles.activeTab : ""}`} onClick={() => setActiveTab("results")}>
            Results
          </button>
          <button className={`${styles.tab} ${activeTab === "settings" ? styles.activeTab : ""}`} onClick={() => setActiveTab("settings")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </button>
        </div>

        {/* Positions Tab */}
        {activeTab === "positions" && (
          <>
            {election.status === "DRAFT" && (
              <div className={styles.card}>
                <div className={styles.cardHeader} style={{ flexDirection: "column", alignItems: "flex-start" }}>
                  <h2 className={styles.cardTitle}>Add Position</h2>
                  <p className={styles.cardSubtitle}>
                    {election.candidateMethod === "MANUAL" 
                      ? "Add positions and manually add candidates for each position."
                      : "Add positions. Candidates will apply through the application portal."}
                  </p>
                </div>
                <form onSubmit={handleAddPosition} className={styles.addForm}>
                  <div className={styles.formRow}>
                    <input
                      type="text"
                      value={newPositionName}
                      onChange={(e) => setNewPositionName(e.target.value)}
                      className={styles.input}
                      placeholder="Position name (e.g., President)"
                      required
                      disabled={isLoading}
                    />
                    <div className={styles.numberInput}>
                      <label>Max Winners</label>
                      <input
                        type="number"
                        value={newPositionMaxWinners}
                        onChange={(e) => setNewPositionMaxWinners(parseInt(e.target.value) || 1)}
                        className={styles.input}
                        min="1"
                        max="10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <button type="submit" className={styles.addBtn} disabled={isLoading}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Position
                  </button>
                </form>
              </div>
            )}

            <div className={styles.positionsList}>
              {election.positions.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                  </svg>
                  <p>
                    No positions added yet. 
                    {election.status === "DRAFT" 
                      ? " Use the form above to add your first position." 
                      : " Positions cannot be added after the election is activated."}
                  </p>
                </div>
              ) : (
                election.positions.map((position) => (
                  <div key={position.id} className={styles.positionCard}>
                    <div className={styles.positionHeader} onClick={() => togglePosition(position.id)}>
                      <div className={styles.positionInfo}>
                        <h3 className={styles.positionName}>{position.name}</h3>
                        <span className={styles.positionMeta}>
                          {position.candidates.length} candidate{position.candidates.length !== 1 ? "s" : ""} 
                          • Max {position.maxWinners} winner{position.maxWinners !== 1 ? "s" : ""}
                          • {position._count.votes} vote{position._count.votes !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className={styles.positionActions}>
                        {election.status === "DRAFT" && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeletePosition(position.id); }} className={styles.deleteBtn} disabled={isLoading}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        )}
                        <button className={styles.toggleBtn}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedPositions.has(position.id) ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {expandedPositions.has(position.id) && (
                      <div className={styles.positionContent}>
                        {election.status === "DRAFT" && election.candidateMethod === "MANUAL" && (
                          <form onSubmit={(e) => handleAddCandidate(position.id, e)} className={styles.addCandidateForm}>
                            <input
                              type="text"
                              value={addingPosition === position.id ? newCandidateData.name : ""}
                              onChange={(e) => { setNewCandidateData({ ...newCandidateData, name: e.target.value }); setAddingPosition(position.id); }}
                              className={styles.input}
                              placeholder="Candidate name"
                              required
                              disabled={isLoading}
                            />
                            <input
                              type="text"
                              value={addingPosition === position.id ? newCandidateData.bio : ""}
                              onChange={(e) => { setNewCandidateData({ ...newCandidateData, bio: e.target.value }); setAddingPosition(position.id); }}
                              className={styles.input}
                              placeholder="Short bio (optional)"
                              disabled={isLoading}
                            />
                            <button type="submit" className={styles.addBtn} disabled={isLoading}>
                              Add Candidate
                            </button>
                          </form>
                        )}

                        <div className={styles.candidatesList}>
                          {position.candidates.length === 0 ? (
                            <p className={styles.emptyCandidates}>No candidates added yet</p>
                          ) : (
                            position.candidates.map((candidate) => (
                              <div key={candidate.id} className={styles.candidateCard}>
                                <div className={styles.candidateInfo}>
                                  <div className={styles.candidateAvatar}>
                                    {candidate.photoUrl ? (
                                      <img src={candidate.photoUrl} alt={candidate.name} />
                                    ) : (
                                      <span>{candidate.name.charAt(0)}</span>
                                    )}
                                  </div>
                                  <div>
                                    <span className={styles.candidateName}>{candidate.name}</span>
                                    {candidate.bio && <p className={styles.candidateBio}>{candidate.bio}</p>}
                                  </div>
                                </div>
                                <div className={styles.candidateActions}>
                                  {election.status !== "DRAFT" && (
                                    <span className={styles.voteCount}>{candidate._count.votes} votes</span>
                                  )}
                                  {election.status === "DRAFT" && (
                                    <button onClick={() => handleDeleteCandidate(candidate.id)} className={styles.deleteBtn} disabled={isLoading}>
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                      </svg>
                                    </button>
                                  )}
                                </div>
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
          </>
        )}

        {/* Voter Codes Tab */}
        {activeTab === "voters" && (
          <div className={styles.voterCodesSection}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Voter Codes Management</h2>
                <div className={styles.codeStats}>
                  <span className={styles.codeStat}>
                    <span className={styles.codeStatValue}>{voterCodes.filter(c => c.status === "UNUSED").length}</span>
                    Unused
                  </span>
                  <span className={styles.codeStat}>
                    <span className={styles.codeStatValue}>{voterCodes.filter(c => c.status === "USED").length}</span>
                    Used
                  </span>
                </div>
              </div>

              <div className={styles.voterActions}>
                <div className={styles.generateMore}>
                  <input
                    type="number"
                    value={additionalVoters}
                    onChange={(e) => setAdditionalVoters(e.target.value)}
                    className={styles.input}
                    placeholder="Number of additional codes"
                    min="1"
                    max="10000"
                  />
                  <button onClick={handleGenerateMoreCodes} className={styles.addBtn} disabled={isLoading}>
                    Generate More Codes
                  </button>
                </div>
                <button onClick={printVoterCodes} className={styles.printBtn} disabled={voterCodes.length === 0}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Print All Codes
                </button>
              </div>

              <div className={styles.codesGrid}>
                {voterCodes.slice(0, 100).map((code) => (
                  <div key={code.id} className={`${styles.codeCard} ${code.status === "USED" ? styles.usedCode : ""}`}>
                    <span className={styles.codeValue}>{code.code}</span>
                    <span className={styles.codeStatus}>{code.status}</span>
                  </div>
                ))}
                {voterCodes.length > 100 && (
                  <div className={styles.moreCodesNote}>
                    +{voterCodes.length - 100} more codes (print to see all)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Application Form Tab */}
        {activeTab === "applications" && election.candidateMethod === "APPLICATION" && (
          <div className={styles.applicationsSection}>
            {/* Application Status Card */}
            <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Application Portal Status</h3>
                  {(() => {
                    const startDate = election.applicationStartDate ? new Date(election.applicationStartDate) : null;
                    const endDate = election.applicationEndDate ? new Date(election.applicationEndDate) : null;
                    
                    const isOpen = (startDate === null || startDate <= now) && (endDate === null || endDate >= now) && startDate !== null;
                    const hasNotStarted = startDate && startDate > now;
                    const hasEnded = endDate && endDate < now;
                    const notConfigured = !startDate && !endDate;

                    if (notConfigured) {
                      return (
                        <p style={{ color: "#f59e0b", fontSize: "0.875rem" }}>
                          ⚠️ Application dates not set. Configure dates to allow voters to apply.
                        </p>
                      );
                    } else if (hasEnded) {
                      return (
                        <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>
                          ❌ Applications closed on {endDate ? formatDate(endDate) : ""}
                        </p>
                      );
                    } else if (hasNotStarted) {
                      return (
                        <p style={{ color: "#3b82f6", fontSize: "0.875rem" }}>
                          ⏳ Applications will open on {startDate ? formatDate(startDate) : ""}
                        </p>
                      );
                    } else if (isOpen) {
                      return (
                        <p style={{ color: "#10b981", fontSize: "0.875rem" }}>
                          ✅ Applications are OPEN {endDate ? `until ${formatDate(endDate)}` : "(no end date)"}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  {!election.applicationStartDate && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <label style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Open for</label>
                        <input
                          type="number"
                          id="applicationDays"
                          defaultValue={7}
                          min={1}
                          max={90}
                          style={{
                            width: "70px",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color, #334155)",
                            backgroundColor: "var(--input-bg, #1e293b)",
                            color: "inherit",
                            textAlign: "center",
                            fontWeight: "600",
                          }}
                        />
                        <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>days</span>
                      </div>
                      <button
                        onClick={async () => {
                          const daysInput = document.getElementById('applicationDays') as HTMLInputElement;
                          const days = parseInt(daysInput?.value) || 7;
                          
                          const now = new Date();
                          const endDate = new Date();
                          endDate.setDate(endDate.getDate() + days);
                          
                          const result = await updateElectionSettings(election.id, {
                            applicationStartDate: now.toISOString(),
                            applicationEndDate: endDate.toISOString(),
                          });
                          if (result.success) {
                            setSuccess(`Applications are now OPEN for ${days} days!`);
                            setError(null);
                            router.refresh();
                          } else {
                            setError(result.error || "Failed to open applications");
                          }
                        }}
                        style={{
                          padding: "0.75rem 1.25rem",
                          borderRadius: "8px",
                          border: "none",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "white",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Open Applications
                      </button>
                    </>
                  )}
                  {election.applicationStartDate && new Date(election.applicationStartDate) <= new Date() && (!election.applicationEndDate || new Date(election.applicationEndDate) >= new Date()) && (
                    <button
                      onClick={async () => {
                        const result = await updateElectionSettings(election.id, {
                          applicationEndDate: new Date().toISOString(),
                        });
                        if (result.success) {
                          setSuccess("Applications are now CLOSED");
                          setError(null);
                          router.refresh();
                        } else {
                          setError(result.error || "Failed to close applications");
                        }
                      }}
                      style={{
                        padding: "0.75rem 1.25rem",
                        borderRadius: "8px",
                        border: "1px solid #ef4444",
                        background: "transparent",
                        color: "#ef4444",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      Close Applications
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Application Form Builder</h2>
                <p className={styles.cardSubtitle}>Create the form that candidates will fill when applying</p>
              </div>

              {election.status === "DRAFT" && (
                <form onSubmit={handleAddFormField} className={styles.formBuilder}>
                  <div className={styles.formBuilderRow}>
                    <input
                      type="text"
                      value={newFormField.fieldName}
                      onChange={(e) => setNewFormField({ ...newFormField, fieldName: e.target.value })}
                      className={styles.input}
                      placeholder="Field name (e.g., Manifesto, Photo)"
                      required
                    />
                    <select
                      value={newFormField.fieldType}
                      onChange={(e) => setNewFormField({ ...newFormField, fieldType: e.target.value })}
                      className={styles.select}
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Long Text</option>
                      <option value="file">File Upload</option>
                      <option value="select">Dropdown</option>
                    </select>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={newFormField.isRequired}
                        onChange={(e) => setNewFormField({ ...newFormField, isRequired: e.target.checked })}
                      />
                      Required
                    </label>
                    <button type="submit" className={styles.addBtn} disabled={isLoading}>
                      Add Field
                    </button>
                  </div>
                  {newFormField.fieldType === "select" && (
                    <input
                      type="text"
                      value={newFormField.options}
                      onChange={(e) => setNewFormField({ ...newFormField, options: e.target.value })}
                      className={styles.input}
                      placeholder="Options (comma-separated)"
                    />
                  )}
                </form>
              )}

              <div className={styles.formFieldsList}>
                {election.applicationForm.length === 0 ? (
                  <p className={styles.emptyFields}>No form fields added yet</p>
                ) : (
                  election.applicationForm.map((field) => (
                    <div key={field.id} className={styles.formFieldCard}>
                      <div className={styles.fieldInfo}>
                        <span className={styles.fieldName}>{field.fieldName}</span>
                        <span className={styles.fieldType}>{field.fieldType}</span>
                        {field.isRequired && <span className={styles.requiredBadge}>Required</span>}
                      </div>
                      {election.status === "DRAFT" && (
                        <button onClick={() => handleDeleteFormField(field.id)} className={styles.deleteBtn}>
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

              <div className={styles.applicationsList}>
                <h3>Received Applications ({election._count.applications})</h3>
                <Link href={`/organisation/dashboard/applications?electionId=${election.id}`} className={styles.viewApplicationsBtn}>
                  View & Review Applications
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && stats && (
          <div className={styles.resultsSection}>
            {stats.positionResults?.map((position: any) => (
              <div key={position.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{position.name}</h2>
                  <span className={styles.winnerCount}>Top {position.maxWinners} win{position.maxWinners !== 1 ? "" : "s"}</span>
                </div>
                <div className={styles.resultsList}>
                  {position.candidates.map((candidate: any, index: number) => (
                    <div key={candidate.id} className={`${styles.resultCard} ${index < position.maxWinners && election.status === "CLOSED" ? styles.winner : ""}`}>
                      <div className={styles.resultRank}>{index + 1}</div>
                      <div className={styles.resultInfo}>
                        <span className={styles.resultName}>{candidate.name}</span>
                        <div className={styles.resultBar}>
                          <div className={styles.resultBarFill} style={{ width: `${candidate.percentage}%` }} />
                        </div>
                      </div>
                      <div className={styles.resultStats}>
                        <span className={styles.resultVotes}>{candidate.votes}</span>
                        <span className={styles.resultPercent}>{candidate.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Election Settings</h2>
              <p className={styles.cardSubtitle}>Modify election details and configuration</p>
            </div>

            <div style={{ display: "grid", gap: "1.5rem", padding: "1rem 0" }}>
              {/* Basic Info */}
              <div>
                <h3 style={{ fontWeight: "600", marginBottom: "1rem", fontSize: "1rem" }}>Basic Information</h3>
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Election Title
                    </label>
                    <input
                      type="text"
                      value={settingsForm.title}
                      onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                      className={styles.input}
                      disabled={election.status !== "DRAFT"}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Description
                    </label>
                    <textarea
                      value={settingsForm.description}
                      onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                      className={styles.input}
                      rows={3}
                      style={{ width: "100%", resize: "vertical" }}
                    />
                  </div>
                </div>
              </div>

              {/* Voting Period */}
              <div>
                <h3 style={{ fontWeight: "600", marginBottom: "1rem", fontSize: "1rem" }}>Voting Period</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={settingsForm.startDate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, startDate: e.target.value })}
                      className={styles.input}
                      disabled={election.status === "ACTIVE" || election.status === "CLOSED"}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={settingsForm.endDate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, endDate: e.target.value })}
                      className={styles.input}
                      disabled={election.status === "CLOSED"}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              </div>

              {/* Application Period (only for APPLICATION mode) */}
              {election.candidateMethod === "APPLICATION" && (
                <div>
                  <h3 style={{ fontWeight: "600", marginBottom: "1rem", fontSize: "1rem" }}>
                    Application Period
                    <span style={{ fontSize: "0.875rem", fontWeight: "400", color: "#64748b", marginLeft: "0.5rem" }}>
                      (When voters can apply as candidates)
                    </span>
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Application Opens
                      </label>
                      <input
                        type="datetime-local"
                        value={settingsForm.applicationStartDate}
                        onChange={(e) => setSettingsForm({ ...settingsForm, applicationStartDate: e.target.value })}
                        className={styles.input}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Application Closes
                      </label>
                      <input
                        type="datetime-local"
                        value={settingsForm.applicationEndDate}
                        onChange={(e) => setSettingsForm({ ...settingsForm, applicationEndDate: e.target.value })}
                        className={styles.input}
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.75rem" }}>
                    💡 Tip: Application period should end before voting starts so you have time to review and approve candidates.
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div style={{ 
                padding: "1rem", 
                borderRadius: "8px", 
                backgroundColor: "rgba(59, 130, 246, 0.1)", 
                border: "1px solid rgba(59, 130, 246, 0.2)" 
              }}>
                <h4 style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#3b82f6" }}>Election Mode</h4>
                <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                  <strong>{election.candidateMethod === "MANUAL" ? "Manual" : "Application Portal"}</strong> - 
                  {election.candidateMethod === "MANUAL" 
                    ? " You add candidates directly to positions."
                    : " Voters apply as candidates and you approve them."}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                  Note: Candidate method cannot be changed after election creation.
                </p>
              </div>

              {/* Save Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color, #e2e8f0)" }}>
                <button
                  onClick={() => {
                    setSettingsForm({
                      title: election.title,
                      description: election.description || "",
                      startDate: formatDateForInput(election.startDate),
                      endDate: formatDateForInput(election.endDate),
                      applicationStartDate: formatDateForInput(election.applicationStartDate),
                      applicationEndDate: formatDateForInput(election.applicationEndDate),
                    });
                  }}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    color: "inherit",
                  }}
                >
                  Reset
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#10b981",
                    color: "white",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.7 : 1,
                    fontWeight: "500",
                  }}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
