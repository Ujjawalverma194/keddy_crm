import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";
import { getStatusStyles } from "../../utils/statusHelper";
import {
  getSubmittedToName,
  getCreatedByName,
} from "../../utils/candidateDisplay";

const Icons = {
  Edit: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Remark: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FF9B51"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
};

function CandidateList() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [techFilter, setTechFilter] = useState("");

  useEffect(() => {
    fetchCandidates(currentPage, searchTerm, techFilter);
  }, [currentPage, searchTerm, techFilter]);

  const fetchCandidates = async (page, search, tech) => {
    setLoading(true);
    try {
      let url = `/employee-portal/api/candidates/list/?page=${page}`;
      if (search) url += `&search=${search}`;
      if (tech) url += `&technology=${tech}`;
      const res = await apiRequest(url, "GET");
      setCandidates(res.results || []);
      setCount(res.count || 0);
    } catch (err) {
      console.error("Error fetching candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  const truncate = (text, limit = 30) => {
    if (!text) return "";
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  };

  const renderRows = (list) => {
    let lastDate = "";
    return list.map((c) => {
      const currentDate = c.created_at
        ? new Date(c.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "";
      const dateSeparator =
        currentDate !== lastDate
          ? ((lastDate = currentDate),
            (
              <tr key={`date-${c.id}`}>
                <td colSpan="8" style={styles.dateSeparator}>
                  {currentDate}
                </td>
              </tr>
            ))
          : null;

      const statusStyle = getStatusStyles(c.main_status || "SUBMITTED");

      return (
        <React.Fragment key={c.id}>
          {dateSeparator}
          <tr
            style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }}
            onClick={() => navigate(`/employee/candidate/view/${c.id}`)}
          >
            {/* 1. Submitted To/By */}
            <td style={styles.td}>
              <div>
                To: <b>{getSubmittedToName(c) || ""}</b>
              </div>
              <div>
                By:{" "}
                <b style={{ color: "#27AE60" }}>{getCreatedByName(c) || ""}</b>
              </div>
            </td>

            {/* 2. Candidate */}
            <td style={styles.td}>
              <div style={{ fontWeight: "bold", color: "#25343F" }}>
                {c.candidate_name || ""}
              </div>
              <div style={{ fontSize: "11px", color: "#7F8C8D" }}>
                {c.candidate_email || c.candidate_number || ""}
              </div>
            </td>

            {/* 3. Tech (Simple Text Like Dashboard) */}
            <td style={styles.td}>{truncate(c.technology, 30) || ""}</td>

            {/* 4. Exp */}
            <td style={styles.td}>
              {c.years_of_experience_manual || ""}{" "}
              {c.years_of_experience_manual ? "Yrs" : ""}
            </td>

            {/* 5. Vendor */}
            <td style={styles.td}>
              <div style={{ fontWeight: "600" }}>
                {truncate(c.vendor_company_name || c.vendor_name, 15) || ""}
              </div>
              <div style={styles.vendorContact}>{c.vendor_number || ""}</div>
            </td>

            {/* 6. Rate */}
            <td style={styles.td}>
              <div style={styles.rateText}>
                {c.vendor_rate ? `₹${c.vendor_rate}` : ""}
              </div>
              <div style={styles.rateType}>{c.vendor_rate_type || ""}</div>
            </td>

            {/* 7. Status */}
            {/* <td style={styles.td}>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>{c.main_status || ''}</span>
                                    {c.remark && <div title={c.remark} style={styles.remarkIcon}><Icons.Remark /></div>}
                                </div>
                                <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: '700' }}>{c.sub_status !== 'NONE' ? c.sub_status : ''}</small>
                            </div>
                        </td> */}

            {/* 8. Action */}
            {/* <td style={styles.td}>
                             <div style={styles.actionGroup}>
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/employee/candidate/edit/${c.id}`); }} style={styles.editBtn}><Icons.Edit /></button>
                            </div>
                        </td> */}
          </tr>
        </React.Fragment>
      );
    });
  };

  return (
    <BaseLayout>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <button
          onClick={() => navigate(-1)}
          style={{ ...styles.actionBtn, background: "#25343F" }}
        >
          ← Back
        </button>
        <div style={styles.btnGroup}>
          <button
            onClick={() => navigate("/employee/candidates/add")}
            style={styles.actionBtn}
          >
            + Add Candidate
          </button>
        </div>
      </div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.welcome}>Candidate Pool ({count})</h2>
          <p style={styles.subText}>
            Comprehensive recruitment profile management.
          </p>
        </div>
      </div>

      <div style={styles.filterBar}>
        <input
          placeholder="Search name or email..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          placeholder="Filter Technology..."
          style={styles.filterInput}
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value)}
        />
      </div>

      <div style={styles.tableWrapper}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.th}>Submitted To/By</th>
                <th style={styles.th}>Candidate</th>
                <th style={styles.th}>Tech</th>
                <th style={styles.th}>Exp</th>
                <th style={styles.th}>Vendor</th>
                <th style={styles.th}>Rate</th>
                {/* <th style={styles.th}>Status</th> */}
                {/* <th style={styles.th}>Action</th> */}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={styles.loadingTd}>
                    Loading...
                  </td>
                </tr>
              ) : candidates.length > 0 ? (
                renderRows(candidates)
              ) : (
                <tr>
                  <td colSpan="8" style={styles.loadingTd}>
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.pagination}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}
        >
          Prev
        </button>
        <span style={styles.pageInfo}>
          Page {currentPage} of {Math.ceil(count / 10) || 1}
        </span>
        <button
          disabled={currentPage * 10 >= count}
          onClick={() => setCurrentPage((p) => p + 1)}
          style={
            currentPage * 10 >= count ? styles.pageBtnDisabled : styles.pageBtn
          }
        >
          Next
        </button>
      </div>
    </BaseLayout>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    flexWrap: "wrap",
    gap: "15px",
  },
  welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
  subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
  btnGroup: { display: "flex", gap: "10px", alignItems: "center" },
  actionBtn: {
    background: "#FF9B51",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
    marginBottom: "20px",
  },
  filterBar: { display: "flex", gap: "15px", marginBottom: "10px" },
  searchInput: {
    flex: 2,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #F0F2F4",
    outline: "none",
    fontSize: "13px",
  },
  filterInput: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #F0F2F4",
    outline: "none",
    fontSize: "13px",
  },
  tableWrapper: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    border: "1px solid #F0F2F4",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
  th: {
    padding: "14px 18px",
    textAlign: "left",
    fontSize: "11px",
    color: "#94A3B8",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  tableRow: {
    borderBottom: "1px solid #F1F5F9",
    transition: "0.2s",
    cursor: "pointer",
  },
  td: { padding: "14px 18px", fontSize: "13px", color: "#334155" },
  dateSeparator: {
    padding: "12px 20px",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: "800",
    fontSize: "12px",
    textTransform: "uppercase",
    borderBottom: "1px solid #e2e8f0",
  },
  badge: {
    background: "rgba(255, 155, 81, 0.12)",
    color: "#FF9B51",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
  },
  subStatusText: {
    fontSize: "11px",
    color: "#7f8c8d",
    display: "block",
    marginTop: "2px",
  },
  remarkIcon: {
    display: "flex",
    cursor: "help",
    padding: "4px",
    borderRadius: "4px",
    background: "#FFF5EB",
  },
  editBtn: {
    border: "none",
    background: "#F1F5F9",
    padding: "6px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  vendorContact: { fontSize: "11px", color: "#64748B" },
  rateText: { fontWeight: "700", color: "#25343F" },
  rateType: { fontSize: "10px", color: "#94A3B8", fontWeight: "700" },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    marginTop: "25px",
    marginBottom: "20px",
  },
  pageBtn: {
    padding: "8px 25px",
    background: "#25343F",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },
  pageBtnDisabled: {
    padding: "8px 25px",
    background: "#E2E8F0",
    color: "#94A3B8",
    border: "none",
    borderRadius: "8px",
    cursor: "not-allowed",
  },
  pageInfo: { fontWeight: "800", color: "#25343F", fontSize: "14px" },
  loadingTd: {
    textAlign: "center",
    padding: "40px",
    fontWeight: "800",
    color: "#25343F",
  },
};

