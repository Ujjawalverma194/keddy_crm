import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";

function VendorList() {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);
    const PAGE_SIZE = 10; 

    const fetchVendors = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const url = `/employee-portal/api/user/vendors/?page=${page}&search=${search}`;
            const response = await apiRequest(url, "GET");

            setVendors(response.results || []);
            setTotalCount(response.count || 0);
            setHasNext(!!response.next);
            setHasPrev(!!response.previous);
        } catch (error) {
            console.error("Error fetching vendors:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchVendors(currentPage, searchQuery);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, searchQuery]);

    // Updated Delete Logic with your API
    const handleDelete = async (id, name) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete vendor: ${name}?`);
        if (confirmDelete) {
            try {
                // API Call for Soft Delete
                await apiRequest(`/employee-portal/api/vendors/${id}/delete/`, "DELETE");
                alert("Vendor deleted successfully!");
                // List refresh karne ke liye
                fetchVendors(currentPage, searchQuery);
            } catch (error) {
                console.error("Delete failed:", error);
                alert("Could not delete vendor.");
            }
        }
    };

    return (
        <BaseLayout>
            <div style={styles.topBar}>
                <button onClick={() => navigate("/employee")} style={styles.backBtn}>
                    ← Back to Dashboard
                </button>
                <div style={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Search vendors..."
                        style={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <button onClick={() => navigate("/employee/vendor/add")} style={styles.addBtn}>
                    + Add Vendor
                </button>
            </div>

            <div style={styles.section}>
                <h2 style={styles.pageTitle}>Vendors ({totalCount})</h2>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.th, width: "50px" }}>S.No</th>
                                <th style={{ ...styles.th, width: "180px" }}>Vendor Details</th>
                                <th style={{ ...styles.th, width: "150px" }}>Company</th>
                                <th style={{ ...styles.th, width: "140px" }}>Tech Stack</th>
                                <th style={{ ...styles.th, width: "80px" }}>Profiles</th>
                                <th style={{ ...styles.th, width: "110px" }}>Created By</th>
                                <th style={{ ...styles.th, width: "70px" }}>Onsite</th>
                                <th style={{ ...styles.th, textAlign: "center", width: "180px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={styles.loadingTd}>Loading vendors...</td>
                                </tr>
                            ) : vendors.length > 0 ? (
                                vendors.map((vendor, index) => (
                                    <tr key={vendor.id} style={styles.tableRow}>
                                        <td style={styles.td}>
                                            {(currentPage - 1) * PAGE_SIZE + index + 1}
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.vendorName}>{vendor.name}</div>
                                            <div style={styles.subText}>{vendor.email || vendor.number}</div>
                                        </td>
                                        <td style={styles.td}>{vendor.company_name}</td>
                                        <td style={styles.td}>
                                            <span style={styles.techBadge} title={vendor.specialized_tech_developers}>
                                                {vendor.specialized_tech_developers || "N/A"}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.profileBadge}>{vendor.profile_count}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.createdByBadge}>{vendor.created_by_name}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={vendor.provide_onsite ? styles.badgeYes : styles.badgeNo}>
                                                {vendor.provide_onsite ? "YES" : "NO"}
                                            </span>
                                        </td>
                                        <td style={styles.actionTd}>
                                            <div style={styles.actionGroup}>
                                                <button style={styles.viewBtn} onClick={() => navigate(`/employee/vendor/view/${vendor.id}`)}>View</button>
                                                <button style={styles.editBtn} onClick={() => navigate(`/employee/vendor/edit/${vendor.id}`)}>Edit</button>
                                                <button style={styles.deleteBtn} onClick={() => handleDelete(vendor.id, vendor.name)}>Del</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" style={styles.loadingTd}>No vendors found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={styles.pagination}>
                    <button 
                        disabled={!hasPrev || loading} 
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        style={{ ...styles.pageStep, opacity: hasPrev ? 1 : 0.5 }}
                    >
                        Previous
                    </button>
                    <div style={styles.pageNumbers}>
                        <button style={{ ...styles.pageNum, ...styles.activePage }}>{currentPage}</button>
                    </div>
                    <button 
                        disabled={!hasNext || loading} 
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        style={{ ...styles.pageStep, opacity: hasNext ? 1 : 0.5 }}
                    >
                        Next
                    </button>
                </div>
            </div>
        </BaseLayout>
    );
}

const styles = {
    // Styles same as previous - optimized for spacing
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "15px" },
    backBtn: { background: "transparent", color: "#64748B", border: "none", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
    searchContainer: { flex: 1, maxWidth: "450px" },
    searchInput: { width: "100%", padding: "12px 18px", borderRadius: "12px", border: "1px solid #E2E8F0", outline: "none", fontSize: "14px" },
    addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" },
    pageTitle: { fontSize: "22px", color: "#1E293B", marginBottom: "20px", fontWeight: "800" },
    tableWrapper: { background: "#fff", borderRadius: "16px", overflowX: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", border: "1px solid #F1F5F9" },
    table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "1100px" },
    tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #EDF2F7" },
    th: { padding: "16px", textAlign: "left", color: "#64748B", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" },
    tableRow: { borderBottom: "1px solid #F1F5F9" },
    td: { padding: "16px", verticalAlign: "middle", fontSize: "14px", color: "#334155" },
    vendorName: { fontWeight: "700", color: "#1E293B" },
    subText: { fontSize: "12px", color: "#64748B", marginTop: "2px" },
    profileBadge: { background: "#F1F5F9", color: "#475569", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
    createdByBadge: { background: "#E0F2FE", color: "#0369A1", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" },
    techBadge: { display: "inline-block", maxWidth: "120px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" },
    badgeYes: { padding: "5px 10px", background: "#DCFCE7", color: "#166534", borderRadius: "6px", fontSize: "11px", fontWeight: "800" },
    badgeNo: { padding: "5px 10px", background: "#FEE2E2", color: "#991B1B", borderRadius: "6px", fontSize: "11px", fontWeight: "800" },
    actionTd: { padding: "16px" },
    actionGroup: { display: "flex", gap: "6px", justifyContent: "center" },
    viewBtn: { padding: "7px 10px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
    editBtn: { padding: "7px 10px", borderRadius: "6px", border: "none", background: "#1E293B", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
    deleteBtn: { padding: "7px 10px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
    loadingTd: { textAlign: "center", padding: "50px", color: "#64748B" },
    pagination: { display: "flex", justifyContent: "center", alignItems: "center", marginTop: "30px", gap: "15px" },
    pageStep: { padding: "10px 20px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "10px", cursor: "pointer", fontWeight: "600" },
    pageNumbers: { display: "flex", gap: "8px" },
    pageNum: { width: "40px", height: "40px", borderRadius: "10px", border: "1px solid #E2E8F0", background: "#fff", fontWeight: "700" },
    activePage: { background: "#FF9B51", borderColor: "#FF9B51", color: "#fff" }
};

export default VendorList;



// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// function VendorList() {
//     const navigate = useNavigate();
//     const [vendors, setVendors] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [currentPage, setCurrentPage] = useState(1);
//     const [searchQuery, setSearchQuery] = useState("");
//     const [totalCount, setTotalCount] = useState(0);
//     const [hasNext, setHasNext] = useState(false);
//     const [hasPrev, setHasPrev] = useState(false);
//     const PAGE_SIZE = 10; // Aapki API jitne results ek baar mein deti hai

//     const fetchVendors = async (page = 1, search = "") => {
//         setLoading(true);
//         try {
//             const url = `/employee-portal/api/user/vendors/?page=${page}&search=${search}`;
//             const response = await apiRequest(url, "GET");

//             setVendors(response.results || []);
//             setTotalCount(response.count || 0);
//             setHasNext(!!response.next);
//             setHasPrev(!!response.previous);
//         } catch (error) {
//             console.error("Error fetching vendors:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         const delayDebounceFn = setTimeout(() => {
//             fetchVendors(currentPage, searchQuery);
//         }, 500);
//         return () => clearTimeout(delayDebounceFn);
//     }, [currentPage, searchQuery]);

//     const handleDelete = async (id, name) => {
//         const confirmDelete = window.confirm(`Are you sure you want to delete vendor: ${name}?`);
//         if (confirmDelete) {
//             try {
//                 await apiRequest(`/employee-portal/api/vendors/${id}/delete/`, "DELETE");
//                 alert("Vendor deleted successfully!");
//                 fetchVendors(currentPage, searchQuery);
//             } catch (error) {
//                 console.error("Delete failed:", error);
//                 alert("Could not delete vendor.");
//             }
//         }
//     };

//     return (
//         <BaseLayout>
//             <div style={styles.topBar}>
//                 <button onClick={() => navigate("/employee")} style={styles.backBtn}>
//                     ← Back to Dashboard
//                 </button>
//                 <div style={styles.searchContainer}>
//                     <input
//                         type="text"
//                         placeholder="Search vendors..."
//                         style={styles.searchInput}
//                         value={searchQuery}
//                         onChange={(e) => {
//                             setSearchQuery(e.target.value);
//                             setCurrentPage(1);
//                         }}
//                     />
//                 </div>
//                 <button onClick={() => navigate("/employee/vendor/add")} style={styles.addBtn}>
//                     + Add Vendor
//                 </button>
//             </div>

//             <div style={styles.section}>
//                 <h2 style={styles.pageTitle}>Vendors ({totalCount})</h2>

//                 <div style={styles.tableWrapper}>
//                     <table style={styles.table}>
//                         <thead>
//                             <tr style={styles.tableHeader}>
//                                 <th style={{ ...styles.th, width: "60px" }}>S.No</th>
//                                 <th style={{ ...styles.th, width: "180px" }}>Vendor Name</th>
//                                 <th style={{ ...styles.th, width: "150px" }}>Company</th>
//                                 <th style={{ ...styles.th, width: "150px" }}>Tech Stack</th>
//                                 <th style={{ ...styles.th, width: "100px" }}>Created By</th>
//                                 <th style={{ ...styles.th, width: "80px" }}>Onsite</th>
//                                 <th style={{ ...styles.th, textAlign: "center", width: "180px" }}>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {loading ? (
//                                 <tr>
//                                     <td colSpan="7" style={styles.loadingTd}>Loading vendors...</td>
//                                 </tr>
//                             ) : vendors.length > 0 ? (
//                                 vendors.map((vendor, index) => (
//                                     <tr key={vendor.id} style={styles.tableRow}>
//                                         {/* Serial Number Logic */}
//                                         <td style={styles.td}>
//                                             {(currentPage - 1) * PAGE_SIZE + index + 1}
//                                         </td>
//                                         <td style={styles.td}>
//                                             <div style={styles.vendorName}>{vendor.name}</div>
//                                             <div style={styles.subText}>{vendor.email || vendor.number}</div>
//                                         </td>
//                                         <td style={styles.td}>{vendor.company_name}</td>
//                                         <td style={styles.td}>
//                                             <span style={styles.techBadge} title={vendor.specialized_tech_developers}>
//                                                 {vendor.specialized_tech_developers || "N/A"}
//                                             </span>
//                                         </td>
//                                         <td style={styles.td}>
//                                             <span style={styles.createdByBadge}>{vendor.created_by_name}</span>
//                                         </td>
//                                         <td style={styles.td}>
//                                             <span style={vendor.provide_onsite ? styles.badgeYes : styles.badgeNo}>
//                                                 {vendor.provide_onsite ? "YES" : "NO"}
//                                             </span>
//                                         </td>
//                                         <td style={styles.actionTd}>
//                                             <div style={styles.actionGroup}>
//                                                 <button style={styles.viewBtn} onClick={() => navigate(`/employee/vendor/view/${vendor.id}`)}>View</button>
//                                                 <button style={styles.editBtn} onClick={() => navigate(`/employee/vendor/edit/${vendor.id}`)}>Edit</button>
//                                                 <button style={styles.deleteBtn} onClick={() => handleDelete(vendor.id, vendor.name)}>Del</button>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 ))
//                             ) : (
//                                 <tr>
//                                     <td colSpan="7" style={styles.loadingTd}>No vendors found.</td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 <div style={styles.pagination}>
//                     <button 
//                         disabled={!hasPrev || loading} 
//                         onClick={() => setCurrentPage(prev => prev - 1)}
//                         style={{ ...styles.pageStep, opacity: hasPrev ? 1 : 0.5 }}
//                     >
//                         Previous
//                     </button>
//                     <div style={styles.pageNumbers}>
//                         <button style={{ ...styles.pageNum, ...styles.activePage }}>{currentPage}</button>
//                     </div>
//                     <button 
//                         disabled={!hasNext || loading} 
//                         onClick={() => setCurrentPage(prev => prev + 1)}
//                         style={{ ...styles.pageStep, opacity: hasNext ? 1 : 0.5 }}
//                     >
//                         Next
//                     </button>
//                 </div>
//             </div>
//         </BaseLayout>
//     );
// }

// const styles = {
//     topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "15px" },
//     backBtn: { background: "transparent", color: "#64748B", border: "none", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
//     searchContainer: { flex: 1, maxWidth: "450px" },
//     searchInput: { width: "100%", padding: "12px 18px", borderRadius: "12px", border: "1px solid #E2E8F0", outline: "none", fontSize: "14px" },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" },
//     pageTitle: { fontSize: "22px", color: "#1E293B", marginBottom: "20px", fontWeight: "800" },
    
//     tableWrapper: { background: "#fff", borderRadius: "16px", overflowX: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", border: "1px solid #F1F5F9" },
//     table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "1000px" },
//     tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #EDF2F7" },
//     th: { padding: "16px", textAlign: "left", color: "#64748B", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9" },
//     td: { padding: "16px", verticalAlign: "middle", fontSize: "14px", color: "#334155" },
    
//     vendorName: { fontWeight: "700", color: "#1E293B" },
//     subText: { fontSize: "12px", color: "#64748B", marginTop: "2px" },
    
//     // Created By Badge
//     createdByBadge: { background: "#E0F2FE", color: "#0369A1", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" },

//     techBadge: { 
//         display: "inline-block", maxWidth: "130px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
//         background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600"
//     },

//     badgeYes: { padding: "5px 10px", background: "#DCFCE7", color: "#166534", borderRadius: "6px", fontSize: "11px", fontWeight: "800" },
//     badgeNo: { padding: "5px 10px", background: "#FEE2E2", color: "#991B1B", borderRadius: "6px", fontSize: "11px", fontWeight: "800" },
    
//     actionTd: { padding: "16px" },
//     actionGroup: { display: "flex", gap: "6px", justifyContent: "center" },
//     viewBtn: { padding: "7px 10px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
//     editBtn: { padding: "7px 10px", borderRadius: "6px", border: "none", background: "#1E293B", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
//     deleteBtn: { padding: "7px 10px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
    
//     loadingTd: { textAlign: "center", padding: "50px", color: "#64748B" },
//     pagination: { display: "flex", justifyContent: "center", alignItems: "center", marginTop: "30px", gap: "15px" },
//     pageStep: { padding: "10px 20px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "10px", cursor: "pointer", fontWeight: "600" },
//     pageNumbers: { display: "flex", gap: "8px" },
//     pageNum: { width: "40px", height: "40px", borderRadius: "10px", border: "1px solid #E2E8F0", background: "#fff", fontWeight: "700" },
//     activePage: { background: "#FF9B51", borderColor: "#FF9B51", color: "#fff" }
// };

// export default VendorList;






// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// function VendorList() {
//     const navigate = useNavigate();
//     const [vendors, setVendors] = useState([]);
//     const [loading, setLoading] = useState(true);

//     // Pagination & Filter States
//     const [currentPage, setCurrentPage] = useState(1);
//     const [searchQuery, setSearchQuery] = useState("");
//     const [totalCount, setTotalCount] = useState(0);
//     const [hasNext, setHasNext] = useState(false);
//     const [hasPrev, setHasPrev] = useState(false);

//     // Fetch Vendors from API
//     const fetchVendors = async(page = 1, search = "") => {
//         setLoading(true);
//         try {
//             // API: /vendors/?page=1&search=query
//             const url = `/employee-portal/api/user/vendors/?page=${page}&search=${search}`;
//             const response = await apiRequest(url, "GET");

//             setVendors(response.results || []);
//             setTotalCount(response.count || 0);
//             setHasNext(!!response.next);
//             setHasPrev(!!response.previous);
//         } catch (error) {
//             console.error("Error fetching vendors:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         // Debounce search logic (wait 500ms after typing)
//         const delayDebounceFn = setTimeout(() => {
//             fetchVendors(currentPage, searchQuery);
//         }, 500);

//         return () => clearTimeout(delayDebounceFn);
//     }, [currentPage, searchQuery]);

//     // Handle Delete
//     const handleDelete = async(id, name) => {
//         const confirmDelete = window.confirm(`Are you sure you want to delete vendor: ${name}?`);
//         if (confirmDelete) {
//             try {
//                 await apiRequest(`/employee-portal/api/vendors/${id}/delete/`, "DELETE");
//                 alert("Vendor deleted successfully!");
//                 // Refresh list
//                 fetchVendors(currentPage, searchQuery);
//             } catch (error) {
//                 console.error("Delete failed:", error);
//                 alert("Could not delete vendor.");
//             }
//         }
//     };

//     return ( <
//         BaseLayout > { /* Top Navigation & Actions */ } <
//         div style = { styles.topBar } >
//         <
//         button onClick = {
//             () => navigate("/employee")
//         }
//         style = { styles.backBtn } > ←Back to Dashboard < /button> <
//         div style = { styles.searchContainer } >
//         <
//         input type = "text"
//         placeholder = "Search vendors (name, tech...)"
//         style = { styles.searchInput }
//         value = { searchQuery }
//         onChange = {
//             (e) => {
//                 setSearchQuery(e.target.value);
//                 setCurrentPage(1); // Reset to page 1 on new search
//             }
//         }
//         /> < /
//         div > <
//         button onClick = {
//             () => navigate("/employee/vendor/add")
//         }
//         style = { styles.addBtn } >
//         +Add Vendor <
//         /button> < /
//         div >

//         <
//         div style = { styles.section } >
//         <
//         h2 style = { styles.pageTitle } > Vendors({ totalCount }) < /h2>

//         <
//         div style = { styles.tableWrapper } >
//         <
//         table style = { styles.table } >
//         <
//         thead >
//         <
//         tr style = { styles.tableHeader } >
//         <
//         th style = { styles.th } > ID < /th> <
//         th style = { styles.th } > Vendor Name < /th> <
//         th style = { styles.th } > Contact < /th> <
//         th style = { styles.th } > Company < /th> <
//         th style = { styles.th } > Specialized Tech < /th> <
//         th style = { styles.th } > Onsite < /th> <
//         th style = {
//             {...styles.th, textAlign: "center" }
//         } > Actions < /th> < /
//         tr > <
//         /thead> <
//         tbody > {
//             loading ? ( <
//                 tr >
//                 <
//                 td colSpan = "7"
//                 style = {
//                     { textAlign: "center", padding: "40px" }
//                 } > Loading vendors... < /td> < /
//                 tr >
//             ) : vendors.length > 0 ? (
//                 vendors.map((vendor) => ( <
//                     tr key = { vendor.id }
//                     style = { styles.tableRow } >
//                     <
//                     td style = { styles.td } > { vendor.id } < /td> <
//                     td style = { styles.td } > < strong > { vendor.name } < /strong></td >
//                     <
//                     td style = { styles.td } > { vendor.number } < /td> <
//                     td style = { styles.td } > { vendor.company_name } < /td> <
//                     td style = { styles.td } > { vendor.specialized_tech_developers || "N/A" } < /td> <
//                     td style = { styles.td } >
//                     <
//                     span style = { vendor.provide_onsite ? styles.badgeYes : styles.badgeNo } > { vendor.provide_onsite ? "YES" : "NO" } <
//                     /span> < /
//                     td > <
//                     td style = { styles.actionTd } >
//                     <
//                     button style = { styles.viewBtn }
//                     onClick = {
//                         () => navigate(`/employee/vendor/view/${vendor.id}`)
//                     } >
//                     View < /button> <
//                     button style = { styles.editBtn }
//                     onClick = {
//                         () => navigate(`/employee/vendor/edit/${vendor.id}`)
//                     } >
//                     Edit < /button> <
//                     button style = { styles.deleteBtn }
//                     onClick = {
//                         () => handleDelete(vendor.id, vendor.name)
//                     } >
//                     Delete < /button> < /
//                     td > <
//                     /tr>
//                 ))
//             ) : ( <
//                 tr >
//                 <
//                 td colSpan = "7"
//                 style = {
//                     { textAlign: "center", padding: "40px" }
//                 } > No vendors found. < /td> < /
//                 tr >
//             )
//         } <
//         /tbody> < /
//         table > <
//         /div>

//         { /* Dynamic Pagination Section */ } <
//         div style = { styles.pagination } >
//         <
//         button disabled = {!hasPrev || loading }
//         onClick = {
//             () => setCurrentPage(prev => prev - 1)
//         }
//         style = {
//             {...styles.pageStep, opacity: hasPrev ? 1 : 0.5 }
//         } >
//         Previous < /button>

//         <
//         div style = { styles.pageNumbers } >
//         <
//         button style = {
//             {...styles.pageNum, ...styles.activePage }
//         } > { currentPage } < /button> < /
//         div >

//         <
//         button disabled = {!hasNext || loading }
//         onClick = {
//             () => setCurrentPage(prev => prev + 1)
//         }
//         style = {
//             {...styles.pageStep, opacity: hasNext ? 1 : 0.5 }
//         } >
//         Next < /button> < /
//         div > <
//         /div> < /
//         BaseLayout >
//     );
// }

// const styles = {
//     topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "15px" },
//     backBtn: { background: "transparent", color: "#25343F", border: "none", fontSize: "15px", fontWeight: "700", cursor: "pointer", padding: "0" },
//     searchContainer: { flex: 1, maxWidth: "400px" },
//     searchInput: { width: "100%", padding: "10px 15px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none", background: "#fff" },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 12px rgba(255, 155, 81, 0.3)" },
//     pageTitle: { fontSize: "24px", color: "#25343F", marginBottom: "20px", fontWeight: "800" },
//     tableWrapper: { background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(37, 52, 63, 0.08)", border: "1px solid #EAEFEF" },
//     table: { width: "100%", borderCollapse: "collapse" },
//     tableHeader: { background: "#BFC9D1" },
//     th: { padding: "16px", textAlign: "left", color: "#25343F", fontSize: "14px", fontWeight: "700" },
//     tableRow: { borderBottom: "1px solid #EAEFEF" },
//     td: { padding: "16px", color: "#25343F", fontSize: "14px" },
//     actionTd: { display: "flex", gap: "8px", padding: "16px", justifyContent: "center" },
//     badgeYes: { padding: "4px 8px", background: "#dcfce7", color: "#166534", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" },
//     badgeNo: { padding: "4px 8px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" },
//     viewBtn: { padding: "6px 12px", borderRadius: "6px", border: "1px solid #BFC9D1", background: "#fff", color: "#25343F", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
//     editBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#25343F", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
//     deleteBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#fee2e2", color: "#991b1b", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
//     pagination: { display: "flex", justifyContent: "center", alignItems: "center", marginTop: "30px", gap: "20px" },
//     pageStep: { padding: "8px 16px", background: "#fff", border: "1px solid #BFC9D1", borderRadius: "8px", color: "#25343F", cursor: "pointer", fontWeight: "600" },
//     pageNumbers: { display: "flex", gap: "8px" },
//     pageNum: { width: "35px", height: "35px", borderRadius: "8px", border: "1px solid #BFC9D1", background: "#fff", cursor: "pointer", fontWeight: "600", color: "#25343F" },
//     activePage: { background: "#FF9B51", borderColor: "#FF9B51", color: "#fff" }
// };

// export default VendorList;
