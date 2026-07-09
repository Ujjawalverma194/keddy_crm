import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BaseLayout from "../components/emp_base";
import { apiRequest } from "../../services/api";

const format12Hour = (timeStr) => {
    if (!timeStr) return "N/A";
    const [h, m] = timeStr.split(':');
    if (!h || !m) return timeStr;
    let hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${suffix}`;
};

export default function AddEod() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [eods, setEods] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    reportingTime: "",
    tasksCompleted: "",
    issuesFaced: "",
    resolutionSteps: "",
    logoutTime: "",
  });
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  const notify = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const fetchMyEods = async () => {
    try {
      const response = await apiRequest("/employee-portal/api/eod/my-eods/", "GET");
      if (response && response.results) {
        setEods(response.results);
      }
    } catch (err) {
      console.error("Failed to fetch EODs", err);
    }
  };

  const fetchEodDetails = async () => {
    try {
      const response = await apiRequest(`/employee-portal/api/eod/${id}/`, "GET");
      if (response && response.id) {
        setFormData({
          date: response.date,
          reportingTime: response.reportingTime || "",
          tasksCompleted: response.tasksCompleted || "",
          issuesFaced: response.issuesFaced || "",
          resolutionSteps: response.resolutionSteps || "",
          logoutTime: response.logoutTime || "",
        });
      }
    } catch (err) {
      notify("Failed to fetch EOD details", "error");
    }
  };

  useEffect(() => {
    fetchMyEods();
    if (id) {
      fetchEodDetails();
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        reportingTime: "",
        tasksCompleted: "",
        issuesFaced: "",
        resolutionSteps: "",
        logoutTime: "",
      });
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await apiRequest(`/employee-portal/api/eod/${id}/`, "PUT", formData);
        notify("EOD updated successfully!");
        setTimeout(() => navigate("/employee/add-eod"), 1500);
      } else {
        await apiRequest("/employee-portal/api/eod/", "POST", formData);
        notify("EOD submitted successfully!");
        setFormData({
          date: new Date().toISOString().split("T")[0],
          reportingTime: "",
          tasksCompleted: "",
          issuesFaced: "",
          resolutionSteps: "",
          logoutTime: "",
        });
        fetchMyEods();
      }
    } catch (err) {
      notify(id ? "Failed to update EOD" : "Failed to submit EOD", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseLayout>
      {toast.show && (
        <div style={{...styles.toast, backgroundColor: toast.type === "error" ? "#EF4444" : "#27AE60"}}>
          {toast.msg}
        </div>
      )}

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{id ? "Edit End of Day (EOD) Report" : "Submit End of Day (EOD) Report"}</h2>
          <p style={styles.subtitle}>Log your daily tasks, issues, and timings.</p>
        </div>
      </div>

      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit} style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Date *</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required style={styles.input} />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Reporting Time *</label>
            <input type="time" name="reportingTime" value={formData.reportingTime} onChange={handleChange} required style={styles.input} />
          </div>

          <div style={{...styles.formGroup, gridColumn: "1 / -1"}}>
            <label style={styles.label}>Tasks Completed </label>
            <textarea name="tasksCompleted" value={formData.tasksCompleted} onChange={handleChange} required rows={5} style={styles.textarea} placeholder="" />
          </div>

          <div style={{...styles.formGroup, gridColumn: "1 / -1"}}>
            <label style={styles.label}>Issues Faced Today</label>
            <textarea name="issuesFaced" value={formData.issuesFaced} onChange={handleChange} rows={3} style={styles.textarea} placeholder="Any blockers or issues faced today? (Enter NA if none)" />
          </div>

          <div style={{...styles.formGroup, gridColumn: "1 / -1"}}>
            <label style={styles.label}>Resolution Steps / Tomorrow's Plan</label>
            <textarea name="resolutionSteps" value={formData.resolutionSteps} onChange={handleChange} rows={3} style={styles.textarea} placeholder="How will you resolve the issues, or what is the plan for tomorrow?" />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Log Out Time *</label>
            <input type="time" name="logoutTime" value={formData.logoutTime} onChange={handleChange} required style={styles.input} />
          </div>

          <div style={{...styles.formGroup, gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end"}}>
            {id && (
              <button type="button" onClick={() => navigate("/employee/add-eod")} style={{...styles.submitBtn, backgroundColor: '#64748B', marginRight: '10px'}}>
                Cancel
              </button>
            )}
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? (id ? "Updating..." : "Submitting...") : (id ? "Update EOD Report" : "Submit EOD Report")}
            </button>
          </div>
        </form>
      </div>

      <div style={styles.header}>
        <h2 style={styles.title}>My Past EOD Reports</h2>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Reporting Time</th>
              <th style={styles.th}>Tasks Completed</th>
              <th style={styles.th}>Issues Faced</th>
              <th style={styles.th}>Tomorrow's Plan</th>
              <th style={styles.th}>Log Out Time</th>
              <th style={{...styles.th, textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {eods.length > 0 ? (
              eods.map((eod) => (
                <tr key={eod.id} style={styles.tr}>
                  <td style={styles.td}>{eod.date}</td>
                  <td style={styles.td}>{format12Hour(eod.reportingTime)}</td>
                  <td style={styles.td}><pre style={styles.pre}>{eod.tasksCompleted}</pre></td>
                  <td style={styles.td}><pre style={styles.pre}>{eod.issuesFaced}</pre></td>
                  <td style={styles.td}><pre style={styles.pre}>{eod.resolutionSteps}</pre></td>
                  <td style={styles.td}>{format12Hour(eod.logoutTime)}</td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <button onClick={() => navigate(`/employee/edit-eod/${eod.id}`)} style={styles.editBtn}>Edit</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{...styles.td, textAlign: "center", color: "#64748B"}}>No EOD reports found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </BaseLayout>
  );
}

const styles = {
  header: { marginBottom: '20px', marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: '800', color: '#1E293B', margin: '0 0 5px 0' },
  subtitle: { fontSize: '13px', color: '#64748B', margin: 0 },
  formContainer: { background: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  input: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' },
  textarea: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  submitBtn: { padding: '10px 20px', backgroundColor: '#4834D4', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
  tableContainer: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748B', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #E2E8F0' },
  td: { padding: '15px', fontSize: '13px', color: '#334155', verticalAlign: 'top' },
  pre: { margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', fontSize: '13px', color: '#334155' },
  toast: { position: 'fixed', bottom: '20px', right: '20px', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', zIndex: 9999, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  editBtn: { padding: '6px 12px', backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }
};
