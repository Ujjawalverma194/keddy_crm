import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../services/api";
import AccountsBaseLayout from "../components/AccountsBaseLayout";

// ─────────────────────────────────────────────
// Toaster (identical to CreateInvoice)
// ─────────────────────────────────────────────
const Toaster = ({ msg, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      ...styles.toaster,
      backgroundColor: type === "error" ? "#EF4444" : "#10B981",
    }}>
      {msg}
    </div>
  );
};

// ─────────────────────────────────────────────
// numberToWords (same as Create)
// ─────────────────────────────────────────────
const numberToWordsIndian = (num) => {
  if (!num || num === 0) return "";
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const fmt = (n, s) => {
    if (!n) return "";
    return (n > 19 ? b[Math.floor(n/10)] + (n%10 ? " "+a[n%10] : "") : a[n]) + " " + s + " ";
  };
  let r = "";
  r += fmt(Math.floor(num/10000000),"Crore");
  r += fmt(Math.floor((num/100000)%100),"Lakh");
  r += fmt(Math.floor((num/1000)%100),"Thousand");
  r += fmt(Math.floor((num/100)%10),"Hundred");
  const l = num % 100;
  if (num > 100 && l > 0) r += "and ";
  r += fmt(l, "");
  return r.trim() + " Only";
};

