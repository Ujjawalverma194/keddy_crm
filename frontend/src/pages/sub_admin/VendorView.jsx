import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";

function VendorView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);

    // Date Filter States
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filteredCount, setFilteredCount] = useState(0);
    const [filterLoading, setFilterLoading] = useState(false);

    useEffect(() => {
        fetchVendorDetails();
    }, [id]);

    const fetchVendorDetails = async () => {
        try {
            const data = await apiRequest(`/employee-portal/api/vendors/${id}/`, "GET");
            setVendor(data);
            setFilteredCount(data.profile_count);
        } catch (error) {
            console.error("Error fetching vendor details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = async () => {
        if (!startDate || !endDate) {
            alert("Please select both dates");
            return;
        }
        setFilterLoading(true);
        try {
            const data = await apiRequest(
                `/employee-portal/api/vendors/${id}/?start_date=${startDate}&end_date=${endDate}`, 
                "GET"
            );
            setFilteredCount(data.profile_count);
        } catch (error) {
            console.error("Filter error:", error);
        } finally {
            setFilterLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        if (status === "SIGNED") return { background: "#DCFCE7", color: "#166534" };
        if (status === "SENT") return { background: "#FEF3C7", color: "#92400E" };
        if (status === "NOT_SENT") return { background: "#FEE2E2", color: "#991B1B" };
        return { background: "#F1F5F9", color: "#475569" };
    };

    if (loading) return <BaseLayout><div style={styles.loader}>Loading Comprehensive Profile...</div></BaseLayout>;
    if (!vendor) return <BaseLayout><div style={styles.error}>Vendor not found!</div></BaseLayout>;

    return (
        <BaseLayout>
            {/* Top Bar */}
            <div style={styles.topBar}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back to List</button>
                <div style={styles.headerInfo}>
                    <div style={styles.titleWrapper}>
                        <h2 style={styles.pageTitle}>{vendor.name}</h2>
                        <div style={styles.badgeGroup}>
                            {vendor.is_verified ? <span style={styles.verifiedBadge}>Verified</span> : <span style={styles.unverifiedBadge}>Pending Verification</span>}
                            {!vendor.is_active && <span style={styles.inactiveBadge}>Inactive Account</span>}
                        </div>
                    </div>
                    <span style={styles.companySub}>{vendor.company_name} • ID: {vendor.id}</span>
                </div>
            </div>

            {/* Dashboard Stats & Filter */}
            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Current Profile</span>
                    <span style={styles.statValue}>{filteredCount}</span>
                </div>
                <div style={styles.filterCard}>
                    <div style={styles.filterTitle}>Filter Profile Count by Date Range</div>
                    <div style={styles.dateInputs}>
                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabel}>Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.dateInput} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabel}>End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.dateInput} />
                        </div>
                        <button onClick={handleFilter} style={styles.filterBtn}>
                            {filterLoading ? "..." : "Apply"}
                        </button>
                        {(startDate || endDate) && <button onClick={() => {setStartDate(""); setEndDate(""); fetchVendorDetails();}} style={styles.resetBtn}>Reset</button>}
                    </div>
                </div>
            </div>

            <div style={styles.containerGrid}>
                {/* Left Column */}
                <div style={styles.leftCol}>
                    {/* Basic Info */}
                    <div style={styles.card}>
                        <h3 style={styles.cardHeading}>Contact & Communication</h3>
                        <div style={styles.infoGrid}>
                            <InfoItem label="Official Email (HR)" value={vendor.vendor_official_email} />
                            <InfoItem label="Sending Email ID" value={vendor.sending_email_id} />
                            <InfoItem label="Personal Email" value={vendor.email} />
                            <InfoItem label="Phone Number" value={vendor.number} />
                            <InfoItem label="Company Website" value={vendor.company_website} isLink />
                            <InfoItem label="PAN / Reg No" value={vendor.company_pan_or_reg_no} />
                        </div>
                    </div>

                    {/* Business Details */}
                    <div style={styles.card}>
                        <h3 style={styles.cardHeading}>Business & Resource Details</h3>
                        <div style={styles.infoGrid}>
                            <div style={styles.fullRow}>
                                <strong style={styles.label}>Specialized Tech Stack:</strong>
                                <div style={styles.techContainer}>
                                    {vendor.specialized_tech_developers ? vendor.specialized_tech_developers.split(',').map((tech, i) => (
                                        <span key={i} style={styles.techBadge}>{tech.trim()}</span>
                                    )) : "N/A"}
                                </div>
                            </div>
                            <InfoItem label="Bench Count" value={vendor.no_of_bench_developers} />
                            <InfoItem label="Employee Count" value={vendor.company_employee_count} />
                            <InfoItem label="Onsite Support" value={vendor.provide_onsite ? "✅ Yes" : "❌ No"} />
                            <InfoItem label="Bench Support" value={vendor.provide_bench ? "✅ Yes" : "❌ No"} />
                            <InfoItem label="Market Support" value={vendor.provide_market ? "✅ Yes" : "❌ No"} />
                            <InfoItem label="Onsite Location" value={vendor.onsite_location} />
                        </div>
                    </div>

                    {/* POC Details */}
                    <div style={styles.card}>
                        <h3 style={styles.cardHeading}>Points of Contact (POC)</h3>
                        <div style={styles.pocGrid}>
                            <div style={styles.pocBox}>
                                <p style={styles.pocTitle}>POC 1: {vendor.poc1_name || "N/A"}</p>
                                <p style={styles.pocNum}>📞 {vendor.poc1_number || "N/A"}</p>
                            </div>
                            <div style={styles.pocBox}>
                                <p style={styles.pocTitle}>POC 2: {vendor.poc2_name || "N/A"}</p>
                                <p style={styles.pocNum}>📞 {vendor.poc2_number || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div style={styles.rightCol}>
                    {/* Document Section */}
                    <div style={styles.card}>
                        <h3 style={styles.cardHeading}>Compliance & Documents</h3>
                        <DocRow label="Bench List" file={vendor.bench_list} />
                        <DocRow label="NDA Document" file={vendor.nda_document} status={vendor.nda_status} date={vendor.nda_uploaded_date} styleFunc={getStatusStyle} />
                        <DocRow label="MSA Document" file={vendor.msa_document} status={vendor.msa_status} date={vendor.msa_uploaded_date} styleFunc={getStatusStyle} />
                    </div>

                    {/* Remarks */}
                    <div style={styles.card}>
                        <h3 style={styles.cardHeading}>Internal Remark</h3>
                        <p style={styles.remarkBox}>{vendor.remark || "No internal remarks provided."}</p>
                    </div>

                    {/* Meta Data */}
                    <div style={styles.card}>
                        <h3 style={styles.cardHeading}>System Metadata</h3>
                        <div style={styles.metaList}>
                            <div style={styles.metaItem}><strong>Top Clients:</strong> {vendor.top_3_clients || "N/A"}</div>
                            <div style={styles.metaItem}><strong>Created By:</strong> {vendor.created_by_name} ({vendor.created_by?.email})</div>
                            <div style={styles.metaItem}><strong>Created At:</strong> {new Date(vendor.created_at).toLocaleString()}</div>
                            <div style={styles.metaItem}><strong>Last Updated:</strong> {new Date(vendor.updated_at).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
}

// Sub-Components
const InfoItem = ({ label, value, isLink }) => (
    <div style={styles.infoRow}>
        <span style={styles.label}>{label}</span>
        <span style={styles.value}>
            {isLink && value ? <a href={value} target="_blank" rel="noreferrer" style={styles.link}>{value}</a> : (value || "N/A")}
        </span>
    </div>
);

const DocRow = ({ label, file, status, date, styleFunc, onView }) => (
    <div style={styles.docRow}>
        <div style={{ flex: 1 }}>
            <div style={styles.docLabel}>{label}</div>
            {date && <div style={styles.docDate}>Date: {date}</div>}
        </div>
        <div style={styles.docActions}>
            {status && <span style={{ ...styles.statusBadge, ...styleFunc(status) }}>{status.replace('_', ' ')}</span>}
            <div style={styles.btnGroup}>
                {onView && <button onClick={onView} style={styles.smallBtn}>View</button>}
                {file && <a href={file} target="_blank" rel="noreferrer" style={styles.smallLink}>Open</a>}
            </div>
        </div>
    </div>
);

const styles = {
    loader: { padding: "50px", textAlign: "center", color: "#64748B", fontWeight: "700" },
    error: { padding: "50px", textAlign: "center", color: "#DC2626", fontWeight: "700" },
    topBar: { display: "flex", gap: "20px", marginBottom: "30px", alignItems: "flex-start" },
    backBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
    headerInfo: { display: "flex", flexDirection: "column", gap: "5px" },
    titleWrapper: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
    pageTitle: { fontSize: "28px", color: "#1E293B", fontWeight: "800", margin: 0 },
    companySub: { fontSize: "15px", color: "#64748B", fontWeight: "600" },
    
    // Dashboard Stats
    statsRow: { display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" },
    statCard: { background: "#FF9B51", padding: "25px", borderRadius: "18px", flex: "1", minWidth: "220px", color: "#fff", textAlign: "center", boxShadow: "0 10px 20px rgba(255,155,81,0.2)" },
    statLabel: { fontSize: "13px", fontWeight: "700", opacity: 0.9, textTransform: "uppercase", letterSpacing: "1px" },
    statValue: { fontSize: "42px", fontWeight: "900", display: "block", marginTop: "5px" },
    
    filterCard: { background: "#fff", padding: "20px", borderRadius: "18px", flex: "2.5", minWidth: "350px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" },
    filterTitle: { fontSize: "12px", fontWeight: "800", color: "#94A3B8", marginBottom: "15px", textTransform: "uppercase" },
    dateInputs: { display: "flex", gap: "15px", alignItems: "flex-end", flexWrap: "wrap" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
    inputLabel: { fontSize: "11px", fontWeight: "800", color: "#64748B" },
    dateInput: { padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px" },
    filterBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "11px 22px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
    resetBtn: { background: "#F1F5F9", color: "#475569", border: "none", padding: "11px 15px", borderRadius: "8px", cursor: "pointer" },

    containerGrid: { display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "25px" },
    leftCol: { display: "flex", flexDirection: "column", gap: "25px" },
    rightCol: { display: "flex", flexDirection: "column", gap: "25px" },

    card: { background: "#fff", padding: "24px", borderRadius: "20px", border: "1px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.01)" },
    cardHeading: { fontSize: "12px", fontWeight: "900", color: "#94A3B8", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1.2px", borderBottom: "1px solid #F8FAFC", paddingBottom: "10px" },

    infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
    infoRow: { display: "flex", flexDirection: "column", gap: "5px" },
    label: { fontSize: "11px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" },
    value: { fontSize: "15px", color: "#1E293B", fontWeight: "700" },
    fullRow: { gridColumn: "1 / -1" },

    techContainer: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" },
    techBadge: { background: "#F1F5F9", padding: "5px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", color: "#475569", border: "1px solid #E2E8F0" },

    pocGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
    pocBox: { background: "#F8FAFC", padding: "15px", borderRadius: "12px", border: "1px solid #E2E8F0" },
    pocTitle: { fontSize: "15px", fontWeight: "800", color: "#1E293B", margin: "0 0 5px 0" },
    pocNum: { fontSize: "14px", color: "#3B82F6", fontWeight: "700", margin: 0 },

    docRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", borderBottom: "1px solid #F1F5F9" },
    docLabel: { fontSize: "15px", fontWeight: "800", color: "#334155" },
    docDate: { fontSize: "11px", color: "#94A3B8" },
    docActions: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" },
    statusBadge: { padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "800" },
    btnGroup: { display: "flex", gap: "8px" },
    smallBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "5px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" },
    smallLink: { background: "#EFF6FF", color: "#3B82F6", textDecoration: "none", padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", border: "1px solid #DBEAFE" },

    verifiedBadge: { background: "#DCFCE7", color: "#166534", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "800" },
    unverifiedBadge: { background: "#FEF3C7", color: "#92400E", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "800" },
    inactiveBadge: { background: "#FEE2E2", color: "#991B1B", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "800" },
    remarkBox: { fontSize: "14px", color: "#475569", fontStyle: "italic", background: "#FFFBEB", padding: "15px", borderRadius: "10px", borderLeft: "5px solid #F59E0B", lineHeight: "1.6" },
    metaList: { display: "flex", flexDirection: "column", gap: "10px" },
    metaItem: { fontSize: "13px", color: "#64748B" },
    link: { color: "#3B82F6", textDecoration: "none" }
};

export default VendorView;

