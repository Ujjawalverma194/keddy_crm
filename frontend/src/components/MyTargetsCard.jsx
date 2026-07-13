import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function MyTargetsCard() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const response = await apiRequest("/api/targets/my-targets", "GET");
        if (Array.isArray(response)) {
          setTargets(response);
        }
      } catch (err) {
        console.error("Failed to fetch targets", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTargets();
  }, []);

  const styles = {
    card: {
      backgroundColor: "#fff",
      borderRadius: "10px",
      padding: "20px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      marginBottom: "20px",
      borderLeft: "5px solid #FF8C00", // KeddyCRM Orange
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
      borderBottom: "1px solid #f0f0f0",
      paddingBottom: "10px",
    },
    title: {
      fontSize: "1.2rem",
      fontWeight: "bold",
      color: "#333",
      margin: 0,
    },
    badge: {
      backgroundColor: "#fff3e0",
      color: "#FF8C00",
      padding: "4px 8px",
      borderRadius: "12px",
      fontSize: "0.8rem",
      fontWeight: "bold",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "20px",
    },
    metric: {
      display: "flex",
      flexDirection: "column",
    },
    metricLabel: {
      fontSize: "0.9rem",
      color: "#666",
      marginBottom: "5px",
    },
    metricValue: {
      fontSize: "1.1rem",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "8px",
    },
    progressBarContainer: {
      width: "100%",
      backgroundColor: "#e0e0e0",
      borderRadius: "4px",
      height: "8px",
      overflow: "hidden",
    },
    progressBar: (percentage, statusColor) => ({
      height: "100%",
      backgroundColor: statusColor,
      width: `${Math.min(percentage, 100)}%`,
      transition: "width 0.3s ease",
    }),
    statusBadge: (status) => ({
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "0.8rem",
      fontWeight: "bold",
      marginTop: "10px",
      backgroundColor: status === "COMPLETED" ? "#e8f5e9" : status === "BEHIND" ? "#ffebee" : "#e3f2fd",
      color: status === "COMPLETED" ? "#2e7d32" : status === "BEHIND" ? "#c62828" : "#1565c0",
    }),
  };

  if (loading) {
    return <div style={styles.card}>Loading Targets...</div>;
  }

  if (targets.length === 0) {
    return null; // Don't show anything if there are no active targets
  }

  return (
    <>
      {targets.map((target) => (
        <div key={target.id} style={styles.card}>
          <div style={styles.header}>
            <h3 style={styles.title}>My Targets</h3>
            <span style={styles.badge}>{target.targetDuration} TARGET</span>
          </div>

          <div style={styles.grid}>
            {target.profilesSourcingTarget > 0 && (
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Profile Sourcing</span>
                <span style={styles.metricValue}>
                  {target.progress?.profileSourcing || 0} / {target.profilesSourcingTarget}
                </span>
                <div style={styles.progressBarContainer}>
                  <div
                    style={styles.progressBar(
                      ((target.progress?.profileSourcing || 0) / target.profilesSourcingTarget) * 100,
                      (target.progress?.profileSourcing || 0) >= target.profilesSourcingTarget ? "#4caf50" : "#FF8C00"
                    )}
                  />
                </div>
              </div>
            )}

            {target.totalSubmissionTarget > 0 && (
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Submissions</span>
                <span style={styles.metricValue}>
                  {target.progress?.submissions || 0} / {target.totalSubmissionTarget}
                </span>
                <div style={styles.progressBarContainer}>
                  <div
                    style={styles.progressBar(
                      ((target.progress?.submissions || 0) / target.totalSubmissionTarget) * 100,
                      (target.progress?.submissions || 0) >= target.totalSubmissionTarget ? "#4caf50" : "#FF8C00"
                    )}
                  />
                </div>
              </div>
            )}

            {target.interviewTarget > 0 && (
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Interviews</span>
                <span style={styles.metricValue}>
                  {target.progress?.interviews || 0} / {target.interviewTarget}
                </span>
                <div style={styles.progressBarContainer}>
                  <div
                    style={styles.progressBar(
                      ((target.progress?.interviews || 0) / target.interviewTarget) * 100,
                      (target.progress?.interviews || 0) >= target.interviewTarget ? "#4caf50" : "#FF8C00"
                    )}
                  />
                </div>
              </div>
            )}

            {target.avgWeeklySubmissionsTarget > 0 && (
              <div style={styles.metric}>
                <span style={styles.metricLabel}>Avg Weekly Submissions</span>
                <span style={styles.metricValue}>
                  {target.progress?.avgWeeklySubmissions || 0} / {target.avgWeeklySubmissionsTarget}
                </span>
                <div style={styles.progressBarContainer}>
                  <div
                    style={styles.progressBar(
                      ((target.progress?.avgWeeklySubmissions || 0) / target.avgWeeklySubmissionsTarget) * 100,
                      (target.progress?.avgWeeklySubmissions || 0) >= target.avgWeeklySubmissionsTarget ? "#4caf50" : "#FF8C00"
                    )}
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            <span style={styles.statusBadge(target.calculatedStatus)}>
              {target.calculatedStatus === 'ACTIVE' ? 'IN PROGRESS' : target.calculatedStatus}
            </span>
          </div>
        </div>
      ))}
      <div style={{ textAlign: "right", marginTop: "15px" }}>
        <a href="/employee/target-history" style={{ color: "#FF8C00", fontWeight: "bold", textDecoration: "none", fontSize: "0.9rem" }}>
          View Target History →
        </a>
      </div>
    </>
  );
}
