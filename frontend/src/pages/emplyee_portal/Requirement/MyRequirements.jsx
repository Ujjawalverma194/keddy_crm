import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import BaseLayout from "../../components/emp_base";
import RequirementRowWrapper from "../../../components/RequirementRowWrapper";
import StatusTimer from "../../../components/StatusTimer";
import { getRequirementRowBgByStatus } from "../../../utils/RequirementRowHelper";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const getCurrentUserId = () => {
    try {
        const token = localStorage.getItem("access") || localStorage.getItem("access_token") || localStorage.getItem("token");
        if (!token || !token.includes(".")) return null;
        const payloadPart = token.split(".")[1];
        const normalizedPayload = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
        const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4), "=");
        const payload = JSON.parse(atob(paddedPayload));
        return payload.user_id || payload.userId || payload.id || payload.pk || null;
    } catch (error) {
        return null;
    }
};


function MyRequirements() {
    const navigate = useNavigate();
    const query = useQuery();
    const typeParam = query.get("type") || "both";

    const [requirements, setRequirements] = useState([]);
    const [teamPeriodRequirements, setTeamPeriodRequirements] = useState([]);
    const [stats, setStats] = useState({ total: 0, created_by_me: 0, assigned_to_me: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(query.get("search") || "");
    const [selectedJd, setSelectedJd] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [requirementSubmissionCounts, setRequirementSubmissionCounts] = useState({});
    const [submissionCountsLoading, setSubmissionCountsLoading] = useState(false);

    const [actionDropdownOpenMy, setActionDropdownOpenMy] = useState(null);
    const [actionDropdownOpenAvailable, setActionDropdownOpenAvailable] = useState(null);

    const [availableRequirements, setAvailableRequirements] = useState([]);
    const [availableStats, setAvailableStats] = useState({ total_available: 0, hot_count: 0, warm_count: 0, cold_count: 0 });
    const [loadingAvailable, setLoadingAvailable] = useState(true);
    const [searchQueryAvailable, setSearchQueryAvailable] = useState("");
    // eslint-disable-next-line no-unused-vars
    const [statusFilter, setStatusFilter] = useState("");
    // eslint-disable-next-line no-unused-vars
    const [statusFilterAvailable, setStatusFilterAvailable] = useState("");
    const [currentPage, setCurrentPage] = useState(Number(query.get("page")) || 1);
    const [itemsPerPage, setItemsPerPage] = useState(Number(query.get("page_size")) || 10);
    const [availableCurrentPage, setAvailableCurrentPage] = useState(1);
    const [availableItemsPerPage, setAvailableItemsPerPage] = useState(10);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });
    const allRequirementFilterRef = useRef(null);

    const getInitialAllRequirementFilters = () => ({
        title: query.get("title") || "",
        client: query.get("client") || "",
        status: "",
        experience: query.get("experience") || "",
        skills: query.get("skills") || "",
        job_description: query.get("job_description") || "",
        rate: query.get("rate") || "",
        budget: query.get("budget") || "",
    });

    const [allRequirementFilters, setAllRequirementFilters] = useState(() => getInitialAllRequirementFilters());
    const [draftAllRequirementFilters, setDraftAllRequirementFilters] = useState(() => getInitialAllRequirementFilters());
    const [showAllRequirementFilterPanel, setShowAllRequirementFilterPanel] = useState(false);

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const fetchMyRequirements = async (type, search, status) => {
        setLoading(true);
        try {
            const requestType = type === "all" ? "all" : type;
            const requestStatus = requestType === "all" ? "" : status;
            let url = `/jd-mapping/my-jds/?type=${encodeURIComponent(requestType)}&search=${encodeURIComponent(search || "")}`;
            if (requestStatus) url += `&status=${encodeURIComponent(requestStatus)}`;
            const response = await apiRequest(url, "GET");
            if (response && response.success) {
                const requirementResults = response.results || [];
                setRequirements(requirementResults);
                fetchRequirementSubmissionCounts(requirementResults);
                setStats(response.stats || { total: 0, created_by_me: 0, assigned_to_me: 0 });

                if (requestType === "today" || requestType === "yesterday") {
                    let teamUrl = `/jd-mapping/api/requirements/list/?type=${encodeURIComponent(requestType)}&page=1&page_size=100&search=${encodeURIComponent(search || "")}`;
                    if (requestStatus) teamUrl += `&status=${encodeURIComponent(requestStatus)}`;
                    const teamResponse = await apiRequest(teamUrl, "GET");
                    const teamResults = Array.isArray(teamResponse) ? teamResponse : (teamResponse?.results || []);
                    setTeamPeriodRequirements(teamResults);
                    fetchRequirementSubmissionCounts(teamResults);
                } else {
                    setTeamPeriodRequirements([]);
                }
            }
        } catch (error) {
            console.error("Error fetching my requirements:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableRequirements = async (search, status) => {
        setLoadingAvailable(true);
        try {
            const isAllRequirementsFilter = typeParam === "all";
            const requestStatus = isAllRequirementsFilter ? "" : status;
            let url = `/jd-mapping/api/requirements/list/?type=${encodeURIComponent(typeParam || "all")}&page=1&page_size=100&search=${encodeURIComponent(search || "")}`;
            if (requestStatus) url += `&status=${encodeURIComponent(requestStatus)}`;
            const response = await apiRequest(url, "GET");
            if (response && (response.success || Array.isArray(response.results) || Array.isArray(response))) {
                const availableRequirementResults = Array.isArray(response) ? response : (response.results || []);
                setAvailableRequirements(availableRequirementResults);
                fetchRequirementSubmissionCounts(availableRequirementResults);
                const hotCount = availableRequirementResults.filter((req) => String(req.status || "").toUpperCase() === "HOT").length;
                const warmCount = availableRequirementResults.filter((req) => String(req.status || "").toUpperCase() === "WARM").length;
                const coldCount = availableRequirementResults.filter((req) => String(req.status || "").toUpperCase() === "COLD").length;
                setAvailableStats({
                    total_available: response?.pagination?.total_items || response?.count || availableRequirementResults.length,
                    hot_count: hotCount,
                    warm_count: warmCount,
                    cold_count: coldCount,
                });
            }
        } catch (error) {
            console.error("Error fetching available requirements:", error);
        } finally {
            setLoadingAvailable(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchMyRequirements(typeParam, searchQuery, typeParam === "all" ? "" : statusFilter);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, typeParam, statusFilter]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setAvailableCurrentPage(1);
            fetchAvailableRequirements(searchQueryAvailable, typeParam === "all" ? "" : statusFilterAvailable);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQueryAvailable, statusFilterAvailable, typeParam]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, typeParam, statusFilter, itemsPerPage]);

    useEffect(() => {
        setAvailableCurrentPage(1);
    }, [searchQueryAvailable, statusFilterAvailable, availableItemsPerPage, typeParam]);

    useEffect(() => {
        if (typeParam !== "all") return;

        const params = new URLSearchParams();
        params.set("type", "all");
        if (searchQuery) params.set("search", searchQuery);
        if (currentPage && currentPage !== 1) params.set("page", String(currentPage));
        if (itemsPerPage && itemsPerPage !== 10) params.set("page_size", String(itemsPerPage));

        Object.entries(allRequirementFilters).forEach(([key, value]) => {
            if (String(value || "").trim()) {
                params.set(key, String(value).trim());
            }
        });

        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }, [typeParam, searchQuery, currentPage, itemsPerPage, allRequirementFilters]);

    useEffect(() => {
        if (typeParam !== "all") return;
        setCurrentPage(1);
    }, [allRequirementFilters, typeParam]);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (allRequirementFilterRef.current && !allRequirementFilterRef.current.contains(e.target)) {
                setShowAllRequirementFilterPanel(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const pageSizeOptions = [10, 20, 30, 40, 50, 75, 100];

    const getPaginatedData = (data, page, pageSize) => {
        const safeData = Array.isArray(data) ? data : [];
        const startIndex = (page - 1) * pageSize;
        return safeData.slice(startIndex, startIndex + pageSize);
    };

    const renderPagination = ({ totalItems, currentPageValue, pageSizeValue, onPageChange, onPageSizeChange }) => {
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSizeValue));
        const start = totalItems === 0 ? 0 : ((currentPageValue - 1) * pageSizeValue) + 1;
        const end = Math.min(currentPageValue * pageSizeValue, totalItems);

        return (
            <div style={styles.paginationBar}>
                <div style={styles.paginationInfo}>Showing <strong>{start}</strong> - <strong>{end}</strong> of <strong>{totalItems}</strong></div>
                <div style={styles.paginationActions}>
                    <label style={styles.pageSizeLabel}>Rows per page</label>
                    <select
                        style={styles.pageSizeSelect}
                        value={pageSizeValue}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        style={currentPageValue <= 1 ? styles.paginationBtnDisabled : styles.paginationBtn}
                        disabled={currentPageValue <= 1}
                        onClick={() => onPageChange(currentPageValue - 1)}
                    >
                        Previous
                    </button>
                    <span style={styles.pageCount}>Page {currentPageValue} of {totalPages}</span>
                    <button
                        type="button"
                        style={currentPageValue >= totalPages ? styles.paginationBtnDisabled : styles.paginationBtn}
                        disabled={currentPageValue >= totalPages}
                        onClick={() => onPageChange(currentPageValue + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    const parseRequirementNumber = (value) => {
        if (value === null || value === undefined) return 0;
        const match = String(value).match(/\d+(\.\d+)?/);
        return match ? Number(match[0]) : 0;
    };

    const matchesRequirementTextFilter = (source, filterValue) => {
        if (!filterValue) return true;
        return String(source || "").toLowerCase().includes(String(filterValue).toLowerCase().trim());
    };

    const getRequirementClientName = (req) =>
        req?.client_details?.company_name ||
        req?.client_details?.client_name ||
        req?.client_name ||
        req?.client ||
        "";

    const getRequirementSkillsText = (req) =>
        [
            req?.skills,
            req?.primary_skills,
            req?.secondary_skills,
            req?.technology,
            req?.technologies,
            req?.title,
        ].filter(Boolean).join(" ");

    const getRequirementJdText = (req) =>
        [
            req?.jd_description,
            req?.job_description,
            req?.description,
            req?.responsibilities,
            req?.requirements,
        ].filter(Boolean).join(" ");

    const normalizeRequirementMatchText = (value) =>
        String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9+#.\s]/gi, " ")
            .replace(/\s+/g, " ")
            .trim();

    const getRequirementJdSearchTerms = (jdText) => {
        const normalized = normalizeRequirementMatchText(jdText);
        if (!normalized) return [];

        const stopWords = new Set([
            "the", "and", "or", "for", "with", "from", "this", "that", "have", "has",
            "are", "was", "were", "will", "shall", "you", "your", "our", "their",
            "candidate", "profile", "job", "description", "role", "responsibility",
            "responsibilities", "required", "requirement", "requirements", "experience",
            "years", "year", "month", "months", "work", "working", "good", "must",
            "should", "can", "able", "etc", "to", "in", "on", "of", "a", "an", "is",
            "as", "be", "by", "at", "it", "we", "they", "he", "she", "his", "her"
        ]);

        return Array.from(
            new Set(
                normalized
                    .split(" ")
                    .map((word) => word.trim())
                    .filter((word) => word.length >= 2 && !stopWords.has(word))
            )
        );
    };

    const getRequirementWordSetFromText = (text) =>
        new Set(
            normalizeRequirementMatchText(text)
                .split(" ")
                .map((word) => word.trim())
                .filter(Boolean)
        );

    const getRequirementExactWordRatio = (jdTerms, fieldText) => {
        if (!jdTerms.length) return 0;

        const fieldWords = getRequirementWordSetFromText(fieldText);
        if (!fieldWords.size) return 0;

        const matchedCount = jdTerms.filter((term) => fieldWords.has(term)).length;
        return matchedCount / jdTerms.length;
    };

    const getRequirementMatchBreakdown = (req, jdText) => {
        const terms = getRequirementJdSearchTerms(jdText);
        if (!terms.length) {
            return { percent: 0, title: 0, skills: 0, experience: 0, clientBudget: 0, jd: 0 };
        }

        const weights = { title: 20, skills: 25, experience: 10, clientBudget: 15, jd: 30 };
        const breakdown = {
            title: Math.round(getRequirementExactWordRatio(terms, req?.title) * weights.title),
            skills: Math.round(getRequirementExactWordRatio(terms, getRequirementSkillsText(req)) * weights.skills),
            experience: Math.round(getRequirementExactWordRatio(terms, req?.experience_required) * weights.experience),
            clientBudget: Math.round(
                getRequirementExactWordRatio(
                    terms,
                    [getRequirementClientName(req), req?.rate, req?.vendor_budget_range].filter(Boolean).join(" ")
                ) * weights.clientBudget
            ),
            jd: Math.round(getRequirementExactWordRatio(terms, getRequirementJdText(req)) * weights.jd),
        };

        const percent = Math.min(100, breakdown.title + breakdown.skills + breakdown.experience + breakdown.clientBudget + breakdown.jd);
        return { percent, ...breakdown };
    };

    const getVisibleAllRequirements = () => {
        const jdSearchText = String(allRequirementFilters.job_description || "").trim();
        return requirements
            .map((req) => {
                const matchBreakdown = jdSearchText ? getRequirementMatchBreakdown(req, jdSearchText) : null;
                return {
                    ...req,
                    jd_match_percent: matchBreakdown ? matchBreakdown.percent : null,
                    jd_match_breakdown: matchBreakdown,
                };
            })
            .filter((req) => {
                const minExperience = allRequirementFilters.experience !== ""
                    ? parseFloat(allRequirementFilters.experience)
                    : null;

                return (
                    matchesRequirementTextFilter(req?.title, allRequirementFilters.title) &&
                    matchesRequirementTextFilter(getRequirementClientName(req), allRequirementFilters.client) &&
                    matchesRequirementTextFilter(getRequirementSkillsText(req), allRequirementFilters.skills) &&
                    matchesRequirementTextFilter(req?.rate, allRequirementFilters.rate) &&
                    matchesRequirementTextFilter(req?.vendor_budget_range, allRequirementFilters.budget) &&
                    (!jdSearchText || req.jd_match_percent > 0) &&
                    (minExperience === null || parseRequirementNumber(req?.experience_required) >= minExperience)
                );
            })
            .sort((a, b) => {
                if (!jdSearchText) return 0;
                return (b.jd_match_percent || 0) - (a.jd_match_percent || 0);
            });
    };

    const updateDraftAllRequirementFilter = (key, value) => {
        setDraftAllRequirementFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const applyAllRequirementFilters = () => {
        setAllRequirementFilters({ ...draftAllRequirementFilters });
        setCurrentPage(1);
        setShowAllRequirementFilterPanel(false);
    };

    const clearAllRequirementFilters = () => {
        const emptyFilters = {
            title: "",
            client: "",
            status: "",
            experience: "",
            skills: "",
            job_description: "",
            rate: "",
            budget: "",
        };

        setDraftAllRequirementFilters(emptyFilters);
        setAllRequirementFilters(emptyFilters);
        setCurrentPage(1);
        setShowAllRequirementFilterPanel(false);
    };

    const getAllRequirementActiveFilterCount = () =>
        Object.values(allRequirementFilters).filter((value) => String(value || "").trim()).length;

    const currentUserId = getCurrentUserId();

    const isRequirementCreatedByCurrentUser = (req) => {
        const createdById = req?.created_by_details?.id ?? req?.created_by ?? req?.createdById;
        return currentUserId && createdById !== null && createdById !== undefined && String(createdById) === String(currentUserId);
    };

    const getAssignedUserId = (assignment) => (
        assignment?.id ??
        assignment?.user_id ??
        assignment?.employee_id ??
        assignment?.assigned_to ??
        assignment?.user?.id ??
        assignment?.employee?.id ??
        assignment
    );

    const isRequirementAssignedToCurrentUser = (req) => {
        if (!currentUserId) return false;

        const assignmentCollections = [
            req?.assigned_to_details,
            req?.assigned_users,
            req?.assignees,
            req?.assigned_to,
        ];

        const hasAssignedCollectionMatch = assignmentCollections.some((collection) => {
            if (!collection) return false;
            const items = Array.isArray(collection) ? collection : [collection];
            return items.some((item) => {
                const assignedUserId = getAssignedUserId(item);
                return assignedUserId !== null && assignedUserId !== undefined && String(assignedUserId) === String(currentUserId);
            });
        });

        if (hasAssignedCollectionMatch) return true;

        const directAssignedId = req?.assigned_to_id ?? req?.assignedToId ?? req?.assigned_user_id ?? req?.employee_id;
        return directAssignedId !== null && directAssignedId !== undefined && String(directAssignedId) === String(currentUserId);
    };

    const myCreatedRequirements = requirements.filter(isRequirementCreatedByCurrentUser);
    const teamRequirements = (typeParam === "today" || typeParam === "yesterday")
        ? teamPeriodRequirements.filter((req) => !isRequirementCreatedByCurrentUser(req))
        : requirements.filter((req) => !isRequirementCreatedByCurrentUser(req));
    const shouldSplitMyRequirements = typeParam === "today" || typeParam === "yesterday";


    const getRequirementRowStyle = (req, ownershipMeta) => ({
        borderBottom: "1px solid #E2E8F0",
        cursor: "pointer",
        backgroundColor: getRequirementRowBgByStatus(String(req?.status || "").toUpperCase()),
        ...ownershipMeta.rowStyle,
    });

    const getRequirementOwnershipMeta = (req) => {
        if (isRequirementCreatedByCurrentUser(req)) {
            return {
                
            };
        }

        if (isRequirementAssignedToCurrentUser(req)) {
            return {
                label: "Assigned to me",
                chipStyle: styles.ownerChipAssigned,
                rowStyle: styles.assignedRequirementRow,
                firstCellStyle: styles.assignedFirstCell,
            };
        }

        return {
          
        };
    };

    const visibleAllRequirements = typeParam === "all" ? getVisibleAllRequirements() : requirements;
    const paginatedRequirements = getPaginatedData(visibleAllRequirements, currentPage, itemsPerPage);
    const paginatedMyCreatedRequirements = getPaginatedData(myCreatedRequirements, currentPage, itemsPerPage);
    const paginatedTeamRequirements = getPaginatedData(teamRequirements, currentPage, itemsPerPage);
    const paginatedAvailableRequirements = getPaginatedData(availableRequirements, availableCurrentPage, availableItemsPerPage);

    const truncateText = (text, maxLength) => {
        if (!text) return "—";
        return text.length > maxLength ? text.substring(0, maxLength).trim() + "..." : text;
    };

    const toSafeNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const normalizeText = (value) =>
        String(value || "").trim().toLowerCase();

    const normalizePaginatedResults = (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.results)) return response.results;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.profiles)) return response.profiles;
        if (Array.isArray(response?.submissions)) return response.submissions;
        if (Array.isArray(response?.candidates)) return response.candidates;
        return [];
    };

    const fetchAllProfilesFromEndpoint = async (baseUrl) => {
        const fetchPageSize = 100;
        const separator = baseUrl.includes("?") ? "&" : "?";
        const firstRes = await apiRequest(`${baseUrl}${separator}page=1&page_size=${fetchPageSize}`, "GET");

        const totalRecords = firstRes?.count || normalizePaginatedResults(firstRes).length || 0;
        const totalPages = Math.ceil(totalRecords / fetchPageSize) || 1;
        let allProfiles = normalizePaginatedResults(firstRes);

        for (let page = 2; page <= totalPages; page += 1) {
            const pageRes = await apiRequest(`${baseUrl}${separator}page=${page}&page_size=${fetchPageSize}`, "GET");
            allProfiles = [...allProfiles, ...normalizePaginatedResults(pageRes)];
        }

        return allProfiles;
    };

    const getRequirementApiSubmissionCount = (req) =>
        toSafeNumber(
            req?.total_submissions ??
            req?.submission_count ??
            req?.submissions_count ??
            req?.client_submissions_count ??
            req?.submitted_profiles_count ??
            req?.profile_count ??
            0
        );

    const getSubmissionRequirementId = (submission) =>
        submission?.requirement_id ??
        submission?.jd_id ??
        submission?.job_id ??
        submission?.jd_mapping_id ??
        submission?.requirement?.id ??
        submission?.Requirement?.id ??
        submission?.jd?.id ??
        submission?.JD?.id ??
        submission?.job_description_id ??
        submission?.client_submission?.requirement_id ??
        submission?.ClientSubmission?.requirement_id;

    const getSubmissionRequirementCodeOrTitle = (submission) => [
        submission?.requirement_code,
        submission?.requirement_id_code,
        submission?.requirement_number,
        submission?.jd_code,
        submission?.jd_title,
        submission?.requirement_title,
        submission?.title,
        submission?.job_title,
        submission?.requirement?.requirement_id,
        submission?.requirement?.title,
        submission?.Requirement?.requirement_id,
        submission?.Requirement?.title,
        submission?.jd?.requirement_id,
        submission?.jd?.title,
    ].filter(Boolean).map(normalizeText);

    const doesSubmissionBelongToRequirement = (submission, req) => {
        const submissionRequirementId = getSubmissionRequirementId(submission);

        if (
            submissionRequirementId !== null &&
            submissionRequirementId !== undefined &&
            String(submissionRequirementId) === String(req.id)
        ) {
            return true;
        }

        const submissionRequirementValues = getSubmissionRequirementCodeOrTitle(submission);
        const requirementValues = [
            req?.requirement_id,
            req?.title,
        ].filter(Boolean).map(normalizeText);

        return requirementValues.some((value) => value && submissionRequirementValues.includes(value));
    };

    const fetchRequirementSubmissionCounts = async (requirementList = []) => {
        if (!Array.isArray(requirementList) || requirementList.length === 0) {
            return;
        }

        setSubmissionCountsLoading(true);

        try {
            const endpoints = [
                "/employee-portal/api/submitted-profiles/",
                "/employee-portal/api/user/submitted-profiles/",
                "/employee-portal/api/user/candidates/list/",
                "/sub-admin/api/admin-candidates/",
            ];

            let allSubmissions = [];

            for (const endpoint of endpoints) {
                try {
                    const endpointRows = await fetchAllProfilesFromEndpoint(endpoint);
                    if (endpointRows.length > 0) {
                        allSubmissions = endpointRows;
                        break;
                    }
                } catch (error) {
                    console.warn("Requirement submission count endpoint failed:", endpoint, error);
                }
            }

            const counts = {};
            requirementList.forEach((req) => {
                const calculatedCount = allSubmissions.filter((submission) =>
                    doesSubmissionBelongToRequirement(submission, req)
                ).length;

                counts[req.id] = calculatedCount || getRequirementApiSubmissionCount(req);
            });

            setRequirementSubmissionCounts((prev) => ({ ...prev, ...counts }));
        } catch (error) {
            console.error("Requirement submission count fetch error:", error);

            const fallbackCounts = {};
            requirementList.forEach((req) => {
                fallbackCounts[req.id] = getRequirementApiSubmissionCount(req);
            });

            setRequirementSubmissionCounts((prev) => ({ ...prev, ...fallbackCounts }));
        } finally {
            setSubmissionCountsLoading(false);
        }
    };

    const getRequirementSubmissionCount = (req) => {
        const calculatedCount = requirementSubmissionCounts?.[req.id];

        if (calculatedCount !== null && calculatedCount !== undefined && calculatedCount !== "") {
            return toSafeNumber(calculatedCount);
        }

        return getRequirementApiSubmissionCount(req);
    };

    const renderSubmissionCount = (req) => {
        if (submissionCountsLoading && requirementSubmissionCounts?.[req.id] === undefined) {
            return "Loading...";
        }

        return getRequirementSubmissionCount(req);
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
        } catch (err) {
            console.error("JD copy failed:", err);
            alert("Unable to copy JD. Please try again.");
        }
    };

    const handleDeleteRequirement = async (e, req) => {
        e.stopPropagation();

        if (!window.confirm("Are you sure you want to delete this requirement?")) {
            return;
        }

        try {
            await apiRequest(`/jd-mapping/api/requirements/${req.id}/delete/`, "DELETE");
            notify("Requirement deleted successfully!");
            setActionDropdownOpenMy(null);
            fetchMyRequirements(typeParam, searchQuery, typeParam === "all" ? "" : statusFilter);
        } catch (error) {
            console.error("Requirement delete failed:", error);
            notify("Delete failed", "error");
        }
    };

    const toggleActionMenuMy = (id) => {
        setActionDropdownOpenMy((prev) => (prev === id ? null : id));
        setActionDropdownOpenAvailable(null);
    };

    const toggleActionMenuAvailable = (id) => {
        setActionDropdownOpenAvailable((prev) => (prev === id ? null : id));
        setActionDropdownOpenMy(null);
    };

    const getStatusBadgeStyle = (status) => {
        switch(status) {
            case 'HOT': return { background: '#FEF2F2', color: '#DC2626', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block' };
            case 'WARM': return { background: '#FFFBEB', color: '#F59E0B', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block' };
            case 'COLD': return { background: '#F1F5F9', color: '#64748B', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block' };
            default: return { background: '#F1F5F9', color: '#64748B', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block' };
        }
    };

    const renderAssignedTeam = (assignments) => {
        if (!assignments || assignments.length === 0) {
            return <div style={styles.unassignedText}>Not Assigned</div>;
        }
        const displayNames = assignments.slice(0, 2).map(a => a.name?.split(' ')[0] || 'User').join(', ');
        const remaining = assignments.length > 2 ? assignments.length - 2 : 0;
        return (
            <div style={styles.assignWrapper}>
                <span style={styles.assignNames}>{displayNames}</span>
                {remaining > 0 && <span style={styles.assignBadge}>+{remaining}</span>}
            </div>
        );
    };

    const getPageTitle = () => {
        if (typeParam === 'today') return "Today's Requirements";
        if (typeParam === 'yesterday') return "Yesterday's Requirements";
        return "All Requirements";
    };

    const getCreatorName = (req) => {
        const creator = req?.created_by_details;
        return creator?.name || creator?.email || req?.created_by_name || "—";
    };

    const renderRequirementRows = (rows, emptyText) => (
        <tbody>
            {loading ? (
                <tr><td colSpan="9" style={styles.loadingTd}>Loading requirements...</td></tr>
            ) : rows.length > 0 ? (
                rows.map((req, index) => {
                    const ownershipMeta = getRequirementOwnershipMeta(req);
                    const canDeleteRequirement = true; // Let backend handle authorization
                    const dropdownDynamicStyle = index < 3 ? { top: "100%", bottom: "auto", marginTop: "8px" } : { bottom: "100%", top: "auto", marginBottom: "8px" };

                    return (
                    <RequirementRowWrapper
                        key={req.id}
                        status={req.status}
                        style={getRequirementRowStyle(req, ownershipMeta)}
                        onClick={() => navigate(`/employee/requirement/view/${req.id}`)}
                    >
                        <td style={{ ...styles.tdCompact, ...ownershipMeta.firstCellStyle }}>
                            <div style={styles.reqIdBadge}>{req.requirement_id}</div>
                            <div style={styles.dateText}>{new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </td>
                        <td style={styles.tdCompact}>
                            <div style={styles.primaryText} title={req.title}>{truncateText(req.title, 30)}</div>
                            <div style={styles.subText} title={req.client_details?.company_name}>{truncateText(req.client_details?.company_name, 24)}</div>
                            {req.jd_match_percent !== null && req.jd_match_percent !== undefined && (
                                <span style={req.jd_match_percent >= 50 ? styles.matchBadgeMedium : styles.matchBadgeLow}>{req.jd_match_percent}% JD Match</span>
                            )}
                        </td>
                        <td style={styles.tdCompact}>
                            <div style={styles.infoText} title={req.experience_required}>{truncateText(req.experience_required, 12)}</div>
                            <div style={styles.rateText} title={req.rate}>{truncateText(req.rate, 12)}</div>
                        </td>
                        <td style={styles.tdCompact}>
                            <span style={getStatusBadgeStyle(req.status)}>{req.status || "—"}</span>
                            <StatusTimer createdAt={req.created_at} status={req.status} manual_status={req.manual_status} manual_status_updated_at={req.manual_status_updated_at} />
                        </td>
                        <td style={styles.tdCompact}><div style={styles.infoText} title={req.vendor_budget_range}>{truncateText(req.vendor_budget_range, 16) || "—"}</div></td>
                        <td style={styles.tdCompact}>
                            <div style={styles.creatorText} title={getCreatorName(req)}>{truncateText(getCreatorName(req), 20)}</div>
                            <div style={ownershipMeta.chipStyle}>{ownershipMeta.label}</div>
                        </td>
                        <td style={styles.tdCompact}>
                            <div style={styles.jdTruncate} onClick={(e) => { e.stopPropagation(); setCopySuccess(false); setSelectedJd({ title: req.title, desc: req.jd_description }); }}>
                                {req.jd_description || "No description provided."}
                            </div>
                        </td>
                        <td style={styles.tdCompact}>
                            <div style={styles.statLine}>Submissions: <strong>{renderSubmissionCount(req)}</strong></div>
                            {renderAssignedTeam(req.assigned_to_details)}
                        </td>
                        <td style={styles.actionTdCompact}>
                            <div style={styles.actionMenuWrapper}>
                                <button type="button" style={styles.actionDotsBtn} onClick={(e) => { e.stopPropagation(); toggleActionMenuMy(req.id); }} title="Actions">⋯</button>
                                {actionDropdownOpenMy === req.id && (
                                    <div style={{ ...styles.actionDropdown, ...dropdownDynamicStyle }}>
                                        <button type="button" style={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); navigate(`/employee/requirement/view/${req.id}`); setActionDropdownOpenMy(null); }}>View</button>
                                        <button type="button" style={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); navigate(`/employee/requirement/edit/${req.id}`); setActionDropdownOpenMy(null); }}>Update</button>
                                        {canDeleteRequirement && (
                                            <button type="button" style={styles.dropdownDeleteItem} onClick={(e) => handleDeleteRequirement(e, req)}>Delete</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </td>
                    </RequirementRowWrapper>
                    );
                })
            ) : (
                <tr><td colSpan="9" style={styles.loadingTd}>{emptyText}</td></tr>
            )}
        </tbody>
    );

    const renderMyRequirementsTable = (rows, emptyText) => (
        <div style={styles.tableWrapper}>
            <table style={styles.table}>
                <thead>
                    <tr style={styles.tableHeader}>
                        <th style={{ ...styles.thCompact, width: "115px" }}>ID & Date</th>
                        <th style={{ ...styles.thCompact, width: "170px" }}>Title & Client</th>
                        <th style={{ ...styles.thCompact, width: "80px" }}>Exp / Rate</th>
                        <th style={{ ...styles.thCompact, width: "80px" }}>Status</th>
                        <th style={{ ...styles.thCompact, width: "100px" }}>Budget</th>
                        <th style={{ ...styles.thCompact, width: "120px" }}>Created By</th>
                        <th style={{ ...styles.thCompact, width: "180px" }}>JD Description</th>
                        <th style={{ ...styles.thCompact, width: "120px" }}>Stats / Team</th>
                        <th style={{ ...styles.thCompact, textAlign: "center", width: "90px" }}>Actions</th>
                    </tr>
                </thead>
                {renderRequirementRows(rows, emptyText)}
            </table>
        </div>
    );

    const displayedTotalCount = stats.total || (Array.isArray(requirements) ? requirements.length : 0);

    return (
        <BaseLayout>
            {toast.show && (
                <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60" }}>
                    {toast.msg}
                </div>
            )}

            {/* Section 1: My Requirements Table */}
            <div style={styles.topBar}>
                <div style={styles.leftActions}>
                     <button onClick={() => navigate('/employee')} style={styles.backBtn}>← Back </button>
                     <div style={styles.filterGroup}>
                         <button onClick={() => navigate("/employee/requirements/my?type=today")} style={typeParam === 'today' ? styles.activeFilterBtn : styles.filterBtn}>Today</button>
                         <button onClick={() => navigate("/employee/requirements/my?type=yesterday")} style={typeParam === 'yesterday' ? styles.activeFilterBtn : styles.filterBtn}>Yesterday</button>
                         <button onClick={() => navigate("/employee/requirements/my?type=all")} style={typeParam === 'all' ? styles.activeFilterBtn : styles.filterBtn}>All</button>
                     </div>
                </div>
                <div style={styles.searchContainer}>
                    <input type="text" placeholder="Search by ID, Title, Client, Skills..." style={styles.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                {typeParam === "all" && (
                    <div style={styles.filterButtonWrap} ref={allRequirementFilterRef}>
                        <button
                            type="button"
                            style={{
                                ...styles.linkedInFilterToggle,
                                ...(getAllRequirementActiveFilterCount() ? styles.linkedInFilterToggleActive : {}),
                            }}
                            onClick={() => setShowAllRequirementFilterPanel((prev) => !prev)}
                        >
                            Filters
                            {getAllRequirementActiveFilterCount() ? (
                                <span style={styles.filterCountBadge}>{getAllRequirementActiveFilterCount()}</span>
                            ) : null}
                            <span style={styles.filterCaret}>▾</span>
                        </button>

                        {showAllRequirementFilterPanel && (
                            <div style={styles.filterDropdownPanel}>
                                <form
                                    style={styles.filterDropdownForm}
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        applyAllRequirementFilters();
                                    }}
                                >
                                    <div style={styles.filterPanelHeader}>
                                        <div>
                                            <h3 style={styles.filterPanelTitle}>Requirement Filters</h3>
                                            <p style={styles.filterPanelSubText}>Select requirement filters and press Enter or click Apply Filters.</p>
                                        </div>
                                        <button type="button" style={styles.filterPanelClose} onClick={() => setShowAllRequirementFilterPanel(false)}>×</button>
                                    </div>

                                    <div style={styles.categoryFilterGrid}>
                                        <div style={styles.categoryFilterGroup}>
                                            <label style={styles.categoryFilterLabel}>Title</label>
                                            <input placeholder="Developer, React, Java..." style={styles.categoryFilterInput} value={draftAllRequirementFilters.title} onChange={(e) => updateDraftAllRequirementFilter("title", e.target.value)} />
                                        </div>

                                        <div style={styles.categoryFilterGroup}>
                                            <label style={styles.categoryFilterLabel}>Client</label>
                                            <input placeholder="Client name" style={styles.categoryFilterInput} value={draftAllRequirementFilters.client} onChange={(e) => updateDraftAllRequirementFilter("client", e.target.value)} />
                                        </div>

                                        <div style={styles.categoryFilterGroup}>
                                            <label style={styles.categoryFilterLabel}>Experience</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Min experience e.g. 3"
                                                style={styles.categoryFilterInput}
                                                value={draftAllRequirementFilters.experience}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (/^\d*\.?\d*$/.test(value)) updateDraftAllRequirementFilter("experience", value);
                                                }}
                                            />
                                        </div>

                                        <div style={styles.categoryFilterGroup}>
                                            <label style={styles.categoryFilterLabel}>Skills / Technology</label>
                                            <input placeholder="AWS, React, Node..." style={styles.categoryFilterInput} value={draftAllRequirementFilters.skills} onChange={(e) => updateDraftAllRequirementFilter("skills", e.target.value)} />
                                        </div>

                                        <div style={styles.categoryFilterGroup}>
                                            <label style={styles.categoryFilterLabel}>Rate</label>
                                            <input placeholder="KPM, LPA, 80..." style={styles.categoryFilterInput} value={draftAllRequirementFilters.rate} onChange={(e) => updateDraftAllRequirementFilter("rate", e.target.value)} />
                                        </div>

                                        <div style={styles.categoryFilterGroup}>
                                            <label style={styles.categoryFilterLabel}>Budget</label>
                                            <input placeholder="Budget range" style={styles.categoryFilterInput} value={draftAllRequirementFilters.budget} onChange={(e) => updateDraftAllRequirementFilter("budget", e.target.value)} />
                                        </div>

                                        <div style={styles.categoryFilterGroupWide}>
                                            <label style={styles.categoryFilterLabel}>Job Description</label>
                                            <textarea
                                                placeholder="Search by JD keywords, responsibilities, skills, role details..."
                                                style={styles.jobDescriptionFilterInput}
                                                value={draftAllRequirementFilters.job_description}
                                                onChange={(e) => updateDraftAllRequirementFilter("job_description", e.target.value)}
                                            />
                                            <div style={styles.filterHelperText}>Exact word matching with weighted scoring across Title, Skills, Experience, Client/Budget and JD fields.</div>
                                        </div>
                                    </div>

                                    <div style={styles.filterPanelActions}>
                                        <button type="button" style={styles.clearFiltersBtn} onClick={clearAllRequirementFilters}>Clear Filters</button>
                                        <button type="submit" style={styles.applyFiltersBtn}>Apply Filters</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}
                   <button onClick={() => navigate("/employee/requirement/create")} style={styles.addBtn}>
                    + Add Requirement
                </button>
            </div>

            <div style={styles.statsContainer}>
                <div style={styles.statCard}>Total: <strong>{displayedTotalCount}</strong></div>
                <div style={styles.statCard}>Created By Me: <strong style={{color: '#27AE60'}}>{stats.created_by_me}</strong></div>
                <div style={styles.statCard}>Assigned To Me: <strong style={{color: '#2563EB'}}>{stats.assigned_to_me}</strong></div>
            </div>

            <div style={styles.section}>
                <h2 style={styles.pageTitle}>{getPageTitle()}</h2>
                {shouldSplitMyRequirements ? (
                    <>
                        <div style={styles.splitBlock}>
                            <h3 style={styles.subSectionTitle}>{typeParam === "today" ? "My Today's Requirements" : "My Yesterday Requirements"}</h3>
                            {renderMyRequirementsTable(paginatedMyCreatedRequirements, "No requirements created by you found.")}
                        </div>
                        {/* <div style={styles.splitBlock}>
                       <h3 style={styles.subSectionTitle}>{typeParam === "today" ? "Team Today's Requirements" : "Team Yesterday Requirements"}</h3>
                            {renderMyRequirementsTable(paginatedTeamRequirements, "No team requirements found.")}
                        </div> */}
                        {/* {renderPagination({
                            totalItems: Math.max(myCreatedRequirements.length, teamRequirements.length),
                            currentPageValue: currentPage,
                            pageSizeValue: itemsPerPage,
                            onPageChange: setCurrentPage,
                            onPageSizeChange: setItemsPerPage,
                        })} */}
                    </>
                ) : (
                    <>
                        {renderMyRequirementsTable(paginatedRequirements, "No requirements found.")}
                        {renderPagination({
                            totalItems: visibleAllRequirements.length,
                            currentPageValue: currentPage,
                            pageSizeValue: itemsPerPage,
                            onPageChange: setCurrentPage,
                            onPageSizeChange: setItemsPerPage,
                        })}
                    </>
                )}
            </div>

            {/* Section 2: Available Requirements Table */}
            <div style={{ ...styles.section, marginTop: "40px" }}>
                <h2 style={styles.pageTitle}>Team Requirements <span style={{ fontSize: "14px", fontWeight: "normal", color: "#64748B" }}>{typeParam === "all" ? "(All company requirements)" : typeParam === "today" ? "(All team requirements created today)" : "(All team requirements created yesterday)"}</span></h2>

                <div style={{ ...styles.topBar, marginBottom: "20px" }}>
                    <div style={styles.searchContainer}>
                        <input type="text" placeholder="Search available requirements..." style={styles.searchInput} value={searchQueryAvailable} onChange={(e) => setSearchQueryAvailable(e.target.value)} />
                    </div>
                </div>

                <div style={styles.statsContainer}>
                    <div style={styles.statCard}>Team Total: <strong>{availableStats.total_available || 0}</strong></div>
                    {/* {typeParam !== "all" && (
                        <>
                            <div style={styles.statCard}>HOT: <strong style={{color: '#DC2626'}}>{availableStats.hot_count || 0}</strong></div>
                            <div style={styles.statCard}>WARM: <strong style={{color: '#F59E0B'}}>{availableStats.warm_count || 0}</strong></div>
                        </>
                    )} */}
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.th, width: "130px" }}>ID & Date</th>
                                <th style={{ ...styles.th, width: "200px" }}>Title & Client</th>
                                <th style={{ ...styles.th, width: "100px" }}>Exp / Rate</th>
                                <th style={{ ...styles.th, width: "80px" }}>Status</th>
                                <th style={{ ...styles.th, width: "120px" }}>Budget Range</th>
                                <th style={{ ...styles.th, width: "120px" }}>Created By</th>
                                <th style={{ ...styles.th, width: "200px" }}>JD Description</th>
                                <th style={{ ...styles.th, width: "120px" }}>Stats</th>
                                <th style={{ ...styles.th, textAlign: "center", width: "140px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingAvailable ? (
                                <tr><td colSpan="9" style={styles.loadingTd}>Loading available requirements...</td></tr>
                            ) : availableRequirements.length > 0 ? (
                                paginatedAvailableRequirements.map((req, index) => {
                                    const dropdownDynamicStyle = index < 3 ? { top: "100%", bottom: "auto", marginTop: "8px" } : { bottom: "100%", top: "auto", marginBottom: "8px" };
                                    return (
                                    <RequirementRowWrapper key={req.id} status={req.status} onClick={() => navigate(`/employee/requirement/view/${req.id}`)}>
                                        <td style={styles.td}>
                                            <div style={styles.reqIdBadge}>{req.requirement_id}</div>
                                            <div style={styles.dateText}>{new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.primaryText} title={req.title}>{truncateText(req.title, 35)}</div>
                                            <div style={styles.subText} title={req.client_details?.company_name || req.client_details?.client_name}>{truncateText(req.client_details?.company_name || req.client_details?.client_name, 30)}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.infoText} title={req.experience_required}>{truncateText(req.experience_required, 15)}</div>
                                            <div style={styles.rateText} title={req.rate}>{truncateText(req.rate, 15)}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={getStatusBadgeStyle(req.status)}>{req.status || "—"}</span>
                                            <StatusTimer createdAt={req.created_at} status={req.status} manual_status={req.manual_status} manual_status_updated_at={req.manual_status_updated_at} />
                                        </td>
                                        <td style={styles.td}><div style={styles.infoText} title={req.vendor_budget_range}>{truncateText(req.vendor_budget_range, 20) || "—"}</div></td>
                                        <td style={styles.td}><div style={styles.creatorText} title={getCreatorName(req)}>{truncateText(getCreatorName(req), 20)}</div></td>
                                        <td style={styles.td}>
                                            <div style={styles.jdTruncate} onClick={(e) => { e.stopPropagation(); setCopySuccess(false); setSelectedJd({ title: req.title, desc: req.jd_description }); }}>
                                                {req.jd_description || "No description provided."}
                                            </div>
                                        </td>
                                        <td style={styles.td}><div style={styles.statLine}>Submissions: <strong>{renderSubmissionCount(req)}</strong></div></td>
                                        <td style={styles.actionTd}>
                                            <div style={styles.actionMenuWrapper}>
                                                <button type="button" style={styles.actionDotsBtn} onClick={(e) => { e.stopPropagation(); toggleActionMenuAvailable(req.id); }} title="Actions">⋯</button>
                                                {actionDropdownOpenAvailable === req.id && (
                                                    <div style={{ ...styles.actionDropdown, ...dropdownDynamicStyle }}>
                                                        <button type="button" style={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); navigate(`/employee/requirement/view/${req.id}`); setActionDropdownOpenAvailable(null); }}>View</button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </RequirementRowWrapper>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="9" style={styles.loadingTd}>No available requirements found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {renderPagination({
                    totalItems: availableRequirements.length,
                    currentPageValue: availableCurrentPage,
                    pageSizeValue: availableItemsPerPage,
                    onPageChange: setAvailableCurrentPage,
                    onPageSizeChange: setAvailableItemsPerPage,
                })}
            </div>

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
                                <button style={styles.closeBtn} onClick={() => setSelectedJd(null)}>✕</button>
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
    filterButtonWrap: { position: "relative", display: "inline-flex", alignItems: "center" },
    filterDropdownPanel: { position: "absolute", top: "48px", right: 0, width: "560px", maxWidth: "calc(100vw - 32px)", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "18px", zIndex: 1000, boxShadow: "0 14px 34px rgba(15, 23, 42, 0.16)" },
    filterDropdownForm: { margin: 0 },
    linkedInFilterToggle: { background: "#fff", color: "#25343F", border: "1px solid #E2E8F0", padding: "10px 16px", borderRadius: "999px", cursor: "pointer", fontSize: "13px", fontWeight: "900", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 3px 10px rgba(15, 23, 42, 0.04)" },
    linkedInFilterToggleActive: { background: "#FFF5EB", border: "1px solid #FFB777", color: "#FF7A1A" },
    filterCountBadge: { background: "#FF9B51", color: "#fff", minWidth: "20px", height: "20px", borderRadius: "999px", fontSize: "11px", fontWeight: "900", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px" },
    filterCaret: { fontSize: "12px", color: "inherit" },
    filterPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "15px", marginBottom: "16px" },
    filterPanelTitle: { margin: 0, color: "#25343F", fontSize: "16px", fontWeight: "900" },
    filterPanelSubText: { margin: "4px 0 0", color: "#64748B", fontSize: "12px", fontWeight: "600" },
    filterPanelClose: { width: "30px", height: "30px", border: "none", borderRadius: "8px", background: "#F1F5F9", color: "#25343F", cursor: "pointer", fontSize: "20px", fontWeight: "900", lineHeight: 1 },
    categoryFilterGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px" },
    categoryFilterGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    categoryFilterGroupWide: { gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" },
    categoryFilterLabel: { fontSize: "11px", color: "#64748B", fontWeight: "900", textTransform: "uppercase" },
    categoryFilterInput: { width: "100%", padding: "11px 12px", borderRadius: "10px", border: "1px solid #E2E8F0", outline: "none", fontSize: "13px", color: "#25343F", background: "#fff", boxSizing: "border-box" },
    jobDescriptionFilterInput: { width: "100%", minHeight: "125px", padding: "12px", borderRadius: "12px", border: "1px solid #E2E8F0", outline: "none", fontSize: "13px", color: "#25343F", background: "#fff", boxSizing: "border-box", resize: "vertical", lineHeight: "1.55", fontFamily: "inherit" },
    filterHelperText: { fontSize: "11px", color: "#94A3B8", fontWeight: "700" },
    filterPanelActions: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginTop: "18px", flexWrap: "wrap" },
    clearFiltersBtn: { background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0", padding: "10px 16px", borderRadius: "10px", fontWeight: "900", cursor: "pointer", fontSize: "13px" },
    applyFiltersBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "10px", fontWeight: "900", cursor: "pointer", fontSize: "13px", boxShadow: "0 5px 14px rgba(255,155,81,0.25)" },
    matchBadgeMedium: { display: "inline-flex", marginTop: "6px", background: "#FFF7ED", color: "#EA580C", border: "1px solid #FED7AA", padding: "3px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "900", whiteSpace: "nowrap" },
    matchBadgeLow: { display: "inline-flex", marginTop: "6px", background: "#F8FAFC", color: "#475569", border: "1px solid #E2E8F0", padding: "3px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "900", whiteSpace: "nowrap" },
    toast: { position: "fixed", top: "85px", right: "20px", color: "#fff", padding: "12px 25px", borderRadius: "8px", zIndex: 9999, fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
    addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" },
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", gap: "15px", flexWrap: "wrap" },
    leftActions: { display: "flex", alignItems: "center", gap: "15px" },
    backBtn: { background: "#25343f", color: "white", border: "none", fontWeight: "600", cursor: "pointer", padding: "10px" ,borderRadius:"10px" },
    filterGroup: { display: "flex", gap: "10px", background: "#F1F5F9", padding: "4px", borderRadius: "8px" },
    filterBtn: { background: "transparent", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", color: "#475569", cursor: "pointer", transition: "0.2s" },
    activeFilterBtn: { background: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", color: "#1E293B", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", transition: "0.2s" },
    searchContainer: { flex: "1 1 250px", maxWidth: "400px" },
    searchInput: { width: "100%", padding: "10px 15px", borderRadius: "10px", border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box" },
    statsContainer: { display: "flex", gap: "15px", marginBottom: "25px", flexWrap: "wrap" },
    statCard: { background: "#fff", padding: "12px 20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", fontSize: "14px", color: "#475569", border: "1px solid #E2E8F0" },
    pageTitle: { fontSize: "20px", color: "#1E293B", marginBottom: "15px", fontWeight: "800" },
    subSectionTitle: { fontSize: "16px", color: "#25343F", margin: "0 0 10px 0", fontWeight: "800", borderLeft: "4px solid #FF9B51", paddingLeft: "10px" },
    splitBlock: { marginBottom: "22px" },
    createdRequirementRow: { boxShadow: "inset 4px 0 0 #FF9B51" },
    assignedRequirementRow: { boxShadow: "inset 4px 0 0 #2563EB" },
    teamRequirementRow: { boxShadow: "inset 4px 0 0 #94A3B8" },
    createdFirstCell: { borderLeft: "4px solid #FF9B51" },
    assignedFirstCell: { borderLeft: "4px solid #2563EB" },
    teamFirstCell: { borderLeft: "4px solid #94A3B8" },
    ownerChipCreated: { display: "inline-block", marginTop: "6px", padding: "3px 8px", borderRadius: "999px", background: "#FFF3E8", color: "#C2410C", border: "1px solid #FED7AA", fontSize: "10px", fontWeight: "800", whiteSpace: "nowrap" },
    ownerChipAssigned: { display: "inline-block", marginTop: "6px", padding: "3px 8px", borderRadius: "999px", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", fontSize: "10px", fontWeight: "800", whiteSpace: "nowrap" },
    ownerChipTeam: { display: "inline-block", marginTop: "6px", padding: "3px 8px", borderRadius: "999px", background: "#F8FAFC", color: "#475569", border: "1px solid #CBD5E1", fontSize: "10px", fontWeight: "800", whiteSpace: "nowrap" },
    section: { marginBottom: "30px" },
    tableWrapper: { background: "#fff", borderRadius: "12px", overflowX: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" },
    table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "900px" },
    tableHeader: { background: "#F8FAFC", borderBottom: "1px solid #EDF2F7" },
    th: { padding: "15px", textAlign: "left", color: "#64748B", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" },
    thCompact: { padding: "12px 10px", textAlign: "left", color: "#64748B", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" },
    tableRow: { borderBottom: "1px solid #F1F5F9" },
    td: { padding: "15px", verticalAlign: "middle" },
    tdCompact: { padding: "12px 10px", verticalAlign: "middle" },
    reqIdBadge: { background: "#EFF6FF", color: "#2563EB", padding: "4px 8px", borderRadius: "5px", fontWeight: "700", fontSize: "12px", display: "inline-block", marginBottom: "4px" },
    dateText: { fontSize: "11px", color: "#94A3B8", fontWeight: "600", paddingLeft: "2px" },
    primaryText: { fontWeight: "700", color: "#1E293B", fontSize: "14px" },
    subText: { fontSize: "12px", color: "#64748B", marginTop: "2px" },
    infoText: { fontSize: "13px", fontWeight: "600" },
    creatorText: { fontSize: "12px", color: "#25343F", fontWeight: "700" },
    rateText: { fontSize: "12px", color: "#10B981", fontWeight: "700" },
    jdTruncate: { fontSize: "13px", color: "#475569", lineHeight: "1.5", cursor: "pointer", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" },
    statLine: { fontSize: "12px", color: "#334155", marginBottom: "6px" },
    assignWrapper: { display: "flex", alignItems: "center", gap: "5px" },
    assignNames: { fontSize: "12px", color: "#0F172A", background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "3px 8px", borderRadius: "6px", fontWeight: "600" },
    assignBadge: { fontSize: "10px", background: "#1E293B", color: "#fff", padding: "2px 5px", borderRadius: "4px", fontWeight: "700" },
    unassignedText: { fontSize: "11px", color: "#94A3B8", fontStyle: "italic" },
    actionTd: { textAlign: "center" },
    actionTdCompact: { textAlign: "center", padding: "12px 8px" },
    actionMenuWrapper: { position: "relative", display: "inline-block" },
    actionDotsBtn: { background: "#F8FAFC", color: "#0F172A", border: "1px solid #CBD5E1", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", fontSize: "18px", lineHeight: "1", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 },
    actionDropdown: {
        position: "absolute",
        right: 0,
        bottom: "100%",
        marginBottom: "8px",
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
        zIndex: 20,
        minWidth: "140px",
        padding: "6px 0"
    },
    dropdownItem: { width: "100%", background: "transparent", border: "none", textAlign: "left", padding: "10px 16px", fontSize: "13px", color: "#0F172A", cursor: "pointer", outline: "none" },
    dropdownDeleteItem: { width: "100%", background: "transparent", border: "none", textAlign: "left", padding: "10px 16px", fontSize: "13px", color: "#DC2626", cursor: "pointer", outline: "none", fontWeight: "800" },
    loadingTd: { textAlign: "center", padding: "40px", color: "#64748B" },
    paginationBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", padding: "14px 16px", marginTop: "12px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" },
    paginationInfo: { fontSize: "13px", color: "#475569", fontWeight: "600" },
    paginationActions: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
    pageSizeLabel: { fontSize: "12px", color: "#64748B", fontWeight: "700" },
    pageSizeSelect: { padding: "7px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#fff", fontSize: "13px", fontWeight: "700", outline: "none" },
    paginationBtn: { background: "#25343f", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer" },
    paginationBtnDisabled: { background: "#E2E8F0", color: "#94A3B8", border: "none", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "not-allowed" },
    pageCount: { fontSize: "12px", color: "#334155", fontWeight: "700" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modalContent: { background: "#fff", borderRadius: "12px", width: "90%", maxWidth: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
    modalHeader: { padding: "15px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" },
    modalTitle: { margin: 0, fontSize: "16px", color: "#1E293B", fontWeight: "800", flex: 1 },
    modalActions: { display: "flex", alignItems: "center", gap: "10px" },
    copyBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(255,155,81,0.25)" },
    copyBtnSuccess: { background: "#27AE60", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(39,174,96,0.25)" },
    closeBtn: { background: "transparent", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748B" },
    modalBody: { padding: "20px", overflowY: "auto", fontSize: "14px", lineHeight: "1.6", color: "#334155", whiteSpace: "pre-wrap" }
};

export default MyRequirements;
