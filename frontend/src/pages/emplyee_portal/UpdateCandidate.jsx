import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest, API_BASE } from "../../services/api";
import BaseLayout from "../components/emp_base";

function UpdateCandidate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFileUrl = (filePath) => {
    if (!filePath) return "";
    return filePath.startsWith("http") ? filePath : `${API_BASE}${filePath}`;
  };

  const getFileName = (filePath) => {
    if (!filePath) return "No resume uploaded";
    return decodeURIComponent(filePath.split("/").pop() || "Current Resume");
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const candidateRes = await apiRequest(
        `/employee-portal/api/candidates/${id}/`,
      );
      const clientRes = await apiRequest("/employee-portal/clients/list/");
      const vendorRes = await apiRequest("/employee-portal/api/user/vendors/");

      setForm(candidateRes);
      setClients(clientRes.results || []);
      setVendors(vendorRes.results || []);
    } catch (err) {
      console.error("Error loading data", err);
    } finally {
      setLoading(false);
    }
  };

  const [clientSearch, setClientSearch] = useState("");
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (clientSearch.length > 0) {
        fetchSearchClients(clientSearch);
      } else {
        // Agar search empty hai toh default list (pehle 10)
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
      const res = await apiRequest(
        `/employee-portal/clients/list/?search=${query}`,
      );
      setClients(res.results || []);
    } catch (err) {
      console.error("Client search error", err);
    }
  };
  const fetchSearchVendors = async (query) => {
    try {
      const res = await apiRequest(
        `/employee-portal/api/user/vendors/?search=${query}`,
      );

      setVendors(res.results || []);
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
      if (
        form[field] !== null &&
        form[field] !== undefined &&
        form[field] !== ""
      ) {
        fd.append(field, form[field]);
      }
    });

    if (resumeFile) fd.append("resume", resumeFile);

    try {
      const res = await apiRequest(
        `/employee-portal/api/candidates/${id}/update/`,
        "PUT",
        fd,
      );
      alert(res?.message || "Candidate updated successfully");
      navigate(`/employee/candidate/view/${id}`);
    } catch (err) {
      console.error("Candidate update error", err);
      alert(
        err?.message ||
          err?.detail ||
          "Update failed! Please check backend update API and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <BaseLayout>
        <h3>Loading Candidate Data...</h3>
      </BaseLayout>
    );

  return (
    <BaseLayout>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            ← Back
          </button>
          <h2 style={styles.title}>Edit Candidate: {form.candidate_name}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.formContainer}>
        {/* Section 1: Personal & Technical */}
        <div style={styles.section}>
          <h3 style={styles.secTitle}>1. Personal & Professional Details</h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Candidate Name</label>
              <input
                name="candidate_name"
                style={styles.input}
                value={form.candidate_name || ""}
                onChange={handleChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                name="candidate_email"
                style={styles.input}
                value={form.candidate_email || ""}
                onChange={handleChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number</label>
              <input
                name="candidate_number"
                style={styles.input}
                value={form.candidate_number || ""}
                onChange={handleChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Technology</label>
              <input
                name="technology"
                style={styles.input}
                value={form.technology || ""}
                onChange={handleChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Exp (Manual)</label>
              <input
                name="years_of_experience_manual"
                style={styles.input}
                value={form.years_of_experience_manual || ""}
                onChange={handleChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Exp (Calc - Read Only)</label>
              <input
                name="years_of_experience_calculated"
                style={{ ...styles.input, background: "#f5f5f5" }}
                value={form.years_of_experience_calculated || ""}
                readOnly
              />
            </div>
            <div style={{ ...styles.inputGroup, gridColumn: "span 2" }}>
              <label style={styles.label}>Skills</label>
              <input
                name="skills"
                style={styles.input}
                value={form.skills || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Vendor & Client Financials */}
        <div style={styles.section}>
          <h3 style={styles.secTitle}>2. Vendor & Client Information</h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Vendor Company</label>

              <input
                type="text"
                placeholder="Search Vendor..."
                style={{
                  ...styles.input,
                  marginBottom: "5px",
                  borderStyle: "dashed",
                }}
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
              />

              <select
                style={styles.input}
                value={form.vendor_company_name || ""}
                onChange={(e) => {
                  const selectedVendor = vendors.find(
                    (v) => v.company_name === e.target.value,
                  );

                  setForm({
                    ...form,
                    vendor_company_name: selectedVendor?.company_name || "",
                    vendor_number: selectedVendor?.phone_number || "",
                  });
                }}
              >
                <option value="">-- Choose Vendor --</option>

                {vendors.map((v) => (
                  <option key={v.vendor_id || v.id} value={v.company_name}>
                    {v.vendor_name} - {v.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Vendor Contact</label>
              <input
                name="vendor_number"
                style={styles.input}
                value={form.vendor_number || ""}
                onChange={handleChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Vendor Rate</label>
              <input
                name="vendor_rate"
                style={styles.input}
                value={form.vendor_rate || ""}
                onChange={handleChange}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}> Vendor Rate Type</label>
              <select
                name="vendor_rate_type"
                value={form.vendor_rate_type}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  width: "100%", // Poori jagah lega container ki
                  maxWidth: "250px", // Isse zyada bada nahi hoga
                  padding: "5px", // Thoda compact dikhega
                  fontSize: "14px", // Font size chhota karne ke liye
                }}
                required
              >
                <option value="">Select Type</option>

                {/* --- Domestic / Local --- */}
                <option value="LPA">LPA (Lakh/Year)</option>
                <option value="LPM">LPM (Lakh/Month)</option>
                <option value="KPM">KPM (Thousand/Month)</option>
                <option value="PHR">PHR (Per Hour - ₹)</option>

                {/* --- Global Major --- */}
                <option value="USD">USD ($)</option>
                <option value="USD_PH">USD/hr ($)</option>

                <option value="EUR">EUR (€)</option>
                <option value="EUR_PH">EUR/hr (€)</option>

                <option value="GBP">GBP (£)</option>
                <option value="GBP_PH">GBP/hr (£)</option>

                {/* --- Others (Inhe thoda short kar diya hai) --- */}
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
            </div>

            {/* <div style={styles.inputGroup}>
                            <label style={styles.label}>Select Client</label>
                            <select name="client" style={styles.input} value={form.client || ""} onChange={handleChange}>
                                <option value="">-- Choose Client --</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.client_name} - {c.company_name}</option>)}
                            </select>
                        </div> */}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Select Client</label>
              {/* Search Input added inside the same group */}
              <input
                type="text"
                placeholder="Type to search client..."
                style={{
                  ...styles.input,
                  marginBottom: "5px",
                  borderStyle: "dashed",
                }}
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
              <select
                name="client"
                style={styles.input}
                value={form.client || ""}
                onChange={handleChange}
              >
                <option value="">-- Choose Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_name} - {c.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Client Rate</label>
              <input
                name="client_rate"
                style={styles.input}
                value={form.client_rate || ""}
                onChange={handleChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Client Rate Type</label>
              <select
                name="client_rate_type"
                style={styles.input}
                value={form.client_rate_type || ""}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  width: "100%", // Poori jagah lega container ki
                  maxWidth: "250px", // Isse zyada bada nahi hoga
                  padding: "5px", // Thoda compact dikhega
                  fontSize: "14px", // Font size chhota karne ke liye
                }}
                required
              >
                <option value="">Select Type</option>

                {/* --- Domestic / Local --- */}
                <option value="LPA">LPA (Lakh/Year)</option>
                <option value="LPM">LPM (Lakh/Month)</option>
                <option value="KPM">KPM (Thousand/Month)</option>
                <option value="PHR">PHR (Per Hour - ₹)</option>

                {/* --- Global Major --- */}
                <option value="USD">USD ($)</option>
                <option value="USD_PH">USD/hr ($)</option>

                <option value="EUR">EUR (€)</option>
                <option value="EUR_PH">EUR/hr (€)</option>

                <option value="GBP">GBP (£)</option>
                <option value="GBP_PH">GBP/hr (£)</option>

                {/* --- Others (Inhe thoda short kar diya hai) --- */}
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
            </div>
          </div>
        </div>

        {/* Section 4: Files & Remarks */}
        <div style={styles.section}>
          <h3 style={styles.secTitle}>3. Documents & Remarks</h3>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Current Resume</label>
            {form.resume ? (
              <div style={styles.currentResumeBox}>
                <span style={styles.resumeName}>{getFileName(form.resume)}</span>
                <a
                  href={getFileUrl(form.resume)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.resumeViewBtn}
                >
                  View Current Resume
                </a>
              </div>
            ) : (
              <div style={styles.noResumeBox}>No resume uploaded</div>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Replace Resume (Optional)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              style={styles.input}
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            />
            {resumeFile && (
              <span style={styles.selectedFileText}>
                New selected resume: {resumeFile.name}
              </span>
            )}
          </div>
          <div style={{ ...styles.grid, marginTop: "15px" }}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Remark</label>
              <textarea
                name="remark"
                style={styles.textarea}
                value={form.remark || ""}
                onChange={handleChange}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Extra Details</label>
              <textarea
                name="extra_details"
                style={styles.textarea}
                value={form.extra_details || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <button type="submit" style={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Candidate Details"}
        </button>
      </form>
    </BaseLayout>
  );
}

const styles = {
  header: { marginBottom: "20px" },
  backBtn: {
    background: "#25343F",
    color: "#fff",
    border: "none",
    padding: "8px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  title: { margin: 0, color: "#25343F", fontSize: "24px", fontWeight: "800" },
  formContainer: { display: "flex", flexDirection: "column", gap: "20px" },
  section: {
    background: "#fff",
    padding: "20px",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  },
  secTitle: {
    fontSize: "14px",
    color: "#FF9B51",
    fontWeight: "800",
    marginBottom: "15px",
    borderBottom: "1px solid #f0f0f0",
    paddingBottom: "10px",
    textTransform: "uppercase",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
  },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "12px", fontWeight: "700", color: "#555" },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    outline: "none",
  },
  textarea: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    minHeight: "80px",
    outline: "none",
  },
  currentResumeBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    background: "#F8FAFC",
    flexWrap: "wrap",
  },
  resumeName: {
    color: "#25343F",
    fontSize: "13px",
    fontWeight: "700",
    wordBreak: "break-word",
  },
  resumeViewBtn: {
    background: "#25343F",
    color: "#fff",
    textDecoration: "none",
    padding: "7px 12px",
    borderRadius: "7px",
    fontSize: "12px",
    fontWeight: "700",
  },
  noResumeBox: {
    padding: "12px",
    border: "1px dashed #CBD5E1",
    borderRadius: "8px",
    background: "#F8FAFC",
    color: "#94A3B8",
    fontSize: "13px",
    fontWeight: "600",
  },
  selectedFileText: {
    color: "#16A34A",
    fontSize: "12px",
    fontWeight: "700",
  },
  submitBtn: {
    padding: "15px",
    background: "#FF9B51",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 5px 15px rgba(255,155,81,0.3)",
  },
};

export default UpdateCandidate;
