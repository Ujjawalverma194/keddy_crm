import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BaseLayout from "../components/emp_base";
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

const getRequirementStatusStyle = (status) => {
    switch(status) {
        case 'HOT': return { background: '#FEF2F2', color: '#DC2626', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block' };
        case 'WARM': return { background: '#FFFBEB', color: '#F59E0B', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block' };
        case 'COLD': return { background: '#F1F5F9', color: '#64748B', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block' };
        default: return { background: '#F1F5F9', color: '#64748B', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block' };
    }
};

function EmployeeDashboard() {
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
    
    // New states for Active Pipeline Requirements
    const [activeRequirements, setActiveRequirements] = useState([]);
    const [requirementsLoading, setRequirementsLoading] = useState(true);
    const [requirementsSearch, setRequirementsSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedJd, setSelectedJd] = useState(null);

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
    
    // Fetch Active Requirements
    const fetchActiveRequirements = async (search, status) => {
        setRequirementsLoading(true);
        try {
            let url = `/jd-mapping/my-jds/?type=both&search=${search}`;
            if (status) {
                url += `&status=${status}`;
            }
            const response = await apiRequest(url, "GET");
            if (response && response.success) {
                setActiveRequirements(response.results || []);
            }
        } catch (err) {
            console.error("Error fetching active requirements:", err);
        } finally {
            setRequirementsLoading(false);
        }
    };

    useEffect(() => { fetchAllData(); }, []);
    
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchActiveRequirements(requirementsSearch, statusFilter);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [requirementsSearch, statusFilter]);

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
    
    const truncateText = (text, maxLength) => {
        if (!text) return "—";
        return text.length > maxLength ? text.substring(0, maxLength).trim() + "..." : text;
    };
    
    const renderAssignedTeam = (assignments) => {
        if (!assignments || assignments.length === 0) {
            return <div style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>Not Assigned</div>;
        }
        const displayNames = assignments.slice(0, 2).map(a => a.name?.split(' ')[0] || 'User').join(', ');
        const remaining = assignments.length > 2 ? assignments.length - 2 : 0;
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "12px", color: "#0F172A", background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "3px 8px", borderRadius: "6px", fontWeight: "600" }}>{displayNames}</span>
                {remaining > 0 && <span style={{ fontSize: "10px", background: "#1E293B", color: "#fff", padding: "2px 5px", borderRadius: "4px", fontWeight: "700" }}>+{remaining}</span>}
            </div>
        );
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

            {/* Active Pipeline Requirements Section - NEW */}
            <div style={styles.sectionContainer}>
                <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>Active Pipeline Requirements</h3>
                </div>
                <div style={{ ...styles.topBar, marginBottom: "15px" }}>
                    <div style={styles.filterGroup}>
                        <button onClick={() => setStatusFilter("")} style={!statusFilter ? styles.activeFilterBtn : styles.filterBtn}>All</button>
                        <button onClick={() => setStatusFilter("HOT")} style={statusFilter === "HOT" ? styles.activeFilterBtn : styles.filterBtn}>HOT</button>
                        <button onClick={() => setStatusFilter("WARM")} style={statusFilter === "WARM" ? styles.activeFilterBtn : styles.filterBtn}>WARM</button>
                        <button onClick={() => setStatusFilter("COLD")} style={statusFilter === "COLD" ? styles.activeFilterBtn : styles.filterBtn}>COLD</button>
                    </div>
                    <div style={styles.searchContainer}>
                        <input 
                            type="text" 
                            placeholder="Search by ID, Title, Client..." 
                            style={styles.searchInput}
                            value={requirementsSearch}
                            onChange={(e) => setRequirementsSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div style={styles.tableWrapper}>
                    <div style={{overflowX:'auto'}}>
                        <table style={styles.table}>
                            <thead style={styles.tableHeader}>
                                <tr>
                                    <th style={styles.th}>ID & Date</th>
                                    <th style={styles.th}>Title & Client</th>
                                    <th style={styles.th}>Exp / Rate</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Budget Range</th>
                                    <th style={styles.th}>JD Description</th>
                                    <th style={styles.th}>Stats / Team</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requirementsLoading ? (
                                    <tr><td colSpan="8" style={styles.loadingTd}>Loading requirements...</td></tr>
                                ) : activeRequirements.length > 0 ? (
                                    activeRequirements.map((req) => (
                                        <tr key={req.id} style={styles.tableRow}>
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
                                                <span style={getRequirementStatusStyle(req.status)}>{req.status || "—"}</span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.infoText} title={req.vendor_budget_range}>{truncateText(req.vendor_budget_range, 20) || "—"}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <div 
                                                    style={styles.jdTruncate} 
                                                    onClick={() => setSelectedJd({ title: req.title, desc: req.jd_description })}
                                                >
                                                    {truncateText(req.jd_description || "No description provided.", 15)}
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.statLine}>Submissions: <strong>{req.total_submissions || 0}</strong></div>
                                                {renderAssignedTeam(req.assigned_to_details)}
                                            </td>
                                            <td style={styles.actionTd}>
                                                <div style={styles.actionGroup}>
                                                    <button style={styles.viewBtn} onClick={() => navigate(`/employee/requirement/view/${req.id}`)}>View</button>
                                                    <button style={styles.editBtnReq} onClick={() => navigate(`/employee/requirement/edit/${req.id}`)}>Update</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="8" style={styles.loadingTd}>No requirements found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Section title="Active Pipeline Candidates"><table style={styles.table}><thead style={styles.tableHeader}><tr><th style={styles.th}>To/By</th><th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th><th style={styles.th}>Client</th><th style={styles.th}>Vendor</th><th style={styles.th}>Rate</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead><tbody>{renderGroupedRows(pipelineCandidates)}</tbody></table></Section>
            <Section title="Submitted Profiles Table"><table style={styles.table}><thead style={styles.tableHeader}><tr><th style={styles.th}>Team</th><th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th><th style={styles.th}>Client</th><th style={styles.th}>Vendor</th><th style={styles.th}>Rates</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead><tbody>{renderGroupedRows(verifiedCandidates)}</tbody></table></Section>
            <Section title="Today's Team Submissions"><table style={styles.table}><thead style={styles.tableHeader}><tr><th style={styles.th}>By</th><th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th><th style={styles.th}>Client</th><th style={styles.th}>Vendor</th><th style={styles.th}>Rate</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead><tbody>{renderGroupedRows(teamSubmissions, false, true)}</tbody></table></Section>
            <Section title="Today's New Profiles"><table style={styles.table}><thead style={styles.tableHeader}><tr><th style={styles.th}>To/By</th><th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th><th style={styles.th}>Client</th><th style={styles.th}>Vendor</th><th style={styles.th}>Rate</th><th style={styles.th}>Action</th></tr></thead><tbody>{renderGroupedRows(todayCandidates, true, false)}</tbody></table></Section>

            {/* JD Description Modal */}
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
    submitBtn: { background: '#25343F', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '11px' },
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", flexWrap: "wrap" },
    filterGroup: { display: "flex", gap: "10px", background: "#F1F5F9", padding: "4px", borderRadius: "8px" },
    filterBtn: { background: "transparent", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", color: "#475569", cursor: "pointer", transition: "0.2s" },
    activeFilterBtn: { background: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", color: "#1E293B", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", transition: "0.2s" },
    searchContainer: { flex: "1 1 250px", maxWidth: "400px" },
    searchInput: { width: "100%", padding: "10px 15px", borderRadius: "10px", border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box" },
    reqIdBadge: { background: "#EFF6FF", color: "#2563EB", padding: "4px 8px", borderRadius: "5px", fontWeight: "700", fontSize: "12px", display: "inline-block", marginBottom: "4px" },
    dateText: { fontSize: "11px", color: "#94A3B8", fontWeight: "600", paddingLeft: "2px" },
    primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
    rateText: { fontSize: "12px", color: "#10B981", fontWeight: "700" },
    infoText: { fontSize: "13px", fontWeight: "600" },
    jdTruncate: { fontSize: "13px", color: "#475569", lineHeight: "1.5", cursor: "pointer", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" },
    statLine: { fontSize: "12px", color: "#334155", marginBottom: "6px" },
    actionTd: { textAlign: "center", padding: "12px 18px" },
    actionGroup: { display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" },
    viewBtn: { background: "#F8FAFC", color: "#0F172A", border: "1px solid #CBD5E1", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700", transition: "0.2s" },
    editBtnReq: { background: "#1E293B", color: "#fff", border: "none", padding: "7px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700", transition: "0.2s" },
    loadingTd: { textAlign: "center", padding: "40px", color: "#64748B" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modalContent: { background: "#fff", borderRadius: "12px", width: "90%", maxWidth: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
    modalHeader: { padding: "15px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" },
    modalTitle: { margin: 0, fontSize: "16px", color: "#1E293B", fontWeight: "800" },
    closeBtn: { background: "transparent", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748B" },
    modalBody: { padding: "20px", overflowY: "auto", fontSize: "14px", lineHeight: "1.6", color: "#334155", whiteSpace: "pre-wrap" }
};

export default EmployeeDashboard;




// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import BaseLayout from "../components/emp_base";
// import { apiRequest } from "../../services/api";
// import StatusUpdateModal from "../../components/StatusUpdateModal";
// import SubmissionModal from "../../components/SubmissionModal";
// import { getStatusStyles } from "../../utils/statusHelper";

// const Icons = {
//     UserPlus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>,
//     Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
//     Client: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
//     Vendor: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><circle cx="18" cy="8" r="3"/><path d="M18 11v5"/></svg>,
//     Pipeline: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
//     Send: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
//     Requirement: () => (
//         <svg 
//     width="18" 
//     height="18" 
//     viewBox="0 0 24 24" 
//     fill="none" 
//     stroke="currentColor" 
//     strokeWidth="2.5" 
//     strokeLinecap="round" 
//     strokeLinejoin="round"
// >
//     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
//     <polyline points="14 2 14 8 20 8" />
//     <line x1="12" y1="18" x2="12" y2="12" />
//     <line x1="9" y1="15" x2="15" y2="15" />
// </svg>),
// };


// function EmployeeDashboard() {
//     const navigate = useNavigate();
//     const [stats, setStats] = useState({});
//     const [todayCandidates, setTodayCandidates] = useState([]);
//     const [verifiedCandidates, setVerifiedCandidates] = useState([]);
//     const [pipelineCandidates, setPipelineCandidates] = useState([]);
//     const [teamSubmissions, setTeamSubmissions] = useState([]);
//     const [last7Verified, setLast7Verified] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });
//     const [showModal, setShowModal] = useState(false);
//     const [showSubmitModal, setShowSubmitModal] = useState(false);
//     const [selectedCand, setSelectedCand] = useState(null);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });
//     const [submissionModalProps, setSubmissionModalProps] = useState({});

//     const fetchAllData = async () => {
//         try {
//             const [sData, tData, vData, pData, teamData, last7Data] = await Promise.all([
//                 apiRequest("/employee-portal/dashboard/stats/"),
//                 apiRequest("/employee-portal/dashboard/today-candidates/"),
//                 apiRequest("/employee-portal/dashboard/today-verified-candidates/"),
//                 apiRequest("/employee-portal/dashboard/active-pipeline-candidates/"),
//                 apiRequest("/employee-portal/dashboard/team/today-submissions/"),
//                 apiRequest("/employee-portal/dashboard/last-7-days-verified/")
//             ]);
//             setStats(sData); setTodayCandidates(tData); setVerifiedCandidates(vData); setPipelineCandidates(pData); setTeamSubmissions(teamData); setLast7Verified(Array.isArray(last7Data) ? last7Data : []);
//         } catch (err) { notify("Failed to load dashboard data", "error"); }
//         finally { setLoading(false); }
//     };

//     useEffect(() => { fetchAllData(); }, []);

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleEditClick = (e, candidate) => {
//         e.stopPropagation(); setSelectedCand(candidate);
//         setEditForm({ main_status: candidate.main_status, sub_status: candidate.sub_status, remark: candidate.remark || "" });
//         setShowModal(true);
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
//             notify("Status updated!"); setShowModal(false); fetchAllData();
//         } catch (err) { notify("Update failed", "error"); }
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     const handleOpenSubmitModal = (e, candidate, isTeamSubmission) => {
//         e.stopPropagation();
//         setSelectedCand(candidate);
//         if (isTeamSubmission) {
//             setSubmissionModalProps({ initialSubmitType: "CLIENT", hideInternalOption: true });
//         } else {
//             setSubmissionModalProps({});
//         }
//         setShowSubmitModal(true);
//     };

//     const renderRow = (c, i, showSubmitBtn = false, showSubmitToClientBtn = false) => {
//         const statusStyle = getStatusStyles(c.main_status || 'SUBMITTED');
        
//         return (
//             <tr key={c.id || i} style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/employee/candidate/view/${c.id}`)}>
//                 <td style={styles.td}>
//                     <div>To: <b>{c.submitted_to_name || '-'}</b></div>
//                     <div>By: <b style={{color: "#27AE60"}}>{c.created_by_name || ''}</b></div>
//                 </td>
//                 <td style={styles.td}><b>{c.candidate_name}</b></td>
//                 <td style={styles.td}>{truncate(c.technology, 30)}</td>
//                 <td style={styles.td}>{c.years_of_experience_manual || '0'} Yrs</td>
//                 <td style={styles.td}>{c.client_name || ''}
//                     <small style={styles.subStatusText}>{c.client_company_name || '-'}</small>
//                 </td>
//                 <td style={styles.td}>
//                     <b>{truncate(c.vendor_name || c.vendor_company_name || c.vendor, 15)}</b><br/>
//                     <small style={styles.subStatusText}>{c.vendor_company_name || '-'}</small>
//                     <small style={styles.subStatusText}>{c.vendor_number || ''}</small>
//                 </td>
//                 <td style={styles.td}>
//                    Vendor: ₹{c.vendor_rate} {c.vendor_rate_type || ''}
                    
//                     <br/><small style={styles.subStatusText}>Client: ₹{c.client_rate} {c.vendor_rate_type  || '-'}</small>
//                 </td>
//                 <td style={styles.td}>
//                     <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
//                         <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>{c.main_status}</span>
//                         {c.remark && <div style={styles.remarkIcon} title={c.remark}><Icons.Remark /></div>}
//                     </div>
//                     <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: '700' }}>{c.sub_status}</small>
//                 </td>
//                 <td style={styles.td}>
//                     <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
//                         <button style={styles.editBtn} onClick={(e) => handleEditClick(e, c)}><Icons.Edit /></button>
                        
//                         {showSubmitBtn && (
//                             c.verification_status ? (
//                                 c.client_name || c.client ? (
//                                     <span style={{color:'#27AE60', fontWeight:'700', fontSize:'11px', whiteSpace:'nowrap'}}>✓ Client Submitted</span>
//                                 ) : (
//                                     <span style={{color:'#27AE60', fontWeight:'700', fontSize:'11px', whiteSpace:'nowrap'}}>✓ Internal Submitted</span>
//                                 )
//                             ) : (
//                                 <button style={styles.submitBtn} onClick={(e) => handleOpenSubmitModal(e, c, false)}>Submit</button>
//                             )
//                         )}

//                         {showSubmitToClientBtn && (
//                             c.client_name || c.client ? (
//                                 <span style={{color:'#27AE60', fontWeight:'700', fontSize:'11px', whiteSpace:'nowrap'}}>✓ Client Submitted</span>
//                             ) : (
//                                 <button style={styles.submitBtn} onClick={(e) => handleOpenSubmitModal(e, c, true)}>Submit to Client</button>
//                             )
//                         )}
//                     </div>
//                 </td>
//             </tr>
//         );
//     };

//     const renderGroupedRows = (list = [], showSubmit = false, showSubmitClient = false) => {
//         let lastDate = "";
//         return list.map((c, i) => {
//             const currentDate = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
//             let dateSeparator = currentDate !== lastDate ? (
//                 <tr key={`date-sep-${i}`}><td colSpan="9" style={styles.dateSeparator}>{currentDate}</td></tr>
//             ) : null;
//             lastDate = currentDate;
//             return <React.Fragment key={c.id || i}>{dateSeparator}{renderRow(c, i, showSubmit, showSubmitClient)}</React.Fragment>;
//         });
//     };

//     if (loading) return <BaseLayout><div style={styles.loading}>Loading Dashboard...</div></BaseLayout>;

//     return (
//         <BaseLayout>
//             {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>{toast.msg}</div>}

//             <div style={styles.header}>
//                 <div><h2 style={styles.welcome}>Welcome, {stats.user_name || "Recruiter"}</h2><p style={styles.subText}>Recruitment pipeline overview for today.</p></div>
//                 <div style={styles.btnGroup}>
//                     <button style={styles.actionBtn} onClick={() => navigate("/employee/candidates/add")}><Icons.UserPlus /> Add Profile</button>
//                     <button style={styles.actionBtn} onClick={() => navigate("/employee/vendor/add")}><Icons.UserPlus /> Add Vendor</button>
//                     <button style={styles.actionBtn} onClick={() => navigate("/employee/requirement/create")}><Icons.Requirement /> Add Requirement</button>
//                 </div>
//             </div>

//             <div style={styles.statsGrid}>
//                 {[
//                     { label: "Total Pipeline", val: stats.total_pipelines, icon: <Icons.Pipeline />, col: "#25343F", url: "/employee" },
//                     { label: "Today's Profiles", val: stats.today_profiles, icon: <Icons.UserPlus />, col: "#25343F", url: "/employee" },
//                     { label: "Today Submitted", val: stats.today_submitted_profiles, icon: <Icons.Send />, col: "#FF9B51", url: "/employee" },
//                     { label: "My Requirements", val: stats.today_requirements, icon: <Icons.Requirement />, col: "#25343F", url: "/employee/requirements/my?type=today" },
//                     { label: "Total Vendors", val: stats.total_vendors, icon: <Icons.Vendor />, col: "#25343F", url: "/employee/user-vendors" },
//                     { label: "Total Clients", val: stats.total_clients, icon: <Icons.Client />, col: "#25343F", url: "/employee/clients" },
//                     { label: "Total Profiles", val: stats.total_profiles, icon: <Icons.Users />, col: "#25343F", url: "/employee/user-candidates" },

//                     { label: "Attendance", val: stats.attendance, icon: <Icons.Users />, col: "#25343F", url: "/employee/attendance" },
//                 ].map((s, i) => (
//                     <div key={i} style={styles.statCard} onClick={() => navigate(s.url)}>
//                         <div style={{overflow:'hidden'}}><p style={styles.statLabel}>{s.label}</p><h3 style={{...styles.statValue, color: s.col}}>{s.val || 0}</h3></div>
//                         <div style={{...styles.iconCircle, color: s.col, backgroundColor: 'rgba(37,52,63,0.05)'}}>{s.icon}</div>
//                     </div>
//                 ))}
//             </div>

//             <Section title="Active Pipeline Candidates"><table style={styles.table}><thead style={styles.tableHeader}><tr><th style={styles.th}>To/By</th><th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th><th style={styles.th}>Client</th><th style={styles.th}>Vendor</th><th style={styles.th}>Rate</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead><tbody>{renderGroupedRows(pipelineCandidates)}</tbody></table></Section>
//             <Section title="Submitted Profiles Table"><table style={styles.table}><thead style={styles.tableHeader}><tr><th style={styles.th}>Team</th><th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th><th style={styles.th}>Client</th><th style={styles.th}>Vendor</th><th style={styles.th}>Rates</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead><tbody>{renderGroupedRows(verifiedCandidates)}</tbody></table></Section>
//             <Section title="Today's Team Submissions"><table style={styles.table}><thead style={styles.tableHeader}><tr><th style={styles.th}>By</th><th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th><th style={styles.th}>Client</th><th style={styles.th}>Vendor</th><th style={styles.th}>Rate</th><th style={styles.th}>Status</th><th style={styles.th}>Action</th></tr></thead><tbody>{renderGroupedRows(teamSubmissions, false, true)}</tbody></table></Section>
//             <Section title="Today's New Profiles"><table style={styles.table}><thead style={styles.tableHeader}><tr><th style={styles.th}>To/By</th><th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th><th style={styles.th}>Client</th><th style={styles.th}>Vendor</th><th style={styles.th}>Rate</th><th style={styles.th}>Action</th></tr></thead><tbody>{renderGroupedRows(todayCandidates, true, false)}</tbody></table></Section>

//             <StatusUpdateModal isOpen={showModal} onClose={() => setShowModal(false)} formData={editForm} setFormData={setEditForm} onSave={handleUpdateSubmit} />
            
//             <SubmissionModal 
//                 isOpen={showSubmitModal} 
//                 onClose={() => setShowSubmitModal(false)} 
//                 selectedCand={selectedCand} 
//                 notify={notify} 
//                 refreshData={fetchAllData}
//                 {...submissionModalProps}
//             />
//         </BaseLayout>
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
//     welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
//     subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
//     btnGroup: { display: "flex", gap: "10px", alignItems: "center"},
//     actionBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
//     statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "30px" },
//     statCard: { background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F0F2F4", cursor: 'pointer' },
//     statLabel: { margin: 0, color: "#7F8C8D", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" },
//     statValue: { margin: "4px 0", fontSize: "20px", fontWeight: "800" },
//     iconCircle: { width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
//     sectionContainer: { marginBottom: "35px" },
//     sectionHeader: { marginBottom: "10px" },
//     sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#25343F", margin: 0, borderLeft: "4px solid #FF9B51", paddingLeft: "12px" },
//     tableWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #F0F2F4", marginTop: '5px' },
//     table: { width: "100%", borderCollapse: "collapse" },
//     tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
//     th: { padding: "12px 18px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
//     td: { padding: "12px 18px", fontSize: "13px", color: "#334155" },
//     dateSeparator: { padding: "10px 20px", background: "#f8fafc", color: "#475569", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", borderBottom: '1px solid #e2e8f0' },
//     badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
//     subStatusText: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
//     remarkIcon: { display: 'flex', cursor: 'help', padding: '4px', borderRadius: '4px', background: '#FFF5EB' },
//     editBtn: { border: 'none', background: '#F1F5F9', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
//     submitBtn: { background: '#25343F', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }
// };

// export default EmployeeDashboard;

