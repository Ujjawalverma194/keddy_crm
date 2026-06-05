import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import BaseLayout from "../../components/emp_base";

function AttendanceDashboard() {
    const navigate = useNavigate();

    const [todayData, setTodayData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [showCheckOutModal, setShowCheckOutModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    // Report form state
    const [reportForm, setReportForm] = useState({
        work_done: "",
        challenges: "",
        plan_for_tomorrow: "",
    });
    const [formLoading, setFormLoading] = useState(false);

    // Toast state
    const [toast, setToast] = useState({ show: false, message: "", type: "" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3500);
    };

    const fetchTodayData = async () => {
        setLoading(true);
        try {
            const data = await apiRequest("/attendance/my-today/", "GET");
            setTodayData(data);
        } catch (error) {
            console.error("Error fetching today data:", error);
            showToast("Failed to load today's data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayData();
    }, []);

    const handleCheckIn = async () => {
        setFormLoading(true);
        try {
            const res = await apiRequest("/attendance/check-in/", "POST", {});
            if (res && (res.success || res.id || res.check_in)) {
                showToast("✅ Checked in successfully!", "success");
                setShowCheckInModal(false);
                fetchTodayData();
            } else {
                showToast(res?.message || res?.detail || "Check-in failed", "error");
                setShowCheckInModal(false);
            }
        } catch (error) {
            showToast("Check-in request failed", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setFormLoading(true);
        try {
            const res = await apiRequest("/attendance/check-out/", "POST", {});
            if (res && (res.success || res.id || res.check_out)) {
                showToast("✅ Checked out successfully!", "success");
                setShowCheckOutModal(false);
                fetchTodayData();
            } else {
                showToast(res?.message || res?.detail || "Check-out failed", "error");
                setShowCheckOutModal(false);
            }
        } catch (error) {
            showToast("Check-out request failed", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleReportSubmit = async () => {
        if (!reportForm.work_done.trim()) {
            showToast("Please fill in what work you did today", "error");
            return;
        }
        setFormLoading(true);
        try {
            const res = await apiRequest("/attendance/daily-report/", "POST", reportForm);
            if (res && res.success === false) {
                showToast(res.message || "Report already submitted for today", "error");
            } else {
                showToast("✅ Daily report submitted!", "success");
                setShowReportModal(false);
                setReportForm({ work_done: "", challenges: "", plan_for_tomorrow: "" });
                fetchTodayData();
            }
        } catch (error) {
            showToast("Failed to submit report", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const att = todayData?.attendance;
    const report = todayData?.report;
    const performance = todayData?.performance;
    const target = todayData?.target;
    const suggestions = todayData?.suggestions;

    const getStatusBadge = (status) => {
        if (status === "ON_TIME") return styles.badgeGreen;
        if (status === "LATE") return styles.badgeOrange;
        return styles.badgeGray;
    };

    const getColorCodeStyle = (code) => {
        if (code === "GREEN") return { background: "#DCFCE7", color: "#166534" };
        if (code === "YELLOW") return { background: "#FEF9C3", color: "#854D0E" };
        return { background: "#FEE2E2", color: "#991B1B" };
    };

    return (
        <BaseLayout>
            {/* Toast */}
            {toast.show && (
                <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#EF4444" : "#10B981" }}>
                    {toast.message}
                </div>
            )}
          <div style={styles.topBar}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
              </div>
            {/* Check-In Confirm Modal */}
            {showCheckInModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalBox}>
                        <h3 style={styles.modalTitle}>Confirm Check-In</h3>
                        <p style={styles.modalDesc}>Are you sure you want to mark your attendance for today?</p>
                        <div style={styles.modalActions}>
                            <button onClick={() => setShowCheckInModal(false)} style={styles.cancelBtn}>Cancel</button>
                            <button onClick={handleCheckIn} disabled={formLoading} style={styles.confirmGreenBtn}>
                                {formLoading ? "Checking in..." : "Yes, Check In"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Check-Out Confirm Modal */}
            {showCheckOutModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalBox}>
                        <h3 style={styles.modalTitle}>Confirm Check-Out</h3>
                        <p style={styles.modalDesc}>Are you sure you want to check out for today?</p>
                        <div style={styles.modalActions}>
                            <button onClick={() => setShowCheckOutModal(false)} style={styles.cancelBtn}>Cancel</button>
                            <button onClick={handleCheckOut} disabled={formLoading} style={styles.confirmOrangeBtn}>
                                {formLoading ? "Checking out..." : "Yes, Check Out"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Daily Report Modal */}
            {showReportModal && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalBox, maxWidth: "560px", width: "95%" }}>
                        <h3 style={styles.modalTitle}>Submit Daily Report</h3>
                        <p style={{ ...styles.modalDesc, marginBottom: "20px" }}>Fill in your work summary for today.</p>

                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Work Done Today *</label>
                            <textarea
                                rows={3}
                                placeholder="Describe what you worked on today..."
                                style={styles.textarea}
                                value={reportForm.work_done}
                                onChange={(e) => setReportForm({ ...reportForm, work_done: e.target.value })}
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Challenges Faced</label>
                            <textarea
                                rows={2}
                                placeholder="Any blockers or challenges? (optional)"
                                style={styles.textarea}
                                value={reportForm.challenges}
                                onChange={(e) => setReportForm({ ...reportForm, challenges: e.target.value })}
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Plan for Tomorrow</label>
                            <textarea
                                rows={2}
                                placeholder="What do you plan to do tomorrow? (optional)"
                                style={styles.textarea}
                                value={reportForm.plan_for_tomorrow}
                                onChange={(e) => setReportForm({ ...reportForm, plan_for_tomorrow: e.target.value })}
                            />
                        </div>

                        <div style={styles.modalActions}>
                            <button
                                onClick={() => { setShowReportModal(false); setReportForm({ work_done: "", challenges: "", plan_for_tomorrow: "" }); }}
                                style={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                            <button onClick={handleReportSubmit} disabled={formLoading} style={styles.confirmGreenBtn}>
                                {formLoading ? "Submitting..." : "Submit Report"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div style={styles.topBar}>
                <div>
                    <h2 style={styles.pageTitle}>Work & Attendance</h2>
                    <p style={styles.pageSubtitle}>Track your attendance, performance, and daily updates</p>
                </div>
                <div style={styles.headerActions}>
                    <button onClick={() => navigate("/employee/attendance/board")} style={styles.outlineBtn}>
                        👥 Team Board
                    </button>
                    <button onClick={() => navigate("/employee/attendance/monthly")} style={styles.outlineBtn}>
                        📅 My Monthly
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={styles.loadingWrap}>Loading your data...</div>
            ) : (
                <>
                    {/* Action Cards Row */}
                    <div style={styles.cardGrid3}>
                        {/* Check In Card */}
                        <div
                            style={{
                                ...styles.actionCard,
                                borderTop: "4px solid #10B981",
                                opacity: att?.check_in ? 0.7 : 1,
                                cursor: att?.check_in ? "not-allowed" : "pointer",
                            }}
                            onClick={() => !att?.check_in && setShowCheckInModal(true)}
                        >
                            <div style={styles.actionCardIcon}>🟢</div>
                            <div style={styles.actionCardTitle}>Check In</div>
                            <div style={styles.actionCardSub}>
                                {att?.check_in
                                    ? `Already checked in at ${att.check_in.split("T")[1]?.slice(0, 5) || "—"}`
                                    : "Mark your arrival for today"}
                            </div>
                            {att?.check_in && (
                                <span style={{ ...styles.badge, ...styles.badgeGreen, marginTop: "10px" }}>Done</span>
                            )}
                        </div>

                        {/* Check Out Card */}
                        <div
                            style={{
                                ...styles.actionCard,
                                borderTop: "4px solid #FF9B51",
                                opacity: !att?.check_in || att?.check_out ? 0.7 : 1,
                                cursor: !att?.check_in || att?.check_out ? "not-allowed" : "pointer",
                            }}
                            onClick={() => att?.check_in && !att?.check_out && setShowCheckOutModal(true)}
                        >
                            <div style={styles.actionCardIcon}>🟠</div>
                            <div style={styles.actionCardTitle}>Check Out</div>
                            <div style={styles.actionCardSub}>
                                {att?.check_out
                                    ? `Checked out at ${att.check_out.split("T")[1]?.slice(0, 5) || "—"}`
                                    : att?.check_in
                                    ? "Mark your departure"
                                    : "Check in first"}
                            </div>
                            {att?.check_out && (
                                <span style={{ ...styles.badge, ...styles.badgeOrange, marginTop: "10px" }}>Done</span>
                            )}
                        </div>

                        {/* Daily Report Card */}
                        <div
                            style={{
                                ...styles.actionCard,
                                borderTop: "4px solid #6366F1",
                                opacity: report ? 0.7 : 1,
                                cursor: report ? "not-allowed" : "pointer",
                            }}
                            onClick={() => !report && setShowReportModal(true)}
                        >
                            <div style={styles.actionCardIcon}>📝</div>
                            <div style={styles.actionCardTitle}>Daily Report</div>
                            <div style={styles.actionCardSub}>
                                {report ? "Report already submitted today" : "Submit your work summary"}
                            </div>
                            {report && (
                                <span style={{ ...styles.badge, background: "#EEF2FF", color: "#4338CA", marginTop: "10px" }}>
                                    Submitted
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats Cards Row */}
                    <div style={styles.cardGrid4}>
                        <div style={styles.statCard} onClick={() => navigate("/employee/attendance/board")}>
                            <div style={styles.statLabel}>Attendance Status</div>
                            <div style={styles.statValue}>
                                {att ? (
                                    <span style={{ ...styles.badge, ...getStatusBadge(att.status), fontSize: "14px", padding: "5px 12px" }}>
                                        {att.status_display || att.status}
                                    </span>
                                ) : (
                                    <span style={{ color: "#94A3B8", fontSize: "14px" }}>Not marked</span>
                                )}
                            </div>
                            <div style={styles.statFooter}>
                                {att?.work_from_display ? `📍 ${att.work_from_display}` : "No data yet"}
                            </div>
                        </div>

                        <div style={styles.statCard} onClick={() => navigate("/employee/attendance/monthly")}>
                            <div style={styles.statLabel}>Today's Performance</div>
                            <div style={styles.statValue}>
                                {performance ? (
                                    <span style={{ ...styles.badge, ...getColorCodeStyle(performance.color_code), fontSize: "14px", padding: "5px 12px" }}>
                                        {performance.performance_percentage}%
                                    </span>
                                ) : (
                                    <span style={{ color: "#94A3B8", fontSize: "14px" }}>—</span>
                                )}
                            </div>
                            <div style={styles.statFooter}>
                                Sourced: {performance?.sourced_today ?? 0} | Submitted: {performance?.submitted_today ?? 0}
                            </div>
                        </div>

                        <div style={styles.statCard} onClick={() => navigate("/employee/attendance/monthly")}>
                            <div style={styles.statLabel}>Monthly Sourced</div>
                            <div style={styles.statValueBig}>{performance?.monthly_sourced ?? 0}</div>
                            <div style={styles.statFooter}>Target: {target?.target_sourcing ?? "—"}</div>
                        </div>

                        <div style={styles.statCard} onClick={() => navigate("/employee/attendance/monthly")}>
                            <div style={styles.statLabel}>Monthly Submitted</div>
                            <div style={styles.statValueBig}>{performance?.monthly_submitted ?? 0}</div>
                            <div style={styles.statFooter}>Target: {target?.target_submission ?? "—"}</div>
                        </div>
                    </div>

                    {/* Suggestions + Today's Report */}
                    <div style={styles.twoColGrid}>
                        {/* Suggestions */}
                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>💡 Suggestions for You</h3>
                            {suggestions ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={styles.suggestionItem}>
                                        <span style={styles.suggestionIcon}>📦</span>
                                        <span style={styles.suggestionText}>{suggestions.sourcing_needed}</span>
                                    </div>
                                    <div style={styles.suggestionItem}>
                                        <span style={styles.suggestionIcon}>📤</span>
                                        <span style={styles.suggestionText}>{suggestions.submission_needed}</span>
                                    </div>
                                    <div style={styles.suggestionItem}>
                                        <span style={styles.suggestionIcon}>🏆</span>
                                        <span style={styles.suggestionText}>{suggestions.ranking_needed}</span>
                                    </div>
                                </div>
                            ) : (
                                <p style={styles.emptyText}>No suggestions available yet.</p>
                            )}

                            {/* Top performer badge */}
                            {performance?.is_top_performer && (
                                <div style={styles.topPerformerBadge}>🏆 You are a Top Performer today!</div>
                            )}
                        </div>

                        {/* Today's Report */}
                        <div style={styles.card}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>📋 Today's Report</h3>
                                {!report && (
                                    <button onClick={() => setShowReportModal(true)} style={styles.addBtn}>
                                        + Submit Report
                                    </button>
                                )}
                            </div>
                            {report ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    <div>
                                        <div style={styles.reportLabel}>Work Done</div>
                                        <div style={styles.reportValue}>{report.work_done}</div>
                                    </div>
                                    {report.challenges && (
                                        <div>
                                            <div style={styles.reportLabel}>Challenges</div>
                                            <div style={styles.reportValue}>{report.challenges}</div>
                                        </div>
                                    )}
                                    {report.plan_for_tomorrow && (
                                        <div>
                                            <div style={styles.reportLabel}>Plan for Tomorrow</div>
                                            <div style={styles.reportValue}>{report.plan_for_tomorrow}</div>
                                        </div>
                                    )}
                                    <div style={styles.reportDate}>📅 {report.date}</div>
                                </div>
                            ) : (
                                <p style={styles.emptyText}>No report submitted yet. Click "Submit Report" to add one.</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </BaseLayout>
    );
}

const styles = {
    backBtn: { background: "#25343f", border: "none", color: "white", fontWeight: "700", cursor: "pointer", fontSize: "15px",padding:"15px", borderRadius:"15px" },
  
    toast: {
        position: "fixed", top: "20px", right: "20px", color: "#fff",
        padding: "12px 25px", borderRadius: "8px", zIndex: 9999,
        fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "0.3s",
    },
    modalOverlay: {
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5000,
    },
    modalBox: {
        backgroundColor: "#fff", borderRadius: "16px", padding: "32px",
        maxWidth: "420px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    },
    modalTitle: { fontSize: "20px", fontWeight: "800", color: "#1E293B", marginBottom: "10px" },
    modalDesc: { fontSize: "14px", color: "#64748B", lineHeight: "1.6" },
    modalActions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" },
    cancelBtn: {
        padding: "10px 20px", borderRadius: "8px", border: "1px solid #E2E8F0",
        background: "#fff", color: "#64748B", fontWeight: "700", cursor: "pointer", fontSize: "14px",
    },
    confirmGreenBtn: {
        padding: "10px 20px", borderRadius: "8px", border: "none",
        background: "#10B981", color: "#fff", fontWeight: "700", cursor: "pointer", fontSize: "14px",
    },
    confirmOrangeBtn: {
        padding: "10px 20px", borderRadius: "8px", border: "none",
        background: "#FF9B51", color: "#fff", fontWeight: "700", cursor: "pointer", fontSize: "14px",
    },
    formGroup: { marginBottom: "16px" },
    formLabel: { display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px", textTransform: "uppercase" },
    textarea: {
        width: "100%", padding: "10px 14px", borderRadius: "10px",
        border: "1px solid #E2E8F0", fontSize: "14px", resize: "vertical",
        outline: "none", fontFamily: "inherit", lineHeight: "1.5",
        boxSizing: "border-box",
    },
    topBar: {
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: "24px", flexWrap: "wrap", gap: "15px",
    },
    pageTitle: { fontSize: "24px", fontWeight: "800", color: "#1E293B", marginBottom: "4px" },
    pageSubtitle: { fontSize: "14px", color: "#64748B" },
    headerActions: { display: "flex", gap: "10px", flexWrap: "wrap" },
    outlineBtn: {
        padding: "10px 18px", borderRadius: "10px", border: "1px solid #E2E8F0",
        background: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer", color: "#334155",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    },
    loadingWrap: { textAlign: "center", padding: "60px", color: "#64748B", fontSize: "15px" },
    cardGrid3: {
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: "18px", marginBottom: "22px",
    },
    cardGrid4: {
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "18px", marginBottom: "22px",
    },
    actionCard: {
        background: "#fff", borderRadius: "14px", padding: "22px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)", transition: "transform 0.2s, box-shadow 0.2s",
        display: "flex", flexDirection: "column", alignItems: "flex-start",
    },
    actionCardIcon: { fontSize: "24px", marginBottom: "12px" },
    actionCardTitle: { fontSize: "17px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" },
    actionCardSub: { fontSize: "13px", color: "#64748B", lineHeight: "1.5" },
    statCard: {
        background: "#fff", borderRadius: "14px", padding: "20px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)", cursor: "pointer",
        transition: "transform 0.2s", display: "flex", flexDirection: "column", gap: "8px",
    },
    statLabel: { fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" },
    statValue: { display: "flex", alignItems: "center" },
    statValueBig: { fontSize: "32px", fontWeight: "800", color: "#1E293B" },
    statFooter: { fontSize: "12px", color: "#94A3B8", marginTop: "4px" },
    badge: { padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", display: "inline-block" },
    badgeGreen: { background: "#DCFCE7", color: "#166534" },
    badgeOrange: { background: "#FFF3E0", color: "#B45309" },
    badgeGray: { background: "#F1F5F9", color: "#64748B" },
    twoColGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" },
    card: {
        background: "#fff", borderRadius: "14px", padding: "22px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    },
    cardTitle: { fontSize: "16px", fontWeight: "800", color: "#1E293B", marginBottom: "16px" },
    suggestionItem: {
        display: "flex", alignItems: "flex-start", gap: "10px",
        padding: "12px 14px", background: "#F8FAFC", borderRadius: "10px",
    },
    suggestionIcon: { fontSize: "16px", flexShrink: 0 },
    suggestionText: { fontSize: "13px", color: "#334155", lineHeight: "1.5" },
    topPerformerBadge: {
        marginTop: "16px", padding: "12px 16px", background: "#FEF9C3",
        color: "#854D0E", borderRadius: "10px", fontWeight: "700", fontSize: "13px", textAlign: "center",
    },
    addBtn: {
        background: "#FF9B51", color: "#fff", border: "none",
        padding: "8px 16px", borderRadius: "8px", fontWeight: "700",
        cursor: "pointer", fontSize: "13px",
    },
    reportLabel: { fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", marginBottom: "4px" },
    reportValue: { fontSize: "14px", color: "#334155", lineHeight: "1.6" },
    reportDate: { fontSize: "12px", color: "#94A3B8", marginTop: "4px" },
    emptyText: { fontSize: "14px", color: "#94A3B8", textAlign: "center", padding: "20px 0" },
};

export default AttendanceDashboard;