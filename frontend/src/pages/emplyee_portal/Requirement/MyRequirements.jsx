import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import BaseLayout from "../../components/emp_base";
import RequirementRowWrapper from "../../../components/RequirementRowWrapper";
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
    const [selectedJd, setSelectedJd] = useState(null);
    
    const [actionDropdownOpenMy, setActionDropdownOpenMy] = useState(null);
    const [actionDropdownOpenAvailable, setActionDropdownOpenAvailable] = useState(null);

    const [availableRequirements, setAvailableRequirements] = useState([]);
    const [availableStats, setAvailableStats] = useState({ total_available: 0, hot_count: 0, warm_count: 0, cold_count: 0 });
    const [loadingAvailable, setLoadingAvailable] = useState(true);
    const [searchQueryAvailable, setSearchQueryAvailable] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [statusFilterAvailable, setStatusFilterAvailable] = useState("");

    // Fetch My Requirements
    const fetchMyRequirements = async (type, search, status) => {
        setLoading(true);
        try {
            let url = `/jd-mapping/my-jds/?type=${type}&search=${search}`;
            if (status) url += `&status=${status}`;
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

    // Fetch Available Requirements
    const fetchAvailableRequirements = async (search, status) => {
        setLoadingAvailable(true);
        try {
            let url = `/jd-mapping/company-available-requirements/?search=${search}`;
            if (status) url += `&status=${status}`;
            const response = await apiRequest(url, "GET");
            if (response && response.success) {
                setAvailableRequirements(response.results || []);
                setAvailableStats(response.stats || { total_available: 0, hot_count: 0, warm_count: 0, cold_count: 0 });
            }
        } catch (error) {
            console.error("Error fetching available requirements:", error);
        } finally {
            setLoadingAvailable(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchMyRequirements(typeParam, searchQuery, statusFilter);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, typeParam, statusFilter]);

    // ✅ Available Requirements Filter Effect - Verified & Fixed
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchAvailableRequirements(searchQueryAvailable, statusFilterAvailable);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQueryAvailable, statusFilterAvailable]); // ✅ Both states in dependency array

    const truncateText = (text, maxLength) => {
        if (!text) return "—";
        return text.length > maxLength ? text.substring(0, maxLength).trim() + "..." : text;
    };

    const toggleActionMenuMy = (id) => {
        setActionDropdownOpenMy((prev) => (prev === id ? null : id));
        setActionDropdownOpenAvailable(null);
    };

    const toggleActionMenuAvailable = (id) => {
        setActionDropdownOpenAvailable((prev) => (prev === id ? null : id));
        setActionDropdownOpenMy(null);
    };

    const getStatusBadgeStyle = (status) => {
        switch(status) {
            case 'HOT': return { background: '#FEF2F2', color: '#DC2626', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block' };
            case 'WARM': return { background: '#FFFBEB', color: '#F59E0B', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block' };
            case 'COLD': return { background: '#F1F5F9', color: '#64748B', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block' };
            default: return { background: '#F1F5F9', color: '#64748B', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block' };
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

    return (
        <BaseLayout>
            {/* Section 1: My Requirements Table */}
            <div style={styles.topBar}>
                <div style={styles.leftActions}>
                     <button onClick={() => navigate('/employee')} style={styles.backBtn}>← Back </button>
                     <div style={styles.filterGroup}>
                         <button onClick={() => navigate("/employee/requirements/my?type=today")} style={typeParam === 'today' ? styles.activeFilterBtn : styles.filterBtn}>Today</button>
                         <button onClick={() => navigate("/employee/requirements/my?type=yesterday")} style={typeParam === 'yesterday' ? styles.activeFilterBtn : styles.filterBtn}>Yesterday</button>
                         <button onClick={() => navigate("/employee/requirements")} style={typeParam === 'both' ? styles.activeFilterBtn : styles.filterBtn}>All</button>
                     </div>
                </div>
                <div style={styles.searchContainer}>
                    <input type="text" placeholder="Search by ID, Title, Client, Skills..." style={styles.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </div>

            <div style={styles.statsContainer}>
                <div style={styles.statCard}>Total: <strong>{stats.total}</strong></div>
                <div style={styles.statCard}>Created By Me: <strong style={{color: '#27AE60'}}>{stats.created_by_me}</strong></div>
                <div style={styles.statCard}>Assigned To Me: <strong style={{color: '#2563EB'}}>{stats.assigned_to_me}</strong></div>
            </div>

            <div style={styles.section}>
                <h2 style={styles.pageTitle}>{getPageTitle()}</h2>
                <div style={{ marginBottom: "15px" }}>
                    <div style={styles.filterGroup}>
                        <button onClick={() => setStatusFilter("")} style={!statusFilter ? styles.activeFilterBtn : styles.filterBtn}>All</button>
                        <button onClick={() => setStatusFilter("HOT")} style={statusFilter === "HOT" ? styles.activeFilterBtn : styles.filterBtn}>HOT</button>
                        <button onClick={() => setStatusFilter("WARM")} style={statusFilter === "WARM" ? styles.activeFilterBtn : styles.filterBtn}>WARM</button>
                    </div>
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.th, width: "130px" }}>ID & Date</th>
                                <th style={{ ...styles.th, width: "200px" }}>Title & Client</th>
                                <th style={{ ...styles.th, width: "100px" }}>Exp / Rate</th>
                                <th style={{ ...styles.th, width: "80px" }}>Status</th>
                                <th style={{ ...styles.th, width: "120px" }}>Budget Range</th>
                                <th style={{ ...styles.th, width: "200px" }}>JD Description</th>
                                <th style={{ ...styles.th, width: "120px" }}>Stats / Team</th>
                                <th style={{ ...styles.th, textAlign: "center", width: "140px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" style={styles.loadingTd}>Loading requirements...</td></tr>
                            ) : requirements.length > 0 ? (
                                requirements.map((req) => (
                                    <RequirementRowWrapper key={req.id} status={req.status} onClick={() => navigate(`/employee/requirement/view/${req.id}`)}>
                                        <td style={styles.td}>
                                            <div style={styles.reqIdBadge}>{req.requirement_id}</div>
                                            <div style={styles.dateText}>{new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
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
                                            <StatusTimer createdAt={req.created_at} status={req.status} manual_status={req.manual_status} manual_status_updated_at={req.manual_status_updated_at} />
                                        </td>
                                        <td style={styles.td}><div style={styles.infoText} title={req.vendor_budget_range}>{truncateText(req.vendor_budget_range, 20) || "—"}</div></td>
                                        <td style={styles.td}>
                                            <div style={styles.jdTruncate} onClick={(e) => { e.stopPropagation(); setSelectedJd({ title: req.title, desc: req.jd_description }); }}>
                                                {req.jd_description || "No description provided."}
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.statLine}>Submissions: <strong>{req.total_submissions}</strong></div>
                                            {renderAssignedTeam(req.assigned_to_details)}
                                        </td>
                                        <td style={styles.actionTd}>
                                            <div style={styles.actionMenuWrapper}>
                                                <button type="button" style={styles.actionDotsBtn} onClick={(e) => { e.stopPropagation(); toggleActionMenuMy(req.id); }} title="Actions">⋯</button>
                                                {actionDropdownOpenMy === req.id && (
                                                    <div style={styles.actionDropdown}>
                                                        <button type="button" style={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); navigate(`/employee/requirement/view/${req.id}`); setActionDropdownOpenMy(null); }}>View</button>
                                                        <button type="button" style={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); navigate(`/employee/requirement/edit/${req.id}`); setActionDropdownOpenMy(null); }}>Update</button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </RequirementRowWrapper>
                                ))
                            ) : (
                                <tr><td colSpan="8" style={styles.loadingTd}>No requirements found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 2: Available Requirements Table */}
            <div style={{ ...styles.section, marginTop: "40px" }}>
                <h2 style={styles.pageTitle}>Available Requirements <span style={{ fontSize: "14px", fontWeight: "normal", color: "#64748B" }}>(Not assigned to you)</span></h2>

                <div style={{ ...styles.topBar, marginBottom: "20px" }}>
                    {/* ✅ Available Requirements Filters - Correctly Wired */}
                    <div style={styles.filterGroup}>
                        <button onClick={() => setStatusFilterAvailable("")} style={!statusFilterAvailable ? styles.activeFilterBtn : styles.filterBtn}>All</button>
                        <button onClick={() => setStatusFilterAvailable("HOT")} style={statusFilterAvailable === "HOT" ? styles.activeFilterBtn : styles.filterBtn}>HOT</button>
                        <button onClick={() => setStatusFilterAvailable("WARM")} style={statusFilterAvailable === "WARM" ? styles.activeFilterBtn : styles.filterBtn}>WARM</button>
                    </div>

                    <div style={styles.searchContainer}>
                        <input type="text" placeholder="Search available requirements..." style={styles.searchInput} value={searchQueryAvailable} onChange={(e) => setSearchQueryAvailable(e.target.value)} />
                    </div>
                </div>

                <div style={styles.statsContainer}>
                    <div style={styles.statCard}>Available: <strong>{availableStats.total_available || 0}</strong></div>
                    <div style={styles.statCard}>HOT: <strong style={{color: '#DC2626'}}>{availableStats.hot_count || 0}</strong></div>
                    <div style={styles.statCard}>WARM: <strong style={{color: '#F59E0B'}}>{availableStats.warm_count || 0}</strong></div>
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.th, width: "130px" }}>ID & Date</th>
                                <th style={{ ...styles.th, width: "200px" }}>Title & Client</th>
                                <th style={{ ...styles.th, width: "100px" }}>Exp / Rate</th>
                                <th style={{ ...styles.th, width: "80px" }}>Status</th>
                                <th style={{ ...styles.th, width: "120px" }}>Budget Range</th>
                                <th style={{ ...styles.th, width: "220px" }}>JD Description</th>
                                <th style={{ ...styles.th, width: "120px" }}>Stats</th>
                                <th style={{ ...styles.th, textAlign: "center", width: "140px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingAvailable ? (
                                <tr><td colSpan="8" style={styles.loadingTd}>Loading available requirements...</td></tr>
                            ) : availableRequirements.length > 0 ? (
                                availableRequirements.map((req) => (
                                    <RequirementRowWrapper key={req.id} status={req.status} onClick={() => navigate(`/employee/requirement/view/${req.id}`)}>
                                        <td style={styles.td}>
                                            <div style={styles.reqIdBadge}>{req.requirement_id}</div>
                                            <div style={styles.dateText}>{new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.primaryText} title={req.title}>{truncateText(req.title, 35)}</div>
                                            <div style={styles.subText} title={req.client_details?.company_name || req.client_details?.client_name}>{truncateText(req.client_details?.company_name || req.client_details?.client_name, 30)}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.infoText} title={req.experience_required}>{truncateText(req.experience_required, 15)}</div>
                                            <div style={styles.rateText} title={req.rate}>{truncateText(req.rate, 15)}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={getStatusBadgeStyle(req.status)}>{req.status || "—"}</span>
                                            <StatusTimer createdAt={req.created_at} status={req.status} manual_status={req.manual_status} manual_status_updated_at={req.manual_status_updated_at} />
                                        </td>
                                        <td style={styles.td}><div style={styles.infoText} title={req.vendor_budget_range}>{truncateText(req.vendor_budget_range, 20) || "—"}</div></td>
                                        <td style={styles.td}>
                                            <div style={styles.jdTruncate} onClick={(e) => { e.stopPropagation(); setSelectedJd({ title: req.title, desc: req.jd_description }); }}>
                                                {req.jd_description || "No description provided."}
                                            </div>
                                        </td>
                                        <td style={styles.td}><div style={styles.statLine}>Submissions: <strong>{req.total_submissions || 0}</strong></div></td>
                                        <td style={styles.actionTd}>
                                            <div style={styles.actionMenuWrapper}>
                                                <button type="button" style={styles.actionDotsBtn} onClick={(e) => { e.stopPropagation(); toggleActionMenuAvailable(req.id); }} title="Actions">⋯</button>
                                                {actionDropdownOpenAvailable === req.id && (
                                                    <div style={styles.actionDropdown}>
                                                        <button type="button" style={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); navigate(`/employee/requirement/view/${req.id}`); setActionDropdownOpenAvailable(null); }}>View</button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </RequirementRowWrapper>
                                ))
                            ) : (
                                <tr><td colSpan="8" style={styles.loadingTd}>No available requirements found.</td></tr>
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
                            <button style={styles.closeBtn} onClick={() => setSelectedJd(null)}>✕</button>
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
    backBtn: { background: "#25343f", color: "white", border: "none", fontWeight: "600", cursor: "pointer", padding: "10px" ,borderRadius:"10px" },
    filterGroup: { display: "flex", gap: "10px", background: "#F1F5F9", padding: "4px", borderRadius: "8px" },
    filterBtn: { background: "transparent", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", color: "#475569", cursor: "pointer", transition: "0.2s" },
    activeFilterBtn: { background: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", color: "#1E293B", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", transition: "0.2s" },
    searchContainer: { flex: "1 1 250px", maxWidth: "400px" },
    searchInput: { width: "100%", padding: "10px 15px", borderRadius: "10px", border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box" },
    statsContainer: { display: "flex", gap: "15px", marginBottom: "25px", flexWrap: "wrap" },
    statCard: { background: "#fff", padding: "12px 20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", fontSize: "14px", color: "#475569", border: "1px solid #E2E8F0" },
    pageTitle: { fontSize: "20px", color: "#1E293B", marginBottom: "15px", fontWeight: "800" },
    section: { marginBottom: "30px" },
    tableWrapper: { background: "#fff", borderRadius: "12px", overflowX: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" },
    table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "900px" },
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
    jdTruncate: { fontSize: "13px", color: "#475569", lineHeight: "1.5", cursor: "pointer", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" },
    statLine: { fontSize: "12px", color: "#334155", marginBottom: "6px" },
    assignWrapper: { display: "flex", alignItems: "center", gap: "5px" },
    assignNames: { fontSize: "12px", color: "#0F172A", background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "3px 8px", borderRadius: "6px", fontWeight: "600" },
    assignBadge: { fontSize: "10px", background: "#1E293B", color: "#fff", padding: "2px 5px", borderRadius: "4px", fontWeight: "700" },
    unassignedText: { fontSize: "11px", color: "#94A3B8", fontStyle: "italic" },
    actionTd: { textAlign: "center" },
    actionMenuWrapper: { position: "relative", display: "inline-block" },
    actionDotsBtn: { background: "#F8FAFC", color: "#0F172A", border: "1px solid #CBD5E1", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", fontSize: "18px", lineHeight: "1", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 },
    actionDropdown: { 
        position: "absolute", 
        right: 0, 
        bottom: "100%", 
        marginBottom: "8px",
        background: "#fff", 
        border: "1px solid #E2E8F0", 
        borderRadius: "12px", 
        boxShadow: "0 10px 25px rgba(15,23,42,0.12)", 
        zIndex: 20, 
        minWidth: "140px", 
        padding: "6px 0" 
    },
    dropdownItem: { width: "100%", background: "transparent", border: "none", textAlign: "left", padding: "10px 16px", fontSize: "13px", color: "#0F172A", cursor: "pointer", outline: "none" },
    loadingTd: { textAlign: "center", padding: "40px", color: "#64748B" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modalContent: { background: "#fff", borderRadius: "12px", width: "90%", maxWidth: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
    modalHeader: { padding: "15px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" },
    modalTitle: { margin: 0, fontSize: "16px", color: "#1E293B", fontWeight: "800" },
    closeBtn: { background: "transparent", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748B" },
    modalBody: { padding: "20px", overflowY: "auto", fontSize: "14px", lineHeight: "1.6", color: "#334155", whiteSpace: "pre-wrap" }
};

export default MyRequirements;


// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { apiRequest } from "../../../services/api";
// import BaseLayout from "../../components/emp_base";

// function useQuery() {
//     return new URLSearchParams(useLocation().search);
// }

// function MyRequirements() {
//     const navigate = useNavigate();
//     const query = useQuery();
//     const typeParam = query.get("type") || "both";

//     const [requirements, setRequirements] = useState([]);
//     const [stats, setStats] = useState({ total: 0, created_by_me: 0, assigned_to_me: 0 });
//     const [loading, setLoading] = useState(true);
//     const [searchQuery, setSearchQuery] = useState("");
//     const [selectedJd, setSelectedJd] = useState(null);

//     const fetchMyRequirements = async (type, search) => {
//         setLoading(true);
//         try {
//             const response = await apiRequest(`/jd-mapping/my-jds/?type=${type}&search=${search}`, "GET");
//             if (response && response.success) {
//                 setRequirements(response.results || []);
//                 setStats(response.stats || { total: 0, created_by_me: 0, assigned_to_me: 0 });
//             }
//         } catch (error) {
//             console.error("Error fetching my requirements:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         const delayDebounceFn = setTimeout(() => {
//             fetchMyRequirements(typeParam, searchQuery);
//         }, 500);
//         return () => clearTimeout(delayDebounceFn);
//     }, [searchQuery, typeParam]);

//     const truncateText = (text, maxLength) => {
//         if (!text) return "—";
//         return text.length > maxLength ? text.substring(0, maxLength).trim() + "..." : text;
//     };

//     const renderAssignedTeam = (assignments) => {
//         if (!assignments || assignments.length === 0) {
//             return <div style={styles.unassignedText}>Not Assigned</div>;
//         }
//         const displayNames = assignments.slice(0, 2).map(a => a.name?.split(' ')[0] || 'User').join(', ');
//         const remaining = assignments.length > 2 ? assignments.length - 2 : 0;
//         return (
//             <div style={styles.assignWrapper}>
//                 <span style={styles.assignNames}>{displayNames}</span>
//                 {remaining > 0 && <span style={styles.assignBadge}>+{remaining}</span>}
//             </div>
//         );
//     };

//     const getPageTitle = () => {
//         if (typeParam === 'today') return "Today's Requirements";
//         if (typeParam === 'yesterday') return "Yesterday's Requirements";
//         return "Today & Yesterday Requirements";
//     };

//     return (
//         <BaseLayout>
//             <div style={styles.topBar}>
//                 <div style={styles.leftActions}>
//                      <button onClick={() => navigate('/employee')} style={styles.backBtn}>← Dashboard</button>
//                      <div style={styles.filterGroup}>
//                          <button onClick={() => navigate("/employee/requirements/my?type=today")} style={typeParam === 'today' ? styles.activeFilterBtn : styles.filterBtn}>Today</button>
//                          <button onClick={() => navigate("/employee/requirements/my?type=yesterday")} style={typeParam === 'yesterday' ? styles.activeFilterBtn : styles.filterBtn}>Yesterday</button>
//                          <button onClick={() => navigate("/employee/requirements")} style={typeParam === 'both' ? styles.activeFilterBtn : styles.filterBtn}>All</button>
//                      </div>
//                 </div>

//                 <div style={styles.searchContainer}>
//                     <input 
//                         type="text" 
//                         placeholder="Search by ID, Title, Client, Skills..." 
//                         style={styles.searchInput}
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                     />
//                 </div>
//             </div>

//             <div style={styles.statsContainer}>
//                 <div style={styles.statCard}>Total: <strong>{stats.total}</strong></div>
//                 <div style={styles.statCard}>Created By Me: <strong style={{color: '#27AE60'}}>{stats.created_by_me}</strong></div>
//                 <div style={styles.statCard}>Assigned To Me: <strong style={{color: '#2563EB'}}>{stats.assigned_to_me}</strong></div>
//             </div>

//             <div style={styles.section}>
//                 <h2 style={styles.pageTitle}>{getPageTitle()}</h2>

//                 <div style={styles.tableWrapper}>
//                     <table style={styles.table}>
//                         <thead>
//                             <tr style={styles.tableHeader}>
//                                 <th style={{ ...styles.th, width: "130px" }}>ID & Date</th>
//                                 <th style={{ ...styles.th, width: "220px" }}>Title & Client</th>
//                                 <th style={{ ...styles.th, width: "140px" }}>Exp / Rate</th>
//                                 <th style={{ ...styles.th, width: "240px" }}>JD Description</th>
//                                 <th style={{ ...styles.th, width: "140px" }}>Stats / Team</th>
//                                 <th style={{ ...styles.th, textAlign: "center", width: "160px" }}>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {loading ? (
//                                 <tr><td colSpan="6" style={styles.loadingTd}>Loading requirements...</td></tr>
//                             ) : requirements.length > 0 ? (
//                                 requirements.map((req) => (
//                                     <tr key={req.id} style={styles.tableRow}>
//                                         <td style={styles.td}>
//                                             <div style={styles.reqIdBadge}>{req.requirement_id}</div>
//                                             <div style={styles.dateText}>
//                                                 {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
//                                             </div>
//                                         </td>
//                                         <td style={styles.td}>
//                                             <div style={styles.primaryText} title={req.title}>{truncateText(req.title, 35)}</div>
//                                             <div style={styles.subText} title={req.client_details?.company_name}>{truncateText(req.client_details?.company_name, 30)}</div>
//                                         </td>
//                                         <td style={styles.td}>
//                                             <div style={styles.infoText} title={req.experience_required}>{truncateText(req.experience_required, 15)}</div>
//                                             <div style={styles.rateText} title={req.rate}>{truncateText(req.rate, 15)}</div>
//                                         </td>
//                                         <td style={styles.td}>
//                                             <div 
//                                                 style={styles.jdTruncate} 
//                                                 onClick={() => setSelectedJd({ title: req.title, desc: req.jd_description })}
//                                             >
//                                                 {req.jd_description || "No description provided."}
//                                             </div>
//                                         </td>
//                                         <td style={styles.td}>
//                                             <div style={styles.statLine}>Submissions: <strong>{req.total_submissions}</strong></div>
//                                             {renderAssignedTeam(req.assigned_to_details)}
//                                         </td>
//                                         <td style={styles.actionTd}>
//                                             <div style={styles.actionGroup}>
//                                                 <button title="View Details" style={styles.viewBtn} onClick={() => navigate(`/employee/requirement/view/${req.id}`)}>View</button>
//                                                 <button title="Update Requirement" style={styles.editBtn} onClick={() => navigate(`/employee/requirement/edit/${req.id}`)}>Update</button>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 ))
//                             ) : (
//                                 <tr><td colSpan="6" style={styles.loadingTd}>No requirements found.</td></tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>

//             {selectedJd && (
//                 <div style={styles.modalOverlay} onClick={() => setSelectedJd(null)}>
//                     <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
//                         <div style={styles.modalHeader}>
//                             <h3 style={styles.modalTitle}>{selectedJd.title} - JD</h3>
//                             <button style={styles.closeBtn} onClick={() => setSelectedJd(null)}>✕</button>
//                         </div>
//                         <div style={styles.modalBody}>{selectedJd.desc}</div>
//                     </div>
//                 </div>
//             )}
//         </BaseLayout>
//     );
// }

// const styles = {
//     topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", gap: "15px", flexWrap: "wrap" },
//     leftActions: { display: "flex", alignItems: "center", gap: "15px" },
//     backBtn: { background: "transparent", color: "#64748B", border: "none", fontWeight: "600", cursor: "pointer", padding: "0" },
//     filterGroup: { display: "flex", gap: "10px", background: "#F1F5F9", padding: "4px", borderRadius: "8px" },
//     filterBtn: { background: "transparent", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", color: "#475569", cursor: "pointer", transition: "0.2s" },
//     activeFilterBtn: { background: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", color: "#1E293B", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", transition: "0.2s" },
//     searchContainer: { flex: "1 1 250px", maxWidth: "400px" },
//     searchInput: { width: "100%", padding: "10px 15px", borderRadius: "10px", border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box" },
//     statsContainer: { display: "flex", gap: "15px", marginBottom: "25px", flexWrap: "wrap" },
//     statCard: { background: "#fff", padding: "12px 20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", fontSize: "14px", color: "#475569", border: "1px solid #E2E8F0" },
//     pageTitle: { fontSize: "20px", color: "#1E293B", marginBottom: "15px", fontWeight: "800" },
//     tableWrapper: { background: "#fff", borderRadius: "12px", overflowX: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" },
//     table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "1000px" },
//     tableHeader: { background: "#F8FAFC", borderBottom: "1px solid #EDF2F7" },
//     th: { padding: "15px", textAlign: "left", color: "#64748B", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9" },
//     td: { padding: "15px", verticalAlign: "middle" },
//     reqIdBadge: { background: "#EFF6FF", color: "#2563EB", padding: "4px 8px", borderRadius: "5px", fontWeight: "700", fontSize: "12px", display: "inline-block", marginBottom: "4px" },
//     dateText: { fontSize: "11px", color: "#94A3B8", fontWeight: "600", paddingLeft: "2px" },
//     primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
//     subText: { fontSize: "12px", color: "#64748B", marginTop: "2px" },
//     infoText: { fontSize: "13px", fontWeight: "600" },
//     rateText: { fontSize: "12px", color: "#10B981", fontWeight: "700" },
//     jdTruncate: { fontSize: "13px", color: "#475569", lineHeight: "1.5", cursor: "pointer", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" },
//     statLine: { fontSize: "12px", color: "#334155", marginBottom: "6px" },
//     assignWrapper: { display: "flex", alignItems: "center", gap: "5px" },
//     assignNames: { fontSize: "12px", color: "#0F172A", background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "3px 8px", borderRadius: "6px", fontWeight: "600" },
//     assignBadge: { fontSize: "10px", background: "#1E293B", color: "#fff", padding: "2px 5px", borderRadius: "4px", fontWeight: "700" },
//     unassignedText: { fontSize: "11px", color: "#94A3B8", fontStyle: "italic" },
//     actionTd: { textAlign: "center" },
//     actionGroup: { display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" },
//     viewBtn: { background: "#F8FAFC", color: "#0F172A", border: "1px solid #CBD5E1", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700", transition: "0.2s" },
//     editBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "7px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700", transition: "0.2s" },
//     loadingTd: { textAlign: "center", padding: "40px", color: "#64748B" },
//     modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
//     modalContent: { background: "#fff", borderRadius: "12px", width: "90%", maxWidth: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
//     modalHeader: { padding: "15px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" },
//     modalTitle: { margin: 0, fontSize: "16px", color: "#1E293B", fontWeight: "800" },
//     closeBtn: { background: "transparent", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748B" },
//     modalBody: { padding: "20px", overflowY: "auto", fontSize: "14px", lineHeight: "1.6", color: "#334155", whiteSpace: "pre-wrap" }
// };

// export default MyRequirements;