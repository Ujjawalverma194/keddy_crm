import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

const QUICK_SUBMISSION_RATE_TYPES = [
  { value: "LPM", label: "LPM" },
  { value: "KPM", label: "KPM" },
  { value: "PHR", label: "PHR" },
  { value: "USD_PH", label: "USD/HR" },
  { value: "USD", label: "USD" },
  { value: "LPA", label: "LPA" },
];

const OTHER_SUBMISSION_RATE_TYPES = [
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

const JD_FILTERS = [
  { value: "today_yesterday", apiValue: "today_yesterday", label: "Today & Yesterday" },
  { value: "today", apiValue: "today", label: "Today" },
  { value: "yesterday", apiValue: "yesterday", label: "Yesterday" },
  { value: "all", apiValue: "all", label: "All" },
];

const normalizeResults = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getEmployeeName = (emp) =>
  `${emp?.first_name || emp?.firstName || emp?.name || "Employee"} ${emp?.last_name || emp?.lastName || ""}`.trim();

const getClientName = (client) =>
  client?.company_name || client?.companyName || client?.client_name || client?.clientName || client?.name || "Client";

const getJdTitle = (jd) =>
  jd?.title || jd?.jd_title || jd?.requirement_title || jd?.designation || "Untitled requirement";

const getJdCompanyName = (jd) =>
  jd?.client_details?.company_name ||
  jd?.clientDetails?.company_name ||
  jd?.client_details?.client_name ||
  jd?.client?.company_name ||
  jd?.client?.client_name ||
  jd?.Client?.company_name ||
  jd?.Client?.client_name ||
  jd?.client_company_name ||
  jd?.company_name ||
  jd?.client_name ||
  "No company";

const getJdDisplayLabel = (jd) => {
  const title = getJdTitle(jd);
  const company = getJdCompanyName(jd);
  return company ? `${title} — ${company}` : title;
};

const getJdId = (jd) =>
  jd?.requirement_id || jd?.jd_id || jd?.code || `JD-${jd?.id}`;

const getRateLabel = (value) =>
  QUICK_SUBMISSION_RATE_TYPES.find((r) => r.value === value)?.label ||
  OTHER_SUBMISSION_RATE_TYPES.find((r) => r.value === value)?.label ||
  value ||
  "";

const getJdBadge = (jd) => {
  const created = jd?.created_at || jd?.createdAt;
  if (!created) return "JD";

  const d = new Date(created);
  if (Number.isNaN(d.getTime())) return "JD";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "TODAY";
  if (d.toDateString() === yesterday.toDateString()) return "YESTERDAY";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
};

function SubmissionModal({
  isOpen,
  onClose,
  selectedCand,
  notify,
  refreshData,
  initialSubmitType = "INTERNAL",
  hideInternalOption = false,
}) {
  const [submitType, setSubmitType] = useState(initialSubmitType || "INTERNAL");
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [jds, setJds] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [jdSearch, setJdSearch] = useState("");
  const [jdFilter, setJdFilter] = useState("today_yesterday");
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [form, setForm] = useState({
    submitted_to: "",
    client: "",
    client_rate: "",
    client_rate_type: "",
    jd_mapping: "",
    remark: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    const nextType = initialSubmitType || (hideInternalOption ? "CLIENT" : "INTERNAL");
    setSubmitType(nextType);
    setEmployeeSearch("");
    setClientSearch("");
    setJdSearch("");
    setJdFilter("today_yesterday");
    setShowErrors(false);
    setSubmitting(false);
    setForm({
      submitted_to: selectedCand?.submitted_to || selectedCand?.submitted_to_id || "",
      client: selectedCand?.client || selectedCand?.client_id || "",
      client_rate: selectedCand?.client_rate || "",
      client_rate_type: selectedCand?.client_rate_type || selectedCand?.vendor_rate_type || "",
      jd_mapping: selectedCand?.jd_mapping || selectedCand?.jd_mapping_id || selectedCand?.requirement_id || "",
      remark: selectedCand?.remark || "",
    });
  }, [isOpen, initialSubmitType, hideInternalOption, selectedCand]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let mounted = true;
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const selectedFilter = JD_FILTERS.find((f) => f.value === jdFilter);
        const jdType = selectedFilter?.apiValue || jdFilter;

        const [empRes, clientRes, jdRes] = await Promise.all([
          apiRequest(`/employee-portal/api/employees/?search=${encodeURIComponent(employeeSearch)}`, "GET"),
          apiRequest(`/employee-portal/clients/list/?page=1&search=${encodeURIComponent(clientSearch)}`, "GET"),
          jdType === "all"
            ? apiRequest(`/jd-mapping/api/requirements/list/?search=${encodeURIComponent(jdSearch)}`, "GET")
            : apiRequest(`/jd-mapping/my-jds/?type=${encodeURIComponent(jdType)}&search=${encodeURIComponent(jdSearch)}`, "GET"),
        ]);

        if (!mounted) return;
        setEmployees(normalizeResults(empRes));
        setClients(normalizeResults(clientRes));
        setJds(normalizeResults(jdRes));
      } catch (err) {
        console.error("Submission modal options load failed:", err);
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    };

    const timer = setTimeout(loadOptions, 300);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, employeeSearch, clientSearch, jdSearch, jdFilter]);

  if (!isOpen) return null;

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const isClientMode = submitType === "CLIENT";
  const selectedEmployee = employees.find((emp) => String(emp.id) === String(form.submitted_to));
  const selectedClient = clients.find((client) => String(client.id) === String(form.client));
  const selectedJd = jds.find((jd) => String(jd.id) === String(form.jd_mapping));

  const candidateName = selectedCand?.candidate_name || selectedCand?.name || "Selected candidate";
  const initials =
    candidateName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "C";

  const quickRateSelected = QUICK_SUBMISSION_RATE_TYPES.some((type) => type.value === form.client_rate_type);
  const otherRateSelected = !quickRateSelected ? form.client_rate_type : "";

  const canSubmit = isClientMode
    ? Boolean(form.client && form.client_rate && form.client_rate_type && form.jd_mapping)
    : Boolean(form.submitted_to && form.jd_mapping);

  const switchMode = (nextType) => {
    setSubmitType(nextType);
    setShowErrors(false);
    setForm((prev) => ({
      ...prev,
      submitted_to: nextType === "INTERNAL" ? prev.submitted_to : "",
      client: nextType === "CLIENT" ? prev.client : "",
      client_rate: nextType === "CLIENT" ? prev.client_rate : "",
      client_rate_type: nextType === "CLIENT" ? prev.client_rate_type : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);

    if (!selectedCand?.id) {
      notify?.("Candidate not found", "error");
      return;
    }

    if (!form.jd_mapping) {
      notify?.("Please select JD", "error");
      return;
    }

    if (!isClientMode && !form.submitted_to) {
      notify?.("Please select team member", "error");
      return;
    }

    if (isClientMode) {
      if (!form.client) return notify?.("Please select client", "error");
      if (!form.client_rate) return notify?.("Please enter client rate", "error");
      if (!form.client_rate_type) return notify?.("Please select rate type", "error");
    }

    const payload = { verification_status: true };
    if (form.remark) payload.remark = form.remark;
    if (form.jd_mapping) {
      payload.jd_mapping = form.jd_mapping;
      payload.requirement = form.jd_mapping;
    }

    if (isClientMode) {
      payload.client = form.client;
      payload.client_rate = form.client_rate;
      payload.client_rate_type = form.client_rate_type;
    } else {
      payload.submitted_to = form.submitted_to;
    }

    setSubmitting(true);
    try {
      // This is the same working update flow used inside EmployeeDashboard.
      await apiRequest(`/employee-portal/api/candidates/${selectedCand.id}/update/`, "PUT", payload);

      // Some screens also maintain a JD-submission table. This call is intentionally non-blocking
      // so the candidate/profile submission does not fail if this optional endpoint is unavailable.
      try {
        await apiRequest("/jd-mapping/api/submissions/create/", "POST", {
          candidate_id: selectedCand.id,
          requirement_id: form.jd_mapping,
        });
      } catch (submissionErr) {
        console.warn("Optional JD submission create failed:", submissionErr);
      }

      notify?.(`${isClientMode ? "Client" : "Internal"} submission completed!`);
      onClose?.();
      refreshData?.();
    } catch (err) {
      console.error("Submission failed:", err);
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        (err?.response?.data ? JSON.stringify(err.response.data) : "") ||
        err?.message ||
        "Submission failed";
      notify?.(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Complete submission</h2>
            <p style={styles.subtitle}>Choose where this profile goes, then pick the JD.</p>
          </div>
          <button type="button" style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={styles.content}>
          <div style={styles.mainCol}>
            <section style={styles.stepBlock}>
              <div style={styles.stepHeader}>
                <span style={styles.stepNo}>1</span>
                <h3 style={styles.stepTitle}>Where to submit</h3>
              </div>

              {!hideInternalOption && (
                <div style={styles.switchGrid}>
                  <button
                    type="button"
                    style={submitType === "INTERNAL" ? styles.switchActive : styles.switchBtn}
                    onClick={() => switchMode("INTERNAL")}
                  >
                    <span style={styles.switchIcon}>👥</span> Internal team
                  </button>
                  <button
                    type="button"
                    style={submitType === "CLIENT" ? styles.switchActive : styles.switchBtn}
                    onClick={() => switchMode("CLIENT")}
                  >
                    <span style={styles.switchIcon}>🏢</span> Client
                  </button>
                </div>
              )}

              {isClientMode ? (
                <>
                  <label style={styles.label}>Select client <span style={styles.required}>*</span></label>
                  <input
                    style={{ ...styles.searchInput, ...(showErrors && !form.client ? styles.inputError : {}) }}
                    placeholder="🔍  Search client..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                  <div style={{ ...styles.listBox, ...(showErrors && !form.client ? styles.listError : {}) }}>
                    {clients.length ? clients.map((client) => {
                      const active = String(form.client) === String(client.id);
                      return (
                        <button
                          type="button"
                          key={client.id}
                          style={active ? styles.listRowActive : styles.listRow}
                          onClick={() => updateForm("client", client.id)}
                        >
                          <span style={active ? styles.checkActive : styles.check}>{active ? "✓" : ""}</span>
                          <span>{getClientName(client)}</span>
                        </button>
                      );
                    }) : <div style={styles.emptyText}>{loadingOptions ? "Loading clients..." : "No clients found"}</div>}
                  </div>

                  <div style={styles.rateGrid}>
                    <div>
                      <label style={styles.label}>Rate <span style={styles.required}>*</span></label>
                      <input
                        style={{ ...styles.input, ...(showErrors && !form.client_rate ? styles.inputError : {}) }}
                        placeholder="Enter rate"
                        value={form.client_rate}
                        onChange={(e) => updateForm("client_rate", e.target.value)}
                        inputMode="decimal"
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Other rate type</label>
                      <select
                        style={styles.select}
                        value={otherRateSelected}
                        onChange={(e) => updateForm("client_rate_type", e.target.value)}
                      >
                        {OTHER_SUBMISSION_RATE_TYPES.map((type) => (
                          <option key={type.value || "empty"} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label style={styles.label}>Rate type <span style={styles.required}>*</span></label>
                  <div style={styles.chipsGrid}>
                    {QUICK_SUBMISSION_RATE_TYPES.map((type) => (
                      <button
                        type="button"
                        key={type.value}
                        style={form.client_rate_type === type.value ? styles.chipActive : styles.chip}
                        onClick={() => updateForm("client_rate_type", type.value)}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                  {showErrors && !form.client_rate_type && <div style={styles.errorHint}>Pick a rate type.</div>}
                </>
              ) : (
                <>
                  <label style={styles.label}>Select team member <span style={styles.required}>*</span></label>
                  <input
                    style={{ ...styles.searchInput, ...(showErrors && !form.submitted_to ? styles.inputError : {}) }}
                    placeholder="🔍  Search team member..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                  />
                  <div style={{ ...styles.listBox, ...(showErrors && !form.submitted_to ? styles.listError : {}) }}>
                    {employees.length ? employees.map((emp) => {
                      const active = String(form.submitted_to) === String(emp.id);
                      return (
                        <button
                          type="button"
                          key={emp.id}
                          style={active ? styles.listRowActive : styles.listRow}
                          onClick={() => updateForm("submitted_to", emp.id)}
                        >
                          <span style={active ? styles.checkActive : styles.check}>{active ? "✓" : ""}</span>
                          <span>{getEmployeeName(emp)}</span>
                        </button>
                      );
                    }) : <div style={styles.emptyText}>{loadingOptions ? "Loading team members..." : "No team members found"}</div>}
                  </div>
                </>
              )}
            </section>

            <section style={styles.stepBlock}>
              <div style={styles.stepHeader}>
                <span style={styles.stepNo}>2</span>
                <h3 style={styles.stepTitle}>Choose JD <span style={styles.required}>*</span></h3>
              </div>

              <div style={styles.filterTabs}>
                {JD_FILTERS.map((filter) => (
                  <button
                    type="button"
                    key={filter.value}
                    style={jdFilter === filter.value ? styles.filterActive : styles.filterBtn}
                    onClick={() => setJdFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <input
                style={{ ...styles.searchInput, ...(showErrors && !form.jd_mapping ? styles.inputError : {}) }}
                placeholder="🔍  Search JD / Requirement ID / Company..."
                value={jdSearch}
                onChange={(e) => setJdSearch(e.target.value)}
              />

              <div style={{ ...styles.jdListBox, ...(showErrors && !form.jd_mapping ? styles.listError : {}) }}>
                {jds.length ? jds.map((jd) => {
                  const active = String(form.jd_mapping) === String(jd.id);
                  return (
                    <button
                      type="button"
                      key={jd.id}
                      style={active ? styles.jdRowActive : styles.jdRow}
                      onClick={() => updateForm("jd_mapping", jd.id)}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={styles.jdTopLine}>
                          <span style={styles.jdId}>{getJdId(jd)}</span>
                          <span style={styles.jdDate}>{getJdBadge(jd)}</span>
                        </div>
                        <div style={styles.jdTitle}>{getJdDisplayLabel(jd)}</div>
                        <div style={styles.jdCompany}>{getJdCompanyName(jd)}</div>
                      </div>
                      <span style={active ? styles.checkActive : styles.check}>{active ? "✓" : ""}</span>
                    </button>
                  );
                }) : <div style={styles.emptyText}>{loadingOptions ? "Loading JDs..." : "No JD found"}</div>}
              </div>
            </section>
          </div>

          <aside style={styles.aside}>
            <div style={styles.liveTopBar} />
            <div style={styles.liveBody}>
              <div style={styles.liveHeader}>Live details</div>
              <div style={styles.candidateMini}>
                <div style={styles.avatar}>{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={styles.miniName}>{candidateName}</div>
                  <div style={styles.miniSub}>{isClientMode ? "🏢 Client submission" : "👥 Internal submission"}</div>
                </div>
              </div>

              <div style={styles.liveRows}>
                <div style={styles.liveRow}>
                  <span>{isClientMode ? "🏢 Client" : "👥 Member"}</span>
                  <b>{isClientMode ? (selectedClient ? getClientName(selectedClient) : "Not selected") : (selectedEmployee ? getEmployeeName(selectedEmployee) : "Not selected")}</b>
                </div>
                {isClientMode && (
                  <div style={styles.liveRow}>
                    <span>₹ Rate</span>
                    <b>{form.client_rate && form.client_rate_type ? `${form.client_rate} ${getRateLabel(form.client_rate_type)}` : "Not set"}</b>
                  </div>
                )}
                <div style={styles.liveRow}>
                  <span>📋 JD</span>
                  <b>{selectedJd ? getJdId(selectedJd) : "Not selected"}</b>
                </div>
                {selectedJd && (
                  <div style={styles.jdPreview}>
                    <div style={styles.jdPreviewTitle}>{getJdTitle(selectedJd)}</div>
                    <div style={styles.jdPreviewCompany}>{getJdCompanyName(selectedJd)}</div>
                  </div>
                )}
              </div>

              <div style={canSubmit ? styles.readyStatus : styles.waitStatus}>
                <span style={canSubmit ? styles.statusIconReady : styles.statusIconWait}>{canSubmit ? "✓" : "•"}</span>
                {canSubmit ? "Ready to submit" : "Complete both steps"}
              </div>

              <button
                type="submit"
                style={canSubmit && !submitting ? styles.sideBtnActive : styles.sideBtn}
                disabled={!canSubmit || submitting}
              >
                {submitting ? "Submitting..." : canSubmit ? "✓ Confirm submission" : "• Complete both steps"}
              </button>
            </div>
          </aside>
        </div>

        <div style={styles.footer}>
          <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            type="submit"
            style={canSubmit && !submitting ? styles.confirmBtn : styles.confirmBtnDisabled}
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Submitting..." : "✓ Confirm submission"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "rgba(16,24,38,0.50)",
    backdropFilter: "blur(6px)",
    boxSizing: "border-box",
  },
  modal: {
    width: "min(880px, 100%)",
    maxHeight: "92vh",
    background: "#FFFFFF",
    borderRadius: "26px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5)",
    color: "#1D1D1F",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    padding: "22px 26px 16px",
    borderBottom: "1px solid #EBEBF0",
    position: "relative",
    flex: "0 0 auto",
  },
  title: {
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
    fontWeight: 800,
    fontSize: "21px",
    margin: 0,
    letterSpacing: "-0.5px",
    color: "#1D1D1F",
  },
  subtitle: {
    margin: "3px 0 0",
    color: "#86868B",
    fontSize: "13px",
  },
  closeBtn: {
    position: "absolute",
    top: "18px",
    right: "20px",
    width: "36px",
    height: "36px",
    borderRadius: "11px",
    border: "1px solid #EBEBF0",
    background: "#FFFFFF",
    color: "#86868B",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontSize: "22px",
    lineHeight: 1,
  },
  content: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 270px",
    gap: "24px",
    padding: "22px 26px",
    overflowY: "auto",
    alignItems: "start",
    boxSizing: "border-box",
  },
  mainCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    minWidth: 0,
  },
  stepBlock: {
    minWidth: 0,
  },
  stepHeader: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    marginBottom: "14px",
  },
  stepNo: {
    width: "26px",
    height: "26px",
    borderRadius: "9px",
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    background: "#1D1D1F",
    color: "#fff",
    fontWeight: 700,
    fontSize: "13px",
  },
  stepTitle: {
    fontWeight: 700,
    fontSize: "16px",
    margin: 0,
    letterSpacing: "-0.3px",
    color: "#1D1D1F",
  },
  switchGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "16px",
  },
  switchBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    cursor: "pointer",
    border: "1.5px solid #EBEBF0",
    background: "#FFFFFF",
    borderRadius: "14px",
    padding: "14px",
    fontWeight: 700,
    fontSize: "14.5px",
    color: "#1D1D1F",
  },
  switchActive: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    cursor: "pointer",
    border: "1.5px solid #FF6A2B",
    background: "#FFF0E7",
    borderRadius: "14px",
    padding: "14px",
    fontWeight: 700,
    fontSize: "14.5px",
    color: "#D2520F",
    boxShadow: "0 0 0 3px #FFF0E7",
  },
  switchIcon: { fontSize: "17px" },
  label: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    color: "#86868B",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "9px",
  },
  required: {
    color: "#FF6A2B",
  },
  searchInput: {
    width: "100%",
    border: "1.5px solid #EBEBF0",
    borderRadius: "13px",
    padding: "12px 14px",
    fontSize: "15px",
    color: "#1D1D1F",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "9px",
    background: "#fff",
  },
  input: {
    width: "100%",
    border: "1.5px solid #EBEBF0",
    borderRadius: "13px",
    padding: "13px 14px",
    fontSize: "15px",
    color: "#1D1D1F",
    background: "#FFFFFF",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    border: "1.5px solid #EBEBF0",
    borderRadius: "13px",
    padding: "13px 14px",
    fontSize: "15px",
    color: "#1D1D1F",
    background: "#FFFFFF",
    outline: "none",
    boxSizing: "border-box",
  },
  inputError: {
    borderColor: "#FF453A",
    boxShadow: "0 0 0 4px #FFE9E7",
  },
  listBox: {
    border: "1.5px solid #EBEBF0",
    borderRadius: "14px",
    overflow: "hidden auto",
    maxHeight: "164px",
    marginBottom: "16px",
  },
  listError: {
    borderColor: "#FF453A",
  },
  listRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    cursor: "pointer",
    background: "#fff",
    border: "none",
    borderBottom: "1px solid #EBEBF0",
    textAlign: "left",
    color: "#1D1D1F",
    fontSize: "14.5px",
    fontWeight: 600,
  },
  listRowActive: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    cursor: "pointer",
    background: "#FFF0E7",
    border: "none",
    borderBottom: "1px solid #EBEBF0",
    textAlign: "left",
    color: "#1D1D1F",
    fontSize: "14.5px",
    fontWeight: 600,
  },
  check: {
    width: "22px",
    height: "22px",
    borderRadius: "7px",
    border: "1.5px solid #DEDEE4",
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    background: "#fff",
    color: "#fff",
    fontWeight: 900,
  },
  checkActive: {
    width: "22px",
    height: "22px",
    borderRadius: "7px",
    border: "1.5px solid #FF6A2B",
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    background: "#FF6A2B",
    color: "#fff",
    fontWeight: 900,
  },
  emptyText: {
    padding: "18px 14px",
    color: "#86868B",
    fontSize: "13.5px",
    textAlign: "center",
  },
  rateGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "16px",
  },
  chipsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "8px",
    marginTop: "8px",
  },
  chip: {
    border: "1.5px solid #EBEBF0",
    background: "#FFFFFF",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
    color: "#1D1D1F",
    padding: "11px 4px",
    borderRadius: "12px",
    textAlign: "center",
  },
  chipActive: {
    border: "1.5px solid #1D1D1F",
    background: "#1D1D1F",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
    color: "#fff",
    padding: "11px 4px",
    borderRadius: "12px",
    textAlign: "center",
    transform: "translateY(-1px)",
  },
  errorHint: {
    fontSize: "12px",
    color: "#FF453A",
    marginTop: "8px",
    fontWeight: 500,
  },
  filterTabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "11px",
  },
  filterBtn: {
    border: "1.5px solid #EBEBF0",
    background: "#FFFFFF",
    cursor: "pointer",
    fontSize: "12.5px",
    fontWeight: 600,
    color: "#1D1D1F",
    padding: "7px 13px",
    borderRadius: "11px",
  },
  filterActive: {
    border: "1.5px solid #FF6A2B",
    background: "#FF6A2B",
    cursor: "pointer",
    fontSize: "12.5px",
    fontWeight: 600,
    color: "#fff",
    padding: "7px 13px",
    borderRadius: "11px",
  },
  jdListBox: {
    border: "1.5px solid #EBEBF0",
    borderRadius: "14px",
    overflow: "hidden auto",
    maxHeight: "220px",
  },
  jdRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 14px",
    cursor: "pointer",
    background: "#fff",
    border: "none",
    borderBottom: "1px solid #EBEBF0",
    textAlign: "left",
  },
  jdRowActive: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 14px",
    cursor: "pointer",
    background: "#FFF0E7",
    border: "none",
    borderBottom: "1px solid #EBEBF0",
    textAlign: "left",
  },
  jdTopLine: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    flexWrap: "wrap",
    marginBottom: "5px",
  },
  jdId: {
    fontWeight: 700,
    fontSize: "12px",
    color: "#D2520F",
    background: "#FFF0E7",
    padding: "2px 8px",
    borderRadius: "7px",
  },
  jdDate: {
    fontSize: "10.5px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    color: "#86868B",
    background: "#F5F5F7",
    border: "1px solid #EBEBF0",
    padding: "2px 7px",
    borderRadius: "6px",
  },
  jdTitle: {
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.3,
    color: "#1D1D1F",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  jdCompany: {
    marginTop: "4px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#64748B",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  aside: {
    position: "sticky",
    top: 0,
    border: "1px solid #EBEBF0",
    borderRadius: "18px",
    overflow: "hidden",
    background: "#FFFFFF",
    boxShadow: "0 10px 30px -18px rgba(0,0,0,0.2)",
  },
  liveTopBar: {
    height: "5px",
    background: "linear-gradient(90deg, #FF6A2B, #FF8A3D)",
  },
  liveBody: {
    padding: "18px",
  },
  liveHeader: {
    fontSize: "10.5px",
    fontWeight: 700,
    letterSpacing: "1.1px",
    textTransform: "uppercase",
    color: "#86868B",
    marginBottom: "15px",
    borderBottom: "1px solid #EBEBF0",
    paddingBottom: "10px",
  },
  candidateMini: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "15px",
  },
  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "13px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    color: "#fff",
    fontWeight: 800,
    fontSize: "16px",
    background: "linear-gradient(135deg, #FF6A2B, #E8502E)",
  },
  miniName: {
    fontWeight: 700,
    fontSize: "16px",
    letterSpacing: "-0.3px",
    color: "#1D1D1F",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  miniSub: {
    fontSize: "12.5px",
    color: "#86868B",
    marginTop: "2px",
  },
  liveRows: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid #EBEBF0",
    borderRadius: "13px",
    overflow: "hidden",
  },
  liveRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "11px 13px",
    fontSize: "13.5px",
    borderBottom: "1px solid #EBEBF0",
    color: "#86868B",
  },
  jdPreview: {
    padding: "11px 13px",
    fontSize: "12px",
    color: "#1D1D1F",
    lineHeight: 1.4,
    background: "#F5F5F7",
  },
  jdPreviewTitle: {
    fontSize: "12.5px",
    color: "#1D1D1F",
    fontWeight: 800,
    lineHeight: 1.35,
  },
  jdPreviewCompany: {
    marginTop: "4px",
    fontSize: "11.5px",
    color: "#64748B",
    fontWeight: 700,
  },
  waitStatus: {
    marginTop: "14px",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "11px 13px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: 600,
    background: "#F5F5F7",
    color: "#86868B",
  },
  readyStatus: {
    marginTop: "14px",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "11px 13px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: 600,
    background: "#E8FBEE",
    color: "#1E9E47",
  },
  statusIconWait: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    background: "#DEDEE4",
    color: "#fff",
  },
  statusIconReady: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    background: "#34C759",
    color: "#fff",
    fontWeight: 900,
  },
  sideBtn: {
    width: "100%",
    marginTop: "14px",
    border: "none",
    borderRadius: "14px",
    padding: "14px",
    fontWeight: 800,
    background: "#E7E7EC",
    color: "#B4B4BD",
    cursor: "not-allowed",
  },
  sideBtnActive: {
    width: "100%",
    marginTop: "14px",
    border: "none",
    borderRadius: "14px",
    padding: "14px",
    fontWeight: 800,
    background: "linear-gradient(135deg, #FF6A2B, #E8502E)",
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 10px 24px -10px rgba(232,80,46,0.7)",
  },
  footer: {
    padding: "16px 26px",
    borderTop: "1px solid #EBEBF0",
    display: "grid",
    gridTemplateColumns: "1fr 1.6fr",
    gap: "12px",
    background: "#FFFFFF",
    flex: "0 0 auto",
  },
  cancelBtn: {
    border: "1px solid #EBEBF0",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "15px",
    padding: "15px",
    borderRadius: "14px",
    background: "#F5F5F7",
    color: "#1D1D1F",
  },
  confirmBtn: {
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "15px",
    padding: "15px",
    borderRadius: "14px",
    color: "#fff",
    background: "linear-gradient(135deg, #FF6A2B, #E8502E)",
    boxShadow: "0 10px 24px -10px rgba(232,80,46,0.7)",
  },
  confirmBtnDisabled: {
    border: "none",
    cursor: "not-allowed",
    fontWeight: 700,
    fontSize: "15px",
    padding: "15px",
    borderRadius: "14px",
    background: "#E7E7EC",
    color: "#B4B4BD",
    boxShadow: "none",
  },
};

export default SubmissionModal;
