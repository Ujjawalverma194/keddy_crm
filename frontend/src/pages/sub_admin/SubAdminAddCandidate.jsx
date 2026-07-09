
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Briefcase,
  Check,
  ChevronLeft,
  Mail,
  Phone,
  Search,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { apiRequest } from "../../services/api";
import { asList } from "../../utils/apiHelpers";
import BaseLayout from "../components/SubAdminLayout";

const QUICK_RATE_TYPES = ["LPM", "KPM", "PHR", "USD_PH", "USD", "LPA"];
const EXTRA_RATE_TYPES = [
  { value: "", label: "More rate types" },
  { value: "EUR", label: "EUR (€)" },
  { value: "EUR_PH", label: "EUR/hr (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "GBP_PH", label: "GBP/hr (£)" },
  { value: "AED", label: "AED (UAE)" },
  { value: "SGD", label: "SGD (Singapore)" },
  { value: "SAR", label: "SAR (Saudi)" },
  { value: "CNY", label: "CNY (China)" },
  { value: "JPY", label: "JPY (Japan)" },
  { value: "AUD", label: "AUD (Australia)" },
  { value: "CAD", label: "CAD (Canada)" },
  { value: "CHF", label: "CHF (Swiss)" },
  { value: "HKD", label: "HKD (Hong Kong)" },
  { value: "THB", label: "THB (Thailand)" },
  { value: "MYR", label: "MYR (Malaysia)" },
  { value: "KRW", label: "KRW (S. Korea)" },
  { value: "NZD", label: "NZD (NZ)" },
  { value: "ZAR", label: "ZAR (S. Africa)" },
  { value: "KWD", label: "KWD (Kuwait)" },
  { value: "QAR", label: "QAR (Qatar)" },
];

function AddCandidate() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [form, setForm] = useState({
    candidate_name: "",
    candidate_email: "",
    candidate_number: "",
    skills: "",
    technology: "",
    years_of_experience_manual: "",
    years_of_experience_calculated: "",
    vendor: "",
    vendor_company_name: "",
    vendor_number: "",
    vendor_rate: "",
    vendor_rate_type: "",
    submitted_to: "",
    extra_details: "",
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [vendors, setVendors] = useState([]);
    // eslint-disable-next-line no-unused-vars
  const [employees, setEmployees] = useState([]);
  const [searchVendor, setSearchVendor] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  useEffect(() => {
    loadDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVendors(searchVendor);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchVendor]);

  const loadDropdowns = async () => {
    try {
      const empRes = await apiRequest("/employee-portal/api/employees/");
      setEmployees(asList(empRes));
      fetchVendors("");
    } catch (err) {
      console.error("Error loading dropdowns", err);
    }
  };

  const fetchVendors = async (query) => {
    try {
      const url = query
        ? `/employee-portal/api/user/vendors/?search=${encodeURIComponent(query)}`
        : "/employee-portal/api/user/vendors/";
      const res = await apiRequest(url);
      setVendors(res.results || []);
    } catch (err) {
      console.error("Vendor fetch error:", err);
    }
  };

  const notify = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    if (/^\d*\.?\d*$/.test(value)) {
      setForm({ ...form, [name]: value });
    }
  };

  const selectVendor = (v) => {
    setForm({
      ...form,
      vendor: v.id,
      vendor_company_name: v.company_name || v.companyName || v.name || "",
      vendor_number: v.number || v.phone || "",
    });
    setSearchVendor(`${v.name || "Vendor"}${v.company_name ? ` (${v.company_name})` : ""}`);
    setShowDropdown(false);
  };

  const handleRateTypeSelect = (type) => {
    setForm((prev) => ({ ...prev, vendor_rate_type: type }));
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;

    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);

    setResumeFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
    setIsParsing(true);

    const fd = new FormData();
    fd.append("resume", file);

    try {
      const res = await apiRequest(
        "/employee-portal/api/candidates/parse-resume/",
        "POST",
        fd,
      );

      if (res?.data) {
        setForm((prev) => ({
          ...prev,
          ...res.data,
          years_of_experience_calculated:
            res.data.years_of_experience_calculated ??
            prev.years_of_experience_calculated,
        }));
        notify(res.message || "Resume parsed successfully!");
      } else {
        notify(
          res?.detail || res?.error || "Could not extract details from resume",
          "error",
        );
      }
    } catch (err) {
      notify("Failed to parse resume", "error");
    }

    setIsParsing(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleResumeUpload(file);
  };

  const handleViewResume = (e) => {
    e.stopPropagation();
    if (!filePreviewUrl) return;
    window.open(filePreviewUrl, "_blank", "noopener,noreferrer");
  };

  const handleRemoveResume = (e) => {
    e.stopPropagation();
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setResumeFile(null);
    setFilePreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const rateLabel = (type) => (type === "USD_PH" ? "USD/HR" : type);

  const requiredMissing = {
    resume: !resumeFile,
    name: !form.candidate_name.trim(),
    technology: !form.technology.trim(),
    experience: !form.years_of_experience_manual.trim(),
    vendor: !form.vendor,
    rate: !form.vendor_rate.trim(),
    rateType: !form.vendor_rate_type,
  };

  const completedCount = 7 - Object.values(requiredMissing).filter(Boolean).length;

  const initials = useMemo(() => {
    const name = form.candidate_name.trim();
    if (!name) return "";
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }, [form.candidate_name]);

  const selectedQuickRate = QUICK_RATE_TYPES.includes(form.vendor_rate_type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);

    if (!resumeFile) {
      notify("Please upload resume", "error");
      return;
    }

    if (!form.candidate_name.trim()) {
      notify("Please enter candidate name", "error");
      return;
    }

    if (!form.technology.trim()) {
      notify("Please enter technology", "error");
      return;
    }

    if (!form.years_of_experience_manual.trim()) {
      notify("Please enter experience", "error");
      return;
    }

    if (!form.vendor) {
      notify("Please select vendor from dropdown", "error");
      return;
    }

    if (!form.vendor_rate.trim()) {
      notify("Please enter vendor rate", "error");
      return;
    }

    if (!form.vendor_rate_type) {
      notify("Please select rate type", "error");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const fd = new FormData();

    Object.keys(form).forEach((k) => {
      if (form[k] !== null && form[k] !== undefined && form[k] !== "") {
        fd.append(k, form[k]);
      }
    });

    if (resumeFile) fd.append("resume", resumeFile);

    try {
      const res = await apiRequest(
        "/employee-portal/api/candidates/create/",
        "POST",
        fd,
      );

      notify(res.message || "Candidate Created Successfully!");

      setTimeout(() => {
        navigate("/employee/user-candidates");
      }, 1500);
    } catch (err) {
      console.error("Candidate create error:", err);

      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        JSON.stringify(err?.response?.data) ||
        err?.message ||
        "Error creating candidate";

      notify(errorMsg, "error");
      setIsSubmitting(false);
    }
  };

  return (
    <BaseLayout>
      {toast.show && (
        <div
          style={{
            ...styles.toast,
            backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={styles.root}>
        <div style={styles.wrap}>
          <header style={styles.header}>
            <button onClick={() => navigate(-1)} style={styles.backBtn} type="button" aria-label="Back">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={styles.title}>Add candidate</h1>
              <p style={styles.subtitle}>Upload a resume, confirm the basics, pick a vendor, done.</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} style={styles.layout}>
            <main style={styles.formColumn}>
              <div
                style={{
                  ...styles.uploadDrop,
                  ...(isDragActive ? styles.uploadDropActive : {}),
                  ...(resumeFile ? styles.uploadDropDone : {}),
                  ...(showErrors && requiredMissing.resume ? styles.errorBorder : {}),
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={handleFileDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={styles.hiddenFileInput}
                  onChange={(e) => handleResumeUpload(e.target.files[0])}
                  required={!resumeFile}
                />
                <div style={{ ...styles.uploadIcon, ...(resumeFile ? styles.uploadIconDone : {}) }}>
                  {resumeFile ? <Check size={22} /> : <UploadCloud size={22} />}
                </div>
                <div style={styles.uploadTextWrap}>
                  <b style={styles.uploadTitle}>
                    {resumeFile
                      ? resumeFile.name.length > 34
                        ? `${resumeFile.name.slice(0, 32)}…`
                        : resumeFile.name
                      : "Upload resume"}
                  </b>
                  <span style={styles.uploadHint}>
                    {isParsing
                      ? "Parsing Resume..."
                      : resumeFile
                        ? "Attached — name, skills & details auto-filled"
                        : "PDF or Word · we read the details for you"}
                  </span>
                  {resumeFile && (
                    <div style={styles.resumeActions}>
                      <button type="button" style={styles.viewResumeBtn} onClick={handleViewResume}>
                        View Resume
                      </button>
                      <button type="button" style={styles.removeResumeBtn} onClick={handleRemoveResume}>
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <section style={styles.card}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Sparkles size={18} /></div>
                  <div>
                    <h2 style={styles.sectionTitle}>Candidate</h2>
                    <p style={styles.sectionSub}>The basics about the person.</p>
                  </div>
                </div>

                <div style={styles.grid}>
                  <div style={{ ...styles.field, gridColumn: "span 6" }}>
                    <label style={styles.label}>Full name <span style={styles.requiredDot} /></label>
                    <input
                      name="candidate_name"
                      value={form.candidate_name}
                      onChange={handleChange}
                      placeholder="e.g. Aanya Sharma"
                      style={{ ...styles.input, ...(showErrors && requiredMissing.name ? styles.inputError : {}) }}
                      required
                    />
                  </div>

                  <div style={{ ...styles.field, gridColumn: "span 4" }}>
                    <label style={styles.label}>Technology <span style={styles.requiredDot} /></label>
                    <input
                      name="technology"
                      value={form.technology}
                      onChange={handleChange}
                      placeholder="Java, Python…"
                      style={{ ...styles.input, ...(showErrors && requiredMissing.technology ? styles.inputError : {}) }}
                      required
                    />
                  </div>

                  <div style={{ ...styles.field, gridColumn: "span 2" }}>
                    <label style={styles.label}>Exp&nbsp;(yrs) <span style={styles.requiredDot} /></label>
                    <input
                      name="years_of_experience_manual"
                      value={form.years_of_experience_manual}
                      onChange={handleNumericChange}
                      placeholder="3.5"
                      inputMode="decimal"
                      style={{ ...styles.input, ...(showErrors && requiredMissing.experience ? styles.inputError : {}) }}
                      required
                    />
                  </div>

                  <div style={{ ...styles.field, gridColumn: "span 6" }}>
                    <label style={styles.label}>Email <span style={styles.optionalBadge}>optional</span></label>
                    <div style={styles.inputIconWrap}>
                      <Mail size={16} style={styles.inputIcon} />
                      <input
                        name="candidate_email"
                        value={form.candidate_email}
                        onChange={handleChange}
                        placeholder="name@email.com"
                        type="email"
                        style={{ ...styles.input, ...styles.inputWithIcon }}
                      />
                    </div>
                  </div>

                  <div style={{ ...styles.field, gridColumn: "span 6" }}>
                    <label style={styles.label}>Phone <span style={styles.optionalBadge}>optional</span></label>
                    <div style={styles.inputIconWrap}>
                      <Phone size={16} style={styles.inputIcon} />
                      <input
                        name="candidate_number"
                        value={form.candidate_number}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        inputMode="tel"
                        style={{ ...styles.input, ...styles.inputWithIcon }}
                      />
                    </div>
                  </div>
                </div>

                <input type="hidden" name="skills" value={form.skills || ""} readOnly />
                <input
                  type="hidden"
                  name="years_of_experience_calculated"
                  value={form.years_of_experience_calculated || ""}
                  readOnly
                />
              </section>

              <section style={styles.card}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><BadgeCheck size={18} /></div>
                  <div>
                    <h2 style={styles.sectionTitle}>Vendor &amp; rate</h2>
                    <p style={styles.sectionSub}>Pick a vendor — company &amp; contact fill in for you.</p>
                  </div>
                </div>

                <div style={styles.grid}>
                  <div style={{ ...styles.field, gridColumn: "span 7" }}>
                    <label style={styles.label}>Search &amp; select vendor <span style={styles.requiredDot} /></label>
                    <div style={styles.comboWrap}>
                      <div style={styles.inputIconWrap}>
                        <Search size={16} style={styles.inputIcon} />
                        <input
                          placeholder="Type a vendor or company…"
                          value={searchVendor}
                          onChange={(e) => {
                            setSearchVendor(e.target.value);
                            setShowDropdown(true);
                            setForm((prev) => ({
                              ...prev,
                              vendor: "",
                              vendor_company_name: "",
                              vendor_number: "",
                            }));
                          }}
                          onFocus={() => setShowDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDropdown(false), 300)}
                          style={{
                            ...styles.input,
                            ...styles.inputWithIcon,
                            ...(showErrors && requiredMissing.vendor ? styles.inputError : {}),
                          }}
                          autoComplete="off"
                          required
                        />
                      </div>

                      {showDropdown && (
                        <div style={styles.dropdownList}>
                          {vendors.length ? (
                            vendors.map((v) => (
                              <div key={v.id} onMouseDown={() => selectVendor(v)} style={styles.dropdownItem}>
                                <b style={styles.dropdownTitle}>{v.name || "Vendor"}</b>
                                <span style={styles.dropdownSub}>
                                  {v.company_name || "No company name"}{v.number || v.phone ? ` · ${v.number || v.phone}` : ""}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div style={styles.noVendor}>No vendors found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ ...styles.field, gridColumn: "span 5" }}>
                    <label style={styles.label}>Vendor rate <span style={styles.requiredDot} /></label>
                    <input
                      name="vendor_rate"
                      value={form.vendor_rate}
                      onChange={handleNumericChange}
                      placeholder="Enter rate"
                      inputMode="decimal"
                      style={{ ...styles.input, ...(showErrors && requiredMissing.rate ? styles.inputError : {}) }}
                      required
                    />
                  </div>

                  <div style={{ ...styles.field, gridColumn: "span 12" }}>
                    <label style={styles.label}>Rate type <span style={styles.requiredDot} /></label>
                    <div style={styles.rateChips}>
                      {QUICK_RATE_TYPES.map((type) => (
                        <button
                          type="button"
                          key={type}
                          onClick={() => handleRateTypeSelect(type)}
                          style={{
                            ...styles.rateChip,
                            ...(form.vendor_rate_type === type ? styles.rateChipActive : {}),
                            ...(showErrors && requiredMissing.rateType ? styles.rateChipError : {}),
                          }}
                        >
                          {rateLabel(type)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ ...styles.field, gridColumn: "span 12" }}>
                    <label style={styles.label}>Other rate types <span style={styles.optionalBadge}>optional</span></label>
                    <select
                      name="vendor_rate_type"
                      value={selectedQuickRate ? "" : form.vendor_rate_type}
                      onChange={(e) => handleRateTypeSelect(e.target.value)}
                      style={styles.selectInput}
                    >
                      {EXTRA_RATE_TYPES.map((item) => (
                        <option key={item.value || "blank"} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ gridColumn: "span 12" }}>
                    <div style={styles.autoBox}>
                      <div style={styles.autoTitle}><BadgeCheck size={13} /> Auto-filled from vendor</div>
                      <div style={styles.autoGrid}>
                        <div style={{ ...styles.autoValue, ...(form.vendor_company_name ? styles.autoValueFilled : {}) }}>
                          <span style={styles.autoKey}>Vendor company</span>
                          {form.vendor_company_name || "Select a vendor"}
                        </div>
                        <div style={{ ...styles.autoValue, ...(form.vendor_number ? styles.autoValueFilled : {}) }}>
                          <span style={styles.autoKey}>Vendor contact</span>
                          {form.vendor_number || "Select a vendor"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </main>

            <aside style={styles.previewColumn}>
              <div style={styles.previewCard}>
                <div style={styles.previewTopBar} />
                <div style={styles.previewBody}>
                  <div style={styles.previewEyebrow}>Live preview</div>
                  <div style={styles.previewIdentity}>
                    <div style={initials ? styles.avatar : styles.avatarEmpty}>{initials || "•"}</div>
                    <div style={styles.previewIdentityText}>
                      <div style={form.candidate_name.trim() ? styles.previewName : styles.previewNameEmpty}>
                        {form.candidate_name.trim() || "New candidate"}
                      </div>
                      <div style={styles.previewTech}>{form.technology.trim() || "Technology will show here"}</div>
                    </div>
                  </div>

                  <div style={styles.previewRows}>
                    <div style={styles.previewRow}>
                      <span style={styles.previewKey}><Briefcase size={15} /> Experience</span>
                      <span style={form.years_of_experience_manual ? styles.previewVal : styles.previewValEmpty}>
                        {form.years_of_experience_manual ? `${form.years_of_experience_manual} yrs` : "—"}
                      </span>
                    </div>
                    <div style={styles.previewRow}>
                      <span style={styles.previewKey}><BadgeCheck size={15} /> Vendor</span>
                      <span style={form.vendor_company_name ? styles.previewVal : styles.previewValEmpty}>
                        {form.vendor_company_name || "—"}
                      </span>
                    </div>
                    <div style={styles.previewRow}>
                      <span style={styles.previewKey}><span style={styles.rupeeIcon}>₹</span> Rate</span>
                      <span style={form.vendor_rate && form.vendor_rate_type ? styles.previewVal : styles.previewValEmpty}>
                        {form.vendor_rate && form.vendor_rate_type
                          ? `${form.vendor_rate} ${rateLabel(form.vendor_rate_type)}`
                          : form.vendor_rate || "—"}
                      </span>
                    </div>
                    <div style={styles.previewRow}>
                      <span style={styles.previewKey}><Sparkles size={15} /> Skills</span>
                      <span style={{ ...styles.previewValEmpty, fontStyle: "italic" }}>
                        {form.skills || "Auto-detected"}
                      </span>
                    </div>
                  </div>

                  {(form.candidate_email.trim() || form.candidate_number.trim()) && (
                    <div style={styles.contactLines}>
                      {form.candidate_email.trim() && (
                        <div style={styles.contactLine}><Mail size={15} /> {form.candidate_email}</div>
                      )}
                      {form.candidate_number.trim() && (
                        <div style={styles.contactLine}><Phone size={15} /> {form.candidate_number}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <div style={styles.actionBar}>
              <div>
                <div style={{ ...styles.progressText, ...(showErrors && completedCount < 7 ? styles.progressTextError : {}) }}>
                  {showErrors && completedCount < 7 ? "Fill all required fields — " : ""}
                  <b style={styles.progressBold}>{completedCount}</b> / 7 required done
                </div>
                <div style={styles.progressTrack}>
                  <span style={{ ...styles.progressFill, width: `${(completedCount / 7) * 100}%` }} />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ ...styles.submitBtn, ...(isSubmitting ? styles.submitBtnDisabled : {}) }}
              >
                {isSubmitting ? "Adding..." : "Add candidate"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </BaseLayout>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#F5F5F7",
    color: "#1D1D1F",
    padding: "26px 18px 120px",
    fontFamily: "Inter, system-ui, sans-serif",
    WebkitFontSmoothing: "antialiased",
  },
  wrap: {
    maxWidth: "1080px",
    margin: "0 auto",
  },
  toast: {
    position: "fixed",
    top: "85px",
    right: "20px",
    color: "#fff",
    padding: "12px 25px",
    borderRadius: "10px",
    zIndex: 9999,
    fontWeight: "700",
    boxShadow: "0 12px 25px rgba(0,0,0,0.16)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "22px",
  },
  backBtn: {
    display: "grid",
    placeItems: "center",
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "#FFFFFF",
    border: "1px solid #EBEBF0",
    color: "#1D1D1F",
    cursor: "pointer",
    flex: "0 0 auto",
  },
  title: {
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "26px",
    margin: 0,
    letterSpacing: "-0.6px",
    color: "#1D1D1F",
  },
  subtitle: {
    margin: "3px 0 0",
    color: "#86868B",
    fontSize: "13.5px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 350px",
    gap: "22px",
    alignItems: "start",
  },
  formColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    minWidth: 0,
  },
  previewColumn: {
    position: "sticky",
    top: "20px",
  },
  card: {
    background: "#FFFFFF",
    border: "1px solid #EBEBF0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 1px 3px rgba(0,0,0,.03),0 14px 36px -20px rgba(0,0,0,.16)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    marginBottom: "18px",
  },
  sectionIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "11px",
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    background: "#FFF0E7",
    color: "#D2520F",
  },
  sectionTitle: {
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: "17px",
    margin: 0,
    letterSpacing: "-0.3px",
    color: "#1D1D1F",
  },
  sectionSub: {
    margin: "1px 0 0",
    fontSize: "12.5px",
    color: "#86868B",
  },
  uploadDrop: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    cursor: "pointer",
    border: "1.5px dashed #DEDEE4",
    borderRadius: "14px",
    padding: "18px",
    background: "#FFFFFF",
    transition: "all .18s ease",
    boxShadow: "0 1px 3px rgba(0,0,0,.03),0 14px 36px -20px rgba(0,0,0,.16)",
  },
  uploadDropActive: {
    borderColor: "#FF6A2B",
    background: "#FFF0E7",
  },
  uploadDropDone: {
    borderStyle: "solid",
    borderColor: "#34C759",
    background: "#F1FBF3",
  },
  errorBorder: {
    borderColor: "#FF453A",
    boxShadow: "0 0 0 4px #FFE9E7",
  },
  hiddenFileInput: {
    display: "none",
  },
  uploadIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    background: "#FFF0E7",
    color: "#D2520F",
  },
  uploadIconDone: {
    background: "#DCF6E2",
    color: "#1E9E47",
  },
  uploadTextWrap: {
    minWidth: 0,
  },
  uploadTitle: {
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontSize: "14.5px",
    display: "block",
    letterSpacing: "-0.2px",
    color: "#1D1D1F",
  },
  uploadHint: {
    color: "#86868B",
    fontSize: "12.5px",
  },
  resumeActions: {
    display: "flex",
    gap: "8px",
    marginTop: "10px",
    flexWrap: "wrap",
  },
  viewResumeBtn: {
    border: "1px solid #FFDAC8",
    background: "#FFF0E7",
    color: "#D2520F",
    padding: "7px 10px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  removeResumeBtn: {
    border: "1px solid #EBEBF0",
    background: "#fff",
    color: "#FF453A",
    padding: "7px 10px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gap: "15px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minWidth: 0,
  },
  label: {
    fontSize: "12.5px",
    fontWeight: 600,
    color: "#1D1D1F",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    letterSpacing: "-0.1px",
  },
  requiredDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#FF6A2B",
    display: "inline-block",
  },
  optionalBadge: {
    fontWeight: 500,
    color: "#86868B",
    fontSize: "11px",
    background: "#F5F5F7",
    border: "1px solid #EBEBF0",
    padding: "1px 7px",
    borderRadius: "7px",
  },
  input: {
    width: "100%",
    border: "1.5px solid #EBEBF0",
    background: "#FFFFFF",
    borderRadius: "14px",
    padding: "13px 15px",
    fontSize: "15px",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#1D1D1F",
    transition: "all .15s ease",
    outline: "none",
    boxSizing: "border-box",
  },
  inputError: {
    borderColor: "#FF453A",
    boxShadow: "0 0 0 4px #FFE9E7",
  },
  inputIconWrap: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#86868B",
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: "42px",
  },
  comboWrap: {
    position: "relative",
  },
  dropdownList: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    background: "#fff",
    zIndex: 30,
    border: "1px solid #EBEBF0",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,.25)",
    maxHeight: "240px",
    overflowY: "auto",
  },
  dropdownItem: {
    padding: "12px 15px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #F5F5F7",
  },
  dropdownTitle: {
    fontWeight: 600,
    fontSize: "14px",
    color: "#1D1D1F",
  },
  dropdownSub: {
    color: "#86868B",
    fontSize: "12.5px",
    textAlign: "right",
  },
  noVendor: {
    padding: "14px 15px",
    color: "#86868B",
    fontSize: "13px",
  },
  rateChips: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "8px",
  },
  rateChip: {
    border: "1.5px solid #EBEBF0",
    background: "#FFFFFF",
    cursor: "pointer",
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: "13px",
    color: "#1D1D1F",
    padding: "11px 4px",
    borderRadius: "12px",
    transition: "all .14s ease",
    textAlign: "center",
  },
  rateChipActive: {
    background: "#1D1D1F",
    borderColor: "#1D1D1F",
    color: "#fff",
    transform: "translateY(-1px)",
  },
  rateChipError: {
    borderColor: "#FFC9C4",
  },
  selectInput: {
    width: "100%",
    border: "1.5px solid #EBEBF0",
    background: "#FFFFFF",
    borderRadius: "14px",
    padding: "13px 15px",
    fontSize: "15px",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#1D1D1F",
    outline: "none",
    boxSizing: "border-box",
  },
  autoBox: {
    background: "#F5F5F7",
    border: "1px solid #EBEBF0",
    borderRadius: "16px",
    padding: "15px 16px",
  },
  autoTitle: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.4px",
    textTransform: "uppercase",
    color: "#86868B",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "12px",
  },
  autoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "13px",
  },
  autoValue: {
    background: "#fff",
    border: "1px solid #EBEBF0",
    borderRadius: "11px",
    padding: "11px 13px",
    fontSize: "13.5px",
    color: "#B4B4BD",
  },
  autoValueFilled: {
    color: "#1D1D1F",
    fontWeight: 500,
  },
  autoKey: {
    display: "block",
    fontSize: "11px",
    color: "#86868B",
    marginBottom: "3px",
    fontWeight: 600,
  },
  previewCard: {
    background: "#FFFFFF",
    border: "1px solid #EBEBF0",
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,.03),0 14px 36px -20px rgba(0,0,0,.16)",
  },
  previewTopBar: {
    height: "6px",
    background: "linear-gradient(90deg,#FF6A2B,#FF8A3D)",
  },
  previewBody: {
    padding: "24px 22px",
  },
  previewEyebrow: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#86868B",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "18px",
    borderBottom: "1px solid #EBEBF0",
    paddingBottom: "12px",
  },
  previewIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  avatar: {
    width: "50px",
    height: "50px",
    borderRadius: "15px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "18px",
    color: "#fff",
    letterSpacing: "0.5px",
    background: "linear-gradient(135deg,#FF6A2B,#E8502E)",
  },
  avatarEmpty: {
    width: "50px",
    height: "50px",
    borderRadius: "15px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "18px",
    background: "#F5F5F7",
    color: "#DEDEE4",
    border: "1.5px dashed #DEDEE4",
  },
  previewIdentityText: {
    minWidth: 0,
  },
  previewName: {
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: "19px",
    letterSpacing: "-0.4px",
    lineHeight: 1.15,
    color: "#1D1D1F",
  },
  previewNameEmpty: {
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: "19px",
    letterSpacing: "-0.4px",
    lineHeight: 1.15,
    color: "#DEDEE4",
  },
  previewTech: {
    fontSize: "13px",
    color: "#86868B",
    marginTop: "3px",
  },
  previewRows: {
    display: "flex",
    flexDirection: "column",
    marginTop: "20px",
    border: "1px solid #EBEBF0",
    borderRadius: "14px",
    overflow: "hidden",
  },
  previewRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "12px 14px",
    fontSize: "13.5px",
    borderBottom: "1px solid #EBEBF0",
  },
  previewKey: {
    color: "#86868B",
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },
  previewVal: {
    fontWeight: 600,
    textAlign: "right",
    color: "#1D1D1F",
  },
  previewValEmpty: {
    color: "#DEDEE4",
    fontWeight: 500,
    textAlign: "right",
  },
  rupeeIcon: {
    width: "15px",
    textAlign: "center",
    fontWeight: 700,
  },
  contactLines: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "14px",
  },
  contactLine: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontSize: "13px",
    color: "#1D1D1F",
  },
  actionBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    background: "rgba(255,255,255,.86)",
    backdropFilter: "saturate(180%) blur(14px)",
    borderTop: "1px solid #EBEBF0",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px",
  },
  progressText: {
    fontSize: "13px",
    color: "#86868B",
  },
  progressTextError: {
    color: "#FF453A",
  },
  progressBold: {
    color: "#1D1D1F",
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
  },
  progressTrack: {
    height: "6px",
    width: "130px",
    background: "#EBEBF0",
    borderRadius: "99px",
    overflow: "hidden",
    marginTop: "6px",
  },
  progressFill: {
    display: "block",
    height: "100%",
    background: "linear-gradient(90deg,#FF6A2B,#FF8A3D)",
    borderRadius: "99px",
    transition: "width .35s ease",
  },
  submitBtn: {
    border: "none",
    cursor: "pointer",
    color: "#fff",
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: "15px",
    padding: "14px 34px",
    borderRadius: "15px",
    background: "linear-gradient(135deg,#FF6A2B,#E8502E)",
    boxShadow: "0 10px 24px -10px rgba(232,80,46,.75)",
    transition: "transform .15s, box-shadow .15s",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
  },
  submitBtnDisabled: {
    background: "#BFC9D1",
    cursor: "not-allowed",
    boxShadow: "none",
  },
};

export default AddCandidate;




// import React, { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import { asList } from "../../utils/apiHelpers";
// import BaseLayout from "../components/emp_base";

// const QUICK_RATE_TYPES = ["LPM", "KPM", "PHR", "USD_PH", "USD", "LPA"];
// const EXTRA_RATE_TYPES = [
//   { value: "", label: "More rate types" },
//   { value: "EUR", label: "EUR (€)" },
//   { value: "EUR_PH", label: "EUR/hr (€)" },
//   { value: "GBP", label: "GBP (£)" },
//   { value: "GBP_PH", label: "GBP/hr (£)" },
//   { value: "AED", label: "AED (UAE)" },
//   { value: "SGD", label: "SGD (Singapore)" },
//   { value: "SAR", label: "SAR (Saudi)" },
//   { value: "CNY", label: "CNY (China)" },
//   { value: "JPY", label: "JPY (Japan)" },
//   { value: "AUD", label: "AUD (Australia)" },
//   { value: "CAD", label: "CAD (Canada)" },
//   { value: "CHF", label: "CHF (Swiss)" },
//   { value: "HKD", label: "HKD (Hong Kong)" },
//   { value: "THB", label: "THB (Thailand)" },
//   { value: "MYR", label: "MYR (Malaysia)" },
//   { value: "KRW", label: "KRW (S. Korea)" },
//   { value: "NZD", label: "NZD (NZ)" },
//   { value: "ZAR", label: "ZAR (S. Africa)" },
//   { value: "KWD", label: "KWD (Kuwait)" },
//   { value: "QAR", label: "QAR (Qatar)" },
// ];

// function AddCandidate() {
//   const navigate = useNavigate();
//   const fileInputRef = useRef(null);

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isDragActive, setIsDragActive] = useState(false);

//   const [form, setForm] = useState({
//     candidate_name: "",
//     candidate_email: "",
//     candidate_number: "",
//     skills: "",
//     technology: "",
//     years_of_experience_manual: "",
//     years_of_experience_calculated: "",
//     vendor: "",
//     vendor_company_name: "",
//     vendor_number: "",
//     vendor_rate: "",
//     vendor_rate_type: "",
//     submitted_to: "",
//     extra_details: "",
//   });

//   const [resumeFile, setResumeFile] = useState(null);
//   const [filePreviewUrl, setFilePreviewUrl] = useState("");
//   const [vendors, setVendors] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [searchVendor, setSearchVendor] = useState("");
//   const [isParsing, setIsParsing] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//   useEffect(() => {
//     loadDropdowns();
//   }, []);

//   useEffect(() => {
//     return () => {
//       if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
//     };
//   }, [filePreviewUrl]);

//   useEffect(() => {
//     const delayDebounceFn = setTimeout(() => {
//       fetchVendors(searchVendor);
//     }, 500);
//     return () => clearTimeout(delayDebounceFn);
//   }, [searchVendor]);

//   const loadDropdowns = async () => {
//     try {
//       const empRes = await apiRequest("/employee-portal/api/employees/");
//       setEmployees(asList(empRes));
//       fetchVendors("");
//     } catch (err) {
//       console.error("Error loading dropdowns", err);
//     }
//   };

//   const fetchVendors = async (query) => {
//     try {
//       const url = query
//         ? `/employee-portal/api/user/vendors/?search=${encodeURIComponent(query)}`
//         : "/employee-portal/api/user/vendors/";
//       const res = await apiRequest(url);
//       setVendors(res.results || []);
//     } catch (err) {
//       console.error("Vendor fetch error:", err);
//     }
//   };

//   const notify = (msg, type = "success") => {
//     setToast({ show: true, msg, type });
//     setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//   };

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleNumericChange = (e) => {
//     const { name, value } = e.target;
//     if (/^\d*\.?\d*$/.test(value)) {
//       setForm({ ...form, [name]: value });
//     }
//   };

//   const selectVendor = (v) => {
//     setForm({
//       ...form,
//       vendor: v.id,
//       vendor_company_name: v.company_name || v.companyName || v.name || "",
//       vendor_number: v.number || v.phone || "",
//     });
//     setSearchVendor(`${v.name || "Vendor"}${v.company_name ? ` (${v.company_name})` : ""}`);
//     setShowDropdown(false);
//   };

//   const handleRateTypeSelect = (type) => {
//     setForm((prev) => ({ ...prev, vendor_rate_type: type }));
//   };

//   const handleResumeUpload = async (file) => {
//     if (!file) return;

//     if (filePreviewUrl) {
//       URL.revokeObjectURL(filePreviewUrl);
//     }

//     setResumeFile(file);
//     setFilePreviewUrl(URL.createObjectURL(file));
//     setIsParsing(true);

//     const fd = new FormData();
//     fd.append("resume", file);

//     try {
//       const res = await apiRequest(
//         "/employee-portal/api/candidates/parse-resume/",
//         "POST",
//         fd,
//       );

//       if (res?.data) {
//         setForm((prev) => ({
//           ...prev,
//           ...res.data,
//           years_of_experience_calculated:
//             res.data.years_of_experience_calculated ??
//             prev.years_of_experience_calculated,
//         }));
//         notify(res.message || "Resume parsed successfully!");
//       } else {
//         notify(
//           res?.detail || res?.error || "Could not extract details from resume",
//           "error",
//         );
//       }
//     } catch (err) {
//       notify("Failed to parse resume", "error");
//     }

//     setIsParsing(false);
//   };

//   const handleFileDrop = (e) => {
//     e.preventDefault();
//     setIsDragActive(false);
//     const file = e.dataTransfer.files?.[0];
//     handleResumeUpload(file);
//   };

//   const handleViewResume = (e) => {
//     e.stopPropagation();
//     if (!filePreviewUrl) return;
//     window.open(filePreviewUrl, "_blank", "noopener,noreferrer");
//   };

//   const handleRemoveResume = (e) => {
//     e.stopPropagation();
//     if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
//     setResumeFile(null);
//     setFilePreviewUrl("");
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!resumeFile) {
//       notify("Please upload resume", "error");
//       return;
//     }

//     if (!form.vendor) {
//       notify("Please select vendor from dropdown", "error");
//       return;
//     }

//     if (!form.vendor_rate_type) {
//       notify("Please select rate type", "error");
//       return;
//     }

//     if (isSubmitting) return;
//     setIsSubmitting(true);

//     const fd = new FormData();

//     Object.keys(form).forEach((k) => {
//       if (form[k] !== null && form[k] !== undefined && form[k] !== "") {
//         fd.append(k, form[k]);
//       }
//     });

//     if (resumeFile) fd.append("resume", resumeFile);

//     try {
//       const res = await apiRequest(
//         "/employee-portal/api/candidates/create/",
//         "POST",
//         fd,
//       );

//       notify(res.message || "Candidate Created Successfully!");

//       setTimeout(() => {
//         navigate("/employee/user-candidates");
//       }, 1500);
//     } catch (err) {
//       console.error("Candidate create error:", err);

//       const errorMsg =
//         err?.response?.data?.detail ||
//         err?.response?.data?.error ||
//         JSON.stringify(err?.response?.data) ||
//         err?.message ||
//         "Error creating candidate";

//       notify(errorMsg, "error");
//       setIsSubmitting(false);
//     }
//   };

//   const completionItems = [
//     resumeFile,
//     form.candidate_name,
//     form.technology,
//     form.years_of_experience_manual,
//     form.vendor,
//     form.vendor_rate,
//     form.vendor_rate_type,
//   ];
//   const completedCount = completionItems.filter(Boolean).length;

//   const inputFocus = (e) => {
//     e.currentTarget.style.borderColor = "#FF9B51";
//     e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,155,81,0.14)";
//     e.currentTarget.style.background = "#fff";
//   };

//   const inputBlur = (e) => {
//     e.currentTarget.style.borderColor = "#D8E0E7";
//     e.currentTarget.style.boxShadow = "none";
//     e.currentTarget.style.background = "#FAFBFC";
//   };

//   const rateLabel = (type) => (type === "USD_PH" ? "USD/HR" : type);

//   return (
//     <BaseLayout>
//       {toast.show && (
//         <div
//           style={{
//             ...styles.toast,
//             backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60",
//           }}
//         >
//           {toast.msg}
//         </div>
//       )}

//       <div style={styles.pageShell}>
//         <div style={styles.header}>
//           <button onClick={() => navigate(-1)} style={styles.backBtn}>
//             ← Back
//           </button>
//           <div>
//             <h2 style={styles.title}>Add New Candidate</h2>
//             <p style={styles.subtitle}>
//               Upload resume, verify candidate details, choose vendor rate and submit.
//             </p>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} style={styles.container}>
//           <div style={styles.leftRail}>
//             <div
//               style={{
//                 ...styles.uploadCard,
//                 ...(isDragActive ? styles.uploadCardActive : {}),
//                 ...(resumeFile ? styles.uploadCardDone : {}),
//               }}
//               onClick={() => fileInputRef.current?.click()}
//               onDragOver={(e) => {
//                 e.preventDefault();
//                 setIsDragActive(true);
//               }}
//               onDragLeave={() => setIsDragActive(false)}
//               onDrop={handleFileDrop}
//             >
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept=".pdf,.doc,.docx"
//                 style={{ display: "none" }}
//                 onChange={(e) => handleResumeUpload(e.target.files[0])}
//                 required
//               />
//               <div style={styles.uploadIcon}>{resumeFile ? "✓" : "📄"}</div>
//               <strong style={styles.uploadTitle}>
//                 Resume Upload <span style={styles.requiredStar}>*</span>
//               </strong>
//               <span style={styles.uploadHint}>
//                 {resumeFile
//                   ? resumeFile.name
//                   : "Click or drop resume here · PDF / DOC / DOCX"}
//               </span>
//               {isParsing && <p style={styles.parsingText}>Parsing Resume...</p>}

//               {resumeFile && (
//                 <div style={styles.resumeActions}>
//                   <button
//                     type="button"
//                     style={styles.viewResumeBtn}
//                     onClick={handleViewResume}
//                   >
//                     View Resume
//                   </button>
//                   <button
//                     type="button"
//                     style={styles.removeResumeBtn}
//                     onClick={handleRemoveResume}
//                   >
//                     Remove
//                   </button>
//                 </div>
//               )}
//             </div>

//             <div style={styles.liveCard}>
//               <div style={styles.liveTitle}>LIVE PROFILE</div>
//               <div style={styles.avatarBox}>
//                 {form.candidate_name?.trim()
//                   ? form.candidate_name.trim().charAt(0).toUpperCase()
//                   : "+"}
//               </div>
//               <div style={styles.liveName}>
//                 {form.candidate_name || "New candidate"}
//               </div>
//               <div style={styles.liveSub}>
//                 {form.technology || "Technology will appear here"}
//               </div>
//               <div style={styles.liveRows}>
//                 <div style={styles.liveRow}>
//                   <span>Experience</span>
//                   <b>{form.years_of_experience_manual || "—"}</b>
//                 </div>
//                 <div style={styles.liveRow}>
//                   <span>Vendor</span>
//                   <b>{form.vendor_company_name || "—"}</b>
//                 </div>
//                 <div style={styles.liveRow}>
//                   <span>Rate</span>
//                   <b>
//                     {form.vendor_rate
//                       ? `${form.vendor_rate} ${rateLabel(form.vendor_rate_type)}`
//                       : "—"}
//                   </b>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div style={styles.mainPanel}>
//             <section style={styles.section}>
//               <div style={styles.sectionHeader}>
//                 <div style={styles.stepBadge}>1</div>
//                 <div>
//                   <h3 style={styles.secTitle}>Candidate Details</h3>
//                   <p style={styles.secSubTitle}>Review or update parsed candidate information.</p>
//                 </div>
//               </div>

//               <div style={styles.compactGrid}>
//                 <div style={{ ...styles.inputGroup, gridColumn: "span 5" }}>
//                   <label style={styles.label}>Full Name <span style={styles.requiredStar}>*</span></label>
//                   <input
//                     name="candidate_name"
//                     value={form.candidate_name}
//                     onChange={handleChange}
//                     onFocus={inputFocus}
//                     onBlur={inputBlur}
//                     placeholder="e.g. Aanya Sharma"
//                     style={styles.input}
//                     required
//                   />
//                 </div>

//                 <div style={{ ...styles.inputGroup, gridColumn: "span 5" }}>
//                   <label style={styles.label}>Technology <span style={styles.requiredStar}>*</span></label>
//                   <input
//                     name="technology"
//                     value={form.technology}
//                     onChange={handleChange}
//                     onFocus={inputFocus}
//                     onBlur={inputBlur}
//                     placeholder="Java, Python, Node..."
//                     style={styles.input}
//                     required
//                   />
//                 </div>

//                 <div style={{ ...styles.inputGroup, gridColumn: "span 2" }}>
//                   <label style={styles.label}>Exp (Yrs) <span style={styles.requiredStar}>*</span></label>
//                   <input
//                     name="years_of_experience_manual"
//                     value={form.years_of_experience_manual}
//                     onChange={handleNumericChange}
//                     onFocus={inputFocus}
//                     onBlur={inputBlur}
//                     placeholder="3.5"
//                     style={styles.input}
//                     inputMode="decimal"
//                     required
//                   />
//                 </div>

//                 <div style={{ ...styles.inputGroup, gridColumn: "span 6" }}>
//                   <label style={styles.label}>Email</label>
//                   <input
//                     name="candidate_email"
//                     value={form.candidate_email}
//                     onChange={handleChange}
//                     onFocus={inputFocus}
//                     onBlur={inputBlur}
//                     placeholder="candidate@email.com"
//                     style={styles.input}
//                   />
//                 </div>

//                 <div style={{ ...styles.inputGroup, gridColumn: "span 6" }}>
//                   <label style={styles.label}>Phone Number</label>
//                   <input
//                     name="candidate_number"
//                     value={form.candidate_number}
//                     onChange={handleChange}
//                     onFocus={inputFocus}
//                     onBlur={inputBlur}
//                     placeholder="+91 98765 43210"
//                     style={styles.input}
//                   />
//                 </div>
//               </div>

//               {/* Hidden in UI but preserved in state and submitted to backend */}
//               <input type="hidden" name="skills" value={form.skills || ""} readOnly />
//               <input
//                 type="hidden"
//                 name="years_of_experience_calculated"
//                 value={form.years_of_experience_calculated || ""}
//                 readOnly
//               />
//             </section>

//             <section style={styles.section}>
//               <div style={styles.sectionHeader}>
//                 <div style={styles.stepBadge}>2</div>
//                 <div>
//                   <h3 style={styles.secTitle}>Vendor & Rate</h3>
//                   <p style={styles.secSubTitle}>
//                     Fill manual fields first. Vendor company and contact auto-fill after selection.
//                   </p>
//                 </div>
//               </div>

//               <div style={styles.vendorGrid}>
//                 <div style={{ ...styles.inputGroup, position: "relative", gridColumn: "span 4" }}>
//                   <label style={styles.label}>Search & Select Vendor <span style={styles.requiredStar}>*</span></label>
//                   <input
//                     placeholder="Search vendor name/company..."
//                     value={searchVendor}
//                     onChange={(e) => {
//                       setSearchVendor(e.target.value);
//                       setShowDropdown(true);
//                       setForm((prev) => ({
//                         ...prev,
//                         vendor: "",
//                         vendor_company_name: "",
//                         vendor_number: "",
//                       }));
//                     }}
//                     onFocus={(e) => {
//                       inputFocus(e);
//                       setShowDropdown(true);
//                     }}
//                     onBlur={(e) => {
//                       inputBlur(e);
//                       setTimeout(() => setShowDropdown(false), 300);
//                     }}
//                     style={styles.input}
//                     autoComplete="off"
//                     required
//                   />

//                   {showDropdown && (
//                     <div style={styles.dropdownList}>
//                       {vendors.length ? (
//                         vendors.map((v) => (
//                           <div
//                             key={v.id}
//                             onMouseDown={() => selectVendor(v)}
//                             style={styles.dropdownItem}
//                           >
//                             <strong>{v.name}</strong>
//                             <span>{v.company_name || "No company name"}</span>
//                           </div>
//                         ))
//                       ) : (
//                         <div style={styles.noVendor}>No vendors found</div>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 <div style={{ ...styles.inputGroup, gridColumn: "span 3" }}>
//                   <label style={styles.label}>Vendor Rate <span style={styles.requiredStar}>*</span></label>
//                   <input
//                     name="vendor_rate"
//                     value={form.vendor_rate}
//                     onChange={handleNumericChange}
//                     onFocus={inputFocus}
//                     onBlur={inputBlur}
//                     placeholder="Enter rate"
//                     style={styles.input}
//                     inputMode="decimal"
//                     required
//                   />
//                 </div>

//                 <div style={{ ...styles.inputGroup, gridColumn: "span 3" }}>
//                   <label style={styles.label}>Other Rate Types</label>
//                   <select
//                     name="vendor_rate_type"
//                     value={QUICK_RATE_TYPES.includes(form.vendor_rate_type) ? "" : form.vendor_rate_type}
//                     onChange={(e) => handleRateTypeSelect(e.target.value)}
//                     onFocus={inputFocus}
//                     onBlur={inputBlur}
//                     style={styles.selectInput}
//                   >
//                     {EXTRA_RATE_TYPES.map((item) => (
//                       <option key={item.value || "blank"} value={item.value}>
//                         {item.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div style={{ ...styles.inputGroup, gridColumn: "span 12" }}>
//                   <label style={styles.label}>Rate Type <span style={styles.requiredStar}>*</span></label>
//                   <div style={styles.rateTypeWrapper}>
//                     {QUICK_RATE_TYPES.map((type) => (
//                       <button
//                         type="button"
//                         key={type}
//                         onClick={() => handleRateTypeSelect(type)}
//                         style={{
//                           ...styles.rateChip,
//                           ...(form.vendor_rate_type === type ? styles.rateChipActive : {}),
//                         }}
//                         onMouseEnter={(e) => {
//                           if (form.vendor_rate_type !== type) {
//                             e.currentTarget.style.borderColor = "#FF9B51";
//                             e.currentTarget.style.transform = "translateY(-1px)";
//                           }
//                         }}
//                         onMouseLeave={(e) => {
//                           if (form.vendor_rate_type !== type) {
//                             e.currentTarget.style.borderColor = "#D8E0E7";
//                             e.currentTarget.style.transform = "translateY(0)";
//                           }
//                         }}
//                       >
//                         {rateLabel(type)}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <div style={{ gridColumn: "span 12" }}>
//                   <div style={styles.autoBox}>
//                     <div style={styles.autoBoxTitle}>AUTO-FILLED FROM VENDOR</div>
//                     <div style={styles.autoGrid}>
//                       <div style={styles.autoField}>
//                         <span>Vendor Company</span>
//                         <strong>{form.vendor_company_name || "Auto-filled after vendor selection"}</strong>
//                       </div>
//                       <div style={styles.autoField}>
//                         <span>Vendor Contact</span>
//                         <strong>{form.vendor_number || "Auto-filled after vendor selection"}</strong>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </section>

//             <div style={styles.submitBar}>
//               <div>
//                 <span style={styles.progressText}>Required fields filled: </span>
//                 <strong style={styles.progressStrong}>{completedCount}/7</strong>
//               </div>
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 style={{
//                   ...styles.submitBtn,
//                   ...(isSubmitting ? styles.submitBtnDisabled : {}),
//                 }}
//                 onMouseEnter={(e) => {
//                   if (!isSubmitting) {
//                     e.currentTarget.style.transform = "translateY(-2px)";
//                     e.currentTarget.style.boxShadow = "0 16px 34px rgba(255, 105, 43, 0.32)";
//                   }
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.transform = "translateY(0)";
//                   e.currentTarget.style.boxShadow = "0 12px 26px rgba(255, 105, 43, 0.22)";
//                 }}
//               >
//                 {isSubmitting ? "Submitting..." : "Submit Candidate"}
//               </button>
//             </div>
//           </div>
//         </form>
//       </div>
//     </BaseLayout>
//   );
// }

// const styles = {
//   pageShell: {
//     maxWidth: "1120px",
//     margin: "0 auto",
//     padding: "22px 14px 55px",
//     background:
//       "radial-gradient(circle at top right, rgba(255,155,81,0.13), transparent 38%)",
//   },
//   toast: {
//     position: "fixed",
//     top: "85px",
//     right: "20px",
//     color: "#fff",
//     padding: "12px 25px",
//     borderRadius: "10px",
//     zIndex: 9999,
//     fontWeight: "700",
//     boxShadow: "0 12px 25px rgba(0,0,0,0.16)",
//   },
//   header: {
//     display: "flex",
//     alignItems: "center",
//     gap: "14px",
//     marginBottom: "20px",
//   },
//   backBtn: {
//     background: "#25343F",
//     color: "#fff",
//     border: "none",
//     padding: "10px 18px",
//     borderRadius: "12px",
//     cursor: "pointer",
//     fontWeight: "800",
//     boxShadow: "0 10px 24px rgba(37,52,63,0.18)",
//     transition: "all .2s ease",
//   },
//   title: {
//     color: "#25343F",
//     fontSize: "26px",
//     fontWeight: "900",
//     margin: 0,
//     letterSpacing: "-0.4px",
//   },
//   subtitle: {
//     color: "#748290",
//     margin: "3px 0 0",
//     fontSize: "13px",
//     fontWeight: "600",
//   },
//   container: {
//     display: "grid",
//     gridTemplateColumns: "280px minmax(0, 1fr)",
//     gap: "18px",
//     alignItems: "start",
//   },
//   leftRail: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "14px",
//     position: "sticky",
//     top: "18px",
//   },
//   uploadCard: {
//     minHeight: "142px",
//     border: "1.5px dashed #D8E0E7",
//     borderRadius: "20px",
//     background: "rgba(255,255,255,0.82)",
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     justifyContent: "center",
//     textAlign: "center",
//     padding: "18px",
//     cursor: "pointer",
//     transition: "all .22s ease",
//     boxShadow: "0 14px 34px rgba(37,52,63,0.06)",
//   },
//   uploadCardActive: {
//     borderColor: "#FF9B51",
//     background: "#FFF5ED",
//     transform: "translateY(-2px)",
//   },
//   uploadCardDone: {
//     borderColor: "#27AE60",
//     background: "#F2FBF6",
//   },
//   uploadIcon: {
//     width: "44px",
//     height: "44px",
//     borderRadius: "14px",
//     background: "#FFF0E7",
//     color: "#FF7A32",
//     display: "grid",
//     placeItems: "center",
//     fontSize: "20px",
//     marginBottom: "10px",
//     fontWeight: "900",
//   },
//   uploadTitle: {
//     color: "#25343F",
//     fontSize: "14px",
//   },
//   uploadHint: {
//     color: "#728191",
//     fontSize: "12px",
//     marginTop: "4px",
//     lineHeight: 1.4,
//   },
//   parsingText: {
//     color: "#FF9B51",
//     fontWeight: "800",
//     marginTop: "8px",
//     fontSize: "12px",
//   },
//   resumeActions: {
//     display: "flex",
//     gap: "8px",
//     marginTop: "12px",
//     justifyContent: "center",
//     flexWrap: "wrap",
//   },
//   viewResumeBtn: {
//     border: "1px solid #FF9B51",
//     background: "#FFF3EA",
//     color: "#F15F34",
//     padding: "8px 12px",
//     borderRadius: "10px",
//     cursor: "pointer",
//     fontWeight: "900",
//     fontSize: "12px",
//     transition: "all .18s ease",
//   },
//   removeResumeBtn: {
//     border: "1px solid #D8E0E7",
//     background: "#fff",
//     color: "#25343F",
//     padding: "8px 12px",
//     borderRadius: "10px",
//     cursor: "pointer",
//     fontWeight: "800",
//     fontSize: "12px",
//     transition: "all .18s ease",
//   },
//   liveCard: {
//     background: "rgba(255,255,255,0.92)",
//     border: "1px solid #E7ECF1",
//     borderRadius: "20px",
//     padding: "18px",
//     boxShadow: "0 18px 38px rgba(37,52,63,0.08)",
//   },
//   liveTitle: {
//     color: "#8995A4",
//     fontSize: "10px",
//     fontWeight: "900",
//     letterSpacing: "2px",
//     textTransform: "uppercase",
//     borderBottom: "1px solid #E7ECF1",
//     paddingBottom: "10px",
//     marginBottom: "14px",
//   },
//   avatarBox: {
//     width: "50px",
//     height: "50px",
//     borderRadius: "16px",
//     border: "1.5px dashed #D8E0E7",
//     background: "#F8FAFC",
//     color: "#B6C0CA",
//     display: "grid",
//     placeItems: "center",
//     fontWeight: "900",
//     fontSize: "20px",
//   },
//   liveName: {
//     color: "#25343F",
//     fontSize: "17px",
//     fontWeight: "900",
//     marginTop: "12px",
//   },
//   liveSub: {
//     color: "#748290",
//     fontSize: "12px",
//     marginTop: "2px",
//   },
//   liveRows: {
//     marginTop: "14px",
//     border: "1px solid #E7ECF1",
//     borderRadius: "13px",
//     overflow: "hidden",
//   },
//   liveRow: {
//     display: "flex",
//     justifyContent: "space-between",
//     gap: "10px",
//     padding: "10px 12px",
//     borderBottom: "1px solid #E7ECF1",
//     color: "#748290",
//     fontSize: "12px",
//   },
//   mainPanel: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "16px",
//   },
//   section: {
//     background: "rgba(255,255,255,0.94)",
//     padding: "18px",
//     borderRadius: "20px",
//     border: "1px solid #E7ECF1",
//     boxShadow: "0 18px 42px rgba(37,52,63,0.08)",
//     transition: "all .25s ease",
//   },
//   sectionHeader: {
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//     marginBottom: "16px",
//     paddingBottom: "14px",
//     borderBottom: "1px solid #EEF2F5",
//   },
//   stepBadge: {
//     width: "34px",
//     height: "34px",
//     borderRadius: "11px",
//     background: "#25343F",
//     color: "#fff",
//     display: "grid",
//     placeItems: "center",
//     fontWeight: "900",
//     boxShadow: "0 10px 22px rgba(37,52,63,0.16)",
//   },
//   secTitle: {
//     fontSize: "17px",
//     color: "#25343F",
//     fontWeight: "900",
//     margin: 0,
//     letterSpacing: "-0.2px",
//   },
//   secSubTitle: {
//     margin: "2px 0 0",
//     color: "#748290",
//     fontSize: "12px",
//     fontWeight: "600",
//   },
//   compactGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(12, 1fr)",
//     gap: "13px",
//   },
//   vendorGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(12, 1fr)",
//     gap: "13px",
//   },
//   inputGroup: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "7px",
//   },
//   label: {
//     fontSize: "11px",
//     fontWeight: "900",
//     color: "#25343F",
//     textTransform: "uppercase",
//     letterSpacing: "0.3px",
//   },
//   requiredStar: {
//     color: "#FF7A32",
//     marginLeft: "2px",
//   },
//   input: {
//     padding: "10px 13px",
//     borderRadius: "12px",
//     border: "1.5px solid #D8E0E7",
//     fontSize: "13px",
//     color: "#25343F",
//     background: "#FAFBFC",
//     outline: "none",
//     transition: "all .18s ease",
//     minHeight: "42px",
//     boxSizing: "border-box",
//     fontWeight: "600",
//   },
//   selectInput: {
//     padding: "10px 13px",
//     borderRadius: "12px",
//     border: "1.5px solid #D8E0E7",
//     fontSize: "13px",
//     color: "#25343F",
//     background: "#FAFBFC",
//     outline: "none",
//     transition: "all .18s ease",
//     minHeight: "42px",
//     boxSizing: "border-box",
//     fontWeight: "700",
//   },
//   dropdownList: {
//     position: "absolute",
//     top: "calc(100% + 8px)",
//     left: 0,
//     right: 0,
//     background: "#fff",
//     border: "1px solid #E1E7ED",
//     borderRadius: "14px",
//     maxHeight: "220px",
//     overflowY: "auto",
//     zIndex: 1000,
//     boxShadow: "0 16px 38px rgba(37,52,63,0.14)",
//   },
//   dropdownItem: {
//     padding: "12px 14px",
//     cursor: "pointer",
//     borderBottom: "1px solid #F1F4F6",
//     display: "flex",
//     flexDirection: "column",
//     gap: "2px",
//     color: "#25343F",
//     fontSize: "13px",
//   },
//   noVendor: {
//     padding: "14px",
//     color: "#748290",
//     fontSize: "13px",
//     textAlign: "center",
//   },
//   rateTypeWrapper: {
//     display: "grid",
//     gridTemplateColumns: "repeat(6, minmax(78px, 1fr))",
//     gap: "8px",
//   },
//   rateChip: {
//     border: "1.5px solid #D8E0E7",
//     background: "#fff",
//     color: "#25343F",
//     padding: "10px 10px",
//     borderRadius: "12px",
//     cursor: "pointer",
//     fontWeight: "900",
//     fontSize: "12px",
//     transition: "all .18s ease",
//     minHeight: "40px",
//   },
//   rateChipActive: {
//     background: "#25343F",
//     borderColor: "#25343F",
//     color: "#fff",
//     boxShadow: "0 12px 24px rgba(37,52,63,0.18)",
//     transform: "translateY(-1px)",
//   },
//   autoBox: {
//     background: "#F7F9FB",
//     border: "1px solid #E1E7ED",
//     borderRadius: "16px",
//     padding: "14px",
//   },
//   autoBoxTitle: {
//     fontSize: "10px",
//     fontWeight: "900",
//     color: "#8995A4",
//     letterSpacing: "1.4px",
//     marginBottom: "11px",
//   },
//   autoGrid: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: "12px",
//   },
//   autoField: {
//     background: "#fff",
//     border: "1px solid #D8E0E7",
//     borderRadius: "12px",
//     padding: "11px 13px",
//     minHeight: "52px",
//   },
//   submitBar: {
//     background: "rgba(255,255,255,0.94)",
//     border: "1px solid #E7ECF1",
//     borderRadius: "20px",
//     padding: "14px 18px",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     gap: "12px",
//     boxShadow: "0 18px 42px rgba(37,52,63,0.08)",
//     position: "sticky",
//     bottom: "14px",
//     zIndex: 9,
//   },
//   progressText: {
//     color: "#748290",
//     fontSize: "13px",
//     fontWeight: "700",
//   },
//   progressStrong: {
//     color: "#25343F",
//     fontSize: "14px",
//   },
//   submitBtn: {
//     padding: "13px 32px",
//     color: "#fff",
//     border: "none",
//     borderRadius: "14px",
//     fontSize: "14px",
//     fontWeight: "900",
//     background: "linear-gradient(135deg,#FF9B51,#F15F34)",
//     cursor: "pointer",
//     boxShadow: "0 12px 26px rgba(255, 105, 43, 0.22)",
//     transition: "all .2s ease",
//     minWidth: "185px",
//   },
//   submitBtnDisabled: {
//     background: "#BFC9D1",
//     cursor: "not-allowed",
//     boxShadow: "none",
//   },
// };

// export default AddCandidate;
