import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import AccountsBaseLayout from "../components/AccountsBaseLayout";

const FinanceListView = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const sData = await apiRequest("/invoice/api/settings/", "GET");
                const bData = await apiRequest("/invoice/api/bank-accounts/", "GET");

                setSettings(sData);
                setBanks(bData.results ? bData.results : bData);
            } catch (err) {
                console.error("Error loading finance data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <AccountsBaseLayout>
                <div style={styles.loading}>Loading Finance Details...</div>
            </AccountsBaseLayout>
        );
    }

    return (
        <AccountsBaseLayout>
            {/* Top Navigation Row */}
            <div style={styles.topNav}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                    <h2 style={styles.pageTitle}>Finance Overview</h2>
                </div>
                <button 
                    onClick={() => navigate("/accounts/settings")} 
                    style={styles.updateBtn}
                >
                    Update Settings
                </button>
            </div>

            <div style={styles.container}>
                {/* Company Settings Card */}
                {settings && (
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h3 style={styles.sectionTitle}>Company Information</h3>
                            {settings.logo_url && (
                                <img
                                    src={settings.logo_url}
                                    alt="Company Logo"
                                    style={styles.logo}
                                />
                            )}
                        </div>
                        
                        <div style={styles.infoGrid}>
                            <div style={styles.infoBox}>
                                <label style={styles.label}>Company Name</label>
                                <p style={styles.value}>{settings.company_name || "-"}</p>
                            </div>
                            <div style={styles.infoBox}>
                                <label style={styles.label}>Email Address</label>
                                <p style={styles.value}>{settings.email || "-"}</p>
                            </div>
                            <div style={styles.infoBox}>
                                <label style={styles.label}>Phone Number</label>
                                <p style={styles.value}>{settings.phone || "-"}</p>
                            </div>
                            <div style={styles.infoBox}>
                                <label style={styles.label}>GSTIN</label>
                                <p style={styles.value}>{settings.gstin || "-"}</p>
                            </div>
                            <div style={styles.infoBox}>
                                <label style={styles.label}>Default GST Rate</label>
                                <p style={styles.value}>{settings.default_gst_rate}%</p>
                            </div>
                            <div style={styles.infoBox}>
                                <label style={styles.label}>Default SAC Code</label>
                                <p style={styles.value}>{settings.default_sac_code || "-"}</p>
                            </div>
                            <div style={{ ...styles.infoBox, gridColumn: "1 / -1" }}>
                                <label style={styles.label}>Address</label>
                                <p style={styles.value}>{settings.address || "-"}</p>
                            </div>
                            <div style={{ ...styles.infoBox, gridColumn: "1 / -1" }}>
                                <label style={styles.label}>Default Terms & Conditions</label>
                                <p style={styles.value}>{settings.default_terms || "-"}</p>
                            </div>
                        </div>

                        {settings.signature_url && (
                            <div style={styles.signatureSection}>
                                <label style={styles.label}>Authorized Signature</label>
                                <img 
                                    src={settings.signature_url} 
                                    alt="Authorized Signature" 
                                    style={styles.signatureImage} 
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Bank Accounts Card */}
                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}>Bank Accounts</h3>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHeader}>
                                    <th style={styles.th}>Bank Name</th>
                                    <th style={styles.th}>Account Holder</th>
                                    <th style={styles.th}>Account Number</th>
                                    <th style={styles.th}>IFSC Code</th>
                                    <th style={styles.th}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {banks.length > 0 ? banks.map((b) => (
                                    <tr key={b.id} style={styles.tr}>
                                        <td style={styles.td}>{b.bank_name}</td>
                                        <td style={styles.td}>{b.account_holder_name}</td>
                                        <td style={styles.td}>{b.account_number}</td>
                                        <td style={styles.td}>{b.ifsc_code}</td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.statusBadge,
                                                backgroundColor: b.is_active ? '#D1FAE5' : '#FEE2E2',
                                                color: b.is_active ? '#065F46' : '#991B1B'
                                            }}>
                                                {b.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" style={styles.noData}>No Bank Accounts Added</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AccountsBaseLayout>
    );
};

const styles = {
    loading: { padding: '100px', textAlign: 'center', fontWeight: '800', color: '#1E293B' },
    topNav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
    backBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" },
    updateBtn: { background: "#10B981", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" },
    pageTitle: { fontSize: "22px", fontWeight: "800", color: "#1E293B", margin: 0 },
    container: { display: "flex", flexDirection: "column", gap: "25px" },
    card: { background: "#fff", borderRadius: "12px", padding: "25px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "1px solid #F1F5F9", paddingBottom: "15px" },
    sectionTitle: { fontSize: "18px", fontWeight: "800", color: "#1E293B", margin: 0 },
    logo: { width: "100px", height: "auto", borderRadius: "8px", border: "1px solid #F1F5F9" },
    infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" },
    infoBox: { display: "flex", flexDirection: "column", gap: "4px" },
    label: { fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" },
    value: { fontSize: "14px", fontWeight: "600", color: "#1E293B", margin: 0 },
    signatureSection: { marginTop: "20px", paddingTop: "15px", borderTop: "1px solid #F1F5F9" },
    signatureImage: { height: "70px", width: "auto", marginTop: "10px", display: "block" },
    tableWrapper: { marginTop: "15px", overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHeader: { background: "#F8FAFC" },
    th: { padding: "12px", textAlign: "left", fontSize: "11px", color: "#64748B", fontWeight: "800", textTransform: "uppercase", borderBottom: "2px solid #E2E8F0" },
    tr: { borderBottom: "1px solid #F1F5F9" },
    td: { padding: "12px", fontSize: "13px", color: "#1E293B" },
    statusBadge: { padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
    noData: { padding: "30px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }
};

export default FinanceListView;





// import React, { useEffect, useState } from "react";
// import { apiRequest } from "../../services/api";
// import AccountsBaseLayout from "../components/AccountsBaseLayout";

// const FinanceListView = () => {

//     const [settings, setSettings] = useState(null);
//     const [banks, setBanks] = useState([]);

//     useEffect(() => {
//         const loadData = async () => {
//             try {
//                 const sData = await apiRequest("/invoice/api/settings/", "GET");
//                 const bData = await apiRequest("/invoice/api/bank-accounts/", "GET");

//                 setSettings(sData);
//                 setBanks(bData.results ? bData.results : bData);

//             } catch (err) {
//                 console.error(err);
//             }
//         };

//         loadData();
//     }, []);

//     return (
//         <AccountsBaseLayout>

//             <div style={{ padding: "20px" }}>

//                 {/* SETTINGS */}
//                 {settings && (
//                     <div style={{ marginBottom: "30px" }}>
//                         <h2>{settings.company_name}</h2>

//                         <img
//                             src={settings.logo_url ? settings.logo_url : "https://via.placeholder.com/80"}
//                             alt="logo"
//                             width="80"
//                         />

//                         <p>{settings.address}</p>
//                         <p>Email: {settings.email}</p>
//                         <p>Phone: {settings.phone}</p>
//                         <p>GST: {settings.gstin}</p>
//                         <p>GST Rate: {settings.default_gst_rate}%</p>
//                     </div>
//                 )}

//                 {/* BANKS */}
//                 <h3>Bank Accounts</h3>

//                 <table border="1" cellPadding="10">
//                     <thead>
//                         <tr>
//                             <th>Bank</th>
//                             <th>Holder</th>
//                             <th>Account</th>
//                             <th>IFSC</th>
//                             <th>Status</th>
//                         </tr>
//                     </thead>

//                     <tbody>
//                         {banks.length > 0 ? banks.map(b => (
//                             <tr key={b.id}>
//                                 <td>{b.bank_name}</td>
//                                 <td>{b.account_holder_name}</td>
//                                 <td>{b.account_number}</td>
//                                 <td>{b.ifsc_code}</td>
//                                 <td>{b.is_active ? "Active" : "Inactive"}</td>
//                             </tr>
//                         )) : (
//                             <tr>
//                                 <td colSpan="5">No Data</td>
//                             </tr>
//                         )}
//                     </tbody>
//                 </table>

//             </div>

//         </AccountsBaseLayout>
//     );
// };

// export default FinanceListView;






// import React, { useState, useEffect } from "react";
// import { apiRequest } from "../../services/api";
// import AccountsBaseLayout from "../components/AccountsBaseLayout";

// const FinanceListView = () => {
//     const [settings, setSettings] = useState(null);
//     const [banks, setBanks] = useState([]);

//     const localStyles = {
//         card: { backgroundColor: "#fff", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "25px" },
//         cardTitle: { fontSize: "18px", fontWeight: "700", color: "#1E293B", marginBottom: "20px", borderBottom: "2px solid #F1F5F9", paddingBottom: "10px" },
//         table: { width: "100%", borderCollapse: "collapse" },
//         miniLogo: { width: "70px", height: "70px", borderRadius: "8px", objectFit: "contain", border: "1px solid #E2E8F0" },
//         settingsHeader: { display: "flex", gap: "25px", alignItems: "center" },
//         th: { textAlign: "left", padding: "12px", fontSize: "13px", color: "#64748B", backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" },
//         td: { padding: "12px", fontSize: "14px", color: "#1E293B", borderBottom: "1px solid #F1F5F9" }
//     };

//     useEffect(() => {
//         const loadData = async () => {
//             try {
//                 const sData = await apiRequest("/invoice/api/settings/", "GET");
//                 const bData = await apiRequest("/invoice/api/bank-accounts/", "GET");
//                 setSettings(sData);
//                 setBanks(bData.results || []);
//             } catch (err) { console.error("Error loading data", err); }
//         };
//         loadData();
//     }, []);

//     return (
//         <AccountsBaseLayout>
//         <div style={{ width: "100%" }}>
//             {settings && (
//                 <div style={localStyles.card}>
//                     <h3 style={localStyles.cardTitle}>Company Profile Overview</h3>
//                     <div style={localStyles.settingsHeader}>
//                         <img src={settings.logo_url || "https://via.placeholder.com/70"} alt="Logo" style={localStyles.miniLogo} />
//                         <div style={{flex: 1}}>
//                             <h3 style={{margin: 0, color: "#1E293B"}}>{settings.company_name || "Name Not Set"}</h3>
//                             <p style={{margin: "5px 0", color: "#64748B", fontSize: "14px"}}>{settings.address}</p>
//                         </div>
//                         <div style={{textAlign: "right", fontSize: "14px"}}>
//                             <p><b>GSTIN:</b> {settings.gstin}</p>
//                             <p><b>SAC:</b> {settings.default_sac_code}</p>
//                         </div>
//                     </div>
//                     <div style={{marginTop: "20px", display: "flex", gap: "30px", fontSize: "14px", borderTop: "1px solid #F1F5F9", paddingTop: "15px"}}>
//                         <span><b>Email:</b> {settings.email}</span>
//                         <span><b>Phone:</b> {settings.phone}</span>
//                         <span><b>GST Rate:</b> {settings.default_gst_rate}%</span>
//                     </div>
//                 </div>
//             )}

//             <div style={localStyles.card}>
//                 <h3 style={localStyles.cardTitle}>Registered Bank Accounts</h3>
//                 <div style={{ overflowX: "auto" }}>
//                     <table style={localStyles.table}>
//                         <thead>
//                             <tr>
//                                 <th style={localStyles.th}>Bank & Branch</th>
//                                 <th style={localStyles.th}>Account Holder</th>
//                                 <th style={localStyles.th}>Account & IFSC</th>
//                                 <th style={localStyles.th}>Status</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {banks.length > 0 ? banks.map(b => (
//                                 <tr key={b.id}>
//                                     <td style={localStyles.td}><b>{b.bank_name}</b><br/><small style={{color: "#64748B"}}>{b.branch}</small></td>
//                                     <td style={localStyles.td}>{b.account_holder_name}</td>
//                                     <td style={localStyles.td}>{b.account_number}<br/><small style={{color: "#64748B"}}>IFSC: {b.ifsc_code}</small></td>
//                                     <td style={localStyles.td}>
//                                         <span style={{color: b.is_active ? "#10B981" : "#EF4444", fontWeight: "700"}}>
//                                             {b.is_active ? "● Active" : "● Inactive"}
//                                         </span>
//                                     </td>
//                                 </tr>
//                             )) : (
//                                 <tr><td colSpan="4" style={{textAlign: "center", padding: "20px"}}>No bank accounts found.</td></tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//         </AccountsBaseLayout>
//     );
// };

// export default FinanceListView;