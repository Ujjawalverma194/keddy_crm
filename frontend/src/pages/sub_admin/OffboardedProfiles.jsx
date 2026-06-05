import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, API_BASE } from "../../services/api";
import SubAdminLayout from "../components/SubAdminLayout";

// External Imports
import StatusUpdateModal from "../../components/StatusUpdateModal";
import { getStatusStyles } from "../../utils/statusHelper";

const Icons = {
    Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    RemoveIcon: ({ color }) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
    ),
    File: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>,
    Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
    Alert: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
};

function OffboardedProfiles() {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [count, setCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [techFilter, setTechFilter] = useState("");

    const [toast, setToast] = useState({ show: false, msg: "", type: "" });
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showRemovePopup, setShowRemovePopup] = useState(false);
    const [selectedCand, setSelectedCand] = useState(null);
    const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const fetchCandidates = async (page, search, tech) => {
        setLoading(true);
        try {
            let url = `/sub-admin/api/candidates/offboarded/?page=${page}`;
            if (search) url += `&search=${search}`;
            if (tech) url += `&technology=${tech}`;
            const res = await apiRequest(url, "GET");
            setCandidates(res.results || []);
            setCount(res.count || 0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchCandidates(currentPage, searchTerm, techFilter);
    }, [currentPage, searchTerm, techFilter]);

    const handleUpdateSubmit = async () => {
        try {
            await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
            notify("Status Updated");
            setShowStatusModal(false);
            fetchCandidates(currentPage, searchTerm, techFilter);
        } catch (err) { notify("Failed to update", "error"); }
    };

    const handleRemoveAction = async () => {
        try {
            await apiRequest(`/sub-admin/candidates/${selectedCand.id}/remove-from-offboarded/`, "DELETE");
            notify("Removed from Offboarded", "success");
            setShowRemovePopup(false);
            fetchCandidates(currentPage, searchTerm, techFilter);
        } catch (err) { notify("Remove failed", "error"); }
    };

    const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

    const renderGroupedRows = () => {
        let lastDate = "";
        return candidates.map((c, i) => {
            const currentDate = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            let dateSeparator = currentDate !== lastDate ? (
                <tr key={`sep-${i}`}><td colSpan="10" style={styles.dateSeparator}>{currentDate}</td></tr>
            ) : null;
            lastDate = currentDate;

            const statusStyle = getStatusStyles(c.main_status || "SUBMITTED");
            return (
                <React.Fragment key={c.id}>
                    {dateSeparator}
                    <tr style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/sub-admin/candidate/view/${c.id}`)}>
                        {/* 1. Submitted To/By */}
                        <td style={styles.td}>
                            <div>To: <b>{c.submitted_to_name || '-'}</b></div>
                            <div>By: <b style={{color: "#27AE60"}}>{c.created_by_name || '-'}</b></div>
                        </td>
                        {/* 2. Candidate */}
                        <td style={styles.td}><b>{c.candidate_name}</b></td>
                        {/* 3. Tech */}
                        <td style={styles.td}>{truncate(c.technology, 30)}</td>
                        {/* 4. Exp */}
                        <td style={styles.td}>{c.years_of_experience_manual || '0'} Yrs</td>
                        {/* 5. Client */}
                        <td style={styles.td}>{c.client_name || 'N/A'}</td>
                        {/* 6. Vendor */}
                        <td style={styles.td}>
                            <b>{truncate(c.vendor_company_name || c.vendor_name, 15)}</b><br/>
                            <small style={styles.subStatusText}>{c.vendor_number || 'N/A'}</small>
                        </td>
                        {/* 7. Rate */}
                        <td style={styles.td}>₹{c.vendor_rate} {c.vendor_rate_type || ''}</td>
                        {/* 8. Status */}
                        <td style={styles.td}>
                            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>{c.main_status}</span>
                                {c.remark && <div style={styles.remarkIcon} title={c.remark}><Icons.Remark /></div>}
                            </div>
                            <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: '700' }}>{c.sub_status}</small>
                        </td>
                        {/* 9. CV */}
                        <td style={styles.td}>
                            <button onClick={(e) => { e.stopPropagation(); if(c.resume) window.open(c.resume.startsWith('http') ? c.resume : `${API_BASE}${c.resume}`, '_blank'); }} style={styles.cvBtn}>
                                <Icons.File /> CV
                            </button>
                        </td>
                        {/* 10. Action */}
                        <td style={styles.td}>
                            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedCand(c); setEditForm({ main_status: c.main_status, sub_status: c.sub_status, remark: c.remark }); setShowStatusModal(true); }} style={styles.editBtn}><Icons.Edit /></button>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedCand(c); setShowRemovePopup(true); }} style={styles.removeBtn}><Icons.RemoveIcon color="#FF9B51" /></button>
                            </div>
                        </td>
                    </tr>
                </React.Fragment>
            );
        });
    };

    return (
        <SubAdminLayout>
            {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>{toast.msg}</div>}
            <div style={styles.btnGroup}>
                    <button onClick={() => navigate(-1)} style={{...styles.actionBtn, background: '#25343F'}}>← Back</button>
                </div>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.welcome}>Offboarded Profiles ({count})</h2>
                    <p style={styles.subText}>Management dashboard for tracking offboarded candidates.</p>
                </div>
                
            </div>

            <div style={styles.filterBar}>
                <input placeholder="Search name/email..." style={styles.searchInput} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <input placeholder="Tech Filter..." style={styles.filterInput} value={techFilter} onChange={e => setTechFilter(e.target.value)} />
            </div>

            <div style={styles.sectionContainer}>
                <div style={styles.tableWrapper}>
                    <div style={{overflowX:'auto'}}>
                        <table style={styles.table}>
                            <thead style={styles.tableHeader}>
                                <tr>
                                    <th style={styles.th}>Submitted To/By</th>
                                    <th style={styles.th}>Candidate</th>
                                    <th style={styles.th}>Tech</th>
                                    <th style={styles.th}>Exp</th>
                                    <th style={styles.th}>Client</th>
                                    <th style={styles.th}>Vendor</th>
                                    <th style={styles.th}>Rate</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>CV</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>{loading ? <tr><td colSpan="10" style={styles.loadingTd}>Loading...</td></tr> : renderGroupedRows()}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div style={styles.pagination}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}>Prev</button>
                <span style={styles.pageInfo}>{currentPage} / {Math.ceil(count / 10) || 1}</span>
                <button disabled={currentPage * 10 >= count} onClick={() => setCurrentPage(p => p + 1)} style={currentPage * 10 >= count ? styles.pageBtnDisabled : styles.pageBtn}>Next</button>
            </div>

            {showRemovePopup && (
                <div style={styles.modalOverlay} onClick={() => setShowRemovePopup(false)}>
                    <div style={styles.deleteContent} onClick={e => e.stopPropagation()}>
                        <Icons.Alert />
                        <h3 style={{margin:'15px 0 5px', color: '#25343F', fontWeight: '800'}}>Remove From Offboarded?</h3>
                        <p style={{fontSize:'13px', color:'#7F8C8D', marginBottom:'20px'}}>Remove <b>{selectedCand?.candidate_name}</b></p>
                        <div style={{display:'flex', flexDirection:'column', gap:'10px', width:'100%'}}>
                            <button style={styles.removeBtn} onClick={() => handleRemoveAction()}>Remove From Offboarded</button>
                            <button style={styles.cancelBtn} onClick={() => setShowRemovePopup(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <StatusUpdateModal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} formData={editForm} setFormData={setEditForm} onSave={handleUpdateSubmit} />
        </SubAdminLayout>
    );
}

const styles = {
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 10001, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" },
    welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
    subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
    btnGroup: { display: "flex", gap: "10px", alignItems: "center",marginBottom:"10px"},
    actionBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
    filterBar: { display: "flex", gap: "15px", marginBottom: "20px" },
    searchInput: { flex: 2, padding: "12px", borderRadius: "10px", border: "1px solid #F0F2F4", outline: "none", fontSize: '13px' },
    filterInput: { flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #F0F2F4", outline: "none", fontSize: '13px' },
    sectionContainer: { marginBottom: "35px" },
    tableWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #F0F2F4" },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
    th: { padding: "14px 18px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" },
    tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
    td: { padding: "14px 18px", fontSize: "13px", color: "#334155" },
    dateSeparator: { padding: "12px 20px", background: "#f8fafc", color: "#475569", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", borderBottom: '1px solid #e2e8f0' },
    badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
    subStatusText: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
    remarkIcon: { display: 'flex', cursor: 'help', padding: '4px', borderRadius: '4px', background: '#FFF5EB' },
    cvBtn: { background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#25343F", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", gap: "5px" },
    editBtn: { border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    removeBtn: { border: 'none', background: '#FFF5EB', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "10px", marginBottom: '20px' },
    pageBtn: { padding: "8px 25px", background: "#25343F", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: '700', fontSize: '12px' },
    pageBtnDisabled: { padding: "8px 25px", background: "#E2E8F0", color: "#94A3B8", border: "none", borderRadius: "8px", cursor: "not-allowed" },
    pageInfo: { fontWeight: "800", color: "#25343F", fontSize: "14px" },
    loadingTd: { textAlign: 'center', padding: '40px', fontWeight: '800', color: '#25343F' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(37, 52, 63, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' },
    deleteContent: { background: '#fff', padding: '30px', borderRadius: '20px', width: '350px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    cancelBtn: { background: 'transparent', color: '#7F8C8D', border: 'none', padding: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }
};

export default OffboardedProfiles;
