import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";

function ClientView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredCount, setFilteredCount] = useState(0);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      const data = await apiRequest(
        `/employee-portal/api/clients/${id}/`,
        "GET",
      );
      setClient(data);
      setFilteredCount(data.profile_count);
      console.log("CLIENT DATA =", data);
      console.log("created_by =", data.created_by);
      console.log("created_by_name =", data.created_by_name);
    } catch (error) {
      console.error("Error fetching client details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    if (!startDate || !endDate) {
      alert("Please select both dates");
      return;
    }
    setFilterLoading(true);
    try {
      const data = await apiRequest(
        `/employee-portal/api/clients/${id}/?start_date=${startDate}&end_date=${endDate}`,
        "GET",
      );
      setFilteredCount(data.profile_count);
    } catch (error) {
      console.error("Filter error:", error);
    } finally {
      setFilterLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      SIGNED: { background: "#DCFCE7", color: "#166534" },
      SENT: { background: "#FEF3C7", color: "#92400E" },
      NOT_SENT: { background: "#FEE2E2", color: "#991B1B" },
    };
    return styles[status] || { background: "#F1F5F9", color: "#475569" };
  };

  if (loading)
    return (
      <BaseLayout>
        <div style={styles.loader}>Loading Comprehensive Profile...</div>
      </BaseLayout>
    );
  if (!client)
    return (
      <BaseLayout>
        <div style={styles.error}>Client not found!</div>
      </BaseLayout>
    );

  return (
    <BaseLayout>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Back to List
        </button>
        <div style={styles.headerInfo}>
          <div style={styles.titleWrapper}>
            <h2 style={styles.pageTitle}>{client.client_name}</h2>
            <div style={styles.badgeGroup}>
              {client.is_verified ? (
                <span style={styles.verifiedBadge}>Verified</span>
              ) : (
                <span style={styles.unverifiedBadge}>Pending Verification</span>
              )}
              {!client.is_active && (
                <span style={styles.inactiveBadge}>Inactive Account</span>
              )}
            </div>
          </div>
          <span style={styles.companySub}>
            {client.company_name} • ID: {client.id}
          </span>
        </div>
      </div>

      {/* Dashboard Stats & Filter */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Profiles Shared Count</span>
          <span style={styles.statValue}>{filteredCount}</span>
        </div>
        <div style={styles.filterCard}>
          <div style={styles.filterTitle}>
            Filter Profile Count by Date Range
          </div>
          <div style={styles.dateInputs}>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={styles.dateInput}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={styles.dateInput}
              />
            </div>
            <button onClick={handleFilter} style={styles.filterBtn}>
              {filterLoading ? "..." : "Apply"}
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  fetchClientDetails();
                }}
                style={styles.resetBtn}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={styles.containerGrid}>
        {/* Left Column */}
        <div style={styles.leftCol}>
          {/* Basic Info */}
          <div style={styles.card}>
            <h3 style={styles.cardHeading}>Basic Contact Information</h3>
            <div style={styles.infoGrid}>
              <InfoItem label="Client Name" value={client.client_name} />
              <InfoItem label="Personal Email" value={client.email} />
              <InfoItem label="Official Email" value={client.official_email} />
              <InfoItem label="Phone Number" value={client.phone_number} />
              <InfoItem
                label="Sending Email ID"
                value={client.sending_email_id}
              />
              <InfoItem
                label="Employee Count"
                value={client.company_employee_count}
              />
            </div>
          </div>

          {/* Company Details */}
          <div style={styles.card}>
            <h3 style={styles.cardHeading}>Business Information</h3>
            <div style={styles.infoGrid}>
              <div style={styles.fullRow}>
                <InfoItem label="Company Name" value={client.company_name} />
              </div>
              <InfoItem
                label="Verification"
                value={client.is_verified ? "✅ Verified" : "⏳ Pending"}
              />
              <InfoItem
                label="Account Status"
                value={client.is_active ? "🟢 Active" : "🔴 Inactive"}
              />
            </div>
          </div>

          {/* Meta Data */}
          <div style={styles.card}>
            <h3 style={styles.cardHeading}>System Metadata</h3>
            <div style={styles.metaList}>
              <p style={styles.metaItem}>
                <strong>Added By:</strong> {client.created_by_name}
              </p>
              <p style={styles.metaItem}>
                <strong>Created On:</strong>{" "}
                {new Date(client.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.rightCol}>
          {/* Document Section */}
          <div style={styles.card}>
            <h3 style={styles.cardHeading}>Compliance & Documents</h3>
            <DocRow
              label="NDA Document"
              file={client.nda_document}
              status={client.nda_status}
              date={client.nda_uploaded_date}
              styleFunc={getStatusStyle}
            />
            <DocRow
              label="MSA Document"
              file={client.msa_document}
              status={client.msa_status}
              date={client.msa_uploaded_date}
              styleFunc={getStatusStyle}
            />
          </div>

          {/* Remarks */}
          <div style={styles.card}>
            <h3 style={styles.cardHeading}>Internal Remark</h3>
            <p style={styles.remarkBox}>
              {client.remark || "No internal remarks provided."}
            </p>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}

