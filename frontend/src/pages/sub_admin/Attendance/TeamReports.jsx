import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import SubAdminLayout from "../../components/SubAdminLayout";

function TeamReports() {
    const navigate = useNavigate();

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Filters & Pagination State
    const today = new Date();
    const firstDayOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const todayStr = today.toISOString().split("T")[0];

    const [fromDate, setFromDate] = useState(firstDayOfMonth);
    const [toDate, setToDate] = useState(todayStr);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({});

    // Modal State
    const [selectedReport, setSelectedReport] = useState(null);

    const fetchReports = async (page = 1) => {
        setLoading(true);
        try {
            let url = `/attendance/admin/reports/?page=${page}`;
            if (fromDate) url += `&from_date=${fromDate}`;
            if (toDate)   url += `&to_date=${toDate}`;
            if (search)   url += `&search=${encodeURIComponent(search)}`;
            
            const res = await apiRequest(url, "GET");
            if (res?.success && res?.data) {
                setReports(res.data.reports || []);
                setPagination(res.data.pagination || {});
                setCurrentPage(page);
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchReports(1), 450);
        return () => clearTimeout(timer);
    }, [fromDate, toDate, search]);

    /* ── helpers ── */
    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
        });
    };

    const getAvatarColor = (name) => {
        const colors = ["#4834D4", "#FF9B51", "#10B981", "#F59E0B", "#EC4899"];
        let sum = 0;
        for (let i = 0; i < (name || "").length; i++) sum += name.charCodeAt(i);
        return colors[sum % colors.length];
    };

    return (
        <SubAdminLayout>
            {/* ── Fixed Detailed Modal ── */}
            {selectedReport && (
                <div style={styles.modalOverlay} onClick={() => setSelectedReport(null)}>
                    <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ ...styles.avatar, backgroundColor: getAvatarColor(selectedReport.user_name) }}>
                                    {(selectedReport.user_name || "U").charAt(0)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: "800", fontSize: "18px", color: "#1E293B" }}>{selectedReport.user_name}</div>
                                    <div style={{ fontSize: "13px", color: "#64748B" }}>{selectedReport.user_email}</div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} style={styles.modalCloseBtn}>✕</button>
                        </div>

                        <div style={styles.modalGrid}>
                            <div style={styles.metaBox}><span> Date</span><strong>{formatDate(selectedReport.date)}</strong></div>
                            <div style={styles.metaBox}><span> Work From</span><strong>{selectedReport.work_from || "—"}</strong></div>
                            <div style={styles.metaBox}><span> Check In</span><strong>{selectedReport.check_in_time || "—"}</strong></div>
                            <div style={styles.metaBox}><span> Check Out</span><strong>{selectedReport.check_out_time || "—"}</strong></div>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "800", color: "#94A3B8" }}>STATUS: </span>
                            <span style={{ fontWeight: "700", color: "#4834D4", background: "#EEF2FF", padding: "4px 10px", borderRadius: "6px" }}>
                                {selectedReport.attendance_status_display}
                            </span>
                        </div>

                        <div style={styles.modalSection}><div style={styles.modalLabel}> WORK DONE</div><div style={styles.modalContent}>{selectedReport.work_done || "No report submitted."}</div></div>
                        <div style={styles.modalSection}><div style={styles.modalLabel}> CHALLENGES</div><div style={styles.modalContent}>{selectedReport.challenges || "No challenges reported."}</div></div>
                        <div style={styles.modalSection}><div style={styles.modalLabel}> PLAN FOR TOMORROW</div><div style={styles.modalContent}>{selectedReport.plan_for_tomorrow || "—"}</div></div>
                    </div>
                </div>
            )}

            <div style={styles.topBar}>
                <button onClick={() => navigate("/sub-admin")} style={styles.backBtn}>← Back</button>
                
            </div>
            <h2 style={{ margin: 0 }}>Team Daily Reports</h2>

            {/* Filter Bar */}
            <div style={styles.filterBar}>
                <div style={styles.filterGroup}><label style={styles.label}>From</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={styles.input} /></div>
                <div style={styles.filterGroup}><label style={styles.label}>To</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={styles.input} /></div>
                <div style={{ ...styles.filterGroup, flex: 1 }}><label style={styles.label}>Search Employee</label><input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.input} /></div>
                <button onClick={() => {setFromDate(firstDayOfMonth); setToDate(todayStr); setSearch("");}} style={styles.clearBtn}>Reset</button>
            </div>

            {/* Table */}
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thead}>
                            <th style={{ ...styles.th, width: "20%" }}>Employee</th>
                            <th style={{ ...styles.th, width: "12%" }}>Date</th>
                            <th style={{ ...styles.th, width: "15%" }}>In / Out</th>
                            <th style={{ ...styles.th, width: "33%" }}>Work Done</th>
                            <th style={{ ...styles.th, width: "10%", textAlign: "center" }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={styles.loading}>Loading...</td></tr>
                        ) : reports.map((report, i) => (
                            <tr key={i} style={styles.tr}>
                                <td style={styles.td}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{ ...styles.miniAvatar, backgroundColor: getAvatarColor(report.user_name) }}>{(report.user_name || "U").charAt(0)}</div>
                                        <span style={{ fontWeight: "600" }}>{report.user_name}</span>
                                    </div>
                                </td>
                                <td style={styles.td}>{formatDate(report.date)}</td>
                                <td style={styles.td}>
                                    <div style={{ fontSize: "12px" }}><span style={{ color: "green" }}>▲ {report.check_in_time || "—"}</span><br /><span style={{ color: "orange" }}>▼ {report.check_out_time || "—"}</span></div>
                                </td>
                                <td style={{ ...styles.td, cursor: "pointer" }} onClick={() => setSelectedReport(report)}>
                                    <div style={styles.truncate}>{report.work_done || "—"}</div>
                                </td>
                                <td style={{ ...styles.td, textAlign: "center" }}>
                                    <button style={styles.viewBtn} onClick={() => setSelectedReport(report)}>View Full</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Back */}
            {!loading && pagination.total_pages > 1 && (
                <div style={styles.paginationRow}>
                    <span style={{ fontSize: "14px", color: "#64748B" }}>Page {currentPage} of {pagination.total_pages}</span>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button disabled={!pagination.has_previous} onClick={() => fetchReports(currentPage - 1)} style={styles.pageBtn}>Previous</button>
                        <button disabled={!pagination.has_next} onClick={() => fetchReports(currentPage + 1)} style={styles.pageBtn}>Next</button>
                    </div>
                </div>
            )}
        </SubAdminLayout>
    );
}

