import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";

function ClientList() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination & Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);

    // Filters & Modals
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedClients, setSelectedClients] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState({ show: false, clientId: null });
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [empSearch, setEmpSearch] = useState("");
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });
    const [verifyingId, setVerifyingId] = useState(null); // ✅ Verify toggle loading state

    const getAuthHeaders = () => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        return {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
    };

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const fetchClients = async (page = 1, search = "") => {
        setLoading(true);
        try {
            let url = `/sub-admin/api/clients/?page=${page}&search=${search}`;
            if (startDate) url += `&start_date=${startDate}`;
            if (endDate) url += `&end_date=${endDate}`;
            
            const response = await apiRequest(url, "GET", null, getAuthHeaders());
            
            setClients(response.results || []);
            setTotalCount(response.count || 0);
            setHasNext(!!response.next);
            setHasPrevious(!!response.previous);
            setCurrentPage(page);
        } catch (error) {
            console.error("Fetch error:", error);
            notify("Error loading clients", "error");
        } finally { setLoading(false); }
    };

    const fetchEmployees = async () => {
        try {
            const response = await apiRequest("/sub-admin/api/users/", "GET", null, getAuthHeaders());
            if (Array.isArray(response)) {
                setEmployees(response);
            } else if (response?.results && Array.isArray(response.results)) {
                setEmployees(response.results);
            } else {
                setEmployees([]);
            }
        } catch (error) { console.error("Employee fetch error:", error); }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchClients(1, searchQuery);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, startDate, endDate]);

    useEffect(() => {
        fetchEmployees();
    }, []);

    // ✅ Verify Toggle Handler
    const handleVerifyToggle = async (clientId, currentStatus) => {
        setVerifyingId(clientId);
        try {
            const response = await apiRequest(
                `/employee-portal/api/clients/${clientId}/toggle-verify/`,
                "POST",
                {},
                getAuthHeaders()
            );
            // Local state update — no re-fetch needed
            setClients(prev =>
                prev.map(c =>
                    c.id === clientId ? { ...c, is_verified: response.data?.is_verified } : c
                )
            );
            notify(response.message || (currentStatus ? "Client unverified" : "Client verified successfully"));
        } catch (error) {
            notify("Verify toggle failed", "error");
        } finally {
            setVerifyingId(null);
        }
    };

    const handleAssignSubmit = async () => {
        if (selectedClients.length === 0 || selectedEmployees.length === 0) {
            return notify("Select clients and employees first", "error");
        }
        try {
            const promises = selectedClients.map(clientId => 
                apiRequest("/sub-admin/api/clients/assign/", "POST", {
                    client_id: clientId,
                    employee_ids: selectedEmployees
                }, getAuthHeaders())
            );
            await Promise.all(promises);
            notify(`Assigned successfully`);
            setShowAssignModal(false);
            setSelectedClients([]);
            setSelectedEmployees([]);
            fetchClients(currentPage, searchQuery);
        } catch (error) { notify("Assignment Failed", "error"); }
    };

    const handleDelete = async (type) => {
        const clientId = showDeleteModal.clientId;
        const endpoint = type === 'soft' 
            ? `/sub-admin/api/clients/${clientId}/soft-delete/` 
            : `/sub-admin/api/clients/${clientId}/hard-delete/`;
        
        try {
            await apiRequest(endpoint, "DELETE", null, getAuthHeaders());
            notify(type === 'soft' ? "Client moved to trash" : "Client deleted permanently");
            setShowDeleteModal({ show: false, clientId: null });
            fetchClients(currentPage, searchQuery);
        } catch (error) {
            notify("Delete failed", "error");
        }
    };

    return (
        <BaseLayout>
            {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>{toast.msg}</div>}

            <div style={styles.topBar}>
                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={styles.dateInput} />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={styles.dateInput} />
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    {selectedClients.length > 0 && <button style={styles.assignBtn} onClick={() => setShowAssignModal(true)}>Assign ({selectedClients.length})</button>}
                    <button onClick={() => navigate("/sub-admin/client/add")} style={styles.addBtn}>+ Add Client</button>
                </div>
            </div>

            <div style={styles.section}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                    <h2 style={styles.pageTitle}>Clients ({totalCount})</h2>
                    <input 
                        placeholder="Search by client or company..." 
                        style={styles.searchInput} 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                    />
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={styles.th}>
                                    <input 
                                        type="checkbox" 
                                        onChange={() => setSelectedClients(selectedClients.length === clients.length ? [] : clients.map(c => c.id))} 
                                        checked={selectedClients.length === clients.length && clients.length > 0} 
                                    />
                                </th>
                                <th style={styles.th}>S.No</th>
                                <th style={styles.th}>Client & Company</th>
                                <th style={styles.th}>Contact</th>
                                <th style={styles.th}>Profiles</th>
                                <th style={styles.th}>Created By</th>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Verified</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9" style={{textAlign:'center', padding:'40px'}}>Loading...</td></tr>
                            ) : clients.length > 0 ? (
                                clients.map((client, index) => (
                                    <tr key={client.id} style={{...styles.tableRow, background: selectedClients.includes(client.id) ? '#F1F5F9' : 'transparent'}}>
                                        <td style={styles.td}>
                                            <input type="checkbox" checked={selectedClients.includes(client.id)} onChange={() => setSelectedClients(p => p.includes(client.id) ? p.filter(x => x !== client.id) : [...p, client.id])} />
                                        </td>
                                        <td style={styles.td}>{(currentPage - 1) * 10 + (index + 1)}</td>
                                        <td style={styles.td}>
                                            {/* ✅ Font visibility fix */}
                                            <div style={styles.primaryText}>{client.client_name}</div>
                                            <div style={styles.secondaryText}>{client.company_name}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.primaryText}>{client.phone_number || 'N/A'}</div>
                                            <div style={styles.secondaryText}>{client.email || 'No Email'}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.profileBadge}>{client.profile_count} Profiles</span>
                                        </td>
                                        <td style={styles.td}>{client.created_by_name}</td>
                                        <td style={styles.td}>{new Date(client.created_at).toLocaleDateString('en-GB')}</td>

                                        {/* ✅ Verified Badge Column */}
                                        <td style={styles.td}>
                                            <span style={client.is_verified ? styles.badgeVerified : styles.badgeUnverified}>
                                                {client.is_verified ? "✓ Verified" : "✗ Unverified"}
                                            </span>
                                        </td>

                                        <td style={styles.td}>
                                            <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
                                                <button style={styles.viewBtn} onClick={() => navigate(`/sub-admin/client/view/${client.id}`)}>View</button>
                                                <button style={styles.editBtn} onClick={() => navigate(`/sub-admin/client/edit/${client.id}`)}>Edit</button>
                                                {/* ✅ Verify Toggle Button */}
                                                <button
                                                    style={client.is_verified ? styles.unverifyBtn : styles.verifyBtn}
                                                    onClick={() => handleVerifyToggle(client.id, client.is_verified)}
                                                    disabled={verifyingId === client.id}
                                                >
                                                    {verifyingId === client.id
                                                        ? "..."
                                                        : client.is_verified ? "Unverify" : "Verify"}
                                                </button>
                                                <button style={styles.deleteBtn} onClick={() => setShowDeleteModal({show: true, clientId: client.id})}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="9" style={{textAlign:'center', padding:'40px'}}>No clients found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div style={styles.paginationContainer}>
                    <div style={styles.pageInfo}>
                        Showing {clients.length} of {totalCount} clients
                    </div>
                    <div style={styles.paginationBtns}>
                        <button 
                            disabled={!hasPrevious || loading} 
                            onClick={() => fetchClients(currentPage - 1, searchQuery)}
                            style={{ ...styles.pageBtn, opacity: hasPrevious ? 1 : 0.5 }}
                        >
                            Previous
                        </button>
                        <span style={styles.currentPageText}>Page {currentPage}</span>
                        <button 
                            disabled={!hasNext || loading} 
                            onClick={() => fetchClients(currentPage + 1, searchQuery)}
                            style={{ ...styles.pageBtn, opacity: hasNext ? 1 : 0.5 }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal.show && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={{marginTop:0}}>Delete Client?</h3>
                        <p style={{fontSize:'14px', color:'#64748B'}}>Choose delete type for Client ID: {showDeleteModal.clientId}</p>
                        <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'20px'}}>
                            <button style={styles.softDelBtn} onClick={() => handleDelete('soft')}>Move to Trash (Soft Delete)</button>
                            <button style={styles.hardDelBtn} onClick={() => handleDelete('hard')}>Delete Permanently (Hard Delete)</button>
                            <button style={styles.cancelBtn} onClick={() => setShowDeleteModal({show:false, clientId:null})}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3>Assign to Employees</h3>
                        <input placeholder="Search employee..." style={{...styles.searchInput, width:'100%', marginBottom:'10px'}} onChange={e => setEmpSearch(e.target.value)} />
                        <div style={styles.empList}>
                            {employees.filter(e => `${e.first_name} ${e.last_name}`.toLowerCase().includes(empSearch.toLowerCase())).map(emp => (
                                <div key={emp.id} style={styles.empItem}>
                                    <input type="checkbox" checked={selectedEmployees.includes(emp.id)} onChange={() => setSelectedEmployees(prev => prev.includes(emp.id) ? prev.filter(x => x !== emp.id) : [...prev, emp.id])} />
                                    <span style={{marginLeft:'10px'}}>{emp.first_name} {emp.last_name}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                            <button style={styles.saveBtn} onClick={handleAssignSubmit}>Assign Now</button>
                            <button style={styles.cancelBtn} onClick={() => setShowAssignModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </BaseLayout>
    );
}

const styles = {
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 10001, fontWeight: '700' },
    topBar: { display: "flex", justifyContent: "space-between", marginBottom: "20px", gap: "10px" },
    dateInput: { padding: '6px', borderRadius: '6px', border: '1px solid #BFC9D1', fontSize:'12px' },
    backBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer" },
    addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
    assignBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
    searchInput: { padding: "8px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", width: '250px' },
    pageTitle: { fontSize: "20px", fontWeight: "800", color: "#1E293B" },
    tableWrapper: { background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHeader: { background: "#F8FAFC" },
    th: { padding: "12px", textAlign: "left", fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: "700" },
    tableRow: { borderBottom: "1px solid #F1F5F9" },
    td: { padding: "12px", fontSize: "13px", color: "#1E293B" },
    // ✅ Font visibility fix
    primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "13px" },
    secondaryText: { fontSize: "12px", color: "#4B5563", fontWeight: "600", marginTop: "3px" },
    profileBadge: { background: "#E0F2FE", color: "#0369A1", padding: "3px 8px", borderRadius: "4px", fontWeight: "700", fontSize: '11px' },
    // ✅ Verified / Unverified badges
    badgeVerified: { padding: "4px 10px", background: "#dcfce7", color: "#166534", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" },
    badgeUnverified: { padding: "4px 10px", background: "#FEF3C7", color: "#92400E", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" },
    viewBtn: { background: "#F1F5F9", color: "#1E293B", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize:'11px', fontWeight: "600" },
    editBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize:'11px', fontWeight: "600" },
    deleteBtn: { background: "#FEE2E2", color: "#EF4444", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize:'11px', fontWeight: "600" },
    // ✅ Verify / Unverify buttons
    verifyBtn: { background: "#dcfce7", color: "#166534", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "600" },
    unverifyBtn: { background: "#FEF3C7", color: "#92400E", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "600" },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
    modalContent: { background: '#fff', padding: '25px', borderRadius: '15px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    softDelBtn: { background: '#64748B', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight:'600' },
    hardDelBtn: { background: '#EF4444', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight:'600' },
    empList: { maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '10px' },
    empItem: { display: 'flex', alignItems: 'center', marginBottom: '10px', fontSize: '13px' },
    saveBtn: { flex: 1, background: '#FF9B51', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700' },
    cancelBtn: { flex: 1, background: '#eee', color: '#333', border: 'none', padding: '10px', borderRadius: '8px', cursor:'pointer' },
    paginationContainer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", padding: "10px" },
    pageInfo: { fontSize: "13px", color: "#64748B", fontWeight: "600" },
    paginationBtns: { display: "flex", alignItems: "center", gap: "10px" },
    pageBtn: { padding: "6px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
    currentPageText: { fontWeight: "700", color: "#1E293B", fontSize: "13px" }
};

export default ClientList;









// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/SubAdminLayout";

// function ClientList() {
//     const navigate = useNavigate();
//     const [clients, setClients] = useState([]);
//     const [employees, setEmployees] = useState([]);
//     const [loading, setLoading] = useState(true);
    
//     // Pagination & Search States
//     const [searchQuery, setSearchQuery] = useState("");
//     const [currentPage, setCurrentPage] = useState(1);
//     const [totalCount, setTotalCount] = useState(0);
//     const [hasNext, setHasNext] = useState(false);
//     const [hasPrevious, setHasPrevious] = useState(false);

//     // Filters & Modals
//     const [startDate, setStartDate] = useState("");
//     const [endDate, setEndDate] = useState("");
//     const [selectedClients, setSelectedClients] = useState([]);
//     const [showAssignModal, setShowAssignModal] = useState(false);
//     const [showDeleteModal, setShowDeleteModal] = useState({ show: false, clientId: null });
//     const [selectedEmployees, setSelectedEmployees] = useState([]);
//     const [empSearch, setEmpSearch] = useState("");
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     const getAuthHeaders = () => {
//         const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//         return {
//             "Authorization": `Bearer ${token}`,
//             "Content-Type": "application/json"
//         };
//     };

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     // Modified fetch function to handle server-side search and pagination
//     const fetchClients = async (page = 1, search = "") => {
//         setLoading(true);
//         try {
//             let url = `/sub-admin/api/clients/?page=${page}&search=${search}`;
//             if (startDate) url += `&start_date=${startDate}`;
//             if (endDate) url += `&end_date=${endDate}`;
            
//             const response = await apiRequest(url, "GET", null, getAuthHeaders());
            
//             setClients(response.results || []);
//             setTotalCount(response.count || 0);
//             setHasNext(!!response.next);
//             setHasPrevious(!!response.previous);
//             setCurrentPage(page);
//         } catch (error) {
//             console.error("Fetch error:", error);
//             notify("Error loading clients", "error");
//         } finally { setLoading(false); }
//     };

//     const fetchEmployees = async () => {
//         try {
//             const response = await apiRequest("/sub-admin/api/users/", "GET", null, getAuthHeaders());
//             setEmployees(response.results || []);
//         } catch (error) { console.error("Employee fetch error:", error); }
//     };

//     // Initial load and filter change
//     useEffect(() => {
//         const delayDebounceFn = setTimeout(() => {
//             fetchClients(1, searchQuery);
//         }, 500);
//         return () => clearTimeout(delayDebounceFn);
//     }, [searchQuery, startDate, endDate]);

//     useEffect(() => {
//         fetchEmployees();
//     }, []);

//     const handleAssignSubmit = async () => {
//         if (selectedClients.length === 0 || selectedEmployees.length === 0) {
//             return notify("Select clients and employees first", "error");
//         }
//         try {
//             const promises = selectedClients.map(clientId => 
//                 apiRequest("/sub-admin/api/clients/assign/", "POST", {
//                     client_id: clientId,
//                     employee_ids: selectedEmployees
//                 }, getAuthHeaders())
//             );
//             await Promise.all(promises);
//             notify(`Assigned successfully`);
//             setShowAssignModal(false);
//             setSelectedClients([]);
//             setSelectedEmployees([]);
//             fetchClients(currentPage, searchQuery);
//         } catch (error) { notify("Assignment Failed", "error"); }
//     };

//     const handleDelete = async (type) => {
//         const clientId = showDeleteModal.clientId;
//         const endpoint = type === 'soft' 
//             ? `/sub-admin/api/clients/${clientId}/soft-delete/` 
//             : `/sub-admin/api/clients/${clientId}/hard-delete/`;
        
//         try {
//             await apiRequest(endpoint, "DELETE", null, getAuthHeaders());
//             notify(type === 'soft' ? "Client moved to trash" : "Client deleted permanently");
//             setShowDeleteModal({ show: false, clientId: null });
//             fetchClients(currentPage, searchQuery);
//         } catch (error) {
//             notify("Delete failed", "error");
//         }
//     };

//     return (
//         <BaseLayout>
//             {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>{toast.msg}</div>}

//             <div style={styles.topBar}>
//                 <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
//                     <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                     <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={styles.dateInput} />
//                     <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={styles.dateInput} />
//                 </div>
//                 <div style={{display:'flex', gap:'10px'}}>
//                     {selectedClients.length > 0 && <button style={styles.assignBtn} onClick={() => setShowAssignModal(true)}>Assign ({selectedClients.length})</button>}
//                     <button onClick={() => navigate("/sub-admin/client/add")} style={styles.addBtn}>+ Add Client</button>
//                 </div>
//             </div>

//             <div style={styles.section}>
//                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
//                     <h2 style={styles.pageTitle}>Clients ({totalCount})</h2>
//                     <input 
//                         placeholder="Search by client or company..." 
//                         style={styles.searchInput} 
//                         value={searchQuery} 
//                         onChange={e => setSearchQuery(e.target.value)} 
//                     />
//                 </div>

//                 <div style={styles.tableWrapper}>
//                     <table style={styles.table}>
//                         <thead>
//                             <tr style={styles.tableHeader}>
//                                 <th style={styles.th}>
//                                     <input 
//                                         type="checkbox" 
//                                         onChange={() => setSelectedClients(selectedClients.length === clients.length ? [] : clients.map(c => c.id))} 
//                                         checked={selectedClients.length === clients.length && clients.length > 0} 
//                                     />
//                                 </th>
//                                 <th style={styles.th}>S.No</th>
//                                 <th style={styles.th}>Client & Status</th>
//                                 <th style={styles.th}>Contact</th>
//                                 <th style={styles.th}>Profiles</th>
//                                 <th style={styles.th}>Created By</th>
//                                 <th style={styles.th}>Date</th>
//                                 <th style={styles.th}>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {loading ? (
//                                 <tr><td colSpan="8" style={{textAlign:'center', padding:'40px'}}>Loading...</td></tr>
//                             ) : clients.length > 0 ? (
//                                 clients.map((client, index) => (
//                                     <tr key={client.id} style={{...styles.tableRow, background: selectedClients.includes(client.id) ? '#F1F5F9' : 'transparent'}}>
//                                         <td style={styles.td}><input type="checkbox" checked={selectedClients.includes(client.id)} onChange={() => setSelectedClients(p => p.includes(client.id) ? p.filter(x => x !== client.id) : [...p, client.id])} /></td>
//                                         <td style={styles.td}>{(currentPage - 1) * 10 + (index + 1)}</td>
//                                         <td style={styles.td}>
//                                             <div style={{fontWeight:'700'}}>{client.client_name}</div>
//                                             <div style={{display:'flex', gap:'5px', marginTop:'4px'}}>
//                                                 <small style={{color:'#64748B'}}>{client.company_name}</small>
//                                                 {client.is_verified ? 
//                                                     <span style={{color:'green', fontSize:'10px'}}>● Verified</span> : 
//                                                     <span style={{color:'orange', fontSize:'10px'}}>● Unverified</span>
//                                                 }
//                                             </div>
//                                         </td>
//                                         <td style={styles.td}>{client.phone_number || 'N/A'}<br/><small>{client.email}</small></td>
//                                         <td style={styles.td}><span style={styles.profileBadge}>{client.profile_count} Profiles</span></td>
//                                         <td style={styles.td}>{client.created_by_name}</td>
//                                         <td style={styles.td}>{new Date(client.created_at).toLocaleDateString('en-GB')}</td>
//                                         <td style={styles.td}>
//                                             <div style={{display:'flex', gap:'5px'}}>
//                                                 <button style={styles.viewBtn} onClick={() => navigate(`/sub-admin/client/view/${client.id}`)}>View</button>
//                                                 <button style={styles.editBtn} onClick={() => navigate(`/sub-admin/client/edit/${client.id}`)}>Edit</button>
//                                                 <button style={styles.deleteBtn} onClick={() => setShowDeleteModal({show: true, clientId: client.id})}>Delete</button>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 ))
//                             ) : (
//                                 <tr><td colSpan="8" style={{textAlign:'center', padding:'40px'}}>No clients found.</td></tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Pagination Controls */}
//                 <div style={styles.paginationContainer}>
//                     <div style={styles.pageInfo}>
//                         Showing {clients.length} of {totalCount} clients
//                     </div>
//                     <div style={styles.paginationBtns}>
//                         <button 
//                             disabled={!hasPrevious || loading} 
//                             onClick={() => fetchClients(currentPage - 1, searchQuery)}
//                             style={{ ...styles.pageBtn, opacity: hasPrevious ? 1 : 0.5 }}
//                         >
//                             Previous
//                         </button>
//                         <span style={styles.currentPageText}>Page {currentPage}</span>
//                         <button 
//                             disabled={!hasNext || loading} 
//                             onClick={() => fetchClients(currentPage + 1, searchQuery)}
//                             style={{ ...styles.pageBtn, opacity: hasNext ? 1 : 0.5 }}
//                         >
//                             Next
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             {/* Modals remain same as your original code */}
//             {showDeleteModal.show && (
//                 <div style={styles.modalOverlay}>
//                     <div style={styles.modalContent}>
//                         <h3 style={{marginTop:0}}>Delete Client?</h3>
//                         <p style={{fontSize:'14px', color:'#64748B'}}>Choose delete type for Client ID: {showDeleteModal.clientId}</p>
//                         <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'20px'}}>
//                             <button style={styles.softDelBtn} onClick={() => handleDelete('soft')}>Move to Trash (Soft Delete)</button>
//                             <button style={styles.hardDelBtn} onClick={() => handleDelete('hard')}>Delete Permanently (Hard Delete)</button>
//                             <button style={styles.cancelBtn} onClick={() => setShowDeleteModal({show:false, clientId:null})}>Cancel</button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {showAssignModal && (
//                 <div style={styles.modalOverlay}>
//                     <div style={styles.modalContent}>
//                         <h3>Assign to Employees</h3>
//                         <input placeholder="Search employee..." style={{...styles.searchInput, width:'100%', marginBottom:'10px'}} onChange={e => setEmpSearch(e.target.value)} />
//                         <div style={styles.empList}>
//                             {employees.filter(e => `${e.first_name} ${e.last_name}`.toLowerCase().includes(empSearch.toLowerCase())).map(emp => (
//                                 <div key={emp.id} style={styles.empItem}>
//                                     <input type="checkbox" checked={selectedEmployees.includes(emp.id)} onChange={() => setSelectedEmployees(prev => prev.includes(emp.id) ? prev.filter(x => x !== emp.id) : [...prev, emp.id])} />
//                                     <span style={{marginLeft:'10px'}}>{emp.first_name} {emp.last_name}</span>
//                                 </div>
//                             ))}
//                         </div>
//                         <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
//                             <button style={styles.saveBtn} onClick={handleAssignSubmit}>Assign Now</button>
//                             <button style={styles.cancelBtn} onClick={() => setShowAssignModal(false)}>Cancel</button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </BaseLayout>
//     );
// }

// const styles = {
//     // ... aapke purane styles yahan rahenge
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 10001, fontWeight: '700' },
//     topBar: { display: "flex", justifyContent: "space-between", marginBottom: "20px", gap: "10px" },
//     dateInput: { padding: '6px', borderRadius: '6px', border: '1px solid #BFC9D1', fontSize:'12px' },
//     backBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer" },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
//     assignBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
//     searchInput: { padding: "8px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", width: '250px' },
//     pageTitle: { fontSize: "20px", fontWeight: "800", color: "#1E293B" },
//     tableWrapper: { background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" },
//     table: { width: "100%", borderCollapse: "collapse" },
//     tableHeader: { background: "#F8FAFC" },
//     th: { padding: "12px", textAlign: "left", fontSize: "11px", color: "#64748B", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9" },
//     td: { padding: "12px", fontSize: "13px" },
//     profileBadge: { background: "#E0F2FE", color: "#0369A1", padding: "3px 8px", borderRadius: "4px", fontWeight: "700", fontSize: '11px' },
//     viewBtn: { background: "#F1F5F9", color: "#1E293B", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize:'11px' },
//     editBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize:'11px' },
//     deleteBtn: { background: "#FEE2E2", color: "#EF4444", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize:'11px' },
//     modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
//     modalContent: { background: '#fff', padding: '25px', borderRadius: '15px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
//     softDelBtn: { background: '#64748B', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight:'600' },
//     hardDelBtn: { background: '#EF4444', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight:'600' },
//     empList: { maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '10px' },
//     empItem: { display: 'flex', alignItems: 'center', marginBottom: '10px', fontSize: '13px' },
//     saveBtn: { flex: 1, background: '#FF9B51', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700' },
//     cancelBtn: { flex: 1, background: '#eee', color: '#333', border: 'none', padding: '10px', borderRadius: '8px', cursor:'pointer' },

//     // New Pagination Styles
//     paginationContainer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", padding: "10px" },
//     pageInfo: { fontSize: "13px", color: "#64748B", fontWeight: "600" },
//     paginationBtns: { display: "flex", alignItems: "center", gap: "10px" },
//     pageBtn: { padding: "6px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
//     currentPageText: { fontWeight: "700", color: "#1E293B", fontSize: "13px" }
// };

// export default ClientList;



