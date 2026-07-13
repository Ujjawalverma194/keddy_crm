import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";

const Icons = {
  Back: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  ),
  Client: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Mail: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  File: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5z" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1 .6l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.8 1.8 0 0 0 11.6 15a1.8 1.8 0 0 0-.6-1l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.8 1.8 0 0 0 15 11.6a1.8 1.8 0 0 0 1-.6l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.8 1.8 0 0 0 19.4 15z" />
    </svg>
  ),
};

const EMPTY_FORM = {
    name: "",
    number: "",
    company_name: "",
    gst_number: "",
    billing_address: "",
    account_holder_name: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    remark: "",
    official_email: "",
    sending_email_id: "",
    company_employee_count: "",
  };

function AddClient() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [showPocModal, setShowPocModal] = useState(false);
  const [modalCompany, setModalCompany] = useState(null);
  const [pocs, setPocs] = useState([{ id: null, name: "", number: "", email: "", isPrimary: false }]);

  const [files, setFiles] = useState({
    
    nda_document: null,
    msa_document: null,
  });

  const [form, setForm] = useState(EMPTY_FORM);

  const notify = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  useEffect(() => {
    const searchCompany = async () => {
      if (form.company_name && !selectedCompanyId) {
        try {
          const res = await apiRequest(`/employee-portal/api/clients/search/?q=${encodeURIComponent(form.company_name)}`);
          if (res && res.length > 0) {
            setCompanySuggestions(res);
            setShowCompanySuggestions(true);
          } else {
            setCompanySuggestions([]);
            setShowCompanySuggestions(false);
          }
        } catch (error) {
          console.error("Failed to search clients", error);
        }
      } else {
        setCompanySuggestions([]);
        setShowCompanySuggestions(false);
      }
    };
    const timer = setTimeout(() => { searchCompany(); }, 500);
    return () => clearTimeout(timer);
  }, [form.company_name, selectedCompanyId]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'company_name') {
        setSelectedCompanyId(null);
    }
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSelectCompany = (comp) => {
    setModalCompany(comp);
    setShowCompanySuggestions(false);
    setShowPocModal(true);
  };

  const assignPoc = (poc) => {
    setSelectedCompanyId(modalCompany.id);
    setForm({
      ...form,
      company_name: modalCompany.company_name || modalCompany.companyName || "",
      official_email: modalCompany.email || modalCompany.official_email || "",
      gst_number: modalCompany.gst_number || "",
      billing_address: modalCompany.billing_address || "",
      account_holder_name: modalCompany.account_holder_name || "",
      bank_name: modalCompany.bank_name || "",
      account_number: modalCompany.account_number || "",
      ifsc_code: modalCompany.ifsc_code || "",
      remark: modalCompany.remark || "",
      sending_email_id: modalCompany.sending_email_id || "",
      company_employee_count: modalCompany.company_employee_count || "",
    });
    setPocs([{ id: poc.id, name: poc.name || "", number: poc.number || "", email: poc.email || "", isPrimary: poc.isPrimary || false }]);
    setShowPocModal(false);
    setTimeout(() => {
      const el = document.getElementById("poc-section");
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const addNewPoc = () => {
    setSelectedCompanyId(modalCompany.id);
    setForm({
      ...form,
      company_name: modalCompany.company_name || modalCompany.companyName || "",
      official_email: modalCompany.email || modalCompany.official_email || "",
      gst_number: modalCompany.gst_number || "",
      billing_address: modalCompany.billing_address || "",
      account_holder_name: modalCompany.account_holder_name || "",
      bank_name: modalCompany.bank_name || "",
      account_number: modalCompany.account_number || "",
      ifsc_code: modalCompany.ifsc_code || "",
      remark: modalCompany.remark || "",
      sending_email_id: modalCompany.sending_email_id || "",
      company_employee_count: modalCompany.company_employee_count || "",
    });
    setPocs([{ id: null, name: "", number: "", email: "", isPrimary: false }]);
    setShowPocModal(false);
    setTimeout(() => {
      const el = document.getElementById("poc-section");
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handlePocChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newPocs = [...pocs];
    if (type === 'checkbox' && name === 'isPrimary') {
      newPocs.forEach(p => p.isPrimary = false); // uncheck all others
      newPocs[index][name] = checked;
    } else {
      newPocs[index][name] = value;
    }
    setPocs(newPocs);
  };

  const addAnotherPoc = () => {
    setPocs([...pocs, { id: null, name: "", number: "", email: "", isPrimary: false }]);
  };

  const removePoc = (index) => {
    const newPocs = pocs.filter((_, i) => i !== index);
    setPocs(newPocs);
  };

  const handleFileChange = (e, key) => {
    setFiles({ ...files, [key]: e.target.files?.[0] || null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData();
    
    if (selectedCompanyId) {
        formData.append("company_id", selectedCompanyId);
    }

    Object.entries(form).forEach(([key, val]) => {
      let value = form[key];
      if (typeof value === "boolean") value = value ? "1" : "0";
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, value);
      }
    });

    const validPocs = pocs.filter(p => p.name && p.number);
    if (validPocs.length > 0) {
      formData.append("pocs", JSON.stringify(validPocs));
    } else if (pocs[0]?.name) {
      formData.append("pocs", JSON.stringify([{name: pocs[0].name}]));
    }

    if (files.bench_list) formData.append("bench_list", files.bench_list);
    if (files.nda_document) formData.append("nda_document", files.nda_document);
    if (files.msa_document) formData.append("msa_document", files.msa_document);

    try {
      await apiRequest("/employee-portal/api/clients/create/", "POST", formData);
      notify("Client created successfully!");
      setForm(EMPTY_FORM);
      setPocs([{ id: null, name: "", number: "", email: "", isPrimary: false }]);
      setFiles({ bench_list: null, nda_document: null, msa_document: null });
      e.target.reset();
    } catch (error) {
      console.error("Client create error:", error);
      notify("Error creating client. Please check all fields.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = [pocs[0]?.name, pocs[0]?.number, form.company_name].filter(Boolean).length;

  return (
    <BaseLayout>
      {toast.show && (
        <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60" }}>
          {toast.msg}
        </div>
      )}



      <div style={styles.pageShell}>
        <div style={styles.hero}>
          <div style={styles.heroLeft}>
            <button type="button" onClick={() => navigate(-1)} style={styles.backBtn} title="Back">
              <Icons.Back />
            </button>
            <div>
              <h2 style={styles.pageTitle}>Create New Client</h2>
              <p style={styles.pageSubtitle}>Compact ATS-style client onboarding with documents and service details.</p>
            </div>
          </div>

          <div style={styles.progressBox}>
            <div style={styles.progressText}>{completedCount} / 3 required done</div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${(completedCount / 3) * 100}%` }} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.layoutGrid}>
            <div style={styles.formGrid}>
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.Client /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Required information</h3>
                    <p style={styles.sectionHint}>Client person, contact and company basics.</p>
                  </div>
                </div>

                <div style={styles.innerGrid}>
                  
                  <Field label="Company Name" required style={styles.col12}>
                    <div style={{ position: 'relative' }}>
                      <input style={styles.input} name="company_name" value={form.company_name} onChange={handleChange} required placeholder="ABC Tech" />
                      {showCompanySuggestions && companySuggestions.length > 0 && (
                        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', listStyle: 'none', padding: 0, margin: '4px 0 0', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                          {companySuggestions.map(comp => (
                            <li 
                              key={comp.id} 
                              onClick={() => handleSelectCompany(comp)}
                              style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <div>
                                <div style={{ fontWeight: '600', color: '#111827' }}>{comp.companyName}</div>
                                {comp.email && <div style={{ fontSize: '12px', color: '#6B7280' }}>{comp.email}</div>}
                              </div>
                              <span style={{ fontSize: '12px', color: '#FF6B2C', fontWeight: 'bold' }}>Select &rarr;</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Field>
                </div>
              </div>

              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.Mail /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Contact & online presence</h3>
                    <p style={styles.sectionHint}>Official mail IDs, website, registration and company size.</p>
                  </div>
                </div>

                <div style={styles.innerGrid}>
                  <Field label="Client Official Email" style={styles.col6}>
                    <input style={styles.input} type="email" name="client_official_email" value={form.client_official_email} onChange={handleChange} />
                  </Field>
                  <Field label="Sending Email ID" style={styles.col6}>
                    <input style={styles.input} type="email" name="sending_email_id" value={form.sending_email_id} onChange={handleChange} />
                  </Field>
                  <Field label="Website URL" style={styles.col4}>
                    <input style={styles.input} name="company_website" value={form.company_website} onChange={handleChange} />
                  </Field>
                  <Field label="PAN / Reg No." style={styles.col4}>
                    <input style={styles.input} name="company_pan_or_reg_no" value={form.company_pan_or_reg_no} onChange={handleChange} />
                  </Field>
                  <Field label="Company Employee Count" style={styles.col4}>
                    <input style={styles.input} type="number" name="company_employee_count" value={form.company_employee_count} onChange={handleChange} />
                  </Field>
                </div>
              </div>

              
              <div id="poc-section" style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.Client /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Point of Contacts (POCs)</h3>
                    <p style={styles.sectionHint}>Add multiple contacts for this client.</p>
                  </div>
                </div>

                <div style={styles.innerGrid}>
                  {pocs.map((poc, index) => (
                    <div key={index} style={{ gridColumn: 'span 12', background: '#F8FAFC', padding: '16px', borderRadius: '12px', position: 'relative', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>POC {index + 1} {poc.isPrimary ? "(Primary)" : ""}</span>
                          {!poc.isPrimary && (
                            <button type="button" onClick={() => {
                              const e = { target: { name: 'isPrimary', type: 'checkbox', checked: true } };
                              handlePocChange(index, e);
                            }} style={{ background: 'none', border: 'none', color: '#FF6B2C', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Set as Primary</button>
                          )}
                        </div>
                        {pocs.length > 1 && (
                          <button type="button" onClick={() => removePoc(index)} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Remove</button>
                        )}
                      </div>
                      <div style={styles.innerGrid}>
                        <Field label="POC Name" required style={styles.col4}>
                          <input style={styles.input} name="name" value={poc.name} onChange={(e) => handlePocChange(index, e)} required placeholder="Jane Doe" />
                        </Field>
                        <Field label="POC Phone" required style={styles.col4}>
                          <input style={styles.input} name="number" value={poc.number} onChange={(e) => handlePocChange(index, e)} required placeholder="9876543210" />
                        </Field>
                        <Field label="POC Email" style={styles.col4}>
                          <input style={styles.input} type="email" name="email" value={poc.email} onChange={(e) => handlePocChange(index, e)} placeholder="jane@abctech.com" />
                        </Field>
                      </div>
                    </div>
                  ))}
                  
                  <div style={styles.col12}>
                    <button type="button" onClick={addAnotherPoc} style={{ background: '#FFF2EA', color: '#FF6B2C', border: '1px dashed #FF6B2C', padding: '12px', width: '100%', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                      + Add Another POC
                    </button>
                  </div>
                </div>
              </div>
  

              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.File /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Documents & remark</h3>
                    <p style={styles.sectionHint}>Upload agreements, bench list and add recruiter notes.</p>
                  </div>
                </div>

                <div style={styles.innerGrid}>
                  
                  <Field label="NDA Document" style={styles.col4}><input style={styles.input} type="file" onChange={(e) => handleFileChange(e, "nda_document")} /></Field>
                  <Field label="MSA Document" style={styles.col4}><input style={styles.input} type="file" onChange={(e) => handleFileChange(e, "msa_document")} /></Field>
                  <div style={{ ...styles.inputGroup, ...styles.col12 }}>
                    <label style={styles.label}>Remark</label>
                    <div style={styles.textareaShell}>
                      <textarea style={styles.textarea} name="remark" value={form.remark} onChange={handleChange} placeholder="Additional notes..." />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.sideCard}>
              <div style={styles.previewKicker}>Live Preview</div>
              <h3 style={styles.previewTitle}>{pocs[0]?.name || "New client POC"}</h3>
              <div style={styles.previewSub}>{form.company_name || "Company will show here"}</div>

              <div style={styles.previewList}>
                <div style={styles.previewRow}><span>Phone</span><b>{pocs[0]?.number || "—"}</b></div>
                <div style={styles.previewRow}><span>Email</span><b>{form.client_official_email || form.sending_email_id || "—"}</b></div>
                <div style={styles.previewRow}><span>Tech</span><b>{form.specialized_tech_developers || "—"}</b></div>
                <div style={{ ...styles.previewRow, borderBottom: "none" }}><span>Bench count</span><b>{form.no_of_bench_developers || "0"}</b></div>
              </div>

              <div style={styles.chipBox}>
                
              </div>

              {form.provide_onsite && (
                <div style={{ marginTop: "14px" }}>
                  <label style={styles.label}>Onsite Location</label>
                  <div style={styles.inputShell}>
                    <input style={styles.input} name="onsite_location" value={form.onsite_location} onChange={handleChange} placeholder="City name" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={styles.footerBar}>
            <div style={styles.footerHint}>{completedCount} / 3 required done</div>
            <button type="submit" disabled={isSubmitting} style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? "Saving..." : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    
      {showPocModal && modalCompany && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: "600px", borderRadius: "24px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "24px 30px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#111827" }}>{modalCompany.companyName}</h3>
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6B7280" }}>Select a POC to assign or add a new one</p>
              </div>
              <button type="button" onClick={() => setShowPocModal(false)} style={{ background: "#F3F4F6", border: "none", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#4B5563" }}>
                ✕
              </button>
            </div>
            
            <div style={{ padding: "24px 30px", maxHeight: "60vh", overflowY: "auto" }}>
              {modalCompany.pocs && modalCompany.pocs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {modalCompany.pocs.map((poc, idx) => (
                    <div key={idx} style={{ border: "1px solid #E5E7EB", borderRadius: "16px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F9FAFB" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: "700", color: "#111827", fontSize: "16px" }}>{poc.name}</span>
                          {poc.isPrimary && <span style={{ background: "#FEF3C7", color: "#D97706", padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: "800" }}>PRIMARY</span>}
                        </div>
                        <div style={{ color: "#4B5563", fontSize: "14px", marginTop: "4px" }}>📞 {poc.number}</div>
                        {poc.email && <div style={{ color: "#4B5563", fontSize: "14px", marginTop: "2px" }}>✉️ {poc.email}</div>}
                      </div>
                      <button type="button" onClick={() => assignPoc(poc)} style={{ background: "#FF6B2C", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 14px rgba(255, 107, 44, 0.25)" }}>
                        Assign POC
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#6B7280" }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                  <div style={{ fontWeight: "600" }}>No existing POCs found for this company.</div>
                </div>
              )}
            </div>
            
            <div style={{ padding: "20px 30px", background: "#F9FAFB", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "#6B7280", fontWeight: "500" }}>Need a different contact?</span>
              <button type="button" onClick={addNewPoc} style={{ background: "#111827", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "14px", fontWeight: "700", cursor: "pointer" }}>
                + Add New POC
              </button>
            </div>
          </div>
        </div>
      )}
      </BaseLayout>
  
  );
}

const Field = ({ label, required, style, children }) => (
  <div style={{ ...styles.inputGroup, ...style }}>
    <label style={styles.label}>{label}{required ? <span style={styles.requiredDot}>●</span> : null}</label>
    <div style={styles.inputShell}>{children}</div>
  </div>
);

const ToggleChip = ({ id, name, checked, onChange, label }) => (
  <label htmlFor={id} style={checked ? styles.toggleChipActive : styles.toggleChip}>
    <input type="checkbox" id={id} name={name} checked={checked} onChange={onChange} style={styles.checkbox} />
    {label}
  </label>
);

const styles = {
  toast: { position: "fixed", top: "85px", right: "20px", color: "#fff", padding: "12px 25px", borderRadius: "10px", zIndex: 9999, fontWeight: "800", boxShadow: "0 14px 30px rgba(15,23,42,0.18)" },
  pageShell: { width: "100%", maxWidth: "1260px", margin: "0 auto", padding: "26px 18px 98px", boxSizing: "border-box" },
  hero: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "18px", marginBottom: "18px" },
  heroLeft: { display: "flex", alignItems: "center", gap: "14px" },
  backBtn: { width: "44px", height: "44px", borderRadius: "14px", border: "1px solid #E9EDF3", background: "#fff", color: "#25343F", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 10px 24px rgba(15,23,42,0.06)" },
  pageTitle: { margin: 0, color: "#20242A", fontSize: "28px", fontWeight: "900", letterSpacing: "-0.8px" },
  pageSubtitle: { margin: "4px 0 0", color: "#85878E", fontSize: "14px", fontWeight: "600" },
  progressBox: { minWidth: "210px", background: "#fff", border: "1px solid #EEF1F5", borderRadius: "16px", padding: "12px 14px", boxShadow: "0 10px 28px rgba(15,23,42,0.05)" },
  progressText: { color: "#5E6470", fontSize: "12px", fontWeight: "800", marginBottom: "8px" },
  progressTrack: { height: "7px", borderRadius: "999px", background: "#EEF1F5", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #FF9B51, #FF5E2F)", transition: "width 0.25s ease" },
  layoutGrid: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: "24px", alignItems: "start" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "16px" },
  sectionCard: { gridColumn: "span 12", background: "#fff", borderRadius: "22px", padding: "20px 22px", border: "1px solid #EEF1F5", boxShadow: "0 18px 42px rgba(15,23,42,0.055)" },
  sectionHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
  sectionIcon: { width: "38px", height: "38px", borderRadius: "14px", background: "#FFF2EA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sectionTitle: { margin: 0, color: "#20242A", fontSize: "18px", fontWeight: "900", letterSpacing: "-0.35px" },
  sectionHint: { margin: "2px 0 0", color: "#85878E", fontSize: "13px", fontWeight: "600" },
  innerGrid: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "14px" },
  col4: { gridColumn: "span 4" },
  col6: { gridColumn: "span 6" },
  col12: { gridColumn: "span 12" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "7px", position: "relative" },
  label: { color: "#24272D", fontSize: "13px", fontWeight: "900" },
  requiredDot: { color: "#FF5E2F", marginLeft: "5px" },
  inputShell: { minHeight: "50px", borderRadius: "14px", border: "1px solid #E8ECF2", background: "#fff", display: "flex", alignItems: "center", gap: "10px", padding: "0 14px", boxSizing: "border-box" },
  input: { width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#20242A", background: "transparent", fontWeight: "600", boxSizing: "border-box" },
  textareaShell: { borderRadius: "16px", border: "1px solid #E8ECF2", background: "#fff", padding: "13px 14px", boxSizing: "border-box" },
  textarea: { width: "100%", minHeight: "88px", resize: "vertical", border: "none", outline: "none", fontSize: "14px", color: "#20242A", lineHeight: "1.55", fontWeight: "600", background: "transparent", boxSizing: "border-box" },
  sideCard: { position: "sticky", top: "88px", background: "#fff", borderRadius: "22px", padding: "22px", border: "1px solid #EEF1F5", borderTop: "5px solid #FF6B2C", boxShadow: "0 18px 42px rgba(15,23,42,0.08)" },
  previewKicker: { color: "#8A8D94", fontSize: "12px", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", borderBottom: "1px solid #E8ECF2", paddingBottom: "10px", marginBottom: "18px" },
  previewTitle: { margin: "0 0 5px", color: "#20242A", fontSize: "22px", fontWeight: "900", opacity: 0.88 },
  previewSub: { color: "#7B7E86", fontSize: "14px", fontWeight: "700", marginBottom: "18px" },
  previewList: { border: "1px solid #E8ECF2", borderRadius: "16px", overflow: "hidden" },
  previewRow: { display: "flex", justifyContent: "space-between", gap: "12px", padding: "13px 14px", borderBottom: "1px solid #EEF1F5", color: "#7B7E86", fontSize: "14px", fontWeight: "700" },
  chipBox: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "18px" },
  toggleChip: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 12px", border: "1px solid #E8ECF2", borderRadius: "999px", color: "#64748B", fontSize: "12px", fontWeight: "900", cursor: "pointer", background: "#fff" },
  toggleChipActive: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 12px", border: "1px solid #FFB777", borderRadius: "999px", color: "#FF6B2C", fontSize: "12px", fontWeight: "900", cursor: "pointer", background: "#FFF5EB" },
  checkbox: { accentColor: "#FF6B2C" },
  footerBar: { position: "sticky", bottom: 0, zIndex: 20, marginTop: "18px", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)", borderTop: "1px solid #EEF1F5", padding: "16px 0 0", display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" },
  footerHint: { color: "#7B7E86", fontSize: "13px", fontWeight: "800" },
  submitBtn: { minWidth: "210px", border: "none", borderRadius: "15px", background: "linear-gradient(135deg, #FF9B51, #FF5E2F)", color: "#fff", padding: "14px 30px", fontSize: "15px", fontWeight: "900", cursor: "pointer", boxShadow: "0 12px 28px rgba(255, 94, 47, 0.32)" },
};

export default AddClient;
