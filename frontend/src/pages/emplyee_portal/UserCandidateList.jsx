import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";

// Shared Components Import
import { getStatusStyles } from "../../utils/statusHelper";
import StatusUpdateModal from "../../components/StatusUpdateModal";

const Icons = {
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Remark: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  External: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  
  CaretDown: () => (
    <span style={{ fontSize: "10px", fontWeight: "900", lineHeight: 1 }}>▼</span>
  ),
};

const SORT_OPTIONS = {
  candidate_name: [
    { label: "Name: A to Z", order: "asc" },
    { label: "Name: Z to A", order: "desc" },
  ],
  technology: [
    { label: "Tech: A to Z", order: "asc" },
    { label: "Tech: Z to A", order: "desc" },
  ],
  years_of_experience_manual: [
    { label: "Experience: Low to High", order: "asc" },
    { label: "Experience: High to Low", order: "desc" },
  ],
  vendor_company_name: [
    { label: "Vendor: A to Z", order: "asc" },
    { label: "Vendor: Z to A", order: "desc" },
  ],
  client_name: [
    { label: "Client: A to Z", order: "asc" },
    { label: "Client: Z to A", order: "desc" },
  ],
  vendor_rate_type: [
    { label: "Rate: KPM → LPM → LPA", order: "asc" },
    { label: "Rate: LPA → LPM → KPM", order: "desc" },
  ],
};

