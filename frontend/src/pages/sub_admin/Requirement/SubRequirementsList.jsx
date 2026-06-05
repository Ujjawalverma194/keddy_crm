import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import { asList } from "../../../utils/apiHelpers";
import BaseLayout from "../../components/SubAdminLayout";

function SubAdminRequirementList() {
    const navigate = useNavigate();
    const [requirements, setRequirements] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);

    const [selectedRequirementId, setSelectedRequirementId] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [empSearch, setEmpSearch] = useState("");
    const [selectedJd, setSelectedJd] = useState(null);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    const getAuthHeaders = () => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    };

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const fetchRequirements = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const response = await apiRequest(`/jd-mapping/api/requirements/list/?page=${page}&search=${search}`, "GET", null, getAuthHeaders());
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
        const delayDebounceFn = setTimeout(() => fetchRequirements(1, searchQuery), 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

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
            fetchRequirements(currentPage, searchQuery);
        } catch (error) {
            notify("Assignment Failed", "error");
        }
    };

    const truncateText = (text, maxLength) => {
        if (!text) return "—";
        return text.length > maxLength ? text.substring(0, maxLength).trim() + "..." : text;
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
                    <input type="text" placeholder="Search..." style={styles.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <button onClick={() => setShowAssignModal(true)} style={selectedRequirementId ? styles.addBtn : styles.disabledBtn} disabled={!selectedRequirementId}>
                    Assign Selected
                </button>

                <button onClick={() => navigate("/sub-admin/requirement/create")} style={styles.addBtn}>
                    create Requirement
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
                            {/* FIXED: Smaller Width for JD */}
                            <th style={{ width: "200px", ...styles.th }}>JD Description</th>
                            <th style={{ width: "150px", ...styles.th }}>Stats / Team</th>
                            <th style={{ width: "160px", textAlign: "center", ...styles.th }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="7" style={styles.loadingTd}>Loading...</td></tr> : 
                        requirements.map((req) => (
                            <tr key={req.id} style={{...styles.tableRow, background: selectedRequirementId === req.id ? '#FFFBEB' : 'transparent'}}>
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
                                    {/* 2. FIXED: JD Click now properly opens modal */}
                                    <div style={styles.jdTruncate} onClick={() => setSelectedJd({ title: req.title, desc: req.jd_description })}>
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
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 10001, fontWeight: '700' },
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "10px", flexWrap: "wrap" },
    leftActions: { display: "flex", alignItems: "center", gap: "10px" },
    backBtn: { background: "transparent", border: "none", fontWeight: "600", cursor: "pointer", color: "#64748B" },
    filterGroup: { display: "flex", gap: "5px" },
    filterBtn: { background: "#F1F5F9", border: "1px solid #CBD5E1", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" },
    searchContainer: { flex: "1 1 200px", maxWidth: "300px" },
    searchInput: { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box" },
    addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
    disabledBtn: { background: "#E2E8F0", color: "#94A3B8", border: "none", padding: "10px 15px", borderRadius: "8px", fontWeight: "700", cursor: "not-allowed" },
    
    tableWrapper: { background: "#fff", borderRadius: "12px", overflowX: "auto", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
    table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "1050px" },
    th: { padding: "12px 15px", textAlign: "left", background: "#F8FAFC", color: "#64748B", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" },
    td: { padding: "12px 15px", verticalAlign: "middle", borderBottom: "1px solid #F1F5F9" },
    reqIdBadge: { background: "#EFF6FF", color: "#2563EB", padding: "3px 8px", borderRadius: "4px", fontWeight: "700", fontSize: "11px", display: "inline-block" },
    dateText: { fontSize: "10px", color: "#94A3B8", marginTop: "2px" },
    primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "13px" },
    subText: { fontSize: "11px", color: "#64748B" },
    infoText: { fontSize: "12px", fontWeight: "600" },
    rateText: { fontSize: "11px", color: "#10B981", fontWeight: "700" },
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
    modalHeader: { padding: "15px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" },
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

















// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/SubAdminLayout";

// function SubAdminRequirementList() {
//     const navigate = useNavigate();
//     const [requirements, setRequirements] = useState([]);
//     const [employees, setEmployees] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [searchQuery, setSearchQuery] = useState("");

//     // Pagination State
//     const [currentPage, setCurrentPage] = useState(1);
//     const [totalPages, setTotalPages] = useState(1);
//     const [totalItems, setTotalItems] = useState(0);
//     const [hasNext, setHasNext] = useState(false);
//     const [hasPrevious, setHasPrevious] = useState(false);

//     // Interaction States
//     const [selectedRequirementId, setSelectedRequirementId] = useState(null);
//     const [showAssignModal, setShowAssignModal] = useState(false);
//     const [selectedEmployees, setSelectedEmployees] = useState([]);
//     const [empSearch, setEmpSearch] = useState("");
//     const [selectedJd, setSelectedJd] = useState(null);
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     const getAuthHeaders = () => {
//         const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//         return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
//     };

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const fetchRequirements = async (page = 1, search = "") => {
//         setLoading(true);
//         try {
//             const response = await apiRequest(`/jd-mapping/api/requirements/list/?page=${page}&search=${search}`, "GET", null, getAuthHeaders());
//             if (response && response.success) {
//                 setRequirements(response.results || []);
//                 setTotalItems(response.pagination.total_items);
//                 setTotalPages(response.pagination.total_pages);
//                 setHasNext(!!response.pagination.next);
//                 setHasPrevious(!!response.pagination.previous);
//                 setCurrentPage(page);
//             }
//         } catch (error) {
//             notify("Failed to fetch data", "error");
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         const delayDebounceFn = setTimeout(() => fetchRequirements(1, searchQuery), 500);
//         return () => clearTimeout(delayDebounceFn);
//     }, [searchQuery]);

//     useEffect(() => {
//         const fetchEmployees = async () => {
//             const response = await apiRequest("/sub-admin/api/users/", "GET", null, getAuthHeaders());
//             setEmployees(response.results || []);
//         };
//         fetchEmployees();
//     }, []);

//     // Helper: Render Assigned Team with +N Logic
//     const renderAssignedTeam = (assignments, totalCount) => {
//         if (!assignments || assignments.length === 0 || totalCount === 0) {
//             return <div style={styles.unassignedText}>Not Assigned</div>;
//         }
//         const displayNames = assignments.slice(0, 2).map(a => a.first_name || 'User').join(', ');
//         const remaining = totalCount > 2 ? totalCount - 2 : 0;
//         return (
//             <div style={styles.assignWrapper}>
//                 <span style={styles.assignNames}>{displayNames}</span>
//                 {remaining > 0 && <span style={styles.assignBadge}>+{remaining}</span>}
//             </div>
//         );
//     };

//     const handleAssignSubmit = async () => {
//         try {
//             await apiRequest("/jd-mapping/api/assignments/create/", "POST", {
//                 requirement_id: selectedRequirementId,
//                 assigned_to_ids: selectedEmployees
//             }, getAuthHeaders());
//             notify("Assigned Successfully!");
//             setShowAssignModal(false);
//             fetchRequirements(currentPage, searchQuery);
//         } catch (error) {
//             notify("Assignment Failed", "error");
//         }
//     };

//     const truncateText = (text, maxLength) => {
//         if (!text) return "—";
//         return text.length > maxLength ? text.substring(0, maxLength).trim() + "..." : text;
//     };

//     return (
//         <BaseLayout>
//             {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#EF4444' : '#10B981'}}>{toast.msg}</div>}

//             <div style={styles.topBar}>
//                 <div style={styles.leftActions}>
//                     <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                     <div style={styles.filterGroup}>
//                          <button style={styles.filterBtn}>Today's</button>
//                          <button style={styles.filterBtn}>Yesterday's</button>
//                     </div>
//                 </div>
//                 <div style={styles.searchContainer}>
//                     <input type="text" placeholder="Search..." style={styles.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
//                 </div>
//                 <button onClick={() => setShowAssignModal(true)} style={selectedRequirementId ? styles.addBtn : styles.disabledBtn} disabled={!selectedRequirementId}>
//                     Assign Selected
//                 </button>
//             </div>

//             <div style={styles.tableWrapper}>
//                 <table style={styles.table}>
//                     <thead>
//                         <tr style={styles.tableHeader}>
//                             <th style={{ width: "50px", ...styles.th }}>Sel</th>
//                             <th style={{ width: "130px", ...styles.th }}>ID & Date</th>
//                             <th style={{ width: "200px", ...styles.th }}>Title & Client</th>
//                             <th style={{ width: "120px", ...styles.th }}>Exp/Rate</th>
//                             <th style={{ width: "280px", ...styles.th }}>JD Description</th>
//                             <th style={{ width: "160px", ...styles.th }}>Team Stats</th>
//                             <th style={{ width: "160px", textAlign: "center", ...styles.th }}>Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {loading ? <tr><td colSpan="7" style={styles.loadingTd}>Loading...</td></tr> : 
//                         requirements.map((req) => (
//                             <tr key={req.id} style={{...styles.tableRow, background: selectedRequirementId === req.id ? '#F8FAFC' : 'transparent'}}>
//                                 <td style={styles.td}><input type="radio" checked={selectedRequirementId === req.id} onChange={() => setSelectedRequirementId(req.id)} /></td>
//                                 <td style={styles.td}>
//                                     <div style={styles.reqIdBadge}>{req.requirement_id}</div>
//                                     <div style={styles.dateText}>{new Date(req.created_at).toLocaleDateString('en-GB')}</div>
//                                 </td>
//                                 <td style={styles.td}>
//                                     <div style={styles.primaryText}>{truncateText(req.title, 30)}</div>
//                                     <div style={styles.subText}>{req.client_name}</div>
//                                 </td>
//                                 <td style={styles.td}>
//                                     <div style={styles.infoText}>{req.experience_required}</div>
//                                     <div style={styles.rateText}>{req.rate || "N/A"}</div>
//                                 </td>
//                                 <td style={styles.td}>
//                                     <div style={styles.jdTruncate} onClick={() => setSelectedJd({ title: req.title, desc: req.jd_description })}>
//                                         {req.jd_description || "No description"}
//                                     </div>
//                                 </td>
//                                 <td style={styles.td}>
//                                     <div style={styles.statLine}>Total: {req.total_submissions}</div>
//                                     {renderAssignedTeam(req.assigned_to, req.assigned_count)}
//                                 </td>
//                                 <td style={styles.actionTd}>
//                                     <div style={styles.actionGroup}>
//                                         <button style={styles.viewBtn} onClick={() => navigate(`/sub-admin/requirement/view/${req.id}`)}>View</button>
//                                         <button style={styles.editBtn} onClick={() => navigate(`/sub-admin/requirement/edit/${req.id}`)}>Update</button>
//                                     </div>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Pagination is same as before */}

//             {/* ASSIGN MODAL (RESPONSIVE) */}
//             {showAssignModal && (
//                 <div style={styles.modalOverlay}>
//                     <div style={styles.modalContent}>
//                         <div style={styles.modalHeader}>
//                             <h3 style={styles.modalTitle}>Assign Team</h3>
//                             <button style={styles.closeBtn} onClick={() => setShowAssignModal(false)}>✕</button>
//                         </div>
//                         <div style={styles.modalScrollBody}>
//                             <div style={styles.searchBoxWrapper}>
//                                 <input placeholder="Search employee..." style={styles.modalSearchInput} onChange={e => setEmpSearch(e.target.value)} />
//                             </div>
//                             <div style={styles.empList}>
//                                 {employees.filter(e => `${e.first_name} ${e.last_name}`.toLowerCase().includes(empSearch.toLowerCase())).map(emp => (
//                                     <div key={emp.id} style={styles.empItem}>
//                                         <input type="checkbox" checked={selectedEmployees.includes(emp.id)} onChange={() => setSelectedEmployees(prev => prev.includes(emp.id) ? prev.filter(x => x !== emp.id) : [...prev, emp.id])} />
//                                         <span style={{marginLeft:'10px', fontSize:'13px'}}>{emp.first_name} {emp.last_name}</span>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                         <div style={styles.modalFooter}>
//                             <button style={styles.saveBtn} onClick={handleAssignSubmit}>Assign Now</button>
//                             <button style={styles.cancelBtn} onClick={() => setShowAssignModal(false)}>Cancel</button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* JD Modal is same as before */}
//         </BaseLayout>
//     );
// }

// const styles = {
//     // Basic styles from previous
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 10001, fontWeight: '700' },
//     topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "10px", flexWrap: "wrap" },
//     leftActions: { display: "flex", alignItems: "center", gap: "10px" },
//     backBtn: { background: "transparent", border: "none", fontWeight: "600", cursor: "pointer", color: "#64748B" },
//     filterGroup: { display: "flex", gap: "5px" },
//     filterBtn: { background: "#F1F5F9", border: "1px solid #CBD5E1", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" },
//     searchContainer: { flex: "1 1 200px", maxWidth: "300px" },
//     searchInput: { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #E2E8F0" },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
//     disabledBtn: { background: "#E2E8F0", color: "#94A3B8", border: "none", padding: "10px 15px", borderRadius: "8px", fontWeight: "700", cursor: "not-allowed" },
    
//     // Table Styles
//     tableWrapper: { background: "#fff", borderRadius: "12px", overflowX: "auto", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
//     table: { width: "100%", borderCollapse: "collapse", minWidth: "1050px" },
//     th: { padding: "12px 15px", textAlign: "left", background: "#F8FAFC", color: "#64748B", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" },
//     td: { padding: "12px 15px", verticalAlign: "middle", borderBottom: "1px solid #F1F5F9" },
//     reqIdBadge: { background: "#EFF6FF", color: "#2563EB", padding: "3px 8px", borderRadius: "4px", fontWeight: "700", fontSize: "11px", display: "inline-block" },
//     dateText: { fontSize: "10px", color: "#94A3B8", marginTop: "2px" },
//     primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "13px" },
//     subText: { fontSize: "11px", color: "#64748B" },
//     infoText: { fontSize: "12px", fontWeight: "600" },
//     rateText: { fontSize: "11px", color: "#10B981", fontWeight: "700" },
//     jdTruncate: { fontSize: "12px", color: "#475569", cursor: "pointer", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", borderBottom: "1px dashed #CBD5E1" },
    
//     // Assigned Team Styles
//     statLine: { fontSize: "11px", color: "#64748B", marginBottom: "4px" },
//     assignWrapper: { display: "flex", alignItems: "center", gap: "4px" },
//     assignNames: { fontSize: "11px", color: "#1E293B", background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", fontWeight: "600", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
//     assignBadge: { fontSize: "10px", background: "#1E293B", color: "#fff", padding: "1px 4px", borderRadius: "3px", fontWeight: "700" },
//     unassignedText: { fontSize: "11px", color: "#94A3B8", fontStyle: "italic" },

//     // Action Buttons
//     actionTd: { textAlign: "center" },
//     actionGroup: { display: "flex", gap: "5px", justifyContent: "center" },
//     viewBtn: { padding: "5px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer" },
//     editBtn: { padding: "5px 10px", borderRadius: "6px", border: "none", background: "#1E293B", color: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer" },
    
//     // Modal Responsive Styles
//     modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "15px" },
//     modalContent: { background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "450px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" },
//     modalHeader: { padding: "15px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" },
//     modalTitle: { margin: 0, fontSize: "16px", fontWeight: "800", color: "#1E293B" },
//     modalScrollBody: { padding: "15px 20px", overflowY: "auto", flex: 1 },
//     searchBoxWrapper: { marginBottom: "15px" },
//     modalSearchInput: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box" },
//     empList: { border: "1px solid #F1F5F9", borderRadius: "8px", padding: "5px" },
//     empItem: { display: "flex", alignItems: "center", padding: "10px", borderBottom: "1px solid #F8FAFC" },
//     modalFooter: { padding: "15px 20px", borderTop: "1px solid #F1F5F9", display: "flex", gap: "10px" },
//     saveBtn: { flex: 1, background: "#FF9B51", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
//     cancelBtn: { flex: 1, background: "#F1F5F9", color: "#475569", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }
// };

// export default SubAdminRequirementList;




// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/SubAdminLayout";

// function SubAdminRequirementList() {
//     const navigate = useNavigate();
//     const [requirements, setRequirements] = useState([]);
//     const [employees, setEmployees] = useState([]);
//     const [loading, setLoading] = useState(true);

//     // Pagination State
//     const [currentPage, setCurrentPage] = useState(1);
//     const [totalPages, setTotalPages] = useState(1);
//     const [searchQuery, setSearchQuery] = useState("");

//     // Interaction States
//     const [selectedRequirementId, setSelectedRequirementId] = useState(null);
//     const [showAssignModal, setShowAssignModal] = useState(false);
//     const [selectedEmployees, setSelectedEmployees] = useState([]);
//     const [empSearch, setEmpSearch] = useState("");
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     const getAuthHeaders = () => {
//         const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//         return {
//             "Authorization": `Bearer ${token}`,
//             "Content-Type": "application/json"
//         };
//     };

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const fetchRequirements = async (page = 1, search = "") => {
//         setLoading(true);
//         try {
//             const url = `/jd-mapping/api/requirements/list/?page=${page}&search=${search}`;
//             const response = await apiRequest(url, "GET", null, getAuthHeaders());
//             if (response && response.success) {
//                 setRequirements(response.results || []);
//                 setTotalPages(response.pagination.total_pages);
//             }
//         } catch (error) {
//             console.error("Error fetching requirements:", error);
//             notify("Failed to fetch requirements", "error");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchEmployees = async () => {
//         try {
//             const response = await apiRequest("/sub-admin/api/users/", "GET", null, getAuthHeaders());
//             setEmployees(response.results || []);
//         } catch (error) {
//             console.error("Employee fetch error:", error);
//             notify("Failed to fetch employees", "error");
//         }
//     };

//     useEffect(() => {
//         const delayDebounceFn = setTimeout(() => {
//             fetchRequirements(currentPage, searchQuery);
//         }, 500);
//         return () => clearTimeout(delayDebounceFn);
//     }, [currentPage, searchQuery]);
    
//     useEffect(() => {
//         fetchEmployees();
//     }, []);

//     const handleAssignSubmit = async () => {
//         if (!selectedRequirementId || selectedEmployees.length === 0) {
//             return notify("Select a requirement and at least one employee", "error");
//         }
//         try {
//             await apiRequest("/jd-mapping/api/assignments/create/", "POST", {
//                 requirement_id: selectedRequirementId,
//                 assigned_to_ids: selectedEmployees
//             }, getAuthHeaders());
//             notify("Successfully assigned requirement!");
//             setShowAssignModal(false);
//             setSelectedRequirementId(null);
//             setSelectedEmployees([]);
//             fetchRequirements(currentPage, searchQuery); // Refresh list
//         } catch (error) {
//             console.error("Assignment failed:", error);
//             notify(error.response?.data?.message || "Assignment Failed", "error");
//         }
//     };
    
//     const openAssignModal = () => {
//         if (!selectedRequirementId) {
//             notify("Please select a requirement first", "error");
//             return;
//         }
//         const requirement = requirements.find(r => r.id === selectedRequirementId);
//         if (requirement) {
//             // Pre-select employees who are already assigned
//             const alreadyAssignedIds = requirement.assigned_to.map(emp => emp.id);
//             setSelectedEmployees(alreadyAssignedIds);
//         }
//         setShowAssignModal(true);
//     };

//     return (
//         <BaseLayout>
//             {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>{toast.msg}</div>}

//             <div style={styles.topBar}>
//                 <button onClick={() => navigate("/sub-admin")} style={styles.backBtn}>← Back</button>
//                 <div style={styles.searchContainer}>
//                     <input
//                         type="text"
//                         placeholder="Search by ID, Title, Client..."
//                         style={styles.searchInput}
//                         value={searchQuery}
//                         onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
//                     />
//                 </div>
//                 <button 
//                     onClick={openAssignModal} 
//                     style={selectedRequirementId ? styles.addBtn : styles.disabledBtn}
//                     disabled={!selectedRequirementId}
//                 >
//                     Assign Requirement
//                 </button>
//             </div>

//             <div style={styles.section}>
//                 <h2 style={styles.pageTitle}>Assign Requirements</h2>

//                 <div style={styles.tableWrapper}>
//                     <table style={styles.table}>
//                         <thead>
//                             <tr style={styles.tableHeader}>
//                                 <th style={{...styles.th, width: "50px"}}></th>
//                                 <th style={styles.th}>Requirement ID</th>
//                                 <th style={styles.th}>Title & Client</th>
//                                 <th style={styles.th}>Experience</th>
//                                 <th style={styles.th}>Assigned To</th>
//                                 <th style={styles.th}>Submissions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {loading ? (
//                                 <tr><td colSpan="6" style={{ textAlign: "center", padding: "60px" }}>Loading...</td></tr>
//                             ) : requirements.length === 0 ? (
//                                 <tr><td colSpan="6" style={{ textAlign: "center", padding: "60px" }}>No requirements found.</td></tr>
//                             ) : requirements.map((req) => (
//                                 <tr key={req.id} style={{...styles.tableRow, background: selectedRequirementId === req.id ? '#FFFBEB' : 'transparent'}}>
//                                     <td style={styles.td}>
//                                         <input
//                                             type="radio"
//                                             name="requirement"
//                                             checked={selectedRequirementId === req.id}
//                                             onChange={() => setSelectedRequirementId(req.id)}
//                                             style={{cursor: 'pointer'}}
//                                         />
//                                     </td>
//                                     <td style={styles.td}>{req.requirement_id}</td>
//                                     <td style={styles.td}>
//                                         <div style={styles.primaryText}>{req.title}</div>
//                                         <div style={styles.secondaryText}>{req.client_name}</div>
//                                     </td>
//                                     <td style={styles.td}>{req.experience_required}</td>
//                                     <td style={styles.td}>{req.assigned_count} employees</td>
//                                      <td style={styles.td}>{req.total_submissions}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
                
//                 {/* Pagination */}
//                 <div style={styles.pagination}>
//                     <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} style={styles.pageStep}>Previous</button>
//                     <span>Page {currentPage} of {totalPages}</span>
//                     <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} style={styles.pageStep}>Next</button>
//                 </div>
//             </div>

//             {/* Assign Modal */}
//             {showAssignModal && (
//                 <div style={styles.modalOverlay}>
//                     <div style={styles.modalContent}>
//                         <h3>Assign Employees</h3>
//                         <p>For Requirement: <strong>{requirements.find(r => r.id === selectedRequirementId)?.title}</strong></p>
//                         <input placeholder="Search employee..." style={{...styles.searchInput, width:'100%', marginBottom:'10px'}} onChange={e => setEmpSearch(e.target.value)} />
//                         <div style={styles.empList}>
//                             {employees.filter(e => `${e.first_name} ${e.last_name}`.toLowerCase().includes(empSearch.toLowerCase())).map(emp => (
//                                 <div key={emp.id} style={styles.empItem}>
//                                     <input type="checkbox" checked={selectedEmployees.includes(emp.id)} onChange={() => setSelectedEmployees(prev => prev.includes(emp.id) ? prev.filter(x => x !== emp.id) : [...prev, emp.id])} />
//                                     <span style={{marginLeft:'10px'}}>{emp.first_name} {emp.last_name} ({emp.email})</span>
//                                 </div>
//                             ))}
//                         </div>
//                         <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
//                             <button style={styles.saveBtn} onClick={handleAssignSubmit}>Assign Now</button>
//                             <button style={styles.cancelBtn} onClick={() => {setShowAssignModal(false); setEmpSearch(""); setSelectedEmployees([])}}>Cancel</button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </BaseLayout>
//     );
// }

// const styles = {
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 10001, fontWeight: '700' },
//     topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "15px" },
//     backBtn: { background: "transparent", color: "#25343F", border: "none", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
//     searchContainer: { flex: 1, maxWidth: "400px" },
//     searchInput: { width: "100%", padding: "12px 15px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none" },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" },
//     disabledBtn: { background: "#E0E0E0", color: "#9E9E9E", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", cursor: "not-allowed" },
//     pageTitle: { fontSize: "24px", color: "#25343F", marginBottom: "15px", fontWeight: "800" },
//     section: { background: "transparent" },
//     tableWrapper: { background: "#fff", borderRadius: "16px", overflow: "hidden", border: "1px solid #EAEFEF" },
//     table: { width: "100%", borderCollapse: "collapse" },
//     tableHeader: { background: "#F8F9FA" },
//     th: { padding: "16px", textAlign: "left", color: "#495057", fontSize: "14px", fontWeight: "700" },
//     tableRow: { borderBottom: "1px solid #EAEFEF" },
//     td: { padding: "16px", color: "#25343F", fontSize: "14px" },
//     primaryText: { fontWeight: "700" },
//     secondaryText: { fontSize: "12px", color: "#6C757D" },
//     pagination: { display: "flex", justifyContent: "center", alignItems: "center", marginTop: "30px", gap: "20px" },
//     pageStep: { padding: "8px 16px", background: "#fff", border: "1px solid #BFC9D1", borderRadius: "8px", cursor: "pointer" },
//     modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
//     modalContent: { background: '#fff', padding: '25px', borderRadius: '15px', width: '450px', maxWidth: '90%' },
//     empList: { maxHeight: '250px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '8px' },
//     empItem: { display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
//     saveBtn: { flex: 1, background: '#FF9B51', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
//     cancelBtn: { flex: 1, background: '#eee', color: '#333', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer' }
// };

// export default SubAdminRequirementList;