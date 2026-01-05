"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { logoutOrgAdminAction } from "./actions";
import ThemeToggle from "../../components/ThemeToggle";
<<<<<<< HEAD
import StatusDistributionChart from "./components/StatusDistributionChart";
import VotesTimelineChart from "./components/VotesTimelineChart";
import ElectionPerformanceChart from "./components/ElectionPerformanceChart";
=======
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7

interface DashboardClientProps {
  session: {
    memberId: string;
    orgId: string;
    email: string;
    fullName: string;
    orgName: string;
    orgStatus: string;
  };
  data: {
    organisation: {
      id: string;
      name: string;
      email: string;
      type: string | null;
      orgCode: string | null;
      status: string;
      createdAt: Date;
      _count: {
        members: number;
        elections: number;
      };
    } | null;
    stats: {
      totalMembers: number;
      totalElections: number;
      activeElections: number;
<<<<<<< HEAD
      draftElections: number;
      closedElections: number;
      totalVotes: number;
    };
    chartData: {
      electionStatusDistribution: Array<{ name: string; value: number; color: string }>;
      votesTimeline: Array<{ date: string; votes: number }>;
      electionPerformance: Array<{ name: string; votes: number; positions: number; status: string }>;
    };
  };
  elections: Array<{
    id: string;
    title: string;
    status: string;
    startDate: Date;
    endDate: Date;
    _count: {
      positions: number;
      ballots: number;
    };
  }>;
}

export default function DashboardClient({ session, data, elections }: DashboardClientProps) {
=======
    };
  };
}

export default function DashboardClient({ session, data }: DashboardClientProps) {
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
  const router = useRouter();

  async function handleLogout() {
    await logoutOrgAdminAction();
    router.push("/organisation/login");
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.pageTitle}>Organization Dashboard</h1>
            <p className={styles.pageSubtitle}>Welcome back, {session.fullName}</p>
          </div>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {/* Organization Info Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{data.organisation?.name || session.orgName}</h2>
            <span className={styles.orgCode}>{data.organisation?.orgCode || "—"}</span>
          </div>
          <div className={styles.orgInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{data.organisation?.email || session.email}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Type</span>
              <span className={styles.infoValue}>{data.organisation?.type || "—"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Registered</span>
              <span className={styles.infoValue}>
                {data.organisation?.createdAt ? formatDate(data.organisation.createdAt) : "—"}
              </span>
            </div>
          </div>
        </div>

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
              <span className={styles.statValue}>{data.stats.totalMembers}</span>
              <span className={styles.statLabel}>Total Members</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
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

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{data.stats.activeElections}</span>
              <span className={styles.statLabel}>Active Elections</span>
            </div>
          </div>
<<<<<<< HEAD

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{data.stats.totalVotes}</span>
              <span className={styles.statLabel}>Total Votes Cast</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Election Status Distribution</h3>
              <p className={styles.chartSubtitle}>Overview of election statuses</p>
            </div>
            <div className={styles.chartContent}>
              <StatusDistributionChart data={data.chartData.electionStatusDistribution} />
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Voting Activity (Last 30 Days)</h3>
              <p className={styles.chartSubtitle}>Daily voting trends</p>
            </div>
            <div className={styles.chartContent}>
              <VotesTimelineChart data={data.chartData.votesTimeline} />
            </div>
          </div>
        </div>

        {/* Election Performance Chart */}
        {data.chartData.electionPerformance.length > 0 && (
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Election Performance</h3>
              <p className={styles.chartSubtitle}>Votes and positions by election</p>
            </div>
            <div className={styles.chartContent}>
              <ElectionPerformanceChart data={data.chartData.electionPerformance} />
            </div>
          </div>
        )}

=======
        </div>

>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
        {/* Quick Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Quick Actions</h2>
          </div>
          <div className={styles.actionsGrid}>
<<<<<<< HEAD
            <Link href="/organisation/dashboard/elections/new" className={styles.actionBtn}>
=======
            <button className={styles.actionBtn} disabled>
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Create Election</span>
<<<<<<< HEAD
            </Link>
=======
              <span className={styles.comingSoon}>Coming Soon</span>
            </button>
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
            <button className={styles.actionBtn} disabled>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              <span>Manage Members</span>
              <span className={styles.comingSoon}>Coming Soon</span>
            </button>
            <button className={styles.actionBtn} disabled>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>View Reports</span>
              <span className={styles.comingSoon}>Coming Soon</span>
            </button>
          </div>
        </div>
<<<<<<< HEAD

        {/* Elections List */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Elections</h2>
            {data.stats.totalElections > 5 && (
              <Link href="/organisation/dashboard/elections" className={styles.viewAllLink}>
                View All
              </Link>
            )}
          </div>
          {elections.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
              <p>No elections created yet. Create your first election to get started.</p>
              <Link href="/organisation/dashboard/elections/new" className={styles.createBtn}>
                Create Election
              </Link>
            </div>
          ) : (
            <div className={styles.electionsList}>
              {elections.map((election) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case "DRAFT": return "#64748b";
                    case "ACTIVE": return "#10b981";
                    case "CLOSED": return "#3b82f6";
                    case "CANCELLED": return "#ef4444";
                    default: return "#64748b";
                  }
                };
                const statusColor = getStatusColor(election.status);
                return (
                  <Link
                    key={election.id}
                    href={`/organisation/dashboard/elections/${election.id}`}
                    className={styles.electionItem}
                  >
                    <div className={styles.electionInfo}>
                      <h3 className={styles.electionTitle}>{election.title}</h3>
                      <div className={styles.electionMeta}>
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
                        <span className={styles.metaText}>
                          {election._count.positions} position{election._count.positions !== 1 ? "s" : ""}
                        </span>
                        <span className={styles.metaText}>
                          {election._count.ballots} vote{election._count.ballots !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
=======
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
      </div>
    </div>
  );
}

