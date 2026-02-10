"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createElection } from "../actions";
import styles from "./newElection.module.css";

type CandidateMethod = "MANUAL" | "APPLICATION";

export default function NewElectionClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    numberOfVoters: "",
    candidateMethod: "MANUAL" as CandidateMethod,
    applicationStartDate: "",
    applicationEndDate: "",
    showRealTimeResults: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("title", formData.title);
      formDataObj.append("description", formData.description);
      formDataObj.append("startDate", formData.startDate);
      formDataObj.append("endDate", formData.endDate);
      formDataObj.append("numberOfVoters", formData.numberOfVoters);
      formDataObj.append("candidateMethod", formData.candidateMethod);
      
      if (formData.candidateMethod === "APPLICATION") {
        formDataObj.append("applicationStartDate", formData.applicationStartDate);
        formDataObj.append("applicationEndDate", formData.applicationEndDate);
      }
      formDataObj.append("showRealTimeResults", String(formData.showRealTimeResults));
      
      // Send the client's timezone offset so server can correctly parse datetime-local inputs
      const clientOffsetMinutes = new Date().getTimezoneOffset();
      formDataObj.append("clientOffsetMinutes", String(clientOffsetMinutes));

      const result = await createElection(formDataObj);

      if (result.success && result.data) {
        router.push(`/organisation/dashboard/elections/${result.data.id}`);
      } else {
        setError(result.error || "Failed to create election");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Get current datetime in format YYYY-MM-DDTHH:mm for datetime-local input
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const todayDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  
  // For min date (date only) - used for date inputs if any
  const today = `${year}-${month}-${day}`;
  
  // For end date minimum - use start date if set, otherwise use current datetime
  const minEndDate = formData.startDate || todayDateTime;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.pageTitle}>Create New Election</h1>
            <p className={styles.pageSubtitle}>Set up a new voting election for your organization</p>
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
        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
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

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Basic Information</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Election Title <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., 2024 Student Council Election"
                  required
                  maxLength={200}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Provide a brief description of this election..."
                  rows={3}
                />
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Voting Period</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Start Date & Time <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={styles.input}
                    min={todayDateTime}
                    step="60"
                    required
                  />
                  <p className={styles.hint}>
                    Select date first, then click on the time section (--:--) to set the time
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    End Date & Time <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={styles.input}
                    min={minEndDate}
                    step="60"
                    required
                  />
                  <p className={styles.hint}>
                    Select date first, then click on the time section (--:--) to set the time
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Voter Configuration</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Number of Voters <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="numberOfVoters"
                  value={formData.numberOfVoters}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., 500"
                  min="1"
                  max="100000"
                  required
                />
                <p className={styles.hint}>
                  Unique 5-character voter codes will be generated. Format: 2 org letters + 3 unique characters (e.g., AB123).
                </p>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Candidate Setup Method</h3>
              
              <div className={styles.methodSelector}>
                <label 
                  className={`${styles.methodOption} ${formData.candidateMethod === "MANUAL" ? styles.methodSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="candidateMethod"
                    value="MANUAL"
                    checked={formData.candidateMethod === "MANUAL"}
                    onChange={handleChange}
                    className={styles.radioInput}
                  />
                  <div className={styles.methodContent}>
                    <div className={styles.methodIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </div>
                    <div className={styles.methodText}>
                      <h4>Manual Setup</h4>
                      <p>You add candidates directly for each position</p>
                    </div>
                  </div>
                </label>

                <label 
                  className={`${styles.methodOption} ${formData.candidateMethod === "APPLICATION" ? styles.methodSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="candidateMethod"
                    value="APPLICATION"
                    checked={formData.candidateMethod === "APPLICATION"}
                    onChange={handleChange}
                    className={styles.radioInput}
                  />
                  <div className={styles.methodContent}>
                    <div className={styles.methodIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </div>
                    <div className={styles.methodText}>
                      <h4>Application Portal</h4>
                      <p>Members apply to become candidates, you review and approve</p>
                    </div>
                  </div>
                </label>
              </div>

              {formData.candidateMethod === "APPLICATION" && (
                <div className={styles.applicationConfig}>
                  <p className={styles.configHint}>
                    Set the period during which members can submit their candidacy applications.
                  </p>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Application Start <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="datetime-local"
                        name="applicationStartDate"
                        value={formData.applicationStartDate}
                        onChange={handleChange}
                        className={styles.input}
                        min={todayDateTime}
                        step="60"
                        required={formData.candidateMethod === "APPLICATION"}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Application End <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="datetime-local"
                        name="applicationEndDate"
                        value={formData.applicationEndDate}
                        onChange={handleChange}
                        className={styles.input}
                        min={formData.applicationStartDate || todayDateTime}
                        step="60"
                        required={formData.candidateMethod === "APPLICATION"}
                      />
                      <p className={styles.hint}>
                        Application period should end before voting starts.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Results Visibility</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxWrapper} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.showRealTimeResults}
                    onChange={(e) => setFormData({ ...formData, showRealTimeResults: e.target.checked })}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                  <span style={{ fontWeight: "500" }}>Show real-time voting results</span>
                </label>
                <p className={styles.hint} style={{ marginTop: "0.5rem" }}>
                  {formData.showRealTimeResults 
                    ? "Voters and admins can see live vote counts during the election."
                    : "Results will be hidden until you close the election and announce them."}
                </p>
              </div>
            </div>

            <div className={styles.formActions}>
              <Link href="/organisation/dashboard" className={styles.cancelBtn}>
                Cancel
              </Link>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className={styles.spinner} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Create Election
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.infoTitle}>What happens next?</h3>
          <ul className={styles.infoList}>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Unique voter codes (5 characters) will be generated and ready to print</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Add positions with customizable winner counts</span>
            </li>
            {formData.candidateMethod === "MANUAL" ? (
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Manually add candidates with photos, bios, and manifestos</span>
              </li>
            ) : (
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Create custom application forms for candidates to fill</span>
              </li>
            )}
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Activate when ready — starts in DRAFT status</span>
            </li>
          </ul>

          <div className={styles.codePreview}>
            <h4>Voter Code Format</h4>
            <div className={styles.codeExample}>
              <span className={styles.codeOrg}>AB</span>
              <span className={styles.codeMember}>123</span>
            </div>
            <p>First 2 = Org ID, Last 3 = Unique voter identifier</p>
          </div>
        </div>
      </div>
    </div>
  );
}
