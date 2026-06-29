import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";

// Reusable Utilities aur Components
import { getStatusStyles } from "../../utils/statusHelper";
import StatusUpdateModal from "../../components/StatusUpdateModal";
import SubmissionModal from "../../components/SubmissionModal";

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

const getCurrentUserId = () => {
  try {
    const token =
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (!token || !token.includes(".")) return null;

    const payloadPart = token.split(".")[1];
    const normalizedPayload = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(paddedPayload));

    return payload.user_id || payload.userId || payload.id || payload.pk || null;
  } catch (error) {
    return null;
  }
};

function TeamSubmissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedCand, setSelectedCand] = useState(null);
  const [editForm, setEditForm] = useState({
    main_status: "",
    sub_status: "",
    remark: "",
  });
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [submissionModalProps, setSubmissionModalProps] = useState({});

  const fetchTeamSubmissions = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(
        "/employee-portal/team/all-submissions/",
        "GET",
      );
      console.log("First Row", res.results[0]);
      setSubmissions(Array.isArray(res) ? res : res.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamSubmissions();
  }, []);

  const notify = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const handleQuickEdit = (e, cand) => {
    e.stopPropagation();
    setSelectedCand(cand);
    setEditForm({
      main_status: cand.main_status || "SUBMITTED",
      sub_status: cand.sub_status || "NONE",
      remark: cand.remark || "",
    });
    setShowModal(true);
  };

  const handleUpdateSubmit = async () => {
    try {
      await apiRequest(
        `/employee-portal/candidates/${selectedCand.id}/update/`,
        "PUT",
        editForm,
      );
      notify("Status updated!");
      setShowModal(false);
      fetchTeamSubmissions();
    } catch (err) {
      notify("Failed", "error");
    }
  };

  const handleOpenSubmitModal = (e, candidate) => {
    e.stopPropagation();
    setSelectedCand(candidate);
    setSubmissionModalProps({
      initialSubmitType: "CLIENT",
      hideInternalOption: true,
      restrictToAssignedJdUntilEdit: true,
    });
    setShowSubmitModal(true);
  };

  const truncate = (text, limit) =>
    text?.length > limit ? text.substring(0, limit) + "..." : text;

  const renderRows = () => {
    let lastDate = "";
    return submissions
      .filter(
        (item) =>
          item.candidate_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.created_by_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      )
      .map((s) => {
        const dateValue = s.created_at || s.createdAt || s.submission_created_at;
const currentDate = new Date(dateValue).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short'
});
        let dateSeparator =
          currentDate !== lastDate ? (
            <tr key={`d-${s.id}`}>
              <td colSpan="9" style={styles.dateSeparator}>
                {currentDate}
              </td>
            </tr>
          ) : null;
        if (currentDate !== lastDate) lastDate = currentDate;

        const statusStyle = getStatusStyles(s.main_status || "SUBMITTED");
        const currentUserId = getCurrentUserId();
        const isIncomingTeamSubmission =
          currentUserId &&
          String(
            s.submitted_to ||
              s.submitted_to_id ||
              s.submittedToId ||
              s.submittedTo?.id ||
              "",
          ) === String(currentUserId);

        return (
          <React.Fragment key={s.id}>
            {dateSeparator}
            <tr
              style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }}
              onClick={() => navigate(`/employee/candidate/view/${s.id}`)}
            >
              {/* 1. Submitted To/By */}
              <td style={styles.td}>
                <div>
                  To: <b>{s.submitted_to_name || ""}</b>
                </div>
                <div>
                  By:{" "}
                  <b style={{ color: "#27AE60" }}>{s.created_by_name || ""}</b>
                </div>
              </td>
              {/* 2. Candidate */}
              <td style={styles.td}>
                <b>{s.candidate_name || ""}</b>
              </td>
              {/* 3. Tech */}
              <td style={styles.td}>{truncate(s.technology, 30) || ""}</td>
              {/* 4. Exp */}
              <td style={styles.td}>
                {s.years_of_experience_manual || ""}{" "}
                {s.years_of_experience_manual ? "Yrs" : ""}
              </td>
              {/* 5. Client */}
              <td style={styles.td}>
                {s.client_name || s.client_company_name || ""}
              </td>
              {/* 6. Vendor */}
              <td style={styles.td}>
                <b>
                  {truncate(s.vendor_company_name || s.vendor_name, 15) || ""}
                </b>
                <br />
                <small style={styles.subStatusText}>
                  {s.vendor_number || ""}
                </small>
              </td>
              {/* 7. Rate */}
              <td style={styles.td}>
                <div>{s.vendor_rate ? `₹${s.vendor_rate}` : ""}</div>
                <small style={{ color: "#94A3B8" }}>
                  {s.vendor_rate_type || ""}
                </small>
              </td>
              {/* 8. Status */}
              <td style={styles.td}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      ...styles.badge,
                      color: statusStyle.text,
                      fontWeight: "800",
                    }}
                  >
                    {s.main_status || ""}
                  </span>
                  {s.remark && (
                    <div style={styles.remarkIcon} title={s.remark}>
                      <Icons.Remark />
                    </div>
                  )}
                </div>
                <small
                  style={{
                    ...styles.subStatusText,
                    color: statusStyle.text,
                    fontWeight: "700",
                  }}
                >
                  {s.sub_status || ""}
                </small>
              </td>
              {/* 9. Action */}
              <td style={styles.td}>
                <div
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <button
                    onClick={(e) => handleQuickEdit(e, s)}
                    style={styles.editBtn}
                  >
                    <Icons.Edit />
                  </button>
                  {isIncomingTeamSubmission &&
                    (!(s.client_name || s.client) ? (
                      <button
                        style={styles.submitBtn}
                        onClick={(e) => handleOpenSubmitModal(e, s)}
                      >
                        Submit to Client
                      </button>
                    ) : (
                      <span style={styles.submittedTag}>✓ Submitted</span>
                    ))}
                </div>
              </td>
            </tr>
          </React.Fragment>
        );
      });
  };

  return (
    <BaseLayout>
      {toast.show && (
        <div
          style={{
            ...styles.toast,
            backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60",
          }}
        >
          {toast.msg}
        </div>
      )}
<div>
   <button onClick={() => navigate("/employee/")} style={styles.backBtn} title="Back to Dashboard">
            ← Back
          </button>
</div>
      <div style={styles.header}>
        
        <div>
          <h2 style={styles.welcome}>Team Submissions</h2>
          <p style={styles.subText}>
            Overview of all profiles submitted by the team.
          </p>
        </div>
        <input
          placeholder="Search..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Vendor</th>
                <th style={styles.th}>Rate</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={styles.loadingTd}>
                    Loading...
                  </td>
                </tr>
              ) : (
                renderRows()
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StatusUpdateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        formData={editForm}
        setFormData={setEditForm}
        onSave={handleUpdateSubmit}
      />

      <SubmissionModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        selectedCand={selectedCand}
        notify={notify}
        refreshData={fetchTeamSubmissions}
        {...submissionModalProps}
      />
    </BaseLayout>
  );
}