const Icons = {
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────
// UpdateClientModal (same as Create page)
// ─────────────────────────────────────────────
const UpdateClientModal = ({ isOpen, onClose, client, onClientUpdated, notify }) => {
  const [formData, setFormData] = useState({
    client_name: "", company_name: "", phone_number: "",
    email: "", gst_number: "", billing_address: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        client_name:     client.client_name     || "",
        company_name:    client.company_name    || "",
        phone_number:    client.phone_number    || "",
        email:           client.email           || "",
        gst_number:      client.gst_number      || "",
        billing_address: client.billing_address || "",
      });
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest(`/invoice/api/clients/${client.id}/`, "PATCH", formData);
      if (res) { onClientUpdated(res); notify("Client updated!"); onClose(); }
    } catch { notify("Update failed.", "error"); }
    finally { setLoading(false); }
  };

  if (!isOpen || !client) return null;
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modernModalContent}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Update Client Info</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.modalFormWrapper}>
          <div style={styles.modalBody}>
            <div style={styles.formGridModern}>
              {[
                { label: "Client Name",     key: "client_name",     type: "text"  },
                { label: "Company Name",    key: "company_name",    type: "text"  },
                { label: "Phone Number",    key: "phone_number",    type: "text"  },
                { label: "Email",           key: "email",           type: "email" },
                { label: "GST Number",      key: "gst_number",      type: "text"  },
                { label: "Billing Address", key: "billing_address", type: "text"  },
              ].map(({ label, key, type }) => (
                <div key={key} style={styles.inputGroup}>
                  <label style={styles.label}>{label}</label>
                  <input style={styles.input} type={type} value={formData[key]}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>
          <div style={styles.modalFooter}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={styles.saveBtn}>
              {loading ? "Updating..." : "Update Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Item calculation helper
// ─────────────────────────────────────────────
const calcItem = (item) => {
  let amount = 0;
  if (item.billing_type === "BILLABLE_DAYS") {
    amount = (parseFloat(item.monthly_rate) / (parseFloat(item.total_days) || 1)) * (parseFloat(item.working_days) || 0);
  } else if (item.billing_type === "HOURLY") {
    amount = parseFloat(item.hourly_rate) * parseFloat(item.total_hours);
  } else {
    amount = parseFloat(item.amount) || 0;
  }
  const gst = (amount * (parseFloat(item.gst_rate) || 0)) / 100;
  return {
    calc_amount: Math.round(amount * 100) / 100,
    gst_amount:  Math.round(gst * 100) / 100,
    total:       Math.round((amount + gst) * 100) / 100,
  };
};

// ─────────────────────────────────────────────
// Map API item → local state shape
// The GET API returns InvoiceItemDetailSerializer fields exactly
// ─────────────────────────────────────────────
const apiItemToLocal = (apiItem) => {
  const local = {
    // preserve DB id for PATCH upsert logic
    id:              apiItem.id             || null,
    billing_type:    apiItem.billing_type   || "MANUAL",
    title:           apiItem.title          || "",
    description:     apiItem.description   || "",
    sac_code:        apiItem.sac_code       || "",
    // candidate
    candidate:       apiItem.candidate      || null,
    candidate_name:  apiItem.candidate_name  || "",
    candidateSearch: apiItem.candidate_name || "",
    showDropdown:    false,
    // BILLABLE_DAYS
    monthly_rate:    parseFloat(apiItem.monthly_rate)  || 0,
    total_days:      parseInt(apiItem.total_days)       || 0,
    working_days:    parseInt(apiItem.working_days)     || 0,
    // HOURLY
    hourly_rate:     parseFloat(apiItem.hourly_rate)   || 0,
    total_hours:     parseFloat(apiItem.total_hours)   || 0,
    // MANUAL
    amount:          parseFloat(apiItem.amount)         || 0,
    // GST
    gst_rate:        apiItem.gst_rate ? parseFloat(apiItem.gst_rate) : 18,
    // calculated
    calc_amount: 0, gst_amount: 0, total: 0,
  };
  return { ...local, ...calcItem(local) };
};


// ══════════════════════════════════════════════
//  EditInvoicePage — Main Component
// ══════════════════════════════════════════════
export default function EditInvoicePage() {
  const { id } = useParams();           // route: /accounts/invoices/:id/edit
  const navigate = useNavigate();

  // ── UI state ──
  const [toast, setToast]           = useState({ show: false, msg: "", type: "success" });
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const notify = (msg, type = "success") => setToast({ show: true, msg, type });

  // ── Client state ──
  const [clients, setClients]                     = useState([]);
  const [clientSearch, setClientSearch]           = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient]       = useState(null);
  const [loadingClients, setLoadingClients]       = useState(false);
  const [isUpdateClientModalOpen, setIsUpdateClientModalOpen] = useState(false);

  // ── Candidate state ──
  const [candidateList, setCandidateList]         = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // ── Bank state ──
  const [banks, setBanks]             = useState([]);
  const [selectedBank, setSelectedBank] = useState("");

  // ── Invoice fields ──
  const [invoiceDate, setInvoiceDate]   = useState("");
  const [billingMonth, setBillingMonth] = useState("");
  const [dueDate, setDueDate]           = useState("");
  const [notes, setNotes]               = useState("");
  const [items, setItems]               = useState([]);
  const [invoiceGstRate, setInvoiceGstRate] = useState(18);

  // ── Invoice summary (read-only display from API) ──
  const [invoiceSummary, setInvoiceSummary] = useState(null);

  const hasBillingDetails = (c) => c?.gst_number && c?.billing_address;

  // ── Fetch all clients ──
  const fetchClients = useCallback(async (search = "") => {
    setLoadingClients(true);
    try {
      let all = [];
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiRequest(`/invoice/api/clients/${qs}`);
      if (res?.results && Array.isArray(res.results)) all = res.results;
      else if (Array.isArray(res)) all = res;
      setClients(all);
    } catch (e) { console.error(e); }
    finally { setLoadingClients(false); }
  }, []);

  
  // Update all items' GST rate when invoice GST rate changes
  useEffect(() => {
    if (items.length > 0) {
      setItems(items.map(item => ({ ...item, gst_rate: invoiceGstRate })));
    }
  }, [invoiceGstRate]);

  // ── Fetch candidates for selected client ──
  const fetchCandidates = useCallback(async (search = "") => {
    if (!selectedClient) { setCandidateList([]); return; }
    setLoadingCandidates(true);
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiRequest(`/invoice/api/clients/${selectedClient.id}/candidates/${qs}`);
      if (res?.results && Array.isArray(res.results)) setCandidateList(res.results);
      else if (Array.isArray(res)) setCandidateList(res);
      else setCandidateList([]);
    } catch { setCandidateList([]); }
    finally { setLoadingCandidates(false); }
  }, [selectedClient]);

  // ── ON MOUNT: fetch invoice (GET) + banks + clients ──
  useEffect(() => {
    const init = async () => {
      try {
        const [invoiceRes, banksRes] = await Promise.all([
          apiRequest(`/invoice/api/invoices/${id}/`),   // ← NEW GET endpoint
          apiRequest(`/invoice/api/bank-accounts/`),
          fetchClients(),
        ]);

        // Banks
        setBanks(banksRes?.results || []);

        if (invoiceRes) {
          // ── Dates ──
          setInvoiceDate(invoiceRes.invoice_date   || "");
          setBillingMonth(invoiceRes.billing_month || "");
          setDueDate(invoiceRes.due_date            || "");
          setNotes(invoiceRes.notes                 || "");

          // ── Bank pre-select ──
          if (invoiceRes.company_bank_account) {
            setSelectedBank(String(invoiceRes.company_bank_account));
          }

          // ── Client pre-select ──
          // GET returns client_detail (nested) from InvoiceRetrieveSerializer
          const clientObj = invoiceRes.client_detail || null;
          if (clientObj) {
            setSelectedClient(clientObj);
            setClientSearch(`${clientObj.client_name} - ${clientObj.company_name}`);
          }

          // ── Items pre-fill ──
          if (Array.isArray(invoiceRes.items)) {
            setItems(invoiceRes.items.map(apiItemToLocal));
          }

          // ── Summary (totals display) ──
          setInvoiceSummary({
            subtotal:     invoiceRes.subtotal,
            gst_amount:   invoiceRes.gst_amount,
            total_amount: invoiceRes.total_amount,
            invoice_number: invoiceRes.invoice_number,
            status:       invoiceRes.status,
          });
          
          // ── GST Rate ──
          setInvoiceGstRate(invoiceRes.gst_rate || 18);
        }
      } catch (e) {
        notify("Failed to load invoice data.", "error");
        console.error(e);
      } finally {
        setLoadingPage(false);
      }
    };
    init();
  }, [id, fetchClients]);

  useEffect(() => {
    if (selectedClient) fetchCandidates();
  }, [selectedClient, fetchCandidates]);

  // ── Client updated in modal ──
  const handleClientUpdated = (updated) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedClient(updated);
  };

  // ── Item helpers ──
  const addItem = () => setItems(prev => [...prev, {
    id: null, billing_type: "MANUAL", title: "", description: "", sac_code: "",
    candidate: null, candidateSearch: "", showDropdown: false,
    monthly_rate: 0, total_days: 0, working_days: 0,
    hourly_rate: 0, total_hours: 0, amount: 0,
    gst_rate: invoiceGstRate, calc_amount: 0, gst_amount: 0, total: 0,
  }]);

  // Update all items' GST rate when invoice GST rate changes
  useEffect(() => {
    if (items.length > 0) {
      setItems(items.map(item => ({ ...item, gst_rate: invoiceGstRate })));
    }
  }, [invoiceGstRate]);

  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const updateItem = (i, key, value) => {
    setItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: value };
      return next.map((item, idx) => idx === i ? { ...item, ...calcItem(item) } : item);
    });
  };

  const selectCandidate = (i, cand) => {
    setItems(prev => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        candidate:       cand.id,
        candidateSearch: cand.candidate_name,
        showDropdown:    false,
        title:           cand.candidate_name,
        description:     cand.technology   || "",
        monthly_rate:    parseFloat(cand.client_rate) || 0,
      };
      return next.map((item, idx) => idx === i ? { ...item, ...calcItem(item) } : item);
    });
  };

  // ── Grand total (frontend live calc) ──
  const grandTotal = items.reduce((acc, item) => ({
    subtotal: acc.subtotal + item.calc_amount,
    gst:      acc.gst + item.gst_amount,
    total:    acc.total + item.total,
  }), { subtotal: 0, gst: 0, total: 0 });

  // ── Validation ──
  const validate = () => {
    if (!selectedClient) return "Select Client is required";
    if (!selectedBank)   return "Bank Account is required";
    if (!dueDate)        return "Due Date is required";
    if (items.length === 0) return "At least one item is required";
    return null;
  };

  // ── PATCH /invoice/api/invoices/:id/update/ ──
  const handleSubmit = async () => {
    const err = validate();
    if (err) { notify(err, "error"); return; }
    setSubmitting(true);
    try {
      const payload = {
        client:                selectedClient.id,
        company_bank_account:  selectedBank,
        invoice_date:          invoiceDate,
        billing_month:         billingMonth,
        due_date:              dueDate,
        notes,
        gst_rate:              invoiceGstRate,
        // Sync bill_to_* from selected client
        bill_to_name:          selectedClient.client_name,
        bill_to_company:       selectedClient.company_name,
        bill_to_address:       selectedClient.billing_address,
        bill_to_gstin:         selectedClient.gst_number,
        bill_to_email:         selectedClient.email,
        bill_to_phone:         selectedClient.phone_number,
        // Items — include id for existing, omit for new ones
        items: items.map(item => ({
          ...(item.id ? { id: item.id } : {}),   // existing items need id for upsert
          candidate:    item.candidate,
          title:        item.title,
          description:  item.description,
          sac_code:     item.sac_code,
          billing_type: item.billing_type,
          // BILLABLE_DAYS fields
          monthly_rate: item.monthly_rate,
          total_days:   item.total_days,
          working_days: item.working_days,
          // HOURLY fields
          hourly_rate:  item.hourly_rate,
          total_hours:  item.total_hours,
          // MANUAL field
          amount:       item.billing_type === "MANUAL" ? item.amount : item.calc_amount
        })),
      };

      const res = await apiRequest(`/invoice/api/invoices/${id}/update/`, "PATCH", payload);

      if (res) {
        // Refresh summary from server response
        if (res.invoice) {
          setInvoiceSummary({
            subtotal:       res.invoice.subtotal,
            gst_amount:     res.invoice.gst_amount,
            total_amount:   res.invoice.total_amount,
            invoice_number: res.invoice.invoice_number,
            status:         res.invoice.status,
          });
        }
        notify("Invoice updated successfully! ✓");
        setTimeout(() => navigate(-1), 1500);
      }
    } catch (e) {
      notify("Invoice update failed. Please try again.", "error");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────
  // Loading screen
  // ─────────────────────────────────────────────
  if (loadingPage) {
    return (
      <AccountsBaseLayout>
        <div style={styles.loadingWrapper}>
          <div style={styles.spinnerRing} />
          <p style={styles.loadingText}>Loading invoice data…</p>
        </div>
      </AccountsBaseLayout>
    );
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <AccountsBaseLayout>
      {toast.show && (
        <Toaster msg={toast.msg} type={toast.type}
          onClose={() => setToast(t => ({ ...t, show: false }))} />
      )}

      {/* ── Top Nav ── */}
      <div style={styles.topNav}>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
          <div>
            <h2 style={styles.pageTitle}>
              Edit Invoice
              {invoiceSummary?.invoice_number && (
                <span style={styles.invoiceBadge}>{invoiceSummary.invoice_number}</span>
              )}
            </h2>
            {invoiceSummary?.status && (
              <span style={{ ...styles.statusBadge, ...statusColor(invoiceSummary.status) }}>
                {invoiceSummary.status}
              </span>
            )}
          </div>
        </div>
        <button style={styles.settingsBtn} onClick={() => navigate("/accounts/finance-overview")} title="Settings">
          <Icons.Settings />
        </button>
      </div>

      <div style={styles.card}>

        {/* ── Client Selector ── */}
        <div style={styles.section}>
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <label style={styles.label}>Select Client</label>
              <input
                style={styles.inputSearch}
                placeholder="Search Client..."
                value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); fetchClients(e.target.value); setShowClientDropdown(true); }}
                onFocus={() => setShowClientDropdown(true)}
              />
              {showClientDropdown && (
                <div style={styles.dropdownList}>
                  {loadingClients
                    ? <div style={styles.dropdownItem}>Loading…</div>
                    : clients.map(c => (
                      <div key={c.id} style={styles.dropdownItem}
                        onClick={() => { setSelectedClient(c); setClientSearch(`${c.client_name} - ${c.company_name}`); setShowClientDropdown(false); }}>
                        {c.client_name} — {c.company_name}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>

          {selectedClient && (
            <div style={styles.warningBox}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>
                  Selected: {selectedClient.company_name}
                </span>
                {!hasBillingDetails(selectedClient) && (
                  <span style={{ fontSize: "12px", color: "#B45309", fontWeight: "600" }}>
                    ⚠️ GST or Billing Address missing.
                  </span>
                )}
              </div>
              <button onClick={() => setIsUpdateClientModalOpen(true)} style={styles.updateBtn}>
                Edit Client Info
              </button>
            </div>
          )}
        </div>

        {/* ── Bank Account ── */}
        <div style={styles.section}>
          <label style={styles.label}>Bank Account</label>
          <select style={styles.input} value={selectedBank}
            onChange={e => setSelectedBank(e.target.value)}
            disabled={selectedClient && !hasBillingDetails(selectedClient)}>
            <option value="">Select Bank</option>
            {banks.map(b => <option key={b.id} value={b.id}>{b.bank_name}</option>)}
          </select>
        </div>

        {/* ── Dates ── */}
        <div style={styles.grid3}>
          <div><label style={styles.label}>Invoice Date</label>
            <input type="date" style={styles.input} value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>
          <div><label style={styles.label}>Billing Month</label>
            <input type="date" style={styles.input} value={billingMonth} onChange={e => setBillingMonth(e.target.value)} /></div>
          <div><label style={styles.label}>Due Date</label>
            <input type="date" style={styles.input} value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
        </div>

        {/* ── Notes ── */}
        <div style={styles.section}>
          <label style={styles.label}>Notes</label>
          <textarea style={styles.textarea} placeholder="Any notes for this invoice…"
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {/* ── GST Rate ── */}
        <div style={styles.grid3}>
          <div><label style={styles.label}>Invoice GST Rate (%)</label>
            <input type="number" step="0.01" style={styles.input} value={invoiceGstRate} onChange={e => setInvoiceGstRate(Number(e.target.value) || 0)} /></div>
        </div>

        {/* ── Invoice Items ── */}
        <div style={{ marginTop: "30px" }}>
          <h3 style={{ fontSize: "18px", color: "#1E293B", marginBottom: "15px" }}>Invoice Items</h3>

          {items.map((item, i) => (
            <div key={i} style={styles.itemCard}>
              <div style={styles.itemHeader}>
                <span style={styles.itemCount}>Item #{i + 1}</span>
                <button onClick={() => removeItem(i)} style={styles.removeBtn}>✕ Remove</button>
              </div>

              {/* Billing type + Candidate */}
              <div style={styles.grid2}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Billing Type</label>
                  <select style={styles.input} value={item.billing_type}
                    onChange={e => updateItem(i, "billing_type", e.target.value)}>
                    <option value="BILLABLE_DAYS">Billable Days</option>
                    <option value="HOURLY">Hourly</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>

                {item.billing_type !== "MANUAL" && (
                  <div style={{ ...styles.inputGroup, position: "relative" }}>
                    <label style={styles.label}>Candidate</label>
                    <input style={styles.inputSearch} placeholder="Search Candidate..."
                      value={item.candidateSearch} disabled={!selectedClient}
                      onChange={e => { updateItem(i, "candidateSearch", e.target.value); updateItem(i, "showDropdown", true); fetchCandidates(e.target.value); }}
                      onFocus={() => updateItem(i, "showDropdown", true)} />
                    {item.showDropdown && (
                      <div style={styles.dropdownList}>
                        {loadingCandidates
                          ? <div style={styles.dropdownItem}>Loading…</div>
                          : candidateList.map(c => (
                            <div key={c.id} style={styles.dropdownItem}
                              onClick={() => selectCandidate(i, c)}>{c.candidate_name}</div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Title / Description / SAC */}
              <div style={styles.grid3}>
                <div><label style={styles.label}>Title</label>
                  <input style={styles.input} value={item.title} onChange={e => updateItem(i, "title", e.target.value)} /></div>
                <div><label style={styles.label}>Description</label>
                  <input style={styles.input} value={item.description} onChange={e => updateItem(i, "description", e.target.value)} /></div>
                <div><label style={styles.label}>SAC Code</label>
                  <input style={styles.input} value={item.sac_code} onChange={e => updateItem(i, "sac_code", e.target.value)} /></div>
              </div>

              {/* Billing-type specific inputs */}
              <div style={styles.gridCalculations}>
                {item.billing_type === "BILLABLE_DAYS" && (<>
                  <div style={{ position: "relative" }}>
                    <label style={styles.label}>Monthly Rate</label>
                    <input style={styles.input} type="number" value={item.monthly_rate}
                      onChange={e => updateItem(i, "monthly_rate", Number(e.target.value))} />
                    {item.monthly_rate > 0 && <small style={styles.wordText}>{numberToWordsIndian(item.monthly_rate)}</small>}
                  </div>
                  <div><label style={styles.label}>Total Days</label>
                    <input style={styles.input} type="number" value={item.total_days}
                      onChange={e => updateItem(i, "total_days", Number(e.target.value))} /></div>
                  <div><label style={styles.label}>Working Days</label>
                    <input style={styles.input} type="number" value={item.working_days}
                      onChange={e => updateItem(i, "working_days", Number(e.target.value))} /></div>
                </>)}

                {item.billing_type === "HOURLY" && (<>
                  <div style={{ position: "relative" }}>
                    <label style={styles.label}>Hourly Rate</label>
                    <input style={styles.input} type="number" value={item.hourly_rate}
                      onChange={e => updateItem(i, "hourly_rate", Number(e.target.value))} />
                    {item.hourly_rate > 0 && <small style={styles.wordText}>{numberToWordsIndian(item.hourly_rate)}</small>}
                  </div>
                  <div><label style={styles.label}>Total Hours</label>
                    <input style={styles.input} type="number" value={item.total_hours}
                      onChange={e => updateItem(i, "total_hours", Number(e.target.value))} /></div>
                </>)}

                {item.billing_type === "MANUAL" && (
                  <div style={{ position: "relative" }}>
                    <label style={styles.label}>Amount</label>
                    <input style={styles.input} type="number" value={item.amount}
                      onChange={e => updateItem(i, "amount", Number(e.target.value))} />
                    {item.amount > 0 && <small style={styles.wordText}>{numberToWordsIndian(item.amount)}</small>}
                  </div>
                )}
              </div>

              {/* Summary row */}
              <div style={styles.summaryRow}>
                <div>
                  <label style={styles.label}>GST %</label>
                  <input style={{ ...styles.input, width: "60px" }} type="number"
                    value={item.gst_rate} disabled />
                </div>
                <div><small style={styles.label}>Amount</small>
                  <div style={styles.readonlyValue}>₹{item.calc_amount.toLocaleString("en-IN")}</div></div>
                <div><small style={styles.label}>GST</small>
                  <div style={styles.readonlyValue}>₹{item.gst_amount.toLocaleString("en-IN")}</div></div>
                <div><small style={styles.label}>Total</small>
                  <div style={styles.totalValue}>₹{item.total.toLocaleString("en-IN")}</div></div>
              </div>
            </div>
          ))}

          <button onClick={addItem} style={styles.addItemBtn}>+ Add Item</button>
        </div>

        {/* ── Grand Total Bar ── */}
        {items.length > 0 && (
          <div style={styles.grandTotalBar}>
            <div style={styles.grandTotalItem}>
              <span style={styles.grandTotalLabel}>Subtotal</span>
              <span style={styles.grandTotalValue}>₹{grandTotal.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div style={styles.grandTotalDivider} />
            <div style={styles.grandTotalItem}>
              <span style={styles.grandTotalLabel}>GST</span>
              <span style={styles.grandTotalValue}>₹{grandTotal.gst.toLocaleString("en-IN")}</span>
            </div>
            <div style={styles.grandTotalDivider} />
            <div style={styles.grandTotalItem}>
              <span style={{ ...styles.grandTotalLabel, color: "#1E40AF" }}>Grand Total</span>
              <span style={styles.grandTotalFinal}>₹{grandTotal.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}

        {/* ── Submit ── */}
        <div style={{ marginTop: "30px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button onClick={() => navigate(-1)} style={styles.cancelBtnLarge}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (selectedClient && !hasBillingDetails(selectedClient))}
            style={{
              ...styles.submitBtnLarge,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting
              ? <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={styles.btnSpinner} /> Updating…
                </span>
              : "Update Invoice"
            }
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      <UpdateClientModal
        isOpen={isUpdateClientModalOpen}
        onClose={() => setIsUpdateClientModalOpen(false)}
        client={selectedClient}
        onClientUpdated={handleClientUpdated}
        notify={notify}
      />
    </AccountsBaseLayout>
  );
}

// ── Status badge color helper ──
const statusColor = (status) => {
  const map = {
    DRAFT:          { background: "#F1F5F9", color: "#64748B" },
    GENERATED:      { background: "#DBEAFE", color: "#1D4ED8" },
    SENT:           { background: "#FEF3C7", color: "#D97706" },
    PENDING:        { background: "#FEF3C7", color: "#D97706" },
    PARTIALLY_PAID: { background: "#E0F2FE", color: "#0369A1" },
    PAID:           { background: "#DCFCE7", color: "#15803D" },
    OVERDUE:        { background: "#FEE2E2", color: "#DC2626" },
    CANCELLED:      { background: "#F1F5F9", color: "#94A3B8" },
  };
  return map[status] || map.DRAFT;
};

// ─────────────────────────────────────────────
// Styles — identical to CreateInvoice + additions
// ─────────────────────────────────────────────
const styles = {
  toaster: { position: "fixed", top: "20px", right: "20px", color: "#fff", padding: "12px 24px", borderRadius: "8px", zIndex: 10001, fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  topNav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  backBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
  settingsBtn: { background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", padding: "10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: "22px", fontWeight: "800", color: "#1E293B", margin: 0, display: "flex", alignItems: "center", gap: "10px" },
  invoiceBadge: { fontSize: "13px", fontWeight: "700", color: "#FF9B51", background: "#FFF7ED", border: "1px solid #FDDCB5", borderRadius: "6px", padding: "2px 10px" },
  statusBadge: { fontSize: "11px", fontWeight: "700", borderRadius: "4px", padding: "2px 8px", display: "inline-block", marginTop: "4px", textTransform: "uppercase" },
  card: { background: "#fff", borderRadius: "12px", padding: "25px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
  section: { marginBottom: "20px" },
  label: { display: "block", fontSize: "12px", fontWeight: "700", color: "#64748B", marginBottom: "6px", textTransform: "uppercase" },
  input: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", width: "100%", outline: "none", boxSizing: "border-box", fontSize: "14px" },
  inputSearch: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", width: "100%", outline: "none", boxSizing: "border-box", background: "#fff", fontSize: "14px" },
  dropdownList: { position: "absolute", top: "100%", left: 0, width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", zIndex: 100, maxHeight: "200px", overflowY: "auto", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" },
  dropdownItem: { padding: "10px 14px", fontSize: "13px", cursor: "pointer", borderBottom: "1px solid #F1F5F9" },
  textarea: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", width: "100%", minHeight: "80px", fontSize: "14px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" },
  warningBox: { marginTop: "10px", padding: "12px", background: "#FFFBEB", border: "1px solid #FEF3C7", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  updateBtn: { background: "#F59E0B", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" },
  gridCalculations: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "15px", marginBottom: "15px" },
  itemCard: { padding: "15px", border: "1px solid #F1F5F9", borderRadius: "10px", background: "#F8FAFC", marginBottom: "15px" },
  itemHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  itemCount: { fontSize: "14px", fontWeight: "800", color: "#1E293B" },
  removeBtn: { background: "#EF4444", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "600" },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px", gap: "15px" },
  readonlyValue: { padding: "8px", background: "#E2E8F0", borderRadius: "6px", fontSize: "13px", minWidth: "80px", textAlign: "center", fontWeight: "600" },
  totalValue: { padding: "8px", background: "#DBEAFE", borderRadius: "6px", fontSize: "14px", fontWeight: "800", color: "#1E40AF", minWidth: "80px", textAlign: "center" },
  addItemBtn: { background: "#3B82F6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
  grandTotalBar: { marginTop: "25px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "18px 25px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "25px" },
  grandTotalItem: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" },
  grandTotalLabel: { fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase" },
  grandTotalValue: { fontSize: "16px", fontWeight: "700", color: "#1E293B" },
  grandTotalFinal: { fontSize: "20px", fontWeight: "900", color: "#1E40AF" },
  grandTotalDivider: { width: "1px", height: "40px", background: "#E2E8F0" },
  cancelBtnLarge: { background: "#fff", color: "#64748B", border: "1px solid #E2E8F0", padding: "14px 30px", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
  submitBtnLarge: { background: "#FF9B51", color: "#fff", border: "none", padding: "14px 40px", borderRadius: "10px", fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "2px" },
  wordText: { display: "block", fontSize: "13px", color: "#6366F1", fontWeight: "600", marginTop: "4px", fontStyle: "italic", lineHeight: "1.2" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modernModalContent: { background: "#fff", borderRadius: "16px", width: "600px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden" },
  modalHeader: { display: "flex", justifyContent: "space-between", padding: "20px 25px", borderBottom: "1px solid #F1F5F9", alignItems: "center", flexShrink: 0 },
  modalTitle: { margin: 0, fontSize: "20px", fontWeight: "800", color: "#1E293B" },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748B" },
  modalFormWrapper: { display: "flex", flexDirection: "column", overflowY: "auto", flex: 1 },
  modalBody: { padding: "25px", flex: 1 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: "12px", padding: "20px 25px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC", flexShrink: 0 },
  formGridModern: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "25px" },
  cancelBtn: { padding: "10px 20px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", cursor: "pointer", fontWeight: "600", color: "#64748B" },
  saveBtn: { padding: "10px 20px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" },
  loadingWrapper: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "16px" },
  spinnerRing: { width: "44px", height: "44px", border: "4px solid #E2E8F0", borderTop: "4px solid #FF9B51", borderRadius: "50%", animation: "spin 0.75s linear infinite" },
  btnSpinner: { display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.75s linear infinite" },
  loadingText: { color: "#64748B", fontWeight: "600", fontSize: "14px" },
};





// import React, { useEffect, useState, useCallback } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import AccountsBaseLayout from "../components/AccountsBaseLayout";

// // ─────────────────────────────────────────────
// // Toaster (identical to CreateInvoice)
// // ─────────────────────────────────────────────
// const Toaster = ({ msg, type, onClose }) => {
//   useEffect(() => {
//     const timer = setTimeout(onClose, 3000);
//     return () => clearTimeout(timer);
//   }, [onClose]);

//   return (
//     <div style={{
//       ...styles.toaster,
//       backgroundColor: type === "error" ? "#EF4444" : "#10B981",
//     }}>
//       {msg}
//     </div>
//   );
// };

// // ─────────────────────────────────────────────
// // Helpers (shared with CreateInvoice)
// // ─────────────────────────────────────────────
// const numberToWordsIndian = (num) => {
//   if (num === 0) return "";
//   const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
//   const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

//   const format = (n, suffix) => {
//     if (n === 0) return "";
//     let str = n > 19 ? b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "") : a[n];
//     return str + " " + suffix + " ";
//   };

//   let res = "";
//   res += format(Math.floor(num / 10000000), "Crore");
//   res += format(Math.floor((num / 100000) % 100), "Lakh");
//   res += format(Math.floor((num / 1000) % 100), "Thousand");
//   res += format(Math.floor((num / 100) % 10), "Hundred");
//   const lastTwo = num % 100;
//   if (num > 100 && lastTwo > 0) res += "and ";
//   res += format(lastTwo, "");
//   return res.trim() + " Only";
// };

// const Icons = {
//   Settings: () => (
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <circle cx="12" cy="12" r="3"></circle>
//       <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
//     </svg>
//   ),
// };

// // ─────────────────────────────────────────────
// // UpdateClientModal (identical to CreateInvoice)
// // ─────────────────────────────────────────────
// const UpdateClientModal = ({ isOpen, onClose, client, onClientUpdated, notify }) => {
//   const [formData, setFormData] = useState({
//     client_name: "", company_name: "", phone_number: "",
//     email: "", gst_number: "", billing_address: "",
//   });
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (client) {
//       setFormData({
//         client_name: client.client_name || "",
//         company_name: client.company_name || "",
//         phone_number: client.phone_number || "",
//         email: client.email || "",
//         gst_number: client.gst_number || "",
//         billing_address: client.billing_address || "",
//       });
//     }
//   }, [client]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const response = await apiRequest(`/invoice/api/clients/${client.id}/`, "PATCH", formData);
//       if (response) {
//         onClientUpdated(response);
//         notify("Client updated successfully!");
//         onClose();
//       }
//     } catch (error) {
//       notify("Update failed.", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen || !client) return null;

//   return (
//     <div style={styles.modalOverlay}>
//       <div style={styles.modernModalContent}>
//         <div style={styles.modalHeader}>
//           <h3 style={styles.modalTitle}>Update Client Info</h3>
//           <button onClick={onClose} style={styles.closeBtn}>✕</button>
//         </div>
//         <form onSubmit={handleSubmit} style={styles.modalFormWrapper}>
//           <div style={styles.modalBody}>
//             <div style={styles.formGridModern}>
//               {[
//                 { label: "Client Name", key: "client_name", type: "text" },
//                 { label: "Company Name", key: "company_name", type: "text" },
//                 { label: "Phone Number", key: "phone_number", type: "text" },
//                 { label: "Email", key: "email", type: "email" },
//                 { label: "GST Number", key: "gst_number", type: "text" },
//                 { label: "Billing Address", key: "billing_address", type: "text" },
//               ].map(({ label, key, type }) => (
//                 <div key={key} style={styles.inputGroup}>
//                   <label style={styles.label}>{label}</label>
//                   <input
//                     style={styles.input}
//                     type={type}
//                     value={formData[key]}
//                     onChange={e => setFormData({ ...formData, [key]: e.target.value })}
//                   />
//                 </div>
//               ))}
//             </div>
//           </div>
//           <div style={styles.modalFooter}>
//             <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
//             <button type="submit" disabled={loading} style={styles.saveBtn}>
//               {loading ? "Updating..." : "Update Details"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────
// // Item calculation helper (shared logic)
// // ─────────────────────────────────────────────
// const calculateItem = (item) => {
//   let amount = 0;
//   if (item.billing_type === "BILLABLE_DAYS") {
//     amount = (item.monthly_rate / (item.total_days || 1)) * (item.working_days || 0);
//   } else if (item.billing_type === "HOURLY") {
//     amount = item.hourly_rate * item.total_hours;
//   } else {
//     amount = item.amount || 0;
//   }
//   const gst = (amount * item.gst_rate) / 100;
//   return {
//     amount: Math.round(amount * 100) / 100,
//     gst: Math.round(gst * 100) / 100,
//     total: Math.round((amount + gst) * 100) / 100,
//   };
// };

// // ─────────────────────────────────────────────
// // Map API response items → local item shape
// // ─────────────────────────────────────────────
// const mapApiItemToLocal = (apiItem) => {
//   // The API uses generic rate/quantity/amount fields.
//   // We default to MANUAL billing type; adjust if your API returns billing_type.
//   const base = {
//     billing_type: apiItem.billing_type || "MANUAL",
//     title: apiItem.title || "",
//     description: apiItem.description || "",
//     sac_code: apiItem.sac_code || "",
//     candidate: apiItem.candidate || null,
//     candidateSearch: apiItem.candidate_name || "",
//     showDropdown: false,
//     monthly_rate: apiItem.monthly_rate || apiItem.rate || 0,
//     total_days: apiItem.total_days || 0,
//     working_days: apiItem.working_days || 0,
//     hourly_rate: apiItem.hourly_rate || 0,
//     total_hours: apiItem.total_hours || 0,
//     amount: apiItem.amount || 0,
//     gst_rate: apiItem.gst_rate ?? 18,
//     calc_amount: 0,
//     gst_amount: 0,
//     total: 0,
//   };
//   const calc = calculateItem(base);
//   return { ...base, calc_amount: calc.amount, gst_amount: calc.gst, total: calc.total };
// };

// // ─────────────────────────────────────────────
// // EditInvoicePage
// // ─────────────────────────────────────────────
// export default function EditInvoicePage() {
//   const { id } = useParams(); // e.g. /accounts/invoices/:id/edit
//   const navigate = useNavigate();

//   const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
//   const notify = (msg, type = "success") => setToast({ show: true, msg, type });

//   // ── Data loading state ──
//   const [loadingInvoice, setLoadingInvoice] = useState(true);
//   const [submitting, setSubmitting] = useState(false);

//   // ── Clients ──
//   const [clients, setClients] = useState([]);
//   const [clientSearch, setClientSearch] = useState("");
//   const [showClientDropdown, setShowClientDropdown] = useState(false);
//   const [selectedClient, setSelectedClient] = useState(null);
//   const [loadingClients, setLoadingClients] = useState(false);
//   const [isUpdateClientModalOpen, setIsUpdateClientModalOpen] = useState(false);

//   // ── Candidates ──
//   const [candidateList, setCandidateList] = useState([]);
//   const [loadingCandidates, setLoadingCandidates] = useState(false);

//   // ── Banks ──
//   const [banks, setBanks] = useState([]);
//   const [selectedBank, setSelectedBank] = useState("");

//   // ── Invoice fields ──
//   const [invoiceDate, setInvoiceDate] = useState("");
//   const [billingMonth, setBillingMonth] = useState("");
//   const [dueDate, setDueDate] = useState("");
//   const [notes, setNotes] = useState("");
//   const [items, setItems] = useState([]);

//   const hasBillingDetails = (client) => client?.gst_number && client?.billing_address;

//   // ── Fetch all clients (with optional search) ──
//   const fetchClients = useCallback(async (searchVal = "") => {
//     setLoadingClients(true);
//     try {
//       let all = [];
//       const searchParam = searchVal ? `?search=${encodeURIComponent(searchVal)}` : "";
//       let url = `/invoice/api/clients/${searchParam}`;
//       while (url) {
//         const res = await apiRequest(url);
//         if (res?.results) {
//           all = [...all, ...res.results];
//           url = res.next ? "/api" + res.next.split("/api")[1] : null;
//         } else break;
//       }
//       setClients(all);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoadingClients(false);
//     }
//   }, []);

//   // ── Fetch candidates for selected client ──
//   const fetchCandidates = useCallback(async (searchVal = "") => {
//     if (!selectedClient) { setCandidateList([]); return; }
//     setLoadingCandidates(true);
//     try {
//       let all = [];
//       const searchParam = searchVal ? `?search=${encodeURIComponent(searchVal)}` : "";
//       let url = `/invoice/api/clients/${selectedClient.id}/candidates/${searchParam}`;
//       while (url) {
//         const res = await apiRequest(url);
//         if (res?.results) {
//           all = [...all, ...res.results];
//           url = res.next ? "/api" + res.next.split("/api")[1] : null;
//         } else break;
//       }
//       setCandidateList(all);
//     } catch {
//       setCandidateList([]);
//     } finally {
//       setLoadingCandidates(false);
//     }
//   }, [selectedClient]);

//   // ── On mount: fetch invoice data, clients, and banks ──
//   useEffect(() => {
//     const init = async () => {
//       try {
//         // Parallel fetch: clients + banks + invoice
//         const [, banksRes, invoiceRes] = await Promise.all([
//           fetchClients(),
//           apiRequest("/invoice/api/bank-accounts/"),
//           apiRequest(`/invoice/api/update/${id}/`),
//         ]);

//         // Populate banks dropdown
//         const bankList = banksRes?.results || [];
//         setBanks(bankList);

//         // Populate invoice fields
//         if (invoiceRes) {
//           setInvoiceDate(invoiceRes.invoice_date || "");
//           setBillingMonth(invoiceRes.billing_month || "");
//           setDueDate(invoiceRes.due_date || "");
//           setNotes(invoiceRes.notes || "");

//           // Pre-select bank
//           if (invoiceRes.company_bank_account) {
//             setSelectedBank(String(invoiceRes.company_bank_account));
//           }

//           // Pre-select client — find from fetched list, or build minimal object from invoice data
//           if (invoiceRes.client) {
//             // Try to get full client object; fallback to inline data if API returns embedded object
//             const clientObj = typeof invoiceRes.client === "object"
//               ? invoiceRes.client
//               : { id: invoiceRes.client, client_name: invoiceRes.bill_to_name, company_name: invoiceRes.bill_to_company, gst_number: invoiceRes.bill_to_gstin, billing_address: invoiceRes.bill_to_address };
//             setSelectedClient(clientObj);
//             setClientSearch(`${clientObj.client_name} - ${clientObj.company_name}`);
//           }

//           // Pre-populate items
//           if (Array.isArray(invoiceRes.items)) {
//             setItems(invoiceRes.items.map(mapApiItemToLocal));
//           }
//         }
//       } catch (err) {
//         notify("Failed to load invoice data.", "error");
//         console.error(err);
//       } finally {
//         setLoadingInvoice(false);
//       }
//     };

//     init();
//   }, [id, fetchClients]);

//   // Re-fetch candidates when client changes
//   useEffect(() => {
//     if (selectedClient) fetchCandidates();
//   }, [selectedClient, fetchCandidates]);

//   // ── Client updated callback ──
//   const handleClientUpdated = (updatedClient) => {
//     setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
//     setSelectedClient(updatedClient);
//   };

//   // ── Item management ──
//   const addItem = () => {
//     setItems(prev => [...prev, {
//       billing_type: "MANUAL", title: "", description: "", sac_code: "",
//       candidate: null, candidateSearch: "", showDropdown: false,
//       monthly_rate: 0, total_days: 0, working_days: 0,
//       hourly_rate: 0, total_hours: 0, amount: 0,
//       gst_rate: 18, calc_amount: 0, gst_amount: 0, total: 0,
//     }]);
//   };

//   const removeItem = (index) => setItems(prev => prev.filter((_, i) => i !== index));

//   const updateItem = (i, key, value) => {
//     setItems(prev => {
//       const next = [...prev];
//       next[i] = { ...next[i], [key]: value };
//       const calc = calculateItem(next[i]);
//       next[i].calc_amount = calc.amount;
//       next[i].gst_amount = calc.gst;
//       next[i].total = calc.total;
//       return next;
//     });
//   };

//   const selectCandidate = (i, candidate) => {
//     setItems(prev => {
//       const next = [...prev];
//       next[i] = {
//         ...next[i],
//         candidate: candidate.id,
//         candidateSearch: candidate.candidate_name,
//         showDropdown: false,
//         title: candidate.candidate_name,
//         description: candidate.technology,
//         monthly_rate: candidate.client_rate || 0,
//       };
//       const calc = calculateItem(next[i]);
//       next[i].calc_amount = calc.amount;
//       next[i].gst_amount = calc.gst;
//       next[i].total = calc.total;
//       return next;
//     });
//   };

//   // ── Validation (same rules as Create) ──
//   const validateInvoice = () => {
//     if (!selectedClient) return "Select Client is required";
//     if (!selectedBank) return "Bank Account is required";
//     if (!dueDate) return "Due Date is required";
//     if (items.length === 0) return "At least one item is required";
//     return null;
//   };

//   // ── Submit → PUT /invoice/api/update/:id/ ──
//   const handleSubmit = async () => {
//     const errorMsg = validateInvoice();
//     if (errorMsg) { notify(errorMsg, "error"); return; }

//     setSubmitting(true);
//     try {
//       const payload = {
//         invoice_type: "CANDIDATE",
//         client: selectedClient.id,
//         company_bank_account: selectedBank,
//         invoice_date: invoiceDate,
//         billing_month: billingMonth,
//         due_date: dueDate,
//         notes,
//         // Billing-to fields mirror selected client (API expects these)
//         bill_to_name: selectedClient.client_name,
//         bill_to_company: selectedClient.company_name,
//         bill_to_address: selectedClient.billing_address,
//         bill_to_gstin: selectedClient.gst_number,
//         bill_to_email: selectedClient.email,
//         bill_to_phone: selectedClient.phone_number,
//         items: items.map(item => ({
//           candidate: item.candidate,
//           title: item.title,
//           description: item.description,
//           sac_code: item.sac_code,
//           billing_type: item.billing_type,
//           monthly_rate: item.monthly_rate,
//           total_days: item.total_days,
//           working_days: item.working_days,
//           hourly_rate: item.hourly_rate,
//           total_hours: item.total_hours,
//           // Map to API's rate/quantity/amount shape
//           rate: item.billing_type === "MANUAL" ? item.amount : item.billing_type === "HOURLY" ? item.hourly_rate : item.monthly_rate,
//           quantity: item.billing_type === "HOURLY" ? item.total_hours : item.billing_type === "BILLABLE_DAYS" ? item.working_days : 1,
//           amount: item.calc_amount || item.amount,
//           gst_rate: item.gst_rate,
//         })),
//       };

//       await apiRequest(`/invoice/api/update/${id}/`, "PUT", payload);
//       notify("Invoice updated successfully!");
//       // Brief delay so user sees the toast, then navigate back to list
//       setTimeout(() => navigate(-1), 1500);
//     } catch (err) {
//       notify("Invoice update failed. Please try again.", "error");
//       console.error(err);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // ─────────────────────────────────────────────
//   // Render
//   // ─────────────────────────────────────────────
//   if (loadingInvoice) {
//     return (
//       <AccountsBaseLayout>
//         <div style={styles.loadingWrapper}>
//           <div style={styles.loadingSpinner} />
//           <p style={styles.loadingText}>Loading invoice…</p>
//         </div>
//       </AccountsBaseLayout>
//     );
//   }

//   return (
//     <AccountsBaseLayout>
//       {toast.show && (
//         <Toaster
//           msg={toast.msg}
//           type={toast.type}
//           onClose={() => setToast(t => ({ ...t, show: false }))}
//         />
//       )}

//       {/* ── Top Nav ── */}
//       <div style={styles.topNav}>
//         <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
//           <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//           <h2 style={styles.pageTitle}>
//             Edit Invoice
//             <span style={styles.invoiceIdBadge}>#{id}</span>
//           </h2>
//         </div>
//         <button
//           style={styles.settingsBtn}
//           onClick={() => navigate("/accounts/finance-overview")}
//           title="Settings"
//         >
//           <Icons.Settings />
//         </button>
//       </div>

//       <div style={styles.card}>

//         {/* ── Client Selector ── */}
//         <div style={styles.section}>
//           <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
//             <div style={{ flex: 1, position: "relative" }}>
//               <label style={styles.label}>Select Client</label>
//               <input
//                 style={styles.inputSearch}
//                 placeholder="Search Client..."
//                 value={clientSearch}
//                 onChange={e => {
//                   setClientSearch(e.target.value);
//                   fetchClients(e.target.value);
//                   setShowClientDropdown(true);
//                 }}
//                 onFocus={() => setShowClientDropdown(true)}
//               />
//               {showClientDropdown && (
//                 <div style={styles.dropdownList}>
//                   {loadingClients
//                     ? <div style={styles.dropdownItem}>Loading…</div>
//                     : clients.map(c => (
//                       <div
//                         key={c.id}
//                         style={styles.dropdownItem}
//                         onClick={() => {
//                           setSelectedClient(c);
//                           setClientSearch(`${c.client_name} - ${c.company_name}`);
//                           setShowClientDropdown(false);
//                         }}
//                       >
//                         {c.client_name} — {c.company_name}
//                       </div>
//                     ))
//                   }
//                 </div>
//               )}
//             </div>
//           </div>

//           {selectedClient && (
//             <div style={styles.warningBox}>
//               <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
//                 <span style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>
//                   Selected: {selectedClient.company_name}
//                 </span>
//                 {!hasBillingDetails(selectedClient) && (
//                   <span style={{ fontSize: "12px", color: "#B45309", fontWeight: "600" }}>
//                     ⚠️ GST or Billing Address missing.
//                   </span>
//                 )}
//               </div>
//               <button onClick={() => setIsUpdateClientModalOpen(true)} style={styles.updateBtn}>
//                 Edit Client Info
//               </button>
//             </div>
//           )}
//         </div>

//         {/* ── Bank Account ── */}
//         <div style={styles.section}>
//           <label style={styles.label}>Bank Account</label>
//           <select
//             style={styles.input}
//             value={selectedBank}
//             onChange={e => setSelectedBank(e.target.value)}
//             disabled={selectedClient && !hasBillingDetails(selectedClient)}
//           >
//             <option value="">Select Bank</option>
//             {banks.map(b => (
//               <option key={b.id} value={b.id}>{b.bank_name}</option>
//             ))}
//           </select>
//         </div>

//         {/* ── Dates ── */}
//         <div style={styles.grid3}>
//           <div>
//             <label style={styles.label}>Invoice Date</label>
//             <input type="date" style={styles.input} value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
//           </div>
//           <div>
//             <label style={styles.label}>Billing Month</label>
//             <input type="date" style={styles.input} value={billingMonth} onChange={e => setBillingMonth(e.target.value)} />
//           </div>
//           <div>
//             <label style={styles.label}>Due Date</label>
//             <input type="date" style={styles.input} value={dueDate} onChange={e => setDueDate(e.target.value)} />
//           </div>
//         </div>

//         {/* ── Notes ── */}
//         <div style={styles.section}>
//           <label style={styles.label}>Notes</label>
//           <textarea
//             style={{ ...styles.textarea }}
//             placeholder="Any notes for this invoice…"
//             value={notes}
//             onChange={e => setNotes(e.target.value)}
//           />
//         </div>

//         {/* ── Invoice Items ── */}
//         <div style={{ marginTop: "30px" }}>
//           <h3 style={{ fontSize: "18px", color: "#1E293B", marginBottom: "15px" }}>Invoice Items</h3>

//           {items.map((item, i) => (
//             <div key={i} style={styles.itemCard}>
//               <div style={styles.itemHeader}>
//                 <span style={styles.itemCount}>Item #{i + 1}</span>
//                 <button onClick={() => removeItem(i)} style={styles.removeBtn}>✕ Remove</button>
//               </div>

//               {/* Billing type + candidate */}
//               <div style={styles.grid2}>
//                 <div style={styles.inputGroup}>
//                   <label style={styles.label}>Billing Type</label>
//                   <select
//                     style={styles.input}
//                     value={item.billing_type}
//                     onChange={e => updateItem(i, "billing_type", e.target.value)}
//                   >
//                     <option value="BILLABLE_DAYS">Billable Days</option>
//                     <option value="HOURLY">Hourly</option>
//                     <option value="MANUAL">Manual</option>
//                   </select>
//                 </div>

//                 {item.billing_type !== "MANUAL" && (
//                   <div style={{ ...styles.inputGroup, position: "relative" }}>
//                     <label style={styles.label}>Candidate</label>
//                     <input
//                       style={styles.inputSearch}
//                       placeholder="Search Candidate..."
//                       value={item.candidateSearch}
//                       disabled={!selectedClient}
//                       onChange={e => {
//                         updateItem(i, "candidateSearch", e.target.value);
//                         updateItem(i, "showDropdown", true);
//                         fetchCandidates(e.target.value);
//                       }}
//                       onFocus={() => updateItem(i, "showDropdown", true)}
//                     />
//                     {item.showDropdown && (
//                       <div style={styles.dropdownList}>
//                         {loadingCandidates
//                           ? <div style={styles.dropdownItem}>Loading…</div>
//                           : candidateList.map(c => (
//                             <div
//                               key={c.id}
//                               style={styles.dropdownItem}
//                               onClick={() => selectCandidate(i, c)}
//                             >
//                               {c.candidate_name}
//                             </div>
//                           ))
//                         }
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>

//               {/* Title / Description / SAC */}
//               <div style={styles.grid3}>
//                 <div>
//                   <label style={styles.label}>Title</label>
//                   <input style={styles.input} value={item.title} onChange={e => updateItem(i, "title", e.target.value)} />
//                 </div>
//                 <div>
//                   <label style={styles.label}>Description</label>
//                   <input style={styles.input} value={item.description} onChange={e => updateItem(i, "description", e.target.value)} />
//                 </div>
//                 <div>
//                   <label style={styles.label}>SAC Code</label>
//                   <input style={styles.input} value={item.sac_code} onChange={e => updateItem(i, "sac_code", e.target.value)} />
//                 </div>
//               </div>

//               {/* Billing-type-specific inputs */}
//               <div style={styles.gridCalculations}>
//                 {item.billing_type === "BILLABLE_DAYS" && (<>
//                   <div style={{ position: "relative" }}>
//                     <label style={styles.label}>Monthly Rate</label>
//                     <input style={styles.input} type="number" value={item.monthly_rate} onChange={e => updateItem(i, "monthly_rate", Number(e.target.value))} />
//                     {item.monthly_rate > 0 && <small style={styles.wordText}>{numberToWordsIndian(item.monthly_rate)}</small>}
//                   </div>
//                   <div>
//                     <label style={styles.label}>Total Days</label>
//                     <input style={styles.input} type="number" value={item.total_days} onChange={e => updateItem(i, "total_days", Number(e.target.value))} />
//                   </div>
//                   <div>
//                     <label style={styles.label}>Working Days</label>
//                     <input style={styles.input} type="number" value={item.working_days} onChange={e => updateItem(i, "working_days", Number(e.target.value))} />
//                   </div>
//                 </>)}

//                 {item.billing_type === "HOURLY" && (<>
//                   <div style={{ position: "relative" }}>
//                     <label style={styles.label}>Hourly Rate</label>
//                     <input style={styles.input} type="number" value={item.hourly_rate} onChange={e => updateItem(i, "hourly_rate", Number(e.target.value))} />
//                     {item.hourly_rate > 0 && <small style={styles.wordText}>{numberToWordsIndian(item.hourly_rate)}</small>}
//                   </div>
//                   <div>
//                     <label style={styles.label}>Total Hours</label>
//                     <input style={styles.input} type="number" value={item.total_hours} onChange={e => updateItem(i, "total_hours", Number(e.target.value))} />
//                   </div>
//                 </>)}

//                 {item.billing_type === "MANUAL" && (
//                   <div style={{ position: "relative" }}>
//                     <label style={styles.label}>Amount</label>
//                     <input style={styles.input} type="number" value={item.amount} onChange={e => updateItem(i, "amount", Number(e.target.value))} />
//                     {item.amount > 0 && <small style={styles.wordText}>{numberToWordsIndian(item.amount)}</small>}
//                   </div>
//                 )}
//               </div>

//               {/* Summary row */}
//               <div style={styles.summaryRow}>
//                 <div>
//                   <label style={styles.label}>GST %</label>
//                   <input
//                     style={{ ...styles.input, width: "60px" }}
//                     type="number"
//                     value={item.gst_rate}
//                     onChange={e => updateItem(i, "gst_rate", Number(e.target.value))}
//                   />
//                 </div>
//                 <div><small style={styles.label}>Amount</small><div style={styles.readonlyValue}>₹{item.calc_amount}</div></div>
//                 <div><small style={styles.label}>GST</small><div style={styles.readonlyValue}>₹{item.gst_amount}</div></div>
//                 <div><small style={styles.label}>Total</small><div style={styles.totalValue}>₹{item.total}</div></div>
//               </div>
//             </div>
//           ))}

//           <button onClick={addItem} style={styles.addItemBtn}>+ Add Item</button>
//         </div>

//         {/* ── Submit ── */}
//         <div style={{ marginTop: "40px", textAlign: "right" }}>
//           <button
//             onClick={handleSubmit}
//             disabled={submitting || (selectedClient && !hasBillingDetails(selectedClient))}
//             style={{
//               ...styles.submitBtnLarge,
//               opacity: submitting ? 0.7 : 1,
//               cursor: submitting ? "not-allowed" : "pointer",
//             }}
//           >
//             {submitting ? "Updating…" : "Update Invoice"}
//           </button>
//         </div>
//       </div>

//       {/* ── Modals ── */}
//       <UpdateClientModal
//         isOpen={isUpdateClientModalOpen}
//         onClose={() => setIsUpdateClientModalOpen(false)}
//         client={selectedClient}
//         onClientUpdated={handleClientUpdated}
//         notify={notify}
//       />
//     </AccountsBaseLayout>
//   );
// }

// // ─────────────────────────────────────────────
// // Styles — identical to CreateInvoice + additions
// // ─────────────────────────────────────────────
// const styles = {
//   toaster: { position: "fixed", top: "20px", right: "20px", color: "#fff", padding: "12px 24px", borderRadius: "8px", zIndex: 10001, fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
//   topNav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
//   backBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
//   settingsBtn: { background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", padding: "10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
//   pageTitle: { fontSize: "22px", fontWeight: "800", color: "#1E293B", margin: 0, display: "flex", alignItems: "center", gap: "10px" },
//   invoiceIdBadge: { fontSize: "13px", fontWeight: "700", color: "#FF9B51", background: "#FFF7ED", border: "1px solid #FDDCB5", borderRadius: "6px", padding: "2px 8px" },
//   card: { background: "#fff", borderRadius: "12px", padding: "25px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
//   section: { marginBottom: "20px" },
//   label: { display: "block", fontSize: "12px", fontWeight: "700", color: "#64748B", marginBottom: "6px", textTransform: "uppercase" },
//   input: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", width: "100%", outline: "none", boxSizing: "border-box", fontSize: "14px" },
//   inputSearch: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", width: "100%", outline: "none", boxSizing: "border-box", background: "#fff", fontSize: "14px" },
//   dropdownList: { position: "absolute", top: "100%", left: 0, width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", zIndex: 100, maxHeight: "200px", overflowY: "auto", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" },
//   dropdownItem: { padding: "10px 14px", fontSize: "13px", cursor: "pointer", borderBottom: "1px solid #F1F5F9" },
//   textarea: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", width: "100%", minHeight: "80px", fontSize: "14px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" },
//   warningBox: { marginTop: "10px", padding: "12px", background: "#FFFBEB", border: "1px solid #FEF3C7", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" },
//   updateBtn: { background: "#F59E0B", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" },
//   grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" },
//   grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" },
//   gridCalculations: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "15px", marginBottom: "15px" },
//   itemCard: { padding: "15px", border: "1px solid #F1F5F9", borderRadius: "10px", background: "#F8FAFC", marginBottom: "15px" },
//   itemHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
//   itemCount: { fontSize: "14px", fontWeight: "800", color: "#1E293B" },
//   removeBtn: { background: "#EF4444", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "600" },
//   summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px", gap: "15px" },
//   readonlyValue: { padding: "8px", background: "#E2E8F0", borderRadius: "6px", fontSize: "13px", minWidth: "80px", textAlign: "center", fontWeight: "600" },
//   totalValue: { padding: "8px", background: "#DBEAFE", borderRadius: "6px", fontSize: "14px", fontWeight: "800", color: "#1E40AF", minWidth: "80px", textAlign: "center" },
//   addItemBtn: { background: "#3B82F6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
//   submitBtnLarge: { background: "#FF9B51", color: "#fff", border: "none", padding: "14px 40px", borderRadius: "10px", fontSize: "16px", fontWeight: "800" },
//   inputGroup: { display: "flex", flexDirection: "column", gap: "2px" },
//   wordText: { display: "block", fontSize: "13px", color: "#6366F1", fontWeight: "600", marginTop: "4px", fontStyle: "italic", lineHeight: "1.2" },
//   modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
//   modernModalContent: { background: "#fff", borderRadius: "16px", width: "600px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden" },
//   modalHeader: { display: "flex", justifyContent: "space-between", padding: "20px 25px", borderBottom: "1px solid #F1F5F9", alignItems: "center", flexShrink: 0 },
//   modalTitle: { margin: 0, fontSize: "20px", fontWeight: "800", color: "#1E293B" },
//   closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748B" },
//   modalFormWrapper: { display: "flex", flexDirection: "column", overflowY: "auto", flex: 1 },
//   modalBody: { padding: "25px", flex: 1 },
//   modalFooter: { display: "flex", justifyContent: "flex-end", gap: "12px", padding: "20px 25px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC", flexShrink: 0 },
//   formGridModern: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "25px" },
//   cancelBtn: { padding: "10px 20px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", cursor: "pointer", fontWeight: "600", color: "#64748B" },
//   saveBtn: { padding: "10px 20px", background: "#3B82F6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" },
//   // Loading screen
//   loadingWrapper: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "16px" },
//   loadingSpinner: { width: "40px", height: "40px", border: "4px solid #E2E8F0", borderTop: "4px solid #FF9B51", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
//   loadingText: { color: "#64748B", fontWeight: "600", fontSize: "14px" },
// };
