"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import { approveOrganisation, rejectOrganisation, handleLogout, generateOrgCodeForOrg, deleteOrganisation } from "./actions";

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
  const [activeTab, setActiveTab] = useState<"overview" | "organisations" | "logs" | "settings">("overview");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

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

  async function onDelete(orgId: string, orgName: string) {
    const confirm = window.confirm(
      `Are you sure you want to delete "${orgName}"?\n\nThis action will permanently delete all organisation data.\n\nThis action CANNOT be undone.`
    );
    
    if (!confirm) return;
    
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
    switch (status) {
      case "PENDING": return "badge-warning";
      case "APPROVED": return "badge-success";
      case "REJECTED": return "badge-error";
      default: return "badge-ghost";
    }
  };

  // Filter organisations
  const filteredOrgs = data.recentOrganisations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          org.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-base-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-base-200 border-r border-base-300 flex flex-col">
        <div className="p-6 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold">SafeVote</h1>
              <p className="text-xs opacity-60">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="menu gap-1">
            <li>
              <button
                onClick={() => setActiveTab("overview")}
                className={activeTab === "overview" ? "active" : ""}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Overview
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("organisations")}
                className={activeTab === "organisations" ? "active" : ""}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Organisations
                {data.stats.pendingOrganisations > 0 && (
                  <span className="badge badge-error badge-sm">{data.stats.pendingOrganisations}</span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("logs")}
                className={activeTab === "logs" ? "active" : ""}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Activity Logs
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("settings")}
                className={activeTab === "settings" ? "active" : ""}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-base-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="avatar placeholder">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <span className="text-sm font-bold">{session.fullName.charAt(0)}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{session.fullName}</p>
              <p className="text-xs opacity-60 truncate">{session.email}</p>
            </div>
          </div>
          <button 
            className="btn btn-error btn-outline btn-sm w-full gap-2"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-base-100/80 backdrop-blur-lg border-b border-base-300 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "organisations" && "Manage Organisations"}
                {activeTab === "logs" && "Activity Logs"}
                {activeTab === "settings" && "System Settings"}
              </h1>
              <p className="text-sm opacity-60">
                {activeTab === "overview" && "Platform statistics and recent activity"}
                {activeTab === "organisations" && "Review and manage organisation registrations"}
                {activeTab === "logs" && "Track all administrative actions"}
                {activeTab === "settings" && "Configure system preferences"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="badge badge-success badge-outline gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                System Operational
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <>
              {/* Stats Grid */}
              <div className="stats stats-vertical lg:stats-horizontal shadow-xl w-full mb-8">
                <div className="stat">
                  <div className="stat-figure text-emerald-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="stat-title">Total Organisations</div>
                  <div className="stat-value text-emerald-500">{data.stats.totalOrganisations}</div>
                  <div className="stat-desc">{data.stats.approvedOrganisations} approved</div>
                </div>

                <div className="stat">
                  <div className="stat-figure text-amber-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-title">Pending Approval</div>
                  <div className="stat-value text-amber-500">{data.stats.pendingOrganisations}</div>
                  <div className="stat-desc">Awaiting review</div>
                </div>

                <div className="stat">
                  <div className="stat-figure text-blue-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="stat-title">Total Members</div>
                  <div className="stat-value text-blue-500">{data.stats.totalMembers}</div>
                  <div className="stat-desc">Across all orgs</div>
                </div>

                <div className="stat">
                  <div className="stat-figure text-purple-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-title">Total Elections</div>
                  <div className="stat-value text-purple-500">{data.stats.totalElections}</div>
                  <div className="stat-desc">All time</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button 
                  onClick={() => setActiveTab("organisations")}
                  className="card shadow-lg card-hover cursor-pointer"
                >
                  <div className="card-body items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold">Review Pending</h3>
                    <p className="text-sm opacity-60">{data.stats.pendingOrganisations} organisations waiting</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => setActiveTab("logs")}
                  className="card shadow-lg card-hover cursor-pointer"
                >
                  <div className="card-body items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="font-bold">View Activity</h3>
                    <p className="text-sm opacity-60">Recent admin actions</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => setActiveTab("settings")}
                  className="card shadow-lg card-hover cursor-pointer"
                >
                  <div className="card-body items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold">System Settings</h3>
                    <p className="text-sm opacity-60">Configure platform</p>
                  </div>
                </button>
              </div>

              {/* Recent Organisations Card */}
              <div className="card shadow-xl">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="card-title">Recent Organisations</h2>
                    <button 
                      className="btn btn-ghost btn-sm gap-1"
                      onClick={() => setActiveTab("organisations")}
                    >
                      View All
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="table table-zebra hover">
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
                        {data.recentOrganisations.slice(0, 5).map((org) => (
                          <tr key={org.id}>
                            <td>
                              <div>
                                <div className="font-bold">{org.name}</div>
                                <div className="text-sm opacity-60">{org.email}</div>
                              </div>
                            </td>
                            <td>{org.type || "—"}</td>
                            <td>{org._count.members}</td>
                            <td>
                              {org.orgCode ? (
                                <code className="bg-base-300 px-2 py-1 rounded text-xs">{org.orgCode}</code>
                              ) : "—"}
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadge(org.status)}`}>{org.status}</span>
                            </td>
                            <td className="text-sm">{formatDate(org.createdAt)}</td>
                            <td>
                              <div className="flex flex-wrap gap-1">
                                <Link 
                                  href={`/superadmin/dashboard/org/${org.id}`}
                                  className="btn btn-ghost btn-xs"
                                >
                                  View
                                </Link>
                                {org.status === "PENDING" && (
                                  <>
                                    <button className="btn btn-success btn-xs" onClick={() => onApprove(org.id)}>
                                      Approve
                                    </button>
                                    <button className="btn btn-error btn-xs" onClick={() => onReject(org.id)}>
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {data.recentOrganisations.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-8 opacity-60">
                              No organisations yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Organisations Tab */}
          {activeTab === "organisations" && (
            <div className="card shadow-xl">
              <div className="card-body">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h2 className="card-title">All Organisations</h2>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search organisations..."
                      className="input input-bordered input-sm w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <select
                      className="select select-bordered select-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                      <option value="ALL">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="table table-zebra hover">
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
                      {filteredOrgs.map((org) => (
                        <tr key={org.id}>
                          <td>
                            <div>
                              <div className="font-bold">{org.name}</div>
                              <div className="text-sm opacity-60">{org.email}</div>
                            </div>
                          </td>
                          <td>{org.type || "—"}</td>
                          <td>{org._count.members}</td>
                          <td>{org._count.elections}</td>
                          <td>
                            {org.orgCode ? (
                              <code className="bg-base-300 px-2 py-1 rounded text-xs">{org.orgCode}</code>
                            ) : "—"}
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(org.status)}`}>{org.status}</span>
                          </td>
                          <td className="text-sm">{formatDate(org.createdAt)}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              <Link 
                                href={`/superadmin/dashboard/org/${org.id}`}
                                className="btn btn-ghost btn-xs"
                              >
                                View
                              </Link>
                              {org.status === "PENDING" && (
                                <>
                                  <button className="btn btn-success btn-xs" onClick={() => onApprove(org.id)}>
                                    Approve
                                  </button>
                                  <button className="btn btn-error btn-xs" onClick={() => onReject(org.id)}>
                                    Reject
                                  </button>
                                </>
                              )}
                              {!org.orgCode && org.status === "APPROVED" && (
                                <button className="btn btn-info btn-xs" onClick={() => onGenerateCode(org.id)}>
                                  Gen Code
                                </button>
                              )}
                              <button 
                                className="btn btn-error btn-outline btn-xs"
                                onClick={() => onDelete(org.id, org.name)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredOrgs.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 opacity-60">
                            No organisations found
                          </td>
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
            <div className="card shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {data.recentLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-base-200">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        log.action.includes("LOGIN") ? "bg-blue-500/20 text-blue-500" :
                        log.action.includes("APPROVE") ? "bg-emerald-500/20 text-emerald-500" :
                        log.action.includes("REJECT") ? "bg-red-500/20 text-red-500" :
                        "bg-base-300 opacity-60"
                      }`}>
                        {log.action.includes("LOGIN") && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                        )}
                        {log.action.includes("APPROVE") && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {log.action.includes("REJECT") && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {log.action === "LOGOUT" && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{log.action.replace(/_/g, " ")}</p>
                        <p className="text-sm opacity-60">
                          by {log.admin.fullName} • {formatDate(log.createdAt)}
                        </p>
                        {log.details && (
                          <p className="text-sm opacity-40 mt-1">{log.details}</p>
                        )}
                      </div>
                      {log.ipAddress && (
                        <code className="text-xs bg-base-300 px-2 py-1 rounded">{log.ipAddress}</code>
                      )}
                    </div>
                  ))}
                  {data.recentLogs.length === 0 && (
                    <div className="text-center py-12 opacity-60">
                      No activity logs yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="card shadow-xl">
                <div className="card-body">
                  <h2 className="card-title mb-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Appearance
                  </h2>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Theme Settings</span>
                    </label>
                    <p className="text-sm opacity-60 mb-4">Customize the look and feel of the admin panel</p>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
              
              <div className="card shadow-xl">
                <div className="card-body">
                  <h2 className="card-title mb-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Security
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm opacity-60">Add an extra layer of security</p>
                      </div>
                      <input type="checkbox" className="toggle toggle-success" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                      <div>
                        <p className="font-medium">Session Timeout</p>
                        <p className="text-sm opacity-60">Auto-logout after inactivity</p>
                      </div>
                      <select className="select select-bordered select-sm">
                        <option>15 minutes</option>
                        <option>30 minutes</option>
                        <option selected>1 hour</option>
                        <option>4 hours</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                      <div>
                        <p className="font-medium">Login Notifications</p>
                        <p className="text-sm opacity-60">Get notified of new logins</p>
                      </div>
                      <input type="checkbox" className="toggle toggle-success" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card shadow-xl">
                <div className="card-body">
                  <h2 className="card-title mb-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    System Information
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-base-200 rounded-lg">
                      <p className="text-sm opacity-60">Version</p>
                      <p className="font-medium">SafeVote v2.0.0</p>
                    </div>
                    <div className="p-4 bg-base-200 rounded-lg">
                      <p className="text-sm opacity-60">Environment</p>
                      <p className="font-medium">Production</p>
                    </div>
                    <div className="p-4 bg-base-200 rounded-lg">
                      <p className="text-sm opacity-60">Database</p>
                      <p className="font-medium">PostgreSQL</p>
                    </div>
                    <div className="p-4 bg-base-200 rounded-lg">
                      <p className="text-sm opacity-60">Uptime</p>
                      <p className="font-medium">99.9%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
