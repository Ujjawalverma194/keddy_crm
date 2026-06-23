import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, API_BASE } from "../../services/api";
import AccountsBaseLayout from "../components/AccountsBaseLayout";

// Toaster Component
const Toaster = ({ msg, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        ...styles.toaster,
        backgroundColor: type === "error" ? "#EF4444" : "#10B981",
      }}
    >
      {msg}
    </div>
  );
};

const Icons = {
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  StatusEdit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  ),
};

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case "GENERATED":
      return { backgroundColor: "#E0F2FE", color: "#0369A1" };
    case "PAID":
      return { backgroundColor: "#D1FAE5", color: "#065F46" };
    case "PENDING":
      return { backgroundColor: "#FEF3C7", color: "#92400E" };
    case "DRAFT":
      return { backgroundColor: "#F3F4F6", color: "#374151" };
    case "PARTIALLY_PAID":
      return { backgroundColor: "#DBEAFE", color: "#1E40AF" };
    case "OVERDUE":
      return { backgroundColor: "#FEE2E2", color: "#991B1B" };
    case "CANCELLED":
      return { backgroundColor: "#E5E7EB", color: "#374151" };
    default:
      return { backgroundColor: "#F1F5F9", color: "#64748B" };
  }
};

export default function InvoiceList() {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState({});

  const [statusModal, setStatusModal] = useState({ show: false, invoice: null, status: "" });
  const [deleteModal, setDeleteModal] = useState({ show: false, invoice: null });

  const notify = (msg, type = "success") => setToast({ show: true, msg, type });

  const fetchInvoices = async (page = 1) => {
    setLoading(true);
    try {
      let apiUrl = `/invoice/api/all/?page=${page}`;
      if (search) {
        apiUrl = `/invoice/api/all/?search=${search}&page=${page}`;
      }

      const res = await apiRequest(apiUrl);
      if (res) {
        setInvoices(res.results || []);
        setTotal(res.count || 0);
        setHasNext(!!res.next);
        setHasPrevious(!!res.previous);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleUpdateStatus = async () => {
    try {
      const res = await apiRequest(
        `/invoice/api/invoices/${statusModal.invoice.id}/status/`,
        "PATCH",
        { status: statusModal.status }
      );

      if (res.success) {
        notify(res.message);
        setStatusModal({ show: false, invoice: null, status: "" });
        fetchInvoices(currentPage);
      }
    } catch (err) {
      notify("Failed to update status", "error");
    }
  };

  const handleDelete = async (mode) => {
    const url =
      mode === "soft"
        ? `/invoice/api/invoices/${deleteModal.invoice.id}/soft-delete/`
        : `/invoice/api/invoices/${deleteModal.invoice.id}/hard-delete/`;

    try {
      const res = await apiRequest(url, "DELETE");
      if (res.success) {
        notify(res.message);
        setDeleteModal({ show: false, invoice: null });
        fetchInvoices(currentPage);
      }
    } catch (err) {
      notify("Delete failed", "error");
    }
  };

  const handlePageChange = (page) => {
    fetchInvoices(page);
  };

  const handlePdfGenerate = async (invoiceId) => {
    setGeneratingPdf((prev) => ({ ...prev, [invoiceId]: true }));

    try {
      const response = await apiRequest(`/invoice/api/generate-pdf/${invoiceId}/`, "POST");

      if (response && response.pdf_url) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceId ? { ...inv, pdf_url: response.pdf_url } : inv
          )
        );
        notify("PDF generated successfully!");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      notify("Failed to generate PDF. Please try again.", "error");
    } finally {
      setGeneratingPdf((prev) => ({ ...prev, [invoiceId]: false }));
    }
  };

  const formatAmount = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amt);
  };

  return (
    <AccountsBaseLayout>
      {toast.show && (
        <Toaster
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div style={styles.topNav}>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            ← Back
          </button>
          <h2 style={styles.pageTitle}>Invoices ({total})</h2>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={() => navigate("/accounts/create-invoice")} style={styles.createBtn}>
            + Create Invoice
          </button>

          <button
            style={styles.settingsBtn}
            onClick={() => navigate("/accounts/finance-overview")}
            title="Settings"
          >
            <Icons.Settings />
          </button>
        </div>
      </div>

      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="Search by invoice number, bill to or candidate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Invoice #</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Bill To</th>
              <th style={styles.th}>Candidates</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Amount</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Status</th>
              <th style={{ ...styles.th, textAlign: "center" }}>PDF</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && invoices.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: "40px", textAlign: "center" }}>
                  Loading...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: "40px", textAlign: "center" }}>
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} style={styles.tableRow}>
                  <td style={styles.td}>{inv.invoice_number}</td>

                  <td style={styles.td}>
                    {new Date(inv.invoice_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td style={styles.td}>{inv.bill_to_company || "-"}</td>
                  <td style={styles.td}>{inv.candidate_names || "-"}</td>

                  <td style={{ ...styles.td, textAlign: "right", fontWeight: "700" }}>
                    {formatAmount(inv.total_amount)}
                  </td>

                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(inv.status) }}>
                      {inv.status}
                    </span>
                  </td>

                  <td style={{ ...styles.td, textAlign: "center" }}>
                    {inv.pdf_url ? (
                      <a
                        href={inv.pdf_url.startsWith("http") ? inv.pdf_url : `${API_BASE}${inv.pdf_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.viewLink}
                      >
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" }}>
                      <button
                        onClick={() => handlePdfGenerate(inv.id)}
                        disabled={generatingPdf[inv.id]}
                        style={{
                          ...styles.actionBtn,
                          backgroundColor: inv.pdf_url ? "#1E293B" : "#FF9B51",
                          opacity: generatingPdf[inv.id] ? 0.7 : 1,
                        }}
                      >
                        {generatingPdf[inv.id] ? "..." : inv.pdf_url ? "Regen" : "Gen"}
                      </button>

                      <button
                        onClick={() => setStatusModal({ show: true, invoice: inv, status: inv.status })}
                        style={{
                          ...styles.actionBtn,
                          backgroundColor: "#F1F5F9",
                          color: "#475569",
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        <Icons.StatusEdit />
                      </button>

                      <button
                        onClick={() => navigate(`/accounts/invoice/edit/${inv.id}`)}
                        style={{ ...styles.actionBtn, backgroundColor: "#3B82F6" }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => setDeleteModal({ show: true, invoice: inv })}
                        style={{ ...styles.actionBtn, backgroundColor: "#EF4444" }}
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(hasNext || hasPrevious) && (
        <div style={styles.paginationContainer}>
          <div style={styles.pageInfo}>Showing {invoices.length} of {total} invoices</div>

          <div style={styles.paginationBtns}>
            <button
              disabled={!hasPrevious || loading}
              onClick={() => handlePageChange(currentPage - 1)}
              style={{ ...styles.pageBtn, opacity: !hasPrevious ? 0.5 : 1 }}
            >
              Previous
            </button>

            <span style={styles.currentPageText}>Page {currentPage}</span>

            <button
              disabled={!hasNext || loading}
              onClick={() => handlePageChange(currentPage + 1)}
              style={{ ...styles.pageBtn, opacity: !hasNext ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {statusModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ margin: "0 0 10px 0" }}>Update Status</h3>

            <p style={{ fontSize: "12px", color: "#64748b" }}>
              {statusModal.invoice.invoice_number}
            </p>

            <select
              style={styles.select}
              value={statusModal.status}
              onChange={(e) => setStatusModal({ ...statusModal, status: e.target.value })}
            >
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setStatusModal({ show: false })}>
                Cancel
              </button>

              <button style={styles.saveBtn} onClick={handleUpdateStatus}>
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ margin: "0 0 10px 0", color: "#EF4444" }}>
              Delete Invoice
            </h3>

            <p style={{ fontSize: "13px" }}>
              Select delete mode for <b>{deleteModal.invoice.invoice_number}</b>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
              <button style={styles.softBtn} onClick={() => handleDelete("soft")}>
                Soft Delete (Hide Only)
              </button>

              <button style={styles.hardBtn} onClick={() => handleDelete("hard")}>
                Hard Delete (Permanent)
              </button>

              <button style={styles.cancelBtn} onClick={() => setDeleteModal({ show: false })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountsBaseLayout>
  );
}

const styles = {
  toaster: { position: "fixed", top: "20px", right: "20px", color: "#fff", padding: "12px 24px", borderRadius: "8px", zIndex: 10001, fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  topNav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  backBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" },
  createBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" },
  settingsBtn: { background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", padding: "10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: "22px", fontWeight: "800", color: "#1E293B", margin: 0 },
  searchRow: { marginBottom: "20px" },
  searchInput: { padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", width: "100%", outline: "none", fontSize: "14px", boxSizing: "border-box" },
  tableWrapper: { background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { background: "#F8FAFC" },
  th: { padding: "14px 12px", textAlign: "left", fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: "800", borderBottom: "1px solid #E2E8F0" },
  tableRow: { borderBottom: "1px solid #F1F5F9" },
  td: { padding: "14px 12px", fontSize: "13px", color: "#1E293B" },
  statusBadge: { padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
  viewLink: { color: "#FF9B51", textDecoration: "none", fontWeight: "700", fontSize: "12px" },
  actionBtn: { color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", fontWeight: "700", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  paginationContainer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "25px", padding: "10px" },
  pageInfo: { fontSize: "13px", color: "#64748B", fontWeight: "600" },
  paginationBtns: { display: "flex", alignItems: "center", gap: "12px" },
  pageBtn: { padding: "7px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "#fff", fontSize: "13px", fontWeight: "600", color: "#1E293B" },
  currentPageText: { fontWeight: "700", color: "#1E293B", fontSize: "13px" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001 },
  modal: { background: "#fff", padding: "25px", borderRadius: "15px", width: "350px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" },
  select: { width: "100%", padding: "10px", marginTop: "15px", borderRadius: "8px", border: "1px solid #E2E8F0", outline: "none" },
  modalBtns: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" },
  cancelBtn: { padding: "8px 15px", border: "none", background: "#F1F5F9", borderRadius: "8px", cursor: "pointer", fontWeight: "700" },
  saveBtn: { padding: "8px 15px", border: "none", background: "#3B82F6", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "700" },
  softBtn: { padding: "10px", border: "1px solid #E2E8F0", background: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "700", color: "#475569" },
  hardBtn: { padding: "10px", border: "none", background: "#FEE2E2", color: "#991B1B", borderRadius: "8px", cursor: "pointer", fontWeight: "700" },
};