import React, { useState } from "react";
import { apiRequest } from "../services/api";
import { Target, X, Calendar, Crosshair, FileText } from "lucide-react";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AssignTargetModal({ employee, onClose, onAssign }) {
  const [formData, setFormData] = useState({
    targetDuration: "DAILY",
    profilesSourcingTarget: "",
    totalSubmissionTarget: "",
    interviewTarget: "",
    avgWeeklySubmissionsTarget: "",
    startDate: formatDate(new Date()),
    endDate: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/api/targets/assign", "POST", {
        userId: employee.id,
        ...formData,
      });
      if (response && response.detail && !response.id) {
          setError(response.detail);
      } else {
          onAssign(); // Refresh data callback
          onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to assign target");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      padding: "20px",
      boxSizing: "border-box",
    },
    modal: {
      backgroundColor: "#fff",
      borderRadius: "24px",
      width: "600px",
      maxWidth: "100%",
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
    },
    header: {
      padding: "24px",
      borderBottom: "1px solid #EEF1F5",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      background: "#fff",
    },
    headerLeft: {
      display: "flex",
      gap: "14px",
      alignItems: "center",
    },
    headerIcon: {
      width: "48px",
      height: "48px",
      borderRadius: "16px",
      background: "#FFF2EA",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "#FF6B2C",
    },
    titleWrapper: {
      display: "flex",
      flexDirection: "column",
    },
    title: {
      margin: 0,
      fontSize: "20px",
      color: "#20242A",
      fontWeight: "900",
      letterSpacing: "-0.5px",
    },
    subtitle: {
      margin: "4px 0 0",
      fontSize: "13px",
      color: "#64748B",
      fontWeight: "600",
    },
    closeButton: {
      background: "#F8FAFC",
      border: "1px solid #E2E8F0",
      width: "36px",
      height: "36px",
      borderRadius: "10px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      color: "#64748B",
      transition: "all 0.2s",
    },
    scrollArea: {
      padding: "24px",
      overflowY: "auto",
      flex: 1,
    },
    error: {
      backgroundColor: "#FEF2F2",
      color: "#EF4444",
      padding: "12px 16px",
      borderRadius: "12px",
      marginBottom: "20px",
      fontSize: "14px",
      fontWeight: "600",
      border: "1px solid #FEE2E2",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    sectionTitle: {
      fontSize: "13px",
      fontWeight: "800",
      color: "#25343F",
      textTransform: "uppercase",
      letterSpacing: "1px",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
      marginBottom: "24px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    formGroupFull: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      gridColumn: "1 / -1",
    },
    label: {
      fontSize: "13px",
      fontWeight: "800",
      color: "#475569",
    },
    inputShell: {
      borderRadius: "12px",
      border: "1px solid #E2E8F0",
      background: "#F8FAFC",
      padding: "0 14px",
      minHeight: "46px",
      display: "flex",
      alignItems: "center",
      transition: "border-color 0.2s",
    },
    input: {
      width: "100%",
      border: "none",
      background: "transparent",
      outline: "none",
      fontSize: "14px",
      color: "#1E293B",
      fontWeight: "600",
      fontFamily: "inherit",
    },
    select: {
      width: "100%",
      border: "none",
      background: "transparent",
      outline: "none",
      fontSize: "14px",
      color: "#1E293B",
      fontWeight: "700",
      cursor: "pointer",
    },
    textareaShell: {
      borderRadius: "12px",
      border: "1px solid #E2E8F0",
      background: "#F8FAFC",
      padding: "14px",
      transition: "border-color 0.2s",
    },
    textarea: {
      width: "100%",
      border: "none",
      background: "transparent",
      outline: "none",
      fontSize: "14px",
      color: "#1E293B",
      fontWeight: "600",
      resize: "vertical",
      minHeight: "80px",
      fontFamily: "inherit",
    },
    footer: {
      padding: "20px 24px",
      borderTop: "1px solid #EEF1F5",
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      background: "#FAFCFF",
    },
    cancelBtn: {
      padding: "12px 24px",
      borderRadius: "12px",
      border: "1px solid #E2E8F0",
      background: "#fff",
      color: "#475569",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
    },
    submitBtn: {
      padding: "12px 28px",
      borderRadius: "12px",
      border: "none",
      background: "linear-gradient(135deg, #FF9B51, #FF5E2F)",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "800",
      cursor: "pointer",
      boxShadow: "0 8px 16px rgba(255, 94, 47, 0.2)",
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>
              <Target size={24} />
            </div>
            <div style={styles.titleWrapper}>
              <h2 style={styles.title}>Assign Target</h2>
              <p style={styles.subtitle}>
                Set goals for {employee.firstName} {employee.lastName}
              </p>
            </div>
          </div>
          <button style={styles.closeButton} onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div style={styles.scrollArea}>
          {error && (
            <div style={styles.error}>
              <Crosshair size={18} /> {error}
            </div>
          )}

          <form id="assign-target-form" onSubmit={handleSubmit}>
            <div style={styles.sectionTitle}>
              <Calendar size={16} color="#94A3B8" /> Timeline & Duration
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Duration</label>
                <div style={styles.inputShell}>
                  <select style={styles.select} name="targetDuration" value={formData.targetDuration} onChange={handleChange} required>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Start Date</label>
                <div style={styles.inputShell}>
                  <input type="date" style={styles.input} name="startDate" value={formData.startDate} onChange={handleChange} required />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>End Date (Optional)</label>
                <div style={styles.inputShell}>
                  <input type="date" style={styles.input} name="endDate" value={formData.endDate} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div style={styles.sectionTitle}>
              <Target size={16} color="#94A3B8" /> Target Metrics
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Profiles Sourcing</label>
                <div style={styles.inputShell}>
                  <input type="number" style={styles.input} name="profilesSourcingTarget" value={formData.profilesSourcingTarget} onChange={handleChange} min="0" placeholder="0" />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Total Submissions</label>
                <div style={styles.inputShell}>
                  <input type="number" style={styles.input} name="totalSubmissionTarget" value={formData.totalSubmissionTarget} onChange={handleChange} min="0" placeholder="0" />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Total Interviews</label>
                <div style={styles.inputShell}>
                  <input type="number" style={styles.input} name="interviewTarget" value={formData.interviewTarget} onChange={handleChange} min="0" placeholder="0" />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Avg Weekly Submissions</label>
                <div style={styles.inputShell}>
                  <input type="number" step="0.1" style={styles.input} name="avgWeeklySubmissionsTarget" value={formData.avgWeeklySubmissionsTarget} onChange={handleChange} min="0" placeholder="0.0" />
                </div>
              </div>
            </div>

            <div style={styles.sectionTitle}>
              <FileText size={16} color="#94A3B8" /> Additional Notes
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroupFull}>
                <div style={styles.textareaShell}>
                  <textarea style={styles.textarea} name="notes" value={formData.notes} onChange={handleChange} placeholder="Any specific instructions or context for this target..." />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div style={styles.footer}>
          <button type="button" style={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" form="assign-target-form" style={{...styles.submitBtn, opacity: loading ? 0.7 : 1}} disabled={loading}>
            {loading ? "Assigning..." : "Assign Target"}
          </button>
        </div>
      </div>
    </div>
  );
}
