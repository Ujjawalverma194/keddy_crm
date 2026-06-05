import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, API_BASE } from "../../services/api";
import SubAdminLayout from "../components/SubAdminLayout";
import mammoth from "mammoth";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// External Imports
import StatusUpdateModal from "../../components/StatusUpdateModal";
import { getStatusStyles } from "../../utils/statusHelper";
import {
  getSubmittedToName,
  getCreatedByName,
} from "../../utils/candidateDisplay";


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
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
  TrashIcon: ({ color }) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  ),
  File: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
      <polyline points="13 2 13 9 20 9"></polyline>
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
  Alert: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#E74C3C"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
  Preview: () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
),

Download: () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
),
};

function ActivePipelineList() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedCand, setSelectedCand] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
const [previewHtml, setPreviewHtml] = useState("");
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [previewType, setPreviewType] = useState("");
const [pdfPages, setPdfPages] = useState(null);
  const [editForm, setEditForm] = useState({
    main_status: "",
    sub_status: "",
    remark: "",
  });

  const notify = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const fetchPipeline = async (search) => {
    setLoading(true);
    try {
      let url = `/sub-admin/api/subadmin/dashboard/pipeline/`;
      if (search) url += `?search=${search}`;
      const res = await apiRequest(url, "GET");
      setCandidates(Array.isArray(res) ? res : res.results || []);
    } catch (err) {
      console.error(err);
      notify("Failed to load pipeline", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline(searchTerm);
  }, [searchTerm]);

  const handleUpdateSubmit = async () => {
    try {
      await apiRequest(
        `/employee-portal/candidates/${selectedCand.id}/update/`,
        "PUT",
        editForm,
      );
      notify("Status Updated");
      setShowStatusModal(false);
      fetchPipeline(searchTerm);
    } catch (err) {
      notify("Failed to update", "error");
    }
  };

  const handleDeleteAction = async (deleteType) => {
    const actionUrl =
      deleteType === "soft"
        ? `/sub-admin/candidates/${selectedCand.id}/soft-delete/`
        : `/sub-admin/candidates/${selectedCand.id}/hard-delete/`;
    try {
      await apiRequest(actionUrl, "DELETE");
      notify(
        deleteType === "soft" ? "Moved to Trash" : "Permanently Deleted",
        "success",
      );
      setShowDeletePopup(false);
      fetchPipeline(searchTerm);
    } catch (err) {
      notify("Delete failed", "error");
    }
  };

  const truncate = (text, limit) =>
    text?.length > limit ? text.substring(0, limit) + "..." : text;
const getFileUrl = (resume) =>
  resume.startsWith("http") ? resume : `${API_BASE}${resume}`;
const handleDownloadCV = (e, resume) => {
  e.stopPropagation();

  const link = document.createElement("a");
  link.href = getFileUrl(resume);
  link.download = resume.split("/").pop();

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
  const renderRows = () => {
    let lastDate = "";
    return candidates.map((c, i) => {
      const currentDate = new Date(c.created_at)
        .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
        .toUpperCase();
      let dateSeparator =
        currentDate !== lastDate ? (
          <tr key={`sep-${i}`}>
            <td colSpan="11" style={styles.dateSeparator}>
              {currentDate}
            </td>
          </tr>
        ) : null;
      lastDate = currentDate;

      const statusStyle = getStatusStyles(c.main_status || "SUBMITTED");
      return (
        <React.Fragment key={c.id || i}>
          {dateSeparator}
          <tr
            style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }}
            onClick={() => navigate(`/sub-admin/candidate/view/${c.id}`)}
          >
            <td style={styles.td}>
              <div style={{ fontSize: "11px" }}>
                To: <b>{truncate(getSubmittedToName(c), 12) || "-"}</b>
              </div>
              <div style={{ fontSize: "11px" }}>
                By:{" "}
                <b style={{ color: "#27AE60" }}>
                  {truncate(getCreatedByName(c), 12) || "-"}
                </b>
              </div>
            </td>
            <td style={styles.td}>
              <b>{truncate(c.candidate_name, 15)}</b>
            </td>
            <td style={styles.td}>{truncate(c.technology || "N/A", 15)}</td>
            <td style={styles.td}>{c.years_of_experience_manual || "0"} Yrs</td>
            <td style={styles.td}>
              {truncate(c.client_company_name || c.client_name || "N/A", 15)}
            </td>
            <td style={styles.td}>
              <div style={{ fontWeight: "700", fontSize: "11px" }}>
                {truncate(c.vendor_company_name || c.vendor_name, 12)}
              </div>
              <small style={styles.subStatusText}>
                {c.vendor_number || "N/A"}
              </small>
            </td>
            <td style={styles.td}>₹{c.vendor_rate} {c.vendor_rate_type || ''}</td>
            <td style={styles.td}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <span
                  style={{
                    ...styles.badge,
                    color: statusStyle.text,
                    fontWeight: "800",
                  }}
                >
                  {c.main_status}
                </span>
                {c.remark && (
                  <div style={styles.remarkIcon} title={c.remark}>
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
                {truncate(c.sub_status, 12)}
              </small>
            </td>
            <td style={styles.td}>
             <td style={styles.td}>
  {!c.resume ? (
    <span style={styles.noCvText}>Not Uploaded</span>
  ) : (
    <div style={{ display: "flex", gap: "6px" }}>
      <button
        style={styles.iconBtn}
        title="Preview"
      >
        <Icons.Preview />
      </button>

      <button
        onClick={(e) => handleDownloadCV(e, c.resume)}
        style={styles.iconBtn}
        title="Download"
      >
        <Icons.Download />
      </button>
    </div>
  )}
</td>
            </td>
            <td style={styles.td}>
              <div
                style={{ display: "flex", gap: "4px", alignItems: "center" }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCand(c);
                    setEditForm({
                      main_status: c.main_status,
                      sub_status: c.sub_status,
                      remark: c.remark,
                    });
                    setShowStatusModal(true);
                  }}
                  style={styles.editBtn}
                >
                  <Icons.Edit />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCand(c);
                    setShowDeletePopup(true);
                  }}
                  style={styles.trashBtn}
                >
                  <Icons.TrashIcon color="#E74C3C" />
                </button>
              </div>
            </td>
          </tr>
        </React.Fragment>
      );
    });
  };

  return (
    <SubAdminLayout>
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
      <div style={styles.btnGroup}>
        <button
          onClick={() => navigate(-1)}
          style={{ ...styles.actionBtn, background: "#25343F" }}
        >
          ← Back
        </button>
      </div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.welcome}>Team Pipeline ({candidates.length})</h2>
          <p style={styles.subText}>Active recruitment tracking.</p>
        </div>
      </div>

      <div style={styles.filterBar}>
        <input
          placeholder="Search pipeline..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={styles.sectionContainer}>
        <div style={styles.tableWrapper}>
          <div style={{ overflow: "hidden" }}>
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={{ ...styles.th, width: "130px" }}>To/By</th>
                  <th style={{ ...styles.th, width: "120px" }}>Candidate</th>
                  <th style={{ ...styles.th, width: "110px" }}>Tech</th>
                  <th style={{ ...styles.th, width: "65px" }}>Exp</th>
                  <th style={{ ...styles.th, width: "120px" }}>Client</th>
                  <th style={{ ...styles.th, width: "130px" }}>Vendor</th>
                  <th style={{ ...styles.th, width: "90px" }}>Rate</th>
                  <th style={{ ...styles.th, width: "110px" }}>Status</th>
                  <th style={{ ...styles.th, width: "70px" }}>CV</th>
                  <th style={{ ...styles.th, width: "90px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" style={styles.loadingTd}>
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
      </div>

      {showDeletePopup && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowDeletePopup(false)}
        >
          <div
            style={styles.deleteContent}
            onClick={(e) => e.stopPropagation()}
          >
            <Icons.Alert />
            <h3
              style={{
                margin: "15px 0 5px",
                color: "#25343F",
                fontWeight: "800",
              }}
            >
              Delete?
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                style={styles.softBtn}
                onClick={() => handleDeleteAction("soft")}
              >
                Trash
              </button>
              <button
                style={styles.hardBtn}
                onClick={() => handleDeleteAction("hard")}
              >
                Permanent Delete
              </button>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        formData={editForm}
        setFormData={setEditForm}
        onSave={handleUpdateSubmit}
      />
    </SubAdminLayout>
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
    zIndex: 10001,
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
  btnGroup: { display: "flex", gap: "10px", alignItems: "center" },
  actionBtn: {
    background: "#FF9B51",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
  },
  filterBar: { display: "flex", gap: "15px", marginBottom: "20px" },
  searchInput: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #F0F2F4",
    outline: "none",
    fontSize: "13px",
  },
  sectionContainer: { marginBottom: "35px" },
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
  cvBtn: {
    background: "#F1F5F9",
    border: "1px solid #E2E8F0",
    color: "#25343F",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  editBtn: {
    border: "none",
    background: "#F1F5F9",
    padding: "6px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  trashBtn: {
    border: "none",
    background: "#FFF5F5",
    padding: "6px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  loadingTd: {
    textAlign: "center",
    padding: "40px",
    fontWeight: "800",
    color: "#25343F",
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
  deleteContent: {
    background: "#fff",
    padding: "30px",
    borderRadius: "20px",
    width: "350px",
    textAlign: "center",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
  },
  softBtn: {
    background: "#FFF5F5",
    color: "#E74C3C",
    border: "1px solid #FED7D7",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
    fontSize: "13px",
  },
  hardBtn: {
    background: "#E74C3C",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
    fontSize: "13px",
  },
  cancelBtn: {
    background: "transparent",
    color: "#7F8C8D",
    border: "none",
    padding: "10px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
  },
  iconBtn: {
  width: "30px",
  height: "30px",
  border: "1px solid #E2E8F0",
  background: "#F8FAFC",
  borderRadius: "7px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#475569",
},

noCvText: {
  color: "#94A3B8",
  fontSize: "11px",
  fontWeight: "800",
  background: "#F8FAFC",
  border: "1px dashed #CBD5E1",
  padding: "6px 10px",
  borderRadius: "6px",
  display: "inline-block",
},

previewModalOverlay: {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(37, 52, 63, 0.75)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10000,
},

previewModalContent: {
  background: "#fff",
  width: "85%",
  height: "90%",
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
},

previewHeader: {
  padding: "12px 18px",
  borderBottom: "1px solid #E2E8F0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
},

previewCloseBtn: {
  background: "#F1F5F9",
  border: "none",
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  fontSize: "22px",
  cursor: "pointer",
  color: "#25343F",
},

pdfPreviewBox: {
  flex: 1,
  overflowY: "auto",
  padding: "20px",
  background: "#E5E7EB",
  display: "flex",
  justifyContent: "center",
},

wordPreviewBox: {
  flex: 1,
  padding: "40px",
  overflowY: "auto",
  background: "#fff",
  color: "#25343F",
  fontSize: "14px",
  lineHeight: "1.8",
  maxWidth: "900px",
  margin: "0 auto",
},
};

export default ActivePipelineList;
