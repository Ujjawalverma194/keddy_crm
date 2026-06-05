import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, API_BASE } from "../../services/api";
import SubAdminLayout from "../components/SubAdminLayout";
import mammoth from "mammoth";
// External Imports
import StatusUpdateModal from "../../components/StatusUpdateModal";
import { getStatusStyles } from "../../utils/statusHelper";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

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
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),

  Download: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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

  //   const [previewUrl, setPreviewUrl] = useState("");

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

  const fetchCandidates = async (page, search, tech) => {
    setLoading(true);
    try {
      let url = `/sub-admin/api/admin-candidates/?page=${page}`;
      if (search) url += `&search=${search}`;
      if (tech) url += `&technology=${tech}`;
      const res = await apiRequest(url, "GET");
      setCandidates(res.results || []);
      setCount(res.count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates(currentPage, searchTerm, techFilter);
  }, [currentPage, searchTerm, techFilter]);

  const handleUpdateSubmit = async () => {
    try {
      await apiRequest(
        `/employee-portal/candidates/${selectedCand.id}/update/`,
        "PUT",
        editForm,
      );
      notify("Status Updated");
      setShowStatusModal(false);
      fetchCandidates(currentPage, searchTerm, techFilter);
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
      fetchCandidates(currentPage, searchTerm, techFilter);
    } catch (err) {
      notify("Delete failed", "error");
    }
  };

  const truncate = (text, limit) =>
    text?.length > limit ? text.substring(0, limit) + "..." : text;
  const getFileUrl = (resume) => {
    if (!resume) return "";

    return resume.startsWith("http") ? resume : `${API_BASE}${resume}`;
  };

 const handleOpenCV = (e, resume) => {
  e.stopPropagation();

  const fileUrl = getFileUrl(resume);

  window.open(fileUrl, "_blank", "noopener,noreferrer");
};

  const handlePreviewDoc = async (e, resume) => {
    e.stopPropagation();

    try {
      const fileUrl = getFileUrl(resume);

      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();

      const result = await mammoth.convertToHtml({ arrayBuffer });

      setPreviewHtml(result.value);
      setPreviewType("docx");
      setPreviewUrl("");
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Preview error:", error);
      notify("Preview not available. Please download the resume.", "error");
    }
  };
const handlePreviewPDF = async (e, resume) => {
  e.stopPropagation();

  try {
    const fileUrl = getFileUrl(resume);
    console.log("PDF URL:", fileUrl);

    const response = await fetch(fileUrl);
    console.log("PDF status:", response.status);
    console.log("PDF content-type:", response.headers.get("content-type"));

    const blob = await response.blob();
    console.log("PDF blob type:", blob.type);
    console.log("PDF blob size:", blob.size);

    if (!blob.type.includes("pdf")) {
      notify("PDF file URL valid PDF return nahi kar raha", "error");
      return;
    }

    const blobUrl = URL.createObjectURL(blob);

    setPreviewUrl(blobUrl);
    setPreviewType("pdf");
    setPreviewHtml("");
    setPdfPages(null);
    setShowPreviewModal(true);
  } catch (error) {
    console.error("PDF preview error:", error);
    notify("PDF preview failed. Please download the resume.", "error");
  }
};
  const renderGroupedRows = () => {
    let lastDate = "";
    return candidates.map((c, i) => {
      const currentDate = new Date(c.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      let dateSeparator =
        currentDate !== lastDate ? (
          <tr key={`sep-${i}`}>
            <td colSpan="10" style={styles.dateSeparator}>
              {currentDate}
            </td>
          </tr>
        ) : null;
      lastDate = currentDate;

      const statusStyle = getStatusStyles(c.main_status || "SUBMITTED");
      return (
        <React.Fragment key={c.id}>
          {dateSeparator}
          <tr
            style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }}
            onClick={() => navigate(`/sub-admin/candidate/view/${c.id}`)}
          >
            {/* 1. Submitted To/By */}
            <td style={styles.td}>
              <div>
                To: <b>{c.submitted_to_name || "-"}</b>
              </div>
              <div>
                By:{" "}
                <b style={{ color: "#27AE60" }}>{c.created_by_name || "-"}</b>
              </div>
            </td>
            {/* 2. Candidate */}
            <td style={styles.td}>
              <b>{c.candidate_name}</b>
            </td>
            {/* 3. Tech */}
            <td style={styles.td}>{truncate(c.technology, 30)}</td>
            {/* 4. Exp */}
            <td style={styles.td}>{c.years_of_experience_manual || "0"} Yrs</td>
            {/* 5. Client */}
            <td style={styles.td}>{c.client_name || "N/A"}</td>
            {/* 6. Vendor */}
            <td style={styles.td}>
              <b>{truncate(c.vendor_company_name || c.vendor_name, 15)}</b>
              <br />
              <small style={styles.subStatusText}>
                {c.vendor_number || "N/A"}
              </small>
            </td>
            {/* 7. Rate */}
            <td style={styles.td}>
              ₹{c.vendor_rate} {c.vendor_rate_type || ""}
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
                {c.sub_status}
              </small>
            </td>
            {/* 9. CV */}
            <td style={styles.td}>
              {!c.resume ? (
                <span style={styles.noCvText}>Not Uploaded</span>
              ) : (
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={(e) =>
                      c.resume.toLowerCase().endsWith(".pdf")
                        ? handlePreviewPDF(e, c.resume)
                        : handlePreviewDoc(e, c.resume)
                    }
                    style={styles.iconBtn}
                    title="Preview Resume"
                  >
                    <Icons.Preview />
                  </button>

                <button
  onClick={(e) => handleOpenCV(e, c.resume)}
  style={styles.iconBtn}
  title="Open Resume"
>
  <Icons.Download />
</button>
                </div>
              )}
            </td>
            {/* 10. Action */}
            <td style={styles.td}>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
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
        <button
          onClick={() => navigate("/sub-admin/add-candidate")}
          style={styles.actionBtn}
        >
          + Add Candidate
        </button>
      </div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.welcome}>Total Profiles ({count})</h2>
          <p style={styles.subText}>
            Management dashboard for tracking recruitment progress.
          </p>
        </div>
      </div>

      <div style={styles.filterBar}>
        <input
          placeholder="Search name/email..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          placeholder="Tech Filter..."
          style={styles.filterInput}
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value)}
        />
      </div>

      <div style={styles.sectionContainer}>
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
                  <th style={styles.th}>CV</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={styles.loadingTd}>
                      Loading...
                    </td>
                  </tr>
                ) : (
                  renderGroupedRows()
                )}
              </tbody>
            </table>
          </div>
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
          {currentPage} / {Math.ceil(count / 10) || 1}
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
              Delete Candidate?
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#7F8C8D",
                marginBottom: "20px",
              }}
            >
              Remove <b>{selectedCand?.candidate_name}</b>
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                width: "100%",
              }}
            >
              <button
                style={styles.softBtn}
                onClick={() => handleDeleteAction("soft")}
              >
                Move to Trash (Soft Delete)
              </button>
              <button
                style={styles.hardBtn}
                onClick={() => handleDeleteAction("hard")}
              >
                Delete Permanently (Hard Delete)
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
      {showPreviewModal && (
        <div
          style={styles.previewModalOverlay}
          onClick={() => {
            setShowPreviewModal(false);
            if (previewUrl?.startsWith("blob:"))
              URL.revokeObjectURL(previewUrl);
            setPreviewUrl("");
          }}
        >
          <div
            style={styles.previewModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.previewHeader}>
              <h3 style={{ margin: 0, color: "#25343F" }}>Resume Preview</h3>

              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  if (previewUrl?.startsWith("blob:"))
                    URL.revokeObjectURL(previewUrl);
                  setPreviewUrl("");
                }}
                style={styles.previewCloseBtn}
              >
                ×
              </button>
            </div>

            {previewType === "pdf" ? (
              <div style={styles.pdfPreviewBox}>
                <Document
                  file={previewUrl}
                  onLoadSuccess={({ numPages }) => setPdfPages(numPages)}
                  onLoadError={(error) => {
                    console.error("PDF Error:", error);
                    notify("PDF preview failed", "error");
                  }}
                >
                  {Array.from(new Array(pdfPages || 0), (_, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      width={850}
                    />
                  ))}
                </Document>
              </div>
            ) : (
              <div
                style={styles.wordPreviewBox}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            )}
          </div>
        </div>
      )}
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
  btnGroup: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    justifyContent: "space-between",
  },
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
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    marginTop: "10px",
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

  iconBtn: {
    width: "32px",
    height: "32px",
    border: "1px solid #E2E8F0",
    background: "#F8FAFC",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#475569",
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
  previewIframe: {
    width: "100%",
    height: "100%",
    border: "none",
  },
  pdfPreviewBox: {
    flex: 1,
    overflowY: "auto",
    background: "#E5E7EB",
    padding: "25px",
    display: "flex",
    justifyContent: "center",
  },
};

