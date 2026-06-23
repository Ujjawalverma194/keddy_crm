import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";

// Reusable Utilities aur Components
import { getStatusStyles } from "../../utils/statusHelper";
import StatusUpdateModal from "../../components/StatusUpdateModal";

const Icons = {
    Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
    External: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>,
    Delete: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
};

function SubmittedProfiles() {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [count, setCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedCand, setSelectedCand] = useState(null);
    const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });
    const [statusSaving, setStatusSaving] = useState(false);

    useEffect(() => {
        fetchSubmittedProfiles(currentPage, searchTerm);
    }, [currentPage, searchTerm]);

    const fetchSubmittedProfiles = async (page, search) => {
        setLoading(true);
        try {
            let url = `/employee-portal/api/submitted-profiles/?page=${page}${search ? `&search=${search}` : ''}`;
            const res = await apiRequest(url, "GET");
            if (Array.isArray(res)) {
                setCandidates(res); setCount(res.length);
            } else if (res && res.results) {
                setCandidates(res.results); setCount(res.count || res.results.length);
            }
        } catch (err) { console.error("Error:", err); }
        finally { setLoading(false); }
    };

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const getCandidateId = (candidate) => {
        if (!candidate) return null;
        return (
            candidate.candidate_id ||
            candidate.candidate?.id ||
            candidate.Candidate?.id ||
            candidate.profile?.candidate_id ||
            candidate.profile?.id ||
            candidate.id
        );
    };

    const handleQuickEdit = (e, cand) => {
        e.stopPropagation(); setSelectedCand(cand);
        setEditForm({ main_status: cand.main_status || "SUBMITTED", sub_status: cand.sub_status || "NONE", remark: cand.remark || "" });
        setShowModal(true);
    };

    const handleSoftDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this profile?")) {
            try {
                await apiRequest(`/employee-portal/api/candidates/${id}/soft-delete/`, "DELETE");
                notify("Candidate deleted successfully!");
                fetchSubmittedProfiles(currentPage, searchTerm);
            } catch (err) { notify("Delete failed", "error"); }
        }
    };

    const handleUpdateSubmit = async () => {
        if (statusSaving) return;

        const candidateId = getCandidateId(selectedCand);
        if (!candidateId) {
            notify("Candidate ID not found. Please refresh and try again.", "error");
            console.error("Status update failed: candidate id missing", selectedCand);
            return;
        }

        const payload = {
            main_status: editForm.main_status || "SUBMITTED",
            sub_status: editForm.sub_status || "NONE",
            remark: editForm.remark || "",
        };

        setStatusSaving(true);
        try {
            await apiRequest(`/employee-portal/api/candidates/${candidateId}/update/`, "PUT", payload);

            setCandidates((prev) =>
                prev.map((candidate) =>
                    getCandidateId(candidate) === candidateId
                        ? {
                              ...candidate,
                              main_status: payload.main_status,
                              sub_status: payload.sub_status,
                              remark: payload.remark || candidate.remark,
                          }
                        : candidate,
                ),
            );

            notify("Status updated successfully!");
            setShowModal(false);
            setSelectedCand(null);
            fetchSubmittedProfiles(currentPage, searchTerm);
        } catch (err) {
            console.error("Status update failed:", err);
            notify(err?.message || err?.detail || "Update failed", "error");
        } finally {
            setStatusSaving(false);
        }
    };

    const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

    const renderRows = () => {
        let lastDate = "";
        return candidates.map((c) => {
            const currentDate = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            let dateSeparator = currentDate !== lastDate ? (
                <tr key={`date-sep-${c.id}`}><td colSpan="8" style={styles.dateSeparator}>{currentDate}</td></tr>
            ) : null;
            lastDate = currentDate;

            const statusStyle = getStatusStyles(c.main_status || "SUBMITTED");
            return (
                <React.Fragment key={c.id}>
                    {dateSeparator}
                    <tr style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/employee/candidate/view/${c.id}`)}>
                        {/* 1. Submitted To/By (Combined like blueprint) */}
                        <td style={styles.td}>
                            <div>To: <b>{c.submitted_to_name || '-'}</b></div>
                            <div>By: <b style={{color: "#27AE60"}}>{c.created_by_name || '-'}</b></div>
                        </td>
                        {/* 2. Candidate */}
                        <td style={styles.td}>
                            <div style={{fontWeight: '700'}}>{truncate(c.candidate_name, 20)}</div>
                            <div style={{fontSize: '11px', color: '#7F8C8D'}}>{c.candidate_email || "N/A"}</div>
                        </td>
                        {/* 3. Tech */}
                        <td style={styles.td}>{truncate(c.technology, 30)}</td>
                        {/* 4. Exp */}
                        <td style={styles.td}>{c.years_of_experience_manual || '0'} Yrs</td>
                        {/* 5. Vendor */}
                        <td style={styles.td}>
                            <b>{truncate(c.vendor_company_name || c.vendor_name, 15)}</b>
                        </td>
                        {/* 6. Rate */}
                        <td style={styles.td}>
                            <div>₹{c.vendor_rate}</div>
                            <small style={{color: '#7F8C8D'}}>{c.vendor_rate_type}</small>
                        </td>
                        {/* 7. Status */}
                        <td style={styles.td}>
                            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>{c.main_status}</span>
                                {c.remark && <div title={c.remark}><Icons.Remark /></div>}
                            </div>
                            <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: '700' }}>{c.sub_status}</small>
                        </td>
                        {/* 8. Action */}
                        <td style={styles.td}>
                            <div style={styles.actionGroup}>
                                <button onClick={(e) => handleQuickEdit(e, c)} style={styles.editBtn} title="Quick Edit"><Icons.Edit /></button>
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/employee/candidate/edit/${c.id}`); }} style={styles.editBtn} title="Full Edit"><Icons.External /></button>
                                <button onClick={(e) => handleSoftDelete(e, c.id)} style={styles.trashBtn} title="Delete"><Icons.Delete /></button>
                            </div>
                        </td>
                    </tr>
                </React.Fragment>
            );
        });
    };

    return (
        <BaseLayout>
            {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>{toast.msg}</div>}

            <div style={styles.header}>
                <div>
                    <h2 style={styles.welcome}>Submitted Profiles ({count})</h2>
                    <p style={styles.subText}>List of candidates verified and submitted.</p>
                </div>
                <div style={styles.headerActions}>
                    <input placeholder="Search profiles..." style={styles.searchInput} value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                </div>
            </div>

            <div style={styles.tableWrapper}>
                <div style={{overflowX:'auto'}}>
                    <table style={styles.table}>
                        <thead style={styles.tableHeader}>
                            <tr>
                                <th style={styles.th}>Submitted To/By</th>
                                <th style={styles.th}>Candidate</th>
                                <th style={styles.th}>Tech</th>
                                <th style={styles.th}>Exp</th>
                                <th style={styles.th}>Vendor</th>
                                <th style={styles.th}>Rate</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="8" style={styles.loadingTd}>Loading profiles...</td></tr> : renderRows()}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={styles.pagination}>
                <button disabled={currentPage === 1 || loading} onClick={() => setCurrentPage(p => p - 1)} style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}>Previous</button>
                <div style={styles.pageInfo}>Page {currentPage}</div>
                <button disabled={candidates.length < 10 || loading} onClick={() => setCurrentPage(p => p + 1)} style={candidates.length < 10 ? styles.pageBtnDisabled : styles.pageBtn}>Next</button>
            </div>

            <StatusUpdateModal isOpen={showModal} onClose={() => setShowModal(false)} formData={editForm} setFormData={setEditForm} onSave={handleUpdateSubmit} />
        </BaseLayout>
    );
}

