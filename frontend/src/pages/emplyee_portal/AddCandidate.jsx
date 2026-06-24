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
  X,
} from "lucide-react";
import { apiRequest } from "../../services/api";
import { asList } from "../../utils/apiHelpers";
import BaseLayout from "../components/emp_base";

function AddCandidate() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
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
  const [resumePreviewUrl, setResumePreviewUrl] = useState("");
  const [vendors, setVendors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchVendor, setSearchVendor] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [showErrors, setShowErrors] = useState(false);

  const QUICK_RATE_TYPES = [
    { value: "LPM", label: "LPM" },
    { value: "KPM", label: "KPM" },
    { value: "PHR", label: "PHR" },
    { value: "USD_PH", label: "USD/HR" },
    { value: "USD", label: "USD" },
    { value: "LPA", label: "LPA" },
  ];

  const MORE_RATE_TYPES = [
    { value: "", label: "More types" },
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

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVendors(searchVendor);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchVendor]);

  useEffect(() => {
    return () => {
      if (resumePreviewUrl) URL.revokeObjectURL(resumePreviewUrl);
    };
  }, [resumePreviewUrl]);

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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const selectVendor = (v) => {
    setForm((prev) => ({
      ...prev,
      vendor: v.id,
      vendor_company_name: v.company_name || "",
      vendor_number: v.number || "",
    }));
    setSearchVendor(`${v.name} (${v.company_name || ""})`);
    setShowDropdown(false);
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;

    setResumeFile(file);
    if (resumePreviewUrl) URL.revokeObjectURL(resumePreviewUrl);
    setResumePreviewUrl(URL.createObjectURL(file));
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

  const removeResume = () => {
    setResumeFile(null);
    if (resumePreviewUrl) URL.revokeObjectURL(resumePreviewUrl);
    setResumePreviewUrl("");
  };

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
    fd.append("resume", resumeFile);

    try {
      const res = await apiRequest(
        "/employee-portal/api/candidates/create/",
        "POST",
        fd,
      );
      notify(res.message || "Candidate Created Successfully!");
      setTimeout(() => {
        navigate("/employee");
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

  const selectedVendorDetailsVisible =
    form.vendor_company_name || form.vendor_number || form.vendor;

  const requiredFilled = useMemo(() => {
    let filled = 0;
    if (resumeFile) filled += 1;
    if (form.candidate_name.trim()) filled += 1;
    if (form.vendor) filled += 1;
    if (form.vendor_rate.trim()) filled += 1;
    if (form.vendor_rate_type) filled += 1;
    return filled;
  }, [resumeFile, form.candidate_name, form.vendor, form.vendor_rate, form.vendor_rate_type]);

  const initials = form.candidate_name
    ? form.candidate_name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase()
    : "";

  const selectedQuickRate = QUICK_RATE_TYPES.some(
    (type) => type.value === form.vendor_rate_type,
  );

  const visibleRateTypeLabel =
    [...QUICK_RATE_TYPES, ...MORE_RATE_TYPES].find(
      (type) => type.value === form.vendor_rate_type,
    )?.label || form.vendor_rate_type;

  return (
    <BaseLayout>
      {toast.show && (
        <div
          style={{
            ...styles.toast,
            backgroundColor: toast.type === "error" ? "#FF453A" : "#34C759",
          }}
        >
          {toast.msg}
        </div>
      )}

      <style>{fontAndResponsiveCss}</style>

      <div style={styles.root}>
        <div style={styles.wrap}>
          <header style={styles.head}>
            <button type="button" onClick={() => navigate(-1)} style={styles.backBtn} aria-label="Back">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={styles.heading}>Add candidate</h1>
              <p style={styles.subheading}>Upload a resume, confirm the basics, pick a vendor, done.</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} style={styles.layout} className="add-candidate-layout">
            <main style={styles.formCol}>
              <label
                style={{
                  ...styles.drop,
                  ...(resumeFile ? styles.dropHas : {}),
                  ...(isDragOver ? styles.dropDrag : {}),
                  ...(showErrors && !resumeFile ? styles.inputError : {}),
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  handleResumeUpload(e.dataTransfer.files[0]);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => handleResumeUpload(e.target.files[0])}
                  style={styles.hiddenFileInput}
                  accept=".pdf,.doc,.docx"
                  required={!resumeFile}
                />
                <div style={{ ...styles.dropIcon, ...(resumeFile ? styles.dropIconHas : {}) }}>
                  {resumeFile ? <Check size={22} /> : <UploadCloud size={22} />}
                </div>
                <div style={styles.dropTextWrap}>
                  <b style={styles.dropTitle}>
                    {resumeFile
                      ? resumeFile.name.length > 30
                        ? `${resumeFile.name.slice(0, 28)}…`
                        : resumeFile.name
                      : "Upload resume"}
                  </b>
                  <span style={styles.dropSub}>
                    {isParsing
                      ? "Parsing resume..."
                      : resumeFile
                        ? "Attached — name, skills & details auto-filled"
                        : "PDF or Word · we read the details for you"}
                  </span>
                </div>
                {resumeFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeResume();
                    }}
                    style={styles.removeTinyBtn}
                    aria-label="Remove resume"
                  >
                    <X size={16} />
                  </button>
                )}
              </label>

              {resumeFile && resumePreviewUrl && (
                <button
                  type="button"
                  style={styles.viewResumeBtn}
                  onClick={() => window.open(resumePreviewUrl, "_blank")}
                >
                  View resume
                </button>
              )}

              <section style={styles.cardPad}>
                <div style={styles.sectionHead}>
                  <div style={styles.sectionIcon}><Sparkles size={18} /></div>
                  <div>
                    <h2 style={styles.sectionTitle}>Candidate</h2>
                    <p style={styles.sectionSub}>The basics about the person.</p>
                  </div>
                </div>

                <div style={styles.grid}>
                  <div style={{ ...styles.field, gridColumn: "span 6" }} className="ac-span-6">
                    <label style={styles.label}>Full name <span style={styles.dot} /></label>
                    <input
                      name="candidate_name"
                      value={form.candidate_name}
                      onChange={handleChange}
                      style={{
                        ...styles.input,
                        ...(showErrors && !form.candidate_name.trim() ? styles.inputError : {}),
                      }}
                      placeholder="e.g. Aanya Sharma"
                      required
                    />
                  </div>
                  <div style={{ ...styles.field, gridColumn: "span 4" }} className="ac-span-4">
                    <label style={styles.label}>Technology</label>
                    <input
                      name="technology"
                      value={form.technology}
                      onChange={handleChange}
                      style={styles.input}
                      placeholder="Java, Python…"
                    />
                  </div>
                  <div style={{ ...styles.field, gridColumn: "span 2" }} className="ac-span-2">
                    <label style={styles.label}>Exp&nbsp;(yrs)</label>
                    <input
                      name="years_of_experience_manual"
                      value={form.years_of_experience_manual}
                      onChange={handleChange}
                      style={styles.input}
                      placeholder="3.5"
                      inputMode="decimal"
                    />
                  </div>
                  <div style={{ ...styles.field, gridColumn: "span 6" }} className="ac-span-6">
                    <label style={styles.label}>Email <span style={styles.optional}>optional</span></label>
                    <div style={styles.inputIconWrap}>
                      <Mail size={16} style={styles.inlineIcon} />
                      <input
                        name="candidate_email"
                        value={form.candidate_email}
                        onChange={handleChange}
                        style={{ ...styles.input, paddingLeft: 42 }}
                        placeholder="name@email.com"
                        type="email"
                      />
                    </div>
                  </div>
                  <div style={{ ...styles.field, gridColumn: "span 6" }} className="ac-span-6">
                    <label style={styles.label}>Phone <span style={styles.optional}>optional</span></label>
                    <div style={styles.inputIconWrap}>
                      <Phone size={16} style={styles.inlineIcon} />
                      <input
                        name="candidate_number"
                        value={form.candidate_number}
                        onChange={handleChange}
                        style={{ ...styles.input, paddingLeft: 42 }}
                        placeholder="+91 98765 43210"
                        inputMode="tel"
                      />
                    </div>
                  </div>
                </div>

                <input type="hidden" name="skills" value={form.skills} readOnly />
                <input
                  type="hidden"
                  name="years_of_experience_calculated"
                  value={form.years_of_experience_calculated}
                  readOnly
                />
              </section>

              <section style={styles.cardPad}>
                <div style={styles.sectionHead}>
                  <div style={styles.sectionIcon}><BadgeCheck size={18} /></div>
                  <div>
                    <h2 style={styles.sectionTitle}>Vendor &amp; rate</h2>
                    <p style={styles.sectionSub}>Pick a vendor — company &amp; contact fill in for you.</p>
                  </div>
                </div>

                <div style={styles.grid}>
                  <div style={{ ...styles.field, gridColumn: "span 7", position: "relative" }} className="ac-span-7">
                    <label style={styles.label}>Search &amp; select vendor <span style={styles.dot} /></label>
                    <div style={styles.inputIconWrap}>
                      <Search size={16} style={styles.inlineIcon} />
                      <input
                        placeholder="Type a vendor or company…"
                        value={searchVendor}
                        onChange={(e) => {
                          setSearchVendor(e.target.value);
                          setShowDropdown(true);
                          setForm((prev) => ({ ...prev, vendor: "" }));
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 300)}
                        style={{
                          ...styles.input,
                          paddingLeft: 42,
                          ...(showErrors && !form.vendor ? styles.inputError : {}),
                        }}
                        autoComplete="off"
                      />
                    </div>

                    {showDropdown && (
                      <div style={styles.dropdownList}>
                        {vendors.length > 0 ? (
                          vendors.map((v) => (
                            <div key={v.id} onMouseDown={() => selectVendor(v)} style={styles.dropdownItem}>
                              <b style={styles.dropdownTitle}>{v.name}</b>
                              <span style={styles.dropdownSubText}>
                                {v.company_name || "No company"} {v.number ? `• ${v.number}` : ""}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div style={styles.noVendorText}>No vendor matches “{searchVendor}”.</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ ...styles.field, gridColumn: "span 5" }} className="ac-span-5">
                    <label style={styles.label}>Vendor rate <span style={styles.dot} /></label>
                    <input
                      name="vendor_rate"
                      value={form.vendor_rate}
                      onChange={handleChange}
                      style={{
                        ...styles.input,
                        ...(showErrors && !form.vendor_rate.trim() ? styles.inputError : {}),
                      }}
                      placeholder="Enter rate"
                      required
                    />
                  </div>

                  <div style={{ ...styles.field, gridColumn: "span 12" }}>
                    <label style={styles.label}>Rate type <span style={styles.dot} /></label>
                    <div style={styles.chipsWrap} className="ac-chips-wrap">
                      {QUICK_RATE_TYPES.map((type) => {
                        const active = form.vendor_rate_type === type.value;
                        return (
                          <button
                            type="button"
                            key={type.value}
                            onClick={() =>
                              setForm((prev) => ({ ...prev, vendor_rate_type: type.value }))
                            }
                            style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                          >
                            {type.label}
                          </button>
                        );
                      })}
                      <select
                        name="vendor_rate_type"
                        value={selectedQuickRate ? "" : form.vendor_rate_type}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, vendor_rate_type: e.target.value }))
                        }
                        style={{
                          ...styles.moreRateSelect,
                          ...(showErrors && !form.vendor_rate_type ? styles.inputError : {}),
                        }}
                      >
                        {MORE_RATE_TYPES.map((type) => (
                          <option key={type.value || "empty"} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ ...styles.field, gridColumn: "span 12" }}>
                    <div style={styles.autoBox}>
                      <div style={styles.autoHeader}><BadgeCheck size={13} /> Auto-filled from vendor</div>
                      {selectedVendorDetailsVisible ? (
                        <div style={styles.autoGrid}>
                          <div style={{ ...styles.autoValue, ...styles.autoValueFilled }}>
                            <span style={styles.autoKey}>Vendor company</span>
                            {form.vendor_company_name || "—"}
                          </div>
                          <div style={{ ...styles.autoValue, ...styles.autoValueFilled }}>
                            <span style={styles.autoKey}>Vendor contact</span>
                            {form.vendor_number || "—"}
                          </div>
                        </div>
                      ) : (
                        <div style={styles.autoGrid}>
                          <div style={styles.autoValue}>
                            <span style={styles.autoKey}>Vendor company</span>
                            Select a vendor
                          </div>
                          <div style={styles.autoValue}>
                            <span style={styles.autoKey}>Vendor contact</span>
                            Select a vendor
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </main>

            <aside style={styles.previewCol} className="add-candidate-preview-col">
              <div style={styles.previewCard}>
                <div style={styles.previewTopLine} />
                <div style={styles.previewBody}>
                  <div style={styles.previewEyebrow}>
                    Live preview <span style={styles.eyebrowLine} />
                  </div>
                  <div style={styles.previewPersonRow}>
                    <div style={initials ? styles.avatar : styles.avatarEmpty}>{initials || "•"}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={form.candidate_name.trim() ? styles.previewName : styles.previewNamePlaceholder}>
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
                      <span style={form.vendor_rate ? styles.previewVal : styles.previewValEmpty}>
                        {form.vendor_rate ? `${form.vendor_rate} ${visibleRateTypeLabel || ""}` : "—"}
                      </span>
                    </div>
                    <div style={styles.previewRowNoBorder}>
                      <span style={styles.previewKey}><Sparkles size={15} /> Skills</span>
                      <span style={styles.previewValEmpty}>{form.skills || "Auto-detected"}</span>
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
          </form>
        </div>

        <div style={styles.actionBar}>
          <div style={styles.actionBarInner}>
            <div>
              <div style={{ ...styles.progressText, ...(showErrors && requiredFilled < 5 ? styles.progressError : {}) }}>
                {showErrors && requiredFilled < 5 ? "Fill all required fields — " : ""}
                <b style={styles.progressBold}>{requiredFilled}</b> / 5 required done
              </div>
              <div style={styles.progressTrack}>
                <span style={{ ...styles.progressFill, width: `${(requiredFilled / 5) * 100}%` }} />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={handleSubmit}
              style={{
                ...styles.submitBtn,
                ...(isSubmitting ? styles.submitBtnDisabled : {}),
              }}
            >
              {isSubmitting ? "Adding..." : "Add candidate"}
            </button>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}

const fontAndResponsiveCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
@media(max-width: 820px){
  .add-candidate-layout{grid-template-columns:1fr!important;}
  .add-candidate-preview-col{position:static!important;order:-1;}
  .ac-span-7,.ac-span-6,.ac-span-5,.ac-span-4,.ac-span-2{grid-column:span 12!important;}
  .ac-chips-wrap{grid-template-columns:repeat(3,1fr)!important;}
}
@media(max-width: 480px){
  .ac-chips-wrap{grid-template-columns:repeat(2,1fr)!important;}
}
`;

const colors = {
  bg: "#F5F5F7",
  surface: "#FFFFFF",
  ink: "#1D1D1F",
  muted: "#86868B",
  line: "#EBEBF0",
  line2: "#DEDEE4",
  accent: "#FF6A2B",
  accent2: "#FF8A3D",
  accentSoft: "#FFF0E7",
  accentInk: "#D2520F",
  ok: "#34C759",
  danger: "#FF453A",
};

const styles = {
  toast: {
    position: "fixed",
    top: "85px",
    right: "20px",
    color: "#fff",
    padding: "12px 25px",
    borderRadius: "12px",
    zIndex: 9999,
    fontWeight: 700,
    boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  root: {
    color: colors.ink,
    background: colors.bg,
    minHeight: "100vh",
    padding: "26px 18px 120px",
    fontFamily: "Inter, system-ui, sans-serif",
    WebkitFontSmoothing: "antialiased",
    boxSizing: "border-box",
  },
  wrap: {
    maxWidth: "1080px",
    margin: "0 auto",
  },
  head: {
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
    background: colors.surface,
    border: `1px solid ${colors.line}`,
    color: colors.ink,
    cursor: "pointer",
    flex: "none",
  },
  heading: {
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "26px",
    margin: 0,
    letterSpacing: "-0.6px",
  },
  subheading: {
    margin: "3px 0 0",
    color: colors.muted,
    fontSize: "13.5px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 350px",
    gap: "22px",
    alignItems: "start",
  },
  formCol: {
    order: 1,
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    minWidth: 0,
  },
  previewCol: {
    order: 2,
    position: "sticky",
    top: "20px",
  },
  drop: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    cursor: "pointer",
    border: `1.5px dashed ${colors.line2}`,
    borderRadius: "14px",
    padding: "18px",
    background: colors.surface,
    transition: "all .18s",
    position: "relative",
    boxSizing: "border-box",
  },
  dropDrag: {
    borderColor: colors.accent,
    background: colors.accentSoft,
  },
  dropHas: {
    borderStyle: "solid",
    borderColor: colors.ok,
    background: "#F1FBF3",
  },
  dropIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    flex: "none",
    display: "grid",
    placeItems: "center",
    background: colors.accentSoft,
    color: colors.accentInk,
  },
  dropIconHas: {
    background: "#DCF6E2",
    color: "#1E9E47",
  },
  dropTextWrap: {
    minWidth: 0,
  },
  dropTitle: {
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontSize: "14.5px",
    display: "block",
    letterSpacing: "-0.2px",
    color: colors.ink,
  },
  dropSub: {
    color: colors.muted,
    fontSize: "12.5px",
  },
  hiddenFileInput: {
    display: "none",
  },
  removeTinyBtn: {
    marginLeft: "auto",
    width: "34px",
    height: "34px",
    borderRadius: "11px",
    border: `1px solid ${colors.line}`,
    background: "#fff",
    color: colors.muted,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  viewResumeBtn: {
    border: `1px solid ${colors.line}`,
    background: "#fff",
    color: colors.ink,
    borderRadius: "12px",
    padding: "10px 12px",
    fontWeight: 700,
    cursor: "pointer",
    width: "fit-content",
  },
  cardPad: {
    background: colors.surface,
    border: `1px solid ${colors.line}`,
    borderRadius: "22px",
    boxShadow: "0 1px 3px rgba(0,0,0,.03),0 14px 36px -20px rgba(0,0,0,.16)",
    padding: "22px",
    boxSizing: "border-box",
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    marginBottom: "18px",
  },
  sectionIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "11px",
    flex: "none",
    display: "grid",
    placeItems: "center",
    background: colors.accentSoft,
    color: colors.accentInk,
  },
  sectionTitle: {
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: "17px",
    margin: 0,
    letterSpacing: "-0.3px",
    color: colors.ink,
  },
  sectionSub: {
    margin: "1px 0 0",
    fontSize: "12.5px",
    color: colors.muted,
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
    color: colors.ink,
    display: "flex",
    alignItems: "center",
    gap: "7px",
    letterSpacing: "-0.1px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: colors.accent,
    display: "inline-block",
  },
  optional: {
    fontWeight: 500,
    color: colors.muted,
    fontSize: "11px",
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    padding: "1px 7px",
    borderRadius: "7px",
  },
  input: {
    width: "100%",
    border: `1.5px solid ${colors.line}`,
    background: colors.surface,
    borderRadius: "14px",
    padding: "13px 15px",
    fontSize: "15px",
    fontFamily: "Inter, system-ui, sans-serif",
    color: colors.ink,
    outline: "none",
    transition: "all .15s",
    boxSizing: "border-box",
  },
  inputError: {
    borderColor: colors.danger,
    boxShadow: "0 0 0 4px #FFE9E7",
  },
  inputIconWrap: {
    position: "relative",
  },
  inlineIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: colors.muted,
    zIndex: 1,
  },
  dropdownList: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    background: "#fff",
    zIndex: 30,
    border: `1px solid ${colors.line}`,
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,.25)",
  },
  dropdownItem: {
    padding: "12px 15px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    borderBottom: `1px solid ${colors.line}`,
  },
  dropdownTitle: {
    fontWeight: 600,
    fontSize: "14px",
    color: colors.ink,
  },
  dropdownSubText: {
    color: colors.muted,
    fontSize: "12.5px",
    textAlign: "right",
  },
  noVendorText: {
    padding: "14px 15px",
    color: colors.muted,
    fontSize: "13px",
  },
  chipsWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
  },
  chip: {
    border: `1.5px solid ${colors.line}`,
    background: colors.surface,
    cursor: "pointer",
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: "13px",
    color: colors.ink,
    padding: "11px 4px",
    borderRadius: "12px",
    transition: "all .14s",
    textAlign: "center",
  },
  chipActive: {
    background: colors.ink,
    borderColor: colors.ink,
    color: "#fff",
    transform: "translateY(-1px)",
  },
  moreRateSelect: {
    border: `1.5px solid ${colors.line}`,
    background: colors.surface,
    color: colors.ink,
    padding: "11px 8px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
    outline: "none",
    minWidth: 0,
  },
  autoBox: {
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: "16px",
    padding: "15px 16px",
  },
  autoHeader: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.4px",
    textTransform: "uppercase",
    color: colors.muted,
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
    border: `1px solid ${colors.line}`,
    borderRadius: "11px",
    padding: "11px 13px",
    fontSize: "13.5px",
    color: "#B4B4BD",
  },
  autoValueFilled: {
    color: colors.ink,
    fontWeight: 500,
  },
  autoKey: {
    display: "block",
    fontSize: "11px",
    color: colors.muted,
    marginBottom: "3px",
    fontWeight: 600,
  },
  previewCard: {
    background: colors.surface,
    border: `1px solid ${colors.line}`,
    borderRadius: "22px",
    boxShadow: "0 1px 3px rgba(0,0,0,.03),0 14px 36px -20px rgba(0,0,0,.16)",
    overflow: "hidden",
  },
  previewTopLine: {
    height: "6px",
    background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent2})`,
  },
  previewBody: {
    padding: "24px 22px",
  },
  previewEyebrow: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: colors.muted,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "18px",
  },
  eyebrowLine: {
    flex: 1,
    height: "1px",
    background: colors.line,
  },
  previewPersonRow: {
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
    flex: "none",
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
    flex: "none",
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "18px",
    letterSpacing: "0.5px",
    background: colors.bg,
    color: colors.line2,
    border: `1.5px dashed ${colors.line2}`,
  },
  previewName: {
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: "19px",
    letterSpacing: "-0.4px",
    lineHeight: 1.15,
    color: colors.ink,
  },
  previewNamePlaceholder: {
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: "19px",
    letterSpacing: "-0.4px",
    lineHeight: 1.15,
    color: colors.line2,
  },
  previewTech: {
    fontSize: "13px",
    color: colors.muted,
    marginTop: "3px",
  },
  previewRows: {
    display: "flex",
    flexDirection: "column",
    marginTop: "20px",
    border: `1px solid ${colors.line}`,
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
    borderBottom: `1px solid ${colors.line}`,
  },
  previewRowNoBorder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "12px 14px",
    fontSize: "13.5px",
  },
  previewKey: {
    color: colors.muted,
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },
  previewVal: {
    fontWeight: 600,
    textAlign: "right",
    color: colors.ink,
  },
  previewValEmpty: {
    color: colors.line2,
    fontWeight: 500,
    textAlign: "right",
    fontStyle: "italic",
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
    color: colors.ink,
  },
  actionBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    background: "rgba(255,255,255,.86)",
    backdropFilter: "saturate(180%) blur(14px)",
    borderTop: `1px solid ${colors.line}`,
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBarInner: {
    width: "100%",
    maxWidth: "1080px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
  },
  progressText: {
    fontSize: "13px",
    color: colors.muted,
  },
  progressError: {
    color: colors.danger,
  },
  progressBold: {
    color: colors.ink,
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
  },
  progressTrack: {
    height: "6px",
    width: "130px",
    background: colors.line,
    borderRadius: "99px",
    overflow: "hidden",
    marginTop: "6px",
  },
  progressFill: {
    display: "block",
    height: "100%",
    background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent2})`,
    borderRadius: "99px",
    transition: "width .35s",
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
    transition: "transform .15s,box-shadow .15s",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
  },
  submitBtnDisabled: {
    background: colors.ok,
    boxShadow: "0 10px 24px -10px rgba(52,199,89,.6)",
    pointerEvents: "none",
  },
};

export default AddCandidate;







// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import { asList } from "../../utils/apiHelpers";
// import BaseLayout from "../components/emp_base";

// function AddCandidate() {
//   const navigate = useNavigate();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isHoverSubmit, setIsHoverSubmit] = useState(false);
//   const [isHoverUpload, setIsHoverUpload] = useState(false);
//   const [isDragOver, setIsDragOver] = useState(false);

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
//   const [resumePreviewUrl, setResumePreviewUrl] = useState("");
//   const [vendors, setVendors] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [searchVendor, setSearchVendor] = useState("");
//   const [isParsing, setIsParsing] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [toast, setToast] = useState({ show: false, msg: "", type: "" });
//   const [showErrors, setShowErrors] = useState(false);

//   const QUICK_RATE_TYPES = [
//     { value: "LPM", label: "LPM" },
//     { value: "KPM", label: "KPM" },
//     { value: "PHR", label: "PHR" },
//     { value: "USD_PH", label: "USD/HR" },
//     { value: "USD", label: "USD" },
//     { value: "LPA", label: "LPA" },
//   ];

//   const MORE_RATE_TYPES = [
//     { value: "", label: "More types" },
//     { value: "EUR", label: "EUR (€)" },
//     { value: "EUR_PH", label: "EUR/hr (€)" },
//     { value: "GBP", label: "GBP (£)" },
//     { value: "GBP_PH", label: "GBP/hr (£)" },
//     { value: "AED", label: "AED (UAE)" },
//     { value: "SGD", label: "SGD (Singapore)" },
//     { value: "SAR", label: "SAR (Saudi)" },
//     { value: "CNY", label: "CNY (China)" },
//     { value: "JPY", label: "JPY (Japan)" },
//     { value: "AUD", label: "AUD (Australia)" },
//     { value: "CAD", label: "CAD (Canada)" },
//     { value: "CHF", label: "CHF (Swiss)" },
//     { value: "HKD", label: "HKD (Hong Kong)" },
//     { value: "THB", label: "THB (Thailand)" },
//     { value: "MYR", label: "MYR (Malaysia)" },
//     { value: "KRW", label: "KRW (S. Korea)" },
//     { value: "NZD", label: "NZD (NZ)" },
//     { value: "ZAR", label: "ZAR (S. Africa)" },
//     { value: "KWD", label: "KWD (Kuwait)" },
//     { value: "QAR", label: "QAR (Qatar)" },
//   ];

//   useEffect(() => {
//     loadDropdowns();
//   }, []);

//   useEffect(() => {
//     const delayDebounceFn = setTimeout(() => {
//       fetchVendors(searchVendor);
//     }, 500);
//     return () => clearTimeout(delayDebounceFn);
//   }, [searchVendor]);

//   useEffect(() => {
//     return () => {
//       if (resumePreviewUrl) URL.revokeObjectURL(resumePreviewUrl);
//     };
//   }, [resumePreviewUrl]);

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

//   const selectVendor = (v) => {
//     setForm({
//       ...form,
//       vendor: v.id,
//       vendor_company_name: v.company_name || "",
//       vendor_number: v.number || "",
//     });
//     setSearchVendor(`${v.name} (${v.company_name || ""})`);
//     setShowDropdown(false);
//   };

//   const handleResumeUpload = async (file) => {
//     if (!file) return;

//     setResumeFile(file);
//     if (resumePreviewUrl) URL.revokeObjectURL(resumePreviewUrl);
//     setResumePreviewUrl(URL.createObjectURL(file));
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

//   const removeResume = () => {
//     setResumeFile(null);
//     if (resumePreviewUrl) URL.revokeObjectURL(resumePreviewUrl);
//     setResumePreviewUrl("");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setShowErrors(true);

//     if (!resumeFile) {
//       notify("Please upload resume", "error");
//       return;
//     }

//     if (!form.candidate_name.trim()) {
//       notify("Please enter candidate name", "error");
//       return;
//     }

//     if (!form.vendor) {
//       notify("Please select vendor from dropdown", "error");
//       return;
//     }

//     if (!form.vendor_rate.trim()) {
//       notify("Please enter vendor rate", "error");
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

//     fd.append("resume", resumeFile);

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

//   const selectedVendorDetailsVisible =
//     form.vendor_company_name || form.vendor_number || form.vendor;

//   const requiredFilled = useMemo(() => {
//     let filled = 0;
//     if (resumeFile) filled += 1;
//     if (form.candidate_name.trim()) filled += 1;
//     if (form.vendor) filled += 1;
//     if (form.vendor_rate.trim()) filled += 1;
//     if (form.vendor_rate_type) filled += 1;
//     return filled;
//   }, [resumeFile, form.candidate_name, form.vendor, form.vendor_rate, form.vendor_rate_type]);

//   const initials = form.candidate_name
//     ? form.candidate_name
//         .trim()
//         .split(/\s+/)
//         .slice(0, 2)
//         .map((word) => word[0])
//         .join("")
//         .toUpperCase()
//     : "";

//   const selectedQuickRate = QUICK_RATE_TYPES.some(
//     (type) => type.value === form.vendor_rate_type,
//   );

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
//               Upload resume, verify details, select vendor and submit.
//             </p>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} style={styles.formLayout}>
//           <aside style={styles.sidePanel}>
//             <label
//               style={{
//                 ...styles.resumeCard,
//                 ...(isHoverUpload || isDragOver ? styles.resumeCardHover : {}),
//                 ...(resumeFile ? styles.resumeCardUploaded : {}),
//                 ...(showErrors && !resumeFile ? styles.errorBorder : {}),
//               }}
//               onMouseEnter={() => setIsHoverUpload(true)}
//               onMouseLeave={() => setIsHoverUpload(false)}
//               onDragOver={(e) => {
//                 e.preventDefault();
//                 setIsDragOver(true);
//               }}
//               onDragLeave={() => setIsDragOver(false)}
//               onDrop={(e) => {
//                 e.preventDefault();
//                 setIsDragOver(false);
//                 handleResumeUpload(e.dataTransfer.files[0]);
//               }}
//             >
//               <input
//                 type="file"
//                 onChange={(e) => handleResumeUpload(e.target.files[0])}
//                 style={styles.hiddenFileInput}
//                 accept=".pdf,.doc,.docx"
//                 required={!resumeFile}
//               />
//               <div style={styles.resumeIcon}>{resumeFile ? "✓" : "📄"}</div>
//               <div style={styles.uploadMainText}>
//                 {resumeFile ? resumeFile.name : "Click or drop resume here"}
//               </div>
//               <div style={styles.uploadSubText}>PDF, DOC or DOCX supported</div>
//               <div style={styles.requiredResumeText}>Resume required *</div>
//               {isParsing && <p style={styles.parsingText}>Parsing Resume...</p>}
//             </label>

//             {resumeFile && (
//               <div style={styles.resumeActions}>
//                 <button
//                   type="button"
//                   style={styles.resumeActionBtn}
//                   onClick={() => window.open(resumePreviewUrl, "_blank")}
//                 >
//                   👁 View Resume
//                 </button>
//                 <button
//                   type="button"
//                   style={styles.resumeRemoveBtn}
//                   onClick={removeResume}
//                 >
//                   Remove
//                 </button>
//               </div>
//             )}

//             <div style={styles.previewCard}>
//               <div style={styles.previewEyebrow}>Live Profile</div>
//               <div style={styles.previewTop}>
//                 <div style={initials ? styles.avatar : styles.avatarEmpty}>
//                   {initials || "+"}
//                 </div>
//                 <div>
//                   <div style={form.candidate_name ? styles.previewName : styles.previewPlaceholder}>
//                     {form.candidate_name || "New candidate"}
//                   </div>
//                   <div style={styles.previewSubText}>
//                     {form.technology || "Fill the form to build profile"}
//                   </div>
//                 </div>
//               </div>

//               <div style={styles.previewRows}>
//                 <div style={styles.previewRow}>
//                   <span>Experience</span>
//                   <strong>{form.years_of_experience_manual || "—"}</strong>
//                 </div>
//                 <div style={styles.previewRow}>
//                   <span>Vendor</span>
//                   <strong>{form.vendor_company_name || "—"}</strong>
//                 </div>
//                 <div style={styles.previewRow}>
//                   <span>Rate</span>
//                   <strong>
//                     {form.vendor_rate
//                       ? `${form.vendor_rate} ${form.vendor_rate_type || ""}`
//                       : "—"}
//                   </strong>
//                 </div>
//               </div>
//             </div>
//           </aside>

//           <main style={styles.mainColumn}>
//             <section style={styles.section}>
//               <div style={styles.sectionHeader}>
//                 <div style={styles.stepBadge}>1</div>
//                 <div>
//                   <h3 style={styles.secTitle}>Candidate</h3>
//                   <p style={styles.secSubtitle}>Keep the visible form compact. Skills and parsed experience stay hidden but will still submit.</p>
//                 </div>
//               </div>

//               <div style={styles.candidateGrid}>
//                 <div style={styles.inputGroup}>
//                   <label style={styles.label}>Full Name <span style={styles.required}>*</span></label>
//                   <input
//                     name="candidate_name"
//                     value={form.candidate_name}
//                     onChange={handleChange}
//                     style={{
//                       ...styles.input,
//                       ...(showErrors && !form.candidate_name.trim() ? styles.inputError : {}),
//                     }}
//                     placeholder="Candidate full name"
//                     required
//                   />
//                 </div>

//                 <div style={styles.inputGroup}>
//                   <label style={styles.label}>Technology</label>
//                   <input
//                     name="technology"
//                     value={form.technology}
//                     onChange={handleChange}
//                     style={styles.input}
//                     placeholder="Python, React, Java..."
//                   />
//                 </div>

//                 <div style={styles.inputGroupCompact}>
//                   <label style={styles.label}>Exp (Yrs)</label>
//                   <input
//                     name="years_of_experience_manual"
//                     value={form.years_of_experience_manual}
//                     onChange={handleChange}
//                     style={styles.input}
//                     placeholder="3.5"
//                     inputMode="decimal"
//                   />
//                 </div>

//                 <div style={styles.inputGroup}>
//                   <label style={styles.label}>Email</label>
//                   <input
//                     name="candidate_email"
//                     value={form.candidate_email}
//                     onChange={handleChange}
//                     style={styles.input}
//                     placeholder="candidate@email.com"
//                     type="email"
//                   />
//                 </div>

//                 <div style={styles.inputGroup}>
//                   <label style={styles.label}>Phone</label>
//                   <input
//                     name="candidate_number"
//                     value={form.candidate_number}
//                     onChange={handleChange}
//                     style={styles.input}
//                     placeholder="Mobile number"
//                   />
//                 </div>
//               </div>

//               <input type="hidden" name="skills" value={form.skills} readOnly />
//               <input
//                 type="hidden"
//                 name="years_of_experience_calculated"
//                 value={form.years_of_experience_calculated}
//                 readOnly
//               />
//             </section>

//             <section style={styles.section}>
//               <div style={styles.sectionHeader}>
//                 <div style={styles.stepBadge}>2</div>
//                 <div>
//                   <h3 style={styles.secTitle}>Vendor & Rate</h3>
//                   <p style={styles.secSubtitle}>Pick vendor first. Company and contact will auto-fill below.</p>
//                 </div>
//               </div>

//               <div style={styles.vendorManualGrid}>
//                 <div style={{ ...styles.inputGroup, position: "relative" }}>
//                   <label style={styles.label}>Search & Select Vendor <span style={styles.required}>*</span></label>
//                   <input
//                     placeholder="Search vendor name or company..."
//                     value={searchVendor}
//                     onChange={(e) => {
//                       setSearchVendor(e.target.value);
//                       setShowDropdown(true);
//                       setForm((prev) => ({ ...prev, vendor: "" }));
//                     }}
//                     onFocus={() => setShowDropdown(true)}
//                     onBlur={() => setTimeout(() => setShowDropdown(false), 300)}
//                     style={{
//                       ...styles.input,
//                       ...(showErrors && !form.vendor ? styles.inputError : {}),
//                     }}
//                     autoComplete="off"
//                   />

//                   {showDropdown && (
//                     <div style={styles.dropdownList}>
//                       {vendors.length > 0 ? (
//                         vendors.map((v) => (
//                           <div
//                             key={v.id}
//                             onMouseDown={() => selectVendor(v)}
//                             style={styles.dropdownItem}
//                           >
//                             <strong style={styles.dropdownTitle}>{v.name}</strong>
//                             <small style={styles.dropdownSubText}>
//                               {v.company_name || "No company"} {v.number ? `• ${v.number}` : ""}
//                             </small>
//                           </div>
//                         ))
//                       ) : (
//                         <div style={styles.noVendorText}>No vendors found</div>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 <div style={styles.inputGroup}>
//                   <label style={styles.label}>Vendor Rate <span style={styles.required}>*</span></label>
//                   <input
//                     name="vendor_rate"
//                     value={form.vendor_rate}
//                     onChange={handleChange}
//                     style={{
//                       ...styles.input,
//                       ...(showErrors && !form.vendor_rate.trim() ? styles.inputError : {}),
//                     }}
//                     placeholder="Enter rate"
//                     required
//                   />
//                 </div>
//               </div>

//               <div style={styles.rateSection}>
//                 <label style={styles.label}>Rate Type <span style={styles.required}>*</span></label>
//                 <div style={styles.rateTypeRow}>
//                   <div style={styles.rateTypeWrapper}>
//                     {QUICK_RATE_TYPES.map((type) => {
//                       const active = form.vendor_rate_type === type.value;
//                       return (
//                         <button
//                           type="button"
//                           key={type.value}
//                           onClick={() =>
//                             setForm((prev) => ({
//                               ...prev,
//                               vendor_rate_type: type.value,
//                             }))
//                           }
//                           style={{
//                             ...styles.rateChip,
//                             ...(active ? styles.rateChipActive : {}),
//                           }}
//                         >
//                           {type.label}
//                         </button>
//                       );
//                     })}
//                   </div>

//                   <select
//                     name="vendor_rate_type"
//                     value={selectedQuickRate ? "" : form.vendor_rate_type}
//                     onChange={(e) =>
//                       setForm((prev) => ({
//                         ...prev,
//                         vendor_rate_type: e.target.value,
//                       }))
//                     }
//                     style={{
//                       ...styles.moreRateSelect,
//                       ...(showErrors && !form.vendor_rate_type ? styles.inputError : {}),
//                     }}
//                   >
//                     {MORE_RATE_TYPES.map((type) => (
//                       <option key={type.value || "empty"} value={type.value}>
//                         {type.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div style={styles.vendorInfoBox}>
//                 <div style={styles.vendorInfoHeader}>Auto-filled Vendor Details</div>
//                 {selectedVendorDetailsVisible ? (
//                   <div style={styles.vendorInfoGrid}>
//                     <div style={styles.vendorInfoItem}>
//                       <span style={styles.vendorInfoLabel}>Vendor Company</span>
//                       <strong style={styles.vendorInfoValue}>
//                         {form.vendor_company_name || "—"}
//                       </strong>
//                     </div>

//                     <div style={styles.vendorInfoItem}>
//                       <span style={styles.vendorInfoLabel}>Vendor Contact</span>
//                       <strong style={styles.vendorInfoValue}>
//                         {form.vendor_number || "—"}
//                       </strong>
//                     </div>
//                   </div>
//                 ) : (
//                   <div style={styles.vendorEmptyState}>
//                     Select a vendor to auto-fill company name and contact.
//                   </div>
//                 )}
//               </div>
//             </section>

//             <div style={styles.submitBar}>
//               <div>
//                 <div style={styles.progressText}>
//                   Required fields filled: <b>{requiredFilled}/5</b>
//                 </div>
//                 <div style={styles.progressTrack}>
//                   <span style={{ ...styles.progressFill, width: `${(requiredFilled / 5) * 100}%` }} />
//                 </div>
//               </div>
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 onMouseEnter={() => setIsHoverSubmit(true)}
//                 onMouseLeave={() => setIsHoverSubmit(false)}
//                 style={{
//                   ...styles.submitBtn,
//                   ...(isHoverSubmit && !isSubmitting ? styles.submitBtnHover : {}),
//                   backgroundColor: isSubmitting ? "#BFC9D1" : undefined,
//                   cursor: isSubmitting ? "not-allowed" : "pointer",
//                 }}
//               >
//                 {isSubmitting ? "Submitting..." : "Submit Candidate"}
//               </button>
//             </div>
//           </main>
//         </form>
//       </div>
//     </BaseLayout>
//   );
// }

// const styles = {
//   toast: {
//     position: "fixed",
//     top: "85px",
//     right: "20px",
//     color: "#fff",
//     padding: "12px 25px",
//     borderRadius: "8px",
//     zIndex: 9999,
//     fontWeight: "700",
//     boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
//   },
//   pageShell: {
//     maxWidth: "1180px",
//     margin: "0 auto",
//     paddingBottom: "24px",
//   },
//   header: {
//     display: "flex",
//     alignItems: "center",
//     gap: "16px",
//     marginBottom: "20px",
//     flexWrap: "wrap",
//   },
//   backBtn: {
//     background: "#25343F",
//     color: "#fff",
//     border: "none",
//     padding: "10px 18px",
//     borderRadius: "12px",
//     cursor: "pointer",
//     fontWeight: "800",
//     boxShadow: "0 8px 18px rgba(37,52,63,0.15)",
//   },
//   title: {
//     color: "#25343F",
//     fontSize: "28px",
//     fontWeight: "900",
//     margin: 0,
//     letterSpacing: "-0.6px",
//   },
//   subtitle: {
//     margin: "4px 0 0",
//     color: "#64748B",
//     fontSize: "14px",
//   },
//   formLayout: {
//     display: "grid",
//     gridTemplateColumns: "310px minmax(0, 1fr)",
//     gap: "20px",
//     alignItems: "start",
//   },
//   sidePanel: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "14px",
//     position: "sticky",
//     top: "88px",
//   },
//   mainColumn: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "16px",
//   },
//   section: {
//     background: "#fff",
//     padding: "20px 22px",
//     borderRadius: "22px",
//     border: "1px solid #E7ECF1",
//     boxShadow: "0 18px 42px rgba(37,52,63,0.08)",
//     transition: "transform 0.2s ease, box-shadow 0.2s ease",
//   },
//   sectionHeader: {
//     display: "flex",
//     alignItems: "flex-start",
//     gap: "12px",
//     marginBottom: "16px",
//   },
//   stepBadge: {
//     width: "30px",
//     height: "30px",
//     borderRadius: "10px",
//     background: "#25343F",
//     color: "#fff",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontWeight: "900",
//     flex: "0 0 auto",
//   },
//   secTitle: {
//     fontSize: "18px",
//     color: "#25343F",
//     fontWeight: "900",
//     margin: 0,
//     letterSpacing: "-0.3px",
//   },
//   secSubtitle: {
//     margin: "3px 0 0",
//     color: "#64748B",
//     fontSize: "13px",
//   },
//   candidateGrid: {
//     display: "grid",
//     gridTemplateColumns: "minmax(220px, 1.2fr) minmax(200px, .8fr) 130px",
//     gap: "14px",
//     alignItems: "start",
//   },
//   vendorManualGrid: {
//     display: "grid",
//     gridTemplateColumns: "minmax(260px, 1.5fr) minmax(170px, .7fr)",
//     gap: "14px",
//     alignItems: "start",
//   },
//   inputGroup: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "7px",
//   },
//   inputGroupCompact: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "7px",
//   },
//   label: {
//     fontSize: "11px",
//     fontWeight: "900",
//     color: "#25343F",
//     textTransform: "uppercase",
//     letterSpacing: ".4px",
//   },
//   required: {
//     color: "#FF9B51",
//   },
//   input: {
//     padding: "11px 14px",
//     borderRadius: "13px",
//     border: "1px solid #DDE3EA",
//     background: "#FAFBFC",
//     fontSize: "14px",
//     color: "#25343F",
//     outline: "none",
//     boxSizing: "border-box",
//     width: "100%",
//     transition: "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
//   },
//   inputError: {
//     borderColor: "#E74C3C",
//     boxShadow: "0 0 0 4px rgba(231,76,60,0.12)",
//   },
//   hiddenFileInput: {
//     display: "none",
//   },
//   resumeCard: {
//     padding: "22px",
//     border: "1.5px dashed #DDE3EA",
//     borderRadius: "22px",
//     textAlign: "center",
//     background: "#fff",
//     cursor: "pointer",
//     display: "block",
//     boxShadow: "0 18px 38px rgba(37,52,63,0.08)",
//     transition: "all 0.2s ease",
//   },
//   resumeCardHover: {
//     borderColor: "#FF9B51",
//     background: "#FFF7F0",
//     transform: "translateY(-2px)",
//   },
//   resumeCardUploaded: {
//     borderColor: "#27AE60",
//     background: "#F1FBF5",
//   },
//   errorBorder: {
//     borderColor: "#E74C3C",
//     boxShadow: "0 0 0 4px rgba(231,76,60,0.10)",
//   },
//   resumeIcon: {
//     width: "48px",
//     height: "48px",
//     borderRadius: "15px",
//     background: "#FFF2E8",
//     color: "#FF9B51",
//     margin: "0 auto 10px",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontSize: "24px",
//     fontWeight: "900",
//   },
//   uploadMainText: {
//     color: "#25343F",
//     fontWeight: "900",
//     fontSize: "14px",
//     overflow: "hidden",
//     textOverflow: "ellipsis",
//     whiteSpace: "nowrap",
//   },
//   uploadSubText: {
//     color: "#64748B",
//     fontSize: "12px",
//     marginTop: "4px",
//   },
//   requiredResumeText: {
//     marginTop: "7px",
//     color: "#FF9B51",
//     fontSize: "11px",
//     fontWeight: "900",
//     textTransform: "uppercase",
//   },
//   parsingText: {
//     color: "#FF9B51",
//     fontWeight: "900",
//     margin: "10px 0 0",
//     fontSize: "13px",
//   },
//   resumeActions: {
//     display: "grid",
//     gridTemplateColumns: "1fr auto",
//     gap: "8px",
//   },
//   resumeActionBtn: {
//     border: "1px solid #DDE3EA",
//     background: "#fff",
//     color: "#25343F",
//     borderRadius: "12px",
//     padding: "10px 12px",
//     fontWeight: "800",
//     cursor: "pointer",
//   },
//   resumeRemoveBtn: {
//     border: "1px solid #FFE0D0",
//     background: "#FFF7F0",
//     color: "#E74C3C",
//     borderRadius: "12px",
//     padding: "10px 12px",
//     fontWeight: "800",
//     cursor: "pointer",
//   },
//   previewCard: {
//     background: "#fff",
//     border: "1px solid #E7ECF1",
//     borderRadius: "22px",
//     padding: "18px",
//     boxShadow: "0 18px 38px rgba(37,52,63,0.08)",
//   },
//   previewEyebrow: {
//     color: "#8A98A8",
//     fontSize: "11px",
//     fontWeight: "900",
//     letterSpacing: "1.4px",
//     textTransform: "uppercase",
//     borderBottom: "1px solid #EDF2F7",
//     paddingBottom: "10px",
//     marginBottom: "14px",
//   },
//   previewTop: {
//     display: "flex",
//     gap: "12px",
//     alignItems: "center",
//   },
//   avatar: {
//     width: "52px",
//     height: "52px",
//     borderRadius: "17px",
//     background: "linear-gradient(135deg, #FF9B51, #E8502E)",
//     color: "#fff",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontWeight: "900",
//     fontSize: "17px",
//   },
//   avatarEmpty: {
//     width: "52px",
//     height: "52px",
//     borderRadius: "17px",
//     background: "#F8FAFC",
//     border: "1px dashed #DDE3EA",
//     color: "#B8C2CC",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontWeight: "900",
//   },
//   previewName: {
//     fontSize: "17px",
//     color: "#25343F",
//     fontWeight: "900",
//   },
//   previewPlaceholder: {
//     fontSize: "17px",
//     color: "#CBD5E1",
//     fontWeight: "900",
//   },
//   previewSubText: {
//     fontSize: "12px",
//     color: "#64748B",
//     marginTop: "2px",
//   },
//   previewRows: {
//     marginTop: "16px",
//     border: "1px solid #EDF2F7",
//     borderRadius: "14px",
//     overflow: "hidden",
//   },
//   previewRow: {
//     display: "flex",
//     justifyContent: "space-between",
//     gap: "10px",
//     padding: "11px 12px",
//     borderBottom: "1px solid #EDF2F7",
//     fontSize: "13px",
//     color: "#64748B",
//   },
//   dropdownList: {
//     position: "absolute",
//     top: "100%",
//     left: 0,
//     right: 0,
//     background: "#fff",
//     border: "1px solid #DDE3EA",
//     borderRadius: "14px",
//     maxHeight: "220px",
//     overflowY: "auto",
//     zIndex: 1000,
//     boxShadow: "0 18px 38px rgba(37,52,63,0.16)",
//     marginTop: "6px",
//   },
//   dropdownItem: {
//     padding: "12px 14px",
//     cursor: "pointer",
//     borderBottom: "1px solid #F1F5F9",
//     display: "flex",
//     flexDirection: "column",
//     gap: "3px",
//   },
//   dropdownTitle: {
//     color: "#25343F",
//     fontSize: "14px",
//   },
//   dropdownSubText: {
//     color: "#64748B",
//     fontSize: "12px",
//   },
//   noVendorText: {
//     padding: "14px",
//     textAlign: "center",
//     color: "#64748B",
//     fontSize: "13px",
//   },
//   rateSection: {
//     marginTop: "14px",
//   },
//   rateTypeRow: {
//     display: "grid",
//     gridTemplateColumns: "1fr 180px",
//     gap: "10px",
//     alignItems: "center",
//     marginTop: "8px",
//   },
//   rateTypeWrapper: {
//     display: "grid",
//     gridTemplateColumns: "repeat(6, minmax(72px, 1fr))",
//     gap: "8px",
//   },
//   rateChip: {
//     border: "1px solid #DDE3EA",
//     background: "#fff",
//     color: "#25343F",
//     padding: "11px 10px",
//     borderRadius: "13px",
//     cursor: "pointer",
//     fontWeight: "900",
//     fontSize: "13px",
//     transition: "all 0.18s ease",
//   },
//   rateChipActive: {
//     background: "#25343F",
//     borderColor: "#25343F",
//     color: "#fff",
//     boxShadow: "0 9px 18px rgba(37,52,63,0.22)",
//     transform: "translateY(-1px)",
//   },
//   moreRateSelect: {
//     padding: "11px 12px",
//     borderRadius: "13px",
//     border: "1px solid #DDE3EA",
//     background: "#FAFBFC",
//     color: "#25343F",
//     fontWeight: "800",
//     outline: "none",
//     width: "100%",
//   },
//   vendorInfoBox: {
//     marginTop: "18px",
//     border: "1px solid #E7ECF1",
//     background: "#F8FAFC",
//     borderRadius: "16px",
//     padding: "15px",
//   },
//   vendorInfoHeader: {
//     color: "#64748B",
//     fontWeight: "900",
//     fontSize: "11px",
//     marginBottom: "12px",
//     textTransform: "uppercase",
//     letterSpacing: "1px",
//   },
//   vendorInfoGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
//     gap: "12px",
//   },
//   vendorInfoItem: {
//     background: "#fff",
//     border: "1px solid #EDF2F7",
//     borderRadius: "12px",
//     padding: "12px 13px",
//     display: "flex",
//     flexDirection: "column",
//     gap: "5px",
//   },
//   vendorInfoLabel: {
//     color: "#64748B",
//     fontSize: "11px",
//     fontWeight: "900",
//     textTransform: "uppercase",
//   },
//   vendorInfoValue: {
//     color: "#25343F",
//     fontSize: "14px",
//   },
//   vendorEmptyState: {
//     color: "#64748B",
//     fontSize: "13px",
//   },
//   submitBar: {
//     background: "rgba(255,255,255,0.92)",
//     backdropFilter: "blur(12px)",
//     border: "1px solid #E7ECF1",
//     borderRadius: "20px",
//     padding: "14px 16px",
//     boxShadow: "0 18px 42px rgba(37,52,63,0.10)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     gap: "16px",
//     position: "sticky",
//     bottom: "14px",
//     zIndex: 30,
//   },
//   progressText: {
//     color: "#64748B",
//     fontSize: "13px",
//     fontWeight: "700",
//   },
//   progressTrack: {
//     marginTop: "7px",
//     width: "160px",
//     height: "6px",
//     background: "#EDF2F7",
//     borderRadius: "99px",
//     overflow: "hidden",
//   },
//   progressFill: {
//     display: "block",
//     height: "100%",
//     background: "linear-gradient(135deg, #FF9B51, #E8502E)",
//     borderRadius: "99px",
//     transition: "width 0.25s ease",
//   },
//   submitBtn: {
//     padding: "14px 34px",
//     color: "#fff",
//     border: "none",
//     borderRadius: "15px",
//     fontSize: "15px",
//     fontWeight: "900",
//     background: "linear-gradient(135deg, #FF9B51, #E8502E)",
//     boxShadow: "0 14px 26px rgba(255,155,81,0.28)",
//     transition: "transform 0.18s ease, box-shadow 0.18s ease",
//   },
//   submitBtnHover: {
//     transform: "translateY(-2px)",
//     boxShadow: "0 18px 36px rgba(255,155,81,0.34)",
//   },
// };

// export default AddCandidate;
