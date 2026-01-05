"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";
<<<<<<< HEAD
import { approveOrganisation, rejectOrganisation, handleLogout, generateOrgCodeForOrg, deleteOrganisation } from "./actions";
=======
import { approveOrganisation, rejectOrganisation, handleLogout, generateOrgCodeForOrg } from "./actions";
import ThemeToggle from "../../components/ThemeToggle";
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7

interface DashboardProps {
  session: {
    id: string;
    email: string;
    fullName: string;
  };
  data: {
    stats: {
      totalOrganisations: number;
      pendingOrganisations: number;
      approvedOrganisations: number;
      totalMembers: number;
      totalElections: number;
    };
    recentOrganisations: any[];
    recentLogs: any[];
  };
}

export default function DashboardClient({ session, data }: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "organisations" | "logs">("overview");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function onLogout() {
    setIsLoggingOut(true);
    await handleLogout();
    router.push("/superadmin/login");
  }

  async function onApprove(orgId: string) {
    const result = await approveOrganisation(orgId);
    if (result.success) {
      router.refresh();
    }
  }

  async function onReject(orgId: string) {
    const reason = prompt("Rejection reason (optional):");
    const result = await rejectOrganisation(orgId, reason || undefined);
    if (result.success) {
      router.refresh();
    }
  }

  async function onGenerateCode(orgId: string) {
    const confirm = window.confirm("Generate a unique organisation code for this organisation?");
    if (!confirm) return;
    const result = await generateOrgCodeForOrg(orgId);
    if (result.success) {
      alert(`Generated org code: ${result.data}`);
      router.refresh();
    } else {
      alert(result.error || 'Failed to generate org code');
    }
  }

<<<<<<< HEAD
  async function onDelete(orgId: string, orgName: string) {
    const confirm = window.confirm(
      `Are you sure you want to delete "${orgName}"?\n\n` +
      `This action will permanently delete:\n` +
      `- The organisation and all its data\n` +
      `- All members associated with this organisation\n` +
      `- All elections and voting data\n\n` +
      `This action CANNOT be undone.`
    );
    
    if (!confirm) return;
    
    // Double confirmation for safety
    const doubleConfirm = window.confirm(
      `FINAL CONFIRMATION: Delete "${orgName}"?\n\n` +
      `Type "DELETE" in the next prompt to confirm.`
    );
    
    if (!doubleConfirm) return;
    
    const typedConfirm = window.prompt(`Type "DELETE" to confirm deletion of "${orgName}":`);
    
    if (typedConfirm !== "DELETE") {
      alert("Deletion cancelled. You must type 'DELETE' exactly to confirm.");
      return;
    }
    
    const result = await deleteOrganisation(orgId);
    if (result.success) {
      alert(result.message || "Organisation deleted successfully");
      router.refresh();
    } else {
      alert(result.error || "Failed to delete organisation");
    }
  }

=======
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
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
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>SafeVote</span>
            <span className={styles.logoSubtitle}>Super Admin</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${activeTab === "overview" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Overview
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "organisations" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("organisations")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Organisations
            {data.stats.pendingOrganisations > 0 && (
              <span className={styles.badge}>{data.stats.pendingOrganisations}</span>
            )}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "logs" ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Activity Logs
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>
              {session.fullName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.adminDetails}>
              <span className={styles.adminName}>{session.fullName}</span>
              <span className={styles.adminEmail}>{session.email}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={onLogout} disabled={isLoggingOut}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "organisations" && "Manage Organisations"}
              {activeTab === "logs" && "Activity Logs"}
            </h1>
            <p className={styles.pageSubtitle}>
              {activeTab === "overview" && "Platform statistics and recent activity"}
              {activeTab === "organisations" && "Review and manage organisation registrations"}
              {activeTab === "logs" && "Track all administrative actions"}
            </p>
          </div>
          <div className={styles.headerActions}>
<<<<<<< HEAD
=======
            <ThemeToggle />
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot}></span>
              System Operational
            </div>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className={styles.content}>
            {/* Stats Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{data.stats.totalOrganisations}</span>
                  <span className={styles.statLabel}>Total Organisations</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{data.stats.pendingOrganisations}</span>
                  <span className={styles.statLabel}>Pending Approval</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{data.stats.approvedOrganisations}</span>
                  <span className={styles.statLabel}>Approved</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{data.stats.totalMembers}</span>
                  <span className={styles.statLabel}>Total Members</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #ec4899, #be185d)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4"/>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  </svg>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{data.stats.totalElections}</span>
                  <span className={styles.statLabel}>Total Elections</span>
                </div>
              </div>
            </div>

            {/* Recent Organisations */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Recent Organisations</h2>
                <button className={styles.viewAllBtn} onClick={() => setActiveTab("organisations")}>
                  View All
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Organisation</th>
                      <th>Type</th>
                      <th>Members</th>
                      <th>Org Code</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrganisations.map((org) => (
                      <tr key={org.id}>
                        <td>
                          <div className={styles.orgCell}>
                            <span className={styles.orgName}>{org.name}</span>
                            <span className={styles.orgEmail}>{org.email}</span>
                          </div>
                        </td>
                        <td>{org.type || "—"}</td>
                        <td>{org._count.members}</td>
                        <td>{org.orgCode || "—"}</td>
                        <td>
                          <span className={getStatusBadge(org.status)}>{org.status}</span>
                        </td>
                        <td>{formatDate(org.createdAt)}</td>
                        <td>
                          <div className={styles.actionBtns}>
                            <Link href={`/superadmin/dashboard/org/${org.id}`} className={styles.viewDetailsBtn}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                              View Details
                            </Link>
                            {org.status === "PENDING" && (
                              <>
                                <button className={styles.approveBtn} onClick={() => onApprove(org.id)}>
                                  Approve
                                </button>
                                <button className={styles.rejectBtn} onClick={() => onReject(org.id)}>
                                  Reject
                                </button>
                              </>
                            )}
<<<<<<< HEAD
=======
                            {/* Generate org code for organisations missing one */}
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
                            {!org.orgCode && (
                              <button className={styles.generateBtn} onClick={() => onGenerateCode(org.id)}>
                                Generate Code
                              </button>
                            )}
<<<<<<< HEAD
                            <button 
                              className={styles.deleteBtn} 
                              onClick={() => onDelete(org.id, org.name)}
                              title="Delete organisation"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                              Delete
                            </button>
=======
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
                          </div>
                        </td>
                      </tr>
                    ))}
                    {data.recentOrganisations.length === 0 && (
                      <tr>
<<<<<<< HEAD
                        <td colSpan={7} className={styles.emptyState}>No organisations yet</td>
=======
                        <td colSpan={6} className={styles.emptyState}>No organisations yet</td>
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Organisations Tab */}
        {activeTab === "organisations" && (
          <div className={styles.content}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>All Organisations</h2>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Organisation</th>
                      <th>Type</th>
                      <th>Members</th>
                      <th>Elections</th>
                      <th>Org Code</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrganisations.map((org) => (
                      <tr key={org.id}>
                        <td>
                          <div className={styles.orgCell}>
                            <span className={styles.orgName}>{org.name}</span>
                            <span className={styles.orgEmail}>{org.email}</span>
                          </div>
                        </td>
                        <td>{org.type || "—"}</td>
                        <td>{org._count.members}</td>
                        <td>{org._count.elections}</td>
                        <td>{org.orgCode || "—"}</td>
                        <td>
                          <span className={getStatusBadge(org.status)}>{org.status}</span>
                        </td>
                        <td>{formatDate(org.createdAt)}</td>
                        <td>
                          <div className={styles.actionBtns}>
                            <Link href={`/superadmin/dashboard/org/${org.id}`} className={styles.viewDetailsBtn}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                              View Details
                            </Link>
                            {org.status === "PENDING" && (
                              <>
                                <button className={styles.approveBtn} onClick={() => onApprove(org.id)}>
                                  Approve
                                </button>
                                <button className={styles.rejectBtn} onClick={() => onReject(org.id)}>
                                  Reject
                                </button>
                              </>
                            )}
                            {!org.orgCode && (
                              <button className={styles.generateBtn} onClick={() => onGenerateCode(org.id)}>
                                Generate Code
                              </button>
                            )}
<<<<<<< HEAD
                            <button 
                              className={styles.deleteBtn} 
                              onClick={() => onDelete(org.id, org.name)}
                              title="Delete organisation"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                              Delete
                            </button>
=======
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
                          </div>
                        </td>
                      </tr>
                    ))}
                    {data.recentOrganisations.length === 0 && (
                      <tr>
<<<<<<< HEAD
                        <td colSpan={8} className={styles.emptyState}>No organisations yet</td>
=======
                        <td colSpan={7} className={styles.emptyState}>No organisations yet</td>
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className={styles.content}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Recent Activity</h2>
              </div>
              <div className={styles.logsList}>
                {data.recentLogs.map((log) => (
                  <div key={log.id} className={styles.logItem}>
                    <div className={styles.logIcon}>
                      {log.action.includes("LOGIN") && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                          <polyline points="10 17 15 12 10 7"/>
                          <line x1="15" y1="12" x2="3" y2="12"/>
                        </svg>
                      )}
                      {log.action.includes("APPROVE") && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      {log.action.includes("REJECT") && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )}
                      {log.action === "LOGOUT" && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                      )}
                    </div>
                    <div className={styles.logContent}>
                      <span className={styles.logAction}>{log.action.replace(/_/g, " ")}</span>
                      <span className={styles.logDetails}>
                        by {log.admin.fullName} • {formatDate(log.createdAt)}
                      </span>
                      {log.details && <span className={styles.logExtra}>{log.details}</span>}
                    </div>
                    {log.ipAddress && (
                      <span className={styles.logIp}>{log.ipAddress}</span>
                    )}
                  </div>
                ))}
                {data.recentLogs.length === 0 && (
                  <div className={styles.emptyState}>No activity logs yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