function CandidateList() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [candidates, setCandidates] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(Number(queryParams.get("page")) || 1);
  const [pageSize, setPageSize] = useState(Number(queryParams.get("page_size")) || 10);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(queryParams.get("search") || "");

  const getInitialFilters = () => ({
    candidate_name: queryParams.get("candidate_name") || "",
    technology: queryParams.get("technology") || "",
    client: queryParams.get("client") || "",
    vendor: queryParams.get("vendor") || "",
    status: queryParams.get("status") || "",
    rate_type: queryParams.get("rate_type") || "",
    exp_from: queryParams.get("exp_from") || "",
    exp_to: queryParams.get("exp_to") || "",
  });

  const [appliedFilters, setAppliedFilters] = useState(() => getInitialFilters());
  const [draftFilters, setDraftFilters] = useState(() => getInitialFilters());
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [sortField, setSortField] = useState(queryParams.get("sort_by") || "");
  const [sortOrder, setSortOrder] = useState(queryParams.get("sort_order") || "");
  const [openFilter, setOpenFilter] = useState(null);
  const filterRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedCand, setSelectedCand] = useState(null);
  const [editForm, setEditForm] = useState({ main_status: "", sub_status: "", remark: "" });
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  const updateUrlParams = (page, search, size, activeSortField, activeSortOrder, filters = appliedFilters) => {
    const params = new URLSearchParams();

    if (page && Number(page) !== 1) params.set("page", String(page));
    if (size && Number(size) !== 10) params.set("page_size", String(size));
    if (search) params.set("search", search);

    Object.entries(filters).forEach(([key, value]) => {
      if (String(value || "").trim()) {
        params.set(key, String(value).trim());
      }
    });

    if (activeSortField) params.set("sort_by", activeSortField);
    if (activeSortOrder) params.set("sort_order", activeSortOrder);

    const queryString = params.toString();
    const nextUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  };

  useEffect(() => {
    updateUrlParams(currentPage, searchTerm, pageSize, sortField, sortOrder, appliedFilters);
  }, [currentPage, searchTerm, pageSize, sortField, sortOrder, appliedFilters]);

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const fetchPageSize = 100;
      const buildUrl = (page) =>
        `/employee-portal/api/user/candidates/list/?page=${page}&page_size=${fetchPageSize}`;

      const firstRes = await apiRequest(buildUrl(1), "GET");
      const totalRecords = firstRes.count || 0;
      const totalFetchPages = Math.ceil(totalRecords / fetchPageSize) || 1;
      let allCandidates = firstRes.results || [];

      for (let page = 2; page <= totalFetchPages; page += 1) {
        const pageRes = await apiRequest(buildUrl(page), "GET");
        allCandidates = [...allCandidates, ...(pageRes.results || [])];
      }

      setCandidates(allCandidates);
      setCount(allCandidates.length);
    } catch (err) {
      console.error(err);
      setCandidates([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const notify = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const handleSort = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setOpenFilter(null);
    setCurrentPage(1);
  };

  const clearSort = () => {
    setSortField("");
    setSortOrder("");
    setOpenFilter(null);
    setCurrentPage(1);
  };

  const parseExperience = (value) => {
    if (value === null || value === undefined) return 0;
    const match = String(value).match(/\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
  };

  const getRateTypeRank = (rateType) => {
    const normalized = String(rateType || "").trim().toUpperCase();
    const orderMap = { KPM: 1, LPM: 2, LPA: 3 };
    return orderMap[normalized] || 999;
  };

  const getSortValue = (candidate, field) => {
    if (field === "years_of_experience_manual") return parseExperience(candidate.years_of_experience_manual);
    if (field === "vendor_company_name") return candidate.vendor_company_name || candidate.vendor_name || "";
    if (field === "client_name") return candidate.client_name || candidate.client || "";
    if (field === "vendor_rate_type") return getRateTypeRank(candidate.vendor_rate_type);
    return candidate[field] || "";
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
      const expValue = parseExperience(candidate.years_of_experience_manual);
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

      if (!sortField || !sortOrder) return 0;

      const aValue = getSortValue(a, sortField);
      const bValue = getSortValue(b, sortField);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      const result = String(aValue).localeCompare(String(bValue), undefined, {
        sensitivity: "base",
        numeric: true,
      });
      return sortOrder === "asc" ? result : -result;
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


  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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

  const handleQuickEdit = (e, cand) => {
    e.stopPropagation();
    setSelectedCand(cand);
    setEditForm({
      main_status: cand.main_status || "SUBMITTED",
      sub_status: cand.sub_status || "NONE",
      remark: cand.remark || "",
    });
    setShowModal(true);
  };

  const handleSoftDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this profile?")) {
      try {
        await apiRequest(`/employee-portal/api/candidates/${id}/soft-delete/`, "DELETE");
        notify("Candidate deleted successfully!");
        fetchCandidates();
      } catch (err) {
        notify("Delete failed", "error");
      }
    }
  };

  const handleUpdateSubmit = async () => {
    try {
      await apiRequest(`/employee-portal/api/candidates/${selectedCand.id}/update/`, "PUT", editForm);
      notify("Status updated successfully!");
      setShowModal(false);
      fetchCandidates();
    } catch (err) {
      notify("Update failed", "error");
    }
  };

  const truncate = (text, limit) => (text?.length > limit ? text.substring(0, limit) + "..." : text);

  const renderFilterHeader = (label, field) => {
    const isActive = sortField === field && sortOrder;
    return (
      <th style={styles.th} ref={openFilter === field ? filterRef : null}>
        <div style={styles.filterHeaderWrap}>
          <button
            type="button"
            style={isActive ? styles.filterHeaderBtnActive : styles.filterHeaderBtn}
            onClick={(e) => {
              e.stopPropagation();
              setOpenFilter(openFilter === field ? null : field);
            }}
          >
            {label}
            
            <Icons.CaretDown />
          </button>
          {openFilter === field && (
            <div style={styles.filterDropdown} onClick={(e) => e.stopPropagation()}>
              <div style={styles.filterDropdownTitle}>Sort {label}</div>
              {SORT_OPTIONS[field].map((option) => (
                <button
                  key={`${field}-${option.order}`}
                  type="button"
                  style={sortField === field && sortOrder === option.order ? styles.filterOptionActive : styles.filterOption}
                  onClick={() => handleSort(field, option.order)}
                >
                  {option.label}
                </button>
              ))}
              {isActive && (
                <button type="button" style={styles.clearFilterOption} onClick={clearSort}>
                  Clear sorting
                </button>
              )}
            </div>
          )}
        </div>
      </th>
    );
  };

  const renderRows = () => {
    let lastDate = "";
    return paginatedCandidates.map((c) => {
      const currentDate = new Date(c.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const dateSeparator =
        currentDate !== lastDate ? (
          <tr key={`d-${c.id}`}>
            <td colSpan="9" style={styles.dateSeparator}>
              {currentDate}
            </td>
          </tr>
        ) : null;
      if (currentDate !== lastDate) lastDate = currentDate;

      const statusStyle = getStatusStyles(c.main_status || "SUBMITTED");

      return (
        <React.Fragment key={c.id}>
          {dateSeparator}
          <tr style={{ ...styles.tableRow, backgroundColor: statusStyle.bg }} onClick={() => navigate(`/employee/candidate/view/${c.id}${window.location.search}`)}>
            <td style={styles.td}>
              <div>
                To: <b>{c.submitted_to_name || ""}</b>
              </div>
              <div>
                By: <b style={{ color: "#27AE60" }}>{c.created_by_name || ""}</b>
              </div>
            </td>
            <td style={styles.td}>
              <div style={{ fontWeight: "700" }}>{c.candidate_name || ""}</div>
              <div style={{ fontSize: "11px", color: "#7F8C8D" }}>{c.candidate_email || ""}</div>
            </td>
            <td style={styles.td}>{truncate(c.technology, 30) || ""}</td>
            <td style={styles.td}>{c.years_of_experience_manual || ""} {c.years_of_experience_manual ? "Yrs" : ""}</td>
            <td style={styles.td}><b>{truncate(c.client_name || c.client, 18) || ""}</b></td>
            <td style={styles.td}><b>{truncate(c.vendor_company_name || c.vendor_name, 15) || ""}</b></td>
            <td style={styles.td}>
              <div>{c.vendor_rate ? `₹${c.vendor_rate}` : ""}</div>
              <small style={{ color: "#94A3B8" }}>{c.vendor_rate_type || ""}</small>
            </td>
            <td style={styles.td}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ ...styles.badge, color: statusStyle.text, fontWeight: "800" }}>{c.main_status || ""}</span>
                {c.remark && <div style={styles.remarkIcon} title={c.remark}><Icons.Remark /></div>}
              </div>
              <small style={{ ...styles.subStatusText, color: statusStyle.text, fontWeight: "700" }}>{c.sub_status || ""}</small>
            </td>
            <td style={styles.td}>
              <div style={styles.actionGroup}>
                <button onClick={(e) => handleQuickEdit(e, c)} style={styles.editBtn} title="Update Status"><Icons.Edit /></button>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/employee/candidate/edit/${c.id}${window.location.search}`); }} style={styles.editBtn} title="Full Edit"><Icons.External /></button>
                <button onClick={(e) => handleSoftDelete(e, c.id)} style={styles.trashBtn} title="Delete"><Icons.Delete /></button>
              </div>
            </td>
          </tr>
        </React.Fragment>
      );
    });
  };

  return (
    <BaseLayout>
      {toast.show && (
        <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60" }}>
          {toast.msg}
        </div>
      )}

      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <button onClick={() => navigate("/employee/")} style={styles.backBtn} title="Back to Dashboard">
            ← Back
          </button>
          <div>
            <h2 style={styles.welcome}>Total Profiles ({totalProfiles})</h2>
            <p style={styles.subText}>Recruitment pipeline overview for team.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <input
            placeholder="Search..."
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
          <button onClick={() => navigate("/employee/candidates/add")} style={styles.actionBtn}>+ Add Candidate</button>
        </div>
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

      <div style={styles.tableWrapper}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.th}>Submitted To/By</th>
                {renderFilterHeader("Candidate", "candidate_name")}
                {renderFilterHeader("Tech", "technology")}
                {renderFilterHeader("Exp", "years_of_experience_manual")}
                {renderFilterHeader("Client", "client_name")}
                {renderFilterHeader("Vendor", "vendor_company_name")}
                {renderFilterHeader("Rate", "vendor_rate_type")}
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={styles.loadingTd}>Loading...</td></tr>
              ) : visibleCandidates.length === 0 ? (
                <tr><td colSpan="9" style={styles.loadingTd}>No profiles found</td></tr>
              ) : (
                renderRows()
              )}
            </tbody>
          </table>
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
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}
        >
          ← Prev
        </button>
        <span style={styles.pageInfo}>{currentPage} / {totalPages}</span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          style={currentPage >= totalPages ? styles.pageBtnDisabled : styles.pageBtn}
        >
          Next →
        </button>
      </div>

      <StatusUpdateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        formData={editForm}
        setFormData={setEditForm}
        onSave={handleUpdateSubmit}
      />
    </BaseLayout>
  );
}

const styles = {
  toast: { position: "fixed", top: "85px", right: "20px", color: "#fff", padding: "12px 25px", borderRadius: "8px", zIndex: 9999, fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" },
  backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px", marginTop: "3px", whiteSpace: "nowrap" },
  welcome: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
  subText: { color: "#7F8C8D", fontSize: "14px", margin: "4px 0 0 0" },
  headerActions: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" },
  searchInput: { padding: "10px 15px", borderRadius: "10px", border: "1px solid #F0F2F4", width: "250px", outline: "none", fontSize: "13px" },
  actionBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
  linkedInFilterToggle: { background: "#fff", color: "#25343F", border: "1px solid #E2E8F0", padding: "10px 16px", borderRadius: "999px", cursor: "pointer", fontSize: "13px", fontWeight: "900", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 3px 10px rgba(15, 23, 42, 0.04)" },
  linkedInFilterToggleActive: { background: "#FFF5EB", border: "1px solid #FFB777", color: "#FF7A1A" },
  filterCountBadge: { background: "#FF9B51", color: "#fff", minWidth: "20px", height: "20px", borderRadius: "999px", fontSize: "11px", fontWeight: "900", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px" },
  filterCaret: { fontSize: "12px", color: "inherit" },
  linkedInFilterPanel: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "18px", marginBottom: "20px", boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)" },
  filterPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "15px", marginBottom: "16px" },
  filterPanelTitle: { margin: 0, color: "#25343F", fontSize: "16px", fontWeight: "900" },
  filterPanelSubText: { margin: "4px 0 0", color: "#64748B", fontSize: "12px", fontWeight: "600" },
  filterPanelClose: { width: "30px", height: "30px", border: "none", borderRadius: "8px", background: "#F1F5F9", color: "#25343F", cursor: "pointer", fontSize: "20px", fontWeight: "900", lineHeight: 1 },
  categoryFilterGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px" },
  categoryFilterGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  categoryFilterLabel: { fontSize: "11px", color: "#64748B", fontWeight: "900", textTransform: "uppercase" },
  categoryFilterInput: { width: "100%", padding: "11px 12px", borderRadius: "10px", border: "1px solid #E2E8F0", outline: "none", fontSize: "13px", color: "#25343F", background: "#fff", boxSizing: "border-box" },
  filterPanelActions: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginTop: "18px", flexWrap: "wrap" },
  clearFiltersBtn: { background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0", padding: "10px 16px", borderRadius: "10px", fontWeight: "900", cursor: "pointer", fontSize: "13px" },
  applyFiltersBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "900", cursor: "pointer", fontSize: "13px", boxShadow: "0 5px 14px rgba(255,155,81,0.25)" },
  tableWrapper: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #F0F2F4" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { background: "#F9FAFB", borderBottom: "2px solid #EDF2F7" },
  th: { padding: "14px 18px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: "800", textTransform: "uppercase", position: "relative" },
  filterHeaderWrap: { position: "relative", display: "inline-flex" },
  filterHeaderBtn: { border: "1px solid transparent", background: "transparent", color: "#94A3B8", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 8px", borderRadius: "8px", whiteSpace: "nowrap" },
  filterHeaderBtnActive: { border: "1px solid #FF9B51", background: "#FFF5EB", color: "#FF9B51", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 8px", borderRadius: "8px", whiteSpace: "nowrap" },
  filterDropdown: { position: "absolute", top: "30px", left: 0, minWidth: "210px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px", boxShadow: "0 14px 30px rgba(15, 23, 42, 0.15)", padding: "8px", zIndex: 50, textTransform: "none" },
  filterDropdownTitle: { color: "#25343F", fontSize: "12px", fontWeight: "900", padding: "8px 10px", borderBottom: "1px solid #F1F5F9", marginBottom: "6px" },
  filterOption: { width: "100%", border: "none", background: "transparent", color: "#334155", padding: "9px 10px", borderRadius: "8px", textAlign: "left", cursor: "pointer", fontSize: "13px", fontWeight: "700" },
  filterOptionActive: { width: "100%", border: "none", background: "#FFF5EB", color: "#FF9B51", padding: "9px 10px", borderRadius: "8px", textAlign: "left", cursor: "pointer", fontSize: "13px", fontWeight: "900" },
  clearFilterOption: { width: "100%", border: "none", background: "#F8FAFC", color: "#64748B", padding: "9px 10px", borderRadius: "8px", textAlign: "left", cursor: "pointer", fontSize: "13px", fontWeight: "800", marginTop: "6px" },
  tableRow: { borderBottom: "1px solid #F1F5F9", transition: "0.2s", cursor: "pointer" },
  td: { padding: "14px 18px", fontSize: "13px", color: "#334155" },
  dateSeparator: { padding: "12px 20px", background: "#f8fafc", color: "#475569", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" },
  badge: { background: "rgba(255, 155, 81, 0.12)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
  subStatusText: { fontSize: "11px", color: "#7f8c8d", display: "block", marginTop: "2px" },
  remarkIcon: { display: "flex", cursor: "help", padding: "4px", borderRadius: "4px", background: "#FFF5EB" },
  editBtn: { border: "none", background: "#F1F5F9", padding: "6px", borderRadius: "6px", cursor: "pointer" },
  actionGroup: { display: "flex", gap: "8px" },
  loadingTd: { textAlign: "center", padding: "40px", fontWeight: "800", color: "#25343F" },
  trashBtn: { border: "none", background: "#FFF5F5", padding: "6px", borderRadius: "6px", cursor: "pointer" },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "18px", marginBottom: "20px", flexWrap: "wrap" },
  pageBtn: { padding: "8px 22px", background: "#25343F", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "800", fontSize: "12px" },
  pageBtnDisabled: { padding: "8px 22px", background: "#E2E8F0", color: "#94A3B8", border: "none", borderRadius: "8px", cursor: "not-allowed", fontWeight: "800", fontSize: "12px" },
  pageInfo: { fontWeight: "900", color: "#25343F", fontSize: "14px" },
  pageSizeControl: { display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1px solid #E2E8F0", padding: "6px 10px", borderRadius: "8px" },
  pageSizeLabel: { fontSize: "12px", color: "#64748B", fontWeight: "800" },
  pageSizeSelect: { border: "none", outline: "none", background: "#F8FAFC", borderRadius: "6px", padding: "6px 8px", fontWeight: "900", color: "#25343F", cursor: "pointer" },
};

export default CandidateList;