export default CandidateList;

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";
// import { getStatusStyles } from "../../utils/statusHelper";

// const Icons = {
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
//     External: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
// };

// function CandidateList() {
//     const navigate = useNavigate();
//     const [candidates, setCandidates] = useState([]);
//     const [count, setCount] = useState(0);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [loading, setLoading] = useState(true);

//     // Search aur Filter States
//     const [searchTerm, setSearchTerm] = useState("");
//     const [techFilter, setTechFilter] = useState("");

//     useEffect(() => {
//         fetchCandidates(currentPage, searchTerm, techFilter);
//     }, [currentPage, searchTerm, techFilter]);

//     const fetchCandidates = async (page, search, tech) => {
//         setLoading(true);
//         try {
//             // API call with params
//             let url = `/employee-portal/api/candidates/list/?page=${page}`;
//             if (search) url += `&search=${search}`;
//             if (tech) url += `&technology=${tech}`;

//             const res = await apiRequest(url, "GET");
//             setCandidates(res.results || []);
//             setCount(res.count || 0);
//         } catch (err) {
//             console.error("Error fetching candidates:", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const truncate = (text, limit = 30) => {
//         if (!text) return "";
//         return text.length > limit ? text.substring(0, limit) + "..." : text;
//     };
//     const renderRows = (list) => {
//         let lastDate = "";
//         return list.map((c) => {
//             const created = c.created_at ? new Date(c.created_at) : null;
//             const currentDate = created ? created.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
//             const timeText = created ? created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

