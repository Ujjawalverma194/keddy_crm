import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const Icons = {
    Back: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
    ),
    User: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Phone: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
        </svg>
    ),
    Mail: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
        </svg>
    ),
    Lock: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    ),
    Eye: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
    ),
    EyeOff: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    ),
    Save: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
        </svg>
    ),
    Shield: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    Check: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    AlertCircle: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    Camera: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
        </svg>
    ),
    RoleIcon: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
    ),
};

// ─── Input Field Component ────────────────────────────────────────────────────
function InputField({ label, name, value, onChange, type = "text", placeholder, disabled = false, icon: Icon, error, rightElement }) {
    return (
        <div style={fieldStyles.wrap}>
            <label style={fieldStyles.label}>{label}</label>
            <div style={{ ...fieldStyles.inputWrap, borderColor: error ? "#EF4444" : "#CBD5E1" }}>
                {Icon && (
                    <span style={fieldStyles.iconLeft}>
                        <Icon />
                    </span>
                )}
                <input
                    type={type}
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    style={{ ...fieldStyles.input, paddingLeft: Icon ? "40px" : "14px", paddingRight: rightElement ? "44px" : "14px", background: disabled ? "#F8FAFC" : "#fff", color: disabled ? "#94A3B8" : "#25343F", cursor: disabled ? "not-allowed" : "text" }}
                />
                {rightElement && <span style={fieldStyles.iconRight}>{rightElement}</span>}
            </div>
            {error && (
                <div style={fieldStyles.errorMsg}>
                    <Icons.AlertCircle /> {error}
                </div>
            )}
        </div>
    );
}

// ─── Select Field Component ────────────────────────────────────────────────────
function SelectField({ label, name, value, onChange, options, disabled = false, icon: Icon, error }) {
    return (
        <div style={fieldStyles.wrap}>
            <label style={fieldStyles.label}>{label}</label>
            <div style={{ ...fieldStyles.inputWrap, borderColor: error ? "#EF4444" : "#CBD5E1" }}>
                {Icon && (
                    <span style={fieldStyles.iconLeft}>
                        <Icon />
                    </span>
                )}
                <select
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    disabled={disabled}
                    style={{ ...fieldStyles.input, paddingLeft: Icon ? "40px" : "14px", background: disabled ? "#F8FAFC" : "#fff", cursor: disabled ? "not-allowed" : "pointer" }}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            {error && (
                <div style={fieldStyles.errorMsg}>
                    <Icons.AlertCircle /> {error}
                </div>
            )}
        </div>
    );
}

const fieldStyles = {
    wrap: { display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "13px", fontWeight: "700", color: "#25343F" },
    inputWrap: { position: "relative", display: "flex", alignItems: "center", border: "1px solid #CBD5E1", borderRadius: "9px", overflow: "hidden", transition: "border-color 0.2s" },
    iconLeft: { position: "absolute", left: "12px", color: "#94A3B8", display: "flex", alignItems: "center", pointerEvents: "none" },
    iconRight: { position: "absolute", right: "12px", display: "flex", alignItems: "center", cursor: "pointer", color: "#94A3B8" },
    input: { width: "100%", padding: "11px 14px", border: "none", outline: "none", fontSize: "14px", fontFamily: "inherit", borderRadius: "9px" },
    errorMsg: { display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#EF4444", fontWeight: "600" },
};

// ─── Main Component ────────────────────────────────────────────────────────────
function UpdateUser() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [isFetching, setIsFetching] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });
    const [changePassword, setChangePassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        number: "",
        role: "",
        password: "",
        confirm_password: "",
    });

    const [originalData, setOriginalData] = useState(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    };

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3500);
    };

    // ── Fetch existing user data ──
    // In useEffect - Update fetch function

