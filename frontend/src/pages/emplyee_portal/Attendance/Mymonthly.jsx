import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import BaseLayout from "../../components/emp_base";

function MyMonthly() {
    const navigate = useNavigate();

    const [monthlyData, setMonthlyData] = useState(null);
    const [dailyData, setDailyData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Month filter — default: current month
    const today = new Date();
    const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({});

    const [toast, setToast] = useState({ show: false, message: "", type: "" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3500);
    };

    const fetchMonthly = async (month = selectedMonth, page = 1) => {
        setLoading(true);
        try {
            const data = await apiRequest(
                `/attendance/my-monthly/?month=${month}&page=${page}&page_size=10`,
                "GET"
            );
            if (data?.success && data?.data) {
                setMonthlyData(data.data);
                setDailyData(data.data.daily_data || []);
                setPagination(data.data.pagination || {});
                setCurrentPage(data.data.pagination?.current_page || page);
            } else {
                showToast("Failed to load monthly data", "error");
            }
        } catch (error) {
            console.error("Error fetching monthly data:", error);
            showToast("Error loading monthly report", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonthly(selectedMonth, 1);
    }, [selectedMonth]);

    const getStatusStyle = (status) => {
        if (status === "ON_TIME") return { background: "#DCFCE7", color: "#166534" };
        if (status === "LATE") return { background: "#FFF3E0", color: "#B45309" };
        return { background: "#F1F5F9", color: "#64748B" };
    };

    const getColorCodeStyle = (code) => {
        if (code === "GREEN") return { background: "#DCFCE7", color: "#166534" };
        if (code === "YELLOW") return { background: "#FEF9C3", color: "#854D0E" };
        return { background: "#FEE2E2", color: "#991B1B" };
    };

    const att = monthlyData?.attendance_summary;
    const perf = monthlyData?.performance_summary;
    const pts = monthlyData?.points_summary;

    return (
        <BaseLayout>
            {/* Toast */}
            {toast.show && (
                <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#EF4444" : "#10B981" }}>
                    {toast.message}
                </div>
            )}

            {/* Top Bar */}
            <div style={styles.topBar}>
                <button onClick={() => navigate("/employee/attendance")} style={styles.backBtn}>
                    ← Back to Dashboard
                </button>
                <div style={styles.topBarRight}>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={styles.monthPicker}
                    />
                </div>
            </div>

            <h2 style={styles.pageTitle}>My Monthly Report — {selectedMonth}</h2>

            {/* Summary Cards */}
            {!loading && monthlyData && (
                <>
                    <div style={styles.summaryGrid}>
                        {/* Attendance */}
                        <div style={{ ...styles.summaryCard, borderTop: "4px solid #6366F1" }}>
                            <div style={styles.summaryCardTitle}>📅 Attendance</div>
                            <div style={styles.summaryCardRow}>
                                <span style={styles.summaryKey}>Total Days</span>
                                <span style={styles.summaryVal}>{att?.total_days ?? 0}</span>
                            </div>
                            <div style={styles.summaryCardRow}>
                                <span style={styles.summaryKey}>On Time</span>
                                <span style={{ ...styles.summaryVal, color: "#166534" }}>{att?.on_time ?? 0}</span>
                            </div>
                            <div style={styles.summaryCardRow}>
                                <span style={styles.summaryKey}>Late</span>
                                <span style={{ ...styles.summaryVal, color: "#B45309" }}>{att?.late ?? 0}</span>
                            </div>
                            <div style={styles.summaryCardRow}>
                                <span style={styles.summaryKey}>Absent</span>
                                <span style={{ ...styles.summaryVal, color: "#991B1B" }}>{att?.absent ?? 0}</span>
                            </div>
                        </div>

                        {/* Performance */}
                        <div style={{ ...styles.summaryCard, borderTop: "4px solid #10B981" }}>
                            <div style={styles.summaryCardTitle}>📊 Performance</div>
                            <div style={styles.summaryCardRow}>
                                <span style={styles.summaryKey}>Total Sourced</span>
                                <span style={styles.summaryVal}>{perf?.total_sourced ?? 0}</span>
                            </div>
                            <div style={styles.summaryCardRow}>
                                <span style={styles.summaryKey}>Total Submitted</span>
                                <span style={styles.summaryVal}>{perf?.total_submitted ?? 0}</span>
                            </div>
                            <div style={styles.summaryCardRow}>
                                <span style={styles.summaryKey}>Avg Performance</span>
                                <span style={styles.summaryVal}>{perf?.avg_performance ?? 0}%</span>
                            </div>
                        </div>

                        {/* Points */}
                        <div style={{ ...styles.summaryCard, borderTop: "4px solid #FF9B51" }}>
                            <div style={styles.summaryCardTitle}>🏅 Points</div>
                            <div style={styles.summaryCardRow}>
                                <span style={styles.summaryKey}>Total Points</span>
                                <span style={{
                                    ...styles.summaryVal,
                                    color: (pts?.total_points ?? 0) >= 0 ? "#166534" : "#991B1B",
                                    fontSize: "22px",
                                }}>
                                    {pts?.total_points ?? 0}
                                </span>
                            </div>
                            <div style={styles.summaryCardRow}>
                                <span style={styles.summaryKey}>Positive</span>
                                <span style={{ ...styles.summaryVal, color: "#166534" }}>+{pts?.positive_points ?? 0}</span>
                            </div>
                            <div style={styles.summaryCardRow}>
                                <span style={styles.summaryKey}>Negative</span>
                                <span style={{ ...styles.summaryVal, color: "#991B1B" }}>{pts?.negative_points ?? 0}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Daily Data Table */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Daily Breakdown</h3>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.th, width: "50px" }}>S.No</th>
                                <th style={{ ...styles.th, width: "120px" }}>Date</th>
                                <th style={{ ...styles.th, width: "130px" }}>Check In / Out</th>
                                <th style={{ ...styles.th, width: "100px" }}>Status</th>
                                <th style={{ ...styles.th, width: "200px" }}>Work Done</th>
                                <th style={{ ...styles.th, width: "160px" }}>Challenges</th>
                                <th style={{ ...styles.th, width: "130px" }}>Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={styles.loadingTd}>Loading monthly data...</td>
                                </tr>
                            ) : dailyData.length > 0 ? (
                                dailyData.map((day, index) => (
                                    <tr key={day.date} style={styles.tableRow}>
                                        <td style={styles.td}>
                                            {(currentPage - 1) * 10 + (index + 1)}
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.dateText}>
                                                {new Date(day.date).toLocaleDateString("en-GB", {
                                                    day: "2-digit", month: "short", year: "numeric",
                                                })}
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.timeEntry}>
                                                <span style={styles.timeIn}>▲ {day.attendance?.check_in || "—"}</span>
                                                <span style={styles.timeOut}>▼ {day.attendance?.check_out || "—"}</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{ ...styles.badge, ...getStatusStyle(day.attendance?.status) }}>
                                                {day.attendance?.status === "ON_TIME"
                                                    ? "On Time"
                                                    : day.attendance?.status === "LATE"
                                                    ? "Late"
                                                    : day.attendance?.status || "—"}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.reportCell}>
                                                {day.report?.work_done ? (
                                                    <span title={day.report.work_done}>
                                                        {day.report.work_done.length > 60
                                                            ? day.report.work_done.slice(0, 60) + "..."
                                                            : day.report.work_done}
                                                    </span>
                                                ) : (
                                                    <span style={styles.naText}>No report</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.reportCell}>
                                                {day.report?.challenges ? (
                                                    <span title={day.report.challenges}>
                                                        {day.report.challenges.length > 50
                                                            ? day.report.challenges.slice(0, 50) + "..."
                                                            : day.report.challenges}
                                                    </span>
                                                ) : (
                                                    <span style={styles.naText}>—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <span style={{ ...styles.badge, ...getColorCodeStyle(day.performance?.color_code) }}>
                                                    {day.performance?.performance_percentage ?? 0}%
                                                </span>
                                                <div style={styles.perfDetail}>
                                                    Src: {day.performance?.sourced_today ?? 0} | Sub: {day.performance?.submitted_today ?? 0}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={styles.loadingTd}>
                                        No data found for {selectedMonth}.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div style={styles.paginationContainer}>
                    <div style={styles.pageInfo}>
                        Showing {dailyData.length} of {pagination?.total_items ?? 0} records
                    </div>
                    <div style={styles.paginationBtns}>
                        <button
                            disabled={!pagination?.has_previous || loading}
                            onClick={() => fetchMonthly(selectedMonth, currentPage - 1)}
                            style={{ ...styles.pageBtn, opacity: pagination?.has_previous ? 1 : 0.5 }}
                        >
                            Previous
                        </button>
                        <span style={styles.currentPageText}>
                            Page {pagination?.current_page ?? 1} / {pagination?.total_pages ?? 1}
                        </span>
                        <button
                            disabled={!pagination?.has_next || loading}
                            onClick={() => fetchMonthly(selectedMonth, currentPage + 1)}
                            style={{ ...styles.pageBtn, opacity: pagination?.has_next ? 1 : 0.5 }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
}

const styles = {
    toast: {
        position: "fixed", top: "20px", right: "20px", color: "#fff",
        padding: "12px 25px", borderRadius: "8px", zIndex: 9999,
        fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
    topBar: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "20px", flexWrap: "wrap", gap: "12px",
    },
    topBarRight: { display: "flex", gap: "12px", alignItems: "center" },
    backBtn: {
        background: "transparent", color: "#64748B", border: "none",
        fontSize: "14px", fontWeight: "600", cursor: "pointer",
    },
    monthPicker: {
        padding: "9px 14px", borderRadius: "10px", border: "1px solid #E2E8F0",
        fontSize: "14px", outline: "none", fontFamily: "inherit", color: "#1E293B",
    },
    pageTitle: { fontSize: "22px", color: "#1E293B", marginBottom: "20px", fontWeight: "800" },
    summaryGrid: {
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: "18px", marginBottom: "24px",
    },
    summaryCard: {
        background: "#fff", borderRadius: "14px", padding: "20px 22px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    },
    summaryCardTitle: { fontSize: "14px", fontWeight: "800", color: "#1E293B", marginBottom: "14px" },
    summaryCardRow: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingBottom: "8px", marginBottom: "8px", borderBottom: "1px solid #F1F5F9",
    },
    summaryKey: { fontSize: "13px", color: "#64748B", fontWeight: "500" },
    summaryVal: { fontSize: "16px", fontWeight: "800", color: "#1E293B" },
    section: {},
    sectionTitle: { fontSize: "16px", fontWeight: "800", color: "#1E293B", marginBottom: "14px" },
    tableWrapper: {
        background: "#fff", borderRadius: "16px", overflowX: "auto",
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)", border: "1px solid #F1F5F9",
    },
    table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "950px" },
    tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #EDF2F7" },
    th: {
        padding: "16px", textAlign: "left", color: "#64748B",
        fontSize: "12px", fontWeight: "700", textTransform: "uppercase",
    },
    tableRow: { borderBottom: "1px solid #F1F5F9" },
    td: { padding: "14px 16px", verticalAlign: "middle" },
    loadingTd: { textAlign: "center", padding: "50px", color: "#64748B" },
    dateText: { fontSize: "13px", color: "#475569", fontWeight: "600" },
    timeEntry: { display: "flex", flexDirection: "column", gap: "3px" },
    timeIn: { fontSize: "12px", color: "#166534", fontWeight: "700" },
    timeOut: { fontSize: "12px", color: "#B45309", fontWeight: "700" },
    badge: {
        padding: "4px 10px", borderRadius: "6px",
        fontSize: "11px", fontWeight: "800", display: "inline-block",
    },
    reportCell: { fontSize: "13px", color: "#475569", lineHeight: "1.5" },
    naText: { fontSize: "12px", color: "#CBD5E1" },
    perfDetail: { fontSize: "11px", color: "#94A3B8" },
    paginationContainer: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: "20px", padding: "0 10px",
    },
    pageInfo: { fontSize: "14px", color: "#64748B", fontWeight: "600" },
    paginationBtns: { display: "flex", alignItems: "center", gap: "15px" },
    pageBtn: {
        padding: "8px 16px", borderRadius: "8px", border: "1px solid #E2E8F0",
        background: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "600",
    },
    currentPageText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
};

export default MyMonthly;