//             const dateSeparator = currentDate !== lastDate ? (lastDate = currentDate, (
//                 <tr key={`date-${c.id}`}>
//                     <td colSpan="9" style={styles.dateSeparator}>{currentDate}</td>
//                 </tr>
//             )) : null;

//             const statusStyle = getStatusStyles(c.main_status || 'SUBMITTED');

//             return (
//                 <React.Fragment key={c.id}>
//                     {dateSeparator}
//                     <tr style={{...styles.tr, backgroundColor: statusStyle.bg, cursor: 'pointer'}} onClick={() => navigate(`/employee/candidate/view/${c.id}`)}>
//                         <td style={styles.td}>
//                             <div style={styles.timeText}>{timeText}</div>
//                         </td>

//                         <td style={styles.td}>
//                             <div style={{fontWeight:700, color:'#25343F'}}>{c.submitted_to_name || '—'}</div>
//                             <div style={{fontSize:12, color:'#475569', marginTop:4}}>By: <b>{c.created_by_name || '—'}</b></div>
//                         </td>

//                         <td style={styles.td}>
//                             <div style={{ fontWeight: "bold", color: "#25343F" }}>{c.candidate_name}</div>
//                             <div style={{ fontSize: "11px", color: "#666" }}>{c.candidate_email || c.candidate_number || "No contact"}</div>
//                         </td>

//                         <td style={styles.td}>
//                             <span style={styles.techBadge}>{c.technology || "N/A"}</span>
//                             <div style={styles.skillText}>{truncate(c.skills, 40)}</div>
//                         </td>

//                         <td style={styles.td}>{c.years_of_experience_manual || '—'}</td>

//                         <td style={styles.td}>
//                             <div style={{fontWeight: "600"}}>{c.vendor_company_name || c.vendor_name || '—'}</div>
//                             <div style={styles.vendorContact}>{c.vendor_number || '—'}</div>
//                         </td>

//                         <td style={styles.td}>
//                             <div style={styles.rateText}>₹{c.vendor_rate || '—'}</div>
//                             <div style={styles.rateType}>{c.vendor_rate_type || ''}</div>
//                         </td>

//                         <td style={styles.td}>
//                             <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
//                                 <span style={{...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.text}}>{c.main_status || 'SUBMITTED'}</span>
//                                 {c.sub_status && c.sub_status !== 'NONE' ? <span style={styles.subStatus}>{c.sub_status}</span> : null}
//                             </div>
//                         </td>

//                         <td style={styles.td}>
//                             {c.remark ? <div title={c.remark}><Icons.Remark /></div> : '—'}
//                         </td>

//                     </tr>
//                 </React.Fragment>
//             );
//         });
//     };

//     return (
//         <BaseLayout>
//             {/* Header Section */}
//             <div style={styles.header}>
//                 <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
//                     <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                     <h2 style={styles.title}>Candidate Pool ({count})</h2>
//                 </div>
//                 <button onClick={() => navigate("/employee/candidates/add")} style={styles.addBtn}>+ Add Candidate</button>
//             </div>

//             {/* Filter Bar */}
//             <div style={styles.filterBar}>
//                 <input
//                     placeholder="Search by name or email..."
//                     style={styles.searchInput}
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//                 <input
//                     placeholder="Filter by Tech (AI, ML, React...)"
//                     style={styles.filterInput}
//                     value={techFilter}
//                     onChange={(e) => setTechFilter(e.target.value)}
//                 />
//             </div>

