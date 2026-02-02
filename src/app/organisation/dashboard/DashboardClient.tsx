"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logoutOrgAdminAction } from "./actions";
import StatusDistributionChart from "./components/StatusDistributionChart";
import VotesTimelineChart from "./components/VotesTimelineChart";
import ElectionPerformanceChart from "./components/ElectionPerformanceChart";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return "badge-ghost";
      case "ACTIVE": return "badge-success";
      case "CLOSED": return "badge-info";
      case "CANCELLED": return "badge-error";
      default: return "badge-ghost";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300">
      {/* Header */}
      <div className="navbar bg-base-100/80 backdrop-blur-lg sticky top-0 z-50 border-b border-base-content/10 px-4 lg:px-8">
        <div className="flex-1 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-base-content">Organization Dashboard</h1>
            <p className="text-xs text-base-content/60">Welcome back, {session.fullName}</p>
          </div>
        </div>
        <div className="flex-none gap-2">
          <button className="btn btn-ghost btn-sm text-error" onClick={handleLogout}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Organization Info Card */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="avatar placeholder">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
                    <span className="text-2xl font-bold">{(data.organisation?.name || session.orgName).charAt(0)}</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-base-content">{data.organisation?.name || session.orgName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge badge-primary badge-outline">{data.organisation?.orgCode || "—"}</span>
                    <span className={`badge ${data.organisation?.status === "APPROVED" ? "badge-success" : "badge-warning"}`}>
                      {data.organisation?.status || "PENDING"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-base-content/60 block">Email</span>
                  <span className="font-medium">{data.organisation?.email || session.email}</span>
                </div>
                <div>
                  <span className="text-base-content/60 block">Type</span>
                  <span className="font-medium">{data.organisation?.type || "—"}</span>
                </div>
                <div>
                  <span className="text-base-content/60 block">Registered</span>
                  <span className="font-medium">{data.organisation?.createdAt ? formatDate(data.organisation.createdAt) : "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats stats-vertical lg:stats-horizontal shadow-xl w-full mb-6 bg-base-100">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="stat-title">Total Members</div>
            <div className="stat-value text-primary">{data.stats.totalMembers}</div>
            <div className="stat-desc">Registered voters</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-success">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-title">Total Elections</div>
            <div className="stat-value text-success">{data.stats.totalElections}</div>
            <div className="stat-desc">{data.stats.activeElections} active</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-warning">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-title">Active Elections</div>
            <div className="stat-value text-warning">{data.stats.activeElections}</div>
            <div className="stat-desc">In progress</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-secondary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="stat-title">Total Votes</div>
            <div className="stat-value text-secondary">{data.stats.totalVotes}</div>
            <div className="stat-desc">Ballots cast</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-base">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
                Election Status Distribution
              </h3>
              <p className="text-sm text-base-content/60 mb-2">Overview of election statuses</p>
              <div className="h-64">
                <StatusDistributionChart data={data.chartData.electionStatusDistribution} />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-base">
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Voting Activity (Last 30 Days)
              </h3>
              <p className="text-sm text-base-content/60 mb-2">Daily voting trends</p>
              <div className="h-64">
                <VotesTimelineChart data={data.chartData.votesTimeline} />
              </div>
            </div>
          </div>
        </div>

        {/* Election Performance Chart */}
        {data.chartData.electionPerformance.length > 0 && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h3 className="card-title text-base">
                <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Election Performance
              </h3>
              <p className="text-sm text-base-content/60 mb-2">Votes and positions by election</p>
              <div className="h-64">
                <ElectionPerformanceChart data={data.chartData.electionPerformance} />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title text-base mb-4">
              <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/organisation/dashboard/elections/new" className="btn btn-primary btn-lg gap-2 justify-start h-auto py-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <div className="text-left">
                  <div className="font-bold">Create Election</div>
                  <div className="text-xs opacity-80 font-normal">Set up a new election</div>
                </div>
              </Link>
              
              <button className="btn btn-outline btn-lg gap-2 justify-start h-auto py-4" disabled>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div className="text-left">
                  <div className="font-bold">Manage Members</div>
                  <div className="text-xs opacity-60 font-normal">Coming Soon</div>
                </div>
              </button>
              
              <button className="btn btn-outline btn-lg gap-2 justify-start h-auto py-4" disabled>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-left">
                  <div className="font-bold">View Reports</div>
                  <div className="text-xs opacity-60 font-normal">Coming Soon</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Elections */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title text-base">
                <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Recent Elections
              </h3>
              {data.stats.totalElections > 5 && (
                <Link href="/organisation/dashboard/elections" className="btn btn-ghost btn-sm">
                  View All
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>

            {elections.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
                  <svg className="w-10 h-10 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-base-content/60 mb-2">No elections yet</h3>
                <p className="text-base-content/40 mb-4">Create your first election to get started.</p>
                <Link href="/organisation/dashboard/elections/new" className="btn btn-primary">
                  Create Election
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Election</th>
                      <th>Status</th>
                      <th>Positions</th>
                      <th>Votes</th>
                      <th>Dates</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {elections.map((election) => (
                      <tr key={election.id} className="hover">
                        <td>
                          <div className="font-bold">{election.title}</div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(election.status)}`}>
                            {election.status}
                          </span>
                        </td>
                        <td>{election._count.positions}</td>
                        <td>{election._count.ballots}</td>
                        <td>
                          <div className="text-sm">
                            <div>{formatDate(election.startDate)}</div>
                            <div className="text-base-content/60">to {formatDate(election.endDate)}</div>
                          </div>
                        </td>
                        <td>
                          <Link 
                            href={`/organisation/dashboard/elections/${election.id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
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
    </div>
  );
}
