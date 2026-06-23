import React, { useState } from "react";
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
};

const EMPTY_FORM = {
  name: "",
  number: "",
  company_name: "",
  email: "",
  company_website: "",
  company_pan_or_reg_no: "",
  poc1_name: "",
  poc1_number: "",
  poc2_name: "",
  poc2_number: "",
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e, key) => {
    setFiles({ ...files, [key]: e.target.files?.[0] || null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      let val = form[key];
      if (typeof val === "boolean") val = val ? "1" : "0";
      if (val !== null && val !== undefined && val !== "") {
        formData.append(key, val);
      }
    });

    if (files.bench_list) formData.append("bench_list", files.bench_list);
    if (files.nda_document) formData.append("nda_document", files.nda_document);
    if (files.msa_document) formData.append("msa_document", files.msa_document);

    try {
      await apiRequest("/employee-portal/api/vendors/create/", "POST", formData);
      notify("Vendor created successfully!");
      setForm(EMPTY_FORM);
      setFiles({ bench_list: null, nda_document: null, msa_document: null });
      e.target.reset();
    } catch (error) {
      console.error("Vendor create error:", error);
      notify("Error creating vendor. Please check all fields.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = [form.name, form.number, form.company_name].filter(Boolean).length;

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
                  <Field label="Vendor Name" required style={styles.col4}>
                    <input style={styles.input} name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
                  </Field>
                  <Field label="Phone Number" required style={styles.col4}>
                    <input style={styles.input} name="number" value={form.number} onChange={handleChange} required placeholder="9876543220" />
                  </Field>
                  <Field label="Company Name" required style={styles.col4}>
                    <input style={styles.input} name="company_name" value={form.company_name} onChange={handleChange} required placeholder="ABC Tech" />
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
                  <Field label="Vendor Official Email" style={styles.col6}>
                    <input style={styles.input} type="email" name="vendor_official_email" value={form.vendor_official_email} onChange={handleChange} />
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

              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.Vendor /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>POC & service info</h3>
                    <p style={styles.sectionHint}>Contact persons, tech strengths, clients and bench details.</p>
                  </div>
                </div>

                <div style={styles.innerGrid}>
                  <Field label="POC 1 Name" style={styles.col6}><input style={styles.input} name="poc1_name" value={form.poc1_name} onChange={handleChange} /></Field>
                  <Field label="POC 1 Number" style={styles.col6}><input style={styles.input} name="poc1_number" value={form.poc1_number} onChange={handleChange} /></Field>
                  <Field label="POC 2 Name" style={styles.col6}><input style={styles.input} name="poc2_name" value={form.poc2_name} onChange={handleChange} /></Field>
                  <Field label="POC 2 Number" style={styles.col6}><input style={styles.input} name="poc2_number" value={form.poc2_number} onChange={handleChange} /></Field>
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
                  <Field label="Bench List" style={styles.col4}><input style={styles.input} type="file" onChange={(e) => handleFileChange(e, "bench_list")} /></Field>
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
              <h3 style={styles.previewTitle}>{form.name || "New vendor"}</h3>
              <div style={styles.previewSub}>{form.company_name || "Company will show here"}</div>

              <div style={styles.previewList}>
                <div style={styles.previewRow}><span>Phone</span><b>{form.number || "—"}</b></div>
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

export default AddVendor;