const styles = {
    modalOverlay: { 
        position: "fixed", 
        top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: "rgba(0,0,0,0.7)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        zIndex: 99999, // हाई इंडेक्स ताकि नेवबार के पीछे न जाए
        padding: "20px" 
    },
    modalBox: { 
        background: "#fff", 
        borderRadius: "16px", 
        padding: "25px", 
        width: "100%", 
        maxWidth: "600px", 
        maxHeight: "85vh", // स्क्रीन से बाहर कटने से रोकेगा
        overflowY: "auto", 
        boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        position: "relative"
    },
    modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #F1F5F9", paddingBottom: "15px" },
    modalCloseBtn: { border: "none", background: "#F1F5F9", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px" },
    modalGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "20px" },
    metaBox: { background: "#F8FAFC", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column" },
    modalSection: { background: "#F8FAFC", padding: "15px", borderRadius: "10px", marginBottom: "12px", border: "1px solid #E2E8F0" },
    modalLabel: { fontSize: "11px", fontWeight: "800", color: "#94A3B8", marginBottom: "5px" },
    modalContent: { fontSize: "15px", lineHeight: "1.6", color: "#334155" },
    topBar: { display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" },
    backBtn: { border: "none", background: "#1e293b",color:"white", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
    filterBar: { display: "flex", gap: "12px", marginBottom: "20px", background: "#fff", padding: "15px", borderRadius: "12px", flexWrap: "wrap", alignItems: "flex-end", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
    filterGroup: { display: "flex", flexDirection: "column", gap: "4px" },
    label: { fontSize: "11px", fontWeight: "700", color: "#64748B" },
    input: { padding: "9px", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "14px" },
    clearBtn: { padding: "9px 15px", background: "#F1F5F9", border: "none", borderRadius: "8px", cursor: "pointer" },
    tableContainer: { background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" },
    thead: { background: "#F8FAFC" },
    th: { padding: "12px 15px", textAlign: "left", fontSize: "13px", color: "#64748B", fontWeight: "700", borderBottom: "2px solid #E2E8F0" },
    tr: { borderBottom: "1px solid #F1F5F9" },
    td: { padding: "12px 15px", fontSize: "14px", color: "#334155", verticalAlign: "middle" },
    avatar: { width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800" },
    miniAvatar: { width: "26px", height: "26px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "11px" },
    truncate: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    viewBtn: { padding: "6px 12px", background: "#4834D4", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
    paginationRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", padding: "0 5px" },
    pageBtn: { padding: "7px 15px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
    loading: { textAlign: "center", padding: "40px", color: "#64748B" }
};

export default TeamReports;





// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../../services/api";
// import SubAdminLayout from "../../components/SubAdminLayout";

// function TeamReports() {
//     const navigate = useNavigate();

//     const [reports, setReports] = useState([]);
//     const [employees, setEmployees] = useState([]);
//     const [loading, setLoading] = useState(true);

//     // Filters
//     const today = new Date();
//     const firstDayOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
//     const todayStr = today.toISOString().split("T")[0];

//     const [fromDate, setFromDate] = useState(firstDayOfMonth);
//     const [toDate, setToDate] = useState(todayStr);
//     const [search, setSearch] = useState("");

//     // Pagination
//     const [currentPage, setCurrentPage] = useState(1);
//     const [pagination, setPagination] = useState({});

//     // Detail Modal
//     const [selectedReport, setSelectedReport] = useState(null);

//     // Toast
//     const [toast, setToast] = useState({ show: false, message: "", type: "" });

//     const showToast = (message, type = "success") => {
//         setToast({ show: true, message, type });
//         setTimeout(() => setToast({ show: false, message: "", type: "" }), 3500);
//     };

//     const buildUrl = (page = 1) => {
//         let url = `/attendance/admin/reports/?page=${page}`;
//         if (fromDate) url += `&from_date=${fromDate}`;
//         if (toDate)   url += `&to_date=${toDate}`;
//         if (search)   url += `&search=${encodeURIComponent(search)}`;
//         return url;
//     };

//     const fetchReports = async (page = 1) => {
//         setLoading(true);
//         try {
//             const res = await apiRequest(buildUrl(page), "GET");
//             if (res?.success && res?.data) {
//                 setReports(res.data.reports || []);
//                 // Keep employees list updated — API returns it on every call
//                 if (res.data.employees?.length > 0) {
//                     setEmployees(res.data.employees);
//                 }
//                 setPagination(res.data.pagination || {});
//                 setCurrentPage(res.data.pagination?.current_page || page);
//             } else {
//                 showToast("Failed to load reports", "error");
//             }
//         } catch (error) {
//             console.error("Error fetching reports:", error);
//             showToast("Error loading reports", "error");
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Debounce: re-fetch whenever filters change
//     useEffect(() => {
//         const timer = setTimeout(() => fetchReports(1), 450);
//         return () => clearTimeout(timer);
//     }, [fromDate, toDate, search]);

//     const handleClearFilter = () => {
//         setFromDate(firstDayOfMonth);
//         setToDate(todayStr);
//         setSearch("");
//     };

//     /* ── helpers ── */
//     const formatDate = (dateStr) => {
//         if (!dateStr) return "—";
//         return new Date(dateStr).toLocaleDateString("en-GB", {
//             day: "2-digit", month: "short", year: "numeric",
//         });
//     };

//     const getAvatarColor = (name) => {
//         const colors = ["#4834D4", "#FF9B51", "#10B981", "#F59E0B", "#EC4899", "#3B82F6"];
//         let sum = 0;
//         for (let i = 0; i < (name || "").length; i++) sum += name.charCodeAt(i);
//         return colors[sum % colors.length];
//     };

//     const getInitials = (name) =>
//         (name || "").split(" ").map((p) => p.charAt(0)).join("").toUpperCase().slice(0, 2);

//     const getAttBadge = (status) => {
//         if (status === "ON_TIME") return { background: "#DCFCE7", color: "#166534" };
//         if (status === "LATE")    return { background: "#FFF3E0", color: "#B45309" };
//         return { background: "#F1F5F9", color: "#64748B" };
//     };

//     const workFromLabel = (wf) => {
//         if (wf === "HOME")   return { label: "🏠 Home",   bg: "#EFF6FF", cl: "#1D4ED8" };
//         if (wf === "OFFICE") return { label: "🏢 Office", bg: "#F0FDF4", cl: "#166534" };
//         return { label: wf || "—", bg: "#F1F5F9", cl: "#64748B" };
//     };

//     /* ── render ── */
//     return (
//         <SubAdminLayout>

//             {/* Toast */}
//             {toast.show && (
//                 <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#EF4444" : "#10B981" }}>
//                     {toast.message}
//                 </div>
//             )}

//             {/* ── Detail Modal ── */}
//             {selectedReport && (
//                 <div style={styles.modalOverlay} onClick={() => setSelectedReport(null)}>
//                     <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>

//                         {/* Header */}
//                         <div style={styles.modalHeader}>
//                             <div style={styles.modalEmployeeRow}>
//                                 <div style={{ ...styles.avatar, backgroundColor: getAvatarColor(selectedReport.user_name) }}>
//                                     {getInitials(selectedReport.user_name)}
//                                 </div>
//                                 <div>
//                                     <div style={styles.modalName}>{selectedReport.user_name}</div>
//                                     <div style={styles.modalEmail}>{selectedReport.user_email}</div>
//                                 </div>
//                             </div>
//                             <button onClick={() => setSelectedReport(null)} style={styles.modalCloseBtn}>✕</button>
//                         </div>

//                         {/* Meta chips */}
//                         <div style={styles.modalMetaRow}>
//                             <div style={styles.metaChip}>
//                                 <span style={styles.metaLabel}>📅 Date</span>
//                                 <span style={styles.metaValue}>{formatDate(selectedReport.date)}</span>
//                             </div>
//                             <div style={styles.metaChip}>
//                                 <span style={styles.metaLabel}>🟢 Check In</span>
//                                 <span style={styles.metaValue}>{selectedReport.check_in_time || "—"}</span>
//                             </div>
//                             <div style={styles.metaChip}>
//                                 <span style={styles.metaLabel}>🔴 Check Out</span>
//                                 <span style={styles.metaValue}>{selectedReport.check_out_time || "—"}</span>
//                             </div>
//                             <div style={styles.metaChip}>
//                                 <span style={styles.metaLabel}>📍 Work From</span>
//                                 <span style={styles.metaValue}>{workFromLabel(selectedReport.work_from).label}</span>
//                             </div>
//                         </div>

//                         {/* Status badges */}
//                         <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
//                             <span style={{ ...styles.chip, ...getAttBadge(selectedReport.attendance_status) }}>
//                                 {selectedReport.attendance_status_display || selectedReport.attendance_status || "—"}
//                             </span>
//                             <span style={{
//                                 ...styles.chip,
//                                 background: selectedReport.report_submitted ? "#DCFCE7" : "#FEE2E2",
//                                 color:      selectedReport.report_submitted ? "#166534" : "#991B1B",
//                             }}>
//                                 {selectedReport.report_submitted ? "✅ Report Submitted" : "❌ No Report"}
//                             </span>
//                         </div>

//                         {/* Report content */}
//                         <div style={styles.modalSection}>
//                             <div style={styles.modalFieldLabel}>✅ Work Done</div>
//                             <div style={styles.modalFieldValue}>
//                                 {selectedReport.work_done || <span style={{ color: "#CBD5E1" }}>Not submitted</span>}
//                             </div>
//                         </div>
//                         <div style={styles.modalSection}>
//                             <div style={styles.modalFieldLabel}>⚠️ Challenges</div>
//                             <div style={styles.modalFieldValue}>
//                                 {selectedReport.challenges || <span style={{ color: "#CBD5E1" }}>—</span>}
//                             </div>
//                         </div>
//                         <div style={styles.modalSection}>
//                             <div style={styles.modalFieldLabel}>📌 Plan for Tomorrow</div>
//                             <div style={styles.modalFieldValue}>
//                                 {selectedReport.plan_for_tomorrow || <span style={{ color: "#CBD5E1" }}>—</span>}
//                             </div>
//                         </div>

//                         {selectedReport.created_at && (
//                             <div style={styles.modalFooter}>
//                                 Submitted: {new Date(selectedReport.created_at).toLocaleString("en-GB", {
//                                     day: "2-digit", month: "short", year: "numeric",
//                                     hour: "2-digit", minute: "2-digit",
//                                 })}
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             )}

//             {/* ── Top Bar ── */}
//             <div style={styles.topBar}>
//                 <button onClick={() => navigate("/sub-admin")} style={styles.backBtn}>
//                     ← Back to Overview
//                 </button>
//             </div>

//             <h2 style={styles.pageTitle}>Team Daily Reports</h2>

//             {/* ── Filter Bar ── */}
//             <div style={styles.filterBar}>

//                 {/* From Date */}
//                 <div style={styles.filterGroup}>
//                     <label style={styles.filterLabel}>From Date</label>
//                     <input
//                         type="date"
//                         value={fromDate}
//                         onChange={(e) => setFromDate(e.target.value)}
//                         style={styles.filterInput}
//                     />
//                 </div>

//                 {/* To Date */}
//                 <div style={styles.filterGroup}>
//                     <label style={styles.filterLabel}>To Date</label>
//                     <input
//                         type="date"
//                         value={toDate}
//                         onChange={(e) => setToDate(e.target.value)}
//                         style={styles.filterInput}
//                     />
//                 </div>

//                 {/* Search — with live employee suggestions */}
//                 <div style={{ ...styles.filterGroup, flex: 1, minWidth: "220px", position: "relative" }}>
//                     <label style={styles.filterLabel}>Search Employee</label>
//                     <input
//                         type="text"
//                         placeholder="Type name or email..."
//                         value={search}
//                         onChange={(e) => setSearch(e.target.value)}
//                         style={{ ...styles.filterInput, width: "100%", boxSizing: "border-box" }}
//                     />
//                     {/* Suggestion dropdown — only while typing */}
//                     {search.length > 0 && employees.length > 0 && (
//                         <div style={styles.suggestionDropdown}>
//                             {employees
//                                 .filter((emp) => {
//                                     const full = `${emp.first_name} ${emp.last_name} ${emp.email}`.toLowerCase();
//                                     return full.includes(search.toLowerCase());
//                                 })
//                                 .slice(0, 6)
//                                 .map((emp) => {
//                                     const fullName = `${emp.first_name} ${emp.last_name}`;
//                                     return (
//                                         <div
//                                             key={emp.id}
//                                             style={styles.suggestionItem}
//                                             onMouseDown={() => setSearch(fullName)} // onMouseDown so blur doesn't hide first
//                                         >
//                                             <div style={{ ...styles.miniAvatar, backgroundColor: getAvatarColor(fullName) }}>
//                                                 {getInitials(fullName)}
//                                             </div>
//                                             <div>
//                                                 <div style={styles.suggName}>{fullName}</div>
//                                                 <div style={styles.suggEmail}>{emp.email}</div>
//                                             </div>
//                                         </div>
//                                     );
//                                 })}
//                         </div>
//                     )}
//                 </div>

//                 {/* Clear */}
//                 <div style={styles.filterBtns}>
//                     <button onClick={handleClearFilter} style={styles.clearBtn}>✕ Clear</button>
//                 </div>
//             </div>

//             {/* ── Table ── */}
//             <div style={styles.section}>
//                 {!loading && (
//                     <div style={styles.countBadge}>
//                         {pagination?.total_items ?? reports.length} report{(pagination?.total_items ?? reports.length) !== 1 ? "s" : ""} found
//                     </div>
//                 )}

//                 <div style={styles.tableWrapper}>
//                     <table style={styles.table}>
//                         <thead>
//                             <tr style={styles.tableHeader}>
//                                 <th style={{ ...styles.th, width: "46px" }}>S.No</th>
//                                 <th style={{ ...styles.th, width: "185px" }}>Employee</th>
//                                 <th style={{ ...styles.th, width: "110px" }}>Date</th>
//                                 <th style={{ ...styles.th, width: "105px" }}>In / Out</th>
//                                 <th style={{ ...styles.th, width: "95px" }}>Status</th>
//                                 <th style={{ ...styles.th, width: "90px" }}>Work From</th>
//                                 <th style={styles.th}>Work Done</th>
//                                 <th style={styles.th}>Challenges</th>
//                                 <th style={{ ...styles.th, width: "85px" }}>Report</th>
//                                 <th style={{ ...styles.th, width: "76px", textAlign: "center" }}>Detail</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {loading ? (
//                                 <tr><td colSpan="10" style={styles.loadingTd}>Loading reports...</td></tr>
//                             ) : reports.length > 0 ? (
//                                 reports.map((report, index) => {
//                                     const wf = workFromLabel(report.work_from);
//                                     return (
//                                         <tr key={`${report.id}-${index}`} style={styles.tableRow}>

//                                             <td style={styles.td}>
//                                                 {(currentPage - 1) * (pagination?.page_size || 20) + (index + 1)}
//                                             </td>

//                                             {/* Employee */}
//                                             <td style={styles.td}>
//                                                 <div style={styles.employeeCell}>
//                                                     <div style={{ ...styles.avatar, backgroundColor: getAvatarColor(report.user_name) }}>
//                                                         {getInitials(report.user_name)}
//                                                     </div>
//                                                     <div>
//                                                         <div style={styles.primaryText}>{report.user_name}</div>
//                                                         <div style={styles.subText}>{report.user_email}</div>
//                                                     </div>
//                                                 </div>
//                                             </td>

//                                             {/* Date */}
//                                             <td style={styles.td}>
//                                                 <div style={styles.dateText}>{formatDate(report.date)}</div>
//                                             </td>

//                                             {/* Check In/Out */}
//                                             <td style={styles.td}>
//                                                 <div style={styles.timeIn}>▲ {report.check_in_time || "—"}</div>
//                                                 <div style={styles.timeOut}>▼ {report.check_out_time || "—"}</div>
//                                             </td>

//                                             {/* Attendance Status */}
//                                             <td style={styles.td}>
//                                                 <span style={{ ...styles.chip, ...getAttBadge(report.attendance_status) }}>
//                                                     {report.attendance_status_display || report.attendance_status || "—"}
//                                                 </span>
//                                             </td>

//                                             {/* Work From */}
//                                             <td style={styles.td}>
//                                                 <span style={{ ...styles.chip, background: wf.bg, color: wf.cl }}>
//                                                     {wf.label}
//                                                 </span>
//                                             </td>

//                                             {/* Work Done */}
//                                             <td style={styles.td}>
//                                                 <div style={styles.truncatedCell} title={report.work_done || ""}>
//                                                     {report.work_done
//                                                         ? report.work_done.length > 55 ? report.work_done.slice(0, 55) + "..." : report.work_done
//                                                         : <span style={styles.naText}>—</span>}
//                                                 </div>
//                                             </td>

//                                             {/* Challenges */}
//                                             <td style={styles.td}>
//                                                 <div style={styles.truncatedCell} title={report.challenges || ""}>
//                                                     {report.challenges
//                                                         ? report.challenges.length > 50 ? report.challenges.slice(0, 50) + "..." : report.challenges
//                                                         : <span style={styles.naText}>—</span>}
//                                                 </div>
//                                             </td>

//                                             {/* Report Submitted */}
//                                             <td style={styles.td}>
//                                                 <span style={{
//                                                     ...styles.chip,
//                                                     background: report.report_submitted ? "#DCFCE7" : "#FEE2E2",
//                                                     color:      report.report_submitted ? "#166534" : "#991B1B",
//                                                 }}>
//                                                     {report.report_submitted ? "✅ Yes" : "❌ No"}
//                                                 </span>
//                                             </td>

//                                             {/* View */}
//                                             <td style={{ ...styles.td, textAlign: "center" }}>
//                                                 <button style={styles.viewBtn} onClick={() => setSelectedReport(report)}>
//                                                     View
//                                                 </button>
//                                             </td>
//                                         </tr>
//                                     );
//                                 })
//                             ) : (
//                                 <tr><td colSpan="10" style={styles.loadingTd}>No reports found for the selected filters.</td></tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Pagination */}
//                 <div style={styles.paginationContainer}>
//                     <div style={styles.pageInfo}>
//                         Showing {reports.length} of {pagination?.total_items ?? 0} reports
//                     </div>
//                     <div style={styles.paginationBtns}>
//                         <button
//                             disabled={!pagination?.has_previous || loading}
//                             onClick={() => fetchReports(currentPage - 1)}
//                             style={{ ...styles.pageBtn, opacity: pagination?.has_previous ? 1 : 0.5 }}
//                         >
//                             Previous
//                         </button>
//                         <span style={styles.currentPageText}>
//                             Page {pagination?.current_page ?? 1} / {pagination?.total_pages ?? 1}
//                         </span>
//                         <button
//                             disabled={!pagination?.has_next || loading}
//                             onClick={() => fetchReports(currentPage + 1)}
//                             style={{ ...styles.pageBtn, opacity: pagination?.has_next ? 1 : 0.5 }}
//                         >
//                             Next
//                         </button>
//                     </div>
//                 </div>
//             </div>

//         </SubAdminLayout>
//     );
// }

// const styles = {
//     toast: {
//         position: "fixed", top: "20px", right: "20px", color: "#fff",
//         padding: "12px 25px", borderRadius: "8px", zIndex: 9999,
//         fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "0.3s",
//     },
//     modalOverlay: {
//         position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
//         display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5000,
//     },
//     modalBox: {
//         backgroundColor: "#fff", borderRadius: "18px", padding: "28px",
//         maxWidth: "560px", width: "92%",
//         boxShadow: "0 24px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto",
//     },
//     modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
//     modalEmployeeRow: { display: "flex", alignItems: "center", gap: "14px" },
//     modalName: { fontSize: "17px", fontWeight: "800", color: "#1E293B" },
//     modalEmail: { fontSize: "12px", color: "#64748B", marginTop: "2px" },
//     modalCloseBtn: { background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#94A3B8", lineHeight: 1 },
//     modalMetaRow: { display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" },
//     metaChip: {
//         flex: 1, minWidth: "110px", background: "#F8FAFC", borderRadius: "10px",
//         padding: "10px 14px", display: "flex", flexDirection: "column", gap: "4px", border: "1px solid #F1F5F9",
//     },
//     metaLabel: { fontSize: "11px", color: "#94A3B8", fontWeight: "700", textTransform: "uppercase" },
//     metaValue: { fontSize: "13px", fontWeight: "700", color: "#1E293B" },
//     modalSection: {
//         marginBottom: "12px", padding: "12px 16px",
//         background: "#F8FAFC", borderRadius: "10px", border: "1px solid #F1F5F9",
//     },
//     modalFieldLabel: { fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", marginBottom: "6px" },
//     modalFieldValue: { fontSize: "14px", color: "#334155", lineHeight: "1.7" },
//     modalFooter: { fontSize: "11px", color: "#CBD5E1", textAlign: "right", marginTop: "16px" },
//     topBar: { marginBottom: "18px" },
//     backBtn: { background: "transparent", color: "#64748B", border: "none", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
//     pageTitle: { fontSize: "22px", color: "#1E293B", marginBottom: "20px", fontWeight: "800" },
//     filterBar: {
//         display: "flex", alignItems: "flex-end", gap: "14px",
//         background: "#fff", borderRadius: "14px", padding: "18px 20px",
//         boxShadow: "0 4px 16px rgba(0,0,0,0.05)", marginBottom: "22px", flexWrap: "wrap",
//     },
//     filterGroup: { display: "flex", flexDirection: "column", gap: "5px" },
//     filterLabel: { fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" },
//     filterInput: {
//         padding: "9px 14px", borderRadius: "10px", border: "1px solid #E2E8F0",
//         fontSize: "13px", outline: "none", fontFamily: "inherit", color: "#1E293B", minWidth: "150px",
//     },
//     filterBtns: { display: "flex", gap: "8px", alignItems: "flex-end" },
//     clearBtn: {
//         padding: "9px 14px", background: "#F1F5F9", color: "#64748B",
//         border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "13px", cursor: "pointer",
//     },
//     suggestionDropdown: {
//         position: "absolute", top: "100%", left: 0, right: 0,
//         background: "#fff", border: "1px solid #E2E8F0", borderRadius: "10px",
//         boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 200, marginTop: "4px",
//         maxHeight: "220px", overflowY: "auto",
//     },
//     suggestionItem: {
//         display: "flex", alignItems: "center", gap: "10px",
//         padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #F1F5F9",
//     },
//     miniAvatar: {
//         width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
//         display: "flex", alignItems: "center", justifyContent: "center",
//         color: "#fff", fontWeight: "800", fontSize: "11px",
//     },
//     suggName: { fontSize: "13px", fontWeight: "700", color: "#1E293B" },
//     suggEmail: { fontSize: "11px", color: "#94A3B8" },
//     section: {},
//     countBadge: { fontSize: "13px", fontWeight: "700", color: "#64748B", marginBottom: "10px" },
//     tableWrapper: {
//         background: "#fff", borderRadius: "16px", overflowX: "auto",
//         boxShadow: "0 10px 30px rgba(0,0,0,0.05)", border: "1px solid #F1F5F9",
//     },
//     table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "1150px" },
//     tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #EDF2F7" },
//     th: { padding: "16px", textAlign: "left", color: "#64748B", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9" },
//     td: { padding: "13px 16px", verticalAlign: "middle" },
//     loadingTd: { textAlign: "center", padding: "50px", color: "#64748B" },
//     employeeCell: { display: "flex", alignItems: "center", gap: "10px" },
//     avatar: {
//         width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
//         display: "flex", alignItems: "center", justifyContent: "center",
//         color: "#fff", fontWeight: "800", fontSize: "13px",
//     },
//     primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
//     subText: { fontSize: "11px", color: "#64748B", marginTop: "2px" },
//     dateText: { fontSize: "13px", fontWeight: "600", color: "#475569" },
//     timeIn: { fontSize: "12px", fontWeight: "700", color: "#166534" },
//     timeOut: { fontSize: "12px", fontWeight: "700", color: "#B45309", marginTop: "3px" },
//     chip: { padding: "4px 9px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", display: "inline-block", whiteSpace: "nowrap" },
//     truncatedCell: { fontSize: "13px", color: "#475569", lineHeight: "1.5" },
//     naText: { color: "#CBD5E1", fontSize: "12px" },
//     viewBtn: {
//         padding: "6px 14px", borderRadius: "8px", border: "1px solid #E2E8F0",
//         background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: "#4834D4",
//     },
//     paginationContainer: {
//         display: "flex", justifyContent: "space-between", alignItems: "center",
//         marginTop: "20px", padding: "0 10px",
//     },
//     pageInfo: { fontSize: "14px", color: "#64748B", fontWeight: "600" },
//     paginationBtns: { display: "flex", alignItems: "center", gap: "15px" },
//     pageBtn: {
//         padding: "8px 16px", borderRadius: "8px", border: "1px solid #E2E8F0",
//         background: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "600",
//     },
//     currentPageText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
// };

// export default TeamReports;






// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../../services/api";
// import SubAdminLayout from "../../components/SubAdminLayout";

// function TeamReports() {
//     const navigate = useNavigate();

//     const [reports, setReports] = useState([]);
//     const [loading, setLoading] = useState(true);

//     // Filters
//     const today = new Date();
//     const firstDayOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
//     const todayStr = today.toISOString().split("T")[0];

//     const [fromDate, setFromDate] = useState(firstDayOfMonth);
//     const [toDate, setToDate] = useState(todayStr);
//     const [userId, setUserId] = useState("");

//     // Pagination
//     const [currentPage, setCurrentPage] = useState(1);
//     const [pagination, setPagination] = useState({});

//     // Detail Modal
//     const [selectedReport, setSelectedReport] = useState(null);

//     // Toast
//     const [toast, setToast] = useState({ show: false, message: "", type: "" });

//     const showToast = (message, type = "success") => {
//         setToast({ show: true, message, type });
//         setTimeout(() => setToast({ show: false, message: "", type: "" }), 3500);
//     };

//     const buildUrl = (page = 1) => {
//         let url = `/attendance/admin/reports/?page=${page}`;
//         if (fromDate) url += `&from_date=${fromDate}`;
//         if (toDate) url += `&to_date=${toDate}`;
//         if (userId) url += `&user_id=${userId}`;
//         return url;
//     };

//     const fetchReports = async (page = 1) => {
//         setLoading(true);
//         try {
//             const res = await apiRequest(buildUrl(page), "GET");
//             if (res?.success && res?.data) {
//                 setReports(res.data.reports || []);
//                 setPagination(res.data.pagination || {});
//                 setCurrentPage(res.data.pagination?.current_page || page);
//             } else {
//                 showToast("Failed to load reports", "error");
//             }
//         } catch (error) {
//             console.error("Error fetching reports:", error);
//             showToast("Error loading reports", "error");
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Debounce for userId input
//     useEffect(() => {
//         const timer = setTimeout(() => {
//             fetchReports(1);
//         }, 400);
//         return () => clearTimeout(timer);
//     }, [fromDate, toDate, userId]);

//     const handleApplyFilter = () => {
//         fetchReports(1);
//     };

//     const handleClearFilter = () => {
//         setFromDate(firstDayOfMonth);
//         setToDate(todayStr);
//         setUserId("");
//     };

//     const formatDate = (dateStr) => {
//         if (!dateStr) return "—";
//         return new Date(dateStr).toLocaleDateString("en-GB", {
//             day: "2-digit", month: "short", year: "numeric",
//         });
//     };

//     const getAvatarColor = (name) => {
//         const colors = ["#4834D4", "#FF9B51", "#10B981", "#F59E0B", "#EC4899", "#3B82F6"];
//         let sum = 0;
//         for (let i = 0; i < (name || "").length; i++) sum += name.charCodeAt(i);
//         return colors[sum % colors.length];
//     };

//     const getInitials = (name) => {
//         const parts = (name || "").split(" ");
//         return parts.map((p) => p.charAt(0)).join("").toUpperCase().slice(0, 2);
//     };

//     return (
//         <SubAdminLayout>
//             {/* Toast */}
//             {toast.show && (
//                 <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#EF4444" : "#10B981" }}>
//                     {toast.message}
//                 </div>
//             )}

//             {/* Detail Modal */}
//             {selectedReport && (
//                 <div style={styles.modalOverlay} onClick={() => setSelectedReport(null)}>
//                     <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
//                         {/* Modal Header */}
//                         <div style={styles.modalHeader}>
//                             <div style={styles.modalEmployeeRow}>
//                                 <div style={{
//                                     ...styles.avatar,
//                                     backgroundColor: getAvatarColor(selectedReport.user_name),
//                                 }}>
//                                     {getInitials(selectedReport.user_name)}
//                                 </div>
//                                 <div>
//                                     <div style={styles.modalName}>{selectedReport.user_name}</div>
//                                     <div style={styles.modalEmail}>{selectedReport.user_email}</div>
//                                 </div>
//                             </div>
//                             <button onClick={() => setSelectedReport(null)} style={styles.modalCloseBtn}>✕</button>
//                         </div>

//                         {/* Date & Time Row */}
//                         <div style={styles.modalMetaRow}>
//                             <div style={styles.metaChip}>
//                                 <span style={styles.metaLabel}>📅 Date</span>
//                                 <span style={styles.metaValue}>{formatDate(selectedReport.date)}</span>
//                             </div>
//                             <div style={styles.metaChip}>
//                                 <span style={styles.metaLabel}>🟢 Check In</span>
//                                 <span style={styles.metaValue}>{selectedReport.check_in_time || "—"}</span>
//                             </div>
//                             <div style={styles.metaChip}>
//                                 <span style={styles.metaLabel}>🔴 Check Out</span>
//                                 <span style={styles.metaValue}>{selectedReport.check_out_time || "—"}</span>
//                             </div>
//                         </div>

//                         {/* Report Fields */}
//                         <div style={styles.modalSection}>
//                             <div style={styles.modalFieldLabel}>✅ Work Done</div>
//                             <div style={styles.modalFieldValue}>{selectedReport.work_done || "—"}</div>
//                         </div>

//                         {selectedReport.challenges && (
//                             <div style={styles.modalSection}>
//                                 <div style={styles.modalFieldLabel}>⚠️ Challenges</div>
//                                 <div style={styles.modalFieldValue}>{selectedReport.challenges}</div>
//                             </div>
//                         )}

//                         {selectedReport.plan_for_tomorrow && (
//                             <div style={styles.modalSection}>
//                                 <div style={styles.modalFieldLabel}>📌 Plan for Tomorrow</div>
//                                 <div style={styles.modalFieldValue}>{selectedReport.plan_for_tomorrow}</div>
//                             </div>
//                         )}

//                         <div style={styles.modalFooter}>
//                             Submitted: {new Date(selectedReport.created_at).toLocaleString("en-GB", {
//                                 day: "2-digit", month: "short", year: "numeric",
//                                 hour: "2-digit", minute: "2-digit",
//                             })}
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Top Bar */}
//             <div style={styles.topBar}>
//                 <button onClick={() => navigate("/sub-admin")} style={styles.backBtn}>
//                     ← Back to Overview
//                 </button>
//             </div>

//             <h2 style={styles.pageTitle}>Team Daily Reports</h2>

//             {/* Filter Bar */}
//             <div style={styles.filterBar}>
//                 <div style={styles.filterGroup}>
//                     <label style={styles.filterLabel}>From Date</label>
//                     <input
//                         type="date"
//                         value={fromDate}
//                         onChange={(e) => setFromDate(e.target.value)}
//                         style={styles.filterInput}
//                     />
//                 </div>
//                 <div style={styles.filterGroup}>
//                     <label style={styles.filterLabel}>To Date</label>
//                     <input
//                         type="date"
//                         value={toDate}
//                         onChange={(e) => setToDate(e.target.value)}
//                         style={styles.filterInput}
//                     />
//                 </div>
//                 <div style={styles.filterGroup}>
//                     <label style={styles.filterLabel}>User ID (optional)</label>
//                     <input
//                         type="number"
//                         placeholder="e.g. 1"
//                         value={userId}
//                         onChange={(e) => setUserId(e.target.value)}
//                         style={styles.filterInput}
//                     />
//                 </div>
//                 <div style={styles.filterBtns}>
//                     <button onClick={handleApplyFilter} style={styles.applyBtn}>
//                         🔍 Apply Filter
//                     </button>
//                     <button onClick={handleClearFilter} style={styles.clearBtn}>
//                         ✕ Clear
//                     </button>
//                 </div>
//             </div>

//             {/* Table */}
//             <div style={styles.section}>
//                 {/* Count Badge */}
//                 {!loading && (
//                     <div style={styles.countBadge}>
//                         {pagination?.total_items ?? reports.length} report{(pagination?.total_items ?? reports.length) !== 1 ? "s" : ""} found
//                     </div>
//                 )}

//                 <div style={styles.tableWrapper}>
//                     <table style={styles.table}>
//                         <thead>
//                             <tr style={styles.tableHeader}>
//                                 <th style={{ ...styles.th, width: "50px" }}>S.No</th>
//                                 <th style={{ ...styles.th, width: "200px" }}>Employee</th>
//                                 <th style={{ ...styles.th, width: "120px" }}>Date</th>
//                                 <th style={{ ...styles.th, width: "110px" }}>Check In/Out</th>
//                                 <th style={{ ...styles.th }}>Work Done</th>
//                                 <th style={{ ...styles.th }}>Challenges</th>
//                                 <th style={{ ...styles.th }}>Plan Tomorrow</th>
//                                 <th style={{ ...styles.th, width: "90px", textAlign: "center" }}>Detail</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {loading ? (
//                                 <tr>
//                                     <td colSpan="8" style={styles.loadingTd}>Loading reports...</td>
//                                 </tr>
//                             ) : reports.length > 0 ? (
//                                 reports.map((report, index) => (
//                                     <tr
//                                         key={report.id}
//                                         style={styles.tableRow}
//                                     >
//                                         <td style={styles.td}>
//                                             {(currentPage - 1) * (pagination?.page_size || 20) + (index + 1)}
//                                         </td>

//                                         {/* Employee */}
//                                         <td style={styles.td}>
//                                             <div style={styles.employeeCell}>
//                                                 <div style={{
//                                                     ...styles.avatar,
//                                                     backgroundColor: getAvatarColor(report.user_name),
//                                                 }}>
//                                                     {getInitials(report.user_name)}
//                                                 </div>
//                                                 <div>
//                                                     <div style={styles.primaryText}>{report.user_name}</div>
//                                                     <div style={styles.subText}>{report.user_email}</div>
//                                                 </div>
//                                             </div>
//                                         </td>

//                                         {/* Date */}
//                                         <td style={styles.td}>
//                                             <div style={styles.dateText}>{formatDate(report.date)}</div>
//                                         </td>

//                                         {/* Check In/Out */}
//                                         <td style={styles.td}>
//                                             <div style={styles.timeIn}>▲ {report.check_in_time || "—"}</div>
//                                             <div style={styles.timeOut}>▼ {report.check_out_time || "—"}</div>
//                                         </td>

//                                         {/* Work Done — truncated */}
//                                         <td style={styles.td}>
//                                             <div style={styles.truncatedCell} title={report.work_done}>
//                                                 {report.work_done
//                                                     ? report.work_done.length > 55
//                                                         ? report.work_done.slice(0, 55) + "..."
//                                                         : report.work_done
//                                                     : <span style={styles.naText}>—</span>
//                                                 }
//                                             </div>
//                                         </td>

//                                         {/* Challenges — truncated */}
//                                         <td style={styles.td}>
//                                             <div style={styles.truncatedCell} title={report.challenges}>
//                                                 {report.challenges
//                                                     ? report.challenges.length > 50
//                                                         ? report.challenges.slice(0, 50) + "..."
//                                                         : report.challenges
//                                                     : <span style={styles.naText}>—</span>
//                                                 }
//                                             </div>
//                                         </td>

//                                         {/* Plan Tomorrow — truncated */}
//                                         <td style={styles.td}>
//                                             <div style={styles.truncatedCell} title={report.plan_for_tomorrow}>
//                                                 {report.plan_for_tomorrow
//                                                     ? report.plan_for_tomorrow.length > 50
//                                                         ? report.plan_for_tomorrow.slice(0, 50) + "..."
//                                                         : report.plan_for_tomorrow
//                                                     : <span style={styles.naText}>—</span>
//                                                 }
//                                             </div>
//                                         </td>

//                                         {/* View Button */}
//                                         <td style={{ ...styles.td, textAlign: "center" }}>
//                                             <button
//                                                 style={styles.viewBtn}
//                                                 onClick={() => setSelectedReport(report)}
//                                             >
//                                                 View
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 ))
//                             ) : (
//                                 <tr>
//                                     <td colSpan="8" style={styles.loadingTd}>
//                                         No reports found for the selected filters.
//                                     </td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Pagination */}
//                 <div style={styles.paginationContainer}>
//                     <div style={styles.pageInfo}>
//                         Showing {reports.length} of {pagination?.total_items ?? 0} reports
//                     </div>
//                     <div style={styles.paginationBtns}>
//                         <button
//                             disabled={!pagination?.has_previous || loading}
//                             onClick={() => fetchReports(currentPage - 1)}
//                             style={{ ...styles.pageBtn, opacity: pagination?.has_previous ? 1 : 0.5 }}
//                         >
//                             Previous
//                         </button>
//                         <span style={styles.currentPageText}>
//                             Page {pagination?.current_page ?? 1} / {pagination?.total_pages ?? 1}
//                         </span>
//                         <button
//                             disabled={!pagination?.has_next || loading}
//                             onClick={() => fetchReports(currentPage + 1)}
//                             style={{ ...styles.pageBtn, opacity: pagination?.has_next ? 1 : 0.5 }}
//                         >
//                             Next
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </SubAdminLayout>
//     );
// }

// const styles = {
//     // Toast
//     toast: {
//         position: "fixed", top: "20px", right: "20px", color: "#fff",
//         padding: "12px 25px", borderRadius: "8px", zIndex: 9999,
//         fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "0.3s",
//     },

//     // Modal
//     modalOverlay: {
//         position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
//         display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5000,
//     },
//     modalBox: {
//         backgroundColor: "#fff", borderRadius: "18px", padding: "28px",
//         maxWidth: "540px", width: "92%",
//         boxShadow: "0 24px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto",
//     },
//     modalHeader: {
//         display: "flex", justifyContent: "space-between",
//         alignItems: "flex-start", marginBottom: "20px",
//     },
//     modalEmployeeRow: { display: "flex", alignItems: "center", gap: "14px" },
//     modalName: { fontSize: "17px", fontWeight: "800", color: "#1E293B" },
//     modalEmail: { fontSize: "12px", color: "#64748B", marginTop: "2px" },
//     modalCloseBtn: {
//         background: "none", border: "none", fontSize: "20px",
//         cursor: "pointer", color: "#94A3B8", lineHeight: 1,
//     },
//     modalMetaRow: {
//         display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap",
//     },
//     metaChip: {
//         flex: 1, minWidth: "120px", background: "#F8FAFC", borderRadius: "10px",
//         padding: "10px 14px", display: "flex", flexDirection: "column", gap: "4px",
//         border: "1px solid #F1F5F9",
//     },
//     metaLabel: { fontSize: "11px", color: "#94A3B8", fontWeight: "700", textTransform: "uppercase" },
//     metaValue: { fontSize: "14px", fontWeight: "700", color: "#1E293B" },
//     modalSection: {
//         marginBottom: "16px", padding: "14px 16px",
//         background: "#F8FAFC", borderRadius: "10px", border: "1px solid #F1F5F9",
//     },
//     modalFieldLabel: {
//         fontSize: "11px", fontWeight: "700", color: "#94A3B8",
//         textTransform: "uppercase", marginBottom: "6px",
//     },
//     modalFieldValue: {
//         fontSize: "14px", color: "#334155", lineHeight: "1.7",
//     },
//     modalFooter: {
//         fontSize: "11px", color: "#CBD5E1", textAlign: "right", marginTop: "16px",
//     },

//     // Page
//     topBar: { marginBottom: "18px" },
//     backBtn: {
//         background: "transparent", color: "#64748B", border: "none",
//         fontSize: "14px", fontWeight: "600", cursor: "pointer",
//     },
//     pageTitle: { fontSize: "22px", color: "#1E293B", marginBottom: "20px", fontWeight: "800" },

//     // Filter Bar
//     filterBar: {
//         display: "flex", alignItems: "flex-end", gap: "14px",
//         background: "#fff", borderRadius: "14px", padding: "18px 20px",
//         boxShadow: "0 4px 16px rgba(0,0,0,0.05)", marginBottom: "22px",
//         flexWrap: "wrap",
//     },
//     filterGroup: { display: "flex", flexDirection: "column", gap: "5px" },
//     filterLabel: {
//         fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase",
//     },
//     filterInput: {
//         padding: "9px 14px", borderRadius: "10px", border: "1px solid #E2E8F0",
//         fontSize: "13px", outline: "none", fontFamily: "inherit", color: "#1E293B",
//         minWidth: "150px",
//     },
//     filterBtns: { display: "flex", gap: "8px", alignItems: "flex-end" },
//     applyBtn: {
//         padding: "9px 18px", background: "#1E293B", color: "#fff",
//         border: "none", borderRadius: "10px", fontWeight: "700",
//         fontSize: "13px", cursor: "pointer",
//     },
//     clearBtn: {
//         padding: "9px 14px", background: "#F1F5F9", color: "#64748B",
//         border: "none", borderRadius: "10px", fontWeight: "700",
//         fontSize: "13px", cursor: "pointer",
//     },

//     // Table
//     section: {},
//     countBadge: {
//         fontSize: "13px", fontWeight: "700", color: "#64748B",
//         marginBottom: "10px",
//     },
//     tableWrapper: {
//         background: "#fff", borderRadius: "16px", overflowX: "auto",
//         boxShadow: "0 10px 30px rgba(0,0,0,0.05)", border: "1px solid #F1F5F9",
//     },
//     table: {
//         width: "100%", borderCollapse: "collapse",
//         tableLayout: "fixed", minWidth: "1050px",
//     },
//     tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #EDF2F7" },
//     th: {
//         padding: "16px", textAlign: "left", color: "#64748B",
//         fontSize: "12px", fontWeight: "700", textTransform: "uppercase",
//     },
//     tableRow: { borderBottom: "1px solid #F1F5F9" },
//     td: { padding: "14px 16px", verticalAlign: "middle" },
//     loadingTd: { textAlign: "center", padding: "50px", color: "#64748B" },

//     // Cells
//     employeeCell: { display: "flex", alignItems: "center", gap: "10px" },
//     avatar: {
//         width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
//         display: "flex", alignItems: "center", justifyContent: "center",
//         color: "#fff", fontWeight: "800", fontSize: "13px",
//     },
//     primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
//     subText: { fontSize: "11px", color: "#64748B", marginTop: "2px" },
//     dateText: { fontSize: "13px", fontWeight: "600", color: "#475569" },
//     timeIn: { fontSize: "12px", fontWeight: "700", color: "#166534" },
//     timeOut: { fontSize: "12px", fontWeight: "700", color: "#B45309", marginTop: "3px" },
//     truncatedCell: {
//         fontSize: "13px", color: "#475569", lineHeight: "1.5",
//     },
//     naText: { color: "#CBD5E1", fontSize: "12px" },
//     viewBtn: {
//         padding: "6px 14px", borderRadius: "8px",
//         border: "1px solid #E2E8F0", background: "#fff",
//         cursor: "pointer", fontSize: "12px", fontWeight: "700",
//         color: "#4834D4",
//     },

//     // Pagination
//     paginationContainer: {
//         display: "flex", justifyContent: "space-between", alignItems: "center",
//         marginTop: "20px", padding: "0 10px",
//     },
//     pageInfo: { fontSize: "14px", color: "#64748B", fontWeight: "600" },
//     paginationBtns: { display: "flex", alignItems: "center", gap: "15px" },
//     pageBtn: {
//         padding: "8px 16px", borderRadius: "8px", border: "1px solid #E2E8F0",
//         background: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "600",
//     },
//     currentPageText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
// };

// export default TeamReports;