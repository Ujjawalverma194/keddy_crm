import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import { asList } from "../../../utils/apiHelpers";
import BaseLayout from "../../components/SubAdminLayout";
import StatusTimer from "../../../components/StatusTimer";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function MyRequirements() {
  const navigate = useNavigate();
  const query = useQuery();
  const typeParam = query.get("type") || "both";

  const [requirements, setRequirements] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    created_by_me: 0,
    assigned_to_me: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedJd, setSelectedJd] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [employees, setEmployees] = useState([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [empSearch, setEmpSearch] = useState("");
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [actionDropdownOpen, setActionDropdownOpen] = useState(null);

  const toggleActionMenu = (id) => {
    setActionDropdownOpen(actionDropdownOpen === id ? null : id);
  };

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const notify = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const getUserRoleText = (user) =>
    [
      user?.role,
      user?.user_role,
      user?.role_name,
      user?.user_type,
      user?.type,
      user?.designation,
      user?.department,
      user?.Role?.name,
      user?.role_details?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  const isAssignableEmployee = (user) => {
    const roleText = getUserRoleText(user);

    if (roleText.includes("accountant")) return false;

    if (roleText) {
      return (
        roleText.includes("employee") &&
        !roleText.includes("admin") &&
        !roleText.includes("sub admin") &&
        !roleText.includes("sub_admin")
      );
    }

    return true;
  };

  const fetchMyRequirements = async (type, search, status = "") => {
    setLoading(true);
    try {
      let url = `/jd-mapping/company-jds/?type=${type}&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      const response = await apiRequest(url, "GET");
      if (response && response.success) {
        setRequirements(response.results || []);
        setStats(
          response.stats || { total: 0, created_by_me: 0, assigned_to_me: 0 },
        );
      }
    } catch (error) {
      console.error("Error fetching my requirements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMyRequirements(typeParam, searchQuery, statusFilter);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, typeParam, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRequirementId(null);
    setSelectedEmployees([]);
  }, [searchQuery, typeParam, statusFilter, pageSize]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await apiRequest("/sub-admin/api/users/", "GET");
        setEmployees(asList(response).filter(isAssignableEmployee));
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const truncateText = (text, maxLength) => {
    if (!text) return "—";
    return text.length > maxLength
      ? text.substring(0, maxLength).trim() + "..."
      : text;
  };

  const getStatusBadgeStyle = (status) => {
    switch ((status || "").toUpperCase()) {
      case "HOT":
        return styles.hotStatusBadge;
      case "WARM":
        return styles.warmStatusBadge;
      case "COLD":
        return styles.coldStatusBadge;
      default:
        return styles.defaultStatusBadge;
    }
  };

  const getRequirementRowBg = (req) => {
    switch ((req.status || "").toUpperCase()) {
      case "HOT":
        return "#FFF4ED";
      case "WARM":
        return "#FFFBEB";
      case "COLD":
        return "#F8FAFC";
      default:
        return "transparent";
    }
  };

  const handleOpenJdModal = (req) => {
    setCopySuccess(false);
    setSelectedJd({
      title: req?.title || "Requirement",
      desc: req?.jd_description || "No description provided.",
    });
  };

  const handleCopyJd = async () => {
    const jdText = selectedJd?.desc || "";
    if (!jdText) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(jdText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = jdText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1800);
    } catch (error) {
      console.error("Copy JD failed:", error);
      alert("Unable to copy JD. Please try again.");
    }
  };

  const renderAssignedTeam = (assignments, totalCount) => {
    const teamList = Array.isArray(assignments) ? assignments : [];
    const count =
      totalCount !== undefined && totalCount !== null
        ? totalCount
        : teamList.length;

    if (teamList.length === 0 || count === 0) {
      return <div style={styles.unassignedText}>Not Assigned</div>;
    }

    const displayNames = teamList
      .slice(0, 2)
      .map(
        (a) =>
          (
            a.name ||
            `${a.first_name || ""} ${a.last_name || ""}`.trim() ||
            "User"
          ).split(" ")[0],
      )
      .join(", ");
    const remaining = count > 2 ? count - 2 : 0;

    return (
      <div style={styles.assignWrapper}>
        <span style={styles.assignNames}>{displayNames}</span>
        {remaining > 0 && <span style={styles.assignBadge}>+{remaining}</span>}
      </div>
    );
  };

  const getRequirementCreatorText = (req) =>
    [
      req?.created_by_name,
      req?.created_by_role,
      req?.created_by_type,
      req?.created_by_user_role,
      req?.creator_role,
      req?.created_by?.name,
      req?.created_by?.role,
      req?.created_by?.user_role,
      req?.created_by?.user_type,
      req?.created_by_details?.name,
      req?.created_by_details?.role,
      req?.created_by_details?.user_role,
      req?.creator?.name,
      req?.creator?.role,
      req?.user?.role,
      req?.User?.role,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  const isAdminCreatedRequirement = (req) => {
    const creatorText = getRequirementCreatorText(req);
    return (
      creatorText.includes("admin") &&
      !creatorText.includes("sub admin") &&
      !creatorText.includes("sub_admin") &&
      !creatorText.includes("sub-admin")
    );
  };

  const isCreatedByCurrentUserRequirement = (req) =>
    req?.created_by_me === true ||
    req?.is_created_by_me === true ||
    req?.created_by_current_user === true ||
    req?.is_mine === true;
    // eslint-disable-next-line no-unused-vars

    // eslint-disable-next-line no-unused-vars
  const getCreatedByMeDisplayCount = () => {
    const apiCount = Number(stats.created_by_me) || 0;
    const localCreatedCount = requirements.filter(
      (req) =>
        isCreatedByCurrentUserRequirement(req) ||
        isAdminCreatedRequirement(req),
    ).length;

    return Math.max(apiCount, localCreatedCount);
  };

  const handleAssignSubmit = async () => {
    if (!selectedRequirementId) {
      notify("Please select a requirement", "error");
      return;
    }

    if (!selectedEmployees.length) {
      notify("Please select at least one employee", "error");
      return;
    }

    try {
      await apiRequest(
        "/jd-mapping/api/assignments/create/",
        "POST",
        {
          requirement_id: selectedRequirementId,
          assigned_to_ids: selectedEmployees,
        },
        getAuthHeaders(),
      );

      notify("Assigned Successfully!");
      setShowAssignModal(false);
      setSelectedEmployees([]);
      fetchMyRequirements(typeParam, searchQuery, statusFilter);
    } catch (error) {
      console.error("Assignment Failed:", error);
      notify("Assignment Failed", "error");
    }
  };

  const handleUnassign = async (assignmentId) => {
    const confirmed = window.confirm("Are you sure you want to unassign this employee?");
    if (!confirmed) return;

    try {
      await apiRequest(
        `/jd-mapping/api/assignments/${assignmentId}/delete/`,
        "DELETE",
        null,
        getAuthHeaders()
      );
      notify("Unassigned Successfully!");
      fetchMyRequirements(typeParam, searchQuery, statusFilter);
    } catch (error) {
      console.error("Unassign Failed:", error);
      notify("Unassign Failed", "error");
    }
  };
    // eslint-disable-next-line no-unused-vars

    // eslint-disable-next-line no-unused-vars
  const handleDeleteRequirement = async (req) => {
    if (!req?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this requirement?",
    );
    if (!confirmed) return;

    try {
      await apiRequest(
        `/jd-mapping/api/requirements/${req.id}/delete/`,
        "DELETE",
        null,
        getAuthHeaders(),
      );

      notify("Requirement deleted successfully!");
      if (selectedRequirementId === req.id) {
        setSelectedRequirementId(null);
      }
      fetchMyRequirements(typeParam, searchQuery, statusFilter);
    } catch (error) {
      console.error("Requirement delete failed:", error);
      notify("Requirement delete failed", "error");
    }
  };

  const getPageTitle = () => {
    if (typeParam === "today") return "Today's Requirements";
    if (typeParam === "yesterday") return "Yesterday's Requirements";
    return "Total Requirements";
  };
  const visibleRequirements = requirements.filter((req) => {
    if (!statusFilter) return true;
    return String(req.status || "").toUpperCase() === statusFilter;
  });

  const isAllRequirements = typeParam === "all";
  const totalPages = Math.max(
    1,
    Math.ceil(visibleRequirements.length / pageSize),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRequirements = isAllRequirements
    ? visibleRequirements.slice(startIndex, endIndex)
    : visibleRequirements;

  const currentReq = requirements.find(r => r.id === selectedRequirementId);
  const assignedUserIds = currentReq?.assigned_to_details?.map(u => u.id) || [];

  return (
    <BaseLayout>
      {toast.show && (
        <div
          style={{
            ...styles.toast,
            backgroundColor: toast.type === "error" ? "#EF4444" : "#10B981",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={styles.topBar}>
        <div style={styles.leftActions}>
          <button onClick={() => navigate("/sub-admin")} style={styles.backBtn}>
            ← Dashboard
          </button>
          <div style={styles.filterGroup}>
            <button
              onClick={() => navigate("/sub-admin/requirements/my?type=today")}
              style={
                typeParam === "today"
                  ? styles.activeFilterBtn
                  : styles.filterBtn
              }
            >
              Today
            </button>
            <button
              onClick={() =>
                navigate("/sub-admin/requirements/my?type=yesterday")
              }
              style={
                typeParam === "yesterday"
                  ? styles.activeFilterBtn
                  : styles.filterBtn
              }
            >
              Yesterday
            </button>
            <button
              onClick={() => navigate("/sub-admin/requirements/my?type=all")}
              style={
                typeParam === "all" ? styles.activeFilterBtn : styles.filterBtn
              }
            >
              All
            </button>
          </div>
        </div>

        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by ID, Title, Client, Skills..."
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isAllRequirements && (
          <button
            type="button"
            onClick={() => setShowAssignModal(true)}
            style={selectedRequirementId ? styles.addBtn : styles.disabledBtn}
            disabled={!selectedRequirementId}
          >
            Assign Selected
          </button>
        )}

        <button
          onClick={() => navigate("/sub-admin/requirement/create")}
          style={styles.addBtn}
        >
          Create Requirement
        </button>
      </div>
     <div style={styles.filterGroup}>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("");
            fetchMyRequirements(typeParam, searchQuery, "");
          }}
          style={!statusFilter ? styles.activeFilterBtn : styles.filterBtn}
        >
          All Status
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("HOT");
            fetchMyRequirements(typeParam, searchQuery, "HOT");
          }}
          style={
            statusFilter === "HOT"
              ? styles.hotFilterBtnActive
              : styles.filterBtn
          }
        >
          HOT
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("WARM");
            fetchMyRequirements(typeParam, searchQuery, "WARM");
          }}
          style={
            statusFilter === "WARM"
              ? styles.warmFilterBtnActive
              : styles.filterBtn
          }
        >
          WARM
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter("COLD");
            fetchMyRequirements(typeParam, searchQuery, "COLD");
          }}
          style={
            statusFilter === "COLD"
              ? styles.coldFilterBtnActive
              : styles.filterBtn
          }
        >
          COLD
        </button>
      </div>
      {/* <div style={styles.statsContainer}>
                <div style={styles.statCard}>Total: <strong>{stats.total}</strong></div>
                <div style={styles.statCard}>Created By Me: <strong style={{color: '#27AE60'}}>{getCreatedByMeDisplayCount()}</strong></div>
                
            </div> */}

      <div style={styles.section}>
        <h2 style={styles.pageTitle}>
          {getPageTitle()} <span>({stats.total})</span>
        </h2>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                {isAllRequirements && (
                  <th style={{ ...styles.th, width: "40px" }}>Sel</th>
                )}
                <th style={{ ...styles.th, width: "110px" }}>ID & Date</th>
                <th style={{ ...styles.th, width: "180px" }}>Title & Client</th>
                <th style={{ ...styles.th, width: "110px" }}>Exp / Rate</th>
                <th style={{ ...styles.th, width: "90px" }}>Status</th>
                <th style={{ ...styles.th, width: "180px" }}>JD Description</th>
                <th style={{ ...styles.th, width: "90px" }}>Created By</th>
                <th style={{ ...styles.th, width: "120px" }}>Assigned To</th>
                <th style={{ ...styles.th, width: "110px" }}>Stats / Team</th>
                <th
                  style={{ ...styles.th, textAlign: "center", width: "110px" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={isAllRequirements ? 10 : 9}
                    style={styles.loadingTd}
                  >
                    Loading requirements...
                  </td>
                </tr>
              ) : visibleRequirements.length > 0 ? (
                paginatedRequirements.map((req, index) => {
                  const dropdownDynamicStyle = index < 3 ? { top: "100%", bottom: "auto", marginTop: "8px" } : { bottom: "100%", top: "auto", marginBottom: "8px" };
                  return (
                  <tr
                    key={req.id}
                    style={{
                      ...styles.tableRow,
                      background:
                        isAllRequirements && selectedRequirementId === req.id
                          ? "#FFFBEB"
                          : getRequirementRowBg(req),
                    }}
                  >
                    {isAllRequirements && (
                      <td style={styles.td}>
                        <input
                          type="radio"
                          checked={selectedRequirementId === req.id}
                          onChange={() => setSelectedRequirementId(req.id)}
                        />
                      </td>
                    )}
                    <td style={styles.td}>
                      <div style={styles.reqIdBadge}>{req.requirement_id}</div>
                      <div style={styles.dateText}>
                        {new Date(req.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.primaryText} title={req.title}>
                        {truncateText(req.title, 35)}
                      </div>
                      <div
                        style={styles.subText}
                        title={req.client_details?.company_name}
                      >
                        {truncateText(req.client_details?.company_name, 30)}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div
                        style={styles.infoText}
                        title={req.experience_required}
                      >
                        {truncateText(req.experience_required, 15)}
                      </div>
                      <div style={styles.rateText} title={req.rate}>
                        {truncateText(req.rate, 15)}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={getStatusBadgeStyle(req.status)}>
                        {req.status || "—"}
                      </span>
                      <StatusTimer
                        createdAt={req.created_at}
                        status={req.status}
                        manual_status={req.manual_status}
                        manual_status_updated_at={req.manual_status_updated_at}
                      />
                    </td>
                    <td style={styles.td}>
                      <div
                        style={styles.jdTruncate}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenJdModal(req);
                        }}
                      >
                        {req.jd_description || "No description provided."}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{...styles.primaryText, whiteSpace: 'normal', fontSize: '13px', color: '#4B5563'}}>
                        {req.created_by_details?.name || "—"}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {req.assigned_to_details && req.assigned_to_details.length > 0 ? (
                          req.assigned_to_details.map(user => (
                            <span key={user.id} style={{
                              background: '#F3F4F6',
                              color: '#374151',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500',
                              border: '1px solid #E5E7EB'
                            }}>
                              {user.name}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.statLine}>
                        Submissions: <strong>{req.total_submissions}</strong>
                      </div>
                      {renderAssignedTeam(
                        req.assigned_to_details || req.assigned_to,
                        req.assigned_count,
                      )}
                    </td>
                   <td style={styles.actionTd}>
    <div style={styles.actionMenuWrapper}>
        <button
            type="button"
            style={styles.actionDotsBtn}
            onClick={(e) => { e.stopPropagation(); toggleActionMenu(req.id); }}
        >
            ⋮
        </button>

        {actionDropdownOpen === req.id && (
        <div
            className="action-dropdown"
            style={{ ...styles.actionDropdown, ...dropdownDynamicStyle, display: "block" }}
        >
            <button
                style={styles.dropdownItem}
                onClick={() => navigate(`/sub-admin/requirement/view/${req.id}`)}
            >
                👁 View
            </button>

            <button
                style={styles.dropdownItem}
                onClick={() => navigate(`/sub-admin/requirement/edit/${req.id}`)}
            >
                ✏️ Update
            </button>

            <button
                style={styles.deleteDropdownItem}
                onClick={async () => {
                    if (!window.confirm("Are you sure you want to delete this requirement?")) return;

                    try {
                        await apiRequest(
                            `/jd-mapping/api/requirements/${req.id}/delete/`,
                            "DELETE"
                        );

                        notify("Requirement deleted successfully");
                        fetchMyRequirements(typeParam, searchQuery, statusFilter);
                    } catch {
                        notify("Failed to delete requirement", "error");
                    }
                }}
            >
                🗑 Delete
            </button>
        </div>
        )}
    </div>
</td>
                  </tr>
                );
                })
              ) : (
                <tr>
                  <td
                    colSpan={isAllRequirements ? 10 : 9}
                    style={styles.loadingTd}
                  >
                    No requirements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isAllRequirements && !loading && visibleRequirements.length > 0 && (
          <div style={styles.paginationBar}>
            <div style={styles.pageSizeWrap}>
              <span style={styles.paginationText}>Rows per page:</span>
              <select
                style={styles.pageSizeSelect}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.paginationInfo}>
              Showing{" "}
              <strong>{visibleRequirements.length ? startIndex + 1 : 0}</strong>{" "}
              -{" "}
              <strong>{Math.min(endIndex, visibleRequirements.length)}</strong>{" "}
              of <strong>{visibleRequirements.length}</strong> requirements
            </div>

            <div style={styles.paginationControls}>
              <button
                type="button"
                style={
                  safeCurrentPage === 1
                    ? styles.paginationBtnDisabled
                    : styles.paginationBtn
                }
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <span style={styles.pageNumber}>
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                type="button"
                style={
                  safeCurrentPage === totalPages
                    ? styles.paginationBtnDisabled
                    : styles.paginationBtn
                }
                disabled={safeCurrentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showAssignModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Assign Employees</h3>
              <button
                type="button"
                style={styles.closeBtn}
                onClick={() => setShowAssignModal(false)}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalScrollBody}>
              {currentReq?.assigned_to_details?.length > 0 && (
                <div style={{ marginBottom: "15px" }}>
                  <h4 style={{ fontSize: "14px", color: "#374151", marginBottom: "8px", marginTop: 0 }}>Already Assigned Employees</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {currentReq.assigned_to_details.map(user => (
                      <div key={user.assignment_id || user.id} style={{ display: "flex", alignItems: "center", background: "#F3F4F6", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", border: "1px solid #E5E7EB" }}>
                        <span style={{ marginRight: "8px", color: "#374151", fontWeight: "500" }}>{user.name}</span>
                        {user.assignment_id && (
                          <button
                            type="button"
                            onClick={() => handleUnassign(user.assignment_id)}
                            style={{ background: "#EF4444", color: "white", border: "none", borderRadius: "3px", padding: "2px 6px", cursor: "pointer", fontSize: "10px", fontWeight: "bold" }}
                          >
                            Unassign
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <h4 style={{ fontSize: "14px", color: "#374151", marginBottom: "8px", marginTop: "10px" }}>Available Employees</h4>
              <input
                placeholder="Search employee..."
                style={styles.modalSearchInput}
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
              />
              <div style={styles.empList}>
                {employees
                  .filter((emp) => !assignedUserIds.includes(emp.id))
                  .filter((emp) =>
                    `${emp.first_name || ""} ${emp.last_name || ""} ${emp.name || ""}`
                      .toLowerCase()
                      .includes(empSearch.toLowerCase()),
                  )
                  .map((emp) => (
                    <div key={emp.id} style={styles.empItem}>
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() =>
                          setSelectedEmployees((prev) =>
                            prev.includes(emp.id)
                              ? prev.filter((id) => id !== emp.id)
                              : [...prev, emp.id],
                          )
                        }
                      />
                      <span style={{ marginLeft: "10px", fontSize: "13px" }}>
                        {emp.name ||
                          `${emp.first_name || ""} ${emp.last_name || ""}`.trim()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                type="button"
                style={styles.saveBtn}
                onClick={handleAssignSubmit}
              >
                Assign Now
              </button>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedJd && (
        <div style={styles.modalOverlay} onClick={() => setSelectedJd(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{selectedJd.title} - JD</h3>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={copySuccess ? styles.copyBtnSuccess : styles.copyBtn}
                  onClick={handleCopyJd}
                >
                  {copySuccess ? "✓ Copied!" : "Copy JD"}
                </button>
                <button
                  type="button"
                  style={styles.closeBtn}
                  onClick={() => setSelectedJd(null)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={styles.modalBody}>{selectedJd.desc}</div>
          </div>
        </div>
      )}
    </BaseLayout>
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
  },
  addBtn: {
    background: "#FF9B51",
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  disabledBtn: {
    background: "#E2E8F0",
    color: "#94A3B8",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "not-allowed",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    gap: "15px",
    flexWrap: "wrap",
  },
  leftActions: { display: "flex", alignItems: "center", gap: "15px" },
  backBtn: {
    background: "#1e293b",
    color: "white",
    border: "none",
    fontWeight: "600",
    cursor: "pointer",
    padding: "10px",
    borderRadius: "10px",
  },
  filterGroup: {
    display: "flex",
    gap: "10px",
    background: "#F1F5F9",
    padding: "4px",
    borderRadius: "8px",
    marginBottom: "20px",
    width: "300px",
  },
  filterBtn: {
    background: "transparent",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
    transition: "0.2s",
  },
  activeFilterBtn: {
    background: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#1E293B",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    transition: "0.2s",
  },
  hotFilterBtnActive: {
    background: "#FEF2F2",
    color: "#DC2626",
    border: "1px solid #FCA5A5",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
    transition: "0.2s",
  },
  warmFilterBtnActive: {
    background: "#FFFBEB",
    color: "#F59E0B",
    border: "1px solid #FCD34D",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
    transition: "0.2s",
  },
  coldFilterBtnActive: {
    background: "#F1F5F9",
    color: "#64748B",
    border: "1px solid #CBD5E1",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
    transition: "0.2s",
  },
  searchContainer: { flex: "1 1 250px", maxWidth: "400px" },
  searchInput: {
    width: "100%",
    padding: "10px 15px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    outline: "none",
    boxSizing: "border-box",
  },
  statsContainer: {
    display: "flex",
    gap: "15px",
    marginBottom: "25px",
    flexWrap: "wrap",
  },
  statCard: {
    background: "#fff",
    padding: "12px 20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
    fontSize: "14px",
    color: "#475569",
    border: "1px solid #E2E8F0",
  },
  pageTitle: {
    fontSize: "20px",
    color: "#1E293B",
    marginBottom: "15px",
    fontWeight: "800",
  },
  tableWrapper: {
    background: "#fff",
    borderRadius: "12px",
    overflowX: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
    minWidth: "1100px",
  },
  tableHeader: { background: "#F8FAFC", borderBottom: "1px solid #EDF2F7" },
  th: {
    padding: "15px",
    textAlign: "left",
    color: "#64748B",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tableRow: { borderBottom: "1px solid #F1F5F9" },
  td: { padding: "15px", verticalAlign: "middle" },
  reqIdBadge: {
    background: "#EFF6FF",
    color: "#2563EB",
    padding: "4px 8px",
    borderRadius: "5px",
    fontWeight: "700",
    fontSize: "12px",
    display: "inline-block",
    marginBottom: "4px",
  },
  dateText: {
    fontSize: "11px",
    color: "#94A3B8",
    fontWeight: "600",
    paddingLeft: "2px",
  },
  primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
  subText: { fontSize: "12px", color: "#64748B", marginTop: "2px" },
  infoText: { fontSize: "13px", fontWeight: "600" },
  rateText: { fontSize: "12px", color: "#10B981", fontWeight: "700" },
  hotStatusBadge: {
    background: "#FEF2F2",
    color: "#DC2626",
    border: "1px solid #FCA5A5",
    padding: "4px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    display: "inline-block",
  },
  warmStatusBadge: {
    background: "#FFFBEB",
    color: "#F59E0B",
    border: "1px solid #FCD34D",
    padding: "4px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    display: "inline-block",
  },
  coldStatusBadge: {
    background: "#F1F5F9",
    color: "#64748B",
    border: "1px solid #CBD5E1",
    padding: "4px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    display: "inline-block",
  },
  defaultStatusBadge: {
    background: "#F8FAFC",
    color: "#64748B",
    border: "1px solid #E2E8F0",
    padding: "4px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "800",
    display: "inline-block",
  },
  jdTruncate: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.5",
    cursor: "pointer",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    borderBottom: "1px dashed #E2E8F0",
    paddingBottom: "6px",
  },
  statLine: { fontSize: "12px", color: "#334155", marginBottom: "6px" },
  assignWrapper: { display: "flex", alignItems: "center", gap: "5px" },
  assignNames: {
    fontSize: "12px",
    color: "#0F172A",
    background: "#F1F5F9",
    border: "1px solid #E2E8F0",
    padding: "3px 8px",
    borderRadius: "6px",
    fontWeight: "600",
  },
  assignBadge: {
    fontSize: "10px",
    background: "#1E293B",
    color: "#fff",
    padding: "2px 5px",
    borderRadius: "4px",
    fontWeight: "700",
  },
  unassignedText: { fontSize: "11px", color: "#94A3B8", fontStyle: "italic" },
  actionTd: { textAlign: "center" },
  actionGroup: {
    display: "flex",
    gap: "6px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  viewBtn: {
    background: "#F8FAFC",
    color: "#0F172A",
    border: "1px solid #CBD5E1",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
    transition: "0.2s",
  },
  editBtn: {
    background: "#1E293B",
    color: "#fff",
    border: "none",
    padding: "7px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
    transition: "0.2s",
  },
  deleteBtn: {
    background: "#EF4444",
    color: "#fff",
    border: "none",
    padding: "7px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
    transition: "0.2s",
  },
  loadingTd: { textAlign: "center", padding: "40px", color: "#64748B" },
  paginationBar: {
    marginTop: "14px",
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "12px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
  },
  pageSizeWrap: { display: "flex", alignItems: "center", gap: "8px" },
  paginationText: { fontSize: "13px", color: "#475569", fontWeight: "700" },
  pageSizeSelect: {
    padding: "7px 10px",
    borderRadius: "8px",
    border: "1px solid #CBD5E1",
    outline: "none",
    fontSize: "13px",
    fontWeight: "700",
    color: "#1E293B",
    background: "#fff",
    cursor: "pointer",
  },
  paginationInfo: { fontSize: "13px", color: "#475569", fontWeight: "600" },
  paginationControls: { display: "flex", alignItems: "center", gap: "8px" },
  paginationBtn: {
    background: "#1E293B",
    color: "#fff",
    border: "none",
    padding: "7px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "800",
  },
  paginationBtnDisabled: {
    background: "#E2E8F0",
    color: "#94A3B8",
    border: "none",
    padding: "7px 12px",
    borderRadius: "8px",
    cursor: "not-allowed",
    fontSize: "12px",
    fontWeight: "800",
  },
  pageNumber: {
    fontSize: "13px",
    color: "#1E293B",
    fontWeight: "800",
    padding: "0 4px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#fff",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    padding: "15px 20px",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  modalActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  copyBtn: {
    background: "#FF9B51",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 12px rgba(255,155,81,0.25)",
  },
  copyBtnSuccess: {
    background: "#16A34A",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 12px rgba(22,163,74,0.25)",
  },
  modalTitle: {
    margin: 0,
    fontSize: "16px",
    color: "#1E293B",
    fontWeight: "800",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#64748B",
  },
  modalScrollBody: { padding: "20px", overflowY: "auto", flex: 1 },
  modalSearchInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #E2E8F0",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "15px",
  },
  empList: {
    border: "1px solid #F1F5F9",
    borderRadius: "8px",
    padding: "5px",
    maxHeight: "300px",
    overflowY: "auto",
  },
  empItem: {
    display: "flex",
    alignItems: "center",
    padding: "10px",
    borderBottom: "1px solid #F8FAFC",
  },
  modalFooter: {
    padding: "15px 20px",
    borderTop: "1px solid #F1F5F9",
    display: "flex",
    gap: "10px",
  },
  saveBtn: {
    flex: 1,
    background: "#FF9B51",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  cancelBtn: {
    flex: 1,
    background: "#F1F5F9",
    color: "#475569",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  modalBody: {
    padding: "20px",
    overflowY: "auto",
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#334155",
    whiteSpace: "pre-wrap",
    // eslint-disable-next-line no-dupe-keys
  },
    // eslint-disable-next-line no-dupe-keys
  actionTd: {
    textAlign: "center",
  },

  actionMenuWrapper: {
    position: "relative",
    display: "inline-block",
  },

  actionDotsBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "1px solid #CBD5E1",
    background: "#F8FAFC",
    color: "#0F172A",
    cursor: "pointer",
    fontSize: "20px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },

 actionDropdown: {
    display: "none",
    position: "absolute",
    top: "38px",
    right: 0,
    width: "170px",
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    boxShadow: "0 10px 30px rgba(0,0,0,.12)",
    overflow: "hidden",
    zIndex: 9999
},

  dropdownItem: {
    width: "100%",
    padding: "11px 14px",
    border: "none",
    background: "#FFFFFF",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  deleteDropdownItem: {
    width: "100%",
    padding: "11px 14px",
    border: "none",
    background: "#FFFFFF",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "700",
    color: "#DC2626",
    cursor: "pointer",
    borderTop: "1px solid #F1F5F9",
    transition: "all 0.2s ease",
  },
};

export default MyRequirements;
