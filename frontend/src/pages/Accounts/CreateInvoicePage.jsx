import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import AccountsBaseLayout from "../components/AccountsBaseLayout";

// Toaster Component
const Toaster = ({ msg, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      ...styles.toaster,
      backgroundColor: type === 'error' ? '#EF4444' : '#10B981'
    }}>
      {msg}
    </div>
  );
};


const numberToWordsIndian = (num) => {
  if (num === 0) return "";
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const format = (n, suffix) => {
    if (n === 0) return "";
    let str = "";
    if (n > 19) {
      str = b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    } else {
      str = a[n];
    }
    return str + " " + suffix + " ";
  };

  let res = "";
  res += format(Math.floor(num / 10000000), "Crore");
  res += format(Math.floor((num / 100000) % 100), "Lakh");
  res += format(Math.floor((num / 1000) % 100), "Thousand");
  res += format(Math.floor((num / 100) % 10), "Hundred");
  
  const lastTwo = num % 100;
  if (num > 100 && lastTwo > 0) res += "and ";
  res += format(lastTwo, "");

  return res.trim() + " Only";
};

const Icons = {
  Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>

}

// Add Client Modal Component
const AddClientModal = ({ isOpen, onClose, onClientAdded, notify }) => {
  const [formData, setFormData] = useState({
    client_name: "", company_name: "", phone_number: "", email: "",
    gst_number: "", billing_address: "", account_holder_name: "",
    bank_name: "", account_number: "", ifsc_code: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let newErrors = {};
    if (!formData.client_name.trim()) newErrors.client_name = "Client Name is required";
    if (!formData.company_name.trim()) newErrors.company_name = "Company Name is required";
    if (!formData.phone_number.trim()) newErrors.phone_number = "Phone Number is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.gst_number.trim()) newErrors.gst_number = "GST Number is required";
    if (!formData.billing_address.trim()) newErrors.billing_address = "Address is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      notify("Please fix the errors", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await apiRequest("/invoice/api/clients/", "POST", formData);
      if (response) {
        onClientAdded(response);
        notify("Client added successfully!");
        onClose();
        setFormData({
          client_name: "", company_name: "", phone_number: "", email: "",
          gst_number: "", billing_address: "",
        });
        setErrors({});
      }
    } catch (error) {
      notify("Client creation failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modernModalContent}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Add New Client</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.modalFormWrapper}>
          <div style={styles.modalBody}>
            <div style={styles.formSectionTitle}>Basic Information</div>
            <div style={styles.formGridModern}>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Client Name *</label>
                <input style={{...styles.input, borderColor: errors.client_name ? '#EF4444' : '#E2E8F0'}} type="text" value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} />
                {errors.client_name && <span style={styles.errorText}>{errors.client_name}</span>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Company Name *</label>
                <input 
                  style={{
                    ...styles.input, 
                    borderColor: errors.company_name ? '#EF4444' : '#E2E8F0' 
                  }} 
                  type="text" 
                  value={formData.company_name} 
                  onChange={e => setFormData({ ...formData, company_name: e.target.value })} 
                />
                {errors.company_name && <span style={styles.errorText}>{errors.company_name}</span>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number *</label>
                <input style={{...styles.input, borderColor: errors.phone_number ? '#EF4444' : '#E2E8F0'}} type="tel" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
                {errors.phone_number && <span style={styles.errorText}>{errors.phone_number}</span>}
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email *</label>
                <input style={{...styles.input, borderColor: errors.email ? '#EF4444' : '#E2E8F0'}} type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                {errors.email && <span style={styles.errorText}>{errors.email}</span>}
              </div>
              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>GST Number *</label>
                <input 
                  style={{
                    ...styles.input, 
                    borderColor: errors.gst_number ? '#EF4444' : '#E2E8F0' // Yahan spread (...) zaroori hai
                  }} 
                  type="text" 
                  value={formData.gst_number} 
                  onChange={e => setFormData({ ...formData, gst_number: e.target.value })} 
                />
                {errors.gst_number && <span style={styles.errorText}>{errors.gst_number}</span>}
              </div>

              <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Billing Address *</label>
                <textarea style={{...styles.textarea, borderColor: errors.billing_address ? '#EF4444' : '#E2E8F0'}} value={formData.billing_address} onChange={e => setFormData({ ...formData, billing_address: e.target.value })} />
                {errors.billing_address && <span style={styles.errorText}>{errors.billing_address}</span>}
              </div>
            </div>
            
            
          </div>
          <div style={styles.modalFooter}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>{loading ? "Creating..." : "Create Client"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Update Client Modal Component
const UpdateClientModal = ({ isOpen, onClose, client, onClientUpdated, notify }) => {
  const [formData, setFormData] = useState({
    client_name: "", company_name: "", phone_number: "", email: "", gst_number: "", billing_address: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        client_name: client.client_name || "", company_name: client.company_name || "",
        phone_number: client.phone_number || "",email: client.email || "", gst_number: client.gst_number || "",
        billing_address: client.billing_address || ""
      });
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiRequest(`/invoice/api/clients/${client.id}/`, "PATCH", formData);
      if (response) {
        onClientUpdated(response);
        notify("Client updated successfully!");
        onClose();
      }
    } catch (error) {
      notify("Update failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modernModalContent}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Update Bank Details</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.modalFormWrapper}>
          <div style={styles.modalBody}>
            <div style={styles.formGridModern}>
              <div style={styles.inputGroup}><label style={styles.label}>Client Name</label><input style={styles.input} type="text" value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} /></div>
              <div style={styles.inputGroup}><label style={styles.label}>Company Name</label><input style={styles.input} type="text" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} /></div>
              <div style={styles.inputGroup}><label style={styles.label}>Phone Number</label><input style={styles.input} type="text" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} /></div>
              <div style={styles.inputGroup}><label style={styles.label}>Email</label><input style={styles.input} type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
              <div style={styles.inputGroup}><label style={styles.label}>GST Number</label><input style={styles.input} type="text" value={formData.gst_number} onChange={e => setFormData({ ...formData, gst_number: e.target.value })} /></div>
              <div style={styles.inputGroup}><label style={styles.label}>Billing Address</label><input style={styles.input} type="text" value={formData.billing_address} onChange={e => setFormData({ ...formData, billing_address: e.target.value })} /></div>
            </div>
          </div>
          <div style={styles.modalFooter}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={styles.saveBtn}>{loading ? "Updating..." : "Update Details"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [candidateList, setCandidateList] = useState([]);
  const [, setLoadingCandidates] = useState(false);
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
 const [, setLoadingBanks] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isUpdateClientModalOpen, setIsUpdateClientModalOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [billingMonth, setBillingMonth] = useState(currentMonth);
  const [dueDate, setDueDate] = useState("");
  const [invoiceGstRate, setInvoiceGstRate] = useState(18);
  const [items, setItems] = useState([]);

  const notify = (msg, type = "success") => setToast({ show: true, msg, type });

  const BasBillingDetails = (client) => client?.gst_number && client?.billing_address;

  const fetchClients = useCallback(async (searchVal = "") => {
    setLoadingClients(true);
    try {
      let all = [];
      const qs = searchVal ? `?search=${encodeURIComponent(searchVal)}` : '';
      let url = `/invoice/api/clients/${qs}`;
      while (url) {
        const res = await apiRequest(url);
        if (res?.results && Array.isArray(res.results)) {
          all = [...all, ...res.results];
          url = res.next ? (res.next.includes('/invoice/') ? res.next.replace(/^.*\/invoice/, '/invoice') : null) : null;
        } else if (Array.isArray(res)) {
          all = res;
          break;
        } else break;
      }
      setClients(all);
    } catch (error) { console.error(error); } finally { setLoadingClients(false); }
  }, []);

  const fetchCandidates = useCallback(async (searchVal = "") => {
    if (!selectedClient) { setCandidateList([]); return; }
    setLoadingCandidates(true);
    try {
      let all = [];
      const searchParam = searchVal ? `?search=${encodeURIComponent(searchVal)}` : '';
      let url = `/invoice/api/clients/${selectedClient.id}/candidates/${searchParam}`;
      const res = await apiRequest(url);
      if (res?.results && Array.isArray(res.results)) {
        all = res.results;
      } else if (Array.isArray(res)) {
        all = res;
      }
      setCandidateList(all);
    } catch (error) { setCandidateList([]); } finally { setLoadingCandidates(false); }
  }, [selectedClient]);

  useEffect(() => {
    fetchClients();
    const fetchBanks = async () => {
      setLoadingBanks(true);
      try {
        const res = await apiRequest(`/invoice/api/bank-accounts/`);
        setBanks(res?.results || []);
      } catch (error) { console.error(error); } finally { setLoadingBanks(false); }
    };
    fetchBanks();
  }, [fetchClients]);

  useEffect(() => { if (selectedClient) fetchCandidates(); }, [selectedClient, fetchCandidates]);

  // Update all items' GST rate when invoice GST rate changes
  useEffect(() => {
    if (items.length > 0) {
      setItems(items.map(item => ({ ...item, gst_rate: invoiceGstRate })));
    }
  }, [invoiceGstRate]);

  const handleClientAdded = (newClient) => {
    setClients(prev => [...prev, newClient]);
    setSelectedClient(newClient);
    setClientSearch(newClient.client_name);
    setShowClientDropdown(false);
  };

  const handleClientUpdated = (updatedClient) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    setSelectedClient(updatedClient);
  };

  const addItem = () => {
    setItems([...items, {
      billing_type: "MANUAL", title: "", description: "", sac_code: "",
      candidate: null, candidateSearch: "", showDropdown: false, monthly_rate: 0, total_days: 0, working_days: 0,
      hourly_rate: 0, total_hours: 0, amount: 0, gst_rate: invoiceGstRate, calc_amount: 0, gst_amount: 0, total: 0
    }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculate = (item) => {
    let amount = 0;
    if (item.billing_type === "BILLABLE_DAYS") amount = (item.monthly_rate / (item.total_days || 1)) * (item.working_days || 0);
    else if (item.billing_type === "HOURLY") amount = item.hourly_rate * item.total_hours;
    else amount = item.amount || 0;
    const gst = (amount * item.gst_rate) / 100;
    return { amount: Math.round(amount * 100) / 100, gst: Math.round(gst * 100) / 100, total: Math.round((amount + gst) * 100) / 100 };
  };

  const updateItem = (i, key, value) => {
    const newItems = [...items];
    newItems[i][key] = value;
    const calc = calculate(newItems[i]);
    newItems[i].calc_amount = calc.amount;
    newItems[i].gst_amount = calc.gst;
    newItems[i].total = calc.total;
    setItems(newItems);
  };

  const selectCandidate = (i, candidate) => {
    const newItems = [...items];
    newItems[i].candidate = candidate.id;
    newItems[i].candidateSearch = candidate.candidate_name;
    newItems[i].showDropdown = false;
    newItems[i].title = candidate.candidate_name;
    newItems[i].description = candidate.technology;
    newItems[i].monthly_rate = candidate.client_rate || 0;
    const calc = calculate(newItems[i]);
    newItems[i].calc_amount = calc.amount;
    newItems[i].gst_amount = calc.gst;
    newItems[i].total = calc.total;
    setItems(newItems);
  };

  const validateInvoice = () => {
    if (!selectedClient) return "Select Client is required";
    if (!selectedBank) return "Bank Account is required";
    if (!dueDate) return "Due Date is required";
    if (items.length === 0) return "At least one item is required";
    return null;
  };

  const handleSubmit = async () => {
    const errorMsg = validateInvoice();
    if (errorMsg) {
      notify(errorMsg, "error");
      return;
    }
    try {
      const payload = {
        client: selectedClient.id, company_bank_account: selectedBank, invoice_type: "CANDIDATE",
        invoice_date: invoiceDate, billing_month: billingMonth, due_date: dueDate,
        gst_rate: invoiceGstRate,
        items: items.map(i => ({
          candidate: i.candidate, title: i.title, description: i.description, sac_code: i.sac_code,
          billing_type: i.billing_type, monthly_rate: i.monthly_rate, total_days: i.total_days,
          working_days: i.working_days, hourly_rate: i.hourly_rate, total_hours: i.total_hours, amount: i.amount
        }))
      };
      await apiRequest("/invoice/api/create/", "POST", payload);
      notify("Invoice Created successfully!");
    } catch (error) { 
      notify("Invoice creation failed", "error"); 
    }
  };

  return (
    <AccountsBaseLayout>
      {toast.show && <Toaster msg={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
      <div style={styles.topNav}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
          <h2 style={styles.pageTitle}>Create Invoice</h2>
        </div>
        <button style={styles.settingsBtn} onClick={() => navigate("/accounts/finance-overview")} title="Settings">
                        <Icons.Settings />
        </button>

      </div>

      <div style={styles.card}>
        <div style={styles.section}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <label style={styles.label}>Select Client</label>
                <input style={styles.inputSearch} placeholder="Search Client..." value={clientSearch} onChange={e => { setClientSearch(e.target.value); fetchClients(e.target.value); setShowClientDropdown(true); }} onFocus={() => setShowClientDropdown(true)} />
                {showClientDropdown && (
                  <div style={styles.dropdownList}>
                    {loadingClients ? <div style={styles.dropdownItem}>Loading...</div> : clients.map(c => <div key={c.id} style={styles.dropdownItem} onClick={() => { setSelectedClient(c); setClientSearch(c.client_name + ' - ' + c.company_name); setShowClientDropdown(false); }}>{c.client_name}- {c.company_name}</div>)}
                  </div>
                )}


            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={() => setIsAddClientModalOpen(true)} style={styles.addBtn}>+ Add Client</button>
            </div>
          </div>
          {/* {selectedClient && !BasBillingDetails(selectedClient) && (
            <div style={styles.warningBox}>
              <span style={{ fontSize: '12px', color: '#B45309' }}>⚠️ details missing.</span>
              <button onClick={() => setIsUpdateClientModalOpen(true)} style={styles.updateBtn}>Update</button>
            </div>
          )} */}

          {selectedClient && (
              <div style={styles.warningBox}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                    Selected: {selectedClient.company_name}
                  </span>
                  {/* Message sirf tab dikhega jab details missing honge */}
                  {!BasBillingDetails(selectedClient) && (
                    <span style={{ fontSize: '12px', color: '#B45309', fontWeight: '600' }}>
                      ⚠️ GST or Billing Address missing.
                    </span>
                  )}
                </div>
                {/* Button hamesha dikhega */}
                <button onClick={() => setIsUpdateClientModalOpen(true)} style={styles.updateBtn}>
                  Edit Client Info
                </button>
              </div>
            )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Bank Account</label>
          <select style={styles.input} onChange={e => setSelectedBank(e.target.value)} value={selectedBank} disabled={selectedClient && !BasBillingDetails(selectedClient)}>
            <option value="">Select Bank</option>
            {banks.map(b => <option key={b.id} value={b.id}>{b.bank_name}</option>)}
          </select>
        </div>

        <div style={styles.grid3}>
          <div><label style={styles.label}>Invoice Date</label><input type="date" style={styles.input} value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>
          <div><label style={styles.label}>Billing Month</label><input type="date" style={styles.input} value={billingMonth} onChange={e => setBillingMonth(e.target.value)} /></div>
          <div><label style={styles.label}>Due Date</label><input type="date" style={styles.input} value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
        </div>

        <div style={styles.grid3}>
          <div><label style={styles.label}>Invoice GST Rate (%)</label><input type="number" step="0.01" style={styles.input} value={invoiceGstRate} onChange={e => setInvoiceGstRate(Number(e.target.value) || 0)} /></div>
        </div>

        <div style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '18px', color: '#1E293B', marginBottom: '15px' }}>Invoice Items</h3>
          {items.map((item, i) => (
            <div key={i} style={styles.itemCard}>
              <div style={styles.itemHeader}>
                <span style={styles.itemCount}>Item #{i+1}</span>
                <button onClick={() => removeItem(i)} style={styles.removeBtn}>✕ Remove</button>
              </div>
              <div style={styles.grid2}>
                <div style={styles.inputGroup}><label style={styles.label}>Billing Type</label>
                  <select style={styles.input} value={item.billing_type} onChange={e => updateItem(i, "billing_type", e.target.value)}>
                    <option value="BILLABLE_DAYS">Billable Days</option><option value="HOURLY">Hourly</option><option value="MANUAL">Manual</option>
                  </select>
                </div>
                
                {item.billing_type !== "MANUAL" && (
                  <div style={{ ...styles.inputGroup, position: 'relative' }}><label style={styles.label}>Candidate</label>
                    <input style={styles.inputSearch} placeholder="Search Candidate..." value={item.candidateSearch} disabled={!selectedClient} onChange={e => { updateItem(i, "candidateSearch", e.target.value); updateItem(i, "showDropdown", true); fetchCandidates(e.target.value); }} onFocus={() => updateItem(i, "showDropdown", true)} />
                    {item.showDropdown && (
                      <div style={styles.dropdownList}>{candidateList.map(c => <div key={c.id} style={styles.dropdownItem} onClick={() => selectCandidate(i, c)}>{c.candidate_name}</div>)}</div>
                    )}
                  </div>
                )}
              </div>
              <div style={styles.grid3}>
                <div><label style={styles.label}>Title</label><input style={styles.input} value={item.title} onChange={e => updateItem(i, "title", e.target.value)} /></div>
                <div><label style={styles.label}>Description</label><input style={styles.input} value={item.description} onChange={e => updateItem(i, "description", e.target.value)} /></div>
                <div><label style={styles.label}>SAC Code</label><input style={styles.input} value={item.sac_code} onChange={e => updateItem(i, "sac_code", e.target.value)} /></div>
              </div>
              
              {/* <div style={styles.gridCalculations}>
                
                {item.billing_type === "BILLABLE_DAYS" && (<>
                  <div><label style={styles.label}>Monthly Rate</label><input style={styles.input} type="number" value={item.monthly_rate} onChange={e => updateItem(i, "monthly_rate", Number(e.target.value))} /></div>
                  <div><label style={styles.label}>Total Days</label><input style={styles.input} type="number" value={item.total_days} onChange={e => updateItem(i, "total_days", Number(e.target.value))} /></div>
                  <div><label style={styles.label}>Working Days</label><input style={styles.input} type="number" value={item.working_days} onChange={e => updateItem(i, "working_days", Number(e.target.value))} /></div>
                </>)}
                {item.billing_type === "HOURLY" && (<>
                  <div><label style={styles.label}>Hourly Rate</label><input style={styles.input} type="number" value={item.hourly_rate} onChange={e => updateItem(i, "hourly_rate", Number(e.target.value))} /></div>
                  <div><label style={styles.label}>Total Hours</label><input style={styles.input} type="number" value={item.total_hours} onChange={e => updateItem(i, "total_hours", Number(e.target.value))} /></div>
                </>)}
                {item.billing_type === "MANUAL" && <div><label style={styles.label}>Amount</label><input style={styles.input} type="number" value={item.amount} onChange={e => updateItem(i, "amount", Number(e.target.value))} /></div>}
              </div> */}

              <div style={styles.gridCalculations}>
                {item.billing_type === "BILLABLE_DAYS" && (
                  <>
                    <div style={{ position: 'relative' }}>
                      <label style={styles.label}>Monthly Rate</label>
                      <input style={styles.input} type="number" step="any" value={item.monthly_rate} onChange={e => updateItem(i, "monthly_rate", Number(e.target.value))} />
                      {item.monthly_rate > 0 && <small style={styles.wordText}>{numberToWordsIndian(item.monthly_rate)}</small>}
                    </div>
                    <div>
                      <label style={styles.label}>Total Days</label>
                      <input style={styles.input} type="number" step="any" value={item.total_days} onChange={e => updateItem(i, "total_days", Number(e.target.value))} />
                    </div>
                    <div>
                      <label style={styles.label}>Working Days</label>
                      <input style={styles.input} type="number" step="any" value={item.working_days} onChange={e => updateItem(i, "working_days", Number(e.target.value))} />
                    </div>
                  </>
                )}

                {item.billing_type === "HOURLY" && (
                  <>
                    <div style={{ position: 'relative' }}>
                      <label style={styles.label}>Hourly Rate</label>
                      <input style={styles.input} type="number" step="any" value={item.hourly_rate} onChange={e => updateItem(i, "hourly_rate", Number(e.target.value))} />
                      {item.hourly_rate > 0 && <small style={styles.wordText}>{numberToWordsIndian(item.hourly_rate)}</small>}
                    </div>
                    <div>
                      <label style={styles.label}>Total Hours</label>
                      <input style={styles.input} type="number" step="any" value={item.total_hours} onChange={e => updateItem(i, "total_hours", Number(e.target.value))} />
                    </div>
                  </>
                )}

                {item.billing_type === "MANUAL" && (
                  <div style={{ position: 'relative' }}>
                    <label style={styles.label}>Amount</label>
                    <input style={styles.input} type="number" step="any" value={item.amount} onChange={e => updateItem(i, "amount", Number(e.target.value))} />
                    {item.amount > 0 && <small style={styles.wordText}>{numberToWordsIndian(item.amount)}</small>}
                  </div>
                )}
              </div>
              
              <div style={styles.summaryRow}>
                <div><label style={styles.label}>GST %</label><input style={{ ...styles.input, width: '60px' }} type="number" step="any" value={item.gst_rate} disabled /></div>
                <div><small style={styles.label}>Amount</small><div style={styles.readonlyValue}>₹{item.calc_amount}</div></div>
                <div><small style={styles.label}>GST</small><div style={styles.readonlyValue}>₹{item.gst_amount}</div></div>
                <div><small style={styles.label}>Total</small><div style={styles.totalValue}>₹{item.total}</div></div>
              </div>
            </div>
          ))}
          <button onClick={addItem} style={styles.addItemBtn}>+ Add Item</button>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'right' }}>
          <button onClick={handleSubmit} disabled={selectedClient && !BasBillingDetails(selectedClient)} style={styles.submitBtnLarge}>Create Invoice</button>
        </div>
      </div>

      <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} onClientAdded={handleClientAdded} notify={notify} />
      <UpdateClientModal isOpen={isUpdateClientModalOpen} onClose={() => setIsUpdateClientModalOpen(false)} client={selectedClient} onClientUpdated={handleClientUpdated} notify={notify} />
    </AccountsBaseLayout>
  );
}

const styles = {
  toaster: { position: 'fixed', top: '20px', right: '20px', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 10001, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  topNav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  backBtn: { background: "#1E293B", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
  settingsBtn: { background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", padding: "10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },

  pageTitle: { fontSize: "22px", fontWeight: "800", color: "#1E293B", margin: 0 },
  card: { background: "#fff", borderRadius: "12px", padding: "25px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
  section: { marginBottom: "20px" },
  label: { display: "block", fontSize: "12px", fontWeight: "700", color: "#64748B", marginBottom: "6px", textTransform: 'uppercase' },
  input: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", width: '100%', outline: 'none', boxSizing: 'border-box', fontSize: '14px' },
  inputSearch: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", width: '100%', outline: 'none', boxSizing: 'border-box', background: '#fff', fontSize: '14px' },
  dropdownList: { position: 'absolute', top: '100%', left: 0, width: '100%', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', zIndex: 100, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  dropdownItem: { padding: '10px 14px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' },
  textarea: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", width: '100%', minHeight: '80px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  addBtn: { background: "#10B981", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
  warningBox: { marginTop: "10px", padding: "12px", background: "#FFFBEB", border: "1px solid #FEF3C7", borderRadius: "8px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  updateBtn: { background: "#F59E0B", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: '12px', fontWeight: "700" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" },
  gridCalculations: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "15px", marginBottom: "15px" },
  itemCard: { padding: "15px", border: "1px solid #F1F5F9", borderRadius: "10px", background: "#F8FAFC", marginBottom: "15px" },
  itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  itemCount: { fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  removeBtn: { background: '#EF4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px", gap: '15px' },
  readonlyValue: { padding: '8px', background: '#E2E8F0', borderRadius: '6px', fontSize: '13px', minWidth: '80px', textAlign: 'center', fontWeight: '600' },
  totalValue: { padding: '8px', background: '#DBEAFE', borderRadius: '6px', fontSize: '14px', fontWeight: '800', color: '#1E40AF', minWidth: '80px', textAlign: 'center' },
  addItemBtn: { background: "#3B82F6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
  submitBtnLarge: { background: "#FF9B51", color: "#fff", border: "none", padding: "14px 40px", borderRadius: "10px", fontSize: "16px", fontWeight: "800", cursor: "pointer" },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modernModalContent: { background: '#fff', borderRadius: '16px', width: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', padding: '20px 25px', borderBottom: '1px solid #F1F5F9', alignItems: 'center', flexShrink: 0 },
  modalTitle: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#1E293B' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' },
  modalFormWrapper: { display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 },
  modalBody: { padding: '25px', flex: 1 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '20px 25px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC', flexShrink: 0 },
  formSectionTitle: { fontSize: '14px', fontWeight: '800', color: '#FF9B51', marginBottom: '15px', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9', paddingBottom: '5px' },
  formGridModern: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' },
  cancelBtn: { padding: '10px 20px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#64748B' },
  submitBtn: { padding: '10px 20px', background: '#10B981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  saveBtn: { padding: '10px 20px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '2px' },
  errorText: { color: '#EF4444', fontSize: '11px', fontWeight: '600', marginTop: '2px' },
  wordText: {display: 'block',fontSize: '13px',color: '#6366F1',fontWeight: '600',marginTop: '4px',fontStyle: 'italic',lineHeight: '1.2'}
};






