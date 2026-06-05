import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SubAdminLayout from "../components/SubAdminLayout"; 
import { apiRequest } from "../../services/api";

// External Imports
import StatusUpdateModal from "../../components/StatusUpdateModal";
import { getStatusStyles } from "../../utils/statusHelper";
import { getSubmittedToName, getCreatedByName } from "../../utils/candidateDisplay";


const Icons = {
    UserPlus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>,
    Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    Client: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
    Vendor: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><circle cx="18" cy="8" r="3"/><path d="M18 11v5"/></svg>,
    Pipeline: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
    Send: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    Manage: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
    Onboard: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
    Invoice: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 12v4M9 14h6"/></svg>
};

function SubAdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({});
    const [pipelineData, setPipelineData] = useState([]);
    const [submittedData, setSubmittedData] = useState([]);
    const [todayProfilesData, setTodayProfilesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    const [showModal, setShowModal] = useState(false);
    const [selectedCand, setSelectedCand] = useState(null);
    const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });

    const toList = (data) => {
        if (Array.isArray(data)) return data;
        if (data?.results && Array.isArray(data.results)) return data.results;
        return [];
    };

    const fetchSubAdminData = async () => {
        try {
            const [sData, pData, subData, tPData] = await Promise.all([
                apiRequest("/sub-admin/api/subadmin/dashboard/stats/"),
                apiRequest("/sub-admin/api/subadmin/dashboard/pipeline/"),
                apiRequest("/sub-admin/api/subadmin/dashboard/today-verified/"),
                apiRequest("/sub-admin/api/dashboard/today-profiles/")
            ]);
            setStats(sData && typeof sData === "object" && !Array.isArray(sData) ? sData : {});
            setPipelineData(toList(pData));
            setSubmittedData(toList(subData));
            setTodayProfilesData(toList(tPData));
        } catch (err) {
            console.error("Failed to load Sub-Admin data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSubAdminData(); }, []);

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const handleEditClick = (e, candidate) => {
        e.stopPropagation();
        setSelectedCand(candidate);
        setEditForm({ 
            main_status: candidate.main_status || "SUBMITTED", 
            sub_status: candidate.sub_status || "NONE", 
            remark: candidate.remark || "" 
        });
        setShowModal(true);
    };

    const handleUpdateSubmit = async () => {
        try {
            await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
            notify("Status updated successfully!");
            setShowModal(false);
            fetchSubAdminData(); 
        } catch (err) { notify("Update failed", "error"); }
    };

    const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

    const renderRows = (list = []) => {
        const rows = Array.isArray(list) ? list : [];
        return rows.map((c, i) => {
            const currentDate = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            const statusStyle = getStatusStyles(c.main_status || 'SUBMITTED');

            return (
                <tr key={c.id || i} style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/sub-admin/candidate/view/${c.id}`)}>
                    <td style={styles.td}><b>{currentDate}</b></td>
                    <td style={styles.td}>
                        <div>To: <b>{truncate(getSubmittedToName(c), 15) || '-'}</b></div>
                        <div>By: <b style={{color: "#27AE60"}}>{truncate(getCreatedByName(c), 15) || '-'}</b></div>
                    </td>
                    <td style={styles.td}><b>{truncate(c.candidate_name || '', 15)}</b></td>
                    <td style={styles.td}>{truncate(c.technology, 30)}</td>
                    <td style={styles.td}>{c.years_of_experience_manual || '0'} Yrs</td>
                    <td style={styles.td}>
                        <b>{truncate(c.client_name || '', 20)}</b>
                    <small style={styles.subStatusText}>{truncate(c.client_company_name || '', 20)}</small>
                    </td>

                    <td style={styles.td}>
                        <b>{truncate(c.vendor_name || c.vendor, 15)}</b><br/>
                        <small style={styles.subStatusText}>{truncate(c.vendor_company_name || '', 15)}</small>
                        <small style={styles.subStatusText}>{c.vendor_number || ''}</small>
                    </td>
                    <td style={styles.td}>
                        <b>₹{c.vendor_rate} {c.vendor_rate_type || ''}</b>
                        {/* <small style={styles.subStatusText}>₹{c.client_rate} {c.client_rate_type || ''}</small> */}

                        </td>

                    <td style={styles.td}>
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>{c.main_status}</span>
                            {c.remark && <div style={styles.remarkIcon} title={c.remark}><Icons.Remark /></div>}
                        </div>
                        <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: '700' }}>{c.sub_status}</small>
                    </td>
                    <td style={styles.td}>
                        <button style={styles.editBtn} onClick={(e) => handleEditClick(e, c)}><Icons.Edit /></button>
                    </td>
                </tr>
            );
        });
    };

    if (loading) return <SubAdminLayout><div style={styles.loading}>Loading Dashboard...</div></SubAdminLayout>;

    return (
        <>
        <SubAdminLayout>
            {toast.show && (
                <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
                    {toast.msg}
                </div>
            )}

            <div style={styles.header}>
                <div>
                    <h2 style={styles.welcome}>Team Overview, {stats.user_name || "Sub Admin"}</h2>
                    <p style={styles.subText}>Management dashboard for tracking recruitment progress.</p>
                </div>
                <div style={styles.btnGroup}>
                    <button style={{...styles.actionBtn, background: '#25343F'}} onClick={() => navigate("/sub-admin/team-manage")}><Icons.Manage /> Manage Team</button>
                    <button style={styles.actionBtn} onClick={() => navigate("/sub-admin/add-user")}><Icons.UserPlus /> Add Employee</button>
                    <button style={styles.actionBtn} onClick={() => navigate("/sub-admin/team-reports")}><Icons.UserPlus />Attendance</button>
                    <button style={styles.actionBtn} onClick={() => navigate("/sub-admin/requirement/create")}><Icons.Invoice /> Add Requirement</button>
                </div>
            </div>

            <div style={styles.statsGrid}>
                {[
                    { label: "Team Pipeline", val: stats.team_pipeline, icon: <Icons.Pipeline />, col: "#4834D4", path: "/sub-admin/Pipeline" },
                    { label: "Today's Profiles", val: stats.today_profiles, icon: <Icons.UserPlus />, col: "#25343F", path: "/sub-admin/todays-New-Profiles" },
                    { label: "Today Submitted", val: stats.today_submitted_profiles, icon: <Icons.Send />, col: "#FF9B51", path: "/sub-admin/todays-submitted-profiles" },
                    { label: "Total Submitted", val: stats.total_submitted_profiles, icon: <Icons.Send />, col: "#27AE60", path: "/sub-admin/total-submitted-profiles" },
                    { label: "Total Onboarding", val: stats.onboard_profiles, icon: <Icons.Onboard />, col: "#27AE60", path: "/sub-admin/total-onbording" },
                    { label: "Total Vendors", val: stats.total_vendors, icon: <Icons.Vendor />, col: "#25343F", path: "/sub-admin/all-Vendors" },
                    { label: "Total Clients", val: stats.total_clients, icon: <Icons.Client />, col: "#25343F", path: "/sub-admin/clients" },
                    { label: "Total Profiles", val: stats.total_profiles, icon: <Icons.Users />, col: "#25343F", path: "/sub-admin/all-candidates" },
                    { label: "Total Employees", val: stats.total_employees, icon: <Icons.Users />, col: "#25343F", path: "/sub-admin/team-manage" },
                    { label: "Today's Requirements", val: stats.today_requirements, icon: <Icons.Users />, col: "#25343F", path: "/sub-admin/requirements/my?type=today" },
                ]?.map((s, i) => (
                    <div 
                        key={i} 
                        style={{ ...styles.statCard, cursor: 'pointer' }} 
                        onClick={() => s.path && navigate(s.path)}
                    >
                        <div>
                            <p style={styles.statLabel}>{s.label}</p>
                            <h3 style={{ ...styles.statValue, color: s.col }}>{s.val || 0}</h3>
                        </div>
                        <div style={{ ...styles.iconCircle, color: s.col, backgroundColor: 'rgba(37,52,63,0.05)' }}>
                            {s.icon}
                        </div>
                    </div>
                ))}
            </div>

            <Section title="Active Pipeline (Team)">
                <table style={styles.table}>
                    <thead style={styles.tableHeader}>
                        <tr>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Submitted To/By</th><th style={styles.th}>Candidate</th>
                            <th style={styles.th}>Tech</th><th style={styles.th}>Exp</th>
                            <th style={styles.th}>Client</th><th style={styles.th}>Vendor</th>
                            <th style={styles.th}>Rate (V/C)</th><th style={styles.th}>Status</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>{renderRows(pipelineData)}</tbody>
                </table>
            </Section>

            <Section title="Today's Submitted Profiles">
                <table style={styles.table}>
                    <thead style={styles.tableHeader}>
                        <tr>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Submitted To/By</th><th style={styles.th}>Candidate</th>
                            <th style={styles.th}>Tech</th><th style={styles.th}>Exp</th>
                            <th style={styles.th}>Client</th><th style={styles.th}>Vendor</th>
                            <th style={styles.th}>Rate</th><th style={styles.th}>Status</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>{renderRows(submittedData)}</tbody>
                </table>
            </Section>

            <Section title="Today's New Profiles">
                <table style={styles.table}>
                    <thead style={styles.tableHeader}>
                        <tr>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Submitted To/By</th><th style={styles.th}>Candidate</th>
                            <th style={styles.th}>Tech</th><th style={styles.th}>Exp</th>
                            <th style={styles.th}>Client</th><th style={styles.th}>Vendor</th>
                            <th style={styles.th}>Rate</th><th style={styles.th}>Status</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>{renderRows(todayProfilesData)}</tbody>
                </table>
            </Section>

            <StatusUpdateModal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)} 
                formData={editForm}
                setFormData={setEditForm}
                onSave={handleUpdateSubmit}
            />
           
        </SubAdminLayout>
        
         </>
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
    btnGroup: { display: "flex", gap: "10px", alignItems: "center"},
    welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
    subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
    actionBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "30px" },
    statCard: { background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F0F2F4" },
    statLabel: { margin: 0, color: "#7F8C8D", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" },
    statValue: { margin: "4px 0", fontSize: "24px", fontWeight: "800" },
    iconCircle: { width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
    sectionContainer: { marginBottom: "35px" },
    sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#25343F", margin: 0, borderLeft: "4px solid #FF9B51", paddingLeft: "12px", marginBottom: "15px" },
    tableWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #F0F2F4" },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
    th: { padding: "14px 18px", textAlign: "left", fontSize: "11px", color: "#626b77", fontWeight: "800", textTransform: "uppercase" },
    tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
    td: { padding: "14px 18px", fontSize: "13px", color: "#334155" },
    badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
    subStatusText: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
    remarkIcon: { display: 'flex', cursor: 'help', padding: '4px', borderRadius: '4px', background: '#FFF5EB' },
    editBtn: { border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer' }
};

export default SubAdminDashboard;






// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import SubAdminLayout from "../components/SubAdminLayout"; 
// import { apiRequest } from "../../services/api";

// // External Imports
// import StatusUpdateModal from "../../components/StatusUpdateModal";
// import { getStatusStyles } from "../../utils/statusHelper";

// const Icons = {
//     UserPlus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>,
//     Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
//     Client: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
//     Vendor: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><circle cx="18" cy="8" r="3"/><path d="M18 11v5"/></svg>,
//     Pipeline: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
//     Send: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
//     Manage: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
// };

// function SubAdminDashboard() {
//     const navigate = useNavigate();
//     const [stats, setStats] = useState({});
//     const [pipelineData, setPipelineData] = useState([]);
//     const [submittedData, setSubmittedData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     const [showModal, setShowModal] = useState(false);
//     const [selectedCand, setSelectedCand] = useState(null);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });

//     const fetchSubAdminData = async () => {
//         try {
//             const [sData, pData, subData] = await Promise.all([
//                 apiRequest("/sub-admin/api/subadmin/dashboard/stats/"),
//                 apiRequest("/sub-admin/api/subadmin/dashboard/pipeline/"),
//                 apiRequest("/sub-admin/api/subadmin/dashboard/today-verified/")
//             ]);
//             setStats(sData);
//             setPipelineData(pData);
//             setSubmittedData(subData);
//         } catch (err) {
//             console.error("Failed to load Sub-Admin data", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => { fetchSubAdminData(); }, []);

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleEditClick = (e, candidate) => {
//         e.stopPropagation();
//         setSelectedCand(candidate);
//         setEditForm({ 
//             main_status: candidate.main_status || "SUBMITTED", 
//             sub_status: candidate.sub_status || "NONE", 
//             remark: candidate.remark || "" 
//         });
//         setShowModal(true);
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
//             notify("Status updated successfully!");
//             setShowModal(false);
//             fetchSubAdminData(); 
//         } catch (err) { notify("Update failed", "error"); }
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     const renderRows = (list = []) => {
//         return list.map((c, i) => {
//             const currentDate = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
//             const statusStyle = getStatusStyles(c.main_status || 'SUBMITTED');

//             return (
//                 <tr key={c.id || i} style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/sub-admin/candidate/view/${c.id}`)}>
//                     <td style={styles.td}><b>{currentDate}</b></td>
//                     <td style={styles.td}>
//                         <div>To: <b>{truncate(c.submitted_to_name, 15) || '-'}</b></div>
//                         <div>By: <b style={{color: "#27AE60"}}>{truncate(c.created_by_name, 15) || '-'}</b></div>
//                     </td>
//                     <td style={styles.td}><b>{c.candidate_name}</b></td>
//                     <td style={styles.td}>{truncate(c.technology, 30)}</td>
//                     <td style={styles.td}>{c.years_of_experience_manual || '0'} Yrs</td>
//                     <td style={styles.td}>{truncate(c.client_name || c.client || 'N/A', 20)}</td>
//                     <td style={styles.td}>
//                         <b>{truncate(c.vendor_name || c.vendor, 15)}</b><br/>
//                         <small style={styles.subStatusText}>{c.vendor_number || 'N/A'}</small>
//                     </td>
//                     <td style={styles.td}>₹{c.vendor_rate} {c.vendor_rate_type || ''}</td>
//                     <td style={styles.td}>
//                         <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
//                             <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>{c.main_status}</span>
//                             {c.remark && <div style={styles.remarkIcon} title={c.remark}><Icons.Remark /></div>}
//                         </div>
//                         <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: '700' }}>{c.sub_status}</small>
//                     </td>
//                     <td style={styles.td}>
//                         <button style={styles.editBtn} onClick={(e) => handleEditClick(e, c)}><Icons.Edit /></button>
//                     </td>
//                 </tr>
//             );
//         });
//     };

//     if (loading) return <SubAdminLayout><div style={styles.loading}>Loading Dashboard...</div></SubAdminLayout>;

//     return (
//         <SubAdminLayout>
//             {toast.show && (
//                 <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
//                     {toast.msg}
//                 </div>
//             )}

//             <div style={styles.header}>
//                 <div>
//                     <h2 style={styles.welcome}>Team Overview, {stats.user_name || "Sub Admin"}</h2>
//                     <p style={styles.subText}>Management dashboard for tracking recruitment progress.</p>
//                 </div>
//                 <div style={styles.btnGroup}>
//                     <button style={{...styles.actionBtn, background: '#25343F'}} onClick={() => navigate("/sub-admin/team-manage")}><Icons.Manage /> Manage Team</button>
//                     <button style={styles.actionBtn} onClick={() => navigate("/sub-admin/add-user")}><Icons.UserPlus /> Add Member</button>
//                 </div>
//             </div>

//             <div style={styles.statsGrid}>
//                 {[
//                     { label: "Team Pipeline", val: stats.team_pipeline, icon: <Icons.Pipeline />, col: "#4834D4" },
//                     { label: "Today's Profiles", val: stats.today_profiles, icon: <Icons.UserPlus />, col: "#25343F" },
//                     { label: "Today Submitted", val: stats.today_submitted_profiles, icon: <Icons.Send />, col: "#FF9B51" },
//                     { label: "Total Submitted", val: stats.total_submitted_profiles, icon: <Icons.Send />, col: "#27AE60" },
//                     { label: "Total Onbording", val: stats.onboard_profiles, icon: <Icons.Send />, col: "#27AE60" },
//                     { label: "Total Vendors", val: stats.total_vendors, icon: <Icons.Vendor />, col: "#25343F" },
//                     { label: "Total Clients", val: stats.total_clients, icon: <Icons.Client />, col: "#25343F" },
//                     { label: "Total Profiles", val: stats.total_profiles, icon: <Icons.Users />, col: "#25343F" },
//                     { label: "Total Employees", val: stats.total_employees, icon: <Icons.Users />, col: "#25343F" },
//                 ].map((s, i) => (
//                     <div key={i} style={styles.statCard}>
//                         <div><p style={styles.statLabel}>{s.label}</p><h3 style={{...styles.statValue, color: s.col}}>{s.val || 0}</h3></div>
//                         <div style={{...styles.iconCircle, color: s.col, backgroundColor: 'rgba(37,52,63,0.05)'}}>{s.icon}</div>
//                     </div>
//                 ))}
//             </div>

//             <Section title="Active Pipeline (Team)">
//                 <table style={styles.table}>
//                     <thead style={styles.tableHeader}>
//                         <tr>
//                             <th style={styles.th}>Date</th>
//                             <th style={styles.th}>Submitted To/By</th><th style={styles.th}>Candidate</th>
//                             <th style={styles.th}>Tech</th><th style={styles.th}>Exp</th>
//                             <th style={styles.th}>Client</th><th style={styles.th}>Vendor</th>
//                             <th style={styles.th}>Rate</th><th style={styles.th}>Status</th>
//                             <th style={styles.th}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>{renderRows(pipelineData)}</tbody>
//                 </table>
//             </Section>

//             <Section title="Today's Submitted Profiles">
//                 <table style={styles.table}>
//                     <thead style={styles.tableHeader}>
//                         <tr>
//                             <th style={styles.th}>Date</th>
//                             <th style={styles.th}>Submitted To/By</th><th style={styles.th}>Candidate</th>
//                             <th style={styles.th}>Tech</th><th style={styles.th}>Exp</th>
//                             <th style={styles.th}>Client</th><th style={styles.th}>Vendor</th>
//                             <th style={styles.th}>Rate</th><th style={styles.th}>Status</th>
//                             <th style={styles.th}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>{renderRows(submittedData)}</tbody>
//                 </table>
//             </Section>

//             <StatusUpdateModal 
//                 isOpen={showModal} 
//                 onClose={() => setShowModal(false)} 
//                 formData={editForm}
//                 setFormData={setEditForm}
//                 onSave={handleUpdateSubmit}
//             />
//         </SubAdminLayout>
//     );
// }

// const Section = ({ title, children }) => (
//     <div style={styles.sectionContainer}>
//         <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>{title}</h3></div>
//         <div style={styles.tableWrapper}><div style={{overflowX:'auto'}}>{children}</div></div>
//     </div>
// );

// const styles = {
//     loading: { padding: '100px', textAlign: 'center', fontWeight: '800', color: '#25343F' },
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" },
//     btnGroup: { display: "flex", gap: "10px", alignItems: "center"},
//     welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
//     subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
//     actionBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
//     statsGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "30px" }, // Desktop par 4 cards per row
//     statCard: { background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F0F2F4" },
//     statLabel: { margin: 0, color: "#7F8C8D", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" },
//     statValue: { margin: "4px 0", fontSize: "24px", fontWeight: "800" },
//     iconCircle: { width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
//     sectionContainer: { marginBottom: "35px" },
//     sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#25343F", margin: 0, borderLeft: "4px solid #FF9B51", paddingLeft: "12px", marginBottom: "15px" },
//     tableWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #F0F2F4" },
//     table: { width: "100%", borderCollapse: "collapse" },
//     tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
//     th: { padding: "14px 18px", textAlign: "left", fontSize: "11px", color: "#626b77", fontWeight: "800", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
//     td: { padding: "14px 18px", fontSize: "13px", color: "#334155" },
//     badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
//     subStatusText: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
//     remarkIcon: { display: 'flex', cursor: 'help', padding: '4px', borderRadius: '4px', background: '#FFF5EB' },
//     editBtn: { border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer' }
// };

// export default SubAdminDashboard;







// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import SubAdminLayout from "../components/SubAdminLayout"; 
// import { apiRequest } from "../../services/api";

// // External Imports
// import StatusUpdateModal from "../../components/StatusUpdateModal";
// import { getStatusStyles } from "../../utils/statusHelper";

// const Icons = {
//     UserPlus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>,
//     Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
//     Client: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
//     Vendor: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><circle cx="18" cy="8" r="3"/><path d="M18 11v5"/></svg>,
//     Pipeline: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
//     Send: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
//     Manage: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
// };

// function SubAdminDashboard() {
//     const navigate = useNavigate();
//     const [stats, setStats] = useState({});
//     const [pipelineData, setPipelineData] = useState([]);
//     const [submittedData, setSubmittedData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     const [showModal, setShowModal] = useState(false);
//     const [selectedCand, setSelectedCand] = useState(null);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });

//     const fetchSubAdminData = async () => {
//         try {
//             const [sData, pData, subData] = await Promise.all([
//                 apiRequest("/sub-admin/api/subadmin/dashboard/stats/"),
//                 apiRequest("/sub-admin/api/subadmin/dashboard/pipeline/"),
//                 apiRequest("/sub-admin/api/subadmin/dashboard/today-verified/")
//             ]);
//             setStats(sData);
//             setPipelineData(pData);
//             setSubmittedData(subData);
//         } catch (err) {
//             console.error("Failed to load Sub-Admin data", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => { fetchSubAdminData(); }, []);

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleEditClick = (e, candidate) => {
//         e.stopPropagation();
//         setSelectedCand(candidate);
//         setEditForm({ 
//             main_status: candidate.main_status || "SUBMITTED", 
//             sub_status: candidate.sub_status || "NONE", 
//             remark: candidate.remark || "" 
//         });
//         setShowModal(true);
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
//             notify("Status updated successfully!");
//             setShowModal(false);
//             fetchSubAdminData(); 
//         } catch (err) { notify("Update failed", "error"); }
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     const renderRows = (list = []) => {
//         return list.map((c, i) => {
//             const currentDate = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
//             const statusStyle = getStatusStyles(c.main_status || 'SUBMITTED');

//             return (
//                 <tr key={c.id || i} style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/sub-admin/candidate/view/${c.id}`)}>
//                     <td style={styles.td}><b>{currentDate}</b></td>
//                     <td style={styles.td}>
//                         <div>To: <b>{truncate(c.submitted_to_name, 15) || '-'}</b></div>
//                         <div>By: <b style={{color: "#27AE60"}}>{truncate(c.created_by_name, 15) || '-'}</b></div>
//                     </td>
//                     <td style={styles.td}><b>{c.candidate_name}</b></td>
//                     <td style={styles.td}>{truncate(c.technology, 30)}</td>
//                     <td style={styles.td}>{c.years_of_experience_manual || '0'} Yrs</td>
//                     <td style={styles.td}>{truncate(c.client_name || c.client || 'N/A', 20)}</td>
//                     <td style={styles.td}>
//                         <b>{truncate(c.vendor_name || c.vendor, 15)}</b><br/>
//                         <small style={styles.subStatusText}>{c.vendor_number || 'N/A'}</small>
//                     </td>
//                     <td style={styles.td}>₹{c.vendor_rate} {c.vendor_rate_type || ''}</td>
//                     <td style={styles.td}>
//                         <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
//                             <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>{c.main_status}</span>
//                             {c.remark && <div style={styles.remarkIcon} title={c.remark}><Icons.Remark /></div>}
//                         </div>
//                         <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: '700' }}>{c.sub_status}</small>
//                     </td>
//                     <td style={styles.td}>
//                         <button style={styles.editBtn} onClick={(e) => handleEditClick(e, c)}><Icons.Edit /></button>
//                     </td>
//                 </tr>
//             );
//         });
//     };

//     if (loading) return <SubAdminLayout><div style={styles.loading}>Loading Dashboard...</div></SubAdminLayout>;

//     return (
//         <SubAdminLayout>
//             {toast.show && (
//                 <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
//                     {toast.msg}
//                 </div>
//             )}

//             <div style={styles.header}>
//                 <div>
//                     <h2 style={styles.welcome}>Team Overview, {stats.user_name || "Sub Admin"}</h2>
//                     <p style={styles.subText}>Management dashboard for tracking recruitment progress.</p>
//                 </div>
//                 <div style={styles.btnGroup}>
//                     <button style={{...styles.actionBtn, background: '#25343F'}} onClick={() => navigate("/sub-admin/team-manage")}><Icons.Manage /> Manage Team</button>
//                     <button style={styles.actionBtn} onClick={() => navigate("/sub-admin/add-user")}><Icons.UserPlus /> Add Member</button>
//                 </div>
//             </div>

//             <div style={styles.statsGrid}>
//                 {[
//                     { label: "Team Pipeline", val: stats.total_pipelines, icon: <Icons.Pipeline />, col: "#4834D4" },
//                     { label: "Today's Profiles", val: stats.today_profiles, icon: <Icons.UserPlus />, col: "#25343F" },
//                     { label: "Today Submitted", val: stats.today_submitted_profiles, icon: <Icons.Send />, col: "#FF9B51" },
//                     { label: "Total Submitted", val: stats.total_submitted_profiles, icon: <Icons.Send />, col: "#27AE60" },
//                     { label: "Total Vendors", val: stats.total_vendors, icon: <Icons.Vendor />, col: "#25343F" },
//                     { label: "Total Clients", val: stats.total_clients, icon: <Icons.Client />, col: "#25343F" },
//                     { label: "Total Profiles", val: stats.total_profiles, icon: <Icons.Users />, col: "#25343F" },
//                     { label: "Total Employees", val: stats.total_employees, icon: <Icons.Users />, col: "#25343F" },
//                 ].map((s, i) => (
//                     <div key={i} style={styles.statCard}>
//                         <div><p style={styles.statLabel}>{s.label}</p><h3 style={{...styles.statValue, color: s.col}}>{s.val || 0}</h3></div>
//                         <div style={{...styles.iconCircle, color: s.col, backgroundColor: 'rgba(37,52,63,0.05)'}}>{s.icon}</div>
//                     </div>
//                 ))}
//             </div>

//             <Section title="Active Pipeline (Team)">
//                 <table style={styles.table}>
//                     <thead style={styles.tableHeader}>
//                         <tr>
//                             <th style={styles.th}>Date</th>
//                             <th style={styles.th}>Submitted To/By</th><th style={styles.th}>Candidate</th>
//                             <th style={styles.th}>Tech</th><th style={styles.th}>Exp</th>
//                             <th style={styles.th}>Client</th><th style={styles.th}>Vendor</th>
//                             <th style={styles.th}>Rate</th><th style={styles.th}>Status</th>
//                             <th style={styles.th}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>{renderRows(pipelineData)}</tbody>
//                 </table>
//             </Section>

//             <Section title="Today's Submitted Profiles">
//                 <table style={styles.table}>
//                     <thead style={styles.tableHeader}>
//                         <tr>
//                             <th style={styles.th}>Date</th>
//                             <th style={styles.th}>Submitted To/By</th><th style={styles.th}>Candidate</th>
//                             <th style={styles.th}>Tech</th><th style={styles.th}>Exp</th>
//                             <th style={styles.th}>Client</th><th style={styles.th}>Vendor</th>
//                             <th style={styles.th}>Rate</th><th style={styles.th}>Status</th>
//                             <th style={styles.th}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>{renderRows(submittedData)}</tbody>
//                 </table>
//             </Section>

//             <StatusUpdateModal 
//                 isOpen={showModal} 
//                 onClose={() => setShowModal(false)} 
//                 formData={editForm}
//                 setFormData={setEditForm}
//                 onSave={handleUpdateSubmit}
//             />
//         </SubAdminLayout>
//     );
// }

// const Section = ({ title, children }) => (
//     <div style={styles.sectionContainer}>
//         <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>{title}</h3></div>
//         <div style={styles.tableWrapper}><div style={{overflowX:'auto'}}>{children}</div></div>
//     </div>
// );

// const styles = {
//     loading: { padding: '100px', textAlign: 'center', fontWeight: '800', color: '#25343F' },
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" },
//     btnGroup: { display: "flex", gap: "10px", alignItems: "center"},
//     welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
//     subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
//     actionBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
//     statsGrid: { display: "flex", gap: "15px", marginBottom: "30px", flexWrap: "wrap" }, // flexWrap added to prevent scroll
//     statCard: { minWidth: "180px", flex: "1 1 180px", background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F0F2F4" },
//     statLabel: { margin: 0, color: "#7F8C8D", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" },
//     statValue: { margin: "4px 0", fontSize: "24px", fontWeight: "800" },
//     iconCircle: { width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
//     sectionContainer: { marginBottom: "35px" },
//     sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#25343F", margin: 0, borderLeft: "4px solid #FF9B51", paddingLeft: "12px", marginBottom: "15px" },
//     tableWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #F0F2F4" },
//     table: { width: "100%", borderCollapse: "collapse" },
//     tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
//     th: { padding: "14px 18px", textAlign: "left", fontSize: "11px", color: "#626b77", fontWeight: "800", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
//     td: { padding: "14px 18px", fontSize: "13px", color: "#334155" },
//     badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
//     subStatusText: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
//     remarkIcon: { display: 'flex', cursor: 'help', padding: '4px', borderRadius: '4px', background: '#FFF5EB' },
//     editBtn: { border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer' }
// };

// export default SubAdminDashboard;




// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import SubAdminLayout from "../components/SubAdminLayout"; 
// import { apiRequest } from "../../services/api";

// // External Imports
// import StatusUpdateModal from "../../components/StatusUpdateModal";
// import { getStatusStyles } from "../../utils/statusHelper";

// const Icons = {
//     UserPlus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>,
//     Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
//     Client: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
//     Vendor: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><circle cx="18" cy="8" r="3"/><path d="M18 11v5"/></svg>,
//     Pipeline: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
//     Send: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
//     Manage: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
// };

// function SubAdminDashboard() {
//     const navigate = useNavigate();
//     const [stats, setStats] = useState({});
//     const [pipelineData, setPipelineData] = useState([]);
//     const [submittedData, setSubmittedData] = useState([]);
//     const [last7DaysData, setLast7DaysData] = useState([]); 
//     const [loading, setLoading] = useState(true);
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     const [showModal, setShowModal] = useState(false);
//     const [selectedCand, setSelectedCand] = useState(null);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });

//     const fetchSubAdminData = async () => {
//         try {
//             const [sData, pData, subData, last7Data] = await Promise.all([
//                 apiRequest("/sub-admin/api/subadmin/dashboard/stats/"),
//                 apiRequest("/sub-admin/api/subadmin/dashboard/pipeline/"),
//                 apiRequest("/sub-admin/api/subadmin/dashboard/today-verified/"),
//                 apiRequest("/sub-admin/api/last-7-days-verified/")
//             ]);
//             setStats(sData);
//             setPipelineData(pData);
//             setSubmittedData(subData);
//             setLast7DaysData(Array.isArray(last7Data) ? last7Data : []);
//         } catch (err) {
//             console.error("Failed to load Sub-Admin data", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => { fetchSubAdminData(); }, []);

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleEditClick = (e, candidate) => {
//         e.stopPropagation();
//         setSelectedCand(candidate);
//         setEditForm({ 
//             main_status: candidate.main_status || "SUBMITTED", 
//             sub_status: candidate.sub_status || "NONE", 
//             remark: candidate.remark || "" 
//         });
//         setShowModal(true);
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
//             notify("Status updated successfully!");
//             setShowModal(false);
//             fetchSubAdminData(); 
//         } catch (err) { notify("Update failed", "error"); }
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     // Grouping rows by date like Employee Dashboard
//     const renderGroupedRows = (list = []) => {
//         let lastDate = "";
//         return list.map((c, i) => {
//             const currentDate = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
//             let dateSeparator = null;
//             if (currentDate !== lastDate) {
//                 lastDate = currentDate;
//                 dateSeparator = (
//                     <tr key={`date-sep-${c.id || i}`}>
//                         <td colSpan="9" style={styles.dateSeparator}>{currentDate}</td>
//                     </tr>
//                 );
//             }

//             const statusStyle = getStatusStyles(c.main_status || 'SUBMITTED');

//             return (
//                 <React.Fragment key={c.id || i}>
//                     {dateSeparator}
//                     <tr style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/sub-admin/candidate/view/${c.id}`)}>
//                         <td style={styles.td}>
//                             <div>To: <b>{c.submitted_to_name || '-'}</b></div>
//                             <div>By: <b style={{color: "#27AE60"}}>{c.created_by_name || '-'}</b></div>
//                         </td>
//                         <td style={styles.td}><b>{c.candidate_name}</b></td>
//                         <td style={styles.td}>{truncate(c.technology, 30)}</td>
//                         <td style={styles.td}>{c.years_of_experience_manual || '0'} Yrs</td>
//                         <td style={styles.td}>{c.client_name || c.client || 'N/A'}</td>
//                         <td style={styles.td}>
//                             <b>{truncate(c.vendor_name || c.vendor, 15)}</b><br/>
//                             <small style={styles.subStatusText}>{c.vendor_number || 'N/A'}</small>
//                         </td>
//                         <td style={styles.td}>₹{c.vendor_rate} {c.vendor_rate_type || ''}</td>
//                         <td style={styles.td}>
//                             <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
//                                 <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>{c.main_status}</span>
//                                 {c.remark && <div style={styles.remarkIcon} title={c.remark}><Icons.Remark /></div>}
//                             </div>
//                             <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: '700' }}>{c.sub_status}</small>
//                         </td>
//                         <td style={styles.td}>
//                             <button style={styles.editBtn} onClick={(e) => handleEditClick(e, c)}><Icons.Edit /></button>
//                         </td>
//                     </tr>
//                 </React.Fragment>
//             );
//         });
//     };

//     if (loading) return <SubAdminLayout><div style={styles.loading}>Loading Dashboard...</div></SubAdminLayout>;

//     return (
//         <SubAdminLayout>
//             {toast.show && (
//                 <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
//                     {toast.msg}
//                 </div>
//             )}

//             <div style={styles.header}>
//                 <div>
//                     <h2 style={styles.welcome}>Team Overview, {stats.user_name || "Sub Admin"}</h2>
//                     <p style={styles.subText}>Management dashboard for tracking recruitment progress.</p>
//                 </div>
//                 <div style={styles.btnGroup}>
//                     <button style={{...styles.actionBtn, background: '#25343F'}} onClick={() => navigate("/sub-admin/team-manage")}><Icons.Manage /> Manage Team</button>
//                     <button style={styles.actionBtn} onClick={() => navigate("/sub-admin/add-user")}><Icons.UserPlus /> Add Member</button>
//                 </div>
//             </div>

//             <div style={styles.statsGrid}>
//                 {[
//                     { label: "Team Pipeline", val: stats.total_pipelines, icon: <Icons.Pipeline />, col: "#4834D4" },
//                     { label: "Today's Profiles", val: stats.today_profiles, icon: <Icons.UserPlus />, col: "#25343F" },
//                     { label: "Team Submitted", val: stats.today_submitted_profiles, icon: <Icons.Send />, col: "#FF9B51" },
//                     { label: "Total Vendors", val: stats.total_vendors, icon: <Icons.Vendor />, col: "#25343F" },
//                     { label: "Total Clients", val: stats.total_clients, icon: <Icons.Client />, col: "#25343F" },
//                     { label: "Total Profiles", val: stats.total_profiles, icon: <Icons.Users />, col: "#25343F" },
//                 ].map((s, i) => (
//                     <div key={i} style={styles.statCard}>
//                         <div><p style={styles.statLabel}>{s.label}</p><h3 style={{...styles.statValue, color: s.col}}>{s.val || 0}</h3></div>
//                         <div style={{...styles.iconCircle, color: s.col, backgroundColor: 'rgba(37,52,63,0.05)'}}>{s.icon}</div>
//                     </div>
//                 ))}
//             </div>

//             <Section title="Active Pipeline (Team)">
//                 <table style={styles.table}>
//                     <thead style={styles.tableHeader}>
//                         <tr>
//                             <th style={styles.th}>Submitted To/By</th><th style={styles.th}>Candidate</th>
//                             <th style={styles.th}>Tech</th><th style={styles.th}>Exp</th>
//                             <th style={styles.th}>Client</th><th style={styles.th}>Vendor</th>
//                             <th style={styles.th}>Rate</th><th style={styles.th}>Status</th>
//                             <th style={styles.th}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>{renderGroupedRows(pipelineData)}</tbody>
//                 </table>
//             </Section>

//             <Section title="Today's Submitted Profiles">
//                 <table style={styles.table}>
//                     <thead style={styles.tableHeader}>
//                         <tr>
//                             <th style={styles.th}>Submitted To/By</th><th style={styles.th}>Candidate</th>
//                             <th style={styles.th}>Tech</th><th style={styles.th}>Exp</th>
//                             <th style={styles.th}>Client</th><th style={styles.th}>Vendor</th>
//                             <th style={styles.th}>Rate</th><th style={styles.th}>Status</th>
//                             <th style={styles.th}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>{renderGroupedRows(submittedData)}</tbody>
//                 </table>
//             </Section>

//             <Section title="Last 7 Days Submitted Profiles">
//                 <table style={styles.table}>
//                     <thead style={styles.tableHeader}>
//                         <tr>
//                             <th style={styles.th}>Submitted To/By</th><th style={styles.th}>Candidate</th>
//                             <th style={styles.th}>Tech</th><th style={styles.th}>Exp</th>
//                             <th style={styles.th}>Client</th><th style={styles.th}>Vendor</th>
//                             <th style={styles.th}>Rate</th><th style={styles.th}>Status</th>
//                             <th style={styles.th}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>{renderGroupedRows(last7DaysData)}</tbody>
//                 </table>
//             </Section>

//             <StatusUpdateModal 
//                 isOpen={showModal} 
//                 onClose={() => setShowModal(false)} 
//                 formData={editForm}
//                 setFormData={setEditForm}
//                 onSave={handleUpdateSubmit}
//             />
//         </SubAdminLayout>
//     );
// }

// const Section = ({ title, children }) => (
//     <div style={styles.sectionContainer}>
//         <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>{title}</h3></div>
//         <div style={styles.tableWrapper}><div style={{overflowX:'auto'}}>{children}</div></div>
//     </div>
// );

// const styles = {
//     loading: { padding: '100px', textAlign: 'center', fontWeight: '800', color: '#25343F' },
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" },
//     btnGroup: { display: "flex", gap: "10px", alignItems: "center"},
//     welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
//     subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
//     actionBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
//     statsGrid: { display: "flex", gap: "15px", marginBottom: "30px", overflowX: "auto", paddingBottom: "10px" },
//     statCard: { minWidth: "180px", flex: 1, background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F0F2F4" },
//     statLabel: { margin: 0, color: "#7F8C8D", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" },
//     statValue: { margin: "4px 0", fontSize: "24px", fontWeight: "800" },
//     iconCircle: { width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
//     sectionContainer: { marginBottom: "35px" },
//     sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#25343F", margin: 0, borderLeft: "4px solid #FF9B51", paddingLeft: "12px", marginBottom: "15px" },
//     tableWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #F0F2F4" },
//     table: { width: "100%", borderCollapse: "collapse" },
//     tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
//     th: { padding: "14px 18px", textAlign: "left", fontSize: "11px", color: "#626b77", fontWeight: "800", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
//     td: { padding: "14px 18px", fontSize: "13px", color: "#334155" },
//     dateSeparator: { padding: "12px 20px", background: "#f8fafc", color: "#475569", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", borderBottom: '1px solid #e2e8f0' },
//     badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
//     subStatusText: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
//     remarkIcon: { display: 'flex', cursor: 'help', padding: '4px', borderRadius: '4px', background: '#FFF5EB' },
//     editBtn: { border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer' }
// };

// export default SubAdminDashboard;










// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import SubAdminLayout from "../components/SubAdminLayout"; 
// import { apiRequest } from "../../services/api";

// // External Imports
// import StatusUpdateModal from "../../components/StatusUpdateModal";
// import { getStatusStyles } from "../../utils/statusHelper";

// const Icons = {
//     UserPlus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>,
//     Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
//     Client: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
//     Vendor: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><circle cx="18" cy="8" r="3"/><path d="M18 11v5"/></svg>,
//     Pipeline: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
//     Send: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
//     Manage: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
// };

// function SubAdminDashboard() {
//     const navigate = useNavigate();
//     const [stats, setStats] = useState({});
//     const [pipelineData, setPipelineData] = useState([]);
//     const [submittedData, setSubmittedData] = useState([]);
//     const [last7DaysData, setLast7DaysData] = useState([]); 
//     const [loading, setLoading] = useState(true);
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     // Modal & Edit Form States
//     const [showModal, setShowModal] = useState(false);
//     const [selectedCand, setSelectedCand] = useState(null);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });

//     const fetchSubAdminData = async () => {
//         try {
//             const [sData, pData, subData, last7Data] = await Promise.all([
//                 apiRequest("/sub-admin/api/subadmin/dashboard/stats/"),
//                 apiRequest("/sub-admin/api/subadmin/dashboard/pipeline/"),
//                 apiRequest("/sub-admin/api/subadmin/dashboard/today-verified/"),
//                 apiRequest("/sub-admin/api/last-7-days-verified/")
//             ]);
//             setStats(sData);
//             setPipelineData(pData);
//             setSubmittedData(subData);
//             setLast7DaysData(Array.isArray(last7Data) ? last7Data : []);
//         } catch (err) {
//             console.error("Failed to load Sub-Admin data", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => { fetchSubAdminData(); }, []);

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleEditClick = (e, candidate) => {
//         e.stopPropagation();
//         setSelectedCand(candidate);
//         // Modal ko initial values dena zaroori hai
//         setEditForm({ 
//             main_status: candidate.main_status || "SUBMITTED", 
//             sub_status: candidate.sub_status || "NONE", 
//             remark: candidate.remark || "" 
//         });
//         setShowModal(true);
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
//             notify("Status updated successfully!");
//             setShowModal(false);
//             fetchSubAdminData(); // Refresh all tables
//         } catch (err) { 
//             notify("Update failed", "error"); 
//         }
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     if (loading) return <SubAdminLayout><div style={styles.loading}>Loading Dashboard...</div></SubAdminLayout>;

//     return (
//         <SubAdminLayout>
//             {toast.show && (
//                 <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
//                     {toast.msg}
//                 </div>
//             )}

//             <div style={styles.header}>
//                 <div>
//                     <h2 style={styles.welcome}>Team Overview, {stats.user_name || "Sub Admin"}</h2>
//                     <p style={styles.subText}>Management dashboard for tracking team recruitment progress.</p>
//                 </div>
                
//                 <div style={styles.btnGroup}>
//                     <button style={{...styles.actionBtn, background: '#25343F'}} onClick={() => navigate("/sub-admin/team-manage")}>
//                         <Icons.Manage /> Manage Team
//                     </button>
//                     <button style={styles.actionBtn} onClick={() => navigate("/sub-admin/add-user")}>
//                         <Icons.UserPlus /> Add Team Member
//                     </button>
//                 </div>
//             </div>

//             {/* Stats Grid */}
//             <div style={styles.statsGrid}>
//                 {[
//                     { label: "Team Pipeline", val: stats.total_pipelines, icon: <Icons.Pipeline />, col: "#4834D4" },
//                     { label: "Today's Profiles", val: stats.today_profiles, icon: <Icons.UserPlus />, col: "#25343F" },
//                     { label: "Team Submitted", val: stats.today_submitted_profiles, icon: <Icons.Send />, col: "#FF9B51" },
//                     { label: "Total Vendors", val: stats.total_vendors, icon: <Icons.Vendor />, col: "#25343F" },
//                     { label: "Total Clients", val: stats.total_clients, icon: <Icons.Client />, col: "#25343F" },
//                     { label: "Total Talent Pool", val: stats.total_profiles, icon: <Icons.Users />, col: "#25343F" },
//                 ].map((s, i) => (
//                     <div key={i} style={styles.statCard}>
//                         <div><p style={styles.statLabel}>{s.label}</p><h3 style={{...styles.statValue, color: s.col}}>{s.val || 0}</h3></div>
//                         <div style={{...styles.iconCircle, color: s.col, backgroundColor: 'rgba(37,52,63,0.05)'}}>{s.icon}</div>
//                     </div>
//                 ))}
//             </div>

//             <Section title="Active Pipeline (Team)">
//                 <CandidateTable data={pipelineData} navigate={navigate} truncate={truncate} onEdit={handleEditClick} />
//             </Section>

//             <Section title="Today's Verified/Submitted Profiles">
//                 <CandidateTable data={submittedData} navigate={navigate} truncate={truncate} onEdit={handleEditClick} />
//             </Section>

//             <Section title="Last 7 Days Submitted Profiles">
//                 <CandidateTable data={last7DaysData} navigate={navigate} truncate={truncate} onEdit={handleEditClick} />
//             </Section>

//             {/* External Status Update Modal - Fixed Props */}
//             <StatusUpdateModal 
//                 isOpen={showModal} 
//                 onClose={() => setShowModal(false)} 
//                 formData={editForm}
//                 setFormData={setEditForm}
//                 onSave={handleUpdateSubmit}
//             />
//         </SubAdminLayout>
//     );
// }

// const CandidateTable = ({ data, navigate, truncate, onEdit }) => (
//     <table style={styles.table}>
//         <thead style={styles.tableHeader}>
//             <tr>
//                 <th style={styles.th}>Date</th>
//                 <th style={styles.th}>Submitted To & Created By</th>
//                 <th style={styles.th}>Candidate</th>
//                 <th style={styles.th}>Tech</th>
//                 <th style={styles.th}>Exp</th>
//                 <th style={styles.th}>Client</th>
//                 <th style={styles.th}>Vendor & Contact</th>
//                 <th style={styles.th}>Vendor Rate</th>
//                 <th style={styles.th}>Status & Remark</th>
//                 <th style={styles.th}>Action</th>
//             </tr>
//         </thead>
//         <tbody>
//             {data && data.length > 0 ? data.map((c) => {
//                 const statusStyle = getStatusStyles(c.main_status || "SUBMITTED");
//                 return (
//                     <tr 
//                         key={c.id} 
//                         style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} 
//                         onClick={() => navigate(`/sub-admin/candidate/view/${c.id}`)}
//                     >
//                         <td style={styles.td}>
//                             <div style={{fontWeight: "600", fontSize: "13px"}}>{new Date(c.created_at).toLocaleDateString('en-GB')}</div>
//                             <div style={{fontSize: "11px", color: "#7F8C8D"}}>{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
//                         </td>
//                         <td style={styles.td}>
//                             <div style={{fontSize: "13px"}}><span style={{color: "#7F8C8D"}}>To:</span> <b>{c.submitted_to_name || "N/A"}</b></div>
//                             <div style={{fontSize: "11px", marginTop: "4px"}}><span style={{color: "#7F8C8D"}}>By:</span> <b style={{color: "#27AE60", fontWeight: "600"}}>{c.created_by_name || "N/A"}</b></div>
//                         </td>
//                         <td style={styles.td}><div style={{fontWeight: "700"}}>{c.candidate_name}</div></td>
//                         <td style={styles.td}>{c.technology || "N/A"}</td>
//                         <td style={styles.td}>{c.years_of_experience_manual} Yrs</td>
//                         <td style={styles.td}>{c.client_name || c.client_company_name || c.client || "N/A"}</td>
//                         <td style={styles.td}>
//                             <b>{truncate(c.vendor_name || c.vendor, 15)}</b><br/>
//                             <small style={{fontSize: "11px", color: "#7F8C8D"}}>{c.vendor_number || "N/A"}</small>
//                         </td>
//                         <td style={styles.td}>₹{c.vendor_rate} {c.vendor_rate_type || ""}</td>
//                         <td style={styles.td}>
//                             <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
//                                 <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>{c.main_status}</span>
//                                 {c.remark && <div style={styles.remarkIcon} title={c.remark}><Icons.Remark /></div>}
//                             </div>
//                             <small style={{ ...styles.subStatus, color: statusStyle.text, fontWeight: '700' }}>{c.sub_status}</small>
//                         </td>
//                         <td style={styles.td}>
//                             <button style={styles.editBtn} onClick={(e) => onEdit(e, c)}><Icons.Edit /></button>
//                         </td>
//                     </tr>
//                 );
//             }) : (
//                 <tr><td colSpan="10" style={{textAlign: "center", padding: "20px"}}>No candidates found.</td></tr>
//             )}
//         </tbody>
//     </table>
// );

// const Section = ({ title, children }) => (
//     <div style={styles.sectionContainer}>
//         <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>{title}</h3></div>
//         <div style={styles.tableWrapper}><div style={{overflowX:'auto'}}>{children}</div></div>
//     </div>
// );

// const styles = {
//     loading: { padding: '100px', textAlign: 'center', fontWeight: '800', color: '#25343F' },
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" },
//     btnGroup: { display: "flex", gap: "10px", alignItems: "center"},
//     welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
//     subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
//     actionBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
//     statsGrid: { display: "flex", gap: "15px", marginBottom: "30px", overflowX: "auto", paddingBottom: "10px" },
//     statCard: { minWidth: "200px", flex: 1, background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F0F2F4" },
//     statLabel: { margin: 0, color: "#7F8C8D", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" },
//     statValue: { margin: "4px 0", fontSize: "24px", fontWeight: "800" },
//     iconCircle: { width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
//     sectionContainer: { marginBottom: "35px" },
//     sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#25343F", margin: 0, borderLeft: "4px solid #4834D4", paddingLeft: "12px", marginBottom: "15px" },
//     tableWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #F0F2F4" },
//     table: { width: "100%", borderCollapse: "collapse" },
//     tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
//     th: { padding: "14px 18px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
//     td: { padding: "14px 18px", fontSize: "13px", color: "#334155" },
//     badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
//     subStatus: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
//     remarkIcon: { display: 'flex', cursor: 'help', padding: '4px', borderRadius: '4px', background: '#FFF5EB' },
//     editBtn: { border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer' }
// };

// export default SubAdminDashboard;



// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import SubAdminLayout from "../components/SubAdminLayout"; 
// import { apiRequest } from "../../services/api";

// // External Imports (As per your path)
// import StatusUpdateModal from "../../components/StatusUpdateModal";
// import { getStatusStyles } from "../../utils/statusHelper";

// const Icons = {
//     UserPlus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>,
//     Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
//     Client: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
//     Vendor: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><circle cx="18" cy="8" r="3"/><path d="M18 11v5"/></svg>,
//     Pipeline: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
//     Send: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
//     Manage: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
// };

// function SubAdminDashboard() {
//     const navigate = useNavigate();
//     const [stats, setStats] = useState({});
//     const [pipelineData, setPipelineData] = useState([]);
//     const [submittedData, setSubmittedData] = useState([]);
//     const [last7DaysData, setLast7DaysData] = useState([]); // New State
//     const [loading, setLoading] = useState(true);
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     // Modal State
//     const [showModal, setShowModal] = useState(false);
//     const [selectedCand, setSelectedCand] = useState(null);

//     const fetchSubAdminData = async () => {
//         try {
//             // Sequence of 4 APIs as requested
//             const [sData, pData, subData, last7Data] = await Promise.all([
//                 apiRequest("/sub-admin/api/subadmin/dashboard/stats/"),
//                 apiRequest("/sub-admin/api/subadmin/dashboard/pipeline/"),
//                 apiRequest("/sub-admin/api/subadmin/dashboard/today-verified/"),
//                 apiRequest("/sub-admin/api/last-7-days-verified/")
//             ]);
//             setStats(sData);
//             setPipelineData(pData);
//             setSubmittedData(subData);
//             setLast7DaysData(last7Data);
//         } catch (err) {
//             console.error("Failed to load Sub-Admin data", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => { fetchSubAdminData(); }, []);

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleEditClick = (e, candidate) => {
//         e.stopPropagation();
//         setSelectedCand(candidate);
//         setShowModal(true);
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     if (loading) return <SubAdminLayout><div style={styles.loading}>Loading Dashboard...</div></SubAdminLayout>;

//     return (
//         <SubAdminLayout>
//             {toast.show && (
//                 <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
//                     {toast.msg}
//                 </div>
//             )}

//             <div style={styles.header}>
//                 <div>
//                     <h2 style={styles.welcome}>Team Overview, {stats.user_name || "Sub Admin"}</h2>
//                     <p style={styles.subText}>Management dashboard for tracking team recruitment progress.</p>
//                 </div>
                
//                 <div style={styles.btnGroup}>
//                     <button style={{...styles.actionBtn, background: '#25343F'}} onClick={() => navigate("/sub-admin/team-manage")}>
//                         <Icons.Manage /> Manage Team
//                     </button>
//                     <button style={styles.actionBtn} onClick={() => navigate("/sub-admin/add-user")}>
//                         <Icons.UserPlus /> Add Team Member
//                     </button>
//                 </div>
//             </div>

//             {/* Stats Grid */}
//             <div style={styles.statsGrid}>
//                 {[
//                     { label: "Team Pipeline", val: stats.total_pipelines, icon: <Icons.Pipeline />, col: "#4834D4" },
//                     { label: "Today's Profiles", val: stats.today_profiles, icon: <Icons.UserPlus />, col: "#25343F" },
//                     { label: "Team Submitted", val: stats.today_submitted_profiles, icon: <Icons.Send />, col: "#FF9B51" },
//                     { label: "Total Vendors", val: stats.total_vendors, icon: <Icons.Vendor />, col: "#25343F" },
//                     { label: "Total Clients", val: stats.total_clients, icon: <Icons.Client />, col: "#25343F" },
//                     { label: "Total Talent Pool", val: stats.total_profiles, icon: <Icons.Users />, col: "#25343F" },
//                 ].map((s, i) => (
//                     <div key={i} style={styles.statCard}>
//                         <div><p style={styles.statLabel}>{s.label}</p><h3 style={{...styles.statValue, color: s.col}}>{s.val || 0}</h3></div>
//                         <div style={{...styles.iconCircle, color: s.col, backgroundColor: 'rgba(37,52,63,0.05)'}}>{s.icon}</div>
//                     </div>
//                 ))}
//             </div>

//             <Section title="Active Pipeline (Team)">
//                 <CandidateTable data={pipelineData} navigate={navigate} truncate={truncate} onEdit={handleEditClick} />
//             </Section>

//             <Section title="Today's Verified/Submitted Profiles">
//                 <CandidateTable data={submittedData} navigate={navigate} truncate={truncate} onEdit={handleEditClick} />
//             </Section>

//             {/* New Section: Last 7 Days */}
//             <Section title="Last 7 Days Submitted Profiles">
//                 <CandidateTable data={last7DaysData} navigate={navigate} truncate={truncate} onEdit={handleEditClick} />
//             </Section>

//             {/* External Status Update Modal */}
//             {showModal && (
//                 <StatusUpdateModal 
//                     isOpen={showModal}  // 'show' ki jagah 'isOpen'
//                     onClose={() => setShowModal(false)} 
//                     formData={editForm} // formData pass karna zaroori hai
//                     setFormData={setEditForm} // setFormData function pass karna zaroori hai
//                     onSave={handleUpdateSubmit} // 'onUpdate' ki jagah 'onSave'
//                 />
//             )}
//         </SubAdminLayout>
//     );
// }

// const CandidateTable = ({ data, navigate, truncate, onEdit }) => (
//     <table style={styles.table}>
//         <thead style={styles.tableHeader}>
//             <tr>
//                 <th style={styles.th}>Date</th>
//                 <th style={styles.th}>Submitted To & Created By</th>
//                 <th style={styles.th}>Candidate</th>
//                 <th style={styles.th}>Tech</th>
//                 <th style={styles.th}>Exp</th>
//                 <th style={styles.th}>Client</th>
//                 <th style={styles.th}>Vendor & Contact</th>
//                 <th style={styles.th}>Vendor Rate</th>
//                 <th style={styles.th}>Status & Remark</th>
//                 <th style={styles.th}>Action</th>
//             </tr>
//         </thead>
//         <tbody>
//             {data && data.length > 0 ? data.map((c) => {
//                 // Using External Helper for dynamic styling
//                 const statusStyle = getStatusStyles(c.main_status);

//                 return (
//                     <tr 
//                         key={c.id} 
//                         style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} 
//                         onClick={() => navigate(`/sub-admin/candidate/view/${c.id}`)}
//                     >
//                         <td style={styles.td}>
//                             <div style={{fontWeight: "600", fontSize: "13px"}}>
//                                 {new Date(c.created_at).toLocaleDateString('en-GB')}
//                             </div>
//                             <div style={{fontSize: "11px", color: "#7F8C8D"}}>
//                                 {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
//                             </div>
//                         </td>

//                         <td style={styles.td}>
//                             <div style={{fontSize: "13px"}}>
//                                 <span style={{color: "#7F8C8D"}}>To:</span> <b>{c.submitted_to_name || "N/A"}</b>
//                             </div>
//                             <div style={{fontSize: "11px", marginTop: "4px"}}>
//                                 <span style={{color: "#7F8C8D"}}>By:</span> <b style={{color: "#27AE60", fontWeight: "600"}}>{c.created_by_name || "N/A"}</b>
//                             </div>
//                         </td>

//                         <td style={styles.td}>
//                             <div style={{fontWeight: "700"}}>{c.candidate_name}</div>
//                         </td>
                        
//                         <td style={styles.td}>{c.technology || "N/A"}</td>
//                         <td style={styles.td}>{c.years_of_experience_manual} Yrs</td>
//                         <td style={styles.td}>{c.client || "N/A"}</td>
//                         <td style={styles.td}>
//                             <b>{truncate(c.vendor, 15)}</b><br/>
//                             <small style={{fontSize: "11px", color: "#7F8C8D"}}>{c.vendor_number || "N/A"}</small>
//                         </td>
//                         <td style={styles.td}>₹{c.vendor_rate} {c.vendor_rate_type || ""}</td>
//                         <td style={styles.td}>
//                             <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
//                                 <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>
//                                     {c.main_status}
//                                 </span>
//                                 {c.remark && <div style={styles.remarkIcon} title={c.remark}><Icons.Remark /></div>}
//                             </div>
//                             <small style={{ ...styles.subStatus, color: statusStyle.text, fontWeight: '700' }}>
//                                 {c.sub_status}
//                             </small>
//                         </td>
//                         <td style={styles.td}>
//                             <button style={styles.editBtn} onClick={(e) => onEdit(e, c)}>
//                                 <Icons.Edit />
//                             </button>
//                         </td>
//                     </tr>
//                 );
//             }) : (
//                 <tr><td colSpan="10" style={{textAlign: "center", padding: "20px"}}>No candidates found.</td></tr>
//             )}
//         </tbody>
//     </table>
// );

// const Section = ({ title, children }) => (
//     <div style={styles.sectionContainer}>
//         <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>{title}</h3></div>
//         <div style={styles.tableWrapper}><div style={{overflowX:'auto'}}>{children}</div></div>
//     </div>
// );

// const styles = {
//     loading: { padding: '100px', textAlign: 'center', fontWeight: '800', color: '#25343F' },
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" },
//     btnGroup: { display: "flex", gap: "10px", alignItems: "center"},
//     welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
//     subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
//     actionBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
//     statsGrid: { display: "flex", gap: "15px", marginBottom: "30px", overflowX: "auto", paddingBottom: "10px" },
//     statCard: { minWidth: "200px", flex: 1, background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F0F2F4" },
//     statLabel: { margin: 0, color: "#7F8C8D", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" },
//     statValue: { margin: "4px 0", fontSize: "24px", fontWeight: "800" },
//     iconCircle: { width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
//     sectionContainer: { marginBottom: "35px" },
//     sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#25343F", margin: 0, borderLeft: "4px solid #4834D4", paddingLeft: "12px", marginBottom: "15px" },
//     tableWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #F0F2F4" },
//     table: { width: "100%", borderCollapse: "collapse" },
//     tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
//     th: { padding: "14px 18px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
//     td: { padding: "14px 18px", fontSize: "13px", color: "#334155" },
//     badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
//     subStatus: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
//     remarkIcon: { display: 'flex', cursor: 'help', padding: '4px', borderRadius: '4px', background: '#FFF5EB' },
//     editBtn: { border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer' }
// };

// export default SubAdminDashboard;







// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import SubAdminLayout from "../components/SubAdminLayout"; 
// import { apiRequest } from "../../services/api";

// const Icons = {
//     UserPlus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>,
//     Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
//     Client: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
//     Vendor: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><circle cx="18" cy="8" r="3"/><path d="M18 11v5"/></svg>,
//     Pipeline: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
//     Send: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
//     Manage: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
// };

//     const getStatusStyles = (status) => {
//             switch (status) {
//                 case "SUBMITTED": return { bg: "#E8F4FD", text: "#1976D2" }; 
//                 case "SCREENING": return { bg: "#ffee005e", text: "#383333" }; 
//                 case "L1": return { bg: "#6365f146", text: "#1976D2" };       
//                 case "L2": return { bg: "#D6DBF0", text: "#101933" };       
//                 case "L3": return { bg: "#31df39a8", text: "#183f1a" };  
//                 case "OTHER": return { bg: "#00ff0da9", text: "#183f1a" };       
//                 case "OFFERED": return { bg: "#FFF9C4", text: "#F57F17" };   
//                 case "ONBORD": return { bg: "#C8E6C9", text: "#1B5E20" };    
//                 case "ON_HOLD": return { bg: "#FFF3E0", text: "#E65100" };   
//                 case "REJECTED": return { bg: "#FFEBEE", text: "#C62828" };  
//                 case "WITHDRAWN": return { bg: "#ECEFF1", text: "#455A64" }; 
//                 default: return { bg: "#FFFFFF", text: "#334155" };         
//             }
//         };


// function SubAdminDashboard() {
//     const navigate = useNavigate();
//     const [stats, setStats] = useState({});
//     const [pipelineData, setPipelineData] = useState([]);
//     const [submittedData, setSubmittedData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     // Modal States
//     const [showModal, setShowModal] = useState(false);
//     const [selectedCand, setSelectedCand] = useState(null);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });

//     const fetchSubAdminData = async () => {
//         try {
//             const [sData, pData, subData] = await Promise.all([
//                 apiRequest("/sub-admin/api/subadmin/dashboard/stats/"),
//                 apiRequest("/sub-admin/api/subadmin/dashboard/pipeline/"),
//                 apiRequest("/sub-admin/api/subadmin/dashboard/today-verified/")
//             ]);
//             setStats(sData);
//             setPipelineData(pData);
//             setSubmittedData(subData);
//         } catch (err) {
//             console.error("Failed to load Sub-Admin data", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => { fetchSubAdminData(); }, []);

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleEditClick = (e, candidate) => {
//         e.stopPropagation();
//         setSelectedCand(candidate);
//         setEditForm({ 
//             main_status: candidate.main_status, 
//             sub_status: candidate.sub_status, 
//             remark: candidate.remark || "" 
//         });
//         setShowModal(true);
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             // Note: URL might need /sub-admin/ prefix depending on your Django routing
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
//             notify("Team member profile updated!");
//             setShowModal(false);
//             fetchSubAdminData();
//         } catch (err) {
//             notify("Update failed", "error");
//         }
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     if (loading) return <SubAdminLayout><div style={styles.loading}>Loading Dashboard...</div></SubAdminLayout>;

//     return (
//         <SubAdminLayout>
//             {toast.show && (
//                 <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
//                     {toast.msg}
//                 </div>
//             )}

//             <div style={styles.header}>
//                 <div>
//                     <h2 style={styles.welcome}>Team Overview, {stats.user_name || "Sub Admin"}</h2>
//                     <p style={styles.subText}>Management dashboard for tracking team recruitment progress.</p>
//                 </div>
                
//                 <div style={styles.btnGroup}>
//                     <button style={{...styles.actionBtn, background: '#25343F'}} onClick={() => navigate("/sub-admin/team-manage")}>
//                         <Icons.Manage /> Manage Team
//                     </button>
//                     <button style={styles.actionBtn} onClick={() => navigate("/sub-admin/add-user")}>
//                         <Icons.UserPlus /> Add Team Member
//                     </button>
//                 </div>
//             </div>

//             {/* Stats Grid */}
//             <div style={styles.statsGrid}>
//                 {[
//                     { label: "Team Pipeline", val: stats.total_pipelines, icon: <Icons.Pipeline />, col: "#4834D4" },
//                     { label: "Today's Profiles", val: stats.today_profiles, icon: <Icons.UserPlus />, col: "#25343F" },
//                     { label: "Team Submitted", val: stats.today_submitted_profiles, icon: <Icons.Send />, col: "#FF9B51" },
//                     { label: "Total Vendors", val: stats.total_vendors, icon: <Icons.Vendor />, col: "#25343F" },
//                     { label: "Total Clients", val: stats.total_clients, icon: <Icons.Client />, col: "#25343F" },
//                     { label: "Total Talent Pool", val: stats.total_profiles, icon: <Icons.Users />, col: "#25343F" },
//                 ].map((s, i) => (
//                     <div key={i} style={styles.statCard}>
//                         <div><p style={styles.statLabel}>{s.label}</p><h3 style={{...styles.statValue, color: s.col}}>{s.val || 0}</h3></div>
//                         <div style={{...styles.iconCircle, color: s.col, backgroundColor: 'rgba(37,52,63,0.05)'}}>{s.icon}</div>
//                     </div>
//                 ))}
//             </div>

//             <Section title="Active Pipeline (Team)">
//                 <CandidateTable data={pipelineData} navigate={navigate} truncate={truncate} onEdit={handleEditClick} />
//             </Section>

//             <Section title="Today's Verified/Submitted Profiles">
//                 <CandidateTable data={submittedData} navigate={navigate} truncate={truncate} onEdit={handleEditClick} />
//             </Section>

//             {/* Edit Modal */}
//             {showModal && (
//                 <div style={styles.modalOverlay}>
//                     <div style={styles.modalContent}>
//                         <h3 style={{color:'#25343F', marginBottom:'20px'}}>Review Candidate Status</h3>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.modalLabel}>Main Status</label>
//                             <select style={styles.select} value={editForm.main_status} onChange={e => setEditForm({...editForm, main_status: e.target.value})}>
//                                 <option value="SUBMITTED">Submitted</option>
//                                 <option value="SCREENING">Screening</option>
//                                 <option value="L1">L1</option>
//                                 <option value="L2">L2</option>
//                                 <option value="L3">L3</option>
//                                 <option value="OTHER">Other</option>
//                                 <option value="OFFERED">Offered</option>
//                                 <option value="ONBORD">Onbord</option>
//                                 <option value="ON_HOLD">On Hold</option>
//                                 <option value="REJECTED">Rejected</option>
//                                 <option value="WITHDRAWN">Withdrawn</option>
//                             </select>
//                         </div>

//                         <div style={styles.inputGroup}>
//                             <label style={styles.modalLabel}>Sub Status</label>
//                             <select style={styles.select} value={editForm.sub_status} onChange={e => setEditForm({...editForm, sub_status: e.target.value})}>
//                                 <option value="NONE">None</option>
//                                 <option value="SCHEDULED">Scheduled</option>
//                                 <option value="COMPLETED">Completed</option>
//                                 <option value="FEEDBACK_PENDING">Feedback Pending</option>
//                                 <option value="CLEARED">Cleared</option>
//                                 <option value="REJECTED">Rejected</option>
//                                 <option value="ON_HOLD">On Hold</option>
//                                 <option value="POSTPONED">Postponed</option>    
//                                 <option value="NO_SHOW">No Show</option>
                                
//                                 <option value="INTERVIEW_PENDING">Interview Pending</option>
//                             </select>
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.modalLabel}>Remark (Sub-Admin Notes)</label>
//                             <textarea style={styles.textarea} value={editForm.remark} onChange={e => setEditForm({...editForm, remark: e.target.value})} placeholder="Internal team notes..." />
//                         </div>
//                         <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
//                             <button style={styles.saveBtn} onClick={handleUpdateSubmit}>Save Review</button>
//                             <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </SubAdminLayout>
//     );
// }

// const CandidateTable = ({ data, navigate, truncate, onEdit }) => (
//     <table style={styles.table}>
//         <thead style={styles.tableHeader}>
//             <tr>
//                 {/* 1. Date Field */}
//                 <th style={styles.th}>Date</th>
//                 {/* 2. Team Info Field */}
//                 <th style={styles.th}>Submitted To & Created By</th>
//                 <th style={styles.th}>Candidate</th>
//                 <th style={styles.th}>Tech</th>
//                 <th style={styles.th}>Exp</th>
//                 <th style={styles.th}>Client</th>
//                 <th style={styles.th}>Vendor & Contact</th>
//                 <th style={styles.th}>Vendor Rate</th>
//                 <th style={styles.th}>Status & Remark</th>
//                 <th style={styles.th}>Action</th>
//             </tr>
//         </thead>
        

//             <tbody>
//                 {data && data.length > 0 ? data.map((c) => {
//                     // Status ke base par style nikal rahe hain
//                     const statusStyle = getStatusStyles(c.main_status);

//                     return (
//                         <tr 
//                             key={c.id} 
//                             // Row ka background color dynamic kar diya
//                             style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} 
//                             onClick={() => navigate(`/sub-admin/candidate/view/${c.id}`)}
//                         >
                            
//                             {/* Date Logic */}
//                             <td style={styles.td}>
//                                 <div style={{fontWeight: "600", fontSize: "13px"}}>
//                                     {new Date(c.created_at).toLocaleDateString('en-GB')}
//                                 </div>
//                                 <div style={{fontSize: "11px", color: "#7F8C8D"}}>
//                                     {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
//                                 </div>
//                             </td>

//                             {/* Team Info */}
//                             <td style={styles.td}>
//                                 <div style={{fontSize: "13px"}}>
//                                     <span style={{color: "#7F8C8D"}}>To:</span> <b>{c.submitted_to_name || "N/A"}</b>
//                                 </div>
//                                 <div style={{fontSize: "11px", marginTop: "4px"}}>
//                                     <span style={{color: "#7F8C8D"}}>By:</span> <b style={{color: "#27AE60", fontWeight: "600"}}>{c.created_by_name || "N/A"}</b>
//                                 </div>
//                             </td>

//                             <td style={styles.td}>
//                                 <div style={{fontWeight: "700"}}>{c.candidate_name}</div>
//                             </td>
                            
//                             <td style={styles.td}>{c.technology || "N/A"}</td>
//                             <td style={styles.td}>{c.years_of_experience_manual} Yrs</td>
//                             <td style={styles.td}>{c.client || "N/A"}</td>
//                             <td style={styles.td}>
//                                 <b>{truncate(c.vendor, 15)}</b><br/>
//                                 <small style={{fontSize: "11px", color: "#7F8C8D"}}>{c.vendor_number || "N/A"}</small>
//                             </td>
//                             <td style={styles.td}>₹{c.vendor_rate} {c.vendor_rate_type || ""}</td>
//                             <td style={styles.td}>
//                                 <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
//                                     {/* Badge ka text color status ke hisaab se */}
//                                     <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>
//                                         {c.main_status}
//                                     </span>
//                                     {c.remark && <div style={styles.remarkIcon} title={c.remark}><Icons.Remark /></div>}
//                                 </div>
//                                 {/* Sub status ka color change kiya */}
//                                 <small style={{ ...styles.subStatus, color: statusStyle.text, fontWeight: '700' }}>
//                                     {c.sub_status}
//                                 </small>
//                             </td>
//                             <td style={styles.td}>
//                                 <button style={styles.editBtn} onClick={(e) => onEdit(e, c)}>
//                                     <Icons.Edit />
//                                 </button>
//                             </td>
//                         </tr>
//                     );
//                 }) : (
//                     <tr><td colSpan="10" style={{textAlign: "center", padding: "20px"}}>No candidates found.</td></tr>
//                 )}
//             </tbody>
//     </table>
// );


// const Section = ({ title, children }) => (
//     <div style={styles.sectionContainer}>
//         <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>{title}</h3></div>
//         <div style={styles.tableWrapper}><div style={{overflowX:'auto'}}>{children}</div></div>
//     </div>
// );

// const styles = {
//     loading: { padding: '100px', textAlign: 'center', fontWeight: '800', color: '#25343F' },
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" },
//     btnGroup: { display: "flex", gap: "10px", alignItems: "center"},
//     welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
//     subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
//     actionBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
//     statsGrid: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "15px", marginBottom: "30px", overflowX: "auto", paddingBottom: "10px" },
//     statCard: { background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F0F2F4" },
//     statLabel: { margin: 0, color: "#7F8C8D", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" },
//     statValue: { margin: "4px 0", fontSize: "24px", fontWeight: "800" },
//     iconCircle: { width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
//     sectionContainer: { marginBottom: "35px" },
//     sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#25343F", margin: 0, borderLeft: "4px solid #4834D4", paddingLeft: "12px" },
//     tableWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #F0F2F4" },
//     table: { width: "100%", borderCollapse: "collapse" },
//     tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
//     th: { padding: "14px 18px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
//     td: { padding: "14px 18px", fontSize: "13px", color: "#334155" },
//     badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
//     subStatus: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
//     remarkIcon: { display: 'flex', cursor: 'help', padding: '4px', borderRadius: '4px', background: '#FFF5EB' },
//     editBtn: { border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
//     modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' },
//     modalContent: { background: '#fff', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
//     inputGroup: { marginBottom: '15px' },
//     modalLabel: { fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '5px', textTransform: 'uppercase' },
//     select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' },
//     textarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', height: '80px', resize: 'none' },
//     saveBtn: { flex: 1, background: '#FF9B51', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
//     cancelBtn: { flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
//     viewBtn: { background: '#25343F', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: "700" }
// };

// export default SubAdminDashboard;





