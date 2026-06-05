import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { asList } from "../../utils/apiHelpers";
import BaseLayout from "../components/SubAdminLayout";

function VendorList() {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);

    const [selectedVendors, setSelectedVendors] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState({ show: false, vendorId: null });
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [empSearch, setEmpSearch] = useState("");
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });
    const [verifyingId, setVerifyingId] = useState(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        };
    };

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const fetchVendors = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const url = `/sub-admin/api/admin-vendors/?page=${page}&search=${encodeURIComponent(search)}`;
            const response = await apiRequest(url, "GET", null, getAuthHeaders());
            setVendors(response.results || []);
            setTotalCount(response.count || 0);
            setHasNext(!!response.next);
            setHasPrev(!!response.previous);
        } catch (error) {
            console.error("Error fetching vendors:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredVendors = vendors.filter((vendor) => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) return true;

        const vendorName = String(vendor.name || vendor.vendor_name || "").toLowerCase();
        const companyName = String(vendor.company_name || "").toLowerCase();

        return vendorName.includes(query) || companyName.includes(query);
    });

    const fetchEmployees = async () => {
        try {
            const response = await apiRequest("/sub-admin/api/users/", "GET");
            setEmployees(asList(response));
        } catch (error) {
            console.error("Employee fetch error:", error);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchVendors(currentPage, searchQuery);
        }, 500);

        fetchEmployees();

        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, searchQuery]);

    const handleVerifyToggle = async (vendorId, currentStatus) => {
        setVerifyingId(vendorId);
        try {
            const response = await apiRequest(
                `/employee-portal/api/vendors/${vendorId}/toggle-verify/`,
                "POST",
                {},
                getAuthHeaders()
            );

            setVendors(prev =>
                prev.map(v =>
                    v.id === vendorId ? { ...v, is_verified: response.data?.is_verified } : v
                )
            );

            notify(response.message || (currentStatus ? "Vendor unverified" : "Vendor verified successfully"));
        } catch (error) {
            notify("Verify toggle failed", "error");
        } finally {
            setVerifyingId(null);
        }
    };

    const handleAssignSubmit = async () => {
        if (selectedVendors.length === 0 || selectedEmployees.length === 0) {
            return notify("Select vendors and employees first", "error");
        }

        try {
            const promises = selectedVendors.map(vendorId =>
                apiRequest("/sub-admin/api/vendors/assign/", "POST", {
                    vendor_id: vendorId,
                    employee_ids: selectedEmployees
                }, getAuthHeaders())
            );

            await Promise.all(promises);
            notify(`Successfully assigned to ${selectedEmployees.length} employees`);
            setShowAssignModal(false);
            setSelectedVendors([]);
            setSelectedEmployees([]);
            fetchVendors(currentPage, searchQuery);
        } catch (error) {
            notify("Assignment Failed", "error");
        }
    };

    const handleDelete = async (type) => {
        const vendorId = showDeleteModal.vendorId;
        const endpoint = type === "soft"
            ? `/sub-admin/api/vendors/${vendorId}/soft-delete/`
            : `/sub-admin/api/vendors/${vendorId}/hard-delete/`;

        try {
            await apiRequest(endpoint, "DELETE", null, getAuthHeaders());
            notify(type === "soft" ? "Vendor moved to trash" : "Vendor deleted permanently");
            setShowDeleteModal({ show: false, vendorId: null });
            fetchVendors(currentPage, searchQuery);
        } catch (error) {
            notify("Delete failed", "error");
        }
    };

    const toggleVendorSelection = (id) => {
        setSelectedVendors(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    return (
        <BaseLayout>
            {toast.show && (
                <div style={{
                    ...styles.toast,
                    backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60"
                }}>
                    {toast.msg}
                </div>
            )}

            <div style={styles.topBar}>
                <button onClick={() => navigate("/sub-admin")} style={styles.backBtn}>
                    ← Back to Overview
                </button>

                <div style={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Search by vendor name or company name..."
                        style={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    {selectedVendors.length > 0 && (
                        <button style={styles.assignBtn} onClick={() => setShowAssignModal(true)}>
                            Assign Selected ({selectedVendors.length})
                        </button>
                    )}
                    <button onClick={() => navigate("/sub-admin/add-vendor")} style={styles.addBtn}>
                        + Add Vendor
                    </button>
                </div>
            </div>

            <div style={styles.section}>
                <h2 style={styles.pageTitle}>Vendors</h2>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={styles.th}>
                                    <input
                                        type="checkbox"
                                        onChange={() =>
                                            setSelectedVendors(
                                                selectedVendors.length === filteredVendors.length
                                                    ? []
                                                    : filteredVendors.map(v => v.id)
                                            )
                                        }
                                        checked={selectedVendors.length === filteredVendors.length && filteredVendors.length > 0}
                                    />
                                </th>
                                <th style={styles.th}>Vendor & Company</th>
                                <th style={styles.th}>Contact Info</th>
                                <th style={styles.th}>Profiles</th>
                                <th style={styles.th}>Created By</th>
                                <th style={styles.th}>Onsite</th>
                                <th style={styles.th}>Verified</th>
                                <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "60px" }}>
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredVendors.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "60px" }}>
                                        No vendors found
                                    </td>
                                </tr>
                            ) : filteredVendors.map((vendor) => (
                                <tr
                                    key={vendor.id}
                                    style={{
                                        ...styles.tableRow,
                                        background: selectedVendors.includes(vendor.id) ? "#F1F5F9" : "transparent"
                                    }}
                                >
                                    <td style={styles.td}>
                                        <input
                                            type="checkbox"
                                            checked={selectedVendors.includes(vendor.id)}
                                            onChange={() => toggleVendorSelection(vendor.id)}
                                        />
                                    </td>

                                    <td style={styles.td}>
                                        <div style={styles.primaryText}>{vendor.name || vendor.vendor_name}</div>
                                        <div style={styles.secondaryText}>{vendor.company_name}</div>
                                    </td>

                                    <td style={styles.td}>
                                        <div style={styles.primaryText}>{vendor.number}</div>
                                        <div style={styles.secondaryText}>{vendor.email || "No Email"}</div>
                                    </td>

                                    <td style={styles.td}>
                                        <div style={styles.profileBadge}>{vendor.profile_count} Profiles</div>
                                    </td>

                                    <td style={styles.td}>{vendor.created_by_name}</td>

                                    <td style={styles.td}>
                                        <span style={vendor.provide_onsite ? styles.badgeYes : styles.badgeNo}>
                                            {vendor.provide_onsite ? "YES" : "NO"}
                                        </span>
                                    </td>

                                    <td style={styles.td}>
                                        <span style={vendor.is_verified ? styles.badgeVerified : styles.badgeUnverified}>
                                            {vendor.is_verified ? "✓ Verified" : "✗ Unverified"}
                                        </span>
                                    </td>

                                    <td style={styles.actionTd}>
                                        <button
                                            style={styles.viewBtn}
                                            onClick={() => navigate(`/sub-admin/vendor/view/${vendor.id}`)}
                                        >
                                            View
                                        </button>

                                        <button
                                            style={styles.editBtn}
                                            onClick={() => navigate(`/sub-admin/edit-vendor/${vendor.id}`)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            style={vendor.is_verified ? styles.unverifyBtn : styles.verifyBtn}
                                            onClick={() => handleVerifyToggle(vendor.id, vendor.is_verified)}
                                            disabled={verifyingId === vendor.id}
                                        >
                                            {verifyingId === vendor.id ? "..." : vendor.is_verified ? "Unverify" : "Verify"}
                                        </button>

                                        <button
                                            style={styles.deleteBtn}
                                            onClick={() => setShowDeleteModal({ show: true, vendorId: vendor.id })}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={styles.pagination}>
                    <button
                        disabled={!hasPrev || loading}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        style={{ ...styles.pageStep, opacity: hasPrev ? 1 : 0.5 }}
                    >
                        Previous
                    </button>

                    <button style={{ ...styles.pageNum, ...styles.activePage }}>
                        {currentPage}
                    </button>

                    <button
                        disabled={!hasNext || loading}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        style={{ ...styles.pageStep, opacity: hasNext ? 1 : 0.5 }}
                    >
                        Next
                    </button>
                </div>
            </div>

            {showDeleteModal.show && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={{ marginTop: 0 }}>Delete Vendor?</h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
                            <button style={styles.softDelBtn} onClick={() => handleDelete("soft")}>
                                Move to Trash (Soft Delete)
                            </button>

                            <button style={styles.hardDelBtn} onClick={() => handleDelete("hard")}>
                                Delete Permanently (Hard Delete)
                            </button>

                            <button
                                style={styles.cancelBtn}
                                onClick={() => setShowDeleteModal({ show: false, vendorId: null })}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAssignModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={{ marginBottom: "15px", textAlign: "center", fontWeight: "bold" }}>
                            Assign Vendors to Employees
                        </h3>

                        <div style={{ width: "100%", marginBottom: "15px" }}>
                            <input
                                placeholder="Search by name..."
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: "1px solid #ddd",
                                    boxSizing: "border-box"
                                }}
                                onChange={e => setEmpSearch(e.target.value)}
                            />
                        </div>

                        <div style={{
                            maxHeight: "300px",
                            overflowY: "auto",
                            border: "1px solid #eee",
                            borderRadius: "8px",
                            marginBottom: "20px"
                        }}>
                            {employees
                                .filter(e =>
                                    `${e.first_name} ${e.last_name}`.toLowerCase().includes(empSearch.toLowerCase())
                                )
                                ?.map(emp => {
                                    const isEmployeeRole = emp.role?.toUpperCase() === "EMPLOYEE";
                                    const displayRole = isEmployeeRole ? "RECRUITER" : (emp.role?.toUpperCase() || "NO ROLE");

                                    return (
                                        <div key={emp.id} style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "10px 12px",
                                            borderBottom: "1px solid #eee",
                                            opacity: isEmployeeRole ? 1 : 0.6,
                                            backgroundColor: isEmployeeRole ? "#fff" : "#f9f9f9",
                                            cursor: isEmployeeRole ? "pointer" : "not-allowed"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                {isEmployeeRole ? (
                                                    <input
                                                        type="checkbox"
                                                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                                        checked={selectedEmployees.includes(emp.id)}
                                                        onChange={() => setSelectedEmployees(prev =>
                                                            prev.includes(emp.id)
                                                                ? prev.filter(x => x !== emp.id)
                                                                : [...prev, emp.id]
                                                        )}
                                                    />
                                                ) : (
                                                    <span style={{ width: "16px", textAlign: "center", color: "#ccc" }}>
                                                        ×
                                                    </span>
                                                )}

                                                <span style={{ marginLeft: "10px", fontWeight: "600", fontSize: "14px", color: "#333" }}>
                                                    {emp.first_name} {emp.last_name}
                                                </span>
                                            </div>

                                            <span style={{
                                                fontSize: "10px",
                                                padding: "3px 8px",
                                                borderRadius: "4px",
                                                backgroundColor: isEmployeeRole ? "#E0F2FE" : "#F1F5F9",
                                                color: isEmployeeRole ? "#0369A1" : "#64748B",
                                                fontWeight: "800",
                                                letterSpacing: "0.5px"
                                            }}>
                                                {displayRole}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                style={{ ...styles.saveBtn, flex: 1, padding: "12px", borderRadius: "8px" }}
                                onClick={handleAssignSubmit}
                            >
                                Assign Now
                            </button>

                            <button
                                style={{ ...styles.cancelBtn, flex: 1, padding: "12px", borderRadius: "8px" }}
                                onClick={() => setShowAssignModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </BaseLayout>
    );
}

const styles = {
    toast: { position: "fixed", top: "85px", right: "20px", color: "#fff", padding: "12px 25px", borderRadius: "8px", zIndex: 10001, fontWeight: "700" },
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "15px" },
    backBtn: { background: "#1e293b", color: "white", border: "none", fontSize: "15px", fontWeight: "700", cursor: "pointer", borderRadius: "10px", padding: "10px" },
    searchContainer: { flex: 1, maxWidth: "400px" },
    searchInput: { width: "100%", padding: "12px 15px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none" },
    addBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" },
    assignBtn: { background: "#25343F", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" },
    pageTitle: { fontSize: "24px", color: "#25343F", marginBottom: "15px", fontWeight: "800" },
    tableWrapper: { background: "#fff", borderRadius: "16px", overflow: "hidden", border: "1px solid #EAEFEF" },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHeader: { background: "#BFC9D1" },
    th: { padding: "16px", textAlign: "left", color: "#25343F", fontSize: "14px", fontWeight: "700" },
    tableRow: { borderBottom: "1px solid #EAEFEF" },
    td: { padding: "16px", color: "#25343F", fontSize: "14px" },
    primaryText: { fontWeight: "700" },
    secondaryText: { fontSize: "13px", color: "#4B5563", fontWeight: "600", marginTop: "3px" },
    profileBadge: { background: "#EAEFEF", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" },
    actionTd: { display: "flex", gap: "8px", padding: "16px", justifyContent: "center", alignItems: "center" },
    badgeYes: { padding: "4px 8px", background: "#dcfce7", color: "#166534", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" },
    badgeNo: { padding: "4px 8px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" },
    badgeVerified: { padding: "4px 10px", background: "#dcfce7", color: "#166534", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" },
    badgeUnverified: { padding: "4px 10px", background: "#FEF3C7", color: "#92400E", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" },
    viewBtn: { padding: "6px 12px", borderRadius: "6px", border: "1px solid #BFC9D1", background: "#fff", cursor: "pointer" },
    editBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#25343F", color: "#fff", cursor: "pointer" },
    deleteBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#fee2e2", color: "#991b1b", cursor: "pointer" },
    verifyBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#dcfce7", color: "#166534", cursor: "pointer", fontWeight: "600" },
    unverifyBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#FEF3C7", color: "#92400E", cursor: "pointer", fontWeight: "600" },
    modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 },
    modalContent: { background: "#fff", padding: "25px", borderRadius: "15px", width: "350px" },
    softDelBtn: { background: "#64748B", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
    hardDelBtn: { background: "#EF4444", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
    pagination: { display: "flex", justifyContent: "center", alignItems: "center", marginTop: "30px", gap: "20px" },
    pageStep: { padding: "8px 16px", background: "#fff", border: "1px solid #BFC9D1", borderRadius: "8px", cursor: "pointer" },
    pageNum: { width: "35px", height: "35px", borderRadius: "8px", border: "1px solid #BFC9D1", background: "#fff" },
    activePage: { background: "#FF9B51", color: "#fff", borderColor: "#FF9B51" },
    empList: { maxHeight: "200px", overflowY: "auto", border: "1px solid #eee", padding: "10px" },
    empItem: { display: "flex", alignItems: "center", marginBottom: "10px", fontSize: "13px" },
    saveBtn: { flex: 1, background: "#FF9B51", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700" },
    cancelBtn: { flex: 1, background: "#eee", color: "#333", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer" }
};

export default VendorList;