import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import BaseLayout from "../../components/emp_base";

function AttendanceBoard() {
    const navigate = useNavigate();

    const [boardData, setBoardData] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({});

    const [toast, setToast] = useState({ show: false, message: "", type: "" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3500);
    };

    const fetchBoard = async (page = 1) => {
        setLoading(true);
        try {
            const data = await apiRequest(`/attendance/attendance-board/?page=${page}`, "GET");
            setBoardData(data);
            setUsers(data.users || []);
            setPagination(data.pagination || {});
            setCurrentPage(data.pagination?.current_page || page);
        } catch (error) {
            console.error("Error fetching attendance board:", error);
            showToast("Failed to load attendance board", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoard(1);
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
        });
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
    };

    const getAvatarColor = (name) => {
        const colors = ["#FF9B51", "#6366F1", "#10B981", "#F59E0B", "#EC4899", "#3B82F6"];
        let sum = 0;
        for (let i = 0; i < (name || "").length; i++) sum += name.charCodeAt(i);
        return colors[sum % colors.length];
    };

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
                    <div style={styles.dateChip}>
                        📅 {boardData?.date ? formatDate(boardData.date) : "Today"}
                    </div>
                    <button onClick={() => fetchBoard(currentPage)} style={styles.refreshBtn}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Page Title + Summary Cards */}
            <h2 style={styles.pageTitle}>Team Attendance Board</h2>

            {!loading && boardData && (
                <div style={styles.summaryGrid}>
                    <div style={{ ...styles.summaryCard, borderTop: "4px solid #10B981" }}>
                        <div style={styles.summaryNumber}>{boardData.total_on_time ?? 0}</div>
                        <div style={styles.summaryLabel}>On Time</div>
                    </div>
                    <div style={{ ...styles.summaryCard, borderTop: "4px solid #F59E0B" }}>
                        <div style={styles.summaryNumber}>{boardData.total_late ?? 0}</div>
                        <div style={styles.summaryLabel}>Late</div>
                    </div>
                    <div style={{ ...styles.summaryCard, borderTop: "4px solid #6366F1" }}>
                        <div style={styles.summaryNumber}>{pagination?.total_items ?? users.length}</div>
                        <div style={styles.summaryLabel}>Total Present</div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div style={styles.section}>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.th, width: "50px" }}>S.No</th>
                                <th style={{ ...styles.th, width: "220px" }}>Employee</th>
                                <th style={{ ...styles.th, width: "130px" }}>Check In</th>
                                <th style={{ ...styles.th, width: "130px" }}>Check Out</th>
                                <th style={{ ...styles.th, width: "120px" }}>Work From</th>
                                <th style={{ ...styles.th, width: "120px" }}>Location</th>
                                <th style={{ ...styles.th, width: "100px" }}>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={styles.loadingTd}>Loading attendance data...</td>
                                </tr>
                            ) : users.length > 0 ? (
                                users.map((record, index) => {
                                    const u = record.user;
                                    const fullName = `${u?.first_name || ""} ${u?.last_name || ""}`.trim();
                                    const avatarColor = getAvatarColor(fullName);
                                    const isCheckedOut = !!record.check_out;

                                    return (
                                        <tr key={record.id} style={styles.tableRow}>
                                            <td style={styles.td}>
                                                {(currentPage - 1) * 10 + (index + 1)}
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.employeeCell}>
                                                    <div style={{ ...styles.avatar, backgroundColor: avatarColor }}>
                                                        {getInitials(u?.first_name, u?.last_name)}
                                                    </div>
                                                    <div>
                                                        <div style={styles.primaryText}>{fullName || "Unknown"}</div>
                                                        <div style={styles.subText}>{u?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                {record.check_in_time ? (
                                                    <div>
                                                        <div style={styles.timeText}>{record.check_in_time}</div>
                                                        <div style={styles.subText}>
                                                            {new Date(record.check_in).toLocaleDateString("en-GB", {
                                                                day: "2-digit", month: "short",
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={styles.naText}>—</span>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                {record.check_out_time ? (
                                                    <div>
                                                        <div style={styles.timeText}>{record.check_out_time}</div>
                                                        <div style={styles.subText}>
                                                            {new Date(record.check_out).toLocaleDateString("en-GB", {
                                                                day: "2-digit", month: "short",
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ ...styles.badge, background: "#FEF3C7", color: "#92400E" }}>
                                                        Still In
                                                    </span>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    ...styles.badge,
                                                    background: record.work_from === "HOME" ? "#EFF6FF" : "#F0FDF4",
                                                    color: record.work_from === "HOME" ? "#1D4ED8" : "#166534",
                                                }}>
                                                    {record.work_from === "HOME" ? "🏠 Home" : "🏢 Office"}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.subText}>
                                                    {record.location || "—"}
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.roleBadge}>
                                                    {u?.role || "—"}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" style={styles.loadingTd}>
                                        No attendance records for today yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div style={styles.paginationContainer}>
                    <div style={styles.pageInfo}>
                        Showing {users.length} of {pagination?.total_items ?? 0} employees
                    </div>
                    <div style={styles.paginationBtns}>
                        <button
                            disabled={!pagination?.has_previous || loading}
                            onClick={() => fetchBoard(currentPage - 1)}
                            style={{ ...styles.pageBtn, opacity: pagination?.has_previous ? 1 : 0.5 }}
                        >
                            Previous
                        </button>
                        <span style={styles.currentPageText}>
                            Page {pagination?.current_page ?? 1} / {pagination?.total_pages ?? 1}
                        </span>
                        <button
                            disabled={!pagination?.has_next || loading}
                            onClick={() => fetchBoard(currentPage + 1)}
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
        fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "0.3s",
    },
    topBar: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "20px", flexWrap: "wrap", gap: "10px",
    },
    topBarRight: { display: "flex", gap: "10px", alignItems: "center" },
    backBtn: {
        background: "transparent", color: "#64748B", border: "none",
        fontSize: "14px", fontWeight: "600", cursor: "pointer",
    },
    dateChip: {
        padding: "8px 14px", background: "#F1F5F9", borderRadius: "8px",
        fontSize: "13px", fontWeight: "600", color: "#334155",
    },
    refreshBtn: {
        padding: "8px 16px", background: "#fff", border: "1px solid #E2E8F0",
        borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", color: "#334155",
    },
    pageTitle: { fontSize: "22px", color: "#1E293B", marginBottom: "18px", fontWeight: "800" },
    summaryGrid: {
        display: "grid", gridTemplateColumns: "repeat(3, 200px)",
        gap: "16px", marginBottom: "22px",
    },
    summaryCard: {
        background: "#fff", borderRadius: "12px", padding: "18px 22px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    },
    summaryNumber: { fontSize: "30px", fontWeight: "800", color: "#1E293B" },
    summaryLabel: { fontSize: "13px", color: "#64748B", marginTop: "4px", fontWeight: "600" },
    section: {},
    tableWrapper: {
        background: "#fff", borderRadius: "16px", overflowX: "auto",
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)", border: "1px solid #F1F5F9",
    },
    table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "900px" },
    tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #EDF2F7" },
    th: {
        padding: "16px", textAlign: "left", color: "#64748B",
        fontSize: "12px", fontWeight: "700", textTransform: "uppercase",
    },
    tableRow: { borderBottom: "1px solid #F1F5F9" },
    td: { padding: "14px 16px", verticalAlign: "middle" },
    loadingTd: { textAlign: "center", padding: "50px", color: "#64748B" },
    employeeCell: { display: "flex", alignItems: "center", gap: "12px" },
    avatar: {
        width: "36px", height: "36px", borderRadius: "10px",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: "800", fontSize: "13px", flexShrink: 0,
    },
    primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
    subText: { fontSize: "12px", color: "#64748B", marginTop: "2px" },
    timeText: { fontSize: "14px", fontWeight: "700", color: "#1E293B" },
    naText: { fontSize: "14px", color: "#CBD5E1" },
    badge: {
        padding: "4px 10px", borderRadius: "6px",
        fontSize: "11px", fontWeight: "800", display: "inline-block",
    },
    roleBadge: { fontSize: "11px", fontWeight: "700", color: "#6366F1" },
    paginationContainer: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: "20px", padding: "0 10px",
    },
    pageInfo: { fontSize: "14px", color: "#64748B", fontWeight: "600" },
    paginationBtns: { display: "flex", alignItems: "center", gap: "15px" },
    pageBtn: {
        padding: "8px 16px", borderRadius: "8px", border: "1px solid #E2E8F0",
        background: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "0.2s",
    },
    currentPageText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
};

export default AttendanceBoard;

