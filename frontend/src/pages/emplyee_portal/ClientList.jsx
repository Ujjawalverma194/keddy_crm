import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";
import ProfilesPreviewModal from "../components/ProfilesPreviewModal";

function ClientList() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profilesModal, setProfilesModal] = useState({ isOpen: false, clientId: null, clientName: "" });
    const [clientProfileCounts, setClientProfileCounts] = useState({});
    const [profileCountsLoading, setProfileCountsLoading] = useState(false);
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


    const normalizePaginatedResults = (res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.results)) return res.results;
        return [];
    };

    const fetchAllProfilesFromEndpoint = async (baseUrl, separator = '?') => {
        const firstRes = await apiRequest(
            `${baseUrl}${separator}page=1&page_size=100`,
            "GET",
            null);

        const totalRecords = firstRes?.count || normalizePaginatedResults(firstRes).length || 0;
        const totalPages = Math.ceil(totalRecords / 100) || 1;
        let allProfiles = normalizePaginatedResults(firstRes);

        for (let page = 2; page <= totalPages; page += 1) {
            const pageRes = await apiRequest(
                `${baseUrl}${separator}page=${page}&page_size=100`,
                "GET",
                null);
            allProfiles = [...allProfiles, ...normalizePaginatedResults(pageRes)];
        }

        return allProfiles;
    };

    const fetchClientSubmittedProfileCounts = async (clientList = []) => {
        if (!Array.isArray(clientList) || clientList.length === 0) {
            setClientProfileCounts({});
            return;
        }

        setProfileCountsLoading(true);
        try {
            const endpoints = [
                "/employee-portal/api/user/candidates/list/",
                "/employee-portal/api/submitted-profiles/",
            ];

            let allProfiles = [];

            for (const endpoint of endpoints) {
                try {
                    const endpointProfiles = await fetchAllProfilesFromEndpoint(endpoint);
                    if (endpointProfiles.length > 0) {
                        allProfiles = endpointProfiles;
                        break;
                    }
                } catch (error) {
                    console.warn("Profile count endpoint failed:", endpoint, error);
                }
            }

            const counts = {};

            clientList.forEach((client) => {
                const calculatedCount = allProfiles.filter((candidate) =>
                    candidate.client_id === client.id || 
                    (candidate.client && candidate.client.id === client.id) ||
                    (candidate.clientCompany && candidate.clientCompany.id === client.id)
                ).length;

                counts[client.id] = calculatedCount || client.profile_count || 0;
            });

            setClientProfileCounts(counts);
        } catch (error) {
            console.error("Client submitted profile count fetch error:", error);
        } finally {
            setProfileCountsLoading(false);
        }
    };

    const renderProfileCount = (client) => {
        if (profileCountsLoading) {
            return "Loading...";
        }
        return `${clientProfileCounts[client.id] || 0} Profiles`;
    };

    const fetchClients = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const response = await apiRequest(`/employee-portal/api/clients/list/?page=${page}&search=${search}`, "GET");
            
            // ✅ Debug log - remove after checking
            if (response.results?.[0]) {
                console.log("🔍 Sample client object keys:", Object.keys(response.results[0]));
                console.log("🔍 created_by field:", response.results[0].created_by);
            }
            console.log(response)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                                <th style={styles.th}>Client Company</th>
                                <th style={{ ...styles.th, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Points of Contact
                                </th>
                                <th style={styles.th}>Profiles</th>
                                <th style={styles.th}>Created By</th>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Verified</th>
                                <th style={styles.th}>Actions</th>
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
                                            <td style={styles.td}>
                                                <div style={styles.primaryText}>{client.company_name}</div>
                                                <div style={styles.subText}>{client.billing_address || "No Address"}</div>
                                            </td>
                                            <td style={styles.td}>
                                                {(client.pocs || []).map(poc => (
                                                    <div key={poc.id} style={{ marginBottom: '8px', padding: '4px', background: '#F8FAFC', borderRadius: '4px' }}>
                                                        <div style={{ ...styles.primaryText, fontSize: '13px' }}>{poc.name} {poc.isPrimary && <span style={{fontSize: '10px', color: '#f39c12'}}>(Primary)</span>}</div>
                                                        <div style={{ ...styles.subText, fontSize: '11px' }}>
                                                            {poc.number || "No Number"} | {poc.email || "No Email"}
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!client.pocs || client.pocs.length === 0) && (
                                                    <span style={{color: '#999', fontSize: '12px'}}>No POCs</span>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <span 
                                                    style={{...styles.badgeYes, cursor: 'pointer', backgroundColor: '#FEF3C7', color: '#D97706'}}
                                                    onClick={() => setProfilesModal({ isOpen: true, clientId: client.id, clientName: client.company_name || client.client_name })}
                                                >
                                                    {renderProfileCount(client)}
                                                </span>
                                            </td>
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
                                            <td style={styles.td}>
                                                <span style={client.is_verified ? styles.badgeYes : styles.badgeNo}>
                                                    {client.is_verified ? "VERIFIED" : "PENDING"}
                                                </span>
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
            <ProfilesPreviewModal 
                isOpen={profilesModal.isOpen} 
                onClose={() => setProfilesModal({ isOpen: false, clientId: null, clientName: "" })} 
                title={`Profiles for ${profilesModal.clientName}`} 
                fetchEndpoint={`/employee-portal/api/user/candidates/list/?client_id=${profilesModal.clientId}`} 
                userRole="employee" 
            />
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