const styles = {
  toast: {
    position: "fixed",
    top: "85px",
    right: "20px",
    color: "#fff",
    padding: "12px 25px",
    borderRadius: "8px",
    zIndex: 9999,
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
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
  searchInput: {
    padding: "10px 15px",
    borderRadius: "10px",
    border: "1px solid #F0F2F4",
    width: "250px",
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
  submitBtn: {
    background: "#25343F",
    color: "#fff",
    border: "none",
    padding: "4px 10px",
    borderRadius: "6px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "11px",
  },
  submittedTag: {
    color: "#27AE60",
    fontWeight: "700",
    fontSize: "11px",
    whiteSpace: "nowrap",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(37, 52, 63, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    backdropFilter: "blur(4px)",
  },
  modalContent: {
    background: "#fff",
    padding: "30px",
    borderRadius: "20px",
    width: "400px",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
  },
  modalLabel: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: "8px",
    display: "block",
  },
  modalInput: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #F0F2F4",
    marginBottom: "10px",
    outline: "none",
    fontSize: "13px",
  },
  modalSelect: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #F0F2F4",
    outline: "none",
    fontSize: "13px",
    height: "120px",
  },
  saveBtn: {
    flex: 1,
    background: "#FF9B51",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },
  cancelBtn: {
    flex: 1,
    background: "#F1F5F9",
    color: "#7F8C8D",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },
  loadingTd: {
    textAlign: "center",
    padding: "40px",
    fontWeight: "800",
    color: "#25343F",
  },
   backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px", marginTop: "3px", whiteSpace: "nowrap" },
};

export default TeamSubmissions;

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// // Reusable Utilities aur Components
// import { getStatusStyles } from "../../utils/statusHelper";
// import StatusUpdateModal from "../../components/StatusUpdateModal";

// const Icons = {
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
//     External: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
// };

// function TeamSubmissions() {
//     const navigate = useNavigate();
//     const [submissions, setSubmissions] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [clientSearch, setClientSearch] = useState("");

