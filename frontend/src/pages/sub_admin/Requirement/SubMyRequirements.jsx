import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import BaseLayout from "../../components/SubAdminLayout";
import StatusTimer from "../../../components/StatusTimer";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function MyRequirements() {
    const navigate = useNavigate();
    const query = useQuery();
    const typeParam = query.get("type") || "both";

    const [requirements, setRequirements] = useState([]);
    const [stats, setStats] = useState({ total: 0, created_by_me: 0, assigned_to_me: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedJd, setSelectedJd] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const fetchMyRequirements = async (type, search, status = "") => {
        setLoading(true);
        try {
            let url = `/jd-mapping/company-jds/?type=${type}&search=${encodeURIComponent(search)}`;
            if (status) url += `&status=${encodeURIComponent(status)}`;
            const response = await apiRequest(url, "GET");
            if (response && response.success) {
                setRequirements(response.results || []);
                setStats(response.stats || { total: 0, created_by_me: 0, assigned_to_me: 0 });
            }
        } catch (error) {
            console.error("Error fetching my requirements:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchMyRequirements(typeParam, searchQuery, statusFilter);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, typeParam, statusFilter]);

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

    const renderAssignedTeam = (assignments) => {
        if (!assignments || assignments.length === 0) {
            return <div style={styles.unassignedText}>Not Assigned</div>;
        }
        const displayNames = assignments.slice(0, 2).map(a => a.name?.split(' ')[0] || 'User').join(', ');
        const remaining = assignments.length > 2 ? assignments.length - 2 : 0;
        return (
            <div style={styles.assignWrapper}>
                <span style={styles.assignNames}>{displayNames}</span>
                {remaining > 0 && <span style={styles.assignBadge}>+{remaining}</span>}
            </div>
        );
    };

    const getPageTitle = () => {
        if (typeParam === 'today') return "Today's Requirements";
        if (typeParam === 'yesterday') return "Yesterday's Requirements";
        return "Today & Yesterday Requirements";
    };
const visibleRequirements = requirements.filter((req) => {
    if (!statusFilter) return true;
    return String(req.status || "").toUpperCase() === statusFilter;
});
    return (
        <BaseLayout>
            <div style={styles.topBar}>
                <div style={styles.leftActions}>
                     <button onClick={() => navigate('/sub-admin')} style={styles.backBtn}>← Dashboard</button>
                     <div style={styles.filterGroup}>
                         <button onClick={() => navigate("/sub-admin/requirements/my?type=today")} style={typeParam === 'today' ? styles.activeFilterBtn : styles.filterBtn}>Today</button>
                         <button onClick={() => navigate("/sub-admin/requirements/my?type=yesterday")} style={typeParam === 'yesterday' ? styles.activeFilterBtn : styles.filterBtn}>Yesterday</button>
                         <button onClick={() => navigate("/sub-admin/requirements")} style={typeParam === 'All' ? styles.activeFilterBtn : styles.filterBtn}>All</button>
                     </div>

                  
                </div>

                <div style={styles.searchContainer}>
                    <input 
                        type="text" 
                        placeholder="Search by ID, Title, Client, Skills..." 
                        style={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
   <div style={styles.filterGroup}>
                         <button
                            type="button"
                            onClick={() => { setStatusFilter(""); fetchMyRequirements(typeParam, searchQuery, ""); }}
                            style={!statusFilter ? styles.activeFilterBtn : styles.filterBtn}
                         >
                            All Status
                         </button>
                         <button
                            type="button"
                            onClick={() => { setStatusFilter("HOT"); fetchMyRequirements(typeParam, searchQuery, "HOT"); }}
                            style={statusFilter === "HOT" ? styles.hotFilterBtnActive : styles.filterBtn}
                         >
                            HOT
                         </button>
                         <button
                            type="button"
                            onClick={() => { setStatusFilter("WARM"); fetchMyRequirements(typeParam, searchQuery, "WARM"); }}
                            style={statusFilter === "WARM" ? styles.warmFilterBtnActive : styles.filterBtn}
                         >
                            WARM
                         </button>
                         <button
                            type="button"
                            onClick={() => { setStatusFilter("COLD"); fetchMyRequirements(typeParam, searchQuery, "COLD"); }}
                            style={statusFilter === "COLD" ? styles.coldFilterBtnActive : styles.filterBtn}
                         >
                            COLD
                         </button>
                     </div>
            <div style={styles.statsContainer}>
                <div style={styles.statCard}>Total: <strong>{stats.total}</strong></div>
                <div style={styles.statCard}>Created By Me: <strong style={{color: '#27AE60'}}>{stats.created_by_me}</strong></div>
                <div style={styles.statCard}>Assigned To Me: <strong style={{color: '#2563EB'}}>{stats.assigned_to_me}</strong></div>
            </div>

            <div style={styles.section}>
                <h2 style={styles.pageTitle}>{getPageTitle()}</h2>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.th, width: "130px" }}>ID & Date</th>
                                <th style={{ ...styles.th, width: "220px" }}>Title & Client</th>
                                <th style={{ ...styles.th, width: "140px" }}>Exp / Rate</th>
                                <th style={{ ...styles.th, width: "100px" }}>Status</th>
                                <th style={{ ...styles.th, width: "240px" }}>JD Description</th>
                                <th style={{ ...styles.th, width: "140px" }}>Stats / Team</th>
                                <th style={{ ...styles.th, textAlign: "center", width: "160px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={styles.loadingTd}>Loading requirements...</td></tr>
                            ) : visibleRequirements.length > 0 ? (
                               visibleRequirements.map((req) => (
                                    <tr key={req.id} style={{ ...styles.tableRow, background: getRequirementRowBg(req) }}>
                                        <td style={styles.td}>
                                            <div style={styles.reqIdBadge}>{req.requirement_id}</div>
                                            <div style={styles.dateText}>
                                                {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.primaryText} title={req.title}>{truncateText(req.title, 35)}</div>
                                            <div style={styles.subText} title={req.client_details?.company_name}>{truncateText(req.client_details?.company_name, 30)}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.infoText} title={req.experience_required}>{truncateText(req.experience_required, 15)}</div>
                                            <div style={styles.rateText} title={req.rate}>{truncateText(req.rate, 15)}</div>
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
                                            <div 
                                                style={styles.jdTruncate} 
                                                onClick={(e) => { e.stopPropagation(); handleOpenJdModal(req); }}
                                            >
                                                {req.jd_description || "No description provided."}
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.statLine}>Submissions: <strong>{req.total_submissions}</strong></div>
                                            {renderAssignedTeam(req.assigned_to_details)}
                                        </td>
                                        <td style={styles.actionTd}>
                                            <div style={styles.actionGroup}>
                                                <button title="View Details" style={styles.viewBtn} onClick={() => navigate(`/sub-admin/requirement/view/${req.id}`)}>View</button>
                                                <button title="Update Requirement" style={styles.editBtn} onClick={() => navigate(`/sub-admin/requirement/edit/${req.id}`)}>Update</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" style={styles.loadingTd}>No requirements found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", gap: "15px", flexWrap: "wrap" },
    leftActions: { display: "flex", alignItems: "center", gap: "15px" },
    backBtn: { background: "#1e293b", color: "white", border: "none", fontWeight: "600", cursor: "pointer" ,padding:"10px", borderRadius:"10px"},
    filterGroup: { display: "flex", gap: "10px", background: "#F1F5F9", padding: "4px", borderRadius: "8px",marginBottom:"20px" },
    filterBtn: { background: "transparent", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", color: "#475569", cursor: "pointer", transition: "0.2s" },
    activeFilterBtn: { background: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", color: "#1E293B", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", transition: "0.2s" },
    hotFilterBtnActive: { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "900", cursor: "pointer", transition: "0.2s" },
    warmFilterBtnActive: { background: "#FFFBEB", color: "#F59E0B", border: "1px solid #FCD34D", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "900", cursor: "pointer", transition: "0.2s" },
    coldFilterBtnActive: { background: "#F1F5F9", color: "#64748B", border: "1px solid #CBD5E1", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "900", cursor: "pointer", transition: "0.2s" },
    searchContainer: { flex: "1 1 250px", maxWidth: "400px" },
    searchInput: { width: "100%", padding: "10px 15px", borderRadius: "10px", border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box" },
    statsContainer: { display: "flex", gap: "15px", marginBottom: "25px", flexWrap: "wrap" },
    statCard: { background: "#fff", padding: "12px 20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", fontSize: "14px", color: "#475569", border: "1px solid #E2E8F0" },
    pageTitle: { fontSize: "20px", color: "#1E293B", marginBottom: "15px", fontWeight: "800" },
    tableWrapper: { background: "#fff", borderRadius: "12px", overflowX: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" },
    table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "1100px" },
    tableHeader: { background: "#F8FAFC", borderBottom: "1px solid #EDF2F7" },
    th: { padding: "15px", textAlign: "left", color: "#64748B", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" },
    tableRow: { borderBottom: "1px solid #F1F5F9" },
    td: { padding: "15px", verticalAlign: "middle" },
    reqIdBadge: { background: "#EFF6FF", color: "#2563EB", padding: "4px 8px", borderRadius: "5px", fontWeight: "700", fontSize: "12px", display: "inline-block", marginBottom: "4px" },
    dateText: { fontSize: "11px", color: "#94A3B8", fontWeight: "600", paddingLeft: "2px" },
    primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
    subText: { fontSize: "12px", color: "#64748B", marginTop: "2px" },
    infoText: { fontSize: "13px", fontWeight: "600" },
    rateText: { fontSize: "12px", color: "#10B981", fontWeight: "700" },
    hotStatusBadge: { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", padding: "4px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: "900", display: "inline-block" },
    warmStatusBadge: { background: "#FFFBEB", color: "#F59E0B", border: "1px solid #FCD34D", padding: "4px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: "900", display: "inline-block" },
    coldStatusBadge: { background: "#F1F5F9", color: "#64748B", border: "1px solid #CBD5E1", padding: "4px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: "900", display: "inline-block" },
    defaultStatusBadge: { background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0", padding: "4px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", display: "inline-block" },
    jdTruncate: { fontSize: "13px", color: "#475569", lineHeight: "1.5", cursor: "pointer", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" },
    statLine: { fontSize: "12px", color: "#334155", marginBottom: "6px" },
    assignWrapper: { display: "flex", alignItems: "center", gap: "5px" },
    assignNames: { fontSize: "12px", color: "#0F172A", background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "3px 8px", borderRadius: "6px", fontWeight: "600" },
    assignBadge: { fontSize: "10px", background: "#1E293B", color: "#fff", padding: "2px 5px", borderRadius: "4px", fontWeight: "700" },
    unassignedText: { fontSize: "11px", color: "#94A3B8", fontStyle: "italic" },
    actionTd: { textAlign: "center" },
    actionGroup: { display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" },
    viewBtn: { background: "#F8FAFC", color: "#0F172A", border: "1px solid #CBD5E1", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700", transition: "0.2s" },
    editBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "7px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700", transition: "0.2s" },
    loadingTd: { textAlign: "center", padding: "40px", color: "#64748B" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modalContent: { background: "#fff", borderRadius: "12px", width: "90%", maxWidth: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
    modalHeader: { padding: "15px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" },
    modalActions: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
    copyBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(255,155,81,0.25)" },
    copyBtnSuccess: { background: "#16A34A", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(22,163,74,0.25)" },
    modalTitle: { margin: 0, fontSize: "16px", color: "#1E293B", fontWeight: "800" },
    closeBtn: { background: "transparent", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748B" },
    modalBody: { padding: "20px", overflowY: "auto", fontSize: "14px", lineHeight: "1.6", color: "#334155", whiteSpace: "pre-wrap" }
};

export default MyRequirements;