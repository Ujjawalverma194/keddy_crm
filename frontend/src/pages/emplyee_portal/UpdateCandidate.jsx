import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest, API_BASE } from "../../services/api";
import BaseLayout from "../components/emp_base";

const Icons = {
  Back: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Money: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1v22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  File: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  ),
};

function UpdateCandidate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const getResumeUrl = (resumePath) => {
    if (!resumePath) return "";
    return resumePath.startsWith("http") ? resumePath : `${API_BASE}${resumePath}`;
  };

  const getResumeName = (resumePath) => {
    if (!resumePath) return "No resume uploaded";
    try {
      const cleanPath = resumePath.split("?")[0];
      const fileName = cleanPath.split("/").filter(Boolean).pop();
      return fileName || "Current resume";
    } catch {
      return "Current resume";
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const candidateRes = await apiRequest(`/employee-portal/api/candidates/${id}/`);
      const clientRes = await apiRequest("/employee-portal/api/clients/list/");
      const vendorRes = await apiRequest("/employee-portal/api/user/vendors/");

      setForm(candidateRes);
      setClients(clientRes.results || []);
      setVendors(
        Array.isArray(vendorRes)
          ? vendorRes
          : vendorRes.results || vendorRes.data || vendorRes.vendors || []
      );
    } catch (err) {
      console.error("Error loading data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (clientSearch.length > 0) {
        fetchSearchClients(clientSearch);
      } else {
        fetchSearchClients("");
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [clientSearch]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSearchVendors(vendorSearch);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [vendorSearch]);

  const fetchSearchClients = async (query) => {
    try {
      const res = await apiRequest(`/employee-portal/api/clients/list/?search=${query}`);
      setClients(res.results || []);
    } catch (err) {
      console.error("Client search error", err);
    }
  };

  const fetchSearchVendors = async (query) => {
    try {
      const res = await apiRequest(`/employee-portal/api/user/vendors/?search=${query}`);
      setVendors(
        Array.isArray(res)
          ? res
          : res.results || res.data || res.vendors || []
      );
    } catch (err) {
      console.error("Vendor search error", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const fd = new FormData();

    const editableFields = [
      "candidate_name",
      "candidate_email",
      "candidate_number",
      "years_of_experience_manual",
      "years_of_experience_calculated",
      "skills",
      "technology",
      "vendor_company_name",
      "vendor_number",
      "vendor_rate",
      "vendor_rate_type",
      "client",
      "client_rate",
      "client_rate_type",
      "main_status",
      "sub_status",
      "verification_status",
      "is_blocklisted",
      "blocklisted_reason",
      "remark",
      "extra_details",
    ];

    editableFields.forEach((field) => {
      if (form[field] !== null && form[field] !== undefined && form[field] !== "") {
        fd.append(field, form[field]);
      }
    });

    if (resumeFile) fd.append("resume", resumeFile);

    try {
      const res = await apiRequest(`/employee-portal/api/candidates/${id}/update/`, "PUT", fd);

      if (res?.resume) {
        setForm((prev) => ({ ...prev, resume: res.resume }));
      }
      setResumeFile(null);
      alert(res?.message || "Candidate updated successfully");
      navigate(`/employee/candidate/view/${id}`);
    } catch (err) {
      console.error("Candidate update error", err);
      alert(err?.message || err?.detail || "Update failed! Please check backend update API and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BaseLayout>
        <div style={styles.loading}>Loading Candidate Data...</div>
      </BaseLayout>
    );
  }

  const completedCount = [
    form.candidate_name,
    form.technology,
    form.years_of_experience_manual,
    form.vendor_rate,
    form.vendor_rate_type,
  ].filter(Boolean).length;

  return (
    <BaseLayout>
      <div style={styles.pageShell}>
        <div style={styles.hero}>
          <div style={styles.heroLeft}>
            <button type="button" onClick={() => navigate(-1)} style={styles.backBtn} title="Back">
              <Icons.Back />
            </button>
            <div>
              <h2 style={styles.pageTitle}>Edit Candidate</h2>
              <p style={styles.pageSubtitle}>{form.candidate_name || "Candidate profile"} · Update profile, vendor, client and resume details.</p>
            </div>
          </div>

          <div style={styles.progressBox}>
            <div style={styles.progressText}>{completedCount} / 5 key fields done</div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${(completedCount / 5) * 100}%` }} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.layoutGrid}>
            <div style={styles.formGrid}>
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.User /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Personal & professional details</h3>
                    <p style={styles.sectionHint}>Candidate basics, technology, experience and skills.</p>
                  </div>
                </div>

                <div style={styles.innerGrid}>
                  <Field label="Candidate Name" style={styles.col4}><input name="candidate_name" style={styles.input} value={form.candidate_name || ""} onChange={handleChange} /></Field>
                  <Field label="Email Address" style={styles.col4}><input name="candidate_email" style={styles.input} value={form.candidate_email || ""} onChange={handleChange} /></Field>
                  <Field label="Phone Number" style={styles.col4}><input name="candidate_number" style={styles.input} value={form.candidate_number || ""} onChange={handleChange} /></Field>
                  <Field label="Technology" style={styles.col4}><input name="technology" style={styles.input} value={form.technology || ""} onChange={handleChange} /></Field>
                  <Field label="Exp (Manual)" style={styles.col4}><input name="years_of_experience_manual" style={styles.input} value={form.years_of_experience_manual || ""} onChange={handleChange} /></Field>
                  <Field label="Exp (Calc - Read Only)" style={styles.col4}><input name="years_of_experience_calculated" style={{ ...styles.input, color: "#94A3B8" }} value={form.years_of_experience_calculated || ""} readOnly /></Field>
                  <Field label="Skills" style={styles.col12}><input name="skills" style={styles.input} value={form.skills || ""} onChange={handleChange} /></Field>
                </div>
              </div>

              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.Money /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Vendor & client information</h3>
                    <p style={styles.sectionHint}>Search vendor/client and update commercial details.</p>
                  </div>
                </div>

                <div style={styles.innerGrid}>
                  
                  {/* Vendor Details Section Header */}
                  <div style={{ gridColumn: "span 12", paddingBottom: "8px", borderBottom: "1px solid #EEF1F5", marginBottom: "10px", marginTop: "5px" }}>
                    <h4 style={{ margin: 0, color: "#1E293B", fontSize: "15px", fontWeight: "700" }}>Vendor Details</h4>
                  </div>

                  <div style={{ ...styles.inputGroup, ...styles.col6, position: "relative" }}>
                    <label style={styles.label}>Search & Select Vendor</label>
                    <div style={styles.inputShell}>
                      <input
                        type="text"
                        placeholder="Search vendor..."
                        style={styles.input}
                        value={vendorSearch}
                        onChange={(e) => {
                          setVendorSearch(e.target.value);
                          setShowVendorDropdown(true);
                        }}
                        onFocus={() => setShowVendorDropdown(true)}
                        onBlur={() => setTimeout(() => setShowVendorDropdown(false), 200)}
                      />
                    </div>
                    {showVendorDropdown && (
                      <div style={styles.dropdownList}>
                        {vendors.length > 0 ? (
                          vendors.map((v) => (
                            <div key={v.vendor_id || v.id} style={styles.dropdownItem} onMouseDown={() => {
                                setForm({ ...form, vendor_company_name: v.company_name, vendor_number: v.phone_number || v.vendor_number || "" });
                                setVendorSearch(v.company_name);
                                setShowVendorDropdown(false);
                            }}>
                              <div style={styles.dropdownTitle}>{v.company_name}</div>
                              <div style={styles.dropdownSubText}>{v.vendor_name || v.name || "No name"} - {v.phone_number || v.vendor_number || ""}</div>
                            </div>
                          ))
                        ) : (
                          <div style={styles.noDropdownText}>No vendors found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <Field label="Vendor Contact" style={styles.col6}><input name="vendor_number" style={styles.input} value={form.vendor_number || ""} onChange={handleChange} /></Field>
                  <Field label="Vendor Rate" style={styles.col6}><input name="vendor_rate" style={styles.input} value={form.vendor_rate || ""} onChange={handleChange} /></Field>
                  <Field label="Vendor Rate Type" style={styles.col6}>
                    <RateTypeSelect name="vendor_rate_type" value={form.vendor_rate_type || ""} onChange={handleChange} />
                  </Field>

                  {/* Client Details Section Header */}
                  <div style={{ gridColumn: "span 12", paddingBottom: "8px", borderBottom: "1px solid #EEF1F5", marginBottom: "10px", marginTop: "20px" }}>
                    <h4 style={{ margin: 0, color: "#1E293B", fontSize: "15px", fontWeight: "700" }}>Client Details</h4>
                  </div>

                  <div style={{ ...styles.inputGroup, ...styles.col12, position: "relative" }}>
                    <label style={styles.label}>Search & Select Client</label>
                    <div style={styles.inputShell}>
                      <input
                        type="text"
                        placeholder="Search client..."
                        style={styles.input}
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                      />
                    </div>
                    {showClientDropdown && (
                      <div style={styles.dropdownList}>
                        {clients.length > 0 ? (
                          clients.map((c) => (
                            <div key={c.id} style={styles.dropdownItem} onMouseDown={() => {
                                setForm({ ...form, client: c.id });
                                setClientSearch(c.client_name + " - " + c.company_name);
                                setShowClientDropdown(false);
                            }}>
                              <div style={styles.dropdownTitle}>{c.client_name}</div>
                              <div style={styles.dropdownSubText}>{c.company_name}</div>
                            </div>
                          ))
                        ) : (
                          <div style={styles.noDropdownText}>No clients found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <Field label="Client Rate" style={styles.col6}><input name="client_rate" style={styles.input} value={form.client_rate || ""} onChange={handleChange} /></Field>
                  <Field label="Client Rate Type" style={styles.col6}>
                    <RateTypeSelect name="client_rate_type" value={form.client_rate_type || ""} onChange={handleChange} />
                  </Field>
                </div>
              </div>

              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.File /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Documents & remarks</h3>
                    <p style={styles.sectionHint}>View current resume, replace resume and update notes.</p>
                  </div>
                </div>

                <div style={styles.innerGrid}>
                  <div style={{ ...styles.inputGroup, ...styles.col6 }}>
                    <label style={styles.label}>Current Resume</label>
                    {form.resume ? (
                      <div style={styles.currentResumeBox}>
                        <div>
                          <span style={styles.resumeLabel}>Existing file</span>
                          <div style={styles.resumeName}>{getResumeName(form.resume)}</div>
                        </div>
                        <a href={getResumeUrl(form.resume)} target="_blank" rel="noopener noreferrer" style={styles.resumeLink}>View</a>
                      </div>
                    ) : (
                      <div style={styles.noResumeBox}>No resume uploaded yet</div>
                    )}
                  </div>

                  <Field label="Replace Resume (Optional)" style={styles.col6}>
                    <input type="file" accept=".pdf,.doc,.docx" style={styles.input} onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                  </Field>

                  {resumeFile && (
                    <div style={{ ...styles.selectedResumeBox, gridColumn: "span 12" }}>
                      New selected resume: <strong>{resumeFile.name}</strong>
                    </div>
                  )}

                  <div style={{ ...styles.inputGroup, ...styles.col6 }}>
                    <label style={styles.label}>Remark</label>
                    <div style={styles.textareaShell}>
                      <textarea name="remark" style={styles.textarea} value={form.remark || ""} onChange={handleChange} />
                    </div>
                  </div>

                  <div style={{ ...styles.inputGroup, ...styles.col6 }}>
                    <label style={styles.label}>Extra Details</label>
                    <div style={styles.textareaShell}>
                      <textarea name="extra_details" style={styles.textarea} value={form.extra_details || ""} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.sideCard}>
              <div style={styles.previewKicker}>Live Preview</div>
              <h3 style={styles.previewTitle}>{form.candidate_name || "Candidate"}</h3>
              <div style={styles.previewSub}>{form.technology || "Technology will show here"}</div>

              <div style={styles.previewList}>
                <div style={styles.previewRow}><span>Experience</span><b>{form.years_of_experience_manual || "—"}</b></div>
                <div style={styles.previewRow}><span>Vendor</span><b>{form.vendor_company_name || "—"}</b></div>
                <div style={styles.previewRow}><span>Vendor rate</span><b>{form.vendor_rate ? `${form.vendor_rate} ${form.vendor_rate_type || ""}` : "—"}</b></div>
                <div style={styles.previewRow}><span>Client rate</span><b>{form.client_rate ? `${form.client_rate} ${form.client_rate_type || ""}` : "—"}</b></div>
                <div style={{ ...styles.previewRow, borderBottom: "none" }}><span>Resume</span><b>{resumeFile ? "New selected" : form.resume ? "Uploaded" : "Missing"}</b></div>
              </div>
            </div>
          </div>

          <div style={styles.footerBar}>
            <div style={styles.footerHint}>{completedCount} / 5 key fields done</div>
            <button type="submit" style={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Candidate Details"}
            </button>
          </div>
        </form>
      </div>
    </BaseLayout>
  );
}

const Field = ({ label, style, children }) => (
  <div style={{ ...styles.inputGroup, ...style }}>
    <label style={styles.label}>{label}</label>
    <div style={styles.inputShell}>{children}</div>
  </div>
);

const RateTypeSelect = ({ name, value, onChange }) => (
  <select name={name} value={value} onChange={onChange} style={styles.select} required>
    <option value="">Select Type</option>
    <option value="LPA">LPA (Lakh/Year)</option>
    <option value="LPM">LPM (Lakh/Month)</option>
    <option value="KPM">KPM (Thousand/Month)</option>
    <option value="PHR">PHR (Per Hour - ₹)</option>
    <option value="USD">USD ($)</option>
    <option value="USD_PH">USD/hr ($)</option>
    <option value="EUR">EUR (€)</option>
    <option value="EUR_PH">EUR/hr (€)</option>
    <option value="GBP">GBP (£)</option>
    <option value="GBP_PH">GBP/hr (£)</option>
    <option value="AED">AED (UAE)</option>
    <option value="SGD">SGD (Singapore)</option>
    <option value="SAR">SAR (Saudi)</option>
    <option value="CNY">CNY (China)</option>
    <option value="JPY">JPY (Japan)</option>
    <option value="AUD">AUD (Australia)</option>
    <option value="CAD">CAD (Canada)</option>
    <option value="CHF">CHF (Swiss)</option>
    <option value="HKD">HKD (Hong Kong)</option>
    <option value="THB">THB (Thailand)</option>
    <option value="MYR">MYR (Malaysia)</option>
    <option value="KRW">KRW (S. Korea)</option>
    <option value="NZD">NZD (NZ)</option>
    <option value="ZAR">ZAR (S. Africa)</option>
    <option value="KWD">KWD (Kuwait)</option>
    <option value="QAR">QAR (Qatar)</option>
  </select>
);

const styles = {
  dropdownList: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    width: "100%",
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    maxHeight: "220px",
    overflowY: "auto",
    zIndex: 50,
  },
  dropdownItem: {
    padding: "12px 14px",
    cursor: "pointer",
    borderBottom: "1px solid #F1F5F9",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  dropdownTitle: {
    color: "#25343F",
    fontSize: "14px",
    fontWeight: "700",
  },
  dropdownSubText: {
    color: "#64748B",
    fontSize: "12px",
  },
  noDropdownText: {
    padding: "12px 14px",
    color: "#94A3B8",
    fontSize: "13px",
    textAlign: "center",
  },

  loading: { padding: "80px", textAlign: "center", fontWeight: "900", color: "#25343F" },
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
  inputShell: { minHeight: "50px", borderRadius: "14px", border: "1px solid #E8ECF2", background: "#fff", display: "flex", alignItems: "center", gap: "10px", padding: "0 14px", boxSizing: "border-box" },
  input: { width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#20242A", background: "transparent", fontWeight: "600", boxSizing: "border-box" },
  select: { width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#20242A", background: "transparent", fontWeight: "700", cursor: "pointer" },
  textareaShell: { borderRadius: "16px", border: "1px solid #E8ECF2", background: "#fff", padding: "13px 14px", boxSizing: "border-box" },
  textarea: { width: "100%", minHeight: "88px", resize: "vertical", border: "none", outline: "none", fontSize: "14px", color: "#20242A", lineHeight: "1.55", fontWeight: "600", background: "transparent", boxSizing: "border-box" },
  sideCard: { position: "sticky", top: "88px", background: "#fff", borderRadius: "22px", padding: "22px", border: "1px solid #EEF1F5", borderTop: "5px solid #FF6B2C", boxShadow: "0 18px 42px rgba(15,23,42,0.08)" },
  previewKicker: { color: "#8A8D94", fontSize: "12px", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", borderBottom: "1px solid #E8ECF2", paddingBottom: "10px", marginBottom: "18px" },
  previewTitle: { margin: "0 0 5px", color: "#20242A", fontSize: "22px", fontWeight: "900", opacity: 0.88 },
  previewSub: { color: "#7B7E86", fontSize: "14px", fontWeight: "700", marginBottom: "18px" },
  previewList: { border: "1px solid #E8ECF2", borderRadius: "16px", overflow: "hidden" },
  previewRow: { display: "flex", justifyContent: "space-between", gap: "12px", padding: "13px 14px", borderBottom: "1px solid #EEF1F5", color: "#7B7E86", fontSize: "14px", fontWeight: "700" },
  currentResumeBox: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "13px", borderRadius: "14px", border: "1px solid #E8ECF2", background: "#F8FAFC" },
  resumeLabel: { fontSize: "11px", color: "#64748B", fontWeight: "900", textTransform: "uppercase" },
  resumeName: { color: "#25343F", fontSize: "13px", fontWeight: "800", marginTop: "3px", wordBreak: "break-all" },
  resumeLink: { background: "#25343F", color: "#fff", textDecoration: "none", padding: "8px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: "800", whiteSpace: "nowrap" },
  noResumeBox: { padding: "13px", borderRadius: "14px", border: "1px dashed #CBD5E1", background: "#F8FAFC", color: "#94A3B8", fontSize: "13px", fontWeight: "800" },
  selectedResumeBox: { padding: "10px 12px", borderRadius: "10px", background: "#FFF7ED", color: "#9A3412", fontSize: "12px", fontWeight: "700", border: "1px solid #FED7AA" },
  footerBar: { position: "sticky", bottom: 0, zIndex: 20, marginTop: "18px", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)", borderTop: "1px solid #EEF1F5", padding: "16px 0 0", display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" },
  footerHint: { color: "#7B7E86", fontSize: "13px", fontWeight: "800" },
  submitBtn: { minWidth: "230px", border: "none", borderRadius: "15px", background: "linear-gradient(135deg, #FF9B51, #FF5E2F)", color: "#fff", padding: "14px 30px", fontSize: "15px", fontWeight: "900", cursor: "pointer", boxShadow: "0 12px 28px rgba(255, 94, 47, 0.32)" },
};

export default UpdateCandidate;