//     // Modals & Forms State
//     const [showModal, setShowModal] = useState(false);
//     const [showClientModal, setShowClientModal] = useState(false);
//     const [clientsList, setClientsList] = useState([]);
//     const [selectedCand, setSelectedCand] = useState(null);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });
//     const [submitData, setSubmitData] = useState({ target_id: "", client_rate: "", client_rate_type: "" });
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     const fetchTeamSubmissions = async () => {
//         setLoading(true);
//         try {
//             const res = await apiRequest("/employee-portal/team/all-submissions/", "GET");
//             setSubmissions(Array.isArray(res) ? res : (res.results || []));
//         } catch (err) { console.error(err); } finally { setLoading(false); }
//     };

//     const fetchClients = async () => {
//         try {
//             const res = await apiRequest("/employee-portal/clients/list/", "GET");
//             setClientsList(res.results || (Array.isArray(res) ? res : []));
//         } catch (err) { console.error("Client fetch failed"); }
//     };

//     useEffect(() => {
//         fetchTeamSubmissions();
//         fetchClients();
//     }, []);

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     // Quick Update Handler
//     const handleQuickEdit = (e, cand) => {
//         e.stopPropagation();
//         setSelectedCand(cand);
//         setEditForm({ main_status: cand.main_status || "SUBMITTED", sub_status: cand.sub_status || "NONE", remark: "" });
//         setShowModal(true);
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
//             notify("Status updated!");
//             setShowModal(false);
//             fetchTeamSubmissions();
//         } catch (err) { notify("Failed", "error"); }
//     };

//     // Client Submission Handler
//     const handleClientSubmitBtn = (e, cand) => {
//         e.stopPropagation();
//         setSelectedCand(cand);
//         setSubmitData({ target_id: "", client_rate: "", client_rate_type: "" });
//         setClientSearch("");
//         setShowClientModal(true);
//     };

//     const handleFinalClientSubmit = async () => {
//         if (!submitData.target_id || !submitData.client_rate || !submitData.client_rate_type)
//             return notify("Please fill all client details", "error");

//         const payload = {
//             client: submitData.target_id,
//             client_rate: submitData.client_rate,
//             client_rate_type: submitData.client_rate_type,
//             verification_status: true
//         };

//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", payload);
//             notify("Submitted to client!");
//             setShowClientModal(false);
//             fetchTeamSubmissions();
//         } catch (err) { notify("Submission failed", "error"); }
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     const renderRows = () => {
//         let lastDate = "";
//         return submissions.filter(item =>
//             item.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             item.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
//         ).map((s) => {
//             const currentDate = new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
//             let dateSeparator = currentDate !== lastDate ? (<tr key={`d-${s.id}`}><td colSpan="9" style={styles.dateSeparator}>{currentDate}</td></tr>) : null;
//             if (currentDate !== lastDate) lastDate = currentDate;

//             const statusStyle = getStatusStyles(s.main_status || "SUBMITTED");

//             return (
//                 <React.Fragment key={s.id}>
//                     {dateSeparator}
//                     <tr style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/employee/candidate/view/${s.id}`)}>
//                         <td style={{...styles.td, ...styles.colTime}}>{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
//                         <td style={{...styles.td, ...styles.colTeam}}>
//                             <div style={styles.teamText}>To: <b>{s.submitted_to_name || '-'}</b></div>
//                             <div style={styles.teamTextBy}>By: <b>{s.created_by_name || '-'}</b></div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colCand}}>
//                             <div style={styles.candName}>{truncate(s.candidate_name, 18)}</div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colTech}}>
//                             <span style={styles.techBadge} title={s.technology}>{truncate(s.technology, 20) || "N/A"}</span>
//                         </td>
//                         <td style={{...styles.td, ...styles.colExp}}>{s.years_of_experience_manual || "N/A"}</td>
//                         <td style={{...styles.td, ...styles.colVend}}>
//                             {truncate(s.vendor_company_name, 15)}
//                         </td>
//                         <td style={{...styles.td, ...styles.colRate}}>
//                             <div style={styles.rateText}>₹{s.vendor_rate}</div>
//                             <div style={styles.rateType}>{s.vendor_rate_type}</div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colStat}}>
//                             <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                                     <span style={{ ...styles.statusBadge, color: statusStyle.text }}>{s.main_status}</span>
//                                     {s.remark && <div title={s.remark}><Icons.Remark /></div>}
//                                 </div>
//                                 <small style={{ color: statusStyle.text, fontSize: '10px' }}>{s.sub_status}</small>
//                             </div>
//                         </td>
//                         <td style={{...styles.td, ...styles.colAct}}>
//                             <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
//                                 <button onClick={(e) => handleQuickEdit(e, s)} style={styles.iconBtn}><Icons.Edit /></button>
//                                 {!s.client_name ? (
//                                     <button style={styles.submitBtn} onClick={(e) => handleClientSubmitBtn(e, s)}>Submit to Client</button>
//                                 ) : (
//                                     <span style={styles.submittedTag}>✓ Client Submitted</span>
//                                 )}
//                             </div>
//                         </td>
//                     </tr>
//                 </React.Fragment>
//             );
//         });
//     };

//     return (
//         <BaseLayout>
//             {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>{toast.msg}</div>}

//             <div style={styles.header}>
//                 <div style={styles.titleSection}>
//                     <h2 style={styles.title}>All Team Submissions</h2>
//                 </div>
//                 <input placeholder="Search..." style={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
//             </div>

//             <div style={styles.tableWrapper}>
//                 <table style={styles.table}>
//                     <thead>
//                         <tr style={styles.tableHeader}>
//                             <th style={styles.colTime}>Time</th><th style={styles.colTeam}>Team Info</th><th style={styles.colCand}>Candidate</th>
//                             <th style={styles.colTech}>Tech</th><th style={styles.colExp}>Exp</th><th style={styles.colVend}>Vendor</th>
//                             <th style={styles.colRate}>Rate</th><th style={styles.colStat}>Status</th><th style={styles.colAct}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>{loading ? <tr><td colSpan="9" style={styles.loadingTd}>Loading...</td></tr> : renderRows()}</tbody>
//                 </table>
//             </div>

//             {/* STATUS MODAL */}
//             <StatusUpdateModal isOpen={showModal} onClose={() => setShowModal(false)} formData={editForm} setFormData={setEditForm} onSave={handleUpdateSubmit} />

//             {/* CLIENT SUBMISSION MODAL */}
//             {showClientModal && (
//                 <div style={styles.modalOverlay}>
//                     <div style={styles.modalContent}>
//                         <h3 style={{color:'#25343F', marginBottom:'15px'}}>Submit to Client</h3>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.modalLabel}>Client Name</label>
//                             <input type="text" placeholder="Search client..." style={{...styles.select, marginBottom:'10px'}} onChange={(e) => setClientSearch(e.target.value)} />
//                             <select style={{...styles.select, height:'120px'}} size="5" value={submitData.target_id} onChange={(e) => setSubmitData({...submitData, target_id: e.target.value})}>
//                                 <option value="">-- Choose Client --</option>
//                                 {clientsList.filter(c => (c.company_name || c.client_name).toLowerCase().includes(clientSearch.toLowerCase())).map(item => (
//                                     <option key={item.id} value={item.id}>{item.company_name || item.client_name}</option>
//                                 ))}
//                             </select>
//                         </div>
//                         <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
//                             <div style={styles.inputGroup}><label style={styles.modalLabel}>Client Rate</label>
//                                 <input type="number" style={styles.select} value={submitData.client_rate} onChange={(e) => setSubmitData({...submitData, client_rate: e.target.value})} />
//                             </div>
//                             <div style={styles.inputGroup}><label style={styles.modalLabel}>Rate Type</label>
//                                 <select style={styles.select} value={submitData.client_rate_type} onChange={(e) => setSubmitData({...submitData, client_rate_type: e.target.value})}>
//                                     <option value="">Type</option><option value="LPM">LPM</option><option value="PHR">PHR</option><option value="LPA">LPA</option>
//                                 </select>
//                             </div>
//                         </div>
//                         <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
//                             <button style={styles.saveBtn} onClick={handleFinalClientSubmit}>Confirm Submit</button>
//                             <button style={styles.cancelBtn} onClick={() => setShowClientModal(false)}>Cancel</button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </BaseLayout>
//     );
// }

// const styles = {
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
//     title: { margin: 0, color: "#25343F", fontWeight: "800", fontSize: "22px" },
//     searchInput: { padding: "10px 15px", borderRadius: "10px", border: "1px solid #CBD5E1", width: "250px", outline: "none" },
//     tableWrapper: { background: "#fff", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden" },
//     table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" },
//     tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #F1F5F9" },
//     th: { padding: "14px 12px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase" },
//     tableRow: { borderBottom: "1px solid #F1F5F9", cursor: "pointer" },
//     td: { padding: "14px 12px", fontSize: "13px", color: "#334155", verticalAlign: "middle" },

//     colTime: { width: "80px" }, colTeam: { width: "160px" }, colCand: { width: "180px" }, colTech: { width: "140px" },
//     colExp:  { width: "60px" }, colVend: { width: "140px" }, colRate: { width: "100px" }, colStat: { width: "140px" }, colAct:  { width: "180px" },

//     dateSeparator: { padding: "10px 20px", background: "#F1F5F9", color: "#475569", fontWeight: "800", fontSize: "12px", textTransform: "uppercase" },
//     teamText: { fontSize: "12px", fontWeight: "600" },
//     teamTextBy: { fontSize: "11px", color: "#27AE60", marginTop: "2px" },
//     candName: { fontWeight: "700", fontSize: "14px" },
//     techBadge: { background: "#fff", border: "1px solid #CBD5E1", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' },
//     statusBadge: { padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "800" },
//     rateText: { fontWeight: "700" }, rateType: { fontSize: "10px", color: "#94A3B8" },
//     iconBtn: { border: "1px solid #E2E8F0", background: "#fff", padding: "6px", borderRadius: "8px", cursor: "pointer" },
//     submitBtn: { background: '#25343F', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
//     submittedTag: { color: '#27AE60', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap' },

//     modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
//     modalContent: { background: '#fff', padding: '25px', borderRadius: '15px', width: '380px' },
//     inputGroup: { marginBottom: '12px' },
//     modalLabel: { fontSize: '10px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '5px' },
//     select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize:'13px' },
//     saveBtn: { flex: 1, background: '#FF9B51', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
//     cancelBtn: { flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
//     loadingTd: { textAlign: "center", padding: "40px", color: "#64748B" }
// };

// export default TeamSubmissions;

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// // Reusable Utilities aur Components
// import { getStatusStyles } from "../../utils/statusHelper";
// import StatusUpdateModal from "../../components/StatusUpdateModal";
// import "./TeamSubmissions.css";

// const Icons = {
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
//     External: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
// };

// function TeamSubmissions() {
//     const navigate = useNavigate();
//     const [submissions, setSubmissions] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [clientSearch, setClientSearch] = useState("");

//     // Modals & Forms State
//     const [showModal, setShowModal] = useState(false);
//     const [showClientModal, setShowClientModal] = useState(false);
//     const [clientsList, setClientsList] = useState([]);
//     const [selectedCand, setSelectedCand] = useState(null);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });
//     const [submitData, setSubmitData] = useState({ target_id: "", client_rate: "", client_rate_type: "" });
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     const fetchTeamSubmissions = async () => {
//         setLoading(true);
//         try {
//             const res = await apiRequest("/employee-portal/team/all-submissions/", "GET");
//             setSubmissions(Array.isArray(res) ? res : (res.results || []));
//         } catch (err) { console.error(err); } finally { setLoading(false); }
//     };

//     const fetchClients = async () => {
//         try {
//             const res = await apiRequest("/employee-portal/clients/list/", "GET");
//             setClientsList(res.results || (Array.isArray(res) ? res : []));
//         } catch (err) { console.error("Client fetch failed"); }
//     };

//     useEffect(() => {
//         fetchTeamSubmissions();
//         fetchClients();
//     }, []);

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     // Quick Update Handler
//     const handleQuickEdit = (e, cand) => {
//         e.stopPropagation();
//         setSelectedCand(cand);
//         setEditForm({ main_status: cand.main_status || "SUBMITTED", sub_status: cand.sub_status || "NONE", remark: "" });
//         setShowModal(true);
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
//             notify("Status updated!");
//             setShowModal(false);
//             fetchTeamSubmissions();
//         } catch (err) { notify("Failed", "error"); }
//     };

//     // Client Submission Handler
//     const handleClientSubmitBtn = (e, cand) => {
//         e.stopPropagation();
//         setSelectedCand(cand);
//         setSubmitData({ target_id: "", client_rate: "", client_rate_type: "" });
//         setClientSearch("");
//         setShowClientModal(true);
//     };

//     const handleFinalClientSubmit = async () => {
//         if (!submitData.target_id || !submitData.client_rate || !submitData.client_rate_type)
//             return notify("Please fill all client details", "error");

//         const payload = {
//             client: submitData.target_id,
//             client_rate: submitData.client_rate,
//             client_rate_type: submitData.client_rate_type,
//             verification_status: true
//         };

//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", payload);
//             notify("Submitted to client!");
//             setShowClientModal(false);
//             fetchTeamSubmissions();
//         } catch (err) { notify("Submission failed", "error"); }
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     const renderRows = () => {
//         return submissions.filter(item =>
//             item.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             item.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             item.vendor_company_name?.toLowerCase().includes(searchTerm.toLowerCase())
//         ).map((s) => {
//             const statusStyle = getStatusStyles(s.main_status || "SUBMITTED");
//             const isClientSubmitted = s.client_name && s.verification_status;

//             return (
//                 <tr key={s.id} style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/employee/candidate/view/${s.id}`)}>
//                     <td style={{...styles.td, ...styles.colTime}}>
//                         <div style={styles.timeText}>{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
//                         <div style={styles.dateText}>{new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
//                     </td>
//                     <td style={{...styles.td, ...styles.colCand}}>
//                         <div style={styles.candName}>{s.candidate_name || 'N/A'}</div>
//                         <div style={styles.candEmail}>{truncate(s.candidate_email || s.candidate_number || '-', 18)}</div>
//                     </td>
//                     <td style={{...styles.td, ...styles.colTech}}>
//                         <span style={styles.techBadge} title={s.technology}>{truncate(s.technology, 15) || "N/A"}</span>
//                     </td>
//                     <td style={{...styles.td, ...styles.colExp}}>
//                         <span style={styles.expText}>{s.years_of_experience_manual || s.years_of_experience_calculated || "N/A"}</span>
//                     </td>
//                     <td style={{...styles.td, ...styles.colVend}}>
//                         <div style={styles.vendorName}>{truncate(s.vendor_company_name, 15)}</div>
//                         <div style={styles.vendorRate}>₹{s.vendor_rate} <span style={{color: '#94A3B8'}}>{s.vendor_rate_type}</span></div>
//                     </td>
//                     <td style={{...styles.td, ...styles.colClient}}>
//                         <div style={styles.clientName}>{truncate(s.client_company_name || s.client_name || 'Not Set', 15)}</div>
//                         {s.client_rate && <div style={styles.clientRate}>₹{s.client_rate} <span style={{color: '#94A3B8'}}>{s.client_rate_type}</span></div>}
//                     </td>
//                     <td style={{...styles.td, ...styles.colStat}}>
//                         <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
//                             <span style={{ ...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.text, borderRadius: '4px' }}>
//                                 {s.main_status}
//                             </span>
//                             {s.sub_status && s.sub_status !== 'NONE' && (
//                                 <small style={{ color: '#475569', fontSize: '10px', fontWeight: '600' }}>
//                                     {s.sub_status}
//                                 </small>
//                             )}
//                             {s.remark && <small style={{ color: '#FF9B51', fontSize: '9px', fontWeight: '700' }}>⚠ Remark</small>}
//                         </div>
//                     </td>
//                     <td style={{...styles.td, ...styles.colTeam}}>
//                         <div style={styles.teamInfo}>
//                             <div style={styles.infoLabel}>To: <b style={{fontSize: '11px'}}>{truncate(s.submitted_to_name || '-', 12)}</b></div>
//                             <div style={styles.infoLabelBy}>By: <b style={{fontSize: '10px'}}>{truncate(s.created_by_name || '-', 12)}</b></div>
//                         </div>
//                     </td>
//                     <td style={{...styles.td, ...styles.colAct}}>
//                         <div style={styles.actionCell}>
//                             <button onClick={(e) => handleQuickEdit(e, s)} style={styles.iconBtn} title="Edit Status"><Icons.Edit /></button>
//                             {!isClientSubmitted ? (
//                                 <button style={styles.submitBtn} onClick={(e) => handleClientSubmitBtn(e, s)}>
//                                     Submit
//                                 </button>
//                             ) : (
//                                 <span style={styles.submittedTag}>✓ Submitted</span>
//                             )}
//                         </div>
//                     </td>
//                 </tr>
//             );
//         });
//     };

//     return (
//         <BaseLayout>
//             <style>{responsiveStyles}</style>
//             <div className="team-submissions-container">
//                 {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}} className="toast-notification">{toast.msg}</div>}

//                 <div style={styles.header} className="team-submissions-header">
//                     <div style={styles.titleSection}>
//                         <h2 style={styles.title}>Team Submissions</h2>
//                     </div>
//                     <input
//                         type="text"
//                         placeholder="Search candidate, vendor, or team..."
//                         style={styles.searchInput}
//                         className="team-submissions-search"
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                 </div>

//                 <div style={styles.tableWrapper} className="team-submissions-table-wrapper">
//                     <table style={styles.table} className="team-submissions-table">
//                         <thead>
//                             <tr style={styles.tableHeader}>
//                                 <th style={{...styles.th, ...styles.colTime}}>Date & Time</th>
//                                 <th style={{...styles.th, ...styles.colCand}}>Candidate</th>
//                                 <th style={{...styles.th, ...styles.colTech}}>Technology</th>
//                                 <th style={{...styles.th, ...styles.colExp}}>Experience</th>
//                                 <th style={{...styles.th, ...styles.colVend}}>Vendor Details</th>
//                                 <th style={{...styles.th, ...styles.colClient}}>Client Details</th>
//                                 <th style={{...styles.th, ...styles.colStat}}>Status</th>
//                                 <th style={{...styles.th, ...styles.colTeam}}>Team Info</th>
//                                 <th style={{...styles.th, ...styles.colAct}}>Action</th>
//                             </tr>
//                         </thead>
//                         <tbody>{loading ? <tr><td colSpan="9" style={styles.loadingTd} className="loading-row">Loading...</td></tr> : renderRows()}</tbody>
//                     </table>
//                 </div>

//                 {/* STATUS MODAL */}
//                 <StatusUpdateModal isOpen={showModal} onClose={() => setShowModal(false)} formData={editForm} setFormData={setEditForm} onSave={handleUpdateSubmit} />

//                 {/* CLIENT SUBMISSION MODAL */}
//                 {showClientModal && (
//                     <div style={styles.modalOverlay} className="modal-overlay">
//                         <div style={styles.modalContent} className="modal-content">
//                             <h3 style={{color:'#25343F', marginBottom:'20px', fontSize: '18px', fontWeight: '800'}} className="modal-heading">Submit Candidate to Client</h3>
//                             <div style={styles.inputGroup}>
//                                 <label style={styles.modalLabel}>Client Name</label>
//                                 <input
//                                     type="text"
//                                     placeholder="Search client..."
//                                     style={{...styles.select, marginBottom:'10px', fontSize: '13px'}}
//                                     onChange={(e) => setClientSearch(e.target.value)}
//                                 />
//                                 <select
//                                     style={{...styles.select, height:'110px', fontSize: '13px'}}
//                                     size="5"
//                                     value={submitData.target_id}
//                                     onChange={(e) => setSubmitData({...submitData, target_id: e.target.value})}>
//                                     <option value="">-- Choose Client --</option>
//                                     {clientsList.filter(c => (c.company_name || c.client_name).toLowerCase().includes(clientSearch.toLowerCase())).map(item => (
//                                         <option key={item.id} value={item.id}>{item.company_name || item.client_name}</option>
//                                     ))}
//                                 </select>
//                             </div>
//                             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
//                                 <div style={styles.inputGroup}>
//                                     <label style={styles.modalLabel}>Rate</label>
//                                     <input type="number" style={{...styles.select, fontSize: '13px'}} value={submitData.client_rate} placeholder="0.00" onChange={(e) => setSubmitData({...submitData, client_rate: e.target.value})} />
//                                 </div>
//                                 <div style={styles.inputGroup}>
//                                     <label style={styles.modalLabel}>Rate Type</label>
//                                     <select style={{...styles.select, fontSize: '13px'}} value={submitData.client_rate_type} onChange={(e) => setSubmitData({...submitData, client_rate_type: e.target.value})}>
//                                         <option value="">Type</option>
//                                         <option value="LPM">LPM</option>
//                                         <option value="PHR">PHR</option>
//                                         <option value="LPA">LPA</option>
//                                         <option value="KPM">KPM</option>
//                                     </select>
//                                 </div>
//                             </div>
//                             <div style={{display:'flex', gap:'12px', marginTop:'25px'}} className="button-group">
//                                 <button style={styles.saveBtn} className="submit-btn" onClick={handleFinalClientSubmit}>Submit</button>
//                                 <button style={styles.cancelBtn} onClick={() => setShowClientModal(false)}>Cancel</button>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </BaseLayout>
//     );
// }

// const styles = {
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '14px 28px', borderRadius: '10px', zIndex: 9999, fontWeight: '700', boxShadow: '0 6px 20px rgba(0,0,0,0.2)', fontSize: '13px' },
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "20px", flexWrap: "wrap" },
//     titleSection: { flex: 1 },
//     title: { margin: 0, color: "#25343F", fontWeight: "800", fontSize: "clamp(20px, 5vw, 26px)" },
//     searchInput: { padding: "12px 16px", borderRadius: "10px", border: "1px solid #CBD5E1", width: "100%", maxWidth: "350px", outline: "none", fontSize: "13px", transition: "all 0.3s ease" },
//     tableWrapper: { background: "#fff", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", WebkitOverflowScrolling: "touch" },
//     table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: "clamp(11px, 1.5vw, 13px)", minWidth: "1200px" },
//     tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #E2E8F0", position: "sticky", top: 0, zIndex: 10 },
//     th: { padding: "14px 10px", textAlign: "left", fontSize: "clamp(9px, 1.2vw, 11px)", color: "#64748B", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" },
//     tableRow: { borderBottom: "1px solid #E2E8F0", cursor: "pointer", transition: "all 0.2s ease" },
//     td: { padding: "14px 10px", fontSize: "clamp(11px, 1.5vw, 13px)", color: "#334155", verticalAlign: "middle" },

//     colTime: { width: "100px", minWidth: "100px" },
//     colTeam: { width: "120px", minWidth: "120px" },
//     colCand: { width: "145px", minWidth: "145px" },
//     colTech: { width: "110px", minWidth: "110px" },
//     colExp:  { width: "85px", minWidth: "85px" },
//     colVend: { width: "125px", minWidth: "125px" },
//     colRate: { width: "100px", minWidth: "100px" },
//     colClient: { width: "125px", minWidth: "125px" },
//     colStat: { width: "110px", minWidth: "110px" },
//     colAct:  { width: "140px", minWidth: "140px" },

//     timeText: { fontWeight: "700", fontSize: "clamp(11px, 1.3vw, 12px)" },
//     dateText: { fontSize: "clamp(9px, 1vw, 10px)", color: "#94A3B8", marginTop: "2px" },
//     expText: { fontWeight: "600", fontSize: "clamp(11px, 1.3vw, 12px)" },
//     teamInfo: { fontSize: "clamp(10px, 1.2vw, 11px)" },
//     infoLabel: { fontSize: "clamp(10px, 1.2vw, 11px)", fontWeight: "700", marginBottom: "2px", color: "#25343F" },
//     infoLabelBy: { fontSize: "clamp(9px, 1vw, 10px)", color: "#27AE60", fontWeight: "700" },
//     candName: { fontWeight: "700", fontSize: "clamp(11px, 1.3vw, 13px)", marginBottom: "2px", color: "#25343F" },
//     candEmail: { fontSize: "clamp(9px, 1vw, 11px)", color: "#94A3B8", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
//     vendorName: { fontWeight: "700", fontSize: "clamp(11px, 1.3vw, 12px)", marginBottom: "3px", color: "#25343F" },
//     vendorRate: { fontSize: "clamp(9px, 1vw, 10px)", color: "#475569", fontWeight: "600" },
//     clientName: { fontWeight: "700", fontSize: "clamp(11px, 1.3vw, 12px)", marginBottom: "3px", color: "#25343F" },
//     clientRate: { fontSize: "clamp(9px, 1vw, 10px)", color: "#475569", fontWeight: "600" },
//     techBadge: { background: "#EFF6FF", border: "1px solid #BFDBFE", padding: "5px 8px", borderRadius: "5px", fontSize: "clamp(9px, 1vw, 11px)", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block', color: "#1E40AF", fontWeight: "600" },
//     statusBadge: { padding: "6px 10px", borderRadius: "5px", fontSize: "clamp(9px, 1vw, 10px)", fontWeight: "800", textAlign: "center", minWidth: "80px" },
//     rateText: { fontWeight: "700" },
//     rateType: { fontSize: "clamp(9px, 1vw, 10px)", color: "#94A3B8" },
//     actionCell: { display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' },
//     iconBtn: { border: "1px solid #E2E8F0", background: "#fff", padding: "7px 8px", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "32px", minHeight: "32px", flexShrink: 0 },
//     submitBtn: { background: '#FF9B51', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: 'clamp(10px, 1vw, 11px)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap', flexShrink: 0 },
//     submittedTag: { color: '#27AE60', fontWeight: '700', fontSize: 'clamp(9px, 1vw, 11px)', whiteSpace: 'nowrap', padding: '5px 8px', background: '#D4EDDA', borderRadius: '5px', flexShrink: 0 },

//     modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
//     modalContent: { background: '#fff', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '420px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' },
//     inputGroup: { marginBottom: '18px' },
//     modalLabel: { fontSize: '10px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
//     select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize:'13px', fontFamily: 'inherit' },
//     saveBtn: { flex: 1, background: '#FF9B51', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '13px' },
//     cancelBtn: { flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '13px' },
//     loadingTd: { textAlign: "center", padding: "40px", color: "#64748B", fontSize: "14px", fontWeight: "600" }
// };

// export default TeamSubmissions;

// const responsiveStyles = `
//     @media (max-width: 1400px) {
//         table { min-width: 1000px !important; }
//     }

//     @media (max-width: 1200px) {
//         table { min-width: 900px !important; }
//     }

//     @media (max-width: 1024px) {
//         table { min-width: 800px !important; }
//     }

//     @media (max-width: 768px) {
//         table { min-width: 700px !important; }
//     }

//     @media (max-width: 640px) {
//         table { min-width: 650px !important; }
//     }

//     thead > tr > th,
//     tbody > tr > td {
//         padding: 10px 8px !important;
//         font-size: 11px !important;
//     }

//     button, span, input, select {
//         font-size: 12px !important;
//     }
// `;
