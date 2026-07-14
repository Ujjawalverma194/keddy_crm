import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BaseLayout from "../components/emp_base";
import { apiRequest } from "../../services/api";
import { Calendar, Clock, CheckCircle, AlertTriangle, ArrowRight, Save, X, Activity } from "lucide-react";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const completedCount = [formData.date, formData.reportingTime, formData.logoutTime, formData.tasksCompleted].filter(Boolean).length;

  return (
    <BaseLayout>
      {toast.show && (
        <div style={{...styles.toast, backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60"}}>
          {toast.msg}
        </div>
      )}

      <div style={styles.pageShell}>
        <div style={styles.hero}>
          <div style={styles.heroLeft}>
            <button type="button" onClick={() => navigate(-1)} style={styles.backBtn}>
              <ArrowRight style={{ transform: "rotate(180deg)" }} size={20} />
            </button>
            <div>
              <h2 style={styles.pageTitle}>{id ? "Edit EOD Report" : "Submit EOD Report"}</h2>
              <p style={styles.pageSubtitle}>Log your daily tasks, blockers, and timelines clearly.</p>
            </div>
          </div>
          <div style={styles.progressBox}>
            <div style={styles.progressText}>{completedCount} / 4 mandatory fields</div>
            <div style={styles.progressTrack}>
              <div style={{...styles.progressFill, width: `${(completedCount / 4) * 100}%`}} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            
            {/* Timings Section */}
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={{...styles.sectionIcon, background: "#EBF5FF"}}>
                  <Clock size={20} color="#3B82F6" />
                </div>
                <div>
                  <h3 style={styles.sectionTitle}>Shift Timings</h3>
                  <p style={styles.sectionHint}>Your working hours for the day.</p>
                </div>
              </div>
              <div style={styles.innerGrid}>
                <div style={{...styles.inputGroup, ...styles.col4}}>
                  <label style={styles.label}>Date<span style={styles.requiredDot}>●</span></label>
                  <div style={styles.inputShell}>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required style={styles.input} />
                  </div>
                </div>
                <div style={{...styles.inputGroup, ...styles.col4}}>
                  <label style={styles.label}>Reporting Time<span style={styles.requiredDot}>●</span></label>
                  <div style={styles.inputShell}>
                    <input type="time" name="reportingTime" value={formData.reportingTime} onChange={handleChange} required style={styles.input} />
                  </div>
                </div>
                <div style={{...styles.inputGroup, ...styles.col4}}>
                  <label style={styles.label}>Log Out Time<span style={styles.requiredDot}>●</span></label>
                  <div style={styles.inputShell}>
                    <input type="time" name="logoutTime" value={formData.logoutTime} onChange={handleChange} required style={styles.input} />
                  </div>
                </div>
              </div>
            </div>

            {/* Updates Section */}
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={{...styles.sectionIcon, background: "#ECFDF5"}}>
                  <CheckCircle size={20} color="#10B981" />
                </div>
                <div>
                  <h3 style={styles.sectionTitle}>Daily Updates</h3>
                  <p style={styles.sectionHint}>Tasks, blockers, and tomorrow's plan.</p>
                </div>
              </div>
              <div style={styles.innerGrid}>
                <div style={{...styles.inputGroup, ...styles.col12}}>
                  <label style={styles.label}>Tasks Completed<span style={styles.requiredDot}>●</span></label>
                  <div style={styles.textareaShell}>
                    <textarea name="tasksCompleted" value={formData.tasksCompleted} onChange={handleChange} required rows={4} style={styles.textarea} placeholder="E.g., Sourced 10 profiles, screened 5 candidates..." />
                  </div>
                </div>
                <div style={{...styles.inputGroup, ...styles.col12}}>
                  <label style={styles.label}>Issues Faced Today</label>
                  <div style={styles.textareaShell}>
                    <textarea name="issuesFaced" value={formData.issuesFaced} onChange={handleChange} rows={2} style={styles.textarea} placeholder="Any blockers or issues faced today? (Enter NA if none)" />
                  </div>
                </div>
                <div style={{...styles.inputGroup, ...styles.col12}}>
                  <label style={styles.label}>Resolution Steps / Tomorrow's Plan</label>
                  <div style={styles.textareaShell}>
                    <textarea name="resolutionSteps" value={formData.resolutionSteps} onChange={handleChange} rows={2} style={styles.textarea} placeholder="How will you resolve the issues, or what is the plan for tomorrow?" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div style={styles.footerBar}>
            <div style={styles.footerHint}>{completedCount} / 4 mandatory done</div>
            <div style={{display: 'flex', gap: '12px'}}>
                {id && (
                <button type="button" onClick={() => navigate("/employee/add-eod")} style={{...styles.submitBtn, background: '#E2E8F0', color: '#475569', boxShadow: 'none'}}>
                    <X size={18} style={{marginRight: '6px'}}/> Cancel
                </button>
                )}
                <button type="submit" disabled={loading} style={{...styles.submitBtn, opacity: loading ? 0.7 : 1}}>
                <Save size={18} style={{marginRight: '6px'}}/> {loading ? "Processing..." : (id ? "Update EOD" : "Submit EOD")}
                </button>
            </div>
          </div>
        </form>

        <div style={{ marginTop: '40px' }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px'}}>
                <Activity size={24} color="#FF6B2C" />
                <h2 style={{...styles.pageTitle, fontSize: '22px'}}>My Past EOD Reports</h2>
            </div>
            
            <div style={styles.tableCard}>
                <div style={{overflowX: 'auto'}}>
                    <table style={styles.table}>
                    <thead>
                        <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Reporting Time</th>
                        <th style={{...styles.th, width: '25%'}}>Tasks Completed</th>
                        <th style={{...styles.th, width: '20%'}}>Issues Faced</th>
                        <th style={{...styles.th, width: '20%'}}>Tomorrow's Plan</th>
                        <th style={styles.th}>Log Out Time</th>
                        <th style={{...styles.th, textAlign: 'center'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {eods.length > 0 ? (
                        eods.map((eod) => (
                            <tr key={eod.id} style={styles.tr}>
                            <td style={styles.td}>
                                <div style={{fontWeight: '700', color: '#1E293B'}}>{eod.date}</div>
                            </td>
                            <td style={styles.td}>
                                <div style={styles.timeTag}>{format12Hour(eod.reportingTime)}</div>
                            </td>
                            <td style={styles.td}><pre style={styles.pre}>{eod.tasksCompleted}</pre></td>
                            <td style={styles.td}><pre style={styles.pre}>{eod.issuesFaced || "N/A"}</pre></td>
                            <td style={styles.td}><pre style={styles.pre}>{eod.resolutionSteps || "N/A"}</pre></td>
                            <td style={styles.td}>
                                <div style={styles.timeTag}>{format12Hour(eod.logoutTime)}</div>
                            </td>
                            <td style={{...styles.td, textAlign: 'center'}}>
                                <button onClick={() => navigate(`/employee/edit-eod/${eod.id}`)} style={styles.editBtn}>Edit</button>
                            </td>
                            </tr>
                        ))
                        ) : (
                        <tr>
                            <td colSpan="7" style={{...styles.td, textAlign: "center", color: "#64748B", padding: '40px'}}>No EOD reports found.</td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>
    </BaseLayout>
  );
}

const styles = {
  toast: { position: "fixed", top: "85px", right: "20px", color: "#fff", padding: "12px 25px", borderRadius: "10px", zIndex: 9999, fontWeight: "800", boxShadow: "0 14px 30px rgba(15,23,42,0.18)" },
  pageShell: { width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "26px 18px 98px", boxSizing: "border-box" },
  hero: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "18px", marginBottom: "24px" },
  heroLeft: { display: "flex", alignItems: "center", gap: "14px" },
  backBtn: { width: "44px", height: "44px", borderRadius: "14px", border: "1px solid #E9EDF3", background: "#fff", color: "#25343F", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 10px 24px rgba(15,23,42,0.06)" },
  pageTitle: { margin: 0, color: "#20242A", fontSize: "26px", fontWeight: "900", letterSpacing: "-0.8px" },
  pageSubtitle: { margin: "4px 0 0", color: "#85878E", fontSize: "14px", fontWeight: "600" },
  progressBox: { minWidth: "210px", background: "#fff", border: "1px solid #EEF1F5", borderRadius: "16px", padding: "12px 14px", boxShadow: "0 10px 28px rgba(15,23,42,0.05)" },
  progressText: { color: "#5E6470", fontSize: "12px", fontWeight: "800", marginBottom: "8px" },
  progressTrack: { height: "7px", borderRadius: "999px", background: "#EEF1F5", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #FF9B51, #FF5E2F)", transition: "width 0.25s ease" },
  
  formGrid: { display: "flex", flexDirection: "column", gap: "24px" },
  sectionCard: { background: "#fff", borderRadius: "22px", padding: "24px", border: "1px solid #EEF1F5", boxShadow: "0 18px 42px rgba(15,23,42,0.055)" },
  sectionHeader: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" },
  sectionIcon: { width: "42px", height: "42px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sectionTitle: { margin: 0, color: "#20242A", fontSize: "18px", fontWeight: "900", letterSpacing: "-0.35px" },
  sectionHint: { margin: "2px 0 0", color: "#85878E", fontSize: "13px", fontWeight: "600" },
  
  innerGrid: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "16px" },
  col4: { gridColumn: "span 4" }, col6: { gridColumn: "span 6" }, col12: { gridColumn: "span 12" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { color: "#24272D", fontSize: "13px", fontWeight: "800" },
  requiredDot: { color: "#FF5E2F", marginLeft: "5px" },
  inputShell: { minHeight: "52px", borderRadius: "14px", border: "1px solid #E8ECF2", background: "#F8FAFC", display: "flex", alignItems: "center", gap: "10px", padding: "0 14px", boxSizing: "border-box", transition: "border-color 0.2s" },
  input: { width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#20242A", background: "transparent", fontWeight: "600", boxSizing: "border-box", fontFamily: 'inherit' },
  textareaShell: { borderRadius: "16px", border: "1px solid #E8ECF2", background: "#F8FAFC", padding: "14px", boxSizing: "border-box", transition: "border-color 0.2s" },
  textarea: { width: "100%", resize: "vertical", border: "none", outline: "none", fontSize: "14px", color: "#20242A", lineHeight: "1.6", fontWeight: "600", background: "transparent", boxSizing: "border-box", fontFamily: 'inherit' },
  
  footerBar: { position: "sticky", bottom: 0, zIndex: 20, marginTop: "24px", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)", borderTop: "1px solid #EEF1F5", padding: "16px 0 0", display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" },
  footerHint: { color: "#7B7E86", fontSize: "13px", fontWeight: "800" },
  submitBtn: { display: 'flex', alignItems: 'center', border: "none", borderRadius: "15px", background: "linear-gradient(135deg, #FF9B51, #FF5E2F)", color: "#fff", padding: "14px 28px", fontSize: "15px", fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 24px rgba(255, 94, 47, 0.28)", transition: 'transform 0.1s' },
  
  tableCard: { background: "#fff", borderRadius: "22px", border: "1px solid #EEF1F5", boxShadow: "0 18px 42px rgba(15,23,42,0.04)", overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '800', color: '#64748B', backgroundColor: '#F8FAFC', borderBottom: '1px solid #EEF1F5', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #EEF1F5', transition: 'background-color 0.15s', ':hover': { backgroundColor: '#F8FAFC' } },
  td: { padding: '16px 20px', fontSize: '14px', color: '#334155', verticalAlign: 'top' },
  pre: { margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', fontSize: '14px', color: '#475569', lineHeight: '1.6', fontWeight: '500' },
  timeTag: { display: 'inline-block', padding: '6px 10px', background: '#F1F5F9', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#475569' },
  editBtn: { padding: '8px 16px', backgroundColor: '#fff', color: '#3B82F6', border: '1px solid #BFDBFE', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(59,130,246,0.1)' }
};
