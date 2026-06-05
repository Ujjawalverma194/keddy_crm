import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";

// Shared Components Import
import { getStatusStyles } from "../../utils/statusHelper";
import StatusUpdateModal from "../../components/StatusUpdateModal";

const Icons = {
    Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
    External: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>,
    Delete: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
};

function CandidateList() {
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

    useEffect(() => { fetchCandidates(currentPage, searchTerm); }, [currentPage, searchTerm]);

    const fetchCandidates = async (page, search) => {
        setLoading(true);
        try {
            let url = `/employee-portal/api/user/candidates/list/?page=${page}${search ? `&search=${search}` : ''}`;
            const res = await apiRequest(url, "GET");
            if (res && res.results) { setCandidates(res.results); setCount(res.count || 0); }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const handleQuickEdit = (e, cand) => {
        e.stopPropagation();
        setSelectedCand(cand);
        setEditForm({ main_status: cand.main_status || "SUBMITTED", sub_status: cand.sub_status || "NONE", remark: cand.remark || "" });
        setShowModal(true);
    };

    const handleSoftDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this profile?")) {
            try {
                await apiRequest(`/employee-portal/api/candidates/${id}/soft-delete/`, "DELETE");
                notify("Candidate deleted successfully!");
                fetchCandidates(currentPage, searchTerm);
            } catch (err) { notify("Delete failed", "error"); }
        }
    };

    const handleUpdateSubmit = async () => {
        try {
            await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
            notify("Status updated successfully!");
            setShowModal(false);
            fetchCandidates(currentPage, searchTerm);
        } catch (err) { notify("Update failed", "error"); }
    };

    const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

    const renderRows = () => {
        let lastDate = "";
        return candidates.map((c) => {
            const currentDate = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            let dateSeparator = currentDate !== lastDate ? (<tr key={`d-${c.id}`}><td colSpan="8" style={styles.dateSeparator}>{currentDate}</td></tr>) : null;
            if (currentDate !== lastDate) lastDate = currentDate;

            const statusStyle = getStatusStyles(c.main_status || "SUBMITTED");

            return (
                <React.Fragment key={c.id}>
                    {dateSeparator}
                    <tr style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/employee/candidate/view/${c.id}`)}>
                        {/* 1. Submitted To/By */}
                        <td style={styles.td}>
                            <div>To: <b>{c.submitted_to_name || ''}</b></div>
                            <div>By: <b style={{color: "#27AE60"}}>{c.created_by_name || ''}</b></div>
                        </td>
                        {/* 2. Candidate */}
                        <td style={styles.td}>
                            <div style={{fontWeight: '700'}}>{c.candidate_name || ''}</div>
                            <div style={{fontSize: '11px', color: '#7F8C8D'}}>{c.candidate_email || ''}</div>
                        </td>
                        {/* 3. Tech */}
                        <td style={styles.td}>{truncate(c.technology, 30) || ''}</td>
                        {/* 4. Exp */}
                        <td style={styles.td}>{c.years_of_experience_manual || ''} {c.years_of_experience_manual ? 'Yrs' : ''}</td>
                        {/* 5. Vendor */}
                        <td style={styles.td}><b>{truncate(c.vendor_company_name || c.vendor_name, 15) || ''}</b></td>
                        {/* 6. Rate */}
                        <td style={styles.td}>
                            <div>{c.vendor_rate ? `₹${c.vendor_rate}` : ''}</div>
                            <small style={{color: '#94A3B8'}}>{c.vendor_rate_type || ''}</small>
                        </td>
                        {/* 7. Status */}
                        <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ ...styles.badge, color: statusStyle.text, fontWeight: '800' }}>{c.main_status || ''}</span>
                                {c.remark && <div style={styles.remarkIcon} title={c.remark}><Icons.Remark /></div>}
                            </div>
                            <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: '700' }}>{c.sub_status || ''}</small>
                        </td>
                        {/* 8. Action */}
                        <td style={styles.td}>
                            <div style={styles.actionGroup}>
                                <button onClick={(e) => handleQuickEdit(e, c)} style={styles.editBtn} title="Update Status"><Icons.Edit /></button>
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
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <button onClick={() => navigate("/employee/")} style={styles.backBtn} title="Back to Dashboard">
                        ← Back
                    </button>
                    <div>
                        <h2 style={styles.welcome}>Total Profiles ({count})</h2>
                        <p style={styles.subText}>Recruitment pipeline overview for team.</p>
                    </div>
                </div>
                <div style={styles.headerActions}>
                    <input placeholder="Search..." style={styles.searchInput} value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                    <button onClick={() => navigate("/employee/candidates/add")} style={styles.actionBtn}>+ Add Candidate</button>
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
                        <tbody>{loading ? <tr><td colSpan="8" style={styles.loadingTd}>Loading...</td></tr> : renderRows()}</tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Logic here... */}

            <StatusUpdateModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                formData={editForm}
                setFormData={setEditForm}
                onSave={handleUpdateSubmit}
            />
        </BaseLayout>
    );
}

const styles = {
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" },
    backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px", marginTop: "3px", whiteSpace: "nowrap" },
    welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
    subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
    headerActions: { display: "flex", gap: "10px", alignItems: "center" },
    searchInput: { padding: "10px 15px", borderRadius: "10px", border: "1px solid #F0F2F4", width: "250px", outline: "none", fontSize: '13px' },
    actionBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
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
    editBtn: { border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    actionGroup: { display: "flex", gap: "8px" },
    loadingTd: { textAlign: 'center', padding: '40px', fontWeight: '800', color: '#25343F' },
    trashBtn: { border: 'none', background: '#FFF5F5', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
};

export default CandidateList;