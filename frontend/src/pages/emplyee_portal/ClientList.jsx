import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";

function ClientList() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);

    const [toast, setToast] = useState({ show: false, message: "", type: "" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    };

    // ✅ Robust helper: Har possible field name try karega
    const getCreatedByInfo = (client) => {
        const possibleFields = [
            // Nested object scenarios
            ['created_by', 'first_name'],
            ['created_by', 'name'],
            ['created_by', 'username'],
            ['created_by', 'full_name'],
            ['user', 'first_name'],
            ['user', 'name'],
            // Flat field scenarios
            ['created_by_name'],
            ['created_by_username'],
            ['creator_name'],
            ['user_name'],
            // Email fields for subtitle
            ['created_by', 'email'],
            ['created_by', 'official_email'],
            ['created_by_email'],
            ['user_email'],
        ];

        let name = null;
        let email = null;

        // Try to find name
        for (const path of possibleFields) {
            if (path[0] === 'created_by' && client.created_by && typeof client.created_by === 'object') {
                const value = client.created_by[path[1]];
                if (value && typeof value === 'string' && !name) name = value;
            } else if (path[0] === 'user' && client.user && typeof client.user === 'object') {
                const value = client.user[path[1]];
                if (value && typeof value === 'string' && !name) name = value;
            } else if (client[path[0]] && typeof client[path[0]] === 'string' && !name) {
                name = client[path[0]];
            }
        }

        // Try to find email
        for (const path of possibleFields) {
            if (path.length === 2 && path[1] === 'email') {
                if (path[0] === 'created_by' && client.created_by?.email && !email) {
                    email = client.created_by.email;
                } else if (path[0] === 'created_by' && client.created_by?.official_email && !email) {
                    email = client.created_by.official_email;
                } else if (client[path[0]] && typeof client[path[0]] === 'string' && !email) {
                    email = client[path[0]];
                }
            }
        }

        // Fallback: Agar kuch na mile, toh raw created_by dikhao
        if (!name && client.created_by) {
            if (typeof client.created_by === 'string') {
                name = client.created_by;
            } else if (typeof client.created_by === 'number') {
                name = `User #${client.created_by}`;
            } else if (client.created_by?.id) {
                name = `User #${client.created_by.id}`;
            }
        }

        return { 
            name: name || '—', 
            email: email || null 
        };
    };

    const fetchClients = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const response = await apiRequest(`/employee-portal/clients/list/?page=${page}&search=${search}`, "GET");
            
            // ✅ Debug log - remove after checking
            if (response.results?.[0]) {
                console.log("🔍 Sample client object keys:", Object.keys(response.results[0]));
                console.log("🔍 created_by field:", response.results[0].created_by);
            }
            
            setClients(response.results || []);
            setTotalCount(response.count || 0);
            setHasNext(!!response.next);
            setHasPrevious(!!response.previous);
            setCurrentPage(page);
        } catch (error) {
            console.error("Error fetching clients:", error);
            showToast("Failed to fetch clients", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchClients(1, searchQuery);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
        
        try {
            setLoading(true);
            await apiRequest(`/employee-portal/api/clients/${id}/delete/`, "DELETE");
            showToast(`${name} deleted successfully!`, "success");
            fetchClients(currentPage, searchQuery); 
        } catch (error) {
            console.error("Delete failed:", error);
            showToast("Could not delete client", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseLayout>
            {toast.show && (
                <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#EF4444" : "#10B981" }}>
                    {toast.message}
                </div>
            )}

            <div style={styles.topBar}>
                <button onClick={() => navigate("/employee")} style={styles.backBtn}>← Back to Dashboard</button>
                <div style={styles.searchContainer}>
                    <input 
                        type="text" 
                        placeholder="Search by client or company..." 
                        style={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button onClick={() => navigate("/employee/client/add")} style={styles.addBtn}>
                    + Add Client
                </button>
            </div>

            <div style={styles.section}>
                <h2 style={styles.pageTitle}>Total Clients</h2>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.th, width: "50px" }}>S.No</th>
                                <th style={{ ...styles.th, width: "220px" }}>Client & Company</th>
                                <th style={{ ...styles.th, width: "150px" }}>Contact Info</th>
                                <th style={{ ...styles.th, width: "100px" }}>Verified</th>
                                <th style={{ ...styles.th, width: "120px" }}>Created By</th>
                                <th style={{ ...styles.th, width: "120px" }}>Created Date</th>
                                <th style={{ ...styles.th, textAlign: "center", width: "180px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={styles.loadingTd}>Loading clients...</td></tr>
                            ) : clients.length > 0 ? (
                                clients.map((client, index) => {
                                    const { name: creatorName, email: creatorEmail } = getCreatedByInfo(client);
                                    
                                    return (
                                        <tr key={client.id} style={styles.tableRow}>
                                            <td style={styles.td}>{(currentPage - 1) * 10 + (index + 1)}</td>
                                            <td style={styles.td}>
                                                <div style={styles.primaryText}>{client.client_name}</div>
                                                <div style={styles.subText}>{client.company_name}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.infoText}>{client.email || client.phone_number}</div>
                                                <div style={styles.infoSubText}>{client.official_email}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={client.is_verified ? styles.badgeYes : styles.badgeNo}>
                                                    {client.is_verified ? "VERIFIED" : "PENDING"}
                                                </span>
                                            </td>
                                            
                                            {/* ✅ Created By Column - Robust Display */}
                                            <td style={styles.td}>
                                                <div style={styles.createdByBadge} title={creatorName}>
                                                    {creatorName}
                                                </div>
                                                {creatorEmail && (
                                                    <div style={{ fontSize: "10px", color: "#64748B" }} title={creatorEmail}>
                                                        {creatorEmail}
                                                    </div>
                                                )}
                                            </td>
                                            
                                            <td style={styles.td}>
                                                <div style={styles.dateText}>
                                                    {new Date(client.created_at).toLocaleDateString('en-GB', {
                                                        day: '2-digit', month: 'short', year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td style={styles.actionTd}>
                                                <div style={styles.actionGroup}>
                                                    <button style={styles.viewBtn} onClick={() => navigate(`/employee/client/view/${client.id}`)}>View</button>
                                                    <button style={styles.editBtn} onClick={() => navigate(`/employee/client/update/${client.id}`)}>Edit</button>
                                                    <button style={styles.deleteBtn} onClick={() => handleDelete(client.id, client.client_name)}>Del</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="7" style={styles.loadingTd}>No clients found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={styles.paginationContainer}>
                    <div style={styles.pageInfo}>
                        Showing {clients.length} of {totalCount} clients
                    </div>
                    <div style={styles.paginationBtns}>
                        <button 
                            disabled={!hasPrevious || loading} 
                            onClick={() => fetchClients(currentPage - 1, searchQuery)}
                            style={{ ...styles.pageBtn, opacity: hasPrevious ? 1 : 0.5 }}
                        >Previous</button>
                        <span style={styles.currentPageText}>Page {currentPage}</span>
                        <button 
                            disabled={!hasNext || loading} 
                            onClick={() => fetchClients(currentPage + 1, searchQuery)}
                            style={{ ...styles.pageBtn, opacity: hasNext ? 1 : 0.5 }}
                        >Next</button>
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
}

const styles = {
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 20px', borderRadius: '8px', zIndex: 9999, fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "15px", flexWrap: "wrap" },
    backBtn: { background: "#25343f", color: "white", border: "none", fontWeight: "600", cursor: "pointer", fontSize: "14px" ,borderRadius:"10px", padding:"10px"},
    searchContainer: { flex: "1 1 250px", maxWidth: "400px" },
    searchInput: { width: "100%", padding: "10px 15px", borderRadius: "10px", border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box" },
    addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" },
    pageTitle: { fontSize: "20px", color: "#1E293B", marginBottom: "15px", fontWeight: "800" },
    section: { marginBottom: "30px" },
    tableWrapper: { background: "#fff", borderRadius: "12px", overflowX: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" },
    table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "800px" },
    tableHeader: { background: "#F8FAFC", borderBottom: "1px solid #EDF2F7" },
    th: { padding: "15px", textAlign: "left", color: "#64748B", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" },
    tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
    td: { padding: "15px", verticalAlign: "middle" },
    primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
    subText: { fontSize: "12px", color: "#64748B", marginTop: "2px" },
    infoText: { fontSize: "13px", fontWeight: "600", color: "#334155" },
    infoSubText: { fontSize: "11px", color: "#94A3B8", marginTop: "2px" },
    badgeYes: { background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', display: 'inline-block' },
    badgeNo: { background: '#F1F5F9', color: '#64748B', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', display: 'inline-block' },
    createdByBadge: { fontSize: "13px", fontWeight: "600", color: "#0F172A" },
    dateText: { fontSize: "12px", color: "#64748B" },
    actionTd: { textAlign: "center" },
    actionGroup: { display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" },
    viewBtn: { background: "#F8FAFC", color: "#0F172A", border: "1px solid #CBD5E1", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" },
    editBtn: { background: "#3B82F6", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" },
    deleteBtn: { background: "#EF4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" },
    loadingTd: { textAlign: "center", padding: "40px", color: "#64748B" },
    paginationContainer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", flexWrap: "wrap", gap: "15px" },
    pageInfo: { fontSize: "13px", color: "#64748B" },
    paginationBtns: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
    pageBtn: { padding: "6px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontWeight: "600" },
    currentPageText: { fontSize: "13px", fontWeight: "700" }
};

export default ClientList;







// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// function ClientList() {
//     const navigate = useNavigate();
//     const [clients, setClients] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [searchQuery, setSearchQuery] = useState("");
    
//     // Toast state
//     const [toast, setToast] = useState({ show: false, message: "", type: "" });

//     const showToast = (message, type = "success") => {
//         setToast({ show: true, message, type });
//         setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
//     };

//     const fetchClients = async () => {
//         setLoading(true);
//         try {
//             const response = await apiRequest("/employee-portal/clients/list/", "GET");
//             setClients(response.results || []);
//         } catch (error) {
//             console.error("Error fetching clients:", error);
//             showToast("Failed to fetch clients", "error");
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchClients();
//     }, []);

//     const handleDelete = async (id, name) => {
//         // Agar aapko bina alert ke delete karna hai toh niche wala block use karein
//         try {
//             setLoading(true); // Delete ke waqt loading dikhane ke liye
//             await apiRequest(`/employee-portal/api/clients/${id}/delete/`, "DELETE");
            
//             // Custom Toast dikhayega
//             showToast(`${name} deleted successfully!`, "success");
            
//             // List refresh karega
//             fetchClients(); 
//         } catch (error) {
//             console.error("Delete failed:", error);
//             showToast("Could not delete client", "error");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const filteredClients = clients.filter(client => 
//         client.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         client.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     return (
//         <BaseLayout>
//             {/* Custom Toast Notification */}
//             {toast.show && (
//                 <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#EF4444" : "#10B981" }}>
//                     {toast.message}
//                 </div>
//             )}

//             <div style={styles.topBar}>
//                 <button onClick={() => navigate("/employee")} style={styles.backBtn}>← Back to Dashboard</button>
//                 <div style={styles.searchContainer}>
//                     <input 
//                         type="text" 
//                         placeholder="Search by client or company..." 
//                         style={styles.searchInput}
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                     />
//                 </div>
//                 <button onClick={() => navigate("/employee/client/add")} style={styles.addBtn}>
//                     + Add Client
//                 </button>
//             </div>

//             <div style={styles.section}>
//                 <h2 style={styles.pageTitle}>Client Directory ({filteredClients.length})</h2>

//                 <div style={styles.tableWrapper}>
//                     <table style={styles.table}>
//                         <thead>
//                             <tr style={styles.tableHeader}>
//                                 <th style={{ ...styles.th, width: "50px" }}>S.No</th>
//                                 <th style={{ ...styles.th, width: "220px" }}>Client & Company</th>
//                                 <th style={{ ...styles.th, width: "150px" }}>Contact Info</th>
//                                 <th style={{ ...styles.th, width: "100px" }}>Verified</th>
//                                 <th style={{ ...styles.th, width: "120px" }}>Created By</th>
//                                 <th style={{ ...styles.th, width: "120px" }}>Created Date</th>
//                                 <th style={{ ...styles.th, textAlign: "center", width: "180px" }}>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {loading ? (
//                                 <tr>
//                                     <td colSpan="7" style={styles.loadingTd}>Loading clients...</td>
//                                 </tr>
//                             ) : filteredClients.length > 0 ? (
//                                 filteredClients.map((client, index) => (
//                                     <tr key={client.id} style={styles.tableRow}>
//                                         <td style={styles.td}>{index + 1}</td>
//                                         <td style={styles.td}>
//                                             <div style={styles.primaryText}>{client.client_name}</div>
//                                             <div style={styles.subText}>{client.company_name}</div>
//                                         </td>
//                                         <td style={styles.td}>
//                                             <div style={styles.infoText}>{client.email || client.phone_number}</div>
//                                             <div style={styles.infoSubText}>{client.official_email}</div>
//                                         </td>
//                                         <td style={styles.td}>
//                                             <span style={client.is_verified ? styles.badgeYes : styles.badgeNo}>
//                                                 {client.is_verified ? "VERIFIED" : "PENDING"}
//                                             </span>
//                                         </td>
//                                         <td style={styles.td}>
//                                             <div style={styles.createdByBadge}>{client.created_by_name}</div>
//                                             <div style={{ fontSize: "10px", color: "#64748B" }}>{client.created_by_email}</div>
//                                         </td>
//                                         <td style={styles.td}>
//                                             <div style={styles.dateText}>
//                                                 {new Date(client.created_at).toLocaleDateString('en-GB', {
//                                                     day: '2-digit', month: 'short', year: 'numeric'
//                                                 })}
//                                             </div>
//                                         </td>
//                                         <td style={styles.actionTd}>
//                                             <div style={styles.actionGroup}>
//                                                 <button style={styles.viewBtn} onClick={() => navigate(`/employee/client/view/${client.id}`)}>View</button>
//                                                 <button style={styles.editBtn} onClick={() => navigate(`/employee/client/edit/${client.id}`)}>Edit</button>
//                                                 <button style={styles.deleteBtn} onClick={() => handleDelete(client.id, client.client_name)}>Del</button>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 ))
//                             ) : (
//                                 <tr>
//                                     <td colSpan="7" style={styles.loadingTd}>No clients found.</td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </BaseLayout>
//     );
// }

// const styles = {
//     toast: { position: 'fixed', top: '20px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: '0.3s' },
//     topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "15px" },
//     backBtn: { background: "transparent", color: "#64748B", border: "none", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
//     searchContainer: { flex: 1, maxWidth: "450px" },
//     searchInput: { width: "100%", padding: "12px 18px", borderRadius: "12px", border: "1px solid #E2E8F0", outline: "none", fontSize: "14px" },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 12px rgba(255, 155, 81, 0.3)" },
//     pageTitle: { fontSize: "22px", color: "#1E293B", marginBottom: "20px", fontWeight: "800" },
//     tableWrapper: { background: "#fff", borderRadius: "16px", overflowX: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", border: "1px solid #F1F5F9" },
//     table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "1100px" },
//     tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #EDF2F7" },
//     th: { padding: "16px", textAlign: "left", color: "#64748B", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9" },
//     td: { padding: "16px", verticalAlign: "middle" },
//     primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
//     subText: { fontSize: "12px", color: "#64748B", marginTop: "2px" },
//     infoText: { fontSize: "13px", color: "#334155", fontWeight: "500" },
//     infoSubText: { fontSize: "11px", color: "#94A3B8" },
//     dateText: { fontSize: "13px", color: "#475569", fontWeight: "600" },
//     createdByBadge: { color: "#0369A1", fontSize: "12px", fontWeight: "700" },
//     badgeYes: { padding: "4px 8px", background: "#DCFCE7", color: "#166534", borderRadius: "6px", fontSize: "10px", fontWeight: "800" },
//     badgeNo: { padding: "4px 8px", background: "#FEE2E2", color: "#991B1B", borderRadius: "6px", fontSize: "10px", fontWeight: "800" },
//     actionTd: { padding: "16px" },
//     actionGroup: { display: "flex", gap: "6px", justifyContent: "center" },
//     viewBtn: { padding: "7px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
//     editBtn: { padding: "7px 12px", borderRadius: "6px", border: "none", background: "#1E293B", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
//     deleteBtn: { padding: "7px 12px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
//     loadingTd: { textAlign: "center", padding: "50px", color: "#64748B" }
// };

// export default ClientList;








// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// function ClientList() {
//     const navigate = useNavigate();
//     const [clients, setClients] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [searchQuery, setSearchQuery] = useState("");

//     // Fetch Clients from API
//     const fetchClients = async () => {
//         setLoading(true);
//         try {
//             // Note: Agar pagination chahiye toh URL badal sakte hain
//             const response = await apiRequest("/employee-portal/clients/list/", "GET");
//             // Direct array aa raha hai toh seedhe set karenge
//             setClients(Array.isArray(response) ? response : response.results || []);
//         } catch (error) {
//             console.error("Error fetching clients:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchClients();
//     }, []);

//     // Filter Logic (Frontend Search)
//     const filteredClients = clients.filter(client => 
//         client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         client.company_name.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     return (
//         <BaseLayout>
//             {/* Top Navigation & Actions */}
//             <div style={styles.topBar}>
//                 <button onClick={() => navigate("/employee")} style={styles.backBtn}>← Back to Dashboard</button>
//                 <div style={styles.searchContainer}>
//                     <input 
//                         type="text" 
//                         placeholder="Search clients or companies..." 
//                         style={styles.searchInput}
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                     />
//                 </div>
//                 <button onClick={() => navigate("/employee/client/add")} style={styles.addBtn}>
//                     + Add Client
//                 </button>
//             </div>

//             <div style={styles.section}>
//                 <h2 style={styles.pageTitle}>Client Directory</h2>

//                 <div style={styles.tableWrapper}>
//                     <table style={styles.table}>
//                         <thead>
//                             <tr style={styles.tableHeader}>
//                                 <th style={styles.th}>ID</th>
//                                 <th style={styles.th}>Client Name</th>
//                                 <th style={styles.th}>Company</th>
//                                 <th style={styles.th}>Phone</th>
//                                 <th style={styles.th}>Email</th>
//                                 <th style={styles.th}>Created At</th>
//                                 <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {loading ? (
//                                 <tr>
//                                     <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>Loading clients...</td>
//                                 </tr>
//                             ) : filteredClients.length > 0 ? (
//                                 filteredClients.map((client) => (
//                                     <tr key={client.id} style={styles.tableRow}>
//                                         <td style={styles.td}>{client.id}</td>
//                                         <td style={styles.td}><strong>{client.client_name}</strong></td>
//                                         <td style={styles.td}>{client.company_name}</td>
//                                         <td style={styles.td}>{client.phone_number}</td>
//                                         <td style={styles.td}>{client.email}</td>
//                                         <td style={styles.td}>
//                                             {new Date(client.created_at).toLocaleDateString()}
//                                         </td>
//                                         <td style={styles.actionTd}>
//                                             <button style={styles.viewBtn} onClick={() => navigate(`/employee/client/view/${client.id}`)}>View</button>
//                                             <button style={styles.editBtn}>Edit</button>
//                                         </td>
//                                     </tr>
//                                 ))
//                             ) : (
//                                 <tr>
//                                     <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>No clients found.</td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </BaseLayout>
//     );
// }

// const styles = {
//     topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "15px" },
//     backBtn: { background: "transparent", color: "#25343F", border: "none", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
//     searchContainer: { flex: 1, maxWidth: "400px" },
//     searchInput: { width: "100%", padding: "10px 15px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none" },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 12px rgba(255, 155, 81, 0.3)" },
//     pageTitle: { fontSize: "24px", color: "#25343F", marginBottom: "20px", fontWeight: "800" },
//     tableWrapper: { background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(37, 52, 63, 0.08)", border: "1px solid #EAEFEF" },
//     table: { width: "100%", borderCollapse: "collapse" },
//     tableHeader: { background: "#BFC9D1" },
//     th: { padding: "16px", textAlign: "left", color: "#25343F", fontSize: "14px", fontWeight: "700" },
//     tableRow: { borderBottom: "1px solid #EAEFEF" },
//     td: { padding: "16px", color: "#25343F", fontSize: "14px" },
//     actionTd: { display: "flex", gap: "8px", padding: "16px", justifyContent: "center" },
//     viewBtn: { padding: "6px 12px", borderRadius: "6px", border: "1px solid #BFC9D1", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
//     editBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#25343F", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
// };

// export default ClientList;