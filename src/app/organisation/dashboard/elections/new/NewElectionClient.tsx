"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createElection } from "../actions";
import styles from "./newElection.module.css";

export default function NewElectionClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    numberOfVoters: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("title", formData.title);
      formDataObj.append("startDate", formData.startDate);
      formDataObj.append("endDate", formData.endDate);
      formDataObj.append("numberOfVoters", formData.numberOfVoters);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];
  const minEndDate = formData.startDate || today;

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
                  min={today}
                  required
                />
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
                  required
                />
              </div>
            </div>

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
                This will generate unique voter codes for each voter. Voters will use these codes to create their accounts and participate in the election.
              </p>
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
              <span>Voter codes will be automatically generated for all specified voters</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>You can add positions and candidates after creating the election</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Election will start in DRAFT status until you activate it</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

