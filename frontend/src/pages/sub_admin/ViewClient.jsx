import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";

function ClientView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    // Date Filter States
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filteredCount, setFilteredCount] = useState(null);
    const [filterLoading, setFilterLoading] = useState(false);

    // Initial Fetch
    const fetchClientDetails = async (sDate = "", eDate = "") => {
        const isFiltering = sDate && eDate;
        if (isFiltering) setFilterLoading(true);
        else setLoading(true);

        try {
            let url = `/sub-admin/api/clients/info/${id}/`;
            if (isFiltering) {
                url += `?start_date=${sDate}&end_date=${eDate}`;
            }
            const data = await apiRequest(url, "GET");
            
            setClient(data);
            setFilteredCount(data.profile_count);
        } catch (error) {
            console.error("Error fetching client details:", error);
        } finally {
            setLoading(false);
            setFilterLoading(false);
        }
    };

    useEffect(() => {
        fetchClientDetails();
    }, [id]);

    const handleFilter = () => {
        if (!startDate || !endDate) {
            alert("Please select both Start and End dates");
            return;
        }
        fetchClientDetails(startDate, endDate);
    };

    if (loading) return <BaseLayout><div style={styles.statusMsg}>Loading Client Profile...</div></BaseLayout>;
    if (!client) return <BaseLayout><div style={{...styles.statusMsg, color: 'red'}}>Client not found!</div></BaseLayout>;

    return (
        <BaseLayout>
            <div style={styles.container}>
                {/* Top Navigation */}
                <div style={styles.topBar}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back to List</button>
                    <div style={styles.headerInfo}>
                        <h2 style={styles.pageTitle}>{client.client_name}</h2>
                        <span style={styles.companySub}>{client.company_name}</span>
                    </div>
                </div>

                {/* Dashboard Stats & Filter Row */}
                <div style={styles.statsRow}>
                    <div style={styles.statCard}>
                        <span style={styles.statLabel}>Current Profile Count</span>
                        <span style={styles.statValue}>{filteredCount}</span>
                    </div>
                    
                    <div style={styles.filterCard}>
                        <p style={styles.filterTitle}>Filter Profiles by Date</p>
                        <div style={styles.dateInputs}>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                style={styles.dateInput} 
                            />
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                style={styles.dateInput} 
                            />
                            <button onClick={handleFilter} style={styles.filterBtn}>
                                {filterLoading ? "..." : "Apply Filter"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div style={styles.infoGrid}>
                    {/* Basic Info */}
                    <div style={styles.detailSection}>
                        <h3 style={styles.sectionHeading}>Client Information</h3>
                        <div style={styles.infoRow}><strong>Full Name:</strong> {client.client_name}</div>
                        <div style={styles.infoRow}><strong>Company:</strong> {client.company_name}</div>
                        <div style={styles.infoRow}><strong>Phone:</strong> {client.phone_number}</div>
                        <div style={styles.infoRow}><strong>Email:</strong> {client.email || "N/A"}</div>
                    </div>

                    {/* Meta Information */}
                    <div style={styles.detailSection}>
                        <h3 style={styles.sectionHeading}>System Details</h3>
                        <div style={styles.infoRow}><strong>Client ID:</strong> #{client.id}</div>
                        <div style={styles.infoRow}><strong>Created On:</strong> {new Date(client.created_at).toLocaleString()}</div>
                        <div style={styles.infoRow}><strong>Added By:</strong> {client.created_by_name}</div>
                        <div style={styles.infoRow}><strong>Creator Email:</strong> {client.created_by_email}</div>
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
}

const styles = {
    container: { padding: "10px", maxWidth: "1200px", margin: "0 auto" },
    topBar: { display: "flex", alignItems: "center", gap: "15px", marginBottom: "25px", flexWrap: "wrap" },
    backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontSize: "14px" },
    headerInfo: { display: "flex", flexDirection: "column" },
    pageTitle: { fontSize: "clamp(22px, 5vw, 30px)", color: "#25343F", fontWeight: "800", margin: 0 },
    companySub: { fontSize: "16px", color: "#BFC9D1", fontWeight: "600" },

    statsRow: { display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" },
    statCard: { 
        background: "linear-gradient(135deg, #FF9B51 0%, #ff822d 100%)", 
        padding: "25px", borderRadius: "20px", flex: "1", minWidth: "250px", 
        color: "#fff", display: "flex", flexDirection: "column", alignItems: "center",
        boxShadow: "0 10px 20px rgba(255, 155, 81, 0.2)"
    },
    statLabel: { fontSize: "14px", fontWeight: "600", opacity: 0.9, marginBottom: "5px" },
    statValue: { fontSize: "42px", fontWeight: "900" },

    filterCard: { 
        background: "#fff", padding: "20px", borderRadius: "20px", flex: "2", 
        minWidth: "300px", border: "1px solid #EAEFEF", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" 
    },
    filterTitle: { margin: "0 0 15px 0", fontSize: "14px", fontWeight: "700", color: "#25343F" },
    dateInputs: { display: "flex", gap: "12px", flexWrap: "wrap" },
    dateInput: { padding: "10px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none", flex: 1, fontSize: "14px" },
    filterBtn: { background: "#25343F", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", transition: "0.3s" },

    infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "25px" },
    detailSection: { background: "#fff", padding: "25px", borderRadius: "20px", border: "1px solid #EAEFEF", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" },
    sectionHeading: { fontSize: "13px", fontWeight: "900", color: "#FF9B51", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "2px solid #EAEFEF", paddingBottom: "10px" },
    infoRow: { marginBottom: "15px", fontSize: "15px", color: "#25343F", display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #f0f0f0", paddingBottom: "8px" },
    statusMsg: { padding: "50px", textAlign: "center", fontSize: "18px", fontWeight: "600", color: "#25343F" }
};

export default ClientView;