const styles = {
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" },
    welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
    subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
    headerActions: { display: "flex", gap: "10px", alignItems: "center" },
    searchInput: { padding: "10px 15px", borderRadius: "10px", border: "1px solid #F0F2F4", width: "250px", outline: "none", fontSize: '13px' },
    tableWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #F0F2F4" },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
    th: { padding: "14px 18px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" },
    tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
    td: { padding: "14px 18px", fontSize: "13px", color: "#334155" },
    dateSeparator: { padding: "12px 20px", background: "#f8fafc", color: "#475569", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", borderBottom: '1px solid #e2e8f0' },
    badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
    subStatusText: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
    actionGroup: { display: "flex", gap: "8px" },
    editBtn: { border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    trashBtn: { border: 'none', background: '#FFF5F5', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "30px", marginBottom: '20px' },
    pageBtn: { padding: "8px 25px", background: "#25343F", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: '700', fontSize: '12px' },
    pageBtnDisabled: { padding: "8px 25px", background: "#E2E8F0", color: "#94A3B8", border: "none", borderRadius: "8px", cursor: "not-allowed" },
    pageInfo: { fontWeight: "800", color: "#25343F", fontSize: "14px" },
    loadingTd: { textAlign: 'center', padding: '40px', fontWeight: '800', color: '#25343F' }
};

export default SubmittedProfiles;





// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// // Reusable Utilities aur Components
// import { getStatusStyles } from "../../utils/statusHelper";
// import StatusUpdateModal from "../../components/StatusUpdateModal";

// const Icons = {
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
//     External: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>,
//     // Naya Delete Icon
//     Delete: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
// };

// function SubmittedProfiles() {
//     const navigate = useNavigate();
//     const [candidates, setCandidates] = useState([]);
//     const [count, setCount] = useState(0);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [loading, setLoading] = useState(true);
//     const [searchTerm, setSearchTerm] = useState("");

//     const [showModal, setShowModal] = useState(false);
//     const [selectedCand, setSelectedCand] = useState(null);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     useEffect(() => {
//         fetchSubmittedProfiles(currentPage, searchTerm);
//     }, [currentPage, searchTerm]);

//     const fetchSubmittedProfiles = async (page, search) => {
//         setLoading(true);
//         try {
//             let url = `/employee-portal/api/submitted-profiles/?page=${page}${search ? `&search=${search}` : ''}`;
//             const res = await apiRequest(url, "GET");

//             if (Array.isArray(res)) {
//                 setCandidates(res);
//                 setCount(res.length);
//             } else if (res && res.results) {
//                 setCandidates(res.results);
//                 setCount(res.count || res.results.length);
//             }
//         } catch (err) {
//             console.error("Error:", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleQuickEdit = (e, cand) => {
//         e.stopPropagation();
//         setSelectedCand(cand);
//         setEditForm({
//             main_status: cand.main_status || "SUBMITTED",
//             sub_status: cand.sub_status || "NONE",
//             remark: ""
//         });
//         setShowModal(true);
//     };

//     // Soft Delete Functionality
//     const handleSoftDelete = async (e, id) => {
//         e.stopPropagation();
//         if (window.confirm("Are you sure you want to delete this profile?")) {
//             try {
//                 await apiRequest(`/employee-portal/api/candidates/${id}/soft-delete/`, "DELETE");
//                 notify("Candidate deleted successfully!");
//                 fetchSubmittedProfiles(currentPage, searchTerm);
//             } catch (err) {
//                 notify("Delete failed", "error");
//             }
//         }
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
//             notify("Status updated successfully!");
//             setShowModal(false);
//             fetchSubmittedProfiles(currentPage, searchTerm);
//         } catch (err) {
//             notify("Update failed", "error");
//         }
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     const renderRows = () => {
//         let lastDate = "";
//         return candidates.map((c) => {
//             const currentDate = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
//             let dateSeparator = null;
//             if (currentDate !== lastDate) {
//                 lastDate = currentDate;
//                 dateSeparator = (
//                     <tr key={`date-sep-${c.id}`}>
//                         <td colSpan="9" style={styles.dateSeparator}>{currentDate}</td>
//                     </tr>
//                 );
//             }

//             const statusStyle = getStatusStyles(c.main_status || "SUBMITTED");

//             return (
//                 <React.Fragment key={c.id}>
//                     {dateSeparator}
//                     <tr style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/employee/candidate/view/${c.id}`)}>
//                         <td style={{...styles.td, ...styles.colTime}}>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
//                         <td style={{...styles.td, ...styles.colTeam}}>
//                             <div style={styles.teamText}>To: <b>{c.submitted_to_name}</b></div>
//                             <div style={styles.teamTextBy}>By: <b>{c.created_by_name}</b></div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colCand}}>
//                             <div style={styles.candName}>{truncate(c.candidate_name, 20)}</div>
//                             <div style={styles.candEmail}>{c.candidate_email || "N/A"}</div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colTech}}>
//                             <span style={styles.techBadge} title={c.technology}>{c.technology || "N/A"}</span>
//                         </td>
//                         <td style={{...styles.td, ...styles.colExp}}>{c.years_of_experience_manual}</td>
//                         <td style={{...styles.td, ...styles.colVend}}>
//                             <div style={styles.vendorName}>{truncate(c.vendor_company_name, 15)}</div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colRate}}>
//                             <div style={styles.rateText}>₹{c.vendor_rate}</div>
//                             <div style={styles.rateType}>{c.vendor_rate_type}</div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colStat}}>
//                             <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
//                                     <span style={{ ...styles.statusBadge, color: statusStyle.text }}>{c.main_status || "SUBMITTED"}</span>
//                                     {c.remark && <div title={c.remark}><Icons.Remark /></div>}
//                                 </div>
//                                 {c.sub_status && c.sub_status !== "NONE" && (
//                                     <div style={{ ...styles.subStatusBadge, color: statusStyle.text }}>• {c.sub_status}</div>
//                                 )}
//                             </div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colAct}}>
//                             <div style={styles.actionGroup}>
//                                 <button onClick={(e) => handleQuickEdit(e, c)} style={styles.iconBtn} title="Quick Edit"><Icons.Edit /></button>
//                                 <button onClick={(e) => { e.stopPropagation(); navigate(`/employee/candidate/edit/${c.id}`); }} style={styles.iconBtn} title="Full Edit"><Icons.External /></button>
//                                 {/* DELETE BUTTON ADDED HERE */}
//                                 <button onClick={(e) => handleSoftDelete(e, c.id)} style={styles.iconBtn} title="Delete"><Icons.Delete /></button>
//                             </div>
//                         </td>
//                     </tr>
//                 </React.Fragment>
//             );
//         });
//     };

//     return (
//         <BaseLayout>
//             {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>{toast.msg}</div>}

//             <div style={styles.header}>
//                 <div style={styles.titleSection}>
//                     <h2 style={styles.title}>Submitted Profiles ({count})</h2>
//                     <p style={styles.subtitle}>List of candidates verified today</p>
//                 </div>
//                 <div style={styles.headerActions}>
//                     <input placeholder="Search..." style={styles.searchInput} value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
//                 </div>
//             </div>

//             <div style={styles.tableWrapper}>
//                 <table style={styles.table}>
//                     <thead>
//                         <tr style={styles.tableHeader}>
//                             <th style={{...styles.th, ...styles.colTime}}>Time</th>
//                             <th style={{...styles.th, ...styles.colTeam}}>Team Info</th>
//                             <th style={{...styles.th, ...styles.colCand}}>Candidate</th>
//                             <th style={{...styles.th, ...styles.colTech}}>Tech</th>
//                             <th style={{...styles.th, ...styles.colExp}}>Exp</th>
//                             <th style={{...styles.th, ...styles.colVend}}>Vendor</th>
//                             <th style={{...styles.th, ...styles.colRate}}>Rate</th>
//                             <th style={{...styles.th, ...styles.colStat}}>Status</th>
//                             <th style={{...styles.th, ...styles.colAct}}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {loading ? <tr><td colSpan="9" style={styles.loadingTd}>Loading...</td></tr> : renderRows()}
//                     </tbody>
//                 </table>
//             </div>

//             <div style={styles.pagination}>
//                 <button disabled={currentPage === 1 || loading} onClick={() => setCurrentPage(p => p - 1)} style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}>Previous</button>
//                 <div style={styles.pageIndicator}>Page {currentPage}</div>
//                 <button disabled={candidates.length < 10 || loading} onClick={() => setCurrentPage(p => p + 1)} style={candidates.length < 10 ? styles.pageBtnDisabled : styles.pageBtn}>Next</button>
//             </div>

//             <StatusUpdateModal isOpen={showModal} onClose={() => setShowModal(false)} formData={editForm} setFormData={setEditForm} onSave={handleUpdateSubmit} />
//         </BaseLayout>
//     );
// }

// const styles = {
//     // ... Baki saare styles bilkul same hain, Action column ki width adjust kar di hai
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
//     header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "25px", flexWrap: "wrap", gap: "20px" },
//     titleSection: { flex: 1 },
//     title: { margin: 0, color: "#25343F", fontWeight: "800", fontSize: "24px" },
//     subtitle: { margin: "5px 0 0 0", color: "#64748B", fontSize: "14px" },
//     headerActions: { display: "flex", gap: "10px", alignItems: "center" },
//     searchInput: { padding: "10px 15px", borderRadius: "10px", border: "1px solid #CBD5E1", width: "250px", outline: "none" },
//     tableWrapper: { background: "#fff", borderRadius: "16px", border: "1px solid #E2E8F0", overflowX: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" },
//     table: { width: "100%", borderCollapse: "collapse", tableLayout: "auto", minWidth: "1100px" }, 
//     tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #F1F5F9" },
//     th: { padding: "16px 12px", textAlign: "left", fontSize: "12px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" },
//     tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
//     td: { padding: "16px 12px", fontSize: "14px", color: "#334155", verticalAlign: "middle" },
//     colTime: { width: "90px" },
//     colTeam: { width: "160px" },
//     colCand: { width: "200px" },
//     colTech: { width: "120px" },
//     colExp:  { width: "60px" },
//     colVend: { width: "150px" },
//     colRate: { width: "110px" },
//     colStat: { width: "160px" },
//     colAct:  { width: "140px", textAlign: "center" }, // Width thodi badhayi hai 3 buttons ke liye

//     dateSeparator: { padding: "12px 20px", background: "#F1F5F9", color: "#475569", fontWeight: "800", fontSize: "12px", textTransform: "uppercase" },
//     teamText: { fontSize: "13px", color: "#475569" },
//     teamTextBy: { fontSize: "11px", color: "#27AE60", marginTop: "2px" },
//     techBadge: { background: "#fff", border: "1px solid #CBD5E1", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", display: "block", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
//     statusBadge: { padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", whiteSpace: "nowrap" },
//     subStatusBadge: { fontSize: "10px", fontWeight: "700", marginLeft: "4px" },
//     actionGroup: { display: "flex", gap: "8px", flexWrap: "nowrap", justifyContent: "center" },
//     iconBtn: { border: "1px solid #E2E8F0", background: "#fff", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
//     pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "25px", marginTop: "30px" },
//     pageBtn: { padding: "10px 20px", background: "#25343F", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
//     pageBtnDisabled: { padding: "10px 20px", background: "#E2E8F0", color: "#94A3B8", border: "none", borderRadius: "8px", cursor: "not-allowed" },
//     loadingTd: { textAlign: "center", padding: "40px", color: "#64748B", fontSize: "16px" }
// };

// export default SubmittedProfiles;








// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// // Reusable Utilities aur Components
// import { getStatusStyles } from "../../utils/statusHelper";
// import StatusUpdateModal from "../../components/StatusUpdateModal";

// const Icons = {
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
//     External: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
// };

// function SubmittedProfiles() {
//     const navigate = useNavigate();
//     const [candidates, setCandidates] = useState([]);
//     const [count, setCount] = useState(0);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [loading, setLoading] = useState(true);
//     const [searchTerm, setSearchTerm] = useState("");

//     const [showModal, setShowModal] = useState(false);
//     const [selectedCand, setSelectedCand] = useState(null);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     useEffect(() => {
//         fetchSubmittedProfiles(currentPage, searchTerm);
//     }, [currentPage, searchTerm]);

//     const fetchSubmittedProfiles = async (page, search) => {
//         setLoading(true);
//         try {
//             let url = `/employee-portal/api/submitted-profiles/?page=${page}${search ? `&search=${search}` : ''}`;
//             const res = await apiRequest(url, "GET");

//             if (Array.isArray(res)) {
//                 setCandidates(res);
//                 setCount(res.length);
//             } else if (res && res.results) {
//                 setCandidates(res.results);
//                 setCount(res.count || res.results.length);
//             }
//         } catch (err) {
//             console.error("Error:", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleQuickEdit = (e, cand) => {
//         e.stopPropagation();
//         setSelectedCand(cand);
//         setEditForm({
//             main_status: cand.main_status || "SUBMITTED",
//             sub_status: cand.sub_status || "NONE",
//             remark: ""
//         });
//         setShowModal(true);
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
//             notify("Status updated successfully!");
//             setShowModal(false);
//             fetchSubmittedProfiles(currentPage, searchTerm);
//         } catch (err) {
//             notify("Update failed", "error");
//         }
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     const renderRows = () => {
//         let lastDate = "";
//         return candidates.map((c) => {
//             const currentDate = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
//             let dateSeparator = null;
//             if (currentDate !== lastDate) {
//                 lastDate = currentDate;
//                 dateSeparator = (
//                     <tr key={`date-sep-${c.id}`}>
//                         <td colSpan="9" style={styles.dateSeparator}>{currentDate}</td>
//                     </tr>
//                 );
//             }

//             const statusStyle = getStatusStyles(c.main_status || "SUBMITTED");

//             return (
//                 <React.Fragment key={c.id}>
//                     {dateSeparator}
//                     <tr style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/employee/candidate/view/${c.id}`)}>
//                         <td style={{...styles.td, ...styles.colTime}}>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
//                         <td style={{...styles.td, ...styles.colTeam}}>
//                             <div style={styles.teamText}>To: <b>{c.submitted_to_name}</b></div>
//                             <div style={styles.teamTextBy}>By: <b>{c.created_by_name}</b></div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colCand}}>
//                             <div style={styles.candName}>{truncate(c.candidate_name, 20)}</div>
//                             <div style={styles.candEmail}>{c.candidate_email || "N/A"}</div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colTech}}>
//                             <span style={styles.techBadge} title={c.technology}>{c.technology || "N/A"}</span>
//                         </td>
//                         <td style={{...styles.td, ...styles.colExp}}>{c.years_of_experience_manual}</td>
//                         <td style={{...styles.td, ...styles.colVend}}>
//                             <div style={styles.vendorName}>{truncate(c.vendor_company_name, 15)}</div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colRate}}>
//                             <div style={styles.rateText}>₹{c.vendor_rate}</div>
//                             <div style={styles.rateType}>{c.vendor_rate_type}</div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colStat}}>
//                             <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
//                                     <span style={{ ...styles.statusBadge, color: statusStyle.text }}>{c.main_status || "SUBMITTED"}</span>
//                                     {c.remark && <div title={c.remark}><Icons.Remark /></div>}
//                                 </div>
//                                 {c.sub_status && c.sub_status !== "NONE" && (
//                                     <div style={{ ...styles.subStatusBadge, color: statusStyle.text }}>• {c.sub_status}</div>
//                                 )}
//                             </div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colAct}}>
//                             <div style={styles.actionGroup}>
//                                 <button onClick={(e) => handleQuickEdit(e, c)} style={styles.iconBtn}><Icons.Edit /></button>
//                                 <button onClick={(e) => { e.stopPropagation(); navigate(`/employee/candidate/edit/${c.id}`); }} style={styles.iconBtn}><Icons.External /></button>
//                             </div>
//                         </td>
//                     </tr>
//                 </React.Fragment>
//             );
//         });
//     };

//     return (
//         <BaseLayout>
//             {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>{toast.msg}</div>}

//             <div style={styles.header}>
//                 <div style={styles.titleSection}>
//                     <h2 style={styles.title}>Submitted Profiles ({count})</h2>
//                     <p style={styles.subtitle}>List of candidates verified today</p>
//                 </div>
//                 <div style={styles.headerActions}>
//                     <input placeholder="Search..." style={styles.searchInput} value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
//                 </div>
//             </div>

//             <div style={styles.tableWrapper}>
//                 <table style={styles.table}>
//                     <thead>
//                         <tr style={styles.tableHeader}>
//                             <th style={{...styles.th, ...styles.colTime}}>Time</th>
//                             <th style={{...styles.th, ...styles.colTeam}}>Team Info</th>
//                             <th style={{...styles.th, ...styles.colCand}}>Candidate</th>
//                             <th style={{...styles.th, ...styles.colTech}}>Tech</th>
//                             <th style={{...styles.th, ...styles.colExp}}>Exp</th>
//                             <th style={{...styles.th, ...styles.colVend}}>Vendor</th>
//                             <th style={{...styles.th, ...styles.colRate}}>Rate</th>
//                             <th style={{...styles.th, ...styles.colStat}}>Status</th>
//                             <th style={{...styles.th, ...styles.colAct}}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {loading ? <tr><td colSpan="9" style={styles.loadingTd}>Loading...</td></tr> : renderRows()}
//                     </tbody>
//                 </table>
//             </div>

//             <div style={styles.pagination}>
//                 <button disabled={currentPage === 1 || loading} onClick={() => setCurrentPage(p => p - 1)} style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}>Previous</button>
//                 <div style={styles.pageIndicator}>Page {currentPage}</div>
//                 <button disabled={candidates.length < 10 || loading} onClick={() => setCurrentPage(p => p + 1)} style={candidates.length < 10 ? styles.pageBtnDisabled : styles.pageBtn}>Next</button>
//             </div>

//             <StatusUpdateModal isOpen={showModal} onClose={() => setShowModal(false)} formData={editForm} setFormData={setEditForm} onSave={handleUpdateSubmit} />
//         </BaseLayout>
//     );
// }

// const styles = {
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
//     header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "25px", flexWrap: "wrap", gap: "20px" },
//     titleSection: { flex: 1 },
//     title: { margin: 0, color: "#25343F", fontWeight: "800", fontSize: "24px" },
//     subtitle: { margin: "5px 0 0 0", color: "#64748B", fontSize: "14px" },
//     headerActions: { display: "flex", gap: "10px", alignItems: "center" },
//     searchInput: { padding: "10px 15px", borderRadius: "10px", border: "1px solid #CBD5E1", width: "250px", outline: "none" },
    
//     // Horizontal scroll support
//     tableWrapper: { background: "#fff", borderRadius: "16px", border: "1px solid #E2E8F0", overflowX: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" },
    
//     table: { width: "100%", borderCollapse: "collapse", tableLayout: "auto", minWidth: "1100px" }, 
    
//     tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #F1F5F9" },
//     th: { padding: "16px 12px", textAlign: "left", fontSize: "12px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" },
//     tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
    
//     // Main Data Font
//     td: { padding: "16px 12px", fontSize: "14px", color: "#334155", verticalAlign: "middle" },
    
//     // Width Control
//     colTime: { width: "90px" },
//     colTeam: { width: "160px" },
//     colCand: { width: "200px" },
//     colTech: { width: "120px" }, // Tech column fixed width
//     colExp:  { width: "60px" },
//     colVend: { width: "150px" },
//     colRate: { width: "110px" },
//     colStat: { width: "160px" },
//     colAct:  { width: "130px", textAlign: "center" },

//     dateSeparator: { padding: "12px 20px", background: "#F1F5F9", color: "#475569", fontWeight: "800", fontSize: "12px", textTransform: "uppercase" },
//     teamText: { fontSize: "13px", color: "#475569" },
//     teamTextBy: { fontSize: "11px", color: "#27AE60", marginTop: "2px" },
    
//     // TECH BADGE WITH WORD LIMIT (Ellipsis)
//     techBadge: { 
//         background: "#fff", 
//         border: "1px solid #CBD5E1", 
//         padding: "3px 8px", 
//         borderRadius: "6px", 
//         fontSize: "11px", 
//         fontWeight: "700", 
//         display: "block",       // Block taaki width kaam kare
//         maxWidth: "100px",      // Yahan se limit control hogi
//         overflow: "hidden",     // Extra text chhup jayega
//         textOverflow: "ellipsis", // '...' dikhayega
//         whiteSpace: "nowrap"    // Text next line par nahi jayega
//     },

//     statusBadge: { padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", whiteSpace: "nowrap" },
//     subStatusBadge: { fontSize: "10px", fontWeight: "700", marginLeft: "4px" },
    
//     actionGroup: { display: "flex", gap: "8px", flexWrap: "nowrap", justifyContent: "center" },
//     iconBtn: { border: "1px solid #E2E8F0", background: "#fff", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
    
//     pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "25px", marginTop: "30px" },
//     pageBtn: { padding: "10px 20px", background: "#25343F", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
//     pageBtnDisabled: { padding: "10px 20px", background: "#E2E8F0", color: "#94A3B8", border: "none", borderRadius: "8px", cursor: "not-allowed" },
//     loadingTd: { textAlign: "center", padding: "50px", color: "#64748B", fontSize: "16px" }
// };

// export default SubmittedProfiles;





// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// function CandidateList() {
//     const navigate = useNavigate();
//     const [candidates, setCandidates] = useState([]);
//     const [count, setCount] = useState(0);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [loading, setLoading] = useState(true);
    
//     // Search aur Filter States
//     const [searchTerm, setSearchTerm] = useState("");
//     const [techFilter, setTechFilter] = useState("");

//     useEffect(() => {
//         fetchCandidates(currentPage, searchTerm, techFilter);
//     }, [currentPage, searchTerm, techFilter]);

//     const fetchCandidates = async (page, search, tech) => {
//     setLoading(true);
//     try {
//         // Updated API endpoint
//         let url = `/employee-portal/api/submitted-profiles/?page=${page}`;
//         if (search) url += `&search=${search}`;
//         if (tech) url += `&technology=${tech}`;

//         const res = await apiRequest(url, "GET");

//         // Kyunki API direct Array return kar rahi hai, hum seedha res set karenge
//         // Agar pagination backend se missing hai, toh count ko array length se set karenge
//         if (Array.isArray(res)) {
//             setCandidates(res);
//             setCount(res.length); 
//         } else if (res.results) {
//             // Backup case: agar kabhi results key mein aaye
//             setCandidates(res.results);
//             setCount(res.count || res.results.length);
//         }
//     } catch (err) {
//         console.error("Error fetching candidates:", err);
//         setCandidates([]); // Error pe list khali kar dein
//     } finally {
//         setLoading(false);
//     }
// };

//     return (
//         <BaseLayout>
//             {/* Header Section */}
//             <div style={styles.header}>
//                 <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
//                     <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                     <h2 style={styles.title}>Candidates ({count})</h2>
//                 </div>
//                 <button onClick={() => navigate("/employee/candidates/add")} style={styles.addBtn}>+ Add Candidate</button>
//             </div>

//             {/* Filter Bar */}
//             <div style={styles.filterBar}>
//                 <input 
//                     placeholder="Search by name or email..." 
//                     style={styles.searchInput}
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//                 <input 
//                     placeholder="Filter by Tech (AI, ML, React...)" 
//                     style={styles.filterInput}
//                     value={techFilter}
//                     onChange={(e) => setTechFilter(e.target.value)}
//                 />
//             </div>

//             {/* Candidates Table */}
//             <div style={styles.tableCard}>
//                 <table style={styles.table}>
//                     <thead>
//                         <tr style={styles.tableHeader}>
//                             <th style={styles.th}>Submitted To & Submitted By</th>
//                             <th style={styles.th}>Candidate</th>
//                             <th style={styles.th}>Tech / Skills</th>
//                             <th style={styles.th}>Experience</th>
//                             <th style={styles.th}>Vendor</th>
//                             <th style={styles.th}>Resume</th>
//                             <th style={styles.th}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {loading ? (
//                             <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>Loading candidates...</td></tr>
//                         ) : candidates.map(can => (
//                             <tr key={can.id} style={styles.tr}>
//                                 <td style={styles.td}>{can.submitted_to_name} & {can.created_by_name}</td>

//                                 <td style={styles.td}>
//                                     <div style={{ fontWeight: "bold", color: "#25343F" }}>{can.candidate_name}</div>
//                                     <div style={{ fontSize: "11px", color: "#666" }}>{can.candidate_email || "No Email"}</div>
//                                 </td>
//                                 <td style={styles.td}>
//                                     <span style={styles.techBadge}>{can.technology || "N/A"}</span>
//                                     <div style={styles.skillText}>{can.skills?.substring(0, 30)}...</div>
//                                 </td>
//                                 <td style={styles.td}>
//                                     <div>Manual: {can.years_of_experience_manual}</div>
//                                     <div style={{ fontSize: "11px", color: "#FF9B51" }}>System: {can.years_of_experience_calculated} yrs</div>
//                                 </td>
//                                 <td style={styles.td}>
//                                     <div style={{fontWeight: "600"}}>{can.vendor_company_name}</div>
//                                     <div style={{fontSize: "11px"}}>{can.vendor_name}</div>
//                                 </td>
                                
//                                 <td style={styles.td}>
//                                     <a href={can.resume} target="_blank" rel="noreferrer" style={styles.resumeLink}>View Resume</a>
//                                 </td>
//                                 <td style={styles.td}>
//                                     <button onClick={() => navigate(`/employee/candidate/view/${can.id}`)} style={styles.viewBtn}>View</button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Pagination */}
//             <div style={styles.pagination}>
//                 <button 
//                     disabled={currentPage === 1} 
//                     onClick={() => setCurrentPage(p => p - 1)}
//                     style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}
//                 >Previous</button>
                
//                 <span style={styles.pageInfo}>Page {currentPage} of {Math.ceil(count / 10)}</span>
                
//                 <button 
//                     disabled={candidates.length < 10 && currentPage * 10 >= count} 
//                     onClick={() => setCurrentPage(p => p + 1)}
//                     style={candidates.length < 10 ? styles.pageBtnDisabled : styles.pageBtn}
//                 >Next</button>
//             </div>
//         </BaseLayout>
//     );
// }

// const styles = {
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
//     backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer" },
//     title: { margin: 0, color: "#25343F", fontWeight: "800" },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" },
//     filterBar: { display: "flex", gap: "15px", marginBottom: "20px" },
//     searchInput: { flex: 2, padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none" },
//     filterInput: { flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none" },
//     tableCard: { background: "#fff", borderRadius: "15px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
//     table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
//     tableHeader: { background: "#F5F7F9", borderBottom: "2px solid #EAEFEF" },
//     th: { padding: "15px", fontSize: "13px", color: "#25343F", textTransform: "uppercase", fontWeight: "800" },
//     tr: { borderBottom: "1px solid #F0F0F0", transition: "0.2s" },
//     td: { padding: "15px", fontSize: "14px", verticalAlign: "top" },
//     techBadge: { background: "#FFFBF8", color: "#FF9B51", padding: "2px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "bold", border: "1px solid #FFE6D5" },
//     skillText: { fontSize: "11px", color: "#888", marginTop: "5px" },
//     resumeLink: { color: "#25343F", fontWeight: "bold", textDecoration: "underline", fontSize: "12px" },
//     viewBtn: { background: "#EAEFEF", border: "none", padding: "5px 12px", borderRadius: "5px", cursor: "pointer", fontSize: "12px" },
//     pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "25px" },
//     pageBtn: { padding: "8px 20px", background: "#25343F", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
//     pageBtnDisabled: { padding: "8px 20px", background: "#BFC9D1", color: "#fff", border: "none", borderRadius: "8px", cursor: "not-allowed" },
//     pageInfo: { fontWeight: "bold", color: "#25343F" }
// };

// export default CandidateList;