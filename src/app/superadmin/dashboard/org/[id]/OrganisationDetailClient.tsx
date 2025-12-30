"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./orgDetail.module.css";
import { approveOrganisation, rejectOrganisation, generateOrgCodeForOrg, sendOrgCodeEmail } from "../../actions";

interface OrganisationDetailClientProps {
  session: {
    id: string;
    email: string;
    fullName: string;
  };
  organisation: {
    id: string;
    name: string;
    type: string | null;
    email: string;
    orgCode: string | null;
    status: string;
    createdAt: Date;
    _count: {
      members: number;
      elections: number;
    };
    members: Array<{
      id: string;
      fullName: string;
      email: string | null;
      role: string;
      memberCode: string;
    }>;
    elections: Array<{
      id: string;
      title: string;
      status: string;
      startDate: Date;
      endDate: Date;
    }>;
  };
}

export default function OrganisationDetailClient({
  session,
  organisation,
}: OrganisationDetailClientProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(organisation.orgCode);
  const [isTossing, setIsTossing] = useState(false);
  const [displayCode, setDisplayCode] = useState<string>(organisation.orgCode || "SV-XXXXXXXX");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Animated code generation with "tossing" effect
  const generateCodeWithAnimation = async () => {
    if (isGenerating || organisation.orgCode) return;

    setIsGenerating(true);
    setIsTossing(true);

    // Character set for random generation (alphanumeric + some special chars)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const prefix = "SV-";
    
    // Animate for 2-3 seconds with random characters
    const animationDuration = 2500; // 2.5 seconds
    const updateInterval = 50; // Update every 50ms for smooth animation
    const updates = Math.floor(animationDuration / updateInterval);
    let currentUpdate = 0;

    const animationInterval = setInterval(() => {
      // Generate random characters for the code part (8 characters after "SV-")
      let randomCode = prefix;
      for (let i = 0; i < 8; i++) {
        randomCode += chars[Math.floor(Math.random() * chars.length)];
      }
      setDisplayCode(randomCode);
      currentUpdate++;

      if (currentUpdate >= updates) {
        clearInterval(animationInterval);
        // Now make the actual API call
        generateCode();
      }
    }, updateInterval);
  };

  const generateCode = async () => {
    try {
      const result = await generateOrgCodeForOrg(organisation.id);
      if (result.success && result.data) {
        // Set the final code
        setDisplayCode(result.data);
        setGeneratedCode(result.data);
        setIsTossing(false);
        // Refresh the page data after a short delay to show the final code
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        setIsTossing(false);
        alert(result.error || "Failed to generate code");
      }
    } catch (error) {
      setIsTossing(false);
      alert("An error occurred while generating the code");
    } finally {
      setIsGenerating(false);
    }
  };

  async function onApprove() {
    const result = await approveOrganisation(organisation.id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to approve organisation");
    }
  }

  async function onReject() {
    const reason = prompt("Rejection reason (optional):");
    const result = await rejectOrganisation(organisation.id, reason || undefined);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to reject organisation");
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

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      PENDING: styles.statusPending,
      APPROVED: styles.statusApproved,
      REJECTED: styles.statusRejected,
    };
    return `${styles.statusBadge} ${statusStyles[status] || ""}`;
  };

  return (
    <div className={styles.container}>
      {/* Header with back button */}
      <div className={styles.header}>
        <Link href="/superadmin/dashboard" className={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </Link>
        <h1 className={styles.pageTitle}>Organization Details</h1>
      </div>

      <div className={styles.content}>
        {/* Organization Info Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>{organisation.name}</h2>
              <p className={styles.cardSubtitle}>{organisation.email}</p>
            </div>
            <span className={getStatusBadge(organisation.status)}>{organisation.status}</span>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Organization Type</span>
              <span className={styles.infoValue}>{organisation.type || "Not specified"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Created At</span>
              <span className={styles.infoValue}>{formatDate(organisation.createdAt)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Total Members</span>
              <span className={styles.infoValue}>{organisation._count.members}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Total Elections</span>
              <span className={styles.infoValue}>{organisation._count.elections}</span>
            </div>
          </div>

          {/* Organization Code Section */}
          <div className={styles.codeSection}>
            <div className={styles.codeHeader}>
              <span className={styles.codeLabel}>Organization Code</span>
              {!organisation.orgCode && (
                <span className={styles.codeHint}>Required for organization access</span>
              )}
            </div>
            
            <div className={styles.codeDisplay}>
              <div className={`${styles.codeValue} ${isTossing ? styles.codeTossing : ""}`}>
                {displayCode}
              </div>
              {!organisation.orgCode && (
                <button
                  className={styles.generateCodeBtn}
                  onClick={generateCodeWithAnimation}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        <path d="M12 2v10l4 4"/>
                      </svg>
                      Generate Code
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Send Code via Email */}
            {organisation.orgCode && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <button
                  className={styles.sendEmailBtn}
                  onClick={async () => {
                    setIsSendingEmail(true);
                    const result = await sendOrgCodeEmail(organisation.id);
                    if (result.success) {
                      alert("Organization code sent successfully to " + organisation.email);
                    } else {
                      alert(result.error || "Failed to send email");
                    }
                    setIsSendingEmail(false);
                  }}
                  disabled={isSendingEmail}
                >
                  {isSendingEmail ? (
                    <>
                      <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Send Code via Email
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {organisation.status === "PENDING" && (
            <div className={styles.actionSection}>
              <button className={styles.approveBtn} onClick={onApprove}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Approve Organization
              </button>
              <button className={styles.rejectBtn} onClick={onReject}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Reject Organization
              </button>
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Members ({organisation._count.members} total)</h2>
          </div>
          {organisation.members.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                      <th>Member Code</th>
                  </tr>
                </thead>
                <tbody>
                  {organisation.members.map((member) => (
                    <tr key={member.id}>
                      <td>{member.fullName}</td>
                      <td>{member.email || "—"}</td>
                      <td>
                        <span className={member.role === "ADMIN" ? styles.roleAdmin : styles.roleVoter}>
                          {member.role}
                        </span>
                      </td>
                      <td className={styles.memberCode}>{member.memberCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>No members yet</div>
          )}
        </div>

        {/* Elections Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Elections ({organisation._count.elections} total)</h2>
          </div>
          {organisation.elections.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {organisation.elections.map((election) => (
                    <tr key={election.id}>
                      <td>{election.title}</td>
                      <td>
                        <span className={styles.electionStatus}>{election.status}</span>
                      </td>
                      <td>{formatDate(election.startDate)}</td>
                      <td>{formatDate(election.endDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>No elections yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

