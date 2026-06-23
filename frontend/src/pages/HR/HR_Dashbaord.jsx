import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BaseLayout from "../components/HR_Base";
import { apiRequest } from "../../services/api";
import StatusUpdateModal from "../../components/StatusUpdateModal";
import SubmissionModal from "../../components/SubmissionModal";
import { getStatusStyles } from "../../utils/statusHelper";

const Icons = {
    UserPlus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>,
    Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    Client: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
    Vendor: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><circle cx="18" cy="8" r="3"/><path d="M18 11v5"/></svg>,
    Pipeline: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
    Send: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
    Requirement: () => (
        <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
</svg>),
};


function HR_Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({});
    const [todayCandidates, setTodayCandidates] = useState([]);
    const [verifiedCandidates, setVerifiedCandidates] = useState([]);
    const [pipelineCandidates, setPipelineCandidates] = useState([]);
    const [teamSubmissions, setTeamSubmissions] = useState([]);
    const [last7Verified, setLast7Verified] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });
    const [showModal, setShowModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedCand, setSelectedCand] = useState(null);
    const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });
    const [submissionModalProps, setSubmissionModalProps] = useState({});

    const fetchAllData = async () => {
        try {
            const [sData, tData, vData, pData, teamData, last7Data] = await Promise.all([
                apiRequest("/employee-portal/dashboard/stats/"),
                apiRequest("/employee-portal/dashboard/today-candidates/"),
                apiRequest("/employee-portal/dashboard/today-verified-candidates/"),
                apiRequest("/employee-portal/dashboard/active-pipeline-candidates/"),
                apiRequest("/employee-portal/dashboard/team/today-submissions/"),
                apiRequest("/employee-portal/dashboard/last-7-days-verified/")
            ]);
            setStats(sData); setTodayCandidates(tData); setVerifiedCandidates(vData); setPipelineCandidates(pData); setTeamSubmissions(teamData); setLast7Verified(Array.isArray(last7Data) ? last7Data : []);
        } catch (err) { notify("Failed to load dashboard data", "error"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAllData(); }, []);

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const handleEditClick = (e, candidate) => {
        e.stopPropagation(); setSelectedCand(candidate);
        setEditForm({ main_status: candidate.main_status, sub_status: candidate.sub_status, remark: candidate.remark || "" });
        setShowModal(true);
    };

    const handleUpdateSubmit = async () => {
        try {
            await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
            notify("Status updated!"); setShowModal(false); fetchAllData();
        } catch (err) { notify("Update failed", "error"); }
    };

    const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

    const handleOpenSubmitModal = (e, candidate, isTeamSubmission) => {
        e.stopPropagation();
        setSelectedCand(candidate);
        if (isTeamSubmission) {
            setSubmissionModalProps({ initialSubmitType: "CLIENT", hideInternalOption: true });
        } else {
            setSubmissionModalProps({});
        }
        setShowSubmitModal(true);
    };

    const renderRow = (c, i, showSubmitBtn = false, showSubmitToClientBtn = false) => {
        const statusStyle = getStatusStyles(c.main_status || 'SUBMITTED');
        
        return (
            <tr key={c.id || i} style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/employee/candidate/view/${c.id}`)}>
                <td style={styles.td}>
                    <div>To: <b>{c.submitted_to_name || '-'}</b></div>
                    <div>By: <b style={{color: "#27AE60"}}>{c.created_by_name || ''}</b></div>
                </td>
                <td style={styles.td}><b>{c.candidate_name}</b></td>
                <td style={styles.td}>{truncate(c.technology, 30)}</td>
                <td style={styles.td}>{c.years_of_experience_manual || '0'} Yrs</td>
                <td style={styles.td}>{c.client_name || ''}
                    <small style={styles.subStatusText}>{c.client_company_name || '-'}</small>
                </td>
                <td style={styles.td}>
                    <b>{truncate(c.vendor_name || c.vendor_company_name || c.vendor, 15)}</b><br/>
                    <small style={styles.subStatusText}>{c.vendor_company_name || '-'}</small>
                    <small style={styles.subStatusText}>{c.vendor_number || ''}</small>
                </td>
                <td style={styles.td}>
                   Vendor: ₹{c.vendor_rate} {c.vendor_rate_type || ''}
                    
                    <br/><small style={styles.subStatusText}>Client: ₹{c.client_rate} {c.vendor_rate_type  || '-'}</small>
                </td>
                <td style={styles.td}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>{c.main_status}</span>
                        {c.remark && <div style={styles.remarkIcon} title={c.remark}><Icons.Remark /></div>}
                    </div>
                    <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: '700' }}>{c.sub_status}</small>
                </td>
                <td style={styles.td}>
                    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                        <button style={styles.editBtn} onClick={(e) => handleEditClick(e, c)}><Icons.Edit /></button>
                        
                        {showSubmitBtn && (
                            c.verification_status ? (
                                c.client_name || c.client ? (
                                    <span style={{color:'#27AE60', fontWeight:'700', fontSize:'11px', whiteSpace:'nowrap'}}>✓ Client Submitted</span>
                                ) : (
                                    <span style={{color:'#27AE60', fontWeight:'700', fontSize:'11px', whiteSpace:'nowrap'}}>✓ Internal Submitted</span>
                                )
                            ) : (
                                <button style={styles.submitBtn} onClick={(e) => handleOpenSubmitModal(e, c, false)}>Submit</button>
                            )
                        )}

                        {showSubmitToClientBtn && (
                            c.client_name || c.client ? (
                                <span style={{color:'#27AE60', fontWeight:'700', fontSize:'11px', whiteSpace:'nowrap'}}>✓ Client Submitted</span>
                            ) : (
                                <button style={styles.submitBtn} onClick={(e) => handleOpenSubmitModal(e, c, true)}>Submit to Client</button>
                            )
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    const renderGroupedRows = (list = [], showSubmit = false, showSubmitClient = false) => {
        let lastDate = "";
        return list.map((c, i) => {
            const currentDate = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            let dateSeparator = currentDate !== lastDate ? (
                <tr key={`date-sep-${i}`}><td colSpan="9" style={styles.dateSeparator}>{currentDate}</td></tr>
            ) : null;
            lastDate = currentDate;
            return <React.Fragment key={c.id || i}>{dateSeparator}{renderRow(c, i, showSubmit, showSubmitClient)}</React.Fragment>;
        });
    };

    if (loading) return <BaseLayout><div style={styles.loading}>Loading Dashboard...</div></BaseLayout>;

    return (
        <BaseLayout>
            {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>{toast.msg}</div>}

            <div style={styles.header}>
                <div><h2 style={styles.welcome}>Welcome, {stats.user_name || "Recruiter"}</h2><p style={styles.subText}>Recruitment pipeline overview for today.</p></div>
                <div style={styles.btnGroup}>
                    <button style={styles.actionBtn} onClick={() => navigate("/employee/candidates/add")}><Icons.UserPlus /> Add Profile</button>
                    <button style={styles.actionBtn} onClick={() => navigate("/employee/vendor/add")}><Icons.UserPlus /> Add Vendor</button>
                    <button style={styles.actionBtn} onClick={() => navigate("/employee/requirement/create")}><Icons.Requirement /> Add Requirement</button>
                </div>
            </div>

            <div style={styles.statsGrid}>
                {[
                    { label: "Total Pipeline", val: stats.total_pipelines, icon: <Icons.Pipeline />, col: "#25343F", url: "/employee" },
                    { label: "Today's Profiles", val: stats.today_profiles, icon: <Icons.UserPlus />, col: "#25343F", url: "/employee" },
                    { label: "Today Submitted", val: stats.today_submitted_profiles, icon: <Icons.Send />, col: "#FF9B51", url: "/employee" },
                    { label: "My Requirements", val: stats.today_requirements, icon: <Icons.Requirement />, col: "#25343F", url: "/employee/requirements/my?type=today" },
                    { label: "Total Vendors", val: stats.total_vendors, icon: <Icons.Vendor />, col: "#25343F", url: "/employee/user-vendors" },
                    { label: "Total Clients", val: stats.total_clients, icon: <Icons.Client />, col: "#25343F", url: "/employee/clients" },
                    { label: "Total Profiles", val: stats.total_profiles, icon: <Icons.Users />, col: "#25343F", url: "/employee/user-candidates" },

                    { label: "Attendance", val: stats.attendance, icon: <Icons.Users />, col: "#25343F", url: "/employee/attendance" },
                ].map((s, i) => (
                    <div key={i} style={styles.statCard} onClick={() => navigate(s.url)}>
                        <div style={{overflow:'hidden'}}><p style={styles.statLabel}>{s.label}</p><h3 style={{...styles.statValue, color: s.col}}>{s.val || 0}</h3></div>
                        <div style={{...styles.iconCircle, color: s.col, backgroundColor: 'rgba(37,52,63,0.05)'}}>{s.icon}</div>
                    </div>
                ))}
            </div>

            <Section title="Active Pipeline Candidates"><table style={styles.table}><thead style={styles.tableHeader}><tr><th style={styles.th}>To/By</th><th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th><th style={styles.th}>Client</th><th style={styles.th}>Source By</th><th style={styles.th}>Rate</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead><tbody>{renderGroupedRows(pipelineCandidates)}</tbody></table></Section>
            <Section title="Submitted Profiles Table"><table style={styles.table}><thead style={styles.tableHeader}><tr><th style={styles.th}>Team</th><th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th><th style={styles.th}>Client</th><th style={styles.th}>Source By</th><th style={styles.th}>Rates</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead><tbody>{renderGroupedRows(verifiedCandidates)}</tbody></table></Section>
            <Section title="Today's Team Submissions"><table style={styles.table}><thead style={styles.tableHeader}><tr><th style={styles.th}>By</th><th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th><th style={styles.th}>Client</th><th style={styles.th}>Source By</th><th style={styles.th}>Rate</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead><tbody>{renderGroupedRows(teamSubmissions, false, true)}</tbody></table></Section>
            <Section title="Today's New Profiles"><table style={styles.table}><thead style={styles.tableHeader}><tr><th style={styles.th}>To/By</th><th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th><th style={styles.th}>Client</th><th style={styles.th}>Source By</th><th style={styles.th}>Rate</th><th style={styles.th}>Action</th></tr></thead><tbody>{renderGroupedRows(todayCandidates, true, false)}</tbody></table></Section>

            <StatusUpdateModal isOpen={showModal} onClose={() => setShowModal(false)} formData={editForm} setFormData={setEditForm} onSave={handleUpdateSubmit} />
            
            <SubmissionModal 
                isOpen={showSubmitModal} 
                onClose={() => setShowSubmitModal(false)} 
                selectedCand={selectedCand} 
                notify={notify} 
                refreshData={fetchAllData}
                {...submissionModalProps}
            />
        </BaseLayout>
    );
}

const Section = ({ title, children }) => (
    <div style={styles.sectionContainer}>
        <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>{title}</h3></div>
        <div style={styles.tableWrapper}><div style={{overflowX:'auto'}}>{children}</div></div>
    </div>
);

const styles = {
    loading: { padding: '100px', textAlign: 'center', fontWeight: '800', color: '#25343F' },
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" },
    welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
    subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
    btnGroup: { display: "flex", gap: "10px", alignItems: "center"},
    actionBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "30px" },
    statCard: { background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F0F2F4", cursor: 'pointer' },
    statLabel: { margin: 0, color: "#7F8C8D", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" },
    statValue: { margin: "4px 0", fontSize: "20px", fontWeight: "800" },
    iconCircle: { width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
    sectionContainer: { marginBottom: "35px" },
    sectionHeader: { marginBottom: "10px" },
    sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#25343F", margin: 0, borderLeft: "4px solid #FF9B51", paddingLeft: "12px" },
    tableWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #F0F2F4", marginTop: '5px' },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
    th: { padding: "12px 18px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" },
    tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
    td: { padding: "12px 18px", fontSize: "13px", color: "#334155" },
    dateSeparator: { padding: "10px 20px", background: "#f8fafc", color: "#475569", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", borderBottom: '1px solid #e2e8f0' },
    badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
    subStatusText: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
    remarkIcon: { display: 'flex', cursor: 'help', padding: '4px', borderRadius: '4px', background: '#FFF5EB' },
    editBtn: { border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    submitBtn: { background: '#25343F', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }
};

export default HR_Dashboard;



