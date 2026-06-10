import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, API_BASE } from "../../services/api";
import SubAdminLayout from "../components/SubAdminLayout";
import mammoth from "mammoth";
// External Imports
import StatusUpdateModal from "../../components/StatusUpdateModal";
import { getStatusStyles } from "../../utils/statusHelper";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
const Icons = {
  Edit: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  TrashIcon: ({ color }) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  ),
  File: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
      <polyline points="13 2 13 9 20 9"></polyline>
    </svg>
  ),
  Remark: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FF9B51"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  Alert: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#E74C3C"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
  Preview: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),

  Download: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

function CandidateList() {
  const navigate = useNavigate();

  const getInitialParams = () => new URLSearchParams(window.location.search);
  const getInitialNumberParam = (key, fallback) => {
    const value = Number(getInitialParams().get(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };

  const [candidates, setCandidates] = useState([]);
  const [currentPage, setCurrentPage] = useState(() =>
    getInitialNumberParam("page", 1)
  );
  const [pageSize, setPageSize] = useState(() =>
    getInitialNumberParam("page_size", 10)
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() =>
    getInitialParams().get("search") || ""
  );

  const getInitialFilters = () => {
    const params = getInitialParams();
    return {
      candidate_name: params.get("candidate_name") || "",
      technology: params.get("technology") || "",
      client: params.get("client") || "",
      vendor: params.get("vendor") || "",
      status: params.get("status") || "",
      rate_type: params.get("rate_type") || "",
      exp_from: params.get("exp_from") || "",
      exp_to: params.get("exp_to") || "",
    };
  };

  const [appliedFilters, setAppliedFilters] = useState(() => getInitialFilters());
  const [draftFilters, setDraftFilters] = useState(() => getInitialFilters());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFilterMenu, setActiveFilterMenu] = useState(null);
  const [sortConfig, setSortConfig] = useState(() => ({
    field: getInitialParams().get("sort_field") || "",
    order: getInitialParams().get("sort_order") || "",
  }));

  //   const [previewUrl, setPreviewUrl] = useState("");

  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedCand, setSelectedCand] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewType, setPreviewType] = useState("");
  const [pdfPages, setPdfPages] = useState(null);
  const [editForm, setEditForm] = useState({
    main_status: "",
    sub_status: "",
    remark: "",
  });

  const notify = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const syncListStateToUrl = () => {
    const params = new URLSearchParams();

    if (currentPage && currentPage !== 1) params.set("page", String(currentPage));
    if (pageSize && pageSize !== 10) params.set("page_size", String(pageSize));
    if (searchTerm.trim()) params.set("search", searchTerm.trim());

    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (String(value || "").trim()) {
        params.set(key, String(value).trim());
      }
    });

    if (sortConfig.field) params.set("sort_field", sortConfig.field);
    if (sortConfig.order) params.set("sort_order", sortConfig.order);

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const fetchPageSize = 100;
      const buildUrl = (page) =>
        `/sub-admin/api/admin-candidates/?page=${page}&page_size=${fetchPageSize}`;

      const firstRes = await apiRequest(buildUrl(1), "GET");
      const totalRecords = firstRes.count || 0;
      const totalPages = Math.ceil(totalRecords / fetchPageSize) || 1;
      let allCandidates = firstRes.results || [];

      for (let page = 2; page <= totalPages; page += 1) {
        const pageRes = await apiRequest(buildUrl(page), "GET");
        allCandidates = [...allCandidates, ...(pageRes.results || [])];
      }

      setCandidates(allCandidates);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncListStateToUrl();
  }, [currentPage, pageSize, searchTerm, appliedFilters, sortConfig]);

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    const totalPages = Math.ceil(getVisibleCandidates().length / pageSize) || 1;
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [candidates, searchTerm, appliedFilters, sortConfig, pageSize, currentPage]);

  const handleUpdateSubmit = async () => {
    try {
      await apiRequest(
        `/employee-portal/candidates/${selectedCand.id}/update/`,
        "PUT",
        editForm,
      );
      notify("Status Updated");
      setShowStatusModal(false);
      fetchCandidates();
    } catch (err) {
      notify("Failed to update", "error");
    }
  };

  const handleDeleteAction = async (deleteType) => {
    const actionUrl =
      deleteType === "soft"
        ? `/sub-admin/candidates/${selectedCand.id}/soft-delete/`
        : `/sub-admin/candidates/${selectedCand.id}/hard-delete/`;
    try {
      await apiRequest(actionUrl, "DELETE");
      notify(
        deleteType === "soft" ? "Moved to Trash" : "Permanently Deleted",
        "success",
      );
      setShowDeletePopup(false);
      fetchCandidates();
    } catch (err) {
      notify("Delete failed", "error");
    }
  };

  const truncate = (text, limit) =>
    text?.length > limit ? text.substring(0, limit) + "..." : text;
  const getFileUrl = (resume) => {
    if (!resume) return "";

    return resume.startsWith("http") ? resume : `${API_BASE}${resume}`;
  };

 const handleOpenCV = (e, resume) => {
  e.stopPropagation();

  const fileUrl = getFileUrl(resume);

  window.open(fileUrl, "_blank", "noopener,noreferrer");
};

  const handlePreviewDoc = async (e, resume) => {
    e.stopPropagation();

    try {
      const fileUrl = getFileUrl(resume);

      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();

      const result = await mammoth.convertToHtml({ arrayBuffer });

      setPreviewHtml(result.value);
      setPreviewType("docx");
      setPreviewUrl("");
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Preview error:", error);
      notify("Preview not available. Please download the resume.", "error");
    }
  };