//                     {/* Candidates Table */}
//                     <div style={styles.tableCard}>
//                         <table style={styles.table}>
//                             <thead>
//                                 <tr style={styles.tableHeader}>
//                                     <th style={styles.th}>Time</th>
//                                     <th style={styles.th}>Team Info</th>
//                                     <th style={styles.th}>Candidate</th>
//                                     <th style={styles.th}>Tech</th>
//                                     <th style={styles.th}>Exp</th>
//                                     <th style={styles.th}>Vendor</th>
//                                     <th style={styles.th}>Rate</th>
//                                     <th style={styles.th}>Status</th>
//                                     <th style={styles.th}>Remark</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {loading ? (
//                                     <tr><td colSpan="9" style={styles.loadingTd}>Loading candidates...</td></tr>
//                                 ) : candidates.length > 0 ? (
//                                     renderRows(candidates)
//                                 ) : (
//                                     <tr><td colSpan="9" style={styles.loadingTd}>No candidates found.</td></tr>
//                                 )}
//                             </tbody>
//                         </table>
//                     </div>

//             {/* Pagination */}
//             <div style={styles.pagination}>
//                 <button
//                     disabled={currentPage === 1}
//                     onClick={() => setCurrentPage(p => p - 1)}
//                     style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}
//                 >Previous</button>

//                 <span style={styles.pageInfo}>Page {currentPage} of {Math.ceil(count / 10)}</span>

//                 <button
//                     disabled={candidates.length < 10 && currentPage * 10 >= count}
//                     onClick={() => setCurrentPage(p => p + 1)}
//                     style={candidates.length < 10 ? styles.pageBtnDisabled : styles.pageBtn}
//                 >Next</button>
//             </div>
//         </BaseLayout>
//     );
// }

// const styles = {
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
//     backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer" },
//     title: { margin: 0, color: "#25343F", fontWeight: "800" },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" },
//     filterBar: { display: "flex", gap: "15px", marginBottom: "20px" },
//     searchInput: { flex: 2, padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none" },
//     filterInput: { flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none" },
//     tableCard: { background: "#fff", borderRadius: "15px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
//     table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
//     tableHeader: { background: "#F5F7F9", borderBottom: "2px solid #EAEFEF" },
//     th: { padding: "15px", fontSize: "13px", color: "#25343F", textTransform: "uppercase", fontWeight: "800" },
//     tr: { borderBottom: "1px solid #F0F0F0", transition: "0.2s" },
//     td: { padding: "15px", fontSize: "14px", verticalAlign: "top" },
//     techBadge: { background: "#FFFBF8", color: "#FF9B51", padding: "2px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "bold", border: "1px solid #FFE6D5" },
//     skillText: { fontSize: "11px", color: "#888", marginTop: "5px" },
//     resumeLink: { color: "#25343F", fontWeight: "bold", textDecoration: "underline", fontSize: "12px" },
//     viewBtn: { background: "#EAEFEF", border: "none", padding: "5px 12px", borderRadius: "5px", cursor: "pointer", fontSize: "12px" },
//     pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "25px" },
//     pageBtn: { padding: "8px 20px", background: "#25343F", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
//     pageBtnDisabled: { padding: "8px 20px", background: "#BFC9D1", color: "#fff", border: "none", borderRadius: "8px", cursor: "not-allowed" },
//     pageInfo: { fontWeight: "bold", color: "#25343F" },
//     loadingTd: { textAlign: "center", padding: "30px", color: "#64748B", fontWeight: "600" },
//     dateSeparator: { padding: "10px 20px", background: "#F1F5F9", color: "#475569", fontWeight: "800", fontSize: "12px", textTransform: "uppercase" },
//     timeText: { fontWeight: "600", color: "#64748B" },
//     teamInfo: { fontSize: "12px", color: "#475569" },
//     teamInfoBy: { fontSize: "13px", color: "#1E293B", marginTop: "4px", fontWeight: 700 },
//     teamInfo: { fontSize: "13px", color: "#1E293B", fontWeight: 700 },
//     vendorContact: { fontSize: "11px", color: "#64748B" },
//     rateText: { fontWeight: "700", color: "#1E293B" },
//     rateType: { fontSize: "10px", color: "#94A3B8", fontWeight: "700" },
//     actionGroup: { display: "flex", gap: "8px" },
//     iconBtn: { border: "1px solid #E2E8F0", background: "#fff", padding: "6px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center" }
//     ,statusBadge: { padding: "6px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" },
//     subStatus: { fontSize: "11px", color: "#475569", fontWeight: 700 }
// };

// export default CandidateList;