// Sub-Components
const InfoItem = ({ label, value }) => (
  <div style={styles.infoRow}>
    <span style={styles.label}>{label}</span>
    <span style={styles.value}>{value || "N/A"}</span>
  </div>
);

const DocRow = ({ label, file, status, date, styleFunc }) => (
  <div style={styles.docRow}>
    <div style={{ flex: 1 }}>
      <div style={styles.docLabel}>{label}</div>
      {date && <div style={styles.docDate}>Uploaded: {date}</div>}
    </div>
    <div style={styles.docActions}>
      {status && (
        <span style={{ ...styles.statusBadge, ...styleFunc(status) }}>
          {status.replace("_", " ")}
        </span>
      )}
      <div style={styles.btnGroup}>
        {file ? (
          <a
            href={file}
            target="_blank"
            rel="noreferrer"
            style={styles.smallLink}
          >
            Open File
          </a>
        ) : (
          <span style={{ fontSize: "11px", color: "#999" }}>No File</span>
        )}
      </div>
    </div>
  </div>
);

const styles = {
  loader: {
    padding: "50px",
    textAlign: "center",
    color: "#64748B",
    fontWeight: "700",
  },
  error: {
    padding: "50px",
    textAlign: "center",
    color: "#DC2626",
    fontWeight: "700",
  },
  topBar: {
    display: "flex",
    gap: "20px",
    marginBottom: "30px",
    alignItems: "flex-start",
  },
  backBtn: {
    background: "#1E293B",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  headerInfo: { display: "flex", flexDirection: "column", gap: "5px" },
  titleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  pageTitle: {
    fontSize: "28px",
    color: "#1E293B",
    fontWeight: "800",
    margin: 0,
  },
  companySub: { fontSize: "15px", color: "#64748B", fontWeight: "600" },

  // Stats Row - Vendor Theme (Orange)
  statsRow: {
    display: "flex",
    gap: "20px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  statCard: {
    background: "#FF9B51",
    padding: "25px",
    borderRadius: "18px",
    flex: "1",
    minWidth: "220px",
    color: "#fff",
    textAlign: "center",
    boxShadow: "0 10px 20px rgba(255,155,81,0.2)",
  },
  statLabel: {
    fontSize: "13px",
    fontWeight: "700",
    opacity: 0.9,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  statValue: {
    fontSize: "42px",
    fontWeight: "900",
    display: "block",
    marginTop: "5px",
  },

  filterCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "18px",
    flex: "2.5",
    minWidth: "350px",
    border: "1px solid #E2E8F0",
  },
  filterTitle: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: "15px",
    textTransform: "uppercase",
  },
  dateInputs: {
    display: "flex",
    gap: "15px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
  inputLabel: { fontSize: "11px", fontWeight: "800", color: "#64748B" },
  dateInput: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #CBD5E1",
    fontSize: "14px",
  },
  filterBtn: {
    background: "#1E293B",
    color: "#fff",
    border: "none",
    padding: "11px 22px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  resetBtn: {
    background: "#F1F5F9",
    color: "#475569",
    border: "none",
    padding: "11px 15px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  containerGrid: {
    display: "grid",
    gridTemplateColumns: "1.8fr 1.2fr",
    gap: "25px",
  },
  leftCol: { display: "flex", flexDirection: "column", gap: "25px" },
  rightCol: { display: "flex", flexDirection: "column", gap: "25px" },

  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "20px",
    border: "1px solid #E2E8F0",
  },
  cardHeading: {
    fontSize: "12px",
    fontWeight: "900",
    color: "#94A3B8",
    marginBottom: "20px",
    textTransform: "uppercase",
    letterSpacing: "1.2px",
    borderBottom: "1px solid #F8FAFC",
    paddingBottom: "10px",
  },

  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  infoRow: { display: "flex", flexDirection: "column", gap: "5px" },
  label: {
    fontSize: "11px",
    color: "#94A3B8",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  value: { fontSize: "15px", color: "#1E293B", fontWeight: "700" },
  fullRow: { gridColumn: "1 / -1" },

  docRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 0",
    borderBottom: "1px solid #F1F5F9",
  },
  docLabel: { fontSize: "15px", fontWeight: "800", color: "#334155" },
  docDate: { fontSize: "11px", color: "#94A3B8" },
  docActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px",
  },
  statusBadge: {
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "800",
  },
  btnGroup: { display: "flex", gap: "8px" },
  smallLink: {
    background: "#EFF6FF",
    color: "#3B82F6",
    textDecoration: "none",
    padding: "5px 12px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
    border: "1px solid #DBEAFE",
  },

  verifiedBadge: {
    background: "#DCFCE7",
    color: "#166534",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "800",
  },
  unverifiedBadge: {
    background: "#FEF3C7",
    color: "#92400E",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "800",
  },
  inactiveBadge: {
    background: "#FEE2E2",
    color: "#991B1B",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "800",
  },
  remarkBox: {
    fontSize: "14px",
    color: "#475569",
    fontStyle: "italic",
    background: "#FFFBEB",
    padding: "15px",
    borderRadius: "10px",
    borderLeft: "5px solid #F59E0B",
    lineHeight: "1.6",
  },
  metaList: { display: "flex", flexDirection: "column", gap: "10px" },
  metaItem: { fontSize: "13px", color: "#64748B" },
};

export default ClientView;
