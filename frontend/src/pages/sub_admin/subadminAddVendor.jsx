import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";

const Icons = {
  Back: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  ),
  Vendor: () => (
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
  UserPlus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  )
};

const EMPTY_FORM = {
  company_name: "",
  company_website: "",
  company_pan_or_reg_no: "",
  top_3_clients: "",
  no_of_bench_developers: 0,
  provide_onsite: false,
  onsite_location: "",
  specialized_tech_developers: "",
  vendor_official_email: "",
  sending_email_id: "",
  provide_bench: true,
  provide_market: false,
  company_employee_count: "",
  remark: "",
};

function AddVendor() {
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
    bench_list: null,
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
          const res = await apiRequest(`/sub-admin/api/admin-vendors/search/?q=${encodeURIComponent(form.company_name)}`);
          if (res && res.length > 0) {
            setCompanySuggestions(res);
            setShowCompanySuggestions(true);
          } else {
            setCompanySuggestions([]);
            setShowCompanySuggestions(false);
          }
        } catch (error) {
          console.error("Failed to search vendors", error);
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
      company_name: modalCompany.companyName || "",
      vendor_official_email: modalCompany.email || "",
      company_website: modalCompany.companyWebsite || "",
      company_pan_or_reg_no: modalCompany.companyPanOrRegNo || "",
      sending_email_id: modalCompany.sendingEmailId || "",
      company_employee_count: modalCompany.companyEmployeeCount || "",
      specialized_tech_developers: modalCompany.specializedTechDevelopers || "",
      top_3_clients: modalCompany.top3Clients || "",
      no_of_bench_developers: modalCompany.noOfBenchDevelopers || "",
    });
    setPocs([{ id: poc.id, name: poc.name || "", number: poc.number || "", email: poc.email || "", isPrimary: poc.isPrimary || false }]);
    setShowPocModal(false);
    // Smooth scroll to POCs section
    setTimeout(() => {
      const el = document.getElementById("poc-section");
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const addNewPoc = () => {
    setSelectedCompanyId(modalCompany.id);
    setForm({
      ...form,
      company_name: modalCompany.companyName || "",
      vendor_official_email: modalCompany.email || "",
      company_website: modalCompany.companyWebsite || "",
      company_pan_or_reg_no: modalCompany.companyPanOrRegNo || "",
      sending_email_id: modalCompany.sendingEmailId || "",
      company_employee_count: modalCompany.companyEmployeeCount || "",
      specialized_tech_developers: modalCompany.specializedTechDevelopers || "",
      top_3_clients: modalCompany.top3Clients || "",
      no_of_bench_developers: modalCompany.noOfBenchDevelopers || "",
    });
    setPocs([{ id: null, name: "", number: "", email: "", isPrimary: false }]);
    setShowPocModal(false);
    // Smooth scroll to POCs section
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
      // In case they fill name but not number, maybe it errors later, but let's send it to backend for validation
      formData.append("pocs", JSON.stringify([{name: pocs[0].name}]));
    }

    if (files.bench_list) formData.append("bench_list", files.bench_list);
    if (files.nda_document) formData.append("nda_document", files.nda_document);
    if (files.msa_document) formData.append("msa_document", files.msa_document);

    try {
      await apiRequest("/employee-portal/api/vendors/create/", "POST", formData);
      notify("Vendor created successfully!");
      setForm(EMPTY_FORM);
      setPocs([{ id: null, name: "", number: "", email: "", isPrimary: false }]);
      setFiles({ bench_list: null, nda_document: null, msa_document: null });
      e.target.reset();
    } catch (error) {
      console.error("Vendor create error:", error);
      notify("Error creating vendor. Please check all fields.", "error");
    } finally {
      setIsSubmitting(false);
    }
     navigate(-1)
  };

  const completedCount = [pocs[0]?.name, pocs[0]?.number, form.company_name].filter(Boolean).length;

  return (
    <BaseLayout>
      {toast.show && (
        <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60" }}>
          {toast.msg}
        </div>
      )}

      {showPocModal && modalCompany && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '500px', maxWidth: '90%', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#111827' }}>Select or Add POC for {modalCompany.companyName}</h3>
            {modalCompany.pocs && modalCompany.pocs.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', maxHeight: '300px', overflowY: 'auto' }}>
                {modalCompany.pocs.map(poc => (
                  <li key={poc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{poc.name}</div>
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>{poc.number} {poc.email ? `• ${poc.email}` : ''}</div>
                    </div>
                    <button type="button" onClick={() => assignPoc(poc)} style={{ background: '#FFF0EA', color: '#FF6B2C', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Assign This POC</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px' }}>No POCs found for this company.</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setShowPocModal(false)} style={{ background: '#F3F4F6', color: '#374151', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button type="button" onClick={addNewPoc} style={{ background: '#FF6B2C', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Add New POC</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.pageShell}>
        <div style={styles.hero}>
          <div style={styles.heroLeft}>
            <button type="button" onClick={() => navigate(-1)} style={styles.backBtn} title="Back">
              <Icons.Back />
            </button>
            <div>
              <h2 style={styles.pageTitle}>Create New Vendor</h2>
              <p style={styles.pageSubtitle}>Compact ATS-style vendor onboarding with documents and service details.</p>
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
                  <div style={styles.sectionIcon}><Icons.Vendor /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Required information</h3>
                    <p style={styles.sectionHint}>Vendor person, contact and company basics.</p>
                  </div>
                </div>

                <div style={styles.innerGrid}>
                  <Field label="Company Name" required style={styles.col4}>
                    <div style={{ position: 'relative', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input style={{ ...styles.input, flex: 1 }} name="company_name" value={form.company_name} onChange={handleChange} required placeholder="ABC Tech" />
                      {showCompanySuggestions && companySuggestions.length > 0 && (
                        <ul style={{ position: 'absolute', top: '100%', left: 0, minWidth: '350px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', listStyle: 'none', padding: 0, margin: '4px 0 0', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
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
                              <span style={{ fontSize: '12px', color: '#FF6B2C', fontWeight: 'bold' }}>Get This Vendor &rarr;</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Field>
                </div>
              </div>

              <div id="poc-section" style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.UserPlus /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Points of Contact</h3>
                    <p style={styles.sectionHint}>Add one or more contact persons for this company.</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {pocs.map((poc, idx) => (
                    <div key={idx} style={{ padding: "16px", borderRadius: "12px", border: "1px solid #E8ECF2", position: "relative" }}>
                      {pocs.length > 1 && (
                        <button type="button" onClick={() => removePoc(idx)} style={{ position: "absolute", top: "10px", right: "10px", background: "transparent", color: "#EF4444", border: "none", cursor: "pointer", fontWeight: "bold" }}>&times; Remove</button>
                      )}
                      <div style={styles.innerGrid}>
                        <Field label="POC Name" required style={styles.col4}>
                          <input style={styles.input} name="name" value={poc.name} onChange={(e) => handlePocChange(idx, e)} required placeholder="John Doe" />
                        </Field>
                        <Field label="Phone Number" required style={styles.col4}>
                          <input style={styles.input} name="number" value={poc.number} onChange={(e) => handlePocChange(idx, e)} required placeholder="9876543210" />
                        </Field>
                        <Field label="Email Address" style={styles.col4}>
                          <input style={styles.input} type="email" name="email" value={poc.email} onChange={(e) => handlePocChange(idx, e)} placeholder="john@example.com" />
                        </Field>
                        <div style={{ ...styles.col12, display: "flex", alignItems: "center", marginTop: "8px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", color: "#374151" }}>
                            <input type="checkbox" name="isPrimary" checked={poc.isPrimary} onChange={(e) => handlePocChange(idx, e)} style={{ accentColor: "#FF6B2C", width: "16px", height: "16px" }} />
                            Set as Primary POC
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addAnotherPoc} style={{ background: "#FFF0EA", color: "#FF6B2C", border: "1px dashed #FF6B2C", padding: "12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", textAlign: "center", width: "100%" }}>+ Add Another POC</button>
                </div>
              </div>

              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.Vendor /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Additional information</h3>
                    <p style={styles.sectionHint}>Vendor contact and company basics.</p>
                  </div>
                </div>

                <div style={styles.innerGrid}>
                  <Field label="Vendor Official Email" style={styles.col4}>
                    <input style={styles.input} type="email" name="vendor_official_email" value={form.vendor_official_email} onChange={handleChange} placeholder="info@company.com" />
                  </Field>
                  <Field label="Sending Email ID" style={styles.col4}>
                    <input style={styles.input} type="email" name="sending_email_id" value={form.sending_email_id} onChange={handleChange} placeholder="hello@company.com" />
                  </Field>

                  <Field label="Company Website" style={styles.col4}>
                    <input style={styles.input} name="company_website" value={form.company_website} onChange={handleChange} placeholder="www.company.com" />
                  </Field>
                  <Field label="PAN / Reg No." style={styles.col4}>
                    <input style={styles.input} name="company_pan_or_reg_no" value={form.company_pan_or_reg_no} onChange={handleChange} placeholder="ABCDE1234F" />
                  </Field>
                  <Field label="Company Employee Count" style={styles.col4}>
                    <input style={styles.input} type="number" name="company_employee_count" value={form.company_employee_count} onChange={handleChange} placeholder="e.g. 50" />
                  </Field>
                </div>
              </div>


              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.Settings /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Service details</h3>
                    <p style={styles.sectionHint}>Tech strengths, clients and bench details.</p>
                  </div>
                </div>

                <div style={styles.innerGrid}>
                  <Field label="Specialized Technologies" style={styles.col4}><input style={styles.input} name="specialized_tech_developers" value={form.specialized_tech_developers} onChange={handleChange} /></Field>
                  <Field label="Top 3 Clients" style={styles.col4}><input style={styles.input} name="top_3_clients" value={form.top_3_clients} onChange={handleChange} /></Field>
                  <Field label="Bench Developers Count" style={styles.col4}><input style={styles.input} type="number" name="no_of_bench_developers" value={form.no_of_bench_developers} onChange={handleChange} /></Field>
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
                  <Field label="Bench List (File)" style={styles.col4}>
                    <input style={{ ...styles.input, padding: "10px 0" }} type="file" onChange={(e) => handleFileChange(e, 'bench_list')} accept=".pdf,.doc,.docx" />
                  </Field>
                  <Field label="NDA Document" style={styles.col4}>
                    <input style={{ ...styles.input, padding: "10px 0" }} type="file" onChange={(e) => handleFileChange(e, 'nda_document')} accept=".pdf,.doc,.docx" />
                  </Field>
                  <Field label="MSA Document" style={styles.col4}>
                    <input style={{ ...styles.input, padding: "10px 0" }} type="file" onChange={(e) => handleFileChange(e, 'msa_document')} accept=".pdf,.doc,.docx" />
                  </Field>

                  <Field label="Recruiter Remark" style={styles.col12}>
                    <div style={styles.textareaShell}>
                      <textarea style={styles.textarea} name="remark" value={form.remark} onChange={handleChange} placeholder="Add context or notes for this vendor..." />
                    </div>
                  </Field>
                </div>
              </div>
            </div>

            <div style={styles.sideCard}>
              <div style={styles.previewKicker}>Preview summary</div>
              <h3 style={styles.previewTitle}>{form.company_name || "New Vendor"}</h3>
              <p style={styles.previewSub}>{pocs[0]?.name || "No primary POC"} • {pocs[0]?.number || "N/A"}</p>

              <div style={styles.previewList}>
                <div style={styles.previewRow}><span>Email</span><b>{form.vendor_official_email || form.sending_email_id || "—"}</b></div>
                <div style={styles.previewRow}><span>Tech</span><b>{form.specialized_tech_developers || "—"}</b></div>
                <div style={{ ...styles.previewRow, borderBottom: "none" }}><span>Bench count</span><b>{form.no_of_bench_developers || "0"}</b></div>
              </div>

              <div style={styles.chipBox}>
                <ToggleChip id="onsite" name="provide_onsite" checked={form.provide_onsite} onChange={handleChange} label="Onsite Support" />
                <ToggleChip id="bench" name="provide_bench" checked={form.provide_bench} onChange={handleChange} label="Provide Bench" />
                <ToggleChip id="market" name="provide_market" checked={form.provide_market} onChange={handleChange} label="Provide Market" />
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
              {isSubmitting ? "Saving..." : "Create Vendor"}
            </button>
          </div>
        </form>
      </div>
    </BaseLayout>
  );
}

const Field = ({ label, required, style, children }) => (
  <div style={{ ...styles.inputGroup, ...style }}>
    <label style={styles.label}>{label}{required ? <span style={styles.requiredDot}>*</span> : null}</label>
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

export default AddVendor;
