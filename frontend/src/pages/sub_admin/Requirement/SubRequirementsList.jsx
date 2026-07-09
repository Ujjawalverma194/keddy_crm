import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import { asList } from "../../../utils/apiHelpers";
import BaseLayout from "../../components/SubAdminLayout";
import StatusTimer from "../../../components/StatusTimer";

function SubAdminRequirementList() {
    const navigate = useNavigate();
    const [requirements, setRequirements] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    // eslint-disable-next-line no-unused-vars
    const [totalPages, setTotalPages] = useState(1);
    // eslint-disable-next-line no-unused-vars
    const [totalItems, setTotalItems] = useState(0);
    // eslint-disable-next-line no-unused-vars
    const [hasNext, setHasNext] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [hasPrevious, setHasPrevious] = useState(false);

    const [selectedRequirementId, setSelectedRequirementId] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [empSearch, setEmpSearch] = useState("");
    const [selectedJd, setSelectedJd] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    const getAuthHeaders = () => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    };

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const fetchRequirements = async (page = 1, search = "", status = "") => {
        setLoading(true);
        try {
            let url = `/jd-mapping/api/requirements/list/?page=${page}&search=${encodeURIComponent(search)}`;
            if (status) url += `&status=${encodeURIComponent(status)}`;
            const response = await apiRequest(url, "GET", null, getAuthHeaders());
            if (response && response.success) {
                setRequirements(response.results || []);
                setTotalItems(response.pagination.total_items);
                setTotalPages(response.pagination.total_pages);
                setHasNext(!!response.pagination.next);
                setHasPrevious(!!response.pagination.previous);
                setCurrentPage(page);
            }
        } catch (error) {
            notify("Failed to fetch data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => fetchRequirements(1, searchQuery, statusFilter), 500);
        return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        const fetchEmployees = async () => {
            const response = await apiRequest("/sub-admin/api/users/", "GET");
            setEmployees(asList(response));
        };
        fetchEmployees();
    }, []);

    // 1. FIXED: Assigned Team logic using .name (as per your reference code)
    const renderAssignedTeam = (assignments, totalCount) => {
        if (!assignments || assignments.length === 0 || totalCount === 0) {
            return <div style={styles.unassignedText}>Not Assigned</div>;
        }
        // split(' ')[0] to get first name only like your requirement
        const displayNames = assignments.slice(0, 2).map(a => a.name?.split(' ')[0] || 'User').join(', ');
        const remaining = totalCount > 2 ? totalCount - 2 : 0;
        return (
            <div style={styles.assignWrapper}>
                <span style={styles.assignNames}>{displayNames}</span>
                {remaining > 0 && <span style={styles.assignBadge}>+{remaining}</span>}
            </div>
        );
    };

    const handleAssignSubmit = async () => {
        try {
            await apiRequest("/jd-mapping/api/assignments/create/", "POST", {
                requirement_id: selectedRequirementId,
                assigned_to_ids: selectedEmployees
            }, getAuthHeaders());
            notify("Assigned Successfully!");
            setShowAssignModal(false);
            fetchRequirements(currentPage, searchQuery, statusFilter);
        } catch (error) {
            notify("Assignment Failed", "error");
        }
    };

    const truncateText = (text, maxLength) => {
        if (!text) return "—";
        return text.length > maxLength ? text.substring(0, maxLength).trim() + "..." : text;
    };

    const getStatusBadgeStyle = (status) => {
        switch ((status || "").toUpperCase()) {
            case "HOT":
                return styles.hotStatusBadge;
            case "WARM":
                return styles.warmStatusBadge;
            case "COLD":
                return styles.coldStatusBadge;
            default:
                return styles.defaultStatusBadge;
        }
    };

    const getRequirementRowBg = (req) => {
        if (selectedRequirementId === req.id) return "#FFFBEB";

        switch ((req.status || "").toUpperCase()) {
            case "HOT":
                return "#FFF4ED";
            case "WARM":
                return "#FFFBEB";
            case "COLD":
                return "#F8FAFC";
            default:
                return "transparent";
        }
    };

    const handleOpenJdModal = (req) => {
        setCopySuccess(false);
        setSelectedJd({
            title: req?.title || "Requirement",
            desc: req?.jd_description || "No description provided.",
        });
    };

    const handleCopyJd = async () => {
        const jdText = selectedJd?.desc || "";
        if (!jdText) return;

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(jdText);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = jdText;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }

            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 1800);
        } catch (error) {
            console.error("Copy JD failed:", error);
            alert("Unable to copy JD. Please try again.");
        }
    };

    return (
        <BaseLayout>
            {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#EF4444' : '#10B981'}}>{toast.msg}</div>}

            <div style={styles.topBar}>
                <div style={styles.leftActions}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                    <div style={styles.filterGroup}>
                         <button onClick={() => navigate("/sub-admin/requirements/my?type=today")} style={styles.filterBtn}>Today's</button>
                         <button onClick={() => navigate("/sub-admin/requirements/my?type=yesterday")} style={styles.filterBtn}>Yesterday's</button>
                         <button onClick={() => navigate("/sub-admin/requirements")} style={styles.filterBtn}>All</button>
                    </div>
                  
                </div>
                <div style={styles.searchContainer}>
                    <input type="text" placeholder="Search..." style={styles.searchInput} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
                </div>
                <button onClick={() => setShowAssignModal(true)} style={selectedRequirementId ? styles.addBtn : styles.disabledBtn} disabled={!selectedRequirementId}>
                    Assign Selected
                </button>

                <button onClick={() => navigate("/sub-admin/requirement/create")} style={styles.addBtn}>
                    create Requirement
                </button>
            </div>
               <div style={styles.filterGroup}>
                         <button
                            type="button"
                            onClick={() => { setStatusFilter(""); setCurrentPage(1); fetchRequirements(1, searchQuery, ""); }}
                            style={!statusFilter ? styles.activeFilterBtn : styles.filterBtn}
                         >
                            All Status
                         </button>
                         <button
                            type="button"
                            onClick={() => { setStatusFilter("HOT"); setCurrentPage(1); fetchRequirements(1, searchQuery, "HOT"); }}
                            style={statusFilter === "HOT" ? styles.hotFilterBtnActive : styles.filterBtn}
                         >
                            HOT
                         </button>
                         <button
                            type="button"
                            onClick={() => { setStatusFilter("WARM"); setCurrentPage(1); fetchRequirements(1, searchQuery, "WARM"); }}
                            style={statusFilter === "WARM" ? styles.warmFilterBtnActive : styles.filterBtn}
                         >
                            WARM
                         </button>
                         <button
                            type="button"
                            onClick={() => { setStatusFilter("COLD"); setCurrentPage(1); fetchRequirements(1, searchQuery, "COLD"); }}
                            style={statusFilter === "COLD" ? styles.coldFilterBtnActive : styles.filterBtn}
                         >
                            COLD
                         </button>
                    </div>
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeader}>
                            <th style={{ width: "50px", ...styles.th }}>Sel</th>
                            <th style={{ width: "130px", ...styles.th }}>ID & Date</th>
                            <th style={{ width: "200px", ...styles.th }}>Title & Client</th>
                            <th style={{ width: "120px", ...styles.th }}>Exp/Rate</th>
                            <th style={{ width: "100px", ...styles.th }}>Status</th>
                            {/* FIXED: Smaller Width for JD */}
                            <th style={{ width: "200px", ...styles.th }}>JD Description</th>
                            <th style={{ width: "150px", ...styles.th }}>Stats / Team</th>
                            <th style={{ width: "160px", textAlign: "center", ...styles.th }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="8" style={styles.loadingTd}>Loading...</td></tr> : 
                        requirements.map((req) => (
                            <tr key={req.id} style={{...styles.tableRow, background: getRequirementRowBg(req)}}>
                                <td style={styles.td}><input type="radio" checked={selectedRequirementId === req.id} onChange={() => setSelectedRequirementId(req.id)} /></td>
                                <td style={styles.td}>
                                    <div style={styles.reqIdBadge}>{req.requirement_id}</div>
                                    <div style={styles.dateText}>{new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.primaryText}>{truncateText(req.title, 30)}</div>
                                    <div style={styles.subText}>{req.client_name}</div>
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.infoText}>{req.experience_required}</div>
                                    <div style={styles.rateText}>{req.rate || "—"}</div>
                                </td>
                                <td style={styles.td}>
                                    <span style={getStatusBadgeStyle(req.status)}>{req.status || "—"}</span>
                                    <StatusTimer
                                        createdAt={req.created_at}
                                        status={req.status}
                                        manual_status={req.manual_status}
                                        manual_status_updated_at={req.manual_status_updated_at}
                                    />
                                </td>
                                <td style={styles.td}>
                                    {/* 2. FIXED: JD Click now properly opens modal */}
                                    <div style={styles.jdTruncate} onClick={(e) => { e.stopPropagation(); handleOpenJdModal(req); }}>
                                        {req.jd_description || "No description provided."}
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.statLine}>Submissions: <strong>{req.total_submissions}</strong></div>
                                    {renderAssignedTeam(req.assigned_to, req.assigned_count)}
                                </td>
                                <td style={styles.actionTd}>
                                    <div style={styles.actionGroup}>
                                        <button style={styles.viewBtn} onClick={() => navigate(`/sub-admin/requirement/view/${req.id}`)}>View</button>
                                        <button style={styles.editBtn} onClick={() => navigate(`/sub-admin/requirement/edit/${req.id}`)}>Update</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls Here (Same as previous) */}

            {/* 3. FIXED: Proper Responsive Assignment Modal */}
            {showAssignModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Assign Employees</h3>
                            <button style={styles.closeBtn} onClick={() => setShowAssignModal(false)}>✕</button>
                        </div>
                        <div style={styles.modalScrollBody}>
                            <input 
                                placeholder="Search employee..." 
                                style={styles.modalSearchInput} 
                                value={empSearch}
                                onChange={e => setEmpSearch(e.target.value)} 
                            />
                            <div style={styles.empList}>
                                {employees.filter(e => `${e.first_name} ${e.last_name}`.toLowerCase().includes(empSearch.toLowerCase())).map(emp => (
                                    <div key={emp.id} style={styles.empItem}>
                                        <input type="checkbox" checked={selectedEmployees.includes(emp.id)} onChange={() => setSelectedEmployees(prev => prev.includes(emp.id) ? prev.filter(x => x !== emp.id) : [...prev, emp.id])} />
                                        <span style={{marginLeft:'10px', fontSize:'13px'}}>{emp.first_name} {emp.last_name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={styles.modalFooter}>
                            <button style={styles.saveBtn} onClick={handleAssignSubmit}>Assign Now</button>
                            <button style={styles.cancelBtn} onClick={() => setShowAssignModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. FIXED: JD Popup Modal */}
            {selectedJd && (
                <div style={styles.modalOverlay} onClick={() => setSelectedJd(null)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>{selectedJd.title} - JD</h3>
                            <div style={styles.modalActions}>
                                <button
                                    type="button"
                                    style={copySuccess ? styles.copyBtnSuccess : styles.copyBtn}
                                    onClick={handleCopyJd}
                                >
                                    {copySuccess ? "✓ Copied!" : "Copy JD"}
                                </button>
                                <button type="button" style={styles.closeBtn} onClick={() => setSelectedJd(null)}>✕</button>
                            </div>
                        </div>
                        <div style={styles.modalBody}>{selectedJd.desc}</div>
                    </div>
                </div>
            )}
        </BaseLayout>
    );
}

const styles = {
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 10001, fontWeight: '700' },
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "10px", flexWrap: "wrap" },
    leftActions: { display: "flex", alignItems: "center", gap: "10px" },
    backBtn: { background: "#1e293b", border: "none", fontWeight: "600", cursor: "pointer", color: "white",padding:"10px" , borderRadius:"10px" },
    filterGroup: { display: "flex", gap: "5px", paddingBottom:"20px" },
    filterBtn: { background: "#F1F5F9", border: "1px solid #CBD5E1", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
    activeFilterBtn: { background: "#25343F", color: "#fff", border: "1px solid #25343F", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", cursor: "pointer" },
    hotFilterBtnActive: { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "900", cursor: "pointer" },
    warmFilterBtnActive: { background: "#FFFBEB", color: "#F59E0B", border: "1px solid #FCD34D", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "900", cursor: "pointer" },
    coldFilterBtnActive: { background: "#F1F5F9", color: "#64748B", border: "1px solid #CBD5E1", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "900", cursor: "pointer" },
    searchContainer: { flex: "1 1 200px", maxWidth: "300px" },
    searchInput: { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box" },
    addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
    disabledBtn: { background: "#E2E8F0", color: "#94A3B8", border: "none", padding: "10px 15px", borderRadius: "8px", fontWeight: "700", cursor: "not-allowed" },
    
    tableWrapper: { background: "#fff", borderRadius: "12px", overflowX: "auto", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
    table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "1150px" },
    th: { padding: "12px 15px", textAlign: "left", background: "#F8FAFC", color: "#64748B", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" },
    td: { padding: "12px 15px", verticalAlign: "middle", borderBottom: "1px solid #F1F5F9" },
    reqIdBadge: { background: "#EFF6FF", color: "#2563EB", padding: "3px 8px", borderRadius: "4px", fontWeight: "700", fontSize: "11px", display: "inline-block" },
    dateText: { fontSize: "10px", color: "#94A3B8", marginTop: "2px" },
    primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "13px" },
    subText: { fontSize: "11px", color: "#64748B" },
    infoText: { fontSize: "12px", fontWeight: "600" },
    rateText: { fontSize: "11px", color: "#10B981", fontWeight: "700" },
    hotStatusBadge: { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", padding: "4px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: "900", display: "inline-block" },
    warmStatusBadge: { background: "#FFFBEB", color: "#F59E0B", border: "1px solid #FCD34D", padding: "4px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: "900", display: "inline-block" },
    coldStatusBadge: { background: "#F1F5F9", color: "#64748B", border: "1px solid #CBD5E1", padding: "4px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: "900", display: "inline-block" },
    defaultStatusBadge: { background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0", padding: "4px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", display: "inline-block" },
    jdTruncate: { fontSize: "12px", color: "#475569", cursor: "pointer", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", borderBottom: "1px dashed #CBD5E1" },
    
    statLine: { fontSize: "11px", color: "#64748B", marginBottom: "4px" },
    assignWrapper: { display: "flex", alignItems: "center", gap: "4px" },
    assignNames: { fontSize: "11px", color: "#1E293B", background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" },
    assignBadge: { fontSize: "10px", background: "#1E293B", color: "#fff", padding: "1px 4px", borderRadius: "3px", fontWeight: "700" },
    unassignedText: { fontSize: "11px", color: "#94A3B8", fontStyle: "italic" },

    actionTd: { textAlign: "center" },
    actionGroup: { display: "flex", gap: "5px", justifyContent: "center" },
    viewBtn: { padding: "5px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer" },
    editBtn: { padding: "5px 10px", borderRadius: "6px", border: "none", background: "#1E293B", color: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer" },
    
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "15px" },
    modalContent: { background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "450px", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" },
    modalHeader: { padding: "15px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" },
    modalActions: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
    copyBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(255,155,81,0.25)" },
    copyBtnSuccess: { background: "#16A34A", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(22,163,74,0.25)" },
    modalTitle: { margin: 0, fontSize: "16px", fontWeight: "800", color: "#1E293B" },
    modalScrollBody: { padding: "20px", overflowY: "auto", flex: 1 },
    modalSearchInput: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box", marginBottom: "15px" },
    empList: { border: "1px solid #F1F5F9", borderRadius: "8px", padding: "5px" },
    empItem: { display: "flex", alignItems: "center", padding: "10px", borderBottom: "1px solid #F8FAFC" },
    modalFooter: { padding: "15px 20px", borderTop: "1px solid #F1F5F9", display: "flex", gap: "10px" },
    saveBtn: { flex: 1, background: "#FF9B51", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
    cancelBtn: { flex: 1, background: "#F1F5F9", color: "#475569", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
    modalBody: { padding: "20px", overflowY: "auto", fontSize: "14px", lineHeight: "1.6", color: "#334155", whiteSpace: "pre-wrap" },
    closeBtn: { background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748B" },
};

export default SubAdminRequirementList;
