import React, { useState } from "react";
import { apiRequest } from "../services/api";

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
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    modal: {
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "8px",
      width: "500px",
      maxWidth: "90%",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      borderBottom: "1px solid #eee",
      paddingBottom: "10px",
    },
    title: {
      margin: 0,
      fontSize: "1.2rem",
      color: "#333",
    },
    closeButton: {
      background: "none",
      border: "none",
      fontSize: "1.5rem",
      cursor: "pointer",
      color: "#666",
    },
    formGroup: {
      marginBottom: "15px",
    },
    label: {
      display: "block",
      marginBottom: "5px",
      fontWeight: "500",
      color: "#444",
    },
    input: {
      width: "100%",
      padding: "8px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      boxSizing: "border-box",
    },
    buttonContainer: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "20px",
    },
    submitButton: {
      backgroundColor: "#FF8C00", // KeddyCRM Orange
      color: "white",
      padding: "10px 20px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    cancelButton: {
      backgroundColor: "#f0f0f0",
      color: "#333",
      padding: "10px 20px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    },
    error: {
      color: "red",
      marginBottom: "10px",
      fontSize: "0.9rem",
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            Assign Target to {employee.firstName} {employee.lastName}
          </h2>
          <button style={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Target Duration</label>
            <select
              style={styles.input}
              name="targetDuration"
              value={formData.targetDuration}
              onChange={handleChange}
              required
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Total Profile Sourcing Target</label>
            <input
              type="number"
              style={styles.input}
              name="profilesSourcingTarget"
              value={formData.profilesSourcingTarget}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Total Submission Target</label>
            <input
              type="number"
              style={styles.input}
              name="totalSubmissionTarget"
              value={formData.totalSubmissionTarget}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Total Interview Target</label>
            <input
              type="number"
              style={styles.input}
              name="interviewTarget"
              value={formData.interviewTarget}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Average Submissions Per Week Target</label>
            <input
              type="number"
              step="0.1"
              style={styles.input}
              name="avgWeeklySubmissionsTarget"
              value={formData.avgWeeklySubmissionsTarget}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Start Date</label>
            <input
              type="date"
              style={styles.input}
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>End Date (Optional)</label>
            <input
              type="date"
              style={styles.input}
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Notes</label>
            <textarea
              style={styles.input}
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div style={styles.buttonContainer}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Assigning..." : "Assign Target"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
