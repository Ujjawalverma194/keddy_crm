import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import SubAdminLayout from "../../components/SubAdminLayout";

const Icons = {
    Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
    Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    Eye: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
    Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
    History: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
};

export default function InvoiceList() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pdfLoadingId, setPdfLoadingId] = useState(null);
    const [search, setSearch] = useState("");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);

    useEffect(() => {
        fetchInvoices(1);
    }, []);

    // Aapka original filter logic jo sahi chal raha tha
    useEffect(() => {
        const s = search.toLowerCase();
        const filtered = invoices.filter((inv) =>
            inv.invoice_number?.toLowerCase().includes(s) ||
            inv.candidate_name?.toLowerCase().includes(s) ||
            inv.bill_to_name?.toLowerCase().includes(s) ||
            inv.status?.toLowerCase().includes(s)
        );
        setFilteredInvoices(filtered);
    }, [search, invoices]);

    const fetchInvoices = async (page = 1) => {
        setLoading(true);
        try {
            const res = await apiRequest(`/invoice/api/all/?page=${page}`);
            if (res?.results) {
                setInvoices(res.results);
                setFilteredInvoices(res.results);
                setHasNext(!!res.next);
                setHasPrevious(!!res.previous);
                setCurrentPage(page);
            }
        } catch (err) {
            console.error("Error fetching invoices", err);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async (id) => {
        setPdfLoadingId(id);
        const res = await apiRequest(`/invoice/api/generate-pdf/${id}/`, "POST");
        setPdfLoadingId(null);
        if (res?.pdf_url) {
            window.open(res.pdf_url, "_blank");
            fetchInvoices(currentPage);
        } else {
            alert("Failed to generate PDF");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <SubAdminLayout>
            <div style={styles.topNav}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><Icons.Back /> Back</button>
                <div style={styles.headerActions}>
                    <button style={styles.settingsBtn} onClick={() => navigate("/sub-admin/invoice/settings")}><Icons.Settings /> Settings</button>
                    <button style={styles.addBtn} onClick={() => navigate("/sub-admin/create-invoice")}><Icons.Plus /> Create Invoice</button>
                </div>
            </div>

            <h2 style={styles.pageTitle}>Invoice Directory</h2>

            <div style={styles.filterSection}>
                <input 
                    placeholder="Search invoice, candidate or client..." 
                    style={styles.searchInput}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeader}>
                            <th style={styles.th}>Inv No</th>
                            <th style={styles.th}>Candidate</th>
                            <th style={styles.th}>Bill To</th>
                            <th style={styles.th}>Date & Month</th>
                            <th style={styles.th}>Total</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>PDF</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={styles.loadingTd}>Updating...</td></tr>
                        ) : filteredInvoices.map((inv) => (
                            <tr key={inv.id} style={styles.tableRow}>
                                <td style={styles.td}><b>{inv.invoice_number}</b></td>
                                <td style={styles.td}>{inv.candidate_name || "-"}</td>
                                <td style={styles.td}>{inv.bill_to_name}</td>
                                <td style={styles.td}>
                                    <div>{formatDate(inv.invoice_date)}</div>
                                    <small style={{color: '#94A3B8'}}>{formatDate(inv.billing_month)}</small>
                                </td>
                                <td style={styles.td}><b style={{color: '#10B981'}}>₹ {inv.total_amount}</b></td>
                                <td style={styles.td}>
                                    <span style={inv.status === 'GENERATED' ? styles.badgeSuccess : styles.badgePending}>{inv.status}</span>
                                </td>
                                <td style={styles.td}>
                                    {inv.pdf_file ? (
                                        <div style={styles.pdfGroup}>
                                            <a href={inv.pdf_file} target="_blank" rel="noreferrer" style={styles.pdfLink}>View</a>
                                            <button onClick={() => generatePDF(inv.id)} disabled={pdfLoadingId === inv.id} style={styles.regenBtn}>🔄</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => generatePDF(inv.id)} style={styles.genBtn}>Generate</button>
                                    )}
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actionGroup}>
                                        <button onClick={() => navigate(`/sub-admin/invoice/preview/${inv.id}`)} style={styles.iconBtn}><Icons.Eye /></button>
                                        <button onClick={() => navigate(`/sub-admin/invoice/edit/${inv.id}`)} style={styles.iconBtn}><Icons.Edit /></button>
                                        {inv.candidate_id && <button onClick={() => navigate(`/sub-admin/invoice/candidate-history/${inv.candidate_id}`)} style={styles.iconBtn}><Icons.History /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={styles.pagination}>
                <button disabled={!hasPrevious} onClick={() => fetchInvoices(currentPage - 1)} style={styles.pageBtn}>Previous</button>
                <span style={styles.pageText}>Page {currentPage}</span>
                <button disabled={!hasNext} onClick={() => fetchInvoices(currentPage + 1)} style={styles.pageBtn}>Next</button>
            </div>
        </SubAdminLayout>
    );
}

const styles = {
    topNav: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
    backBtn: { background: "transparent", color: "#64748B", border: "none", fontSize: "14px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
    headerActions: { display: "flex", gap: "12px" },
    addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
    settingsBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
    pageTitle: { fontSize: "24px", fontWeight: "800", color: "#25343F", marginBottom: "20px" },
    filterSection: { marginBottom: "20px" },
    searchInput: { width: "100%", maxWidth: "400px", padding: "12px 18px", borderRadius: "12px", border: "1px solid #E2E8F0", outline: "none" },
    tableCard: { background: "#fff", borderRadius: "16px", border: "1px solid #F1F5F9", overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #EDF2F7" },
    th: { padding: "14px 20px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" },
    tableRow: { borderBottom: "1px solid #F1F5F9" },
    td: { padding: "14px 20px", fontSize: "13px" },
    dateText: { fontWeight: "700" },
    badgeSuccess: { background: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" },
    badgePending: { background: "#FEF9C3", color: "#854D0E", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" },
    pdfGroup: { display: "flex", gap: "8px", alignItems: "center" },
    pdfLink: { color: "#0369A1", fontWeight: "800", textDecoration: "none", fontSize: "12px" },
    regenBtn: { background: "none", border: "none", cursor: "pointer" },
    genBtn: { background: "#25343F", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" },
    actionGroup: { display: "flex", gap: "6px" },
    iconBtn: { background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "6px", borderRadius: "6px", cursor: "pointer" },
    loadingTd: { textAlign: "center", padding: "40px", color: "#94A3B8" },
    pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "20px" },
    pageBtn: { padding: "8px 15px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" },
    pageText: { fontWeight: "700", fontSize: "14px" }
};









// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest, API_BASE } from "../../../services/api";
// import SubAdminLayout from "../../components/SubAdminLayout";

// const Icons = {
//     Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
//     Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
//     Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
//     History: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
//     Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
// };

// export default function InvoiceList() {
//     const navigate = useNavigate();
//     const [invoices, setInvoices] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [pdfLoadingId, setPdfLoadingId] = useState(null);
//     const [search, setSearch] = useState("");
    
//     // Pagination state
//     const [currentPage, setCurrentPage] = useState(1);
//     const [totalCount, setTotalCount] = useState(0);
//     const [hasNext, setHasNext] = useState(false);
//     const [hasPrevious, setHasPrevious] = useState(false);

//     const fetchInvoices = async (page = 1, searchQuery = "") => {
//         setLoading(true);
//         try {
//             const res = await apiRequest(`/invoice/api/all/?page=${page}&search=${searchQuery}`);
//             if (res) {
//                 setInvoices(res.results || []);
//                 setTotalCount(res.count || 0);
//                 setHasNext(!!res.next);
//                 setHasPrevious(!!res.previous);
//                 setCurrentPage(page);
//             }
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         const delayDebounceFn = setTimeout(() => {
//             fetchInvoices(1, search);
//         }, 500);
//         return () => clearTimeout(delayDebounceFn);
//     }, [search]);

//     const generatePDF = async (id) => {
//         setPdfLoadingId(id);
//         try {
//             const res = await apiRequest(`/invoice/api/generate-pdf/${id}/`, "POST");
//             if (res?.pdf_url) {
//                 window.open(`${API_BASE}${res.pdf_url}`, "_blank");
//                 fetchInvoices(currentPage, search);
//             } else {
//                 alert("Failed to generate PDF");
//             }
//         } catch (err) { alert("Error generating PDF"); }
//         finally { setPdfLoadingId(null); }
//     };

//     const formatMoney = (amt) => `₹ ${Number(amt).toLocaleString('en-IN')}`;

//     return (
//         <SubAdminLayout>
//             <div style={styles.header}>
//                 <div>
//                     <h2 style={styles.pageTitle}>Invoice Directory</h2>
//                     <p style={styles.subText}>Manage your candidate and client invoices</p>
//                 </div>
//                 <div style={styles.headerActions}>
//                     <button style={styles.settingsBtn} onClick={() => navigate("/sub-admin/invoice/settings")}>
//                         <Icons.Settings /> Settings
//                     </button>
//                     <button style={styles.addBtn} onClick={() => navigate("/sub-admin/create-invoice")}>
//                         <Icons.Plus /> Create Invoice
//                     </button>
//                 </div>
//             </div>

//             <div style={styles.filterSection}>
//                 <input 
//                     placeholder="Search by Invoice No, Candidate, or Bill To..." 
//                     style={styles.searchInput}
//                     value={search}
//                     onChange={(e) => setSearch(e.target.value)}
//                 />
//             </div>

//             <div style={styles.tableCard}>
//                 <table style={styles.table}>
//                     <thead>
//                         <tr style={styles.tableHeader}>
//                             <th style={styles.th}>Invoice Info</th>
//                             <th style={styles.th}>Candidate</th>
//                             <th style={styles.th}>Bill To</th>
//                             <th style={styles.th}>Date & Month</th>
//                             <th style={styles.th}>Amount</th>
//                             <th style={styles.th}>Status</th>
//                             <th style={styles.th}>Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {loading ? (
//                             <tr><td colSpan="7" style={styles.loadingTd}>Fetching invoices...</td></tr>
//                         ) : invoices.length > 0 ? (
//                             invoices.map((inv) => (
//                                 <tr key={inv.id} style={styles.tableRow}>
//                                     <td style={styles.td}>
//                                         <div style={styles.primaryText}>{inv.invoice_number}</div>
//                                         <small style={styles.typeTag}>{inv.invoice_type}</small>
//                                     </td>
//                                     <td style={styles.td}>{inv.candidate_name || "-"}</td>
//                                     <td style={styles.td}>{inv.bill_to_name}</td>
//                                     <td style={styles.td}>
//                                         <div style={styles.dateText}>{inv.invoice_date}</div>
//                                         <small style={{color: '#94A3B8'}}>{inv.billing_month}</small>
//                                     </td>
//                                     <td style={styles.td}><b style={{color: '#10B981'}}>{formatMoney(inv.total_amount)}</b></td>
//                                     <td style={styles.td}>
//                                         <span style={inv.status === 'GENERATED' ? styles.badgeSuccess : styles.badgePending}>
//                                             {inv.status}
//                                         </span>
//                                     </td>
//                                     <td style={styles.td}>
//                                         <div style={styles.actionGrid}>
//                                             {/* PDF Actions */}
//                                             {inv.pdf_file ? (
//                                                 <div style={styles.pdfBtnGroup}>
//                                                     <a href={inv.pdf_file} target="_blank" rel="noreferrer" style={styles.pdfLink}>View PDF</a>
//                                                     <button onClick={() => generatePDF(inv.id)} disabled={pdfLoadingId === inv.id} style={styles.regenBtn}>
//                                                         {pdfLoadingId === inv.id ? "..." : "Regen"}
//                                                     </button>
//                                                 </div>
//                                             ) : (
//                                                 <button onClick={() => generatePDF(inv.id)} disabled={pdfLoadingId === inv.id} style={styles.genBtn}>
//                                                     {pdfLoadingId === inv.id ? "Generating..." : "Generate PDF"}
//                                                 </button>
//                                             )}
                                            
//                                             {/* Generic Actions */}
//                                             <div style={styles.iconActions}>
//                                                 <button onClick={() => navigate(`/sub-admin/invoice/preview/${inv.id}`)} style={styles.iconBtn} title="Preview"><Icons.Eye /></button>
//                                                 <button onClick={() => navigate(`/sub-admin/invoice/edit/${inv.id}`)} style={styles.iconBtn} title="Edit"><Icons.Edit /></button>
//                                                 {inv.candidate_id && (
//                                                     <button onClick={() => navigate(`/sub-admin/invoice/candidate-history/${inv.candidate_id}`)} style={styles.iconBtn} title="History"><Icons.History /></button>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ))
//                         ) : (
//                             <tr><td colSpan="7" style={styles.loadingTd}>No data found</td></tr>
//                         )}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Pagination Controls */}
//             <div style={styles.pagination}>
//                 <button disabled={!hasPrevious} onClick={() => fetchInvoices(currentPage - 1, search)} style={{...styles.pageBtn, opacity: hasPrevious ? 1 : 0.5}}>Previous</button>
//                 <span style={styles.pageInfo}>Page <b>{currentPage}</b></span>
//                 <button disabled={!hasNext} onClick={() => fetchInvoices(currentPage + 1, search)} style={{...styles.pageBtn, opacity: hasNext ? 1 : 0.5}}>Next</button>
//             </div>
//         </SubAdminLayout>
//     );
// }

// const styles = {
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
//     pageTitle: { fontSize: "24px", fontWeight: "800", color: "#25343F", margin: 0 },
//     subText: { color: "#64748B", fontSize: "14px", margin: "4px 0 0 0" },
//     headerActions: { display: "flex", gap: "10px" },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
//     settingsBtn: { background: "#F1F5F9", color: "#475569", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
//     filterSection: { marginBottom: "20px" },
//     searchInput: { width: "100%", maxWidth: "450px", padding: "12px 18px", borderRadius: "12px", border: "1px solid #E2E8F0", outline: "none" },
//     tableCard: { background: "#fff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.04)", border: "1px solid #F1F5F9", overflow: "hidden" },
//     table: { width: "100%", borderCollapse: "collapse" },
//     tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #EDF2F7" },
//     th: { padding: "16px 20px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9" },
//     td: { padding: "16px 20px", fontSize: "14px", color: "#475569" },
//     primaryText: { fontWeight: "700", color: "#25343F" },
//     typeTag: { background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" },
//     dateText: { fontWeight: "600", color: "#25343F" },
//     badgeSuccess: { background: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" },
//     badgePending: { background: "#FEF9C3", color: "#854D0E", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" },
//     actionGrid: { display: "flex", flexDirection: "column", gap: "8px" },
//     pdfBtnGroup: { display: "flex", alignItems: "center", gap: "10px" },
//     pdfLink: { color: "#0369A1", fontWeight: "700", textDecoration: "none", fontSize: "12px" },
//     regenBtn: { background: "#F1F5F9", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" },
//     genBtn: { background: "#25343F", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "11px" },
//     iconActions: { display: "flex", gap: "6px" },
//     iconBtn: { background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "6px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
//     pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "25px", marginTop: "30px" },
//     pageBtn: { padding: "8px 20px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "10px", fontWeight: "700", cursor: "pointer" },
//     pageInfo: { fontSize: "14px", color: "#64748B" },
//     loadingTd: { textAlign: "center", padding: "50px", color: "#94A3B8", fontWeight: "600" }
// };







// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../../services/api";
// import SubAdminLayout from "../../components/SubAdminLayout";

// export default function InvoiceList() {
//   const navigate = useNavigate();
//   const [invoices, setInvoices] = useState([]);
//   const [filteredInvoices, setFilteredInvoices] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [pdfLoadingId, setPdfLoadingId] = useState(null);
//   const [search, setSearch] = useState("");

//   useEffect(() => {
//     fetchInvoices();
//   }, []);

//   useEffect(() => {
//     applyFilter();
//   }, [search, invoices]);

//   const fetchInvoices = async () => {
//     setLoading(true);
//     const res = await apiRequest("/invoice/api/all/");
//     if (res?.results) {
//       setInvoices(res.results);
//       setFilteredInvoices(res.results);
//     }
//     setLoading(false);
//   };

//   const applyFilter = () => {
//     const s = search.toLowerCase();

//     const filtered = invoices.filter((inv) =>
//       inv.invoice_number?.toLowerCase().includes(s) ||
//       inv.candidate_name?.toLowerCase().includes(s) ||
//       inv.bill_to_name?.toLowerCase().includes(s) ||
//       inv.status?.toLowerCase().includes(s)
//     );

//     setFilteredInvoices(filtered);
//   };

//   const openPreview = (id) => {
//     navigate(`/sub-admin/invoice/preview/${id}`);
//   };

//   const openEdit = (id) => {
//     navigate(`/sub-admin/invoice/edit/${id}`);
//   };

//   const openHistory = (candidateId) => {
//     navigate(`/sub-admin/invoice/candidate-history/${candidateId}`);
//   };

//   const generatePDF = async (id) => {
//     setPdfLoadingId(id);
//     const res = await apiRequest(`/invoice/api/generate-pdf/${id}/`, "POST");
//     setPdfLoadingId(null);

//     if (res?.pdf_url) {
//       window.open(res.pdf_url, "_blank");
//       fetchInvoices();
//     } else {
//       alert("Failed to generate PDF");
//     }
//   };

//   const formatMoney = (amt) => `₹ ${amt}`;

//   if (loading) return <SubAdminLayout><div>Loading invoices...</div></SubAdminLayout>;

//   return (
//     <SubAdminLayout>
//       <div>
//         <h2>Invoice List</h2>

//         <button onClick={() => navigate("/sub-admin/create-invoice")}>
//           + Create Invoice
//         </button>
//         <button onClick={() => navigate("/sub-admin/invoice/settings")}>
//           Manage settings
//         </button>

//         <br /><br />

//         <input
//           placeholder="Search invoice..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />

//         <br /><br />

//         <table border="1" cellPadding="8" width="100%">
//           <thead>
//             <tr>
//               <th>Invoice No</th>
//               <th>Candidate</th>
//               <th>Bill To</th>
//               <th>Type</th>
//               <th>Date</th>
//               <th>Billing Month</th>
//               <th>Total</th>
//               <th>Status</th>
//               <th>PDF</th>
//               <th>Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {filteredInvoices.length === 0 && (
//               <tr>
//                 <td colSpan="10" align="center">No invoices found</td>
//               </tr>
//             )}

//             {filteredInvoices.map((inv) => (
//               <tr key={inv.id}>
//                 <td>{inv.invoice_number}</td>
//                 <td>{inv.candidate_name || "-"}</td>
//                 <td>{inv.bill_to_name}</td>
//                 <td>{inv.invoice_type}</td>
//                 <td>{inv.invoice_date}</td>
//                 <td>{inv.billing_month}</td>
//                 <td>{formatMoney(inv.total_amount)}</td>
//                 <td>{inv.status}</td>

//                 <td>
//                   {inv.pdf_file ? (
//                     <>
//                       <a href={inv.pdf_file} target="_blank" rel="noreferrer">
//                         View PDF
//                       </a>
//                       {" "}
//                       <button
//                         onClick={() => generatePDF(inv.id)}
//                         disabled={pdfLoadingId === inv.id}
//                       >
//                         {pdfLoadingId === inv.id ? "Updating..." : "Regenerate PDF"}
//                       </button>
//                     </>
//                   ) : (
//                     <button
//                       onClick={() => generatePDF(inv.id)}
//                       disabled={pdfLoadingId === inv.id}
//                     >
//                       {pdfLoadingId === inv.id ? "Generating..." : "Generate PDF"}
//                     </button>
//                   )}
//                 </td>

//                 {/* <td>
//                   <button onClick={() => openPreview(inv.id)}>Preview</button>{" "}
//                   <button onClick={() => openEdit(inv.id)}>Edit</button>
//                 </td> */}

//                 <td>
//                   <button onClick={() => openPreview(inv.id)}>Preview</button>{" "}
//                   <button onClick={() => openEdit(inv.id)}>Edit</button>{" "}

//                   {inv.candidate_id && (
//                     <button onClick={() => openHistory(inv.candidate_id)}>
//                       History
//                     </button>
//                   )}
//                 </td>
                
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </SubAdminLayout>
//   );
// }







