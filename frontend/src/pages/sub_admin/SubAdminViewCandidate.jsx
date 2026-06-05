import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest, API_BASE } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";
import StatusUpdateModal from "../../components/StatusUpdateModal";
import mammoth from "mammoth";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();
// Dashboard se Icons reuse kar rahe hain
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
  Open: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
};

function DetailedViewCandidate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal & Notification States
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState({
    main_status: "",
    sub_status: "",
    remark: "",
  });
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  // 4th Card States
  const [timesheets, setTimesheets] = useState([]);
  const [vendorInvoices, setVendorInvoices] = useState([]);
  const [clientInvoices, setClientInvoices] = useState([]);
  const [uploadModal, setUploadModal] = useState({
    show: false,
    type: "",
    month: "",
    file: null,
    total_working_days: "",
    working_days: "",
    total_amount_with_gst: "",
    gst_rate: "",
  });
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewType, setPreviewType] = useState("");
  const [pdfPages, setPdfPages] = useState(null);
  const fetchCandidateDetails = async () => {
    try {
      const res = await apiRequest(
        `/employee-portal/api/candidates/${id}/`,
        "GET",
      );
      setCandidate(res);
      setEditForm({
        main_status: res.main_status,
        sub_status: res.sub_status,
        remark: "",
      });
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeListResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (
      response &&
      typeof response === "object" &&
      Array.isArray(response.results)
    )
      return response.results;
    return [];
  };

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const ts = await apiRequest(
        `/employee-portal/api/candidates/${id}/timesheets/`,
        "GET",
      );
      setTimesheets(normalizeListResponse(ts));

      const vi = await apiRequest(
        `/employee-portal/api/candidates/${id}/vendor-invoices/`,
        "GET",
      );
      setVendorInvoices(normalizeListResponse(vi));

      const ci = await apiRequest(
        `/employee-portal/api/candidates/${id}/client-invoices/`,
        "GET",
      );
      const ciWithFullUrl = normalizeListResponse(ci).map((inv) => ({
        ...inv,
        pdf_file: inv.pdf_file ? `${API_BASE}${inv.pdf_file}` : null,
      }));
      setClientInvoices(ciWithFullUrl);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setTimesheets([]);
      setVendorInvoices([]);
      setClientInvoices([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadModal.month || !uploadModal.file) {
      notify("Please select month and file", "error");
      return;
    }

    const formData = new FormData();
    formData.append("month", uploadModal.month);
    formData.append("file", uploadModal.file);

    if (uploadModal.type === "timesheet") {
      if (!uploadModal.total_working_days || !uploadModal.working_days) {
        notify("Please enter total working days and working days", "error");
        return;
      }
      formData.append("total_working_days", uploadModal.total_working_days);
      formData.append("working_days", uploadModal.working_days);
    } else {
      if (!uploadModal.total_amount_with_gst || !uploadModal.gst_rate) {
        notify("Please enter total amount and GST rate", "error");
        return;
      }
      formData.append(
        "total_amount_with_gst",
        uploadModal.total_amount_with_gst,
      );
      formData.append("gst_rate", uploadModal.gst_rate);
    }

    try {
      if (uploadModal.type === "timesheet") {
        await apiRequest(
          `/employee-portal/api/candidates/${id}/timesheets/`,
          "POST",
          formData,
        );
        notify("Timesheet uploaded successfully!");
      } else {
        await apiRequest(
          `/employee-portal/api/candidates/${id}/vendor-invoices/`,
          "POST",
          formData,
        );
        notify("Vendor invoice uploaded successfully!");
      }
      setUploadModal({
        show: false,
        type: "",
        month: "",
        file: null,
        total_working_days: "",
        working_days: "",
        total_amount_with_gst: "",
        gst_rate: "",
      });
      fetchDocuments();
    } catch (err) {
      notify("Upload failed", "error");
    }
  };

  const handleDelete = async (type, docId) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      if (type === "timesheet") {
        await apiRequest(
          `/employee-portal/api/timesheets/${docId}/delete/`,
          "DELETE",
        );
      } else {
        await apiRequest(
          `/employee-portal/api/vendor-invoices/${docId}/delete/`,
          "DELETE",
        );
      }
      notify("Deleted successfully!");
      fetchDocuments();
    } catch (err) {
      notify("Delete failed", "error");
    }
  };

  useEffect(() => {
    fetchCandidateDetails();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDocuments();
    }
  }, [id]);

  const notify = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const handleUpdateSubmit = async () => {
    try {
      await apiRequest(
        `/employee-portal/candidates/${id}/update/`,
        "PUT",
        editForm,
      );
      notify("Status updated successfully!");
      setShowModal(false);
      fetchCandidateDetails();
    } catch (err) {
      notify("Update failed", "error");
    }
  };
  const getFileUrl = (filePath) => {
    if (!filePath) return "";
    return filePath.startsWith("http") ? filePath : `${API_BASE}${filePath}`;
  };

  const handleOpenResume = (e, resume) => {
    e.preventDefault();
    e.stopPropagation();

    const fileUrl = getFileUrl(resume);

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const handlePreviewResume = async (e, resume) => {
    e.stopPropagation();

    try {
      const fileUrl = getFileUrl(resume);
      const lowerUrl = fileUrl.toLowerCase();

      if (lowerUrl.endsWith(".pdf")) {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        setPreviewUrl(blobUrl);
        setPreviewType("pdf");
        setPreviewHtml("");
        setPdfPages(null);
        setShowPreviewModal(true);
        return;
      }

      if (lowerUrl.endsWith(".docx")) {
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });

        setPreviewHtml(result.value);
        setPreviewUrl("");
        setPreviewType("docx");
        setShowPreviewModal(true);
        return;
      }

      notify("Preview available only for PDF and DOCX files", "error");
    } catch (error) {
      console.error("Resume preview error:", error);
      notify("Preview failed. Please download the resume.", "error");
    }
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
    setPreviewHtml("");
    setPreviewType("");
    setPdfPages(null);
  };
  // Get current month and last month data
  const getCurrentMonthData = () => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

    const currentTimesheet = timesheets.find((ts) =>
      ts.month?.startsWith(currentMonthStr),
    );
    const lastTimesheet = timesheets.find((ts) =>
      ts.month?.startsWith(lastMonthStr),
    );
    const currentVendorInvoice = vendorInvoices.find((vi) =>
      vi.month?.startsWith(currentMonthStr),
    );
    const lastVendorInvoice = vendorInvoices.find((vi) =>
      vi.month?.startsWith(lastMonthStr),
    );

    return {
      currentTimesheet,
      lastTimesheet,
      currentVendorInvoice,
      lastVendorInvoice,
    };
  };

  const {
    currentTimesheet,
    lastTimesheet,
    currentVendorInvoice,
    lastVendorInvoice,
  } = getCurrentMonthData();

  if (loading)
    return (
      <BaseLayout>
        <div style={styles.loading}>Loading detailed profile...</div>
      </BaseLayout>
    );
  if (!candidate)
    return (
      <BaseLayout>
        <h3>Candidate not found!</h3>
      </BaseLayout>
    );

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
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        ← Back
      </button>

      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div>
            <h2 style={styles.title}>{candidate.candidate_name}</h2>
            <span style={styles.subTitle}>Candidate ID: #{candidate.id}</span>
          </div>
        </div>
        <div style={styles.badgeGroup}>
          <button
            onClick={() => setShowModal(true)}
            style={styles.updateStatusBtn}
          >
            <Icons.Edit /> Update Status
          </button>
          <button
            onClick={() => navigate(`/sub-admin/candidate/edit/${id}`)}
            style={styles.editBtn}
          >
            Edit Profile
          </button>
          <span
            style={
              candidate.is_blocklisted ? styles.blockBadge : styles.activeBadge
            }
          >
            {candidate.is_blocklisted ? "Blocklisted" : "Active"}
          </span>
          <span style={styles.mainStatusBadge}>{candidate.main_status}</span>
        </div>
      </div>

      <div style={styles.contentGrid}>
        {/* 1. Basic Information */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Personal Information</h3>
          <div style={styles.infoBox}>
            <DetailRow label="Full Name" value={candidate.candidate_name} />
            <DetailRow
              label="Email Address"
              value={candidate.candidate_email}
            />
            <DetailRow
              label="Phone Number"
              value={candidate.candidate_number}
            />
            <DetailRow
              label="Experience (Manual)"
              value={candidate.years_of_experience_manual}
            />
            <DetailRow
              label="Experience (System)"
              value={candidate.years_of_experience_calculated + " Yrs"}
            />
            <DetailRow label="Submitted By" value={candidate.created_by_name} />
            <DetailRow
              label="Created At"
              value={new Date(candidate.created_at).toLocaleString()}
            />
          </div>
        </div>

        {/* 2. Professional & Technical */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Technical Profile</h3>
          <div style={styles.infoBox}>
            <DetailRow
              label="Primary Technology"
              value={<span style={styles.techTag}>{candidate.technology}</span>}
            />
            <DetailRow label="Skills" value={candidate.skills || "N/A"} />
            <DetailRow
              label="Submission Status"
              value={
                candidate.verification_status
                  ? "✅ Submitted"
                  : "❌ Not Submitted"
              }
            />
            <DetailRow
              label="Submitted To"
              value={candidate.submitted_to_name}
            />
            <DetailRow label="Current Remark" value={candidate.remark} />
            <div style={{ marginTop: "15px" }}>
              {candidate.resume ? (
                <div style={styles.resumeActions}>
                  <span style={styles.resumeBadge}>📄 Resume</span>

                  <button
                    onClick={(e) => handlePreviewResume(e, candidate.resume)}
                    style={styles.iconBtn}
                    title="Preview Resume"
                  >
                    <Icons.Preview />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleOpenResume(e, candidate.resume)}
                    style={styles.iconBtn}
                    title="Open Resume In New Tab"
                  >
                    <Icons.Open />
                  </button>
                </div>
              ) : (
                <span style={styles.noResumeText}>No Resume Uploaded</span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Vendor & Financial Details */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Financial Details</h3>
          <div style={styles.infoBox}>
            <DetailRow
              label="Vendor Name"
              value={candidate.vendor_name || ""}
            />
            <DetailRow
              label="Vendor Company"
              value={candidate.vendor_company_name || ""}
            />
            <DetailRow label="Vendor Phone" value={candidate.vendor_number} />
            <DetailRow
              label="Vendor Rate"
              value={`₹${candidate.vendor_rate} ${candidate.vendor_rate_type || ""}`}
            />
            <DetailRow
              label="Client Name"
              value={candidate.client_name || ""}
            />
            <DetailRow
              label="Client Company"
              value={candidate.client_company_name || ""}
            />
            <DetailRow
              label="Client Rate"
              value={`₹${candidate.client_rate} ${candidate.client_rate_type || ""}`}
            />
            <DetailRow
              label="Profit Margin"
              value={`₹${(parseFloat(candidate.client_rate || 0) - parseFloat(candidate.vendor_rate || 0)).toFixed(2)} ${candidate.client_rate_type || ""}`}
            />
          </div>
        </div>

        {/* Recent Documents Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Recent Documents</h3>
          <div style={styles.summaryGrid}>
            <div style={styles.summarySection}>
              <h4 style={styles.summaryMonth}>Recent Timesheets</h4>
              {timesheets.slice(0, 2).map((ts, idx) => (
                <div key={ts.id || idx} style={styles.summaryItem}>
                  <div style={styles.summarySubRow}>
                    <span>{ts.month_year || ts.month}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Working days</span>
                    <strong>
                      {ts.working_days ?? 0}/{ts.total_working_days ?? 0}
                    </strong>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Leave days</span>
                    <strong>{ts.leave_days ?? 0}</strong>
                  </div>
                  {ts.file && (
                    <a
                      href={
                        ts.file?.startsWith("http")
                          ? ts.file
                          : `${API_BASE}${ts.file}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewBtn}
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
              {timesheets.slice(0, 2).length === 0 && (
                <div style={styles.summaryItem}>
                  <span style={styles.emptyText}>No recent timesheets</span>
                </div>
              )}
            </div>
            <div style={styles.summarySection}>
              <h4 style={styles.summaryMonth}>Recent Vendor Invoices</h4>
              {vendorInvoices.slice(0, 2).map((vi, idx) => (
                <div key={vi.id || idx} style={styles.summaryItem}>
                  <div style={styles.summarySubRow}>
                    <span>{vi.month_year || vi.month}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Total amount (GST)</span>
                    <strong>
                      ₹{vi.total_amount_with_gst ?? vi.total_amount ?? 0}
                    </strong>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>GST rate</span>
                    <strong>
                      {vi.gst_rate != null ? `${vi.gst_rate}%` : "N/A"}
                    </strong>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Without GST</span>
                    <strong>₹{vi.total_amount_without_gst ?? 0}</strong>
                  </div>
                  {vi.file && (
                    <a
                      href={
                        vi.file?.startsWith("http")
                          ? vi.file
                          : `${API_BASE}${vi.file}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewBtn}
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
              {vendorInvoices.slice(0, 2).length === 0 && (
                <div style={styles.summaryItem}>
                  <span style={styles.emptyText}>
                    No recent vendor invoices
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Blocklist Info */}
        {candidate.is_blocklisted && (
          <div
            style={{
              ...styles.card,
              border: "1px solid #ff000033",
              background: "#fff5f5",
            }}
          >
            <h3 style={{ ...styles.cardTitle, color: "#c62828" }}>
              🚫 Blocklist Details
            </h3>
            <DetailRow
              label="Reason"
              value={candidate.blocklisted_reason || "No reason provided"}
            />
            <DetailRow label="Action By" value={candidate.changed_by_name} />
          </div>
        )}

        {/* 5. Status History */}
        <div style={styles.fullWidthCard}>
          <h3 style={styles.cardTitle}>Status Timeline</h3>
          <div style={styles.timeline}>
            {candidate.status_history?.map((h, i) => (
              <div key={i} style={styles.timelineItem}>
                <div style={styles.timeLabel}>
                  {new Date(h.changed_at).toLocaleString()}
                </div>
                <div style={styles.timeContent}>
                  <strong>
                    {h.old_status} → {h.new_status}
                  </strong>
                  <span style={styles.subStatusText}>({h.sub_status})</span>
                  <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                    Updated by: {h.changed_by_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Remarks History */}
        <div style={styles.fullWidthCard}>
          <h3 style={styles.cardTitle}>Remarks History</h3>
          <div style={styles.remarkList}>
            {candidate.remark_history?.map((r, i) => (
              <div key={i} style={styles.remarkItem}>
                <div style={styles.remarkHeader}>
                  <strong>{r.added_by_name}</strong>
                  <span>{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p style={styles.remarkText}>{r.remark}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Documents Card */}
        <div style={styles.fullWidthCard}>
          <h3 style={styles.cardTitle}>Documents & Invoices</h3>

          <div style={styles.documentsGrid}>
            {/* Timesheet Section */}
            <div style={styles.docSection}>
              <div style={styles.sectionHeader}>
                <h4 style={styles.sectionTitle}>Monthly Timesheets</h4>
                <button
                  onClick={() =>
                    setUploadModal({
                      show: true,
                      type: "timesheet",
                      month: "",
                      file: null,
                      total_working_days: "",
                      working_days: "",
                      total_amount_with_gst: "",
                      gst_rate: "",
                    })
                  }
                  style={styles.addBtn}
                >
                  + Upload
                </button>
              </div>
              <div style={styles.docList}>
                {timesheets.length === 0 ? (
                  <p style={styles.emptyText}>No timesheets uploaded</p>
                ) : (
                  timesheets.map((ts) => (
                    <div key={ts.id} style={styles.docItem}>
                      <div>
                        <div style={styles.docMonth}>{ts.month_year}</div>
                        <div style={styles.docDate}>
                          Working: {ts.working_days}/{ts.total_working_days}{" "}
                          days
                        </div>
                        <div style={styles.docDate}>
                          Leave: {ts.leave_days} days
                        </div>
                        <div style={styles.docDate}>
                          Uploaded:{" "}
                          {new Date(ts.uploaded_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={styles.docActions}>
                        <a
                          href={
                            ts.file?.startsWith("http")
                              ? ts.file
                              : `${API_BASE}${ts.file}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.viewBtn}
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDelete("timesheet", ts.id)}
                          style={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Vendor Invoice Section */}
            <div style={styles.docSection}>
              <div style={styles.sectionHeader}>
                <h4 style={styles.sectionTitle}>Vendor Invoices</h4>
                <button
                  onClick={() =>
                    setUploadModal({
                      show: true,
                      type: "vendor",
                      month: "",
                      file: null,
                      total_working_days: "",
                      working_days: "",
                      total_amount_with_gst: "",
                      gst_rate: "",
                    })
                  }
                  style={styles.addBtn}
                >
                  + Upload
                </button>
              </div>
              <div style={styles.docList}>
                {vendorInvoices.length === 0 ? (
                  <p style={styles.emptyText}>No vendor invoices uploaded</p>
                ) : (
                  vendorInvoices.map((vi) => (
                    <div key={vi.id} style={styles.docItem}>
                      <div>
                        <div style={styles.docMonth}>{vi.month_year}</div>
                        <div style={styles.docDate}>
                          With GST: ₹{vi.total_amount_with_gst}
                        </div>
                        <div style={styles.docDate}>GST: {vi.gst_rate}%</div>
                        <div style={styles.docDate}>
                          Without GST: ₹{vi.total_amount_without_gst}
                        </div>
                        <div style={styles.docDate}>
                          Uploaded:{" "}
                          {new Date(vi.uploaded_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={styles.docActions}>
                        <a
                          href={
                            vi.file?.startsWith("http")
                              ? vi.file
                              : `${API_BASE}${vi.file}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.viewBtn}
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDelete("vendor", vi.id)}
                          style={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Client Invoice Section */}
            <div style={styles.docSection}>
              <div style={styles.sectionHeader}>
                <h4 style={styles.sectionTitle}>Client Invoices</h4>
              </div>
              <div style={styles.docList}>
                {clientInvoices.length === 0 ? (
                  <p style={styles.emptyText}>No client invoices generated</p>
                ) : (
                  clientInvoices.map((ci) => (
                    <div key={ci.id} style={styles.docItem}>
                      <div>
                        <div style={styles.docInvoiceNum}>
                          #{ci.invoice_number}
                        </div>
                        <div style={styles.docAmount}>₹{ci.amount}</div>
                        <div style={styles.docDate}>
                          Date: {new Date(ci.invoice_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={styles.docActions}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(ci.status === "PAID"
                              ? styles.paidStatus
                              : styles.pendingStatus),
                          }}
                        >
                          {ci.status}
                        </span>
                        {ci.pdf_file && (
                          <a
                            href={ci.pdf_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.viewBtn}
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusUpdateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        formData={editForm}
        setFormData={setEditForm}
        onSave={handleUpdateSubmit}
      />
      {showPreviewModal && (
        <div style={styles.previewModalOverlay} onClick={closePreviewModal}>
          <div
            style={styles.previewModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.previewHeader}>
              <h3 style={{ margin: 0, color: "#25343F" }}>Resume Preview</h3>

              <button
                onClick={closePreviewModal}
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
      {/* Upload Modal */}
      {uploadModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ color: "#25343F", marginBottom: "20px" }}>
              Upload{" "}
              {uploadModal.type === "timesheet"
                ? "Timesheet"
                : "Vendor Invoice"}
            </h3>
            <div style={styles.inputGroup}>
              <label style={styles.modalLabel}>Select Month</label>
              <input
                type="month"
                style={styles.dateInput}
                value={uploadModal.month}
                onChange={(e) =>
                  setUploadModal({ ...uploadModal, month: e.target.value })
                }
              />
            </div>

            {uploadModal.type === "timesheet" ? (
              <>
                <div style={styles.inputGroup}>
                  <label style={styles.modalLabel}>Total Working Days</label>
                  <input
                    type="number"
                    style={styles.dateInput}
                    placeholder="e.g., 30"
                    value={uploadModal.total_working_days}
                    onChange={(e) =>
                      setUploadModal({
                        ...uploadModal,
                        total_working_days: e.target.value,
                      })
                    }
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.modalLabel}>
                    Working Days (by candidate)
                  </label>
                  <input
                    type="number"
                    style={styles.dateInput}
                    placeholder="e.g., 22"
                    value={uploadModal.working_days}
                    onChange={(e) =>
                      setUploadModal({
                        ...uploadModal,
                        working_days: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div style={styles.inputGroup}>
                  <label style={styles.modalLabel}>
                    Total Amount (with GST)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    style={styles.dateInput}
                    placeholder="e.g., 1180"
                    value={uploadModal.total_amount_with_gst}
                    onChange={(e) =>
                      setUploadModal({
                        ...uploadModal,
                        total_amount_with_gst: e.target.value,
                      })
                    }
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.modalLabel}>GST Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    style={styles.dateInput}
                    placeholder="e.g., 18"
                    value={uploadModal.gst_rate}
                    onChange={(e) =>
                      setUploadModal({
                        ...uploadModal,
                        gst_rate: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.modalLabel}>Select File</label>
              <input
                type="file"
                style={styles.fileInput}
                onChange={(e) =>
                  setUploadModal({ ...uploadModal, file: e.target.files[0] })
                }
              />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button style={styles.saveBtn} onClick={handleUpload}>
                Upload
              </button>
              <button
                style={styles.cancelBtn}
                onClick={() => setUploadModal({ show: false })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </BaseLayout>
  );
}

const DetailRow = ({ label, value }) => (
  <div style={styles.detailRow}>
    <span style={styles.label}>{label}:</span>
    <span style={styles.value}>{value || "—"}</span>
  </div>
);

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
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    backdropFilter: "blur(3px)",
  },
  modalContent: {
    background: "#fff",
    padding: "30px",
    borderRadius: "15px",
    width: "450px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
  },
  inputGroup: { marginBottom: "15px", textAlign: "left" },
  modalLabel: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#64748B",
    display: "block",
    marginBottom: "5px",
    textTransform: "uppercase",
  },
  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #E2E8F0",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #E2E8F0",
    height: "80px",
    resize: "none",
  },
  saveBtn: {
    flex: 1,
    background: "#FF9B51",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  cancelBtn: {
    flex: 1,
    background: "#F1F5F9",
    color: "#64748B",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  updateStatusBtn: {
    background: "#FF9B51",
    color: "#fff",
    border: "none",
    padding: "8px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    background: "#fff",
    padding: "20px",
    borderRadius: "15px",
  },
  backBtn: {
    background: "#25343F",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  editBtn: {
    background: "#fff",
    border: "1px solid #FF9B51",
    color: "#FF9B51",
    padding: "8px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  title: { margin: 0, color: "#25343F", fontSize: "24px", fontWeight: "800" },
  subTitle: { fontSize: "13px", color: "#888" },
  badgeGroup: { display: "flex", gap: "10px", alignItems: "center" },
  activeBadge: {
    background: "#e1f7e1",
    color: "#2e7d32",
    padding: "6px 15px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  blockBadge: {
    background: "#ffebee",
    color: "#c62828",
    padding: "6px 15px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  mainStatusBadge: {
    background: "#FF9B51",
    color: "#fff",
    padding: "6px 15px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  contentGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" },
  card: {
    background: "#fff",
    padding: "25px",
    borderRadius: "15px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  },
  fullWidthCard: {
    background: "#fff",
    padding: "25px",
    borderRadius: "15px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    gridColumn: "span 2",
  },
  cardTitle: {
    fontSize: "15px",
    color: "#25343F",
    fontWeight: "800",
    marginBottom: "20px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f9f9f9",
  },
  label: { color: "#777", fontSize: "13px", fontWeight: "600" },
  value: { color: "#25343F", fontSize: "14px", fontWeight: "700" },
  techTag: {
    background: "#25343F",
    color: "#fff",
    padding: "3px 10px",
    borderRadius: "5px",
    fontSize: "12px",
  },
  resumeLink: {
    display: "inline-block",
    color: "#FF9B51",
    fontWeight: "bold",
    textDecoration: "none",
    fontSize: "14px",
    border: "1px solid #FF9B51",
    padding: "8px 15px",
    borderRadius: "8px",
  },
  timeline: {
    borderLeft: "3px solid #FF9B51",
    marginLeft: "10px",
    paddingLeft: "30px",
  },
  timelineItem: { marginBottom: "20px", position: "relative" },
  timeLabel: { fontSize: "12px", color: "#888", fontWeight: "600" },
  timeContent: {
    fontSize: "15px",
    color: "#25343F",
    background: "#f8f9fa",
    padding: "10px",
    borderRadius: "8px",
    marginTop: "5px",
  },
  subStatusText: { color: "#FF9B51", marginLeft: "5px", fontSize: "13px" },
  remarkList: { display: "flex", flexDirection: "column", gap: "15px" },
  remarkItem: { background: "#F5F7F9", padding: "15px", borderRadius: "10px" },
  remarkHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#555",
    marginBottom: "8px",
  },
  remarkText: {
    margin: 0,
    fontSize: "14px",
    color: "#25343F",
    lineHeight: "1.5",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    fontSize: "18px",
    color: "#FF9B51",
    fontWeight: "bold",
  },
  documentsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "25px",
    marginTop: "10px",
  },
  docSection: {
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "15px",
    background: "#FAFAFA",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    paddingBottom: "10px",
    borderBottom: "2px solid #FF9B51",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#25343F",
    margin: 0,
  },
  addBtn: {
    background: "#FF9B51",
    color: "#fff",
    border: "none",
    padding: "5px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  docList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "300px",
    overflowY: "auto",
  },
  docItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    background: "#fff",
    borderRadius: "8px",
    border: "1px solid #E2E8F0",
  },
  docMonth: { fontSize: "13px", fontWeight: "700", color: "#25343F" },
  docInvoiceNum: { fontSize: "13px", fontWeight: "700", color: "#25343F" },
  docAmount: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#FF9B51",
    marginTop: "3px",
  },
  docDate: { fontSize: "10px", color: "#94A3B8", marginTop: "2px" },
  docActions: { display: "flex", gap: "8px", alignItems: "center" },
  viewBtn: {
    background: "#1E293B",
    color: "#fff",
    textDecoration: "none",
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "#FEE2E2",
    color: "#DC2626",
    border: "none",
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  statusBadge: {
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "700",
  },
  paidStatus: { background: "#DCFCE7", color: "#166534" },
  pendingStatus: { background: "#FEF3C7", color: "#92400E" },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: "12px",
    padding: "20px",
  },
  fileInput: {
    width: "100%",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #E2E8F0",
  },
  dateInput: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #E2E8F0",
  },
  summaryGrid: {
    display: "flex",
    gap: "20px",
    justifyContent: "space-between",
  },
  summarySection: { flex: 1, textAlign: "center" },
  summaryItem: {
    background: "#fff",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "12px",
    border: "1px solid #E2E8F0",
    textAlign: "left",
  },
  summarySubRow: {
    fontSize: "13px",
    color: "#334155",
    marginBottom: "10px",
    fontWeight: "700",
  },
  summaryMonth: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#FF9B51",
    marginBottom: "10px",
  },
  summaryRow: {
    fontSize: "12px",
    color: "#64748B",
    marginBottom: "8px",
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
  },
  noResumeText: {
    display: "inline-block",
    color: "#94A3B8",
    fontSize: "14px",
    fontWeight: "600",
    padding: "8px 15px",
    border: "1px dashed #CBD5E1",
    borderRadius: "8px",
    background: "#F8FAFC",
  },
  resumeActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  iconBtn: {
    width: "34px",
    height: "34px",
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
  resumeBadge: {
    background: "#25343F",
    color: "#fff",
    padding: "7px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    letterSpacing: "0.3px",
  },
};

export default DetailedViewCandidate;

// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { apiRequest, API_BASE } from "../../services/api";
// import BaseLayout from "../components/SubAdminLayout";

// // Dashboard se Icons reuse kar rahe hain
// const Icons = {
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
// };

// function DetailedViewCandidate() {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const [candidate, setCandidate] = useState(null);
//     const [loading, setLoading] = useState(true);

//     // Modal & Notification States
//     const [showModal, setShowModal] = useState(false);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     // 4th Card States
//     const [timesheets, setTimesheets] = useState([]);
//     const [vendorInvoices, setVendorInvoices] = useState([]);
//     const [clientInvoices, setClientInvoices] = useState([]);
//     const [uploadModal, setUploadModal] = useState({ show: false, type: "", month: "", file: null });
//     const [loadingDocs, setLoadingDocs] = useState(false);

//     const fetchCandidateDetails = async () => {
//         try {
//             const res = await apiRequest(`/employee-portal/api/candidates/${id}/`, "GET");
//             setCandidate(res);
//             // Form values initialize kar rahe hain
//             setEditForm({
//                 main_status: res.main_status,
//                 sub_status: res.sub_status,
//                 remark: "" // Remark usually naya add hota hai isliye empty
//             });
//         } catch (err) {
//             console.error("Error:", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const normalizeListResponse = (response) => {
//         if (Array.isArray(response)) return response;
//         if (response && typeof response === "object" && Array.isArray(response.results)) return response.results;
//         return [];
//     };

//     // Fetch all documents
//     const fetchDocuments = async () => {
//         setLoadingDocs(true);
//         try {
//             // Fetch Timesheets
//             const ts = await apiRequest(`/employee-portal/api/candidates/${id}/timesheets/`, "GET");
//             setTimesheets(normalizeListResponse(ts));

//             // Fetch Vendor Invoices
//             const vi = await apiRequest(`/employee-portal/api/candidates/${id}/vendor-invoices/`, "GET");
//             setVendorInvoices(normalizeListResponse(vi));

//             // Fetch Client Invoices
//             const ci = await apiRequest(`/employee-portal/api/candidates/${id}/client-invoices/`, "GET");

//             const ciWithFullUrl = (normalizeListResponse(ci)).map(inv => ({
//             ...inv,
//             pdf_file: inv.pdf_file ? `${API_BASE}${inv.pdf_file}` : null
//         }));
//         setClientInvoices(ciWithFullUrl);

//         } catch (err) {
//             console.error("Error fetching documents:", err);
//             setTimesheets([]);
//             setVendorInvoices([]);
//             setClientInvoices([]);
//         } finally {
//             setLoadingDocs(false);
//         }
//     };

//     // Handle file upload
//     const handleUpload = async () => {
//         if (!uploadModal.month || !uploadModal.file) {
//             notify("Please select month and file", "error");
//             return;
//         }

//         const formData = new FormData();
//         formData.append("month", uploadModal.month);
//         formData.append("file", uploadModal.file);

//         try {
//             if (uploadModal.type === "timesheet") {
//                 await apiRequest(`/employee-portal/api/candidates/${id}/timesheets/`, "POST", formData);
//                 notify("Timesheet uploaded successfully!");
//             } else {
//                 await apiRequest(`/employee-portal/api/candidates/${id}/vendor-invoices/`, "POST", formData);
//                 notify("Vendor invoice uploaded successfully!");
//             }
//             setUploadModal({ show: false, type: "", month: "", file: null });
//             fetchDocuments();
//         } catch (err) {
//             notify("Upload failed", "error");
//         }
//     };

//     // Handle delete
//     const handleDelete = async (type, docId) => {
//         if (!window.confirm("Are you sure?")) return;

//         try {
//             if (type === "timesheet") {
//                 await apiRequest(`/employee-portal/api/timesheets/${docId}/delete/`, "DELETE");
//             } else {
//                 await apiRequest(`/employee-portal/api/vendor-invoices/${docId}/delete/`, "DELETE");
//             }
//             notify("Deleted successfully!");
//             fetchDocuments();
//         } catch (err) {
//             notify("Delete failed", "error");
//         }
//     };

//     useEffect(() => {
//         fetchCandidateDetails();
//     }, [id]);

//     useEffect(() => {
//         if (id) {
//             fetchDocuments();
//         }
//     }, [id]);

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             // Dashboard jaisa same API call
//             await apiRequest(`/employee-portal/candidates/${id}/update/`, "PUT", editForm);
//             notify("Status updated successfully!");
//             setShowModal(false);
//             fetchCandidateDetails(); // Data refresh karne ke liye
//         } catch (err) {
//             notify("Update failed", "error");
//         }
//     };

//     if (loading) return <BaseLayout><div style={styles.loading}>Loading detailed profile...</div></BaseLayout>;
//     if (!candidate) return <BaseLayout><h3>Candidate not found!</h3></BaseLayout>;

//     return (
//         <BaseLayout>
//             {/* Toast Notification */}
//             {toast.show && (
//                 <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
//                     {toast.msg}
//                 </div>
//             )}

//             {/* Header Section */}
//             <div style={styles.header}>
//                 <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
//                     <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                     <div>
//                         <h2 style={styles.title}>{candidate.candidate_name}</h2>
//                         <span style={styles.subTitle}>Candidate ID: #{candidate.id}</span>
//                     </div>
//                 </div>
//                 <div style={styles.badgeGroup}>
//                     {/* Naya Update Status Button */}
//                     <button onClick={() => setShowModal(true)} style={styles.updateStatusBtn}>
//                         <Icons.Edit /> Update Status
//                     </button>
//                     <button onClick={() => navigate(`/sub-admin/candidate/edit/${id}`)} style={styles.editBtn}>Edit Profile</button>
//                     <span style={candidate.is_blocklisted ? styles.blockBadge : styles.activeBadge}>
//                         {candidate.is_blocklisted ? "Blocklisted" : "Active"}
//                     </span>
//                     <span style={styles.mainStatusBadge}>{candidate.main_status}</span>
//                 </div>
//             </div>

//             <div style={styles.contentGrid}>
//                 {/* 1. Basic Information */}
//                 <div style={styles.card}>
//                     <h3 style={styles.cardTitle}>Personal Information</h3>
//                     <div style={styles.infoBox}>
//                         <DetailRow label="Full Name" value={candidate.candidate_name} />
//                         <DetailRow label="Email Address" value={candidate.candidate_email} />
//                         <DetailRow label="Phone Number" value={candidate.candidate_number} />
//                         <DetailRow label="Experience (Manual)" value={candidate.years_of_experience_manual} />
//                         <DetailRow label="Experience (System)" value={candidate.years_of_experience_calculated + " Yrs"} />
//                         <DetailRow label="Submitted By" value={candidate.created_by_name} />
//                         <DetailRow label="Created At" value={new Date(candidate.created_at).toLocaleString()} />
//                     </div>
//                 </div>

//                 {/* 2. Professional & Technical */}
//                 <div style={styles.card}>
//                     <h3 style={styles.cardTitle}>Technical Profile</h3>
//                     <div style={styles.infoBox}>
//                         <DetailRow label="Primary Technology" value={<span style={styles.techTag}>{candidate.technology}</span>} />
//                         <DetailRow label="Skills" value={candidate.skills || "N/A"} />
//                         {/* UI Update: Verification ko Submitted/Not Submitted kiya gaya hai */}
//                         <DetailRow label="Submission Status" value={candidate.verification_status ? "✅ Submitted" : "❌ Not Submitted"} />
//                         <DetailRow label="Submitted To" value={candidate.submitted_to_name} />
//                         <DetailRow label="Current Remark" value={candidate.remark} />
//                         <div style={{marginTop: '15px'}}>
//                              <a href={candidate.resume} target="_blank" rel="noreferrer" style={styles.resumeLink}>
//                                 View Resume / Attachment
//                             </a>
//                         </div>
//                     </div>
//                 </div>

//                 {/* 3. Vendor & Financial Details (Profit Margin Removed) */}
//                 <div style={styles.card}>
//                     <h3 style={styles.cardTitle}>Financial Details</h3>
//                     <div style={styles.infoBox}>
//                         <DetailRow label="Vendor Name" value={candidate.vendor_name || ""} />
//                         <DetailRow label="Vendor Company" value={candidate.vendor_company_name || ""} />
//                         <DetailRow label="Vendor Phone" value={candidate.vendor_number} />
//                         <DetailRow label="Vendor Rate" value={`₹${candidate.vendor_rate} ${candidate.vendor_rate_type || ""}`}  />
//                         <DetailRow label="Client Name" value={candidate.client_name || ""} />
//                         <DetailRow label="Client Company" value={candidate.client_company_name || ""} />
//                         <DetailRow label="Client Rate" value={`₹${candidate.client_rate} ${candidate.client_rate_type || ""}`} />
//                         <DetailRow label="Profit Margin" value={`₹${(parseFloat(candidate.client_rate || 0) - parseFloat(candidate.vendor_rate || 0)).toFixed(2)} ${candidate.client_rate_type || ""}`} />
//                     </div>
//                 </div>

//                 {/* 4. Blocklist Info */}
//                 {candidate.is_blocklisted && (
//                     <div style={{...styles.card, border: '1px solid #ff000033', background: '#fff5f5'}}>
//                         <h3 style={{...styles.cardTitle, color: '#c62828'}}>🚫 Blocklist Details</h3>
//                         <DetailRow label="Reason" value={candidate.blocklisted_reason || "No reason provided"} />
//                         <DetailRow label="Action By" value={candidate.changed_by_name} />
//                     </div>
//                 )}

//                 {/* 5. Status History */}
//                 <div style={styles.fullWidthCard}>
//                     <h3 style={styles.cardTitle}>Status Timeline</h3>
//                     <div style={styles.timeline}>
//                         {candidate.status_history?.map((h, i) => (
//                             <div key={i} style={styles.timelineItem}>
//                                 <div style={styles.timeLabel}>{new Date(h.changed_at).toLocaleString()}</div>
//                                 <div style={styles.timeContent}>
//                                     <strong>{h.old_status} → {h.new_status}</strong>
//                                     <span style={styles.subStatusText}>({h.sub_status})</span>
//                                     <p style={{margin: 0, fontSize: '12px', color: '#666'}}>Updated by: {h.changed_by_name}</p>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 6. Remarks History */}
//                 <div style={styles.fullWidthCard}>
//                     <h3 style={styles.cardTitle}>Remarks History</h3>
//                     <div style={styles.remarkList}>
//                         {candidate.remark_history?.map((r, i) => (
//                             <div key={i} style={styles.remarkItem}>
//                                 <div style={styles.remarkHeader}>
//                                     <strong>{r.added_by_name}</strong>
//                                     <span>{new Date(r.created_at).toLocaleString()}</span>
//                                 </div>
//                                 <p style={styles.remarkText}>{r.remark}</p>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 7. Documents Card - Timesheets, Vendor Invoices, Client Invoices */}
//                 <div style={styles.fullWidthCard}>
//                     <h3 style={styles.cardTitle}>Documents & Invoices</h3>

//                     <div style={styles.documentsGrid}>
//                         {/* Timesheet Section */}
//                         <div style={styles.docSection}>
//                             <div style={styles.sectionHeader}>
//                                 <h4 style={styles.sectionTitle}>Monthly Timesheets</h4>
//                                 <button
//                                     onClick={() => setUploadModal({ show: true, type: "timesheet", month: "", file: null })}
//                                     style={styles.addBtn}
//                                 >
//                                     + Upload
//                                 </button>
//                             </div>
//                             <div style={styles.docList}>
//                                 {timesheets.length === 0 ? (
//                                     <p style={styles.emptyText}>No timesheets uploaded</p>
//                                 ) : (
//                                     timesheets.map(ts => (
//                                         <div key={ts.id} style={styles.docItem}>
//                                             <div>
//                                                 <div style={styles.docMonth}>{ts.month_year}</div>
//                                                 <div style={styles.docDate}>Uploaded: {new Date(ts.uploaded_at).toLocaleDateString()}</div>
//                                             </div>
//                                             <div style={styles.docActions}>
//                                                 <a href={ts.file} target="_blank" rel="noopener noreferrer" style={styles.viewBtn}>View</a>
//                                                 <button onClick={() => handleDelete("timesheet", ts.id)} style={styles.deleteBtn}>Delete</button>
//                                             </div>
//                                         </div>
//                                     ))
//                                 )}
//                             </div>
//                         </div>

//                         {/* Vendor Invoice Section */}
//                         <div style={styles.docSection}>
//                             <div style={styles.sectionHeader}>
//                                 <h4 style={styles.sectionTitle}>Vendor Invoices</h4>
//                                 <button
//                                     onClick={() => setUploadModal({ show: true, type: "vendor", month: "", file: null })}
//                                     style={styles.addBtn}
//                                 >
//                                     + Upload
//                                 </button>
//                             </div>
//                             <div style={styles.docList}>
//                                 {vendorInvoices.length === 0 ? (
//                                     <p style={styles.emptyText}>No vendor invoices uploaded</p>
//                                 ) : (
//                                     vendorInvoices.map(vi => (
//                                         <div key={vi.id} style={styles.docItem}>
//                                             <div>
//                                                 <div style={styles.docMonth}>{vi.month_year}</div>
//                                                 <div style={styles.docDate}>Uploaded: {new Date(vi.uploaded_at).toLocaleDateString()}</div>
//                                             </div>
//                                             <div style={styles.docActions}>
//                                                 <a href={vi.file} target="_blank" rel="noopener noreferrer" style={styles.viewBtn}>View</a>
//                                                 <button onClick={() => handleDelete("vendor", vi.id)} style={styles.deleteBtn}>Delete</button>
//                                             </div>
//                                         </div>
//                                     ))
//                                 )}
//                             </div>
//                         </div>

//                         {/* Client Invoice Section (Auto Fetch) */}
//                         <div style={styles.docSection}>
//                             <div style={styles.sectionHeader}>
//                                 <h4 style={styles.sectionTitle}>Client Invoices</h4>
//                             </div>
//                             <div style={styles.docList}>
//                                 {clientInvoices.length === 0 ? (
//                                     <p style={styles.emptyText}>No client invoices generated</p>
//                                 ) : (
//                                     clientInvoices.map(ci => (
//                                         <div key={ci.id} style={styles.docItem}>
//                                             <div>
//                                                 <div style={styles.docInvoiceNum}>#{ci.invoice_number}</div>
//                                                 <div style={styles.docAmount}>₹{ci.amount}</div>
//                                                 <div style={styles.docDate}>Date: {new Date(ci.invoice_date).toLocaleDateString()}</div>
//                                             </div>
//                                             <div style={styles.docActions}>
//                                                 <span style={{...styles.statusBadge, ...(ci.status === 'PAID' ? styles.paidStatus : styles.pendingStatus)}}>
//                                                     {ci.status}
//                                                 </span>
//                                                 {ci.pdf_file && (
//                                                     <a href={ci.pdf_file} target="_blank" rel="noopener noreferrer" style={styles.viewBtn}>View</a>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     ))
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Same Update Modal as Dashboard */}
//             {showModal && (
//                 <div style={styles.modalOverlay}>
//                     <div style={styles.modalContent}>
//                         <h3 style={{color:'#25343F', marginBottom:'20px'}}>Update Status</h3>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.modalLabel}>Main Status</label>
//                             <select style={styles.select} value={editForm.main_status} onChange={e => setEditForm({...editForm, main_status: e.target.value})}>
//                                 <option value="SUBMITTED">Submitted</option>
//                                 <option value="SCREENING">Screening</option>
//                                 <option value="L1">L1</option>
//                                 <option value="L2">L2</option>
//                                 <option value="L3">L3</option>
//                                 <option value="OTHER">Other</option>
//                                 <option value="OFFERED">Offered</option>
//                                 <option value="ONBORD">Onbord</option>
//                                 <option value="ON_HOLD">On Hold</option>
//                                 <option value="REJECTED">Rejected</option>
//                                 <option value="WITHDRAWN">Withdrawn</option>
//                             </select>
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.modalLabel}>Sub Status</label>
//                             <select style={styles.select} value={editForm.sub_status} onChange={e => setEditForm({...editForm, sub_status: e.target.value})}>
//                                 <option value="NONE">None</option>
//                                 <option value="SCHEDULED">Scheduled</option>
//                                 <option value="COMPLETED">Completed</option>
//                                 <option value="FEEDBACK_PENDING">Feedback Pending</option>
//                                 <option value="CLEARED">Cleared</option>
//                                 <option value="REJECTED">Rejected</option>
//                                 <option value="ON_HOLD">On Hold</option>
//                                 <option value="POSTPONED">Postponed</option>
//                                 <option value="NO_SHOW">No Show</option>

//                                 <option value="INTERVIEW_PENDING">Interview Pending</option>

//                             </select>
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.modalLabel}>Remark</label>
//                             <textarea style={styles.textarea} value={editForm.remark} onChange={e => setEditForm({...editForm, remark: e.target.value})} placeholder="Internal notes..." />
//                         </div>
//                         <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
//                             <button style={styles.saveBtn} onClick={handleUpdateSubmit}>Save Changes</button>
//                             <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Upload Modal */}
//             {uploadModal.show && (
//                 <div style={styles.modalOverlay}>
//                     <div style={styles.modalContent}>
//                         <h3 style={{color:'#25343F', marginBottom:'20px'}}>
//                             Upload {uploadModal.type === "timesheet" ? "Timesheet" : "Vendor Invoice"}
//                         </h3>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.modalLabel}>Select Month</label>
//                             <input
//                                 type="month"
//                                 style={styles.dateInput}
//                                 value={uploadModal.month}
//                                 onChange={e => setUploadModal({...uploadModal, month: e.target.value})}
//                             />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.modalLabel}>Select File</label>
//                             <input
//                                 type="file"
//                                 style={styles.fileInput}
//                                 onChange={e => setUploadModal({...uploadModal, file: e.target.files[0]})}
//                             />
//                         </div>
//                         <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
//                             <button style={styles.saveBtn} onClick={handleUpload}>Upload</button>
//                             <button style={styles.cancelBtn} onClick={() => setUploadModal({ show: false })}>Cancel</button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </BaseLayout>
//     );
// }

// const DetailRow = ({ label, value }) => (
//     <div style={styles.detailRow}>
//         <span style={styles.label}>{label}:</span>
//         <span style={styles.value}>{value || "—"}</span>
//     </div>
// );

// const styles = {
//     // New Styles added for Modal and Toast
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
//     modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' },
//     modalContent: { background: '#fff', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
//     inputGroup: { marginBottom: '15px', textAlign: 'left' },
//     modalLabel: { fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '5px', textTransform: 'uppercase' },
//     select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' },
//     textarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', height: '80px', resize: 'none' },
//     saveBtn: { flex: 1, background: '#FF9B51', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
//     cancelBtn: { flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
//     updateStatusBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" },

//     // Existing Styles
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", background: "#fff", padding: "20px", borderRadius: "15px" },
//     backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" },
//     editBtn: { background: "#fff", border: "1px solid #FF9B51", color: "#FF9B51", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
//     title: { margin: 0, color: "#25343F", fontSize: "24px", fontWeight: "800" },
//     subTitle: { fontSize: "13px", color: "#888" },
//     badgeGroup: { display: "flex", gap: "10px", alignItems: "center" },
//     activeBadge: { background: "#e1f7e1", color: "#2e7d32", padding: "6px 15px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
//     blockBadge: { background: "#ffebee", color: "#c62828", padding: "6px 15px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
//     mainStatusBadge: { background: "#FF9B51", color: "#fff", padding: "6px 15px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
//     contentGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" },
//     card: { background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
//     fullWidthCard: { background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", gridColumn: "span 2" },
//     cardTitle: { fontSize: "15px", color: "#25343F", fontWeight: "800", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.5px" },
//     detailRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f9f9f9" },
//     label: { color: "#777", fontSize: "13px", fontWeight: "600" },
//     value: { color: "#25343F", fontSize: "14px", fontWeight: "700" },
//     techTag: { background: "#25343F", color: "#fff", padding: "3px 10px", borderRadius: "5px", fontSize: "12px" },
//     resumeLink: { display: "inline-block", color: "#FF9B51", fontWeight: "bold", textDecoration: "none", fontSize: "14px", border: "1px solid #FF9B51", padding: "8px 15px", borderRadius: "8px" },
//     timeline: { borderLeft: "3px solid #FF9B51", marginLeft: "10px", paddingLeft: "30px" },
//     timelineItem: { marginBottom: "20px", position: "relative" },
//     timeLabel: { fontSize: "12px", color: "#888", fontWeight: "600" },
//     timeContent: { fontSize: "15px", color: "#25343F", background: "#f8f9fa", padding: "10px", borderRadius: "8px", marginTop: "5px" },
//     subStatusText: { color: "#FF9B51", marginLeft: "5px", fontSize: "13px" },
//     remarkList: { display: "flex", flexDirection: "column", gap: "15px" },
//     remarkItem: { background: "#F5F7F9", padding: "15px", borderRadius: "10px" },
//     remarkHeader: { display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#555", marginBottom: "8px" },
//     remarkText: { margin: 0, fontSize: "14px", color: "#25343F", lineHeight: "1.5" },
//     loading: { textAlign: "center", padding: "50px", fontSize: "18px", color: "#FF9B51", fontWeight: "bold" },

//     // New Styles for 4th Card
//     documentsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginTop: "10px" },
//     docSection: { border: "1px solid #E2E8F0", borderRadius: "12px", padding: "15px", background: "#FAFAFA" },
//     sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", paddingBottom: "10px", borderBottom: "2px solid #FF9B51" },
//     sectionTitle: { fontSize: "14px", fontWeight: "800", color: "#25343F", margin: 0 },
//     addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "5px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" },
//     docList: { display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" },
//     docItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#fff", borderRadius: "8px", border: "1px solid #E2E8F0" },
//     docMonth: { fontSize: "13px", fontWeight: "700", color: "#25343F" },
//     docInvoiceNum: { fontSize: "13px", fontWeight: "700", color: "#25343F" },
//     docAmount: { fontSize: "16px", fontWeight: "800", color: "#FF9B51", marginTop: "3px" },
//     docDate: { fontSize: "10px", color: "#94A3B8", marginTop: "2px" },
//     docActions: { display: "flex", gap: "8px", alignItems: "center" },
//     viewBtn: { background: "#1E293B", color: "#fff", textDecoration: "none", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
//     deleteBtn: { background: "#FEE2E2", color: "#DC2626", border: "none", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
//     statusBadge: { padding: "3px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "700" },
//     paidStatus: { background: "#DCFCE7", color: "#166534" },
//     pendingStatus: { background: "#FEF3C7", color: "#92400E" },
//     emptyText: { textAlign: "center", color: "#94A3B8", fontSize: "12px", padding: "20px" },
//     fileInput: { width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #E2E8F0" },
//     dateInput: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0" }
// };

// export default DetailedViewCandidate;

// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/SubAdminLayout";

// // Dashboard se Icons reuse kar rahe hain
// const Icons = {
//     Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
// };

// function DetailedViewCandidate() {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const [candidate, setCandidate] = useState(null);
//     const [loading, setLoading] = useState(true);

//     // Modal & Notification States
//     const [showModal, setShowModal] = useState(false);
//     const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     const fetchCandidateDetails = async () => {
//         try {
//             const res = await apiRequest(`/employee-portal/api/candidates/${id}/`, "GET");
//             setCandidate(res);
//             // Form values initialize kar rahe hain
//             setEditForm({
//                 main_status: res.main_status,
//                 sub_status: res.sub_status,
//                 remark: "" // Remark usually naya add hota hai isliye empty
//             });
//         } catch (err) {
//             console.error("Error:", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchCandidateDetails();
//     }, [id]);

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleUpdateSubmit = async () => {
//         try {
//             // Dashboard jaisa same API call
//             await apiRequest(`/employee-portal/candidates/${id}/update/`, "PUT", editForm);
//             notify("Status updated successfully!");
//             setShowModal(false);
//             fetchCandidateDetails(); // Data refresh karne ke liye
//         } catch (err) {
//             notify("Update failed", "error");
//         }
//     };

//     if (loading) return <BaseLayout><div style={styles.loading}>Loading detailed profile...</div></BaseLayout>;
//     if (!candidate) return <BaseLayout><h3>Candidate not found!</h3></BaseLayout>;

//     return (
//         <BaseLayout>
//             {/* Toast Notification */}
//             {toast.show && (
//                 <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
//                     {toast.msg}
//                 </div>
//             )}

//             {/* Header Section */}
//             <div style={styles.header}>
//                 <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
//                     <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                     <div>
//                         <h2 style={styles.title}>{candidate.candidate_name}</h2>
//                         <span style={styles.subTitle}>Candidate ID: #{candidate.id}</span>
//                     </div>
//                 </div>
//                 <div style={styles.badgeGroup}>
//                     {/* Naya Update Status Button */}
//                     <button onClick={() => setShowModal(true)} style={styles.updateStatusBtn}>
//                         <Icons.Edit /> Update Status
//                     </button>
//                     <button onClick={() => navigate(`/sub-admin/candidate/edit/${id}`)} style={styles.editBtn}>Edit Profile</button>
//                     <span style={candidate.is_blocklisted ? styles.blockBadge : styles.activeBadge}>
//                         {candidate.is_blocklisted ? "Blocklisted" : "Active"}
//                     </span>
//                     <span style={styles.mainStatusBadge}>{candidate.main_status}</span>
//                 </div>
//             </div>

//             <div style={styles.contentGrid}>
//                 {/* 1. Basic Information */}
//                 <div style={styles.card}>
//                     <h3 style={styles.cardTitle}>Personal Information</h3>
//                     <div style={styles.infoBox}>
//                         <DetailRow label="Full Name" value={candidate.candidate_name} />
//                         <DetailRow label="Email Address" value={candidate.candidate_email} />
//                         <DetailRow label="Phone Number" value={candidate.candidate_number} />
//                         <DetailRow label="Experience (Manual)" value={candidate.years_of_experience_manual} />
//                         <DetailRow label="Experience (System)" value={candidate.years_of_experience_calculated + " Yrs"} />
//                         <DetailRow label="Submitted By" value={candidate.created_by_name} />
//                         <DetailRow label="Created At" value={new Date(candidate.created_at).toLocaleString()} />
//                     </div>
//                 </div>

//                 {/* 2. Professional & Technical */}
//                 <div style={styles.card}>
//                     <h3 style={styles.cardTitle}>Technical Profile</h3>
//                     <div style={styles.infoBox}>
//                         <DetailRow label="Primary Technology" value={<span style={styles.techTag}>{candidate.technology}</span>} />
//                         <DetailRow label="Skills" value={candidate.skills || "N/A"} />
//                         {/* UI Update: Verification ko Submitted/Not Submitted kiya gaya hai */}
//                         <DetailRow label="Submission Status" value={candidate.verification_status ? "✅ Submitted" : "❌ Not Submitted"} />
//                         <DetailRow label="Submitted To" value={candidate.submitted_to_name} />
//                         <DetailRow label="Current Remark" value={candidate.remark} />
//                         <div style={{marginTop: '15px'}}>
//                              <a href={candidate.resume} target="_blank" rel="noreferrer" style={styles.resumeLink}>
//                                 View Resume / Attachment
//                             </a>
//                         </div>
//                     </div>
//                 </div>

//                 {/* 3. Vendor & Financial Details (Profit Margin Removed) */}
//                 <div style={styles.card}>
//                     <h3 style={styles.cardTitle}>Financial Details</h3>
//                     <div style={styles.infoBox}>
//                         <DetailRow label="Vendor Name" value={candidate.vendor_name || ""} />
//                         <DetailRow label="Vendor Company" value={candidate.vendor_company_name || ""} />
//                         <DetailRow label="Vendor Phone" value={candidate.vendor_number} />
//                         <DetailRow label="Vendor Rate" value={`₹${candidate.vendor_rate} ${candidate.vendor_rate_type || ""}`}  />
//                         <DetailRow label="Client Name" value={candidate.client_name || ""} />
//                         <DetailRow label="Client Company" value={candidate.client_company_name || ""} />
//                         <DetailRow label="Client Rate" value={`₹${candidate.client_rate} ${candidate.client_rate_type || ""}`} />
//                         <DetailRow label="Profit Margin" value={`₹${(parseFloat(candidate.client_rate || 0) - parseFloat(candidate.vendor_rate || 0)).toFixed(2)} ${candidate.client_rate_type || ""}`} />
//                     </div>
//                 </div>

//                 {/* 4. Blocklist Info */}
//                 {candidate.is_blocklisted && (
//                     <div style={{...styles.card, border: '1px solid #ff000033', background: '#fff5f5'}}>
//                         <h3 style={{...styles.cardTitle, color: '#c62828'}}>🚫 Blocklist Details</h3>
//                         <DetailRow label="Reason" value={candidate.blocklisted_reason || "No reason provided"} />
//                         <DetailRow label="Action By" value={candidate.changed_by_name} />
//                     </div>
//                 )}

//                 {/* 5. Status History */}
//                 <div style={styles.fullWidthCard}>
//                     <h3 style={styles.cardTitle}>Status Timeline</h3>
//                     <div style={styles.timeline}>
//                         {candidate.status_history?.map((h, i) => (
//                             <div key={i} style={styles.timelineItem}>
//                                 <div style={styles.timeLabel}>{new Date(h.changed_at).toLocaleString()}</div>
//                                 <div style={styles.timeContent}>
//                                     <strong>{h.old_status} → {h.new_status}</strong>
//                                     <span style={styles.subStatusText}>({h.sub_status})</span>
//                                     <p style={{margin: 0, fontSize: '12px', color: '#666'}}>Updated by: {h.changed_by_name}</p>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* 6. Remarks History */}
//                 <div style={styles.fullWidthCard}>
//                     <h3 style={styles.cardTitle}>Remarks History</h3>
//                     <div style={styles.remarkList}>
//                         {candidate.remark_history?.map((r, i) => (
//                             <div key={i} style={styles.remarkItem}>
//                                 <div style={styles.remarkHeader}>
//                                     <strong>{r.added_by_name}</strong>
//                                     <span>{new Date(r.created_at).toLocaleString()}</span>
//                                 </div>
//                                 <p style={styles.remarkText}>{r.remark}</p>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             {/* Same Update Modal as Dashboard */}
//             {showModal && (
//                 <div style={styles.modalOverlay}>
//                     <div style={styles.modalContent}>
//                         <h3 style={{color:'#25343F', marginBottom:'20px'}}>Update Status</h3>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.modalLabel}>Main Status</label>
//                             <select style={styles.select} value={editForm.main_status} onChange={e => setEditForm({...editForm, main_status: e.target.value})}>
//                                 <option value="SUBMITTED">Submitted</option>
//                                 <option value="SCREENING">Screening</option>
//                                 <option value="L1">L1</option>
//                                 <option value="L2">L2</option>
//                                 <option value="L3">L3</option>
//                                 <option value="OTHER">Other</option>
//                                 <option value="OFFERED">Offered</option>
//                                 <option value="ONBORD">Onbord</option>
//                                 <option value="ON_HOLD">On Hold</option>
//                                 <option value="REJECTED">Rejected</option>
//                                 <option value="WITHDRAWN">Withdrawn</option>
//                             </select>
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.modalLabel}>Sub Status</label>
//                             <select style={styles.select} value={editForm.sub_status} onChange={e => setEditForm({...editForm, sub_status: e.target.value})}>
//                                 <option value="NONE">None</option>
//                                 <option value="SCHEDULED">Scheduled</option>
//                                 <option value="COMPLETED">Completed</option>
//                                 <option value="FEEDBACK_PENDING">Feedback Pending</option>
//                                 <option value="CLEARED">Cleared</option>
//                                 <option value="REJECTED">Rejected</option>
//                                 <option value="ON_HOLD">On Hold</option>
//                                 <option value="POSTPONED">Postponed</option>
//                                 <option value="NO_SHOW">No Show</option>

//                                 <option value="INTERVIEW_PENDING">Interview Pending</option>

//                             </select>
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.modalLabel}>Remark</label>
//                             <textarea style={styles.textarea} value={editForm.remark} onChange={e => setEditForm({...editForm, remark: e.target.value})} placeholder="Internal notes..." />
//                         </div>
//                         <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
//                             <button style={styles.saveBtn} onClick={handleUpdateSubmit}>Save Changes</button>
//                             <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </BaseLayout>
//     );
// }

// const DetailRow = ({ label, value }) => (
//     <div style={styles.detailRow}>
//         <span style={styles.label}>{label}:</span>
//         <span style={styles.value}>{value || "—"}</span>
//     </div>
// );

// const styles = {
//     // New Styles added for Modal and Toast
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
//     modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' },
//     modalContent: { background: '#fff', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
//     inputGroup: { marginBottom: '15px', textAlign: 'left' },
//     modalLabel: { fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '5px', textTransform: 'uppercase' },
//     select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' },
//     textarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', height: '80px', resize: 'none' },
//     saveBtn: { flex: 1, background: '#FF9B51', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
//     cancelBtn: { flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
//     updateStatusBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" },

//     // Existing Styles
//     header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", background: "#fff", padding: "20px", borderRadius: "15px" },
//     backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" },
//     editBtn: { background: "#fff", border: "1px solid #FF9B51", color: "#FF9B51", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
//     title: { margin: 0, color: "#25343F", fontSize: "24px", fontWeight: "800" },
//     subTitle: { fontSize: "13px", color: "#888" },
//     badgeGroup: { display: "flex", gap: "10px", alignItems: "center" },
//     activeBadge: { background: "#e1f7e1", color: "#2e7d32", padding: "6px 15px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
//     blockBadge: { background: "#ffebee", color: "#c62828", padding: "6px 15px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
//     mainStatusBadge: { background: "#FF9B51", color: "#fff", padding: "6px 15px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
//     contentGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" },
//     card: { background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
//     fullWidthCard: { background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", gridColumn: "span 2" },
//     cardTitle: { fontSize: "15px", color: "#25343F", fontWeight: "800", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.5px" },
//     detailRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f9f9f9" },
//     label: { color: "#777", fontSize: "13px", fontWeight: "600" },
//     value: { color: "#25343F", fontSize: "14px", fontWeight: "700" },
//     techTag: { background: "#25343F", color: "#fff", padding: "3px 10px", borderRadius: "5px", fontSize: "12px" },
//     resumeLink: { display: "inline-block", color: "#FF9B51", fontWeight: "bold", textDecoration: "none", fontSize: "14px", border: "1px solid #FF9B51", padding: "8px 15px", borderRadius: "8px" },
//     timeline: { borderLeft: "3px solid #FF9B51", marginLeft: "10px", paddingLeft: "30px" },
//     timelineItem: { marginBottom: "20px", position: "relative" },
//     timeLabel: { fontSize: "12px", color: "#888", fontWeight: "600" },
//     timeContent: { fontSize: "15px", color: "#25343F", background: "#f8f9fa", padding: "10px", borderRadius: "8px", marginTop: "5px" },
//     subStatusText: { color: "#FF9B51", marginLeft: "5px", fontSize: "13px" },
//     remarkList: { display: "flex", flexDirection: "column", gap: "15px" },
//     remarkItem: { background: "#F5F7F9", padding: "15px", borderRadius: "10px" },
//     remarkHeader: { display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#555", marginBottom: "8px" },
//     remarkText: { margin: 0, fontSize: "14px", color: "#25343F", lineHeight: "1.5" },
//     loading: { textAlign: "center", padding: "50px", fontSize: "18px", color: "#FF9B51", fontWeight: "bold" }
// };

// export default DetailedViewCandidate;
