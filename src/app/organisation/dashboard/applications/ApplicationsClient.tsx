"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { reviewApplication } from "../elections/actions";
import styles from "./applications.module.css";

interface Application {
  id: string;
  status: string;
  reviewNotes: string | null;
  submittedAt: Date;
  election: { id: string; title: string };
  position: { id: string; name: string };
  applicant: { id: string; fullName: string; email: string | null; memberCode: string };
  responses: Array<{
    id: string;
    value: string;
    fileUrl: string | null;
    field: { id: string; fieldName: string; fieldType: string };
  }>;
}

interface ApplicationsClientProps {
  session: {
    memberId: string;
    orgId: string;
    email: string;
    fullName: string;
    orgName: string;
    orgStatus: string;
  };
  data: {
    elections: Array<{
      id: string;
      title: string;
      status: string;
      _count: { applications: number };
    }>;
    applications: Application[];
  };
  selectedElectionId?: string;
}

export default function ApplicationsClient({ session, data, selectedElectionId }: ApplicationsClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredApplications = data.applications.filter(app => {
    if (filter === "all") return true;
    return app.status === filter;
  });

  const handleReview = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedApp) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await reviewApplication(selectedApp.id, decision, reviewNotes);
      if (result.success) {
        router.refresh();
        setSelectedApp(null);
        setReviewNotes("");
        setSuccess(`Application ${decision.toLowerCase()} successfully`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to review application");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "#f59e0b";
      case "APPROVED": return "#10b981";
      case "REJECTED": return "#ef4444";
      default: return "#64748b";
    }
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.pageTitle}>Candidate Applications</h1>
            <p className={styles.pageSubtitle}>Review and manage candidate applications</p>
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

        {success && (
          <div className={styles.successMessage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {success}
          </div>
        )}

        <div className={styles.layout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.filterSection}>
              <h3>Filter by Status</h3>
              <div className={styles.filterButtons}>
                <button 
                  className={`${styles.filterBtn} ${filter === "all" ? styles.activeFilter : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All ({data.applications.length})
                </button>
                <button 
                  className={`${styles.filterBtn} ${filter === "PENDING" ? styles.activeFilter : ""}`}
                  onClick={() => setFilter("PENDING")}
                >
                  Pending ({data.applications.filter(a => a.status === "PENDING").length})
                </button>
                <button 
                  className={`${styles.filterBtn} ${filter === "APPROVED" ? styles.activeFilter : ""}`}
                  onClick={() => setFilter("APPROVED")}
                >
                  Approved ({data.applications.filter(a => a.status === "APPROVED").length})
                </button>
                <button 
                  className={`${styles.filterBtn} ${filter === "REJECTED" ? styles.activeFilter : ""}`}
                  onClick={() => setFilter("REJECTED")}
                >
                  Rejected ({data.applications.filter(a => a.status === "REJECTED").length})
                </button>
              </div>
            </div>

            <div className={styles.electionsSection}>
              <h3>Elections</h3>
              <div className={styles.electionsList}>
                <Link 
                  href="/organisation/dashboard/applications" 
                  className={`${styles.electionLink} ${!selectedElectionId ? styles.activeElection : ""}`}
                >
                  All Elections
                </Link>
                {data.elections.map(election => (
                  <Link 
                    key={election.id}
                    href={`/organisation/dashboard/applications?electionId=${election.id}`}
                    className={`${styles.electionLink} ${selectedElectionId === election.id ? styles.activeElection : ""}`}
                  >
                    {election.title}
                    <span className={styles.appCount}>{election._count.applications}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className={styles.main}>
            {filteredApplications.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>No applications found</p>
              </div>
            ) : (
              <div className={styles.applicationsList}>
                {filteredApplications.map(app => (
                  <div 
                    key={app.id} 
                    className={`${styles.applicationCard} ${selectedApp?.id === app.id ? styles.selectedCard : ""}`}
                    onClick={() => setSelectedApp(app)}
                  >
                    <div className={styles.appHeader}>
                      <div className={styles.appInfo}>
                        <h3 className={styles.applicantName}>{app.applicant.fullName}</h3>
                        <span className={styles.positionName}>for {app.position.name}</span>
                      </div>
                      <span 
                        className={styles.statusBadge}
                        style={{ 
                          backgroundColor: `${getStatusColor(app.status)}20`, 
                          color: getStatusColor(app.status),
                          borderColor: `${getStatusColor(app.status)}40`,
                        }}
                      >
                        {app.status}
                      </span>
                    </div>
                    <div className={styles.appMeta}>
                      <span>{app.election.title}</span>
                      <span>{formatDate(app.submittedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* Detail Panel */}
          {selectedApp && (
            <aside className={styles.detailPanel}>
              <div className={styles.panelHeader}>
                <h2>Application Details</h2>
                <button className={styles.closeBtn} onClick={() => setSelectedApp(null)}>×</button>
              </div>

              <div className={styles.panelContent}>
                <div className={styles.applicantInfo}>
                  <div className={styles.avatar}>
                    {selectedApp.applicant.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3>{selectedApp.applicant.fullName}</h3>
                    <p>{selectedApp.applicant.email || selectedApp.applicant.memberCode}</p>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <label>Position</label>
                  <span>{selectedApp.position.name}</span>
                </div>

                <div className={styles.detailItem}>
                  <label>Election</label>
                  <span>{selectedApp.election.title}</span>
                </div>

                <div className={styles.detailItem}>
                  <label>Submitted</label>
                  <span>{formatDate(selectedApp.submittedAt)}</span>
                </div>

                <div className={styles.responses}>
                  <h4>Application Responses</h4>
                  {selectedApp.responses.map(response => (
                    <div key={response.id} className={styles.responseItem}>
                      <label>{response.field.fieldName}</label>
                      {response.field.fieldType === "file" && response.fileUrl ? (
                        <a href={response.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                          View File
                        </a>
                      ) : (
                        <p>{response.value}</p>
                      )}
                    </div>
                  ))}
                </div>

                {selectedApp.status === "PENDING" && (
                  <div className={styles.reviewSection}>
                    <h4>Review Application</h4>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className={styles.notesInput}
                      placeholder="Add review notes (optional)..."
                      rows={3}
                    />
                    <div className={styles.reviewActions}>
                      <button 
                        className={styles.rejectBtn}
                        onClick={() => handleReview("REJECTED")}
                        disabled={isLoading}
                      >
                        Reject
                      </button>
                      <button 
                        className={styles.approveBtn}
                        onClick={() => handleReview("APPROVED")}
                        disabled={isLoading}
                      >
                        Approve as Candidate
                      </button>
                    </div>
                  </div>
                )}

                {selectedApp.status !== "PENDING" && selectedApp.reviewNotes && (
                  <div className={styles.reviewNotes}>
                    <h4>Review Notes</h4>
                    <p>{selectedApp.reviewNotes}</p>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