const handlePreviewPDF = async (e, resume) => {
  e.stopPropagation();

  try {
    const fileUrl = getFileUrl(resume);
    console.log("PDF URL:", fileUrl);

    const response = await fetch(fileUrl);
    console.log("PDF status:", response.status);
    console.log("PDF content-type:", response.headers.get("content-type"));

    const blob = await response.blob();
    console.log("PDF blob type:", blob.type);
    console.log("PDF blob size:", blob.size);

    if (!blob.type.includes("pdf")) {
      notify("PDF file URL valid PDF return nahi kar raha", "error");
      return;
    }

    const blobUrl = URL.createObjectURL(blob);

    setPreviewUrl(blobUrl);
    setPreviewType("pdf");
    setPreviewHtml("");
    setPdfPages(null);
    setShowPreviewModal(true);
  } catch (error) {
    console.error("PDF preview error:", error);
    notify("PDF preview failed. Please download the resume.", "error");
  }
};

  const parseExperienceValue = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    const match = String(value).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  const getSortValue = (candidate, field) => {
    switch (field) {
      case "candidate_name":
        return (candidate.candidate_name || "").toLowerCase();
      case "technology":
        return (candidate.technology || "").toLowerCase();
      case "experience":
        return parseExperienceValue(candidate.years_of_experience_manual);
      case "vendor":
        return (
          candidate.vendor_company_name ||
          candidate.vendor_name ||
          candidate.vendor ||
          ""
        ).toLowerCase();
      case "client":
        return (
          candidate.client_name ||
          candidate.client ||
          ""
        ).toLowerCase();
      case "rate_type":
        {
          const rateType = String(candidate.vendor_rate_type || "").toUpperCase().trim();
          const rateRank = {
            KPM: 1,
            LPM: 2,
            LPA: 3,
          };
          return rateRank[rateType] || 999;
        }
      default:
        return "";
    }
  };

  const matchesTextFilter = (source, filterValue) => {
    if (!filterValue) return true;
    return String(source || "")
      .toLowerCase()
      .includes(String(filterValue).toLowerCase().trim());
  };

  const getSearchText = (candidate) =>
    [
      candidate.candidate_name,
      candidate.email,
      candidate.candidate_email,
      candidate.phone,
      candidate.mobile,
      candidate.technology,
      candidate.client_name,
      candidate.client,
      candidate.vendor_company_name,
      candidate.vendor_name,
      candidate.vendor,
      candidate.main_status,
      candidate.sub_status,
      candidate.vendor_rate_type,
      candidate.years_of_experience_manual,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  const getSearchScore = (candidate, search) => {
    const term = String(search || "").toLowerCase().trim();
    if (!term) return 0;

    const candidateName = String(candidate.candidate_name || "").toLowerCase();
    const technology = String(candidate.technology || "").toLowerCase();
    const email = String(candidate.email || candidate.candidate_email || "").toLowerCase();
    const client = String(candidate.client_name || candidate.client || "").toLowerCase();
    const vendor = String(
      candidate.vendor_company_name || candidate.vendor_name || candidate.vendor || ""
    ).toLowerCase();
    const fullText = getSearchText(candidate);

    if (candidateName === term) return 100;
    if (candidateName.startsWith(term)) return 90;
    if (candidateName.includes(term)) return 80;
    if (technology.startsWith(term)) return 70;
    if (technology.includes(term)) return 60;
    if (email.includes(term)) return 55;
    if (client.includes(term)) return 45;
    if (vendor.includes(term)) return 40;
    if (fullText.includes(term)) return 30;

    return 0;
  };

  const matchesSearchFilter = (candidate) => {
    const term = String(searchTerm || "").toLowerCase().trim();
    if (!term) return true;
    return getSearchScore(candidate, term) > 0;
  };

  const getVisibleCandidates = () => {
    const filtered = candidates.filter((candidate) => {
      const expValue = parseExperienceValue(candidate.years_of_experience_manual);
      const expFrom = appliedFilters.exp_from !== "" ? Number(appliedFilters.exp_from) : null;

      return (
        matchesSearchFilter(candidate) &&
        matchesTextFilter(candidate.candidate_name, appliedFilters.candidate_name) &&
        matchesTextFilter(candidate.technology, appliedFilters.technology) &&
        matchesTextFilter(candidate.client_name || candidate.client, appliedFilters.client) &&
        matchesTextFilter(
          candidate.vendor_company_name || candidate.vendor_name || candidate.vendor,
          appliedFilters.vendor
        ) &&
        matchesTextFilter(candidate.main_status, appliedFilters.status) &&
        matchesTextFilter(candidate.vendor_rate_type, appliedFilters.rate_type) &&
        (expFrom === null || expValue >= expFrom)
      );
    });

    const sorted = [...filtered];
    const hasSearch = String(searchTerm || "").trim();

    sorted.sort((a, b) => {
      if (hasSearch) {
        const scoreDiff = getSearchScore(b, searchTerm) - getSearchScore(a, searchTerm);
        if (scoreDiff !== 0) return scoreDiff;
      }

      if (!sortConfig.field || !sortConfig.order) return 0;

      const aValue = getSortValue(a, sortConfig.field);
      const bValue = getSortValue(b, sortConfig.field);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.order === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortConfig.order === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    return sorted;
  };

  const visibleCandidates = getVisibleCandidates();
  const totalProfiles = visibleCandidates.length;
  const totalPages = Math.ceil(totalProfiles / pageSize) || 1;
  const paginatedCandidates = visibleCandidates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const applyHeaderFilter = (field, order) => {
    setSortConfig({ field, order });
    setActiveFilterMenu(null);
    setCurrentPage(1);
  };

  const clearHeaderFilter = () => {
    setSortConfig({ field: "", order: "" });
    setActiveFilterMenu(null);
    setCurrentPage(1);
  };

  const updateDraftFilter = (key, value) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyCategoryFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const clearCategoryFilters = () => {
    const emptyFilters = {
      candidate_name: "",
      technology: "",
      client: "",
      vendor: "",
      status: "",
      rate_type: "",
      exp_from: "",
      exp_to: "",
    };

    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const getActiveFilterCount = () =>
    Object.values(appliedFilters).filter((value) => String(value || "").trim()).length;

  const renderFilterHeader = (label, field, options) => {    const isActive = sortConfig.field === field;
    const activeOption = options.find((option) => option.order === sortConfig.order);

    return (
      <div style={styles.filterHeaderWrap}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveFilterMenu(activeFilterMenu === field ? null : field);
          }}
          style={{
            ...styles.headerFilterBtn,
            ...(isActive ? styles.headerFilterBtnActive : {}),
          }}
        >
          <span>{label}</span>
          {isActive && activeOption ? (
            <span style={styles.activeFilterText}>{activeOption.shortLabel}</span>
          ) : null}
          <span style={styles.filterCaret}>▾</span>
        </button>

        {activeFilterMenu === field && (
          <div style={styles.filterDropdown} onClick={(e) => e.stopPropagation()}>
            <div style={styles.filterDropdownTitle}>Sort {label}</div>

            {options.map((option) => (
              <button
                key={`${field}-${option.order}`}
                type="button"
                onClick={() => applyHeaderFilter(field, option.order)}
                style={{
                  ...styles.filterOption,
                  ...(isActive && sortConfig.order === option.order
                    ? styles.filterOptionActive
                    : {}),
                }}
              >
                {option.label}
              </button>
            ))}

            <button
              type="button"
              onClick={clearHeaderFilter}
              style={styles.clearFilterOption}
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderGroupedRows = () => {
    let lastDate = "";
    return paginatedCandidates.map((c, i) => {
      const currentDate = new Date(c.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      let dateSeparator =
        currentDate !== lastDate ? (
          <tr key={`sep-${i}`}>
            <td colSpan="10" style={styles.dateSeparator}>
              {currentDate}
            </td>
          </tr>
        ) : null;
      lastDate = currentDate;

      const statusStyle = getStatusStyles(c.main_status || "SUBMITTED");
      return (
        <React.Fragment key={c.id}>
          {dateSeparator}
          <tr
            style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }}
            onClick={() =>
              navigate(`/sub-admin/candidate/view/${c.id}${window.location.search || ""}`)
            }
          >
            {/* 1. Submitted To/By */}
            <td style={styles.td}>
              <div>
                To: <b>{c.submitted_to_name || "-"}</b>
              </div>
              <div>
                By:{" "}
                <b style={{ color: "#27AE60" }}>{c.created_by_name || "-"}</b>
              </div>
            </td>
            {/* 2. Candidate */}
            <td style={styles.td}>
              <b>{c.candidate_name}</b>
            </td>
            {/* 3. Tech */}
            <td style={styles.td}>{truncate(c.technology, 30)}</td>
            {/* 4. Exp */}
            <td style={styles.td}>{c.years_of_experience_manual || "0"} Yrs</td>
            {/* 5. Client */}
            <td style={styles.td}>{c.client_name || "N/A"}</td>
            {/* 6. Vendor */}
            <td style={styles.td}>
              <b>{truncate(c.vendor_company_name || c.vendor_name, 15)}</b>
              <br />
              <small style={styles.subStatusText}>
                {c.vendor_number || "N/A"}
              </small>
            </td>
            {/* 7. Rate */}
            <td style={styles.td}>
              ₹{c.vendor_rate} {c.vendor_rate_type || ""}
            </td>
            {/* 8. Status */}
            <td style={styles.td}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    ...styles.badge,
                    color: statusStyle.text,
                    fontWeight: "800",
                  }}
                >
                  {c.main_status}
                </span>
                {c.remark && (
                  <div style={styles.remarkIcon} title={c.remark}>
                    <Icons.Remark />
                  </div>
                )}
              </div>
              <small
                style={{
                  ...styles.subStatusText,
                  color: statusStyle.text,
                  fontWeight: "700",
                }}
              >
                {c.sub_status}
              </small>
            </td>
            {/* 9. CV */}
            <td style={styles.td}>
              {!c.resume ? (
                <span style={styles.noCvText}>Not Uploaded</span>
              ) : (
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={(e) =>
                      c.resume.toLowerCase().endsWith(".pdf")
                        ? handlePreviewPDF(e, c.resume)
                        : handlePreviewDoc(e, c.resume)
                    }
                    style={styles.iconBtn}
                    title="Preview Resume"
                  >
                    <Icons.Preview />
                  </button>

                <button
  onClick={(e) => handleOpenCV(e, c.resume)}
  style={styles.iconBtn}
  title="Open Resume"
>
  <Icons.Download />
</button>
                </div>
              )}
            </td>
            {/* 10. Action */}
            <td style={styles.td}>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCand(c);
                    setEditForm({
                      main_status: c.main_status,
                      sub_status: c.sub_status,
                      remark: c.remark,
                    });
                    setShowStatusModal(true);
                  }}
                  style={styles.editBtn}
                >
                  <Icons.Edit />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCand(c);
                    setShowDeletePopup(true);
                  }}
                  style={styles.trashBtn}
                >
                  <Icons.TrashIcon color="#E74C3C" />
                </button>
              </div>
            </td>
          </tr>
        </React.Fragment>
      );
    });
  };

  return (
    <SubAdminLayout>
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
      <div style={styles.btnGroup}>
        <button
          onClick={() => navigate(-1)}
          style={{ ...styles.actionBtn, background: "#25343F" }}
        >
          ← Back
        </button>
        <button
          onClick={() => navigate("/sub-admin/add-candidate")}
          style={styles.actionBtn}
        >
          + Add Candidate
        </button>
      </div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.welcome}>Total Profiles ({totalProfiles})</h2>
          <p style={styles.subText}>
            Management dashboard for tracking recruitment progress.
          </p>
        </div>
      </div>

      <div style={styles.filterBar}>
        <input
          placeholder="Search name/email..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />

        <button
          type="button"
          style={{
            ...styles.linkedInFilterToggle,
            ...(getActiveFilterCount() ? styles.linkedInFilterToggleActive : {}),
          }}
          onClick={() => setShowFilterPanel((prev) => !prev)}
        >
          Filters
          {getActiveFilterCount() ? (
            <span style={styles.filterCountBadge}>{getActiveFilterCount()}</span>
          ) : null}
          <span style={styles.filterCaret}>▾</span>
        </button>
      </div>

      {showFilterPanel && (
        <div style={styles.linkedInFilterPanel}>
          <div style={styles.filterPanelHeader}>
            <div>
              <h3 style={styles.filterPanelTitle}>Search Filters</h3>
              <p style={styles.filterPanelSubText}>
                Select multiple categories and click Apply Filters.
              </p>
            </div>

            <button
              type="button"
              style={styles.filterPanelClose}
              onClick={() => setShowFilterPanel(false)}
            >
              ×
            </button>
          </div>

          <div style={styles.categoryFilterGrid}>
            <div style={styles.categoryFilterGroup}>
              <label style={styles.categoryFilterLabel}>Candidate Name</label>
              <input
                placeholder="Search candidate..."
                style={styles.categoryFilterInput}
                value={draftFilters.candidate_name}
                onChange={(e) => updateDraftFilter("candidate_name", e.target.value)}
              />
            </div>

            <div style={styles.categoryFilterGroup}>
              <label style={styles.categoryFilterLabel}>Technology</label>
              <input
                placeholder="React, Java, Node..."
                style={styles.categoryFilterInput}
                value={draftFilters.technology}
                onChange={(e) => updateDraftFilter("technology", e.target.value)}
              />
            </div>

            <div style={styles.categoryFilterGroup}>
              <label style={styles.categoryFilterLabel}>Client</label>
              <input
                placeholder="Client name..."
                style={styles.categoryFilterInput}
                value={draftFilters.client}
                onChange={(e) => updateDraftFilter("client", e.target.value)}
              />
            </div>

            <div style={styles.categoryFilterGroup}>
              <label style={styles.categoryFilterLabel}>Vendor</label>
              <input
                placeholder="Vendor name..."
                style={styles.categoryFilterInput}
                value={draftFilters.vendor}
                onChange={(e) => updateDraftFilter("vendor", e.target.value)}
              />
            </div>

            <div style={styles.categoryFilterGroup}>
              <label style={styles.categoryFilterLabel}>Status</label>
              <select
                style={styles.categoryFilterInput}
                value={draftFilters.status}
                onChange={(e) => updateDraftFilter("status", e.target.value)}
              >
                <option value="">All Status</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ONBORD">Onboard</option>
                <option value="ONBOARD">Onboard</option>
                <option value="OFFBOARDED">Offboarded</option>
                <option value="REJECTED">Rejected</option>
                <option value="HOLD">Hold</option>
              </select>
            </div>

            <div style={styles.categoryFilterGroup}>
              <label style={styles.categoryFilterLabel}>Rate Type</label>
              <select
                style={styles.categoryFilterInput}
                value={draftFilters.rate_type}
                onChange={(e) => updateDraftFilter("rate_type", e.target.value)}
              >
                <option value="">All Rate Types</option>
                <option value="KPM">KPM</option>
                <option value="LPM">LPM</option>
                <option value="LPA">LPA</option>
                <option value="PHR">PHR</option>
                <option value="USD">USD</option>
                <option value="USD_PH">USD/hr</option>
              </select>
            </div>

            <div style={styles.categoryFilterGroup}>
              <label style={styles.categoryFilterLabel}>Experience</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Min experience e.g. 3 or 3.5"
                style={styles.categoryFilterInput}
                value={draftFilters.exp_from}
                onChange={(e) => {
                  const value = e.target.value;

                  // Allow only numbers and float values like 3 or 3.5
                  if (/^\d*\.?\d*$/.test(value)) {
                    updateDraftFilter("exp_from", value);
                    updateDraftFilter("exp_to", "");
                  }
                }}
              />
            </div>
          </div>

          <div style={styles.filterPanelActions}>
            <button
              type="button"
              style={styles.clearFiltersBtn}
              onClick={clearCategoryFilters}
            >
              Clear Filters
            </button>

            <button
              type="button"
              style={styles.applyFiltersBtn}
              onClick={applyCategoryFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <div style={styles.sectionContainer}>
        <div style={styles.tableWrapper}>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.th}>Submitted To/By</th>
                  <th style={styles.th}>
                    {renderFilterHeader("Candidate", "candidate_name", [
                      { label: "Candidate: A to Z", shortLabel: "A-Z", order: "asc" },
                      { label: "Candidate: Z to A", shortLabel: "Z-A", order: "desc" },
                    ])}
                  </th>
                  <th style={styles.th}>
                    {renderFilterHeader("Tech", "technology", [
                      { label: "Technology: A to Z", shortLabel: "A-Z", order: "asc" },
                      { label: "Technology: Z to A", shortLabel: "Z-A", order: "desc" },
                    ])}
                  </th>
                  <th style={styles.th}>
                    {renderFilterHeader("Exp", "experience", [
                      { label: "Experience: Low to High", shortLabel: "Low-High", order: "asc" },
                      { label: "Experience: High to Low", shortLabel: "High-Low", order: "desc" },
                    ])}
                  </th>
                  <th style={styles.th}>
                    {renderFilterHeader("Client", "client", [
                      { label: "Client: A to Z", shortLabel: "A-Z", order: "asc" },
                      { label: "Client: Z to A", shortLabel: "Z-A", order: "desc" },
                    ])}
                  </th>
                  <th style={styles.th}>
                    {renderFilterHeader("Vendor", "vendor", [
                      { label: "Vendor: A to Z", shortLabel: "A-Z", order: "asc" },
                      { label: "Vendor: Z to A", shortLabel: "Z-A", order: "desc" },
                    ])}
                  </th>
                  <th style={styles.th}>
                    {renderFilterHeader("Rate", "rate_type", [
                      { label: "Rate Type: KPM → LPM → LPA", shortLabel: "K-L-L", order: "asc" },
                      { label: "Rate Type: LPA → LPM → KPM", shortLabel: "L-L-K", order: "desc" },
                    ])}
                  </th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>CV</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={styles.loadingTd}>
                      Loading...
                    </td>
                  </tr>
                ) : totalProfiles === 0 ? (
                  <tr>
                    <td colSpan="10" style={styles.loadingTd}>
                      No profiles found
                    </td>
                  </tr>
                ) : (
                  renderGroupedRows()
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={styles.pagination}>
        <div style={styles.pageSizeControl}>
          <span style={styles.pageSizeLabel}>Profiles per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={styles.pageSizeSelect}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={40}>40</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}
        >
          &#11013; Prev
        </button>
        <span style={styles.pageInfo}>
          {currentPage} / {totalPages}
        </span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          style={
            currentPage >= totalPages ? styles.pageBtnDisabled : styles.pageBtn
          }
        >
          Next &#10140;
        </button>
      </div>

      {showDeletePopup && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowDeletePopup(false)}
        >
          <div
            style={styles.deleteContent}
            onClick={(e) => e.stopPropagation()}
          >
            <Icons.Alert />
            <h3
              style={{
                margin: "15px 0 5px",
                color: "#25343F",
                fontWeight: "800",
              }}
            >
              Delete Candidate?
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#7F8C8D",
                marginBottom: "20px",
              }}
            >
              Remove <b>{selectedCand?.candidate_name}</b>
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                width: "100%",
              }}
            >
              <button
                style={styles.softBtn}
                onClick={() => handleDeleteAction("soft")}
              >
                Move to Trash (Soft Delete)
              </button>
              <button
                style={styles.hardBtn}
                onClick={() => handleDeleteAction("hard")}
              >
                Delete Permanently (Hard Delete)
              </button>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <StatusUpdateModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        formData={editForm}
        setFormData={setEditForm}
        onSave={handleUpdateSubmit}
      />
      {showPreviewModal && (
        <div
          style={styles.previewModalOverlay}
          onClick={() => {
            setShowPreviewModal(false);
            if (previewUrl?.startsWith("blob:"))
              URL.revokeObjectURL(previewUrl);
            setPreviewUrl("");
          }}
        >
          <div
            style={styles.previewModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.previewHeader}>
              <h3 style={{ margin: 0, color: "#25343F" }}>Resume Preview</h3>

              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  if (previewUrl?.startsWith("blob:"))
                    URL.revokeObjectURL(previewUrl);
                  setPreviewUrl("");
                }}
                style={styles.previewCloseBtn}
              >
                ×
              </button>
            </div>

            {previewType === "pdf" ? (
              <div style={styles.pdfPreviewBox}>
                <Document
                  file={previewUrl}
                  onLoadSuccess={({ numPages }) => setPdfPages(numPages)}
                  onLoadError={(error) => {
                    console.error("PDF Error:", error);
                    notify("PDF preview failed", "error");
                  }}
                >
                  {Array.from(new Array(pdfPages || 0), (_, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      width={850}
                    />
                  ))}
                </Document>
              </div>
            ) : (
              <div
                style={styles.wordPreviewBox}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            )}
          </div>
        </div>
      )}
    </SubAdminLayout>
  );
}