export default CandidateList;

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import SubAdminLayout from "../components/SubAdminLayout";

// // External Imports
// import StatusUpdateModal from "../../components/StatusUpdateModal";
// import { getStatusStyles } from "../../utils/statusHelper";

// const Icons = {
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     TrashIcon: ({ color }) => (
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <polyline points="3 6 5 6 21 6"></polyline>
//             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//             <line x1="10" y1="11" x2="10" y2="17"></line>
//             <line x1="14" y1="11" x2="14" y2="17"></line>
//         </svg>
//     ),
//     File: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
//     Alert: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
// };

// function CandidateList() {
//     const navigate = useNavigate();
//     const [candidates, setCandidates] = useState([]);
//     const [count, setCount] = useState(0);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [loading, setLoading] = useState(true);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [techFilter, setTechFilter] = useState("");

//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });
//     const [showStatusModal, setShowStatusModal] = useState(false);
//     const [showDeletePopup, setShowDeletePopup] = useState(false);
//     const [selectedCand, setSelectedCand] = useState(null);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const fetchCandidates = async (page, search, tech) => {
//         setLoading(true);
//         try {
//             let url = `/sub-admin/api/admin-candidates/?page=${page}`;
//             if (search) url += `&search=${search}`;
//             if (tech) url += `&technology=${tech}`;
//             const res = await apiRequest(url, "GET");
//             setCandidates(res.results || []);
//             setCount(res.count || 0);
//         } catch (err) { console.error(err); }
//         finally { setLoading(false); }
//     };

//     useEffect(() => {
//         fetchCandidates(currentPage, searchTerm, techFilter);
//     }, [currentPage, searchTerm, techFilter]);

//     const handleUpdateSubmit = async () => {
//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
//             notify("Status Updated");
//             setShowStatusModal(false);
//             fetchCandidates(currentPage, searchTerm, techFilter);
//         } catch (err) { notify("Failed to update", "error"); }
//     };

//     // --- Delete Logic Fixed ---

//     const handleDeleteAction = async (deleteType) => {
//         if (!selectedCand || !selectedCand.id) {
//             notify("Candidate ID missing", "error");
//             return;
//         }

//         const actionUrl = deleteType === 'soft'
//             ? `/sub-admin/candidates/${selectedCand.id}/soft-delete/`
//             : `/sub-admin/candidates/${selectedCand.id}/hard-delete/`;

//         try {
//             // Hum directly check kar rahe hain ki kya request complete hui
//             const response = await apiRequest(actionUrl, "DELETE");

//             // Yahan hum ensure kar rahe hain ki data delete hua hai
//             notify(deleteType === 'soft' ? "Moved to Trash Successfully" : "Permanently Deleted", "success");
//             setShowDeletePopup(false);

//             // Refreshing the list immediately
//             setTimeout(() => {
//                 fetchCandidates(currentPage, searchTerm, techFilter);
//             }, 500);

//         } catch (err) {
//             console.error("Delete API Error:", err);
//             notify("API Error: Delete not processed on server", "error");
//         }
//     };

//     const openDeletePopup = (e, candidate) => {
//         e.stopPropagation(); // Stop row click
//         setSelectedCand(candidate);
//         setShowDeletePopup(true);
//     };

//     const openStatusModal = (e, candidate) => {
//         e.stopPropagation(); // Stop row click
//         setSelectedCand(candidate);
//         setEditForm({
//             main_status: candidate.main_status || "SUBMITTED",
//             sub_status: candidate.sub_status || "NONE",
//             remark: candidate.remark || ""
//         });
//         setShowStatusModal(true);
//     };

//     const handleCVView = (e, resumeUrl) => {
//         e.stopPropagation(); // Stop row click
//         if (resumeUrl) window.open(resumeUrl, '_blank');
//         else notify("No Resume Found", "error");
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     const renderGroupedRows = () => {
//         let lastDate = "";
//         return candidates.map((can, i) => {
//             const currentDate = new Date(can.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
//             let dateSeparator = currentDate !== lastDate ? (
//                 <tr key={`sep-${i}`}><td colSpan="10" style={styles.dateSeparator}>{currentDate}</td></tr>
//             ) : null;
//             lastDate = currentDate;

//             const statusStyle = getStatusStyles(can.main_status || "SUBMITTED");
//             return (
//                 <React.Fragment key={can.id}>
//                     {dateSeparator}
//                     <tr style={{ ...styles.tr, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/sub-admin/candidate/view/${can.id}`)}>
//                         <td style={styles.td}>
//                             <div style={{fontWeight: "700", color: "#1E293B"}}>{can.candidate_name}</div>
//                             <small style={{color: "#64748B"}}>{can.candidate_email}</small>
//                         </td>
//                         <td style={styles.td}><span style={{...styles.techBadge, color: statusStyle.text}}>{can.technology || "N/A"}</span></td>
//                         <td style={styles.td}><b>{can.years_of_experience_manual} Yrs</b></td>
//                         <td style={styles.td}>
//                             <div style={{fontSize: "12px"}}>To: <b>{can.submitted_to_name || "N/A"}</b></div>
//                             <div style={{fontSize: "11px", color: "#27AE60"}}>By: {can.created_by_name || "N/A"}</div>
//                         </td>
//                         <td style={styles.td}><b>{can.client_name || can.client || "N/A"}</b></td>
//                         <td style={styles.td}><b>{truncate(can.vendor_company_name || can.vendor, 15)}</b></td>
//                         <td style={styles.td}>₹{can.vendor_rate}</td>
//                         <td style={styles.td}>
//                             <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
//                                 <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>{can.main_status}</span>
//                                 {can.remark && <div style={styles.remarkIcon} title={can.remark}><Icons.Remark /></div>}
//                             </div>
//                             <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: '700' }}>{can.sub_status}</small>
//                         </td>
//                         <td style={styles.td}>
//                             <button onClick={(e) => handleCVView(e, can.resume)} style={styles.cvBtn}>
//                                 <Icons.File /> CV
//                             </button>
//                         </td>
//                         <td style={styles.td}>
//                             <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
//                                 <button onClick={(e) => openStatusModal(e, can)} style={styles.editBtn} title="Update Status"><Icons.Edit /></button>
//                                 <button onClick={(e) => openDeletePopup(e, can)} style={styles.trashBtn} title="Delete Options"><Icons.TrashIcon color="#E74C3C" /></button>
//                             </div>
//                         </td>
//                     </tr>
//                 </React.Fragment>
//             );
//         });
//     };

//     return (
//         <SubAdminLayout>
//             {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>{toast.msg}</div>}

//             <div style={styles.header}>
//                 <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
//                     <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                     <h2 style={styles.title}>Candidate Pool ({count})</h2>
//                 </div>
//                 <button onClick={() => navigate("/sub-admin/add-candidate")} style={styles.addBtn}>+ Add New</button>
//             </div>

//             <div style={styles.filterBar}>
//                 <input placeholder="Search name/email..." style={styles.searchInput} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
//                 <input placeholder="Tech Filter..." style={styles.filterInput} value={techFilter} onChange={e => setTechFilter(e.target.value)} />
//             </div>

//             <div style={styles.tableCard}>
//                 <table style={styles.table}>
//                     <thead>
//                         <tr style={styles.tableHeader}>
//                             <th style={styles.th}>Candidate</th><th style={styles.th}>Tech</th><th style={styles.th}>Exp</th>
//                             <th style={styles.th}>To/By</th><th style={styles.th}>Client</th><th style={styles.th}>Vendor</th>
//                             <th style={styles.th}>Rate</th><th style={styles.th}>Status</th><th style={styles.th}>CV</th><th style={styles.th}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>{loading ? <tr><td colSpan="10" style={{textAlign:'center', padding:'40px'}}>Loading...</td></tr> : renderGroupedRows()}</tbody>
//                 </table>
//             </div>

//             <div style={styles.pagination}>
//                 <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}>Prev</button>
//                 <span style={styles.pageInfo}>{currentPage} / {Math.ceil(count / 10) || 1}</span>
//                 <button disabled={currentPage * 10 >= count} onClick={() => setCurrentPage(p => p + 1)} style={currentPage * 10 >= count ? styles.pageBtnDisabled : styles.pageBtn}>Next</button>
//             </div>

//             {/* Custom Delete Popup */}
//             {showDeletePopup && (
//                 <div style={styles.modalOverlay} onClick={() => setShowDeletePopup(false)}>
//                     <div style={styles.deleteContent} onClick={e => e.stopPropagation()}>
//                         <Icons.Alert />
//                         <h3 style={{margin:'15px 0 5px'}}>Delete Candidate?</h3>
//                         <p style={{fontSize:'13px', color:'#64748B', marginBottom:'20px'}}>Remove <b>{selectedCand?.candidate_name}</b></p>
//                         <div style={{display:'flex', flexDirection:'column', gap:'10px', width:'100%'}}>
//                             <button style={styles.softBtn} onClick={() => handleDeleteAction('soft')}>Move to Trash (Soft Delete)</button>
//                             <button style={styles.hardBtn} onClick={() => handleDeleteAction('hard')}>Delete Permanently (Hard Delete)</button>
//                             <button style={styles.cancelBtn} onClick={() => setShowDeletePopup(false)}>Cancel</button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             <StatusUpdateModal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} formData={editForm} setFormData={setEditForm} onSave={handleUpdateSubmit} />
//         </SubAdminLayout>
//     );
// }

// const styles = {
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 10001, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
//     backBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
//     title: { margin: 0, color: "#1E293B", fontWeight: "800", fontSize: "22px" },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" },
//     filterBar: { display: "flex", gap: "15px", marginBottom: "20px" },
//     searchInput: { flex: 2, padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0", outline: "none" },
//     filterInput: { flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0", outline: "none" },
//     tableCard: { background: "#fff", borderRadius: "15px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #F1F5F9" },
//     table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
//     tableHeader: { background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" },
//     th: { padding: "15px", fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: "800" },
//     tr: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
//     td: { padding: "15px", fontSize: "13px", color: "#334155" },
//     dateSeparator: { padding: "10px 20px", background: "#F1F5F9", color: "#475569", fontWeight: "800", fontSize: "11px", textTransform: "uppercase" },
//     techBadge: { background: "rgba(255, 155, 81, 0.1)", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" },
//     badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
//     cvBtn: { background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#1E293B", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px" },
//     editBtn: { border: 'none', background: '#F1F5F9', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
//     trashBtn: { border: 'none', background: '#FFF5F5', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
//     resumeLink: { color: "#1E293B", fontWeight: "800", fontSize: "11px" },
//     subStatusText: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
//     remarkIcon: { display: 'flex', cursor: 'help', padding: '4px', borderRadius: '4px', background: '#FFF5EB' },
//     pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "30px" },
//     pageBtn: { padding: "8px 25px", background: "#1E293B", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
//     pageBtnDisabled: { padding: "8px 25px", background: "#CBD5E1", color: "#fff", border: "none", borderRadius: "8px", cursor: "not-allowed" },
//     pageInfo: { fontWeight: "bold", color: "#1E293B", fontSize: "14px" },

//     // Modal Styles
//     modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' },
//     deleteContent: { background: '#fff', padding: '30px', borderRadius: '20px', width: '350px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
//     softBtn: { background: '#FFF5F5', color: '#E74C3C', border: '1px solid #FED7D7', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', width: '100%' },
//     hardBtn: { background: '#E74C3C', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', width: '100%' },
//     cancelBtn: { background: 'transparent', color: '#64748B', border: 'none', padding: '10px', fontWeight: '600', cursor: 'pointer' }
// };

// export default CandidateList;

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import SubAdminLayout from "../components/SubAdminLayout";

// // External Imports
// import StatusUpdateModal from "../../components/StatusUpdateModal";
// import { getStatusStyles } from "../../utils/statusHelper";

// const Icons = {
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
//     Remark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
// };

// function CandidateList() {
//     const navigate = useNavigate();
//     const [candidates, setCandidates] = useState([]);
//     const [count, setCount] = useState(0);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [loading, setLoading] = useState(true);

//     // Search & Filter States
//     const [searchTerm, setSearchTerm] = useState("");
//     const [techFilter, setTechFilter] = useState("");

//     // Modal & Edit States
//     const [showModal, setShowModal] = useState(false);
//     const [selectedCand, setSelectedCand] = useState(null);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });

//     useEffect(() => {
//         fetchCandidates(currentPage, searchTerm, techFilter);
//     }, [currentPage, searchTerm, techFilter]);

//     const fetchCandidates = async (page, search, tech) => {
//         setLoading(true);
//         try {
//             let url = `/sub-admin/api/admin-candidates/?page=${page}`;
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

//     const handleEditClick = (e, candidate) => {
//         e.stopPropagation();
//         setSelectedCand(candidate);
//         setEditForm({
//             main_status: candidate.main_status || "SUBMITTED",
//             sub_status: candidate.sub_status || "NONE",
//             remark: candidate.remark || ""
//         });
//         setShowModal(true);
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", editForm);
//             setShowModal(false);
//             fetchCandidates(currentPage, searchTerm, techFilter);
//         } catch (err) {
//             console.error("Update failed", err);
//         }
//     };

//     const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

//     // Date Grouping logic (Dashboard Style)
//     const renderGroupedRows = () => {
//         let lastDate = "";
//         return candidates.map((can, i) => {
//             const currentDate = new Date(can.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
//             let dateSeparator = null;
//             if (currentDate !== lastDate) {
//                 lastDate = currentDate;
//                 dateSeparator = (
//                     <tr key={`date-sep-${can.id || i}`}>
//                         <td colSpan="10" style={styles.dateSeparator}>{currentDate}</td>
//                     </tr>
//                 );
//             }

//             const statusStyle = getStatusStyles(can.main_status || "SUBMITTED");

//             return (
//                 <React.Fragment key={can.id || i}>
//                     {dateSeparator}
//                     <tr style={{ ...styles.tr, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/sub-admin/candidate/view/${can.id}`)}>
//                         <td style={styles.td}>
//                             <div style={{fontWeight: "bold", color: "#25343F"}}>{can.candidate_name}</div>
//                             <div style={{fontSize: "11px", color: "#666"}}>{can.candidate_email || "No Email"}</div>
//                         </td>
//                         <td style={styles.td}>
//                             <span style={{...styles.techBadge, color: statusStyle.text}}>{can.technology || "N/A"}</span>
//                         </td>
//                         <td style={styles.td}>
//                             <div style={{fontWeight: "600"}}>{can.years_of_experience_manual} Yrs</div>
//                         </td>
//                         <td style={styles.td}>
//                             <div style={{fontSize: "12px"}}>To: <b>{can.submitted_to_name || "N/A"}</b></div>
//                             <div style={{fontSize: "11px", color: "#27AE60"}}>By: {can.created_by_name || "N/A"}</div>
//                         </td>
//                         <td style={styles.td}>
//                             <b>{can.client_name || can.client || "N/A"}</b>
//                         </td>
//                         <td style={styles.td}>
//                             <b>{truncate(can.vendor_company_name || can.vendor, 15)}</b><br/>
//                             <small style={{fontSize: "11px", color: "#7F8C8D"}}>{can.vendor_number || "N/A"}</small>
//                         </td>
//                         <td style={styles.td}>₹{can.vendor_rate} {can.vendor_rate_type}</td>
//                         <td style={styles.td}>
//                             <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
//                                 <span style={{...styles.badge, color: statusStyle.text, fontWeight: '800'}}>{can.main_status}</span>
//                                 {can.remark && <div style={styles.remarkIcon} title={can.remark}><Icons.Remark /></div>}
//                             </div>
//                             <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: '700' }}>{can.sub_status}</small>
//                         </td>
//                         <td style={styles.td}>
//                             <a href={can.resume} target="_blank" rel="noreferrer" style={styles.resumeLink} onClick={(e) => e.stopPropagation()}>View CV</a>
//                         </td>
//                         <td style={styles.td}>
//                             <div style={{display:'flex', gap:'5px'}}>
//                                 <button onClick={(e) => handleEditClick(e, can)} style={styles.editBtn}><Icons.Edit /></button>
//                             </div>
//                         </td>
//                     </tr>
//                 </React.Fragment>
//             );
//         });
//     };

//     return (
//         <SubAdminLayout>
//             <div style={styles.header}>
//                 <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
//                     <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                     <h2 style={styles.title}>All Candidates Pool ({count})</h2>
//                 </div>
//                 <button onClick={() => navigate("/sub-admin/add-candidate")} style={styles.addBtn}>+ Add New</button>
//             </div>

//             <div style={styles.filterBar}>
//                 <input
//                     placeholder="Search name or email..."
//                     style={styles.searchInput}
//                     value={searchTerm}
//                     onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
//                 />
//                 <input
//                     placeholder="Tech Filter..."
//                     style={styles.filterInput}
//                     value={techFilter}
//                     onChange={(e) => {setTechFilter(e.target.value); setCurrentPage(1);}}
//                 />
//             </div>

//             <div style={styles.tableCard}>
//                 <table style={styles.table}>
//                     <thead>
//                         <tr style={styles.tableHeader}>
//                             <th style={styles.th}>Candidate</th>
//                             <th style={styles.th}>Tech</th>
//                             <th style={styles.th}>Exp</th>
//                             <th style={styles.th}>Submitted To/By</th>
//                             <th style={styles.th}>Client</th>
//                             <th style={styles.th}>Vendor</th>
//                             <th style={styles.th}>Rate</th>
//                             <th style={styles.th}>Status</th>
//                             <th style={styles.th}>Resume</th>
//                             <th style={styles.th}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {loading ? (
//                             <tr><td colSpan="10" style={{ textAlign: "center", padding: "40px" }}>Loading Candidate Pool...</td></tr>
//                         ) : renderGroupedRows()}
//                     </tbody>
//                 </table>
//             </div>

//             <div style={styles.pagination}>
//                 <button
//                     disabled={currentPage === 1}
//                     onClick={() => setCurrentPage(p => p - 1)}
//                     style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}
//                 >Prev</button>
//                 <span style={styles.pageInfo}>Page {currentPage} of {Math.ceil(count / 10) || 1}</span>
//                 <button
//                     disabled={currentPage * 10 >= count}
//                     onClick={() => setCurrentPage(p => p + 1)}
//                     style={currentPage * 10 >= count ? styles.pageBtnDisabled : styles.pageBtn}
//                 >Next</button>
//             </div>

//             <StatusUpdateModal
//                 isOpen={showModal}
//                 onClose={() => setShowModal(false)}
//                 formData={editForm}
//                 setFormData={setEditForm}
//                 onSave={handleUpdateSubmit}
//             />
//         </SubAdminLayout>
//     );
// }

// const styles = {
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
//     backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
//     title: { margin: 0, color: "#25343F", fontWeight: "800", fontSize: "22px" },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(255,155,81,0.2)" },
//     filterBar: { display: "flex", gap: "15px", marginBottom: "20px" },
//     searchInput: { flex: 2, padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none", fontSize: "14px" },
//     filterInput: { flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none", fontSize: "14px" },
//     tableCard: { background: "#fff", borderRadius: "15px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #F0F2F4" },
//     table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
//     tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
//     th: { padding: "15px", fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: "800" },
//     tr: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
//     td: { padding: "15px", fontSize: "13px", color: "#334155" },
//     dateSeparator: { padding: "12px 20px", background: "#F8FAFC", color: "#475569", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", borderBottom: '1px solid #E2E8F0' },
//     techBadge: { background: "rgba(255, 155, 81, 0.1)", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" },
//     badge: { background: "rgba(255, 155, 81, 0.12)", padding: "4px 10px", borderRadius: "6px", fontSize: "11px" },
//     subStatusText: { fontSize: '11px', color: '#7f8c8d', display: 'block', marginTop: "2px" },
//     remarkIcon: { display: 'flex', cursor: 'help', padding: '4px', borderRadius: '4px', background: '#FFF5EB' },
//     resumeLink: { color: "#25343F", fontWeight: "800", textDecoration: "underline", fontSize: "11px" },
//     editBtn: { border: 'none', background: '#F1F5F9', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
//     pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "30px" },
//     pageBtn: { padding: "8px 25px", background: "#25343F", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" },
//     pageBtnDisabled: { padding: "8px 25px", background: "#BFC9D1", color: "#fff", border: "none", borderRadius: "8px", cursor: "not-allowed" },
//     pageInfo: { fontWeight: "bold", color: "#25343F", fontSize: "14px" }
// };

// export default CandidateList;

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/SubAdminLayout";

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
//             let url = `/sub-admin/api/admin-candidates/?page=${page}`;
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

//     return (
//         <BaseLayout>
//             {/* Header Section */}
//             <div style={styles.header}>
//                 <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
//                     <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                     <h2 style={styles.title}>Candidate Pool ({count})</h2>
//                 </div>
//                 <button onClick={() => navigate("/sub-admin/add-candidate")} style={styles.addBtn}>+ Add Candidate</button>
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

//             {/* Candidates Table */}
//             <div style={styles.tableCard}>
//                 <table style={styles.table}>
//                     <thead>
//                         <tr style={styles.tableHeader}>
//                             <th style={styles.th}>Candidate</th>
//                             <th style={styles.th}>Tech / Skills</th>
//                             <th style={styles.th}>Experience</th>
//                             <th style={styles.th}>Vendor</th>
//                             <th style={styles.th}>Submitted To</th>
//                             <th style={styles.th}>Resume</th>
//                             <th style={styles.th}>Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {loading ? (
//                             <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>Loading candidates...</td></tr>
//                         ) : candidates.map(can => (
//                             <tr key={can.id} style={styles.tr}>
//                                 <td style={styles.td}>
//                                     <div style={{ fontWeight: "bold", color: "#25343F" }}>{can.candidate_name}</div>
//                                     <div style={{ fontSize: "11px", color: "#666" }}>{can.candidate_email || "No Email"}</div>
//                                 </td>
//                                 <td style={styles.td}>
//                                     <span style={styles.techBadge}>{can.technology || "N/A"}</span>
//                                     <div style={styles.skillText}>{can.skills?.substring(0, 30)}...</div>
//                                 </td>
//                                 <td style={styles.td}>
//                                     <div>Manual: {can.years_of_experience_manual}</div>
//                                     <div style={{ fontSize: "11px", color: "#FF9B51" }}>System: {can.years_of_experience_calculated} yrs</div>
//                                 </td>
//                                 <td style={styles.td}>
//                                     <div style={{fontWeight: "600"}}>{can.vendor_company_name}</div>
//                                     <div style={{fontSize: "11px"}}>{can.vendor_name}</div>
//                                 </td>
//                                 <td style={styles.td}>{can.submitted_to_name}</td>
//                                 <td style={styles.td}>
//                                     <a href={can.resume} target="_blank" rel="noreferrer" style={styles.resumeLink}>View PDF</a>
//                                 </td>
//                                 <td style={styles.td}>
//                                     <button onClick={() => navigate(`/sub-admin/candidate/view/${can.id}`)} style={styles.viewBtn}>View</button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

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
//     pageInfo: { fontWeight: "bold", color: "#25343F" }
// };

// export default CandidateList;
