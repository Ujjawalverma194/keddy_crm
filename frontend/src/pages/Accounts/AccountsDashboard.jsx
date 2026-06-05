import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountsBaseLayout from "../components/AccountsBaseLayout";
import { apiRequest } from "../../services/api";

const Icons = {
  Invoice: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  Dollar: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  Trend: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33A1.65 1.65 0 0 0 14 21a2 2 0 1 1-4 0 1.65 1.65 0 0 0-1.08-1.56 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15 1.65 1.65 0 0 0 3 14a2 2 0 1 1 0-4 1.65 1.65 0 0 0 1.6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 4.3l.06.06a1.65 1.65 0 0 0 1.82.33H9A1.65 1.65 0 0 0 10 3a2 2 0 1 1 4 0 1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.24.6.82 1 1.6 1a2 2 0 1 1 0 4 1.65 1.65 0 0 0-1.6 1z" /></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Trash: () =>  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
};

function AccountsDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [editModal, setEditModal] = useState({ show: false, invoice: null, status: "" });
  const [deleteModal, setDeleteModal] = useState({ show: false, invoice: null });

  const fetchData = async () => {
    try {
      setLoading(true);

      const dashboardRes = await apiRequest("/invoice/api/dashboard/all/");
      const invoiceRes = await apiRequest("/invoice/api/all/?page=1");

      if (dashboardRes?.success) {
        setData(dashboardRes);
      }

      setRecentInvoices(invoiceRes?.results || []);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async () => {
    if (!editModal.invoice?.id) {
      alert("Invoice id missing");
      return;
    }

    try {
      const res = await apiRequest(
        `/invoice/api/invoices/${editModal.invoice.id}/status/`,
        "PATCH",
        { status: editModal.status }
      );

      if (res?.success) {
        setEditModal({ show: false, invoice: null, status: "" });
        fetchData();
      } else {
        alert(res?.message || "Status update failed");
      }
    } catch (e) {
      console.error(e);
      alert("Update failed");
    }
  };

  const handleDelete = async (mode) => {
    if (!deleteModal.invoice?.id) return;

    const url =
      mode === "soft"
        ? `/invoice/api/invoices/${deleteModal.invoice.id}/soft-delete/`
        : `/invoice/api/invoices/${deleteModal.invoice.id}/hard-delete/`;

    try {
      const res = await apiRequest(url, "DELETE");

      if (res?.success) {
        setDeleteModal({ show: false, invoice: null });
        fetchData();
      } else {
        alert(res?.message || "Delete failed");
      }
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  };

  if (loading) {
    return (
      <AccountsBaseLayout>
        <div style={styles.loading}>Loading Dashboard...</div>
      </AccountsBaseLayout>
    );
  }

  if (!data) {
    return (
      <AccountsBaseLayout>
        <div style={styles.loading}>No data found</div>
      </AccountsBaseLayout>
    );
  }

  const kpi_cards = data.kpi_cards || {};
  const cash_flow = data.cash_flow || {};
  const charts = data.charts || {};
  const alerts = data.alerts || {};
  const filters = data.filters_available || {};
  const future_projection = data.future_projection || {};

  return (
    <AccountsBaseLayout>
      <div style={styles.header}>
        <div>
          <h2 style={styles.welcome}>Finance Dashboard</h2>
          <p style={styles.subText}>
            Period: {filters.current_month || "-"}{" "}
            {filters.date_range
              ? `(${filters.date_range.from} to ${filters.date_range.to})`
              : ""}
          </p>
        </div>

        <div style={styles.btnGroup}>
          <button
            style={styles.settingsBtn}
            onClick={() => navigate("/accounts/finance-overview")}
          >
            <Icons.Settings />
          </button>

          <button
            style={styles.actionBtn}
            onClick={() => navigate("/accounts/create-invoice")}
          >
            <Icons.Plus /> Create Invoice
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          label="Monthly Revenue"
          val={kpi_cards.this_month_revenue?.value || 0}
          col="#27AE60"
          icon={<Icons.Dollar />}
        />
        <StatCard
          label="Monthly Expense"
          val={kpi_cards.this_month_expense?.value || 0}
          col="#E74C3C"
          icon={<Icons.Invoice />}
        />
        <StatCard
          label="Net Profit"
          val={kpi_cards.net_profit?.value || 0}
          col="#25343F"
          icon={<Icons.Trend />}
        />
        <StatCard
          label="Bank Balance"
          val={kpi_cards.bank_balance?.value || 0}
          col="#3498DB"
          icon={<Icons.Dollar />}
        />
      </div>

      <div style={{ ...styles.statsGrid, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>Cash Flow Details</h4>
          <div style={styles.infoRow}>
            <span>Received this Month:</span>
            <b>₹{cash_flow.received_this_month || 0}</b>
          </div>
          <div style={styles.infoRow}>
            <span>Pending Client:</span>
            <b style={{ color: "#FF9B51" }}>₹{cash_flow.pending_client_payments || 0}</b>
          </div>
          <div style={styles.infoRow}>
            <span>Vendor Payable:</span>
            <b style={{ color: "#E74C3C" }}>₹{cash_flow.vendor_payable || 0}</b>
          </div>
        </div>

        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>Financial Alerts</h4>
          <div style={styles.infoRow}>
            <span>Overdue Invoices:</span>
            <b style={{ color: "#E74C3C" }}>
              {alerts.overdue?.client_invoices_count || 0}
            </b>
          </div>
          <div style={styles.infoRow}>
            <span>Due Soon:</span>
            <b style={{ color: "#FF9B51" }}>
              {alerts.due_soon?.client_invoices_count || 0}
            </b>
          </div>
          <div style={styles.infoRow}>
            <span>Expected Profit:</span>
            <b>₹{future_projection.expected_profit || 0}</b>
          </div>
        </div>
      </div>

      <Section title="Recent Client Invoices">
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.th}>Invoice ID</th>
              <th style={styles.th}>Client</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {recentInvoices.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ ...styles.td, textAlign: "center" }}>
                  No invoices found
                </td>
              </tr>
            ) : (
              recentInvoices.slice(0, 5).map((inv) => (
                <tr key={inv.id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <b>{inv.invoice_number || inv.invoice_id || "-"}</b>
                  </td>

                  <td style={styles.td}>
                    {inv.bill_to_company || inv.client || "-"}
                  </td>

                  <td style={styles.td}>
                    <b>₹{inv.total_amount || inv.amount || 0}</b>
                  </td>

                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...getStatusStyle(inv.status) }}>
                      {inv.status || "-"}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        style={{ ...styles.iconBtn, color: "#3498DB" }}
                        onClick={() =>
                          setEditModal({
                            show: true,
                            invoice: inv,
                            status: inv.status || "PENDING"
                          })
                        }
                      >
                        <Icons.Edit />
                      </button>

                      <button
                        style={{ ...styles.iconBtn, backgroundColor: "#E74C3C" ,color:"white"}}
                        onClick={() => setDeleteModal({ show: true, invoice: inv })}
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
      </Section>

      <Section title="Monthly Performance Comparison">
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.th}>Month</th>
              <th style={styles.th}>Revenue</th>
              <th style={styles.th}>Expense</th>
              <th style={styles.th}>Profit</th>
            </tr>
          </thead>

          <tbody>
            {(charts.monthly_comparison || []).slice(-5).map((m, i) => (
              <tr key={i} style={styles.tableRow}>
                <td style={styles.td}>{m.month}</td>
                <td style={styles.td}>₹{m.revenue}</td>
                <td style={{ ...styles.td, color: "#E74C3C" }}>₹{m.expense}</td>
                <td style={{ ...styles.td, color: "#27AE60", fontWeight: "700" }}>
                  ₹{m.profit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {editModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ margin: "0 0 10px 0" }}>Update Status</h3>

            <p style={{ fontSize: "12px", color: "#64748b" }}>
              {editModal.invoice?.invoice_number || editModal.invoice?.invoice_id} -{" "}
              {editModal.invoice?.bill_to_company || editModal.invoice?.client}
            </p>

            <select
              style={styles.select}
              value={editModal.status}
              onChange={(e) =>
                setEditModal({ ...editModal, status: e.target.value })
              }
            >
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="GENERATED">GENERATED</option>
            </select>

            <div style={styles.modalBtns}>
              <button
                style={styles.cancelBtn}
                onClick={() =>
                  setEditModal({ show: false, invoice: null, status: "" })
                }
              >
                Cancel
              </button>

              <button style={styles.saveBtn} onClick={handleUpdateStatus}>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ margin: "0 0 10px 0", color: "#E74C3C" }}>
              Delete Invoice
            </h3>

            <p style={{ fontSize: "13px" }}>
              Select delete mode for{" "}
              <b>{deleteModal.invoice?.invoice_number || deleteModal.invoice?.invoice_id}</b>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
              <button style={styles.softBtn} onClick={() => handleDelete("soft")}>
                Soft Delete
              </button>

              <button style={styles.hardBtn} onClick={() => handleDelete("hard")}>
                Hard Delete
              </button>

              <button
                style={styles.cancelBtn}
                onClick={() => setDeleteModal({ show: false, invoice: null })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountsBaseLayout>
  );
}

const StatCard = ({ label, val, col, icon }) => (
  <div style={styles.statCard}>
    <div>
      <p style={styles.statLabel}>{label}</p>
      <h3 style={{ ...styles.statValue, color: col }}>
        ₹{Number(val || 0).toLocaleString("en-IN")}
      </h3>
    </div>
    <div style={{ ...styles.iconCircle, color: col, backgroundColor: `${col}10` }}>
      {icon}
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div style={styles.sectionContainer}>
    <div style={styles.sectionHeader}>
      <h3 style={styles.sectionTitle}>{title}</h3>
    </div>
    <div style={styles.tableWrapper}>
      <div style={{ overflowX: "auto" }}>{children}</div>
    </div>
  </div>
);

const getStatusStyle = (status) => {
  switch (status) {
    case "PAID":
      return { backgroundColor: "#D1FAE5", color: "#065F46" };
    case "GENERATED":
      return { backgroundColor: "#E0F2FE", color: "#0369A1" };
    case "PENDING":
      return { backgroundColor: "#FEF3C7", color: "#92400E" };
    case "OVERDUE":
      return { backgroundColor: "#FEE2E2", color: "#991B1B" };
    case "CANCELLED":
      return { backgroundColor: "#E5E7EB", color: "#374151" };
    case "PARTIALLY_PAID":
      return { backgroundColor: "#DBEAFE", color: "#1E40AF" };
    case "DRAFT":
      return { backgroundColor: "#F3F4F6", color: "#374151" };
    default:
      return { backgroundColor: "#F3F4F6", color: "#374151" };
  }
};

const styles = {
  loading: { padding: "100px", textAlign: "center", fontWeight: "800", color: "#25343F" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "10px" },
  welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
  subText: { color: "#7F8C8D", fontSize: "13px", margin: "4px 0" },
  btnGroup: { display: "flex", gap: "10px" },
  settingsBtn: { background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "10px", borderRadius: "8px", cursor: "pointer", display: "flex" },
  actionBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "25px" },
  statCard: { background: "#fff", padding: "20px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F0F2F4" },
  statLabel: { margin: 0, color: "#7F8C8D", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" },
  statValue: { margin: "4px 0", fontSize: "20px", fontWeight: "800" },
  iconCircle: { width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
  infoBox: { background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #F0F2F4" },
  infoTitle: { margin: "0 0 15px 0", fontSize: "14px", color: "#25343F", borderBottom: "1px solid #F1F5F9", paddingBottom: "10px", fontWeight: "700" },
  infoRow: { display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px", color: "#475569" },
  sectionContainer: { marginBottom: "30px" },
  sectionHeader: {},
  sectionTitle: { fontSize: "16px", fontWeight: "700", color: "#25343F", margin: 0, borderLeft: "4px solid #27AE60", paddingLeft: "12px" },
  tableWrapper: { background: "#fff", borderRadius: "12px", border: "1px solid #F0F2F4", marginTop: "10px" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { background: "#F9FAFB" },
  th: { padding: "12px 18px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: "800" },
  tableRow: { borderBottom: "1px solid #F1F5F9" },
  td: { padding: "12px 18px", fontSize: "13px", color: "#334155" },
  badge: { padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700" },
  iconBtn: { border: "none", background: "#F1F5F9", padding: "6px", borderRadius: "6px", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", padding: "25px", borderRadius: "15px", width: "350px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" },
  select: { width: "100%", padding: "10px", marginTop: "15px", borderRadius: "8px", border: "1px solid #E2E8F0" },
  modalBtns: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" },
  cancelBtn: { padding: "8px 15px", border: "none", background: "#F1F5F9", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  saveBtn: { padding: "8px 15px", border: "none", background: "#3498DB", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  softBtn: { padding: "10px", border: "1px solid #E2E8F0", background: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  hardBtn: { padding: "10px", border: "none", background: "#FEE2E2", color: "#991B1B", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }
};

export default AccountsDashboard;