useEffect(() => {
    const fetchUser = async () => {
        setIsFetching(true);
        try {
            const res = await apiRequest(`/sub-admin/api/users/${id}/`, "GET", null, getAuthHeaders());
            console.log("GET Response:", res);
            
            // Handle different response structures
            let userData = null;
            if (res.success && res.data) {
                userData = res.data;
            } else if (res.data && !res.success) {
                userData = res.data;
            } else if (res.id) {
                userData = res;
            }
            
            if (userData) {
                setOriginalData(userData);
                setForm({
                    first_name: userData.first_name || "",
                    last_name: userData.last_name || "",
                    email: userData.email || "",
                    number: userData.number || "",
                    role: userData.role || "EMPLOYEE",
                    password: "",
                    confirm_password: "",
                });
            } else {
                notify(res.message || "Failed to load user data", "error");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            notify("Error fetching user details", "error");
        } finally {
            setIsFetching(false);
        }
    };
    if (id) {
        fetchUser();
    }
}, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // ── Submit ──
    // In UpdateUser component - Replace handleSubmit function

const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Client-side password validation
    if (changePassword) {
        if (!form.password) {
            setFieldErrors(prev => ({ ...prev, password: "Password is required" }));
            return;
        }
        if (form.password !== form.confirm_password) {
            setFieldErrors(prev => ({ ...prev, confirm_password: "Passwords do not match" }));
            return;
        }
        if (form.password.length < 6) {
            setFieldErrors(prev => ({ ...prev, password: "Password must be at least 6 characters" }));
            return;
        }
    }

    setIsSubmitting(true);
    setFieldErrors({});

    // IMPORTANT: Include all fields including role
    const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,  // Include email
        number: form.number,
        role: form.role,     // Include role
    };

    // Add password only if change password is enabled
    if (changePassword && form.password) {
        payload.password = form.password;
        payload.confirm_password = form.confirm_password;
    }

    console.log("Sending payload:", payload); // Debug log

    try {
        const res = await apiRequest(
            `/sub-admin/api/users/${id}/`,
            "PATCH",
            payload,
            getAuthHeaders()
        );

        console.log("Update response:", res); // Debug log

        if (res.success) {
            notify(res.message || "User updated successfully!");
            // Refresh user data
            const refreshRes = await apiRequest(`/sub-admin/api/users/${id}/`, "GET", null, getAuthHeaders());
            if (refreshRes.success && refreshRes.data) {
                setOriginalData(refreshRes.data);
                setForm(prev => ({
                    ...prev,
                    first_name: refreshRes.data.first_name || "",
                    last_name: refreshRes.data.last_name || "",
                    email: refreshRes.data.email || "",
                    number: refreshRes.data.number || "",
                    role: refreshRes.data.role || "EMPLOYEE",
                }));
            }
            setTimeout(() => navigate(-1), 1500);
        } else {
            if (res.errors) setFieldErrors(res.errors);
            notify(res.message || "Update failed", "error");
        }
    } catch (err) {
        console.error("Update error:", err);
        if (err?.errors) setFieldErrors(err.errors);
        notify(err?.message || "Error updating user", "error");
    } finally {
        setIsSubmitting(false);
    }
};
    // ── Loading ──
    if (isFetching) {
        return (
            <BaseLayout>
                <div style={styles.loadingWrap}>
                    <div style={styles.spinnerRing} />
                    <p style={styles.loadingText}>Loading user data...</p>
                </div>
            </BaseLayout>
        );
    }


    const avatarSrc = originalData?.profile_picture
        ? `${originalData.profile_picture}`
        : null;

    // Role options for dropdown
    const roleOptions = [
        { value: "EMPLOYEE", label: "Recruiter (Employee)" },
        { value: "ACCOUNTANT", label: "Accountant" },
    ];

    return (
        <BaseLayout>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .uu-card { animation: fadeSlideIn 0.35s ease both; }
                .uu-input-wrap:focus-within { border-color: #FF9B51 !important; box-shadow: 0 0 0 3px rgba(255,155,81,0.12); }
                .uu-toggle:hover:not(:disabled) { background: #e2e8f0; }
                .uu-submit:hover:not(:disabled) { background: #f08040 !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,155,81,0.35) !important; }
                .uu-cancel:hover:not(:disabled) { background: #e2e8f0 !important; }
            `}</style>

            {toast.show && (
                <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60" }}>
                    {toast.type === "error" ? <Icons.AlertCircle /> : <Icons.Check />}
                    {toast.msg}
                </div>
            )}

            {/* ── Header ── */}
            <div style={styles.headerRow}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>
                    <Icons.Back /> Back
                </button>
                <h2 style={styles.pageTitle}>Update User</h2>
                <div style={{ width: "90px" }} />
            </div>

            <div style={styles.pageLayout}>

                {/* ── Left: Avatar Card ── */}
                <div className="uu-card" style={styles.avatarCard}>
                    <div style={styles.avatarRing}>
                        {avatarSrc ? (
                            <img src={avatarSrc} alt="avatar" style={styles.avatar} />
                        ) : (
                            <div style={styles.avatarFallback}>
                                {form.first_name?.[0]?.toUpperCase()}{form.last_name?.[0]?.toUpperCase() || ""}
                            </div>
                        )}
                    </div>
                    <div style={styles.avatarName}>{form.first_name} {form.last_name}</div>
                    <div style={styles.avatarEmail}>{form.email}</div>
                    <span style={styles.roleBadge}>{form.role === "EMPLOYEE" ? "EMPLOYEE" : "ACCOUNTANT"}</span>

                    <div style={styles.avatarDivider} />

                    <div style={styles.avatarInfoList}>
                        <div style={styles.avatarInfoItem}>
                            <span style={styles.avatarInfoIcon}><Icons.User /></span>
                            <div>
                                <div style={styles.avatarInfoLabel}>Full Name</div>
                                <div style={styles.avatarInfoValue}>{form.first_name} {form.last_name}</div>
                            </div>
                        </div>
                        <div style={styles.avatarInfoItem}>
                            <span style={styles.avatarInfoIcon}><Icons.Phone /></span>
                            <div>
                                <div style={styles.avatarInfoLabel}>Phone</div>
                                <div style={styles.avatarInfoValue}>{form.number || "N/A"}</div>
                            </div>
                        </div>
                        <div style={styles.avatarInfoItem}>
                            <span style={styles.avatarInfoIcon}><Icons.Mail /></span>
                            <div>
                                <div style={styles.avatarInfoLabel}>Email</div>
                                <div style={styles.avatarInfoValue} title={form.email}>{form.email}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: Form ── */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <form onSubmit={handleSubmit}>

                        {/* Basic Info Card */}
                        <div className="uu-card" style={styles.formCard}>
                            <div style={styles.cardHeader}>
                                <div style={{ ...styles.cardHeaderIcon, background: "#E0F2FE", color: "#0369A1" }}>
                                    <Icons.User />
                                </div>
                                <div>
                                    <div style={styles.cardHeaderTitle}>Basic Information</div>
                                    <div style={styles.cardHeaderSub}>Update name, contact and role details</div>
                                </div>
                            </div>

                            <div style={styles.formGrid}>
                                <InputField
                                    label="First Name"
                                    name="first_name"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Rahul"
                                    icon={Icons.User}
                                    error={fieldErrors.first_name}
                                />
                                <InputField
                                    label="Last Name"
                                    name="last_name"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Sharma"
                                    icon={Icons.User}
                                    error={fieldErrors.last_name}
                                />
                                <InputField
                                    label="Phone Number"
                                    name="number"
                                    value={form.number}
                                    onChange={handleChange}
                                    placeholder="9876543210"
                                    icon={Icons.Phone}
                                    error={fieldErrors.number}
                                />
                                <InputField
                                    label="Email Address"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="user@example.com"
                                    icon={Icons.Mail}
                                    disabled={false}
                                    error={fieldErrors.email}
                                />
                                <SelectField
                                    label="Role"
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                    options={roleOptions}
                                    icon={Icons.RoleIcon}
                                    error={fieldErrors.role}
                                />
                            </div>
                        </div>

                        {/* Password Card */}
                        <div className="uu-card" style={{ ...styles.formCard, marginTop: "16px" }}>
                            <div style={styles.cardHeader}>
                                <div style={{ ...styles.cardHeaderIcon, background: "#FFF7ED", color: "#C2410C" }}>
                                    <Icons.Shield />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={styles.cardHeaderTitle}>Password</div>
                                    <div style={styles.cardHeaderSub}>Leave unchanged to keep current password</div>
                                </div>
                                <button
                                    type="button"
                                    className="uu-toggle"
                                    onClick={() => {
                                        setChangePassword(p => !p);
                                        setForm(prev => ({ ...prev, password: "", confirm_password: "" }));
                                        setFieldErrors(prev => ({ ...prev, password: null, confirm_password: null }));
                                    }}
                                    style={{ ...styles.toggleBtn, background: changePassword ? "#25343F" : "#F1F5F9", color: changePassword ? "#fff" : "#64748B" }}
                                >
                                    {changePassword ? "Cancel" : "Change Password"}
                                </button>
                            </div>

                            {changePassword ? (
                                <div style={styles.formGrid}>
                                    <InputField
                                        label="New Password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        icon={Icons.Lock}
                                        error={fieldErrors.password}
                                        rightElement={
                                            <span onClick={() => setShowPassword(p => !p)} style={{ cursor: "pointer", color: "#94A3B8" }}>
                                                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                                            </span>
                                        }
                                    />
                                    <InputField
                                        label="Confirm Password"
                                        name="confirm_password"
                                        value={form.confirm_password}
                                        onChange={handleChange}
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Re-enter new password"
                                        icon={Icons.Lock}
                                        error={fieldErrors.confirm_password}
                                        rightElement={
                                            <span onClick={() => setShowConfirmPassword(p => !p)} style={{ cursor: "pointer", color: "#94A3B8" }}>
                                                {showConfirmPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                                            </span>
                                        }
                                    />
                                </div>
                            ) : (
                                <div style={styles.passwordPlaceholder}>
                                    <div style={styles.passwordDots}>
                                        {[...Array(10)].map((_, i) => (
                                            <span key={i} style={styles.dot} />
                                        ))}
                                    </div>
                                    <span style={styles.passwordHint}>Password is hidden. Click "Change Password" to update.</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={styles.actionRow}>
                            <button
                                type="button"
                                className="uu-cancel"
                                onClick={() => navigate(-1)}
                                style={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="uu-submit"
                                disabled={isSubmitting}
                                style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.75 : 1 }}
                            >
                                <Icons.Save />
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </BaseLayout>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
    toast: { position: "fixed", top: "85px", right: "20px", color: "#fff", padding: "12px 20px", borderRadius: "9px", zIndex: 9999, fontWeight: "700", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" },

    loadingWrap: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "300px", gap: "16px" },
    spinnerRing: { width: "42px", height: "42px", border: "4px solid #EAEFEF", borderTop: "4px solid #FF9B51", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    loadingText: { color: "#25343F", fontWeight: "600", fontSize: 14 },

    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
    backBtn: { display: "flex", alignItems: "center", gap: "8px", background: "#25343F", color: "#fff", border: "none", padding: "9px 18px", borderRadius: "9px", fontWeight: "700", cursor: "pointer", fontSize: 13 },
    pageTitle: { fontSize: "22px", color: "#25343F", fontWeight: "800", margin: 0 },

    pageLayout: { display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" },

    avatarCard: { background: "#fff", borderRadius: "16px", padding: "28px 24px", border: "1px solid #EAEFEF", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", width: "240px", flexShrink: 0, textAlign: "center" },
    avatarRing: { padding: "3px", background: "linear-gradient(135deg, #FF9B51, #25343F)", borderRadius: "50%", display: "inline-block", marginBottom: "14px" },
    avatar: { width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", display: "block" },
    avatarFallback: { width: "90px", height: "90px", borderRadius: "50%", background: "#25343F", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "800" },
    avatarName: { fontSize: "16px", fontWeight: "800", color: "#25343F", marginBottom: "4px" },
    avatarEmail: { fontSize: "12px", color: "#64748B", marginBottom: "12px", wordBreak: "break-all" },
    roleBadge: { background: "#25343F", color: "#fff", padding: "4px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" },
    avatarDivider: { height: "1px", background: "#EAEFEF", margin: "20px 0" },
    avatarInfoList: { display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" },
    avatarInfoItem: { display: "flex", alignItems: "center", gap: "10px" },
    avatarInfoIcon: { width: "32px", height: "32px", borderRadius: "8px", background: "#F8FAFC", border: "1px solid #EAEFEF", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", flexShrink: 0 },
    avatarInfoLabel: { fontSize: "10px", color: "#94A3B8", fontWeight: "600", textTransform: "uppercase" },
    avatarInfoValue: { fontSize: "13px", color: "#25343F", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "140px" },

    formCard: { background: "#fff", borderRadius: "14px", border: "1px solid #EAEFEF", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
    cardHeader: { display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", background: "#FAFBFC", borderBottom: "1px solid #EAEFEF" },
    cardHeaderIcon: { width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    cardHeaderTitle: { fontSize: "15px", fontWeight: "800", color: "#25343F" },
    cardHeaderSub: { fontSize: "12px", color: "#94A3B8", marginTop: "2px" },

    formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", padding: "20px" },

    toggleBtn: { padding: "7px 14px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 },
    passwordPlaceholder: { display: "flex", alignItems: "center", gap: "14px", padding: "20px", background: "#FAFBFC" },
    passwordDots: { display: "flex", gap: "5px" },
    dot: { width: "8px", height: "8px", borderRadius: "50%", background: "#CBD5E1", display: "inline-block" },
    passwordHint: { fontSize: "13px", color: "#94A3B8", fontStyle: "italic" },

    actionRow: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" },
    cancelBtn: { background: "#F1F5F9", color: "#25343F", border: "none", padding: "12px 28px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" },
    submitBtn: { display: "flex", alignItems: "center", gap: "8px", background: "#FF9B51", color: "#fff", border: "none", padding: "12px 32px", borderRadius: "10px", fontSize: "14px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(255,155,81,0.3)", transition: "all 0.2s" },
};

export default UpdateUser;








// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/SubAdminLayout";

// // ─── SVG Icons ────────────────────────────────────────────────────────────────
// const Icons = {
//     Back: () => (
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M19 12H5M12 5l-7 7 7 7" />
//         </svg>
//     ),
//     User: () => (
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
//         </svg>
//     ),

//     Phone: () => (
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
//         </svg>
//     ),

//     Mail: () => (
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
//         </svg>
//     ),
//     Lock: () => (
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
//         </svg>
//     ),
//     Eye: () => (
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
//         </svg>
//     ),
//     EyeOff: () => (
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
//         </svg>
//     ),
//     Save: () => (
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
//         </svg>
//     ),
//     Shield: () => (
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
//         </svg>
//     ),
//     Check: () => (
//         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
//             <polyline points="20 6 9 17 4 12" />
//         </svg>
//     ),
//     AlertCircle: () => (
//         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
//         </svg>
//     ),
//     Camera: () => (
//         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
//         </svg>
//     ),
// };

// // ─── Input Field Component ────────────────────────────────────────────────────
// function InputField({ label, name, value, onChange, type = "text", placeholder, disabled = false, icon: Icon, error, rightElement }) {
//     return (
//         <div style={fieldStyles.wrap}>
//             <label style={fieldStyles.label}>{label}</label>
//             <div style={{ ...fieldStyles.inputWrap, borderColor: error ? "#EF4444" : "#CBD5E1" }}>
//                 {Icon && (
//                     <span style={fieldStyles.iconLeft}>
//                         <Icon />
//                     </span>
//                 )}
//                 <input
//                     type={type}
//                     name={name}
//                     value={value}
//                     onChange={onChange}
//                     placeholder={placeholder}
//                     disabled={disabled}
//                     style={{ ...fieldStyles.input, paddingLeft: Icon ? "40px" : "14px", paddingRight: rightElement ? "44px" : "14px", background: disabled ? "#F8FAFC" : "#fff", color: disabled ? "#94A3B8" : "#25343F", cursor: disabled ? "not-allowed" : "text" }}
//                 />
//                 {rightElement && <span style={fieldStyles.iconRight}>{rightElement}</span>}
//             </div>
//             {error && (
//                 <div style={fieldStyles.errorMsg}>
//                     <Icons.AlertCircle /> {error}
//                 </div>
//             )}
//         </div>
//     );
// }

// const fieldStyles = {
//     wrap: { display: "flex", flexDirection: "column", gap: "6px" },
//     label: { fontSize: "13px", fontWeight: "700", color: "#25343F" },
//     inputWrap: { position: "relative", display: "flex", alignItems: "center", border: "1px solid #CBD5E1", borderRadius: "9px", overflow: "hidden", transition: "border-color 0.2s" },
//     iconLeft: { position: "absolute", left: "12px", color: "#94A3B8", display: "flex", alignItems: "center", pointerEvents: "none" },
//     iconRight: { position: "absolute", right: "12px", display: "flex", alignItems: "center", cursor: "pointer", color: "#94A3B8" },
//     input: { width: "100%", padding: "11px 14px", border: "none", outline: "none", fontSize: "14px", fontFamily: "inherit" },
//     errorMsg: { display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#EF4444", fontWeight: "600" },
// };

// // ─── Main Component ────────────────────────────────────────────────────────────
// function UpdateUser() {
//     const navigate = useNavigate();
//     const { id } = useParams();

//     const [isFetching, setIsFetching] = useState(true);
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });
//     const [changePassword, setChangePassword] = useState(false);
//     const [showPassword, setShowPassword] = useState(false);
//     const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//     const [fieldErrors, setFieldErrors] = useState({});

//     const [form, setForm] = useState({
//         first_name: "",
//         last_name: "",
//         email: "",
//         number: "",
//         password: "",
//         confirm_password: "",
//     });

//     const [originalData, setOriginalData] = useState(null);

//     const getAuthHeaders = () => {
//         const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//         return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
//     };

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3500);
//     };

//     // ── Fetch existing user data ──
//     useEffect(() => {
//         const fetchUser = async () => {
//             setIsFetching(true);
//             try {
//                 const res = await apiRequest(`/sub-admin/api/users${id}/`, "GET", null, getAuthHeaders());
//                 if (res.success) {
//                     const d = res.data;
//                     setOriginalData(d);
//                     setForm({
//                         first_name: d.first_name || "",
//                         last_name: d.last_name || "",
//                         email: d.email || "",
//                         number: d.number || "",
//                         password: "",
//                         confirm_password: "",
//                     });
//                 } else {
//                     notify("Failed to load user data", "error");
//                 }
//             } catch (err) {
//                 notify("Error fetching user details", "error");
//             } finally {
//                 setIsFetching(false);
//             }
//         };
//         fetchUser();
//     }, [id]);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setForm(prev => ({ ...prev, [name]: value }));
//         // Clear field error on change
//         if (fieldErrors[name]) {
//             setFieldErrors(prev => ({ ...prev, [name]: null }));
//         }
//     };

//     // ── Submit ──
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (isSubmitting) return;

//         // Client-side password validation
//         if (changePassword) {
//             if (!form.password) {
//                 setFieldErrors(prev => ({ ...prev, password: "Password is required" }));
//                 return;
//             }
//             if (form.password !== form.confirm_password) {
//                 setFieldErrors(prev => ({ ...prev, confirm_password: "Passwords do not match" }));
//                 return;
//             }
//             if (form.password.length < 6) {
//                 setFieldErrors(prev => ({ ...prev, password: "Password must be at least 6 characters" }));
//                 return;
//             }
//         }

//         setIsSubmitting(true);
//         setFieldErrors({});

//         const payload = {
//             first_name: form.first_name,
//             last_name: form.last_name,
//             number: form.number,
//         };

//         if (changePassword && form.password) {
//             payload.password = form.password;
//             payload.confirm_password = form.confirm_password;
//         }

//         try {
//             const res = await apiRequest(
//                 `/sub-admin/api/users/${id}/`,
//                 "PATCH",
//                 payload,
//                 getAuthHeaders()
//             );

//             if (res.success) {
//                 notify(res.message || "User updated successfully!");
//                 setTimeout(() => navigate(-1), 1500);
//             } else {
//                 // Handle server validation errors
//                 if (res.errors) setFieldErrors(res.errors);
//                 notify(res.message || "Update failed", "error");
//             }
//         } catch (err) {
//             if (err?.errors) setFieldErrors(err.errors);
//             notify("Error updating user", "error");
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     // ── Loading ──
//     if (isFetching) {
//         return (
//             <BaseLayout>
//                 <div style={styles.loadingWrap}>
//                     <div style={styles.spinnerRing} />
//                     <p style={styles.loadingText}>Loading user data...</p>
//                 </div>
//             </BaseLayout>
//         );
//     }

//     const baseUrl = "http://localhost:8000";
//     const avatarSrc = originalData?.profile_picture
//         ? `${baseUrl}${originalData.profile_picture}`
//         : null;

//     return (
//         <BaseLayout>
//             <style>{`
//                 @keyframes spin { to { transform: rotate(360deg); } }
//                 @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
//                 .uu-card { animation: fadeSlideIn 0.35s ease both; }
//                 .uu-input-wrap:focus-within { border-color: #FF9B51 !important; box-shadow: 0 0 0 3px rgba(255,155,81,0.12); }
//                 .uu-toggle:hover { background: #f1f5f9; }
//                 .uu-submit:hover:not(:disabled) { background: #f08040 !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,155,81,0.35) !important; }
//                 .uu-cancel:hover { background: #e2e8f0 !important; }
//             `}</style>

//             {toast.show && (
//                 <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60" }}>
//                     {toast.type === "error" ? <Icons.AlertCircle /> : <Icons.Check />}
//                     {toast.msg}
//                 </div>
//             )}

//             {/* ── Header ── */}
//             <div style={styles.headerRow}>
//                 <button onClick={() => navigate(-1)} style={styles.backBtn}>
//                     <Icons.Back /> Back
//                 </button>
//                 <h2 style={styles.pageTitle}>Update User</h2>
//                 <div style={{ width: "90px" }} />
//             </div>

//             <div style={styles.pageLayout}>

//                 {/* ── Left: Avatar Card ── */}
//                 <div className="uu-card" style={styles.avatarCard}>
//                     <div style={styles.avatarRing}>
//                         {avatarSrc ? (
//                             <img src={avatarSrc} alt="avatar" style={styles.avatar} />
//                         ) : (
//                             <div style={styles.avatarFallback}>
//                                 {form.first_name?.[0]?.toUpperCase()}{form.last_name?.[0]?.toUpperCase() || ""}
//                             </div>
//                         )}
//                     </div>
//                     <div style={styles.avatarName}>{form.first_name} {form.last_name}</div>
//                     <div style={styles.avatarEmail}>{form.email}</div>
//                     <span style={styles.roleBadge}>{originalData?.role || "EMPLOYEE"}</span>

//                     <div style={styles.avatarDivider} />

//                     {/* Info Summary */}
//                     <div style={styles.avatarInfoList}>
//                         <div style={styles.avatarInfoItem}>
//                             <span style={styles.avatarInfoIcon}><Icons.User /></span>
//                             <div>
//                                 <div style={styles.avatarInfoLabel}>Full Name</div>
//                                 <div style={styles.avatarInfoValue}>{form.first_name} {form.last_name}</div>
//                             </div>
//                         </div>
//                         <div style={styles.avatarInfoItem}>
//                             <span style={styles.avatarInfoIcon}><Icons.Phone /></span>
//                             <div>
//                                 <div style={styles.avatarInfoLabel}>Phone</div>
//                                 <div style={styles.avatarInfoValue}>{form.number || "N/A"}</div>
//                             </div>
//                         </div>
//                         <div style={styles.avatarInfoItem}>
//                             <span style={styles.avatarInfoIcon}><Icons.Mail /></span>
//                             <div>
//                                 <div style={styles.avatarInfoLabel}>Email</div>
//                                 <div style={styles.avatarInfoValue} title={form.email}>{form.email}</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* ── Right: Form ── */}
//                 <div style={{ flex: 1, minWidth: 0 }}>
//                     <form onSubmit={handleSubmit}>

//                         {/* Basic Info Card */}
//                         <div className="uu-card" style={styles.formCard}>
//                             <div style={styles.cardHeader}>
//                                 <div style={{ ...styles.cardHeaderIcon, background: "#E0F2FE", color: "#0369A1" }}>
//                                     <Icons.User />
//                                 </div>
//                                 <div>
//                                     <div style={styles.cardHeaderTitle}>Basic Information</div>
//                                     <div style={styles.cardHeaderSub}>Update name and contact details</div>
//                                 </div>
//                             </div>

//                             <div style={styles.formGrid}>
//                                 <InputField
//                                     label="First Name"
//                                     name="first_name"
//                                     value={form.first_name}
//                                     onChange={handleChange}
//                                     placeholder="e.g. Rahul"
//                                     icon={Icons.User}
//                                     error={fieldErrors.first_name}
//                                 />
//                                 <InputField
//                                     label="Last Name"
//                                     name="last_name"
//                                     value={form.last_name}
//                                     onChange={handleChange}
//                                     placeholder="e.g. Sharma"
//                                     icon={Icons.User}
//                                     error={fieldErrors.last_name}
//                                 />
//                                 <InputField
//                                     label="Phone Number"
//                                     name="number"
//                                     value={form.number}
//                                     onChange={handleChange}
//                                     placeholder="9876543210"
//                                     icon={Icons.Phone}
//                                     error={fieldErrors.number}
//                                 />
//                                 <InputField
//                                     label="Email Address"
//                                     name="email"
//                                     value={form.email}
//                                     onChange={handleChange}
//                                     placeholder="user@example.com"
//                                     icon={Icons.Mail}
//                                     disabled={true}
//                                     error={fieldErrors.email}
//                                 />
//                             </div>
//                         </div>

//                         {/* Password Card */}
//                         <div className="uu-card" style={{ ...styles.formCard, marginTop: "16px" }}>
//                             <div style={styles.cardHeader}>
//                                 <div style={{ ...styles.cardHeaderIcon, background: "#FFF7ED", color: "#C2410C" }}>
//                                     <Icons.Shield />
//                                 </div>
//                                 <div style={{ flex: 1 }}>
//                                     <div style={styles.cardHeaderTitle}>Password</div>
//                                     <div style={styles.cardHeaderSub}>Leave unchanged to keep current password</div>
//                                 </div>
//                                 {/* Toggle */}
//                                 <button
//                                     type="button"
//                                     className="uu-toggle"
//                                     onClick={() => {
//                                         setChangePassword(p => !p);
//                                         setForm(prev => ({ ...prev, password: "", confirm_password: "" }));
//                                         setFieldErrors(prev => ({ ...prev, password: null, confirm_password: null }));
//                                     }}
//                                     style={{ ...styles.toggleBtn, background: changePassword ? "#25343F" : "#F1F5F9", color: changePassword ? "#fff" : "#64748B" }}
//                                 >
//                                     {changePassword ? "Cancel" : "Change Password"}
//                                 </button>
//                             </div>

//                             {changePassword ? (
//                                 <div style={styles.formGrid}>
//                                     <InputField
//                                         label="New Password"
//                                         name="password"
//                                         value={form.password}
//                                         onChange={handleChange}
//                                         type={showPassword ? "text" : "password"}
//                                         placeholder="Min. 6 characters"
//                                         icon={Icons.Lock}
//                                         error={fieldErrors.password}
//                                         rightElement={
//                                             <span onClick={() => setShowPassword(p => !p)} style={{ cursor: "pointer", color: "#94A3B8" }}>
//                                                 {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
//                                             </span>
//                                         }
//                                     />
//                                     <InputField
//                                         label="Confirm Password"
//                                         name="confirm_password"
//                                         value={form.confirm_password}
//                                         onChange={handleChange}
//                                         type={showConfirmPassword ? "text" : "password"}
//                                         placeholder="Re-enter new password"
//                                         icon={Icons.Lock}
//                                         error={fieldErrors.confirm_password}
//                                         rightElement={
//                                             <span onClick={() => setShowConfirmPassword(p => !p)} style={{ cursor: "pointer", color: "#94A3B8" }}>
//                                                 {showConfirmPassword ? <Icons.EyeOff /> : <Icons.Eye />}
//                                             </span>
//                                         }
//                                     />
//                                 </div>
//                             ) : (
//                                 <div style={styles.passwordPlaceholder}>
//                                     <div style={styles.passwordDots}>
//                                         {[...Array(10)].map((_, i) => (
//                                             <span key={i} style={styles.dot} />
//                                         ))}
//                                     </div>
//                                     <span style={styles.passwordHint}>Password is hidden. Click "Change Password" to update.</span>
//                                 </div>
//                             )}
//                         </div>

//                         {/* Actions */}
//                         <div style={styles.actionRow}>
//                             <button
//                                 type="button"
//                                 className="uu-cancel"
//                                 onClick={() => navigate(-1)}
//                                 style={styles.cancelBtn}
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 type="submit"
//                                 className="uu-submit"
//                                 disabled={isSubmitting}
//                                 style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.75 : 1 }}
//                             >
//                                 <Icons.Save />
//                                 {isSubmitting ? "Saving..." : "Save Changes"}
//                             </button>
//                         </div>

//                     </form>
//                 </div>
//             </div>
//         </BaseLayout>
//     );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = {
//     toast: { position: "fixed", top: "85px", right: "20px", color: "#fff", padding: "12px 20px", borderRadius: "9px", zIndex: 9999, fontWeight: "700", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" },

//     loadingWrap: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "300px", gap: "16px" },
//     spinnerRing: { width: "42px", height: "42px", border: "4px solid #EAEFEF", borderTop: "4px solid #FF9B51", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
//     loadingText: { color: "#25343F", fontWeight: "600", fontSize: 14 },

//     headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
//     backBtn: { display: "flex", alignItems: "center", gap: "8px", background: "#25343F", color: "#fff", border: "none", padding: "9px 18px", borderRadius: "9px", fontWeight: "700", cursor: "pointer", fontSize: 13 },
//     pageTitle: { fontSize: "22px", color: "#25343F", fontWeight: "800", margin: 0 },

//     pageLayout: { display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" },

//     // Avatar Card
//     avatarCard: { background: "#fff", borderRadius: "16px", padding: "28px 24px", border: "1px solid #EAEFEF", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", width: "240px", flexShrink: 0, textAlign: "center" },
//     avatarRing: { padding: "3px", background: "linear-gradient(135deg, #FF9B51, #25343F)", borderRadius: "50%", display: "inline-block", marginBottom: "14px" },
//     avatar: { width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", display: "block" },
//     avatarFallback: { width: "90px", height: "90px", borderRadius: "50%", background: "#25343F", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "800" },
//     avatarName: { fontSize: "16px", fontWeight: "800", color: "#25343F", marginBottom: "4px" },
//     avatarEmail: { fontSize: "12px", color: "#64748B", marginBottom: "12px", wordBreak: "break-all" },
//     roleBadge: { background: "#25343F", color: "#fff", padding: "4px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" },
//     avatarDivider: { height: "1px", background: "#EAEFEF", margin: "20px 0" },
//     avatarInfoList: { display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" },
//     avatarInfoItem: { display: "flex", alignItems: "center", gap: "10px" },
//     avatarInfoIcon: { width: "32px", height: "32px", borderRadius: "8px", background: "#F8FAFC", border: "1px solid #EAEFEF", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", flexShrink: 0 },
//     avatarInfoLabel: { fontSize: "10px", color: "#94A3B8", fontWeight: "600", textTransform: "uppercase" },
//     avatarInfoValue: { fontSize: "13px", color: "#25343F", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "140px" },

//     // Form Card
//     formCard: { background: "#fff", borderRadius: "14px", border: "1px solid #EAEFEF", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
//     cardHeader: { display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", background: "#FAFBFC", borderBottom: "1px solid #EAEFEF" },
//     cardHeaderIcon: { width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
//     cardHeaderTitle: { fontSize: "15px", fontWeight: "800", color: "#25343F" },
//     cardHeaderSub: { fontSize: "12px", color: "#94A3B8", marginTop: "2px" },

//     formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", padding: "20px" },

//     // Password section
//     toggleBtn: { padding: "7px 14px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 },
//     passwordPlaceholder: { display: "flex", alignItems: "center", gap: "14px", padding: "20px", background: "#FAFBFC" },
//     passwordDots: { display: "flex", gap: "5px" },
//     dot: { width: "8px", height: "8px", borderRadius: "50%", background: "#CBD5E1", display: "inline-block" },
//     passwordHint: { fontSize: "13px", color: "#94A3B8", fontStyle: "italic" },

//     // Actions
//     actionRow: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" },
//     cancelBtn: { background: "#F1F5F9", color: "#25343F", border: "none", padding: "12px 28px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" },
//     submitBtn: { display: "flex", alignItems: "center", gap: "8px", background: "#FF9B51", color: "#fff", border: "none", padding: "12px 32px", borderRadius: "10px", fontSize: "14px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(255,155,81,0.3)", transition: "all 0.2s" },
// };

// export default UpdateUser;
