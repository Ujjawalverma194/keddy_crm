import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import BaseLayout from "../../components/SubAdminLayout";

function RequirementView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchView = async () => {
            try {
                const res = await apiRequest(`/jd-mapping/api/requirements/${id}/`, "GET");
                setData(res);
                // Handle the new API response wrapper { success: true, data: {...} }
                if (res && res.success) {
                    setData(res.data);
                } else {
                    setData(res); // Fallback
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchView();
    }, [id]);

    if (loading) return <BaseLayout><div style={styles.loading}>Loading Requirement View...</div></BaseLayout>;
    if (!data) return <BaseLayout><h3>Requirement not found!</h3></BaseLayout>;

    return (
        <BaseLayout>
            <div style={styles.header}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                    <div>
                        <h2 style={styles.title}>{data.title}</h2>
                        <span style={styles.subTitle}>ID: {data.requirement_id}</span>
                    </div>
                </div>
                <div style={styles.badgeGroup}>
                    <span style={styles.statBadge}>👥 Submissions: {data.total_submissions || 0}</span>
                    <span style={styles.statBadge}>⭐ Unique: {data.unique_candidates || 0}</span>
                    <button onClick={() => navigate(`/sub-admin/requirement/edit/${id}`)} style={styles.editBtn}>Edit Requirement</button>
                    {/* <span style={data.is_active ? styles.activeBadge : styles.blockBadge}>
                        {data.is_active ? "Active" : "Inactive"}
                    </span> */}
                </div>
            </div>

            <div style={styles.contentGrid}>
                {/* 1. Overview Card */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Requirement Overview</h3>
                    <DetailRow label="Experience" value={data.experience_required} />
                    <DetailRow label="Rate" value={data.rate} />
                    <DetailRow label="Time Zone" value={data.time_zone} />
                    <DetailRow label="Created At" value={new Date(data.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace('am', 'AM').replace('pm', 'PM')} />
                </div>

                {/* 2. Client Details Card */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Client Details</h3>
                    <DetailRow label="Company" value={data.client_details?.company_name} />
                    <DetailRow label="Contact Person" value={data.client_details?.name} />
                    <DetailRow label="Email" value={data.client_details?.email} />
                    <DetailRow label="Phone" value={data.client_details?.phone} />
                </div>

                {/* 3. Internal Info Card */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Internal Source</h3>
                    <DetailRow label="Created By" value={data.created_by_details?.name} />
                    <DetailRow label="Creator Email" value={data.created_by_details?.email} />
                    {/* <DetailRow label="User Role" value={data.created_by_details?.role} /> */}
                    <DetailRow label="Agency Name" value={data.company_details?.company_name} />
                </div>

                {/* 4. Skills Card */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Skills & Tags</h3>
                    <div style={styles.skillContainer}>
                        {data.skills ? data.skills.split(',').map((s, i) => (
                            <span key={i} style={styles.techTag}>{s.trim()}</span>
                        )) : <span style={styles.noData}>No skills specified</span>}
                    </div>
                </div>

                {/* 5. Assigned Team Card */}
                <div style={styles.fullWidthCard}>
                    <h3 style={styles.cardTitle}>Assigned Recruiters</h3>
                    <div style={styles.assignGrid}>
                        {data.assignments?.length > 0 ? data.assignments.map(a => (
                            <div key={a.id} style={styles.assignCard}>
                                <div style={styles.assignName}>{a.name}</div>
                                <div style={styles.assignEmail}>{a.email}</div>
                                <div style={styles.assignDate}>Assigned: {new Date(a.assigned_date).toLocaleDateString()}</div>
                            </div>
                        )) : <p style={styles.noData}>No team members assigned yet.</p>}
                    </div>
                </div>

                {/* 6. Full JD */}
                <div style={styles.fullWidthCard}>
                    <h3 style={styles.cardTitle}>Full Job Description</h3>
                    <div style={styles.jdBox}>{data.jd_description}</div>
                </div>

                {/* 7. Submissions Table */}
                <div style={styles.fullWidthCard}>
                    <h3 style={styles.cardTitle}>Candidate Submissions Tracking</h3>
                    <div style={{overflowX: 'auto'}}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}>Candidate</th>
                                    <th style={styles.th}>Submitted By</th>
                                    <th style={styles.th}>Vendor</th>
                                    <th style={styles.th}>Rates (V/C)</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.submissions?.length > 0 ? data.submissions.map((sub, idx) => (
                                    <tr key={idx} style={styles.trRow}>
                                        <td style={styles.td}>{new Date(sub.submission_date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td style={styles.td}>
                                            <div style={styles.primaryText}>{sub.candidate?.name || 'N/A'}</div>
                                            <div style={styles.subText}>{sub.candidate?.technology || 'N/A'} • {sub.candidate?.experience_calculated} Yrs</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.primaryText}>{sub.submitted_by?.name}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.primaryText}>{sub.candidate?.vendor?.company_name || 'Direct'}</div>
                                        </td>
                                        <td style={styles.td}>
                                            {sub.candidate?.vendor_rate ? <div style={styles.vendorRate}>V: {sub.candidate.vendor_rate} {sub.candidate.vendor_rate_type}</div> : '-'}
                                            {sub.candidate?.client_rate ? <div style={styles.clientRate}>C: {sub.candidate.client_rate} {sub.candidate.client_rate_type}</div> : ''}
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.statusBadge}>{sub.candidate?.main_status}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <button onClick={() => navigate(`/employee/candidate/view/${sub.candidate?.id}`)} style={styles.viewBtnMini}>View Profile</button>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan="7" style={styles.noDataTd}>No candidates submitted yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
}

const DetailRow = ({ label, value }) => (
    <div style={styles.detailRow}>
        <span style={styles.label}>{label}:</span>
        <span style={styles.value}>{value || "—"}</span>
    </div>
);

const styles = {
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700' },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", background: "#fff", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
    backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" },
    editBtn: { background: "#fff", border: "1px solid #FF9B51", color: "#FF9B51", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
    title: { margin: 0, color: "#25343F", fontSize: "22px", fontWeight: "800" },
    subTitle: { fontSize: "13px", color: "#888" },
    badgeGroup: { display: "flex", gap: "10px", alignItems: "center" },
    activeBadge: { background: "#e1f7e1", color: "#2e7d32", padding: "6px 15px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
    blockBadge: { background: "#ffebee", color: "#c62828", padding: "6px 15px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
    statBadge: { background: "#F8FAFC", color: "#475569", border: "1px solid #E2E8F0", padding: "6px 15px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
    contentGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "25px" },
    card: { background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
    fullWidthCard: { background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", gridColumn: "span 2" },
    cardTitle: { fontSize: "13px", color: "#FF9B51", fontWeight: "800", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.5px" },
    detailRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f8f9fa" },
    label: { color: "#64748B", fontSize: "13px", fontWeight: "600" },
    value: { color: "#25343F", fontSize: "14px", fontWeight: "700" },
    techTag: { background: "#25343F", color: "#fff", padding: "4px 12px", borderRadius: "6px", fontSize: "11px", marginRight: '5px', display: 'inline-block', marginBottom: '5px' },
    jdBox: { background: "#F8FAFC", padding: "20px", borderRadius: "10px", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap", color: "#334155" },
    statsRow: { display: "flex", gap: "20px" },
    statItem: { background: "#F1F5F9", padding: "8px 15px", borderRadius: "10px", fontSize: "13px" },
    loading: { textAlign: "center", padding: "100px", fontWeight: "800", color: "#FF9B51" },
    
    // Assignment Grid
    assignGrid: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
    assignCard: { background: '#F8FAFC', padding: '15px 20px', borderRadius: '10px', border: '1px solid #E2E8F0', minWidth: '180px' },
    assignName: { fontSize: '14px', fontWeight: '700', color: '#1E293B' },
    assignEmail: { fontSize: '12px', color: '#64748B', marginTop: '3px' },
    assignDate: { fontSize: '11px', color: '#94A3B8', marginTop: '8px', fontWeight: '600' },
    
    // Table Styles
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    thRow: { background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' },
    th: { textAlign: 'left', padding: '12px 15px', color: '#64748B', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' },
    trRow: { borderBottom: '1px solid #F1F5F9', transition: 'all 0.2s' },
    td: { padding: '12px 15px', verticalAlign: 'middle' },
    primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "13px" },
    subText: { fontSize: "11px", color: "#64748B", marginTop: '2px' },
    vendorRate: { fontSize: '12px', color: '#EF4444', fontWeight: '700' },
    clientRate: { fontSize: '12px', color: '#10B981', fontWeight: '700', marginTop: '2px' },
    statusBadge: { background: '#EFF6FF', color: '#2563EB', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', display: 'inline-block' },
    viewBtnMini: { background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' },
    noData: { color: '#94A3B8', fontSize: '13px', fontStyle: 'italic' },
    noDataTd: { padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontStyle: 'italic' }
};

export default RequirementView;