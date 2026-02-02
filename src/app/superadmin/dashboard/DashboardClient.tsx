"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-base-100/50 backdrop-blur-lg border-r border-base-content/10 flex flex-col">
        <div className="p-6 border-b border-base-content/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-base-content">SafeVote</h1>
              <p className="text-xs text-base-content/60">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="menu bg-transparent w-full gap-1">
            <li>
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-3 ${activeTab === "overview" ? "active bg-primary text-primary-content" : ""}`}
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
                className={`flex items-center gap-3 ${activeTab === "organisations" ? "active bg-primary text-primary-content" : ""}`}
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
                className={`flex items-center gap-3 ${activeTab === "logs" ? "active bg-primary text-primary-content" : ""}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Activity Logs
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-base-content/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="avatar placeholder">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-content">
                <span className="text-sm font-bold">{session.fullName.charAt(0)}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-base-content truncate">{session.fullName}</p>
              <p className="text-xs text-base-content/60 truncate">{session.email}</p>
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
        <header className="sticky top-0 z-40 bg-base-100/80 backdrop-blur-lg border-b border-base-content/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-base-content">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "organisations" && "Manage Organisations"}
                {activeTab === "logs" && "Activity Logs"}
              </h1>
              <p className="text-sm text-base-content/60">
                {activeTab === "overview" && "Platform statistics and recent activity"}
                {activeTab === "organisations" && "Review and manage organisation registrations"}
                {activeTab === "logs" && "Track all administrative actions"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="badge badge-success badge-outline gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                System Operational
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <>
              {/* Stats Grid */}
              <div className="stats stats-vertical lg:stats-horizontal shadow-xl w-full mb-8 bg-base-100">
                <div className="stat">
                  <div className="stat-figure text-primary">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="stat-title">Total Organisations</div>
                  <div className="stat-value text-primary">{data.stats.totalOrganisations}</div>
                  <div className="stat-desc">{data.stats.approvedOrganisations} approved</div>
                </div>

                <div className="stat">
                  <div className="stat-figure text-warning">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-title">Pending Approval</div>
                  <div className="stat-value text-warning">{data.stats.pendingOrganisations}</div>
                  <div className="stat-desc">Awaiting review</div>
                </div>

                <div className="stat">
                  <div className="stat-figure text-success">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="stat-title">Total Members</div>
                  <div className="stat-value text-success">{data.stats.totalMembers}</div>
                  <div className="stat-desc">Across all orgs</div>
                </div>

                <div className="stat">
                  <div className="stat-figure text-secondary">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-title">Total Elections</div>
                  <div className="stat-value text-secondary">{data.stats.totalElections}</div>
                  <div className="stat-desc">All time</div>
                </div>
              </div>

              {/* Recent Organisations Card */}
              <div className="card bg-base-100 shadow-xl">
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
                    <table className="table table-zebra">
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
                                <div className="text-sm text-base-content/60">{org.email}</div>
                              </div>
                            </td>
                            <td>{org.type || "—"}</td>
                            <td>{org._count.members}</td>
                            <td>
                              {org.orgCode ? (
                                <code className="bg-base-200 px-2 py-1 rounded text-xs">{org.orgCode}</code>
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
                                {!org.orgCode && (
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
                        {data.recentOrganisations.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-base-content/60">
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
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">All Organisations</h2>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
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
                            <div>
                              <div className="font-bold">{org.name}</div>
                              <div className="text-sm text-base-content/60">{org.email}</div>
                            </div>
                          </td>
                          <td>{org.type || "—"}</td>
                          <td>{org._count.members}</td>
                          <td>{org._count.elections}</td>
                          <td>
                            {org.orgCode ? (
                              <code className="bg-base-200 px-2 py-1 rounded text-xs">{org.orgCode}</code>
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
                              {!org.orgCode && (
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
                      {data.recentOrganisations.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-base-content/60">
                            No organisations yet
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
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {data.recentLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-base-200 hover:bg-base-300 transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        log.action.includes("LOGIN") ? "bg-info/20 text-info" :
                        log.action.includes("APPROVE") ? "bg-success/20 text-success" :
                        log.action.includes("REJECT") ? "bg-error/20 text-error" :
                        "bg-base-300 text-base-content/60"
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
                        <p className="font-medium text-base-content">{log.action.replace(/_/g, " ")}</p>
                        <p className="text-sm text-base-content/60">
                          by {log.admin.fullName} • {formatDate(log.createdAt)}
                        </p>
                        {log.details && (
                          <p className="text-sm text-base-content/40 mt-1">{log.details}</p>
                        )}
                      </div>
                      {log.ipAddress && (
                        <code className="text-xs bg-base-300 px-2 py-1 rounded">{log.ipAddress}</code>
                      )}
                    </div>
                  ))}
                  {data.recentLogs.length === 0 && (
                    <div className="text-center py-12 text-base-content/60">
                      No activity logs yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