const styles = {
  toast: {
    position: "fixed",
    top: "85px",
    right: "20px",
    color: "#fff",
    padding: "12px 25px",
    borderRadius: "8px",
    zIndex: 10001,
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    flexWrap: "wrap",
    gap: "15px",
  },
  welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
  subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
  btnGroup: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionBtn: {
    background: "#FF9B51",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
  },
  filterBar: { display: "flex", gap: "15px", marginBottom: "20px" },
  searchInput: {
    flex: 2,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #F0F2F4",
    outline: "none",
    fontSize: "13px",
  },
  filterInput: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #F0F2F4",
    outline: "none",
    fontSize: "13px",
  },
  linkedInFilterToggle: {
    background: "#fff",
    color: "#25343F",
    border: "1px solid #E2E8F0",
    padding: "11px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "900",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.04)",
  },
  linkedInFilterToggleActive: {
    background: "#FFF5EB",
    border: "1px solid #FFB777",
    color: "#FF7A1A",
  },
  filterCountBadge: {
    background: "#FF9B51",
    color: "#fff",
    minWidth: "20px",
    height: "20px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 6px",
  },
  linkedInFilterPanel: {
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "18px",
    marginBottom: "20px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
  },
  filterPanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "16px",
  },
  filterPanelTitle: {
    margin: 0,
    color: "#25343F",
    fontSize: "16px",
    fontWeight: "900",
  },
  filterPanelSubText: {
    margin: "4px 0 0",
    color: "#64748B",
    fontSize: "12px",
    fontWeight: "600",
  },
  filterPanelClose: {
    width: "30px",
    height: "30px",
    border: "none",
    borderRadius: "8px",
    background: "#F1F5F9",
    color: "#25343F",
    cursor: "pointer",
    fontSize: "20px",
    fontWeight: "900",
    lineHeight: 1,
  },
  categoryFilterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px",
  },
  categoryFilterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  categoryFilterLabel: {
    fontSize: "11px",
    color: "#64748B",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  categoryFilterInput: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    outline: "none",
    fontSize: "13px",
    color: "#25343F",
    background: "#fff",
    boxSizing: "border-box",
  },
  filterPanelActions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "12px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
  clearFiltersBtn: {
    background: "#F8FAFC",
    color: "#64748B",
    border: "1px solid #E2E8F0",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "13px",
  },
  applyFiltersBtn: {
    background: "#FF9B51",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "13px",
    boxShadow: "0 5px 14px rgba(255,155,81,0.25)",
  },
  sectionContainer: { marginBottom: "35px" },
  tableWrapper: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    border: "1px solid #F0F2F4",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
  th: {
    padding: "14px 18px",
    textAlign: "left",
    fontSize: "11px",
    color: "#94A3B8",
    fontWeight: "800",
    textTransform: "uppercase",
    position: "relative",
  },
  filterHeaderWrap: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
  },
  headerFilterBtn: {
    border: "1px solid transparent",
    background: "transparent",
    color: "#64748B",
    padding: "6px 8px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  headerFilterBtnActive: {
    background: "#FFF5EB",
    border: "1px solid #FFD9BA",
    color: "#FF7A1A",
  },
  activeFilterText: {
    background: "#FF9B51",
    color: "#fff",
    padding: "2px 5px",
    borderRadius: "999px",
    fontSize: "9px",
    lineHeight: 1,
  },
  filterCaret: {
    fontSize: "12px",
    color: "inherit",
  },
  filterDropdown: {
    position: "absolute",
    top: "32px",
    left: 0,
    minWidth: "190px",
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.14)",
    padding: "8px",
    zIndex: 30,
    textTransform: "none",
  },
  filterDropdownTitle: {
    fontSize: "11px",
    color: "#94A3B8",
    fontWeight: "900",
    padding: "7px 8px",
    borderBottom: "1px solid #F1F5F9",
    marginBottom: "5px",
  },
  filterOption: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#334155",
    textAlign: "left",
    padding: "9px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  filterOptionActive: {
    background: "#FFF5EB",
    color: "#FF7A1A",
  },
  clearFilterOption: {
    width: "100%",
    border: "none",
    background: "#F8FAFC",
    color: "#64748B",
    textAlign: "left",
    padding: "9px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "800",
    marginTop: "5px",
  },
  tableRow: {
    borderBottom: "1px solid #F1F5F9",
    transition: "0.2s",
    cursor: "pointer",
  },
  td: { padding: "14px 18px", fontSize: "13px", color: "#334155" },
  dateSeparator: {
    padding: "12px 20px",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: "800",
    fontSize: "12px",
    textTransform: "uppercase",
    borderBottom: "1px solid #e2e8f0",
  },
  badge: {
    background: "rgba(255, 155, 81, 0.12)",
    color: "#FF9B51",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
  },
  subStatusText: {
    fontSize: "11px",
    color: "#7f8c8d",
    display: "block",
    marginTop: "2px",
  },
  remarkIcon: {
    display: "flex",
    cursor: "help",
    padding: "4px",
    borderRadius: "4px",
    background: "#FFF5EB",
  },
  cvBtn: {
    background: "#F1F5F9",
    border: "1px solid #E2E8F0",
    color: "#25343F",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  editBtn: {
    border: "none",
    background: "#F1F5F9",
    padding: "6px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  trashBtn: {
    border: "none",
    background: "#FFF5F5",
    padding: "6px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    marginTop: "10px",
    marginBottom: "20px",
  },
  pageBtn: {
    padding: "8px 25px",
    background: "#25343F",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },
  pageBtnDisabled: {
    padding: "8px 25px",
    background: "#E2E8F0",
    color: "#94A3B8",
    border: "none",
    borderRadius: "8px",
    cursor: "not-allowed",
  },
  pageSizeControl: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#fff",
    border: "1px solid #E2E8F0",
    padding: "6px 10px",
    borderRadius: "8px",
  },
  pageSizeLabel: {
    fontSize: "12px",
    color: "#64748B",
    fontWeight: "800",
  },
  pageSizeSelect: {
    border: "none",
    outline: "none",
    background: "#F8FAFC",
    borderRadius: "6px",
    padding: "6px 8px",
    fontWeight: "800",
    color: "#25343F",
    cursor: "pointer",
  },
  pageInfo: { fontWeight: "800", color: "#25343F", fontSize: "14px" },
  loadingTd: {
    textAlign: "center",
    padding: "40px",
    fontWeight: "800",
    color: "#25343F",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(37, 52, 63, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    backdropFilter: "blur(4px)",
  },
  deleteContent: {
    background: "#fff",
    padding: "30px",
    borderRadius: "20px",
    width: "350px",
    textAlign: "center",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
  },
  softBtn: {
    background: "#FFF5F5",
    color: "#E74C3C",
    border: "1px solid #FED7D7",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
    fontSize: "13px",
  },
  hardBtn: {
    background: "#E74C3C",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
    fontSize: "13px",
  },
  cancelBtn: {
    background: "transparent",
    color: "#7F8C8D",
    border: "none",
    padding: "10px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
  },
  noCvText: {
    color: "#94A3B8",
    fontSize: "11px",
    fontWeight: "800",
    background: "#F8FAFC",
    border: "1px dashed #CBD5E1",
    padding: "6px 10px",
    borderRadius: "6px",
    display: "inline-block",
  },

  iconBtn: {
    width: "32px",
    height: "32px",
    border: "1px solid #E2E8F0",
    background: "#F8FAFC",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#475569",
  },
  previewModalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(37, 52, 63, 0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },

  previewModalContent: {
    background: "#fff",
    width: "85%",
    height: "90%",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
  },

  previewHeader: {
    padding: "12px 18px",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  previewCloseBtn: {
    background: "#F1F5F9",
    border: "none",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    fontSize: "22px",
    cursor: "pointer",
    color: "#25343F",
  },

  wordPreviewBox: {
    flex: 1,
    padding: "40px",
    overflowY: "auto",
    background: "#fff",
    color: "#25343F",
    fontSize: "14px",
    lineHeight: "1.8",
    maxWidth: "900px",
    margin: "0 auto",
  },
  previewIframe: {
    width: "100%",
    height: "100%",
    border: "none",
  },
  pdfPreviewBox: {
    flex: 1,
    overflowY: "auto",
    background: "#E5E7EB",
    padding: "25px",
    display: "flex",
    justifyContent: "center",
  },
};

export default CandidateList;
