import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest,API_BASE } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
    Back: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
    ),
    Phone: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
        </svg>
    ),
    Calendar: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    Clock: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    Trophy: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 21 12 21 16 21" /><line x1="12" y1="17" x2="12" y2="21" />
            <path d="M7 4H17l-1 7a5 5 0 01-8 0L7 4z" /><path d="M7 4C5 4 3 5 3 8s2 4 4 5M17 4c2 0 4 1 4 4s-2 4-4 5" />
        </svg>
    ),
    Flame: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
        </svg>
    ),
    AlertTriangle: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    FileText: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
    CheckCircle: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    Building: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="9" y1="22" x2="9" y2="12" /><line x1="15" y1="22" x2="15" y2="12" /><line x1="9" y1="7" x2="9.01" y2="7" /><line x1="15" y1="7" x2="15.01" y2="7" />
        </svg>
    ),
    Users: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
    ),
    Briefcase: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
        </svg>
    ),
    Upload: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
        </svg>
    ),
    Pipeline: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    Target: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        </svg>
    ),
    Pin: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z" />
        </svg>
    ),
    Send: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    ),
    TrendingUp: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
    ),
    TrendingDown: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
        </svg>
    ),
    Mail: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
        </svg>
    ),
    CheckIn: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
        </svg>
    ),
    CheckOut: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    Report: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="12" y2="17" />
        </svg>
    ),
    Sourced: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
        </svg>
    ),
    Submitted: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Star: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ),
};

// ─── Main Component ────────────────────────────────────────────────────────────
function UserDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    const getAuthHeaders = () => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    };

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            try {
                const res = await apiRequest(`/attendance/admin/users/${id}/`, "GET", null, getAuthHeaders());
                if (res.success) setData(res.data);
                else notify("Failed to load user data", "error");
            } catch (err) {
                notify("Error fetching user details", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

    if (loading) {
        return (
            <BaseLayout>
                <div style={styles.loadingWrap}>
                    <div style={styles.spinnerRing} />
                    <p style={styles.loadingText}>Loading employee details...</p>
                </div>
            </BaseLayout>
        );
    }

    if (!data) {
        return (
            <BaseLayout>
                <div style={styles.loadingWrap}>
                    <p style={{ color: "#E74C3C", fontWeight: "700" }}>Failed to load data.</p>
                </div>
            </BaseLayout>
        );
    }

    const { user, today, monthly_performance, overall_stats, leaves, points } = data;

    const getColorCodeStyle = (code) => {
        if (code === "GREEN") return { bg: "#dcfce7", color: "#166534", bar: "#22c55e" };
        if (code === "YELLOW") return { bg: "#fef9c3", color: "#854d0e", bar: "#eab308" };
        return { bg: "#fee2e2", color: "#991b1b", bar: "#ef4444" };
    };
    const perfColor = getColorCodeStyle(today.performance.color_code);

    const getAttendanceStatusStyle = (status) => {
        if (status === "ON_TIME") return { bg: "#dcfce7", color: "#166534", label: "On Time" };
        if (status === "LATE") return { bg: "#fef9c3", color: "#854d0e", label: "Late" };
        if (!status) return { bg: "#F1F5F9", color: "#64748B", label: "N/A" };
        return { bg: "#fee2e2", color: "#991b1b", label: status?.replace("_", " ") || "N/A" };
    };
    const attStyle = getAttendanceStatusStyle(today.attendance.status);

    const overallItems = [
        { label: "Vendors Created",       value: overall_stats.total_vendors_created,     Icon: Icons.Building,   bg: "#E0F2FE", color: "#0369A1" },
        { label: "Clients Created",        value: overall_stats.total_clients_created,      Icon: Icons.Users,      bg: "#F0FDF4", color: "#166534" },
        { label: "Candidates Created",     value: overall_stats.total_candidates_created,   Icon: Icons.Briefcase,  bg: "#FFF7ED", color: "#C2410C" },
        { label: "Candidates Submitted",   value: overall_stats.total_candidates_submitted, Icon: Icons.Upload,     bg: "#FDF4FF", color: "#7E22CE" },
        { label: "In Pipeline",            value: overall_stats.candidates_in_pipeline,     Icon: Icons.Pipeline,   bg: "#FFFBEB", color: "#92400E" },
        { label: "Interviews Today",       value: overall_stats.interviews_today,           Icon: Icons.Target,     bg: "#FFF1F2", color: "#BE123C" },
        { label: "Assigned Requirements",  value: overall_stats.assigned_requirements,      Icon: Icons.Pin,        bg: "#F0F9FF", color: "#075985" },
        { label: "Submitted JDs",          value: overall_stats.submitted_jds,             Icon: Icons.Send,       bg: "#F7FEE7", color: "#3F6212" },
    ];

    const pointsItems = [
        { label: "Total Points",       value: points.total_points,         Icon: Icons.Trophy,        bg: "#FFF7ED", color: "#C2410C" },
        { label: "Points This Month",  value: points.points_this_month,    Icon: points.points_this_month >= 0 ? Icons.TrendingUp : Icons.TrendingDown, bg: points.points_this_month >= 0 ? "#F0FDF4" : "#FFF1F2", color: points.points_this_month >= 0 ? "#166534" : "#BE123C" },
        { label: "Attendance Streak",  value: `${points.attendance_streak}d`, Icon: Icons.Flame,      bg: "#FFF7ED", color: "#EA580C" },
        { label: "Late Warnings",      value: points.late_warning_count,   Icon: Icons.AlertTriangle, bg: "#FFFBEB", color: "#92400E" },
        { label: "Leaves Pending",     value: leaves.pending,              Icon: Icons.FileText,      bg: "#F8FAFC", color: "#475569" },
        { label: "Leaves Approved",    value: leaves.approved,             Icon: Icons.CheckCircle,   bg: "#F0FDF4", color: "#166534" },
    ];

    return (
        <BaseLayout>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .ud-card { animation: fadeSlideIn 0.35s ease both; }
                .ud-stat:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; transition: all 0.2s ease; }
                .ud-overall:hover { transform: translateY(-2px); transition: all 0.2s ease; }
            `}</style>

            {toast.show && (
                <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60" }}>
                    {toast.msg}
                </div>
            )}

            {/* ── Header ── */}
            <div style={styles.headerRow}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>
                    <Icons.Back /> Back
                </button>
                <h2 style={styles.pageTitle}>Employee Detail</h2>
                <div style={{ width: "90px" }} />
            </div>

            {/* ── Profile Card ── */}
            <div className="ud-card" style={styles.profileCard}>
                <div style={styles.profileLeft}>
                    <div style={styles.avatarRing}>
                        {/* {user.profile_picture ? (
                            <img src={user.profile_picture} alt="avatar" style={styles.avatar} /> */}
                        {user.profile_picture ? (
                            <img src={`${API_BASE}${user.profile_picture}`} alt="avatar" style={styles.avatar} />

                        ) : (
                            <div style={styles.avatarFallback}>
                                {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <div style={styles.profileName}>{user.full_name}</div>
                        <div style={styles.profileEmailRow}>
                            <Icons.Mail />
                            <span style={styles.profileEmail}>{user.email}</span>
                        </div>
                        <div style={styles.badgeRow}>
                            <span style={styles.roleBadge}>{user.role}</span>
                            <span style={user.is_active ? styles.activeBadge : styles.inactiveBadge}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: user.is_active ? "#22c55e" : "#ef4444", display: "inline-block", marginRight: 5 }} />
                                {user.is_active ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={styles.profileDivider} />

                <div style={styles.profileMeta}>
                    {[
                        { Icon: Icons.Phone,    label: "Phone",           value: user.number || "N/A" },
                        { Icon: Icons.Calendar, label: "Date Joined",     value: new Date(user.date_joined).toLocaleDateString("en-GB") },
                        { Icon: Icons.Clock,    label: "Last Attendance", value: user.last_attendance_date || "N/A" },
                    ].map(({ Icon, label, value }, i) => (
                        <div key={i} style={styles.metaItem}>
                            <div style={styles.metaIconWrap}><Icon /></div>
                            <div>
                                <div style={styles.metaLabel}>{label}</div>
                                <div style={styles.metaValue}>{value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Points & Leaves ── */}
            <div style={styles.sectionTitle}><span style={styles.sectionBar} />Points & Leaves</div>
            <div style={styles.statsGrid}>
                {pointsItems.map(({ label, value, Icon, bg, color }, i) => (
                    <div key={i} className="ud-stat" style={{ ...styles.statCard, background: bg, border: `1px solid ${color}22` }}>
                        <div style={{ ...styles.statIconWrap, background: `${color}18`, color }}>
                            <Icon />
                        </div>
                        <div style={{ ...styles.statValue, color }}>{value}</div>
                        <div style={styles.statLabel}>{label}</div>
                    </div>
                ))}
            </div>

            {/* ── Today's Overview ── */}
            <div style={styles.sectionTitle}><span style={styles.sectionBar} />Today's Overview</div>
            <div style={styles.todayGrid}>

                {/* Attendance Card */}
                <div className="ud-card" style={styles.card}>
                    <div style={styles.cardHeader}>
                        <div style={{ ...styles.cardHeaderIcon, background: "#E0F2FE", color: "#0369A1" }}><Icons.Clock /></div>
                        <span style={styles.cardHeaderText}>Attendance</span>
                        <span style={{ ...styles.chip, background: attStyle.bg, color: attStyle.color }}>{attStyle.label}</span>
                    </div>
                    <div style={styles.cardBody}>
                        <div style={styles.checkRow}>
                            <div style={styles.checkItem}>
                                <div style={{ ...styles.checkIconWrap, background: today.attendance.checked_in ? "#dcfce7" : "#F1F5F9", color: today.attendance.checked_in ? "#166534" : "#94A3B8" }}>
                                    <Icons.CheckIn />
                                </div>
                                <div style={styles.checkLabel}>Check In</div>
                                <div style={styles.checkTime}>{today.attendance.checked_in ? today.attendance.check_in_time : "—"}</div>
                                <span style={today.attendance.checked_in ? styles.doneBadge : styles.pendingBadge}>
                                    {today.attendance.checked_in ? "Done" : "Pending"}
                                </span>
                            </div>
                            <div style={styles.checkDivider} />
                            <div style={styles.checkItem}>
                                <div style={{ ...styles.checkIconWrap, background: today.attendance.checked_out ? "#dcfce7" : "#F1F5F9", color: today.attendance.checked_out ? "#166534" : "#94A3B8" }}>
                                    <Icons.CheckOut />
                                </div>
                                <div style={styles.checkLabel}>Check Out</div>
                                <div style={styles.checkTime}>{today.attendance.checked_out ? today.attendance.check_out_time : "—"}</div>
                                <span style={today.attendance.checked_out ? styles.doneBadge : styles.pendingBadge}>
                                    {today.attendance.checked_out ? "Done" : "Pending"}
                                </span>
                            </div>
                        </div>
                        <div style={{ ...styles.reportRow, background: today.report_submitted ? "#dcfce7" : "#FFF7ED", border: `1px solid ${today.report_submitted ? "#bbf7d0" : "#fed7aa"}` }}>
                            <span style={{ color: today.report_submitted ? "#166534" : "#C2410C", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13 }}>
                                <Icons.Report />
                                {today.report_submitted ? "Daily Report Submitted" : "Daily Report Not Submitted"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Performance Card */}
                <div className="ud-card" style={styles.card}>
                    <div style={styles.cardHeader}>
                        <div style={{ ...styles.cardHeaderIcon, background: "#FFF7ED", color: "#C2410C" }}><Icons.TrendingUp /></div>
                        <span style={styles.cardHeaderText}>Today's Performance</span>
                        <span style={{ ...styles.chip, background: perfColor.bg, color: perfColor.color }}>{today.performance.color_code}</span>
                    </div>
                    <div style={styles.cardBody}>
                        <div style={styles.perfBarSection}>
                            <div style={styles.perfBarTop}>
                                <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Performance Score</span>
                                <span style={{ fontSize: 18, fontWeight: 800, color: perfColor.color }}>{today.performance.performance_percentage}%</span>
                            </div>
                            <div style={styles.perfTrack}>
                                <div style={{ ...styles.perfFill, width: `${today.performance.performance_percentage}%`, background: perfColor.bar }} />
                            </div>
                        </div>
                        <div style={styles.perfStatsRow}>
                            <div style={styles.perfStatBox}>
                                <div style={{ ...styles.perfStatIcon, background: "#E0F2FE", color: "#0369A1" }}><Icons.Sourced /></div>
                                <div style={styles.perfStatNum}>{today.performance.sourced_today}</div>
                                <div style={styles.perfStatDesc}>Sourced Today</div>
                                <div style={styles.perfStatTarget}>Target: {today.target.target_sourcing}</div>
                            </div>
                            <div style={styles.perfStatDivider} />
                            <div style={styles.perfStatBox}>
                                <div style={{ ...styles.perfStatIcon, background: "#F0FDF4", color: "#166534" }}><Icons.Submitted /></div>
                                <div style={styles.perfStatNum}>{today.performance.submitted_today}</div>
                                <div style={styles.perfStatDesc}>Submitted Today</div>
                                <div style={styles.perfStatTarget}>Target: {today.target.target_submission}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Monthly Performance ── */}
            <div style={styles.sectionTitle}><span style={styles.sectionBar} />Monthly Performance</div>
            <div style={styles.monthlyGrid}>
                <div className="ud-card" style={{ ...styles.monthlyCard, background: "linear-gradient(135deg, #25343F 0%, #3a5068 100%)" }}>
                    <div style={{ ...styles.monthlyIconWrap, background: "rgba(255,255,255,0.12)", color: "#fff" }}><Icons.Sourced /></div>
                    <div style={{ ...styles.monthlyVal, color: "#fff" }}>{monthly_performance.total_sourced}</div>
                    <div style={{ ...styles.monthlyLbl, color: "rgba(255,255,255,0.7)" }}>Total Sourced</div>
                </div>
                <div className="ud-card" style={{ ...styles.monthlyCard, background: "linear-gradient(135deg, #FF9B51 0%, #f97316 100%)" }}>
                    <div style={{ ...styles.monthlyIconWrap, background: "rgba(255,255,255,0.2)", color: "#fff" }}><Icons.Submitted /></div>
                    <div style={{ ...styles.monthlyVal, color: "#fff" }}>{monthly_performance.total_submitted}</div>
                    <div style={{ ...styles.monthlyLbl, color: "rgba(255,255,255,0.8)" }}>Total Submitted</div>
                </div>
            </div>

            {/* ── Overall Statistics ── */}
            <div style={styles.sectionTitle}><span style={styles.sectionBar} />Overall Statistics</div>
            <div style={styles.overallGrid}>
                {overallItems.map(({ label, value, Icon, bg, color }, i) => (
                    <div key={i} className="ud-overall" style={{ ...styles.overallCard, background: bg, border: `1px solid ${color}22` }}>
                        <div style={{ ...styles.overallIconWrap, background: `${color}18`, color }}><Icon /></div>
                        <div style={{ ...styles.overallVal, color }}>{value}</div>
                        <div style={styles.overallLbl}>{label}</div>
                    </div>
                ))}
            </div>

        </BaseLayout>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
    toast: { position: "fixed", top: "85px", right: "20px", color: "#fff", padding: "12px 25px", borderRadius: "8px", zIndex: 9999, fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
    loadingWrap: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "300px", gap: "16px" },
    spinnerRing: { width: "42px", height: "42px", border: "4px solid #EAEFEF", borderTop: "4px solid #FF9B51", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    loadingText: { color: "#25343F", fontWeight: "600", fontSize: 14 },

    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
    backBtn: { display: "flex", alignItems: "center", gap: "8px", background: "#25343F", color: "#fff", border: "none", padding: "9px 18px", borderRadius: "9px", fontWeight: "700", cursor: "pointer", fontSize: 13 },
    pageTitle: { fontSize: "22px", color: "#25343F", fontWeight: "800", margin: 0 },

    sectionTitle: { display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px", marginTop: "28px" },
    sectionBar: { display: "inline-block", width: "4px", height: "16px", background: "#FF9B51", borderRadius: "2px", flexShrink: 0 },

    // Profile
    profileCard: { background: "#fff", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1px solid #EAEFEF", display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" },
    profileLeft: { display: "flex", alignItems: "center", gap: "18px", flex: "1", minWidth: "240px" },
    avatarRing: { flexShrink: 0, padding: "3px", background: "linear-gradient(135deg, #FF9B51, #25343F)", borderRadius: "50%" },
    avatar: { width: "76px", height: "76px", borderRadius: "50%", objectFit: "cover", display: "block" },
    avatarFallback: { width: "76px", height: "76px", borderRadius: "50%", background: "#25343F", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "800" },
    profileName: { fontSize: "20px", fontWeight: "800", color: "#25343F", marginBottom: "4px" },
    profileEmailRow: { display: "flex", alignItems: "center", gap: "6px", color: "#64748B", marginBottom: "10px" },
    profileEmail: { fontSize: "13px", color: "#64748B" },
    badgeRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
    roleBadge: { background: "#25343F", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" },
    activeBadge: { background: "#dcfce7", color: "#166534", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center" },
    inactiveBadge: { background: "#fee2e2", color: "#991b1b", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center" },
    profileDivider: { width: "1px", height: "80px", background: "#EAEFEF", flexShrink: 0 },
    profileMeta: { display: "flex", gap: "28px", flexWrap: "wrap" },
    metaItem: { display: "flex", alignItems: "center", gap: "12px" },
    metaIconWrap: { width: "36px", height: "36px", borderRadius: "9px", background: "#F8FAFC", border: "1px solid #EAEFEF", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", flexShrink: 0 },
    metaLabel: { fontSize: "11px", color: "#94A3B8", fontWeight: "600", textTransform: "uppercase", marginBottom: "2px" },
    metaValue: { fontSize: "14px", color: "#25343F", fontWeight: "700" },

    // Stats
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" },
    statCard: { borderRadius: "13px", padding: "18px 16px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", cursor: "default", transition: "all 0.2s ease" },
    statIconWrap: { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" },
    statValue: { fontSize: "24px", fontWeight: "800", marginBottom: "4px" },
    statLabel: { fontSize: "11px", color: "#64748B", fontWeight: "600" },

    // Today
    todayGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" },
    card: { background: "#fff", borderRadius: "14px", border: "1px solid #EAEFEF", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
    cardHeader: { display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "#FAFBFC", borderBottom: "1px solid #EAEFEF" },
    cardHeaderIcon: { width: "34px", height: "34px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    cardHeaderText: { flex: 1, fontWeight: "700", color: "#25343F", fontSize: "14px" },
    chip: { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" },
    cardBody: { padding: "20px" },

    checkRow: { display: "flex", alignItems: "center", marginBottom: "16px" },
    checkItem: { flex: 1, textAlign: "center" },
    checkIconWrap: { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" },
    checkLabel: { fontSize: "11px", color: "#94A3B8", fontWeight: "600", textTransform: "uppercase", marginBottom: "4px" },
    checkTime: { fontSize: "20px", fontWeight: "800", color: "#25343F", marginBottom: "6px" },
    doneBadge: { background: "#dcfce7", color: "#166534", fontSize: "11px", padding: "2px 10px", borderRadius: "10px", fontWeight: "700" },
    pendingBadge: { background: "#fee2e2", color: "#991b1b", fontSize: "11px", padding: "2px 10px", borderRadius: "10px", fontWeight: "700" },
    checkDivider: { width: "1px", height: "70px", background: "#EAEFEF" },
    reportRow: { display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 14px", borderRadius: "9px" },

    perfBarSection: { marginBottom: "20px" },
    perfBarTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
    perfTrack: { background: "#F1F5F9", borderRadius: "100px", height: "8px", overflow: "hidden" },
    perfFill: { height: "8px", borderRadius: "100px", transition: "width 0.5s ease" },
    perfStatsRow: { display: "flex", alignItems: "center" },
    perfStatBox: { flex: 1, textAlign: "center" },
    perfStatIcon: { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" },
    perfStatNum: { fontSize: "26px", fontWeight: "800", color: "#25343F" },
    perfStatDesc: { fontSize: "12px", color: "#64748B", fontWeight: "600" },
    perfStatTarget: { fontSize: "11px", color: "#FF9B51", fontWeight: "700", marginTop: "2px" },
    perfStatDivider: { width: "1px", height: "70px", background: "#EAEFEF" },

    // Monthly
    monthlyGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" },
    monthlyCard: { borderRadius: "14px", padding: "28px 24px", textAlign: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.1)" },
    monthlyIconWrap: { width: "52px", height: "52px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" },
    monthlyVal: { fontSize: "38px", fontWeight: "800", marginBottom: "6px" },
    monthlyLbl: { fontSize: "14px", fontWeight: "600" },

    // Overall
    overallGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "20px" },
    overallCard: { borderRadius: "13px", padding: "20px 16px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", cursor: "default", transition: "all 0.2s ease" },
    overallIconWrap: { width: "46px", height: "46px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" },
    overallVal: { fontSize: "28px", fontWeight: "800", marginBottom: "4px" },
    overallLbl: { fontSize: "12px", color: "#64748B", fontWeight: "600" },
};

export default UserDetail;





// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/SubAdminLayout";

// function UserDetail() {
//     const navigate = useNavigate();
//     const { id } = useParams();
//     const [data, setData] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     const getAuthHeaders = () => {
//         const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//         return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
//     };

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     useEffect(() => {
//         const fetchUser = async () => {
//             setLoading(true);
//             try {
//                 const res = await apiRequest(`/attendance/admin/users/${id}/`, "GET", null, getAuthHeaders());
//                 if (res.success) setData(res.data);
//                 else notify("Failed to load user data", "error");
//             } catch (err) {
//                 notify("Error fetching user details", "error");
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchUser();
//     }, [id]);

//     if (loading) {
//         return (
//             <BaseLayout>
//                 <div style={styles.loadingWrap}>
//                     <div style={styles.loadingSpinner}></div>
//                     <p style={styles.loadingText}>Loading employee details...</p>
//                 </div>
//             </BaseLayout>
//         );
//     }

//     if (!data) {
//         return (
//             <BaseLayout>
//                 <div style={styles.loadingWrap}>
//                     <p style={{ color: "#E74C3C", fontWeight: "700" }}>Failed to load data.</p>
//                 </div>
//             </BaseLayout>
//         );
//     }

//     const { user, today, monthly_performance, overall_stats, leaves, points } = data;

//     const getColorCodeStyle = (code) => {
//         if (code === "GREEN") return { bg: "#dcfce7", color: "#166534" };
//         if (code === "YELLOW") return { bg: "#fef9c3", color: "#854d0e" };
//         return { bg: "#fee2e2", color: "#991b1b" };
//     };

//     const perfColor = getColorCodeStyle(today.performance.color_code);

//     const getAttendanceStatusStyle = (status) => {
//         if (status === "ON_TIME") return { bg: "#dcfce7", color: "#166534" };
//         if (status === "LATE") return { bg: "#fef9c3", color: "#854d0e" };
//         if (!status) return { bg: "#F1F5F9", color: "#64748B" };
//         return { bg: "#fee2e2", color: "#991b1b" };
//     };

//     const attStyle = getAttendanceStatusStyle(today.attendance.status);

//     return (
//         <BaseLayout>
//             {toast.show && (
//                 <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60" }}>
//                     {toast.msg}
//                 </div>
//             )}

//             {/* Header */}
//             <div style={styles.headerRow}>
//                 <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                 <h2 style={styles.pageTitle}>Employee Detail</h2>
//                 <div style={{ width: "80px" }} />
//             </div>

//             {/* Profile Card */}
//             <div style={styles.profileCard}>
//                 <div style={styles.avatarWrap}>
//                     {user.profile_picture ? (
//                         <img src={user.profile_picture} alt="avatar" style={styles.avatar} />
//                     ) : (
//                         <div style={styles.avatarFallback}>
//                             {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
//                         </div>
//                     )}
//                 </div>
//                 <div style={styles.profileInfo}>
//                     <div style={styles.profileName}>{user.full_name}</div>
//                     <div style={styles.profileEmail}>{user.email}</div>
//                     <div style={styles.profileMeta}>
//                         <span style={styles.roleBadge}>{user.role}</span>
//                         <span style={user.is_active ? styles.activeBadge : styles.inactiveBadge}>
//                             {user.is_active ? "● Active" : "● Inactive"}
//                         </span>
//                     </div>
//                 </div>
//                 <div style={styles.profileRight}>
//                     <div style={styles.profileMetaItem}>
//                         <span style={styles.metaLabel}>Phone</span>
//                         <span style={styles.metaValue}>{user.number || "N/A"}</span>
//                     </div>
//                     <div style={styles.profileMetaItem}>
//                         <span style={styles.metaLabel}>Joined</span>
//                         <span style={styles.metaValue}>{new Date(user.date_joined).toLocaleDateString("en-GB")}</span>
//                     </div>
//                     <div style={styles.profileMetaItem}>
//                         <span style={styles.metaLabel}>Last Attendance</span>
//                         <span style={styles.metaValue}>{user.last_attendance_date || "N/A"}</span>
//                     </div>
//                 </div>
//             </div>

//             {/* Points & Streak Row */}
//             <div style={styles.statsRow}>
//                 {[
//                     { label: "Total Points", value: points.total_points, icon: "🏆" },
//                     { label: "Points This Month", value: points.points_this_month, icon: "📅" },
//                     { label: "Attendance Streak", value: `${points.attendance_streak} days`, icon: "🔥" },
//                     { label: "Late Warnings", value: points.late_warning_count, icon: "⚠️" },
//                     { label: "Leaves Pending", value: leaves.pending, icon: "📋" },
//                     { label: "Leaves Approved", value: leaves.approved, icon: "✅" },
//                 ].map((stat, i) => (
//                     <div key={i} style={styles.statCard}>
//                         <div style={styles.statIcon}>{stat.icon}</div>
//                         <div style={styles.statValue}>{stat.value}</div>
//                         <div style={styles.statLabel}>{stat.label}</div>
//                     </div>
//                 ))}
//             </div>

//             {/* Today Section */}
//             <div style={styles.sectionTitle}>Today's Overview</div>
//             <div style={styles.todayGrid}>

//                 {/* Attendance Card */}
//                 <div style={styles.card}>
//                     <div style={styles.cardHeader}>
//                         <span style={styles.cardHeaderIcon}>🕐</span>
//                         <span style={styles.cardHeaderText}>Attendance</span>
//                         <span style={{ ...styles.statusChip, background: attStyle.bg, color: attStyle.color }}>
//                             {today.attendance.status?.replace("_", " ") || "N/A"}
//                         </span>
//                     </div>
//                     <div style={styles.cardBody}>
//                         <div style={styles.attendanceRow}>
//                             <div style={styles.attendanceItem}>
//                                 <div style={styles.attLabel}>Check In</div>
//                                 <div style={styles.attValue}>
//                                     {today.attendance.checked_in ? today.attendance.check_in_time : "—"}
//                                 </div>
//                                 <div style={today.attendance.checked_in ? styles.attDone : styles.attPending}>
//                                     {today.attendance.checked_in ? "Done" : "Pending"}
//                                 </div>
//                             </div>
//                             <div style={styles.attDivider} />
//                             <div style={styles.attendanceItem}>
//                                 <div style={styles.attLabel}>Check Out</div>
//                                 <div style={styles.attValue}>
//                                     {today.attendance.checked_out ? today.attendance.check_out_time : "—"}
//                                 </div>
//                                 <div style={today.attendance.checked_out ? styles.attDone : styles.attPending}>
//                                     {today.attendance.checked_out ? "Done" : "Pending"}
//                                 </div>
//                             </div>
//                         </div>
//                         <div style={{ ...styles.reportChip, background: today.report_submitted ? "#dcfce7" : "#fee2e2", color: today.report_submitted ? "#166534" : "#991b1b" }}>
//                             {today.report_submitted ? "✓ Report Submitted" : "✗ Report Not Submitted"}
//                         </div>
//                     </div>
//                 </div>

//                 {/* Performance Card */}
//                 <div style={styles.card}>
//                     <div style={styles.cardHeader}>
//                         <span style={styles.cardHeaderIcon}>📊</span>
//                         <span style={styles.cardHeaderText}>Today's Performance</span>
//                         <span style={{ ...styles.statusChip, background: perfColor.bg, color: perfColor.color }}>
//                             {today.performance.color_code}
//                         </span>
//                     </div>
//                     <div style={styles.cardBody}>
//                         <div style={styles.perfBarWrap}>
//                             <div style={styles.perfBarLabel}>
//                                 <span>Performance</span>
//                                 <span style={{ fontWeight: "800", color: "#25343F" }}>{today.performance.performance_percentage}%</span>
//                             </div>
//                             <div style={styles.perfBarTrack}>
//                                 <div style={{
//                                     ...styles.perfBarFill,
//                                     width: `${today.performance.performance_percentage}%`,
//                                     background: today.performance.color_code === "GREEN" ? "#22c55e"
//                                         : today.performance.color_code === "YELLOW" ? "#eab308" : "#ef4444"
//                                 }} />
//                             </div>
//                         </div>
//                         <div style={styles.perfGrid}>
//                             <div style={styles.perfItem}>
//                                 <div style={styles.perfNum}>{today.performance.sourced_today}</div>
//                                 <div style={styles.perfDesc}>Sourced Today</div>
//                                 <div style={styles.perfTarget}>Target: {today.target.target_sourcing}</div>
//                             </div>
//                             <div style={styles.perfDivider} />
//                             <div style={styles.perfItem}>
//                                 <div style={styles.perfNum}>{today.performance.submitted_today}</div>
//                                 <div style={styles.perfDesc}>Submitted Today</div>
//                                 <div style={styles.perfTarget}>Target: {today.target.target_submission}</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Overall Stats */}
//             <div style={styles.sectionTitle}>Overall Statistics</div>
//             <div style={styles.overallGrid}>
//                 {[
//                     { label: "Vendors Created", value: overall_stats.total_vendors_created, icon: "🏢", color: "#E0F2FE", textColor: "#0369A1" },
//                     { label: "Clients Created", value: overall_stats.total_clients_created, icon: "👥", color: "#F0FDF4", textColor: "#166534" },
//                     { label: "Candidates Created", value: overall_stats.total_candidates_created, icon: "🧑‍💼", color: "#FFF7ED", textColor: "#C2410C" },
//                     { label: "Candidates Submitted", value: overall_stats.total_candidates_submitted, icon: "📤", color: "#FDF4FF", textColor: "#7E22CE" },
//                     { label: "In Pipeline", value: overall_stats.candidates_in_pipeline, icon: "🔄", color: "#FFFBEB", textColor: "#92400E" },
//                     { label: "Interviews Today", value: overall_stats.interviews_today, icon: "🎯", color: "#FFF1F2", textColor: "#BE123C" },
//                     { label: "Assigned Requirements", value: overall_stats.assigned_requirements, icon: "📌", color: "#F0F9FF", textColor: "#075985" },
//                     { label: "Submitted JDs", value: overall_stats.submitted_jds, icon: "📝", color: "#F7FEE7", textColor: "#3F6212" },
//                 ].map((item, i) => (
//                     <div key={i} style={{ ...styles.overallCard, background: item.color }}>
//                         <div style={styles.overallIcon}>{item.icon}</div>
//                         <div style={{ ...styles.overallValue, color: item.textColor }}>{item.value}</div>
//                         <div style={styles.overallLabel}>{item.label}</div>
//                     </div>
//                 ))}
//             </div>

//             {/* Monthly Performance */}
//             <div style={styles.sectionTitle}>Monthly Performance</div>
//             <div style={styles.monthlyRow}>
//                 <div style={styles.monthlyCard}>
//                     <div style={styles.monthlyIcon}>📥</div>
//                     <div style={styles.monthlyValue}>{monthly_performance.total_sourced}</div>
//                     <div style={styles.monthlyLabel}>Total Sourced</div>
//                 </div>
//                 <div style={styles.monthlyCard}>
//                     <div style={styles.monthlyIcon}>📨</div>
//                     <div style={styles.monthlyValue}>{monthly_performance.total_submitted}</div>
//                     <div style={styles.monthlyLabel}>Total Submitted</div>
//                 </div>
//             </div>

//         </BaseLayout>
//     );
// }

// const styles = {
//     toast: { position: "fixed", top: "85px", right: "20px", color: "#fff", padding: "12px 25px", borderRadius: "8px", zIndex: 9999, fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
//     loadingWrap: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "300px", gap: "16px" },
//     loadingSpinner: { width: "40px", height: "40px", border: "4px solid #EAEFEF", borderTop: "4px solid #FF9B51", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
//     loadingText: { color: "#25343F", fontWeight: "600" },

//     headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
//     backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
//     pageTitle: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },

//     // Profile Card
//     profileCard: { background: "#fff", borderRadius: "16px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", border: "1px solid #EAEFEF", display: "flex", alignItems: "center", gap: "28px", marginBottom: "24px", flexWrap: "wrap" },
//     avatarWrap: { flexShrink: 0 },
//     avatar: { width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid #FF9B51" },
//     avatarFallback: { width: "80px", height: "80px", borderRadius: "50%", background: "#25343F", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: "800", border: "3px solid #FF9B51" },
//     profileInfo: { flex: 1, minWidth: "200px" },
//     profileName: { fontSize: "22px", fontWeight: "800", color: "#25343F", marginBottom: "4px" },
//     profileEmail: { fontSize: "14px", color: "#64748B", marginBottom: "10px" },
//     profileMeta: { display: "flex", gap: "10px", flexWrap: "wrap" },
//     roleBadge: { background: "#25343F", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" },
//     activeBadge: { background: "#dcfce7", color: "#166534", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" },
//     inactiveBadge: { background: "#fee2e2", color: "#991b1b", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" },
//     profileRight: { display: "flex", gap: "24px", flexWrap: "wrap" },
//     profileMetaItem: { display: "flex", flexDirection: "column", gap: "4px" },
//     metaLabel: { fontSize: "11px", color: "#94A3B8", fontWeight: "600", textTransform: "uppercase" },
//     metaValue: { fontSize: "14px", color: "#25343F", fontWeight: "700" },

//     // Stats Row
//     statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "28px" },
//     statCard: { background: "#fff", borderRadius: "12px", padding: "18px 14px", textAlign: "center", border: "1px solid #EAEFEF", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
//     statIcon: { fontSize: "22px", marginBottom: "8px" },
//     statValue: { fontSize: "22px", fontWeight: "800", color: "#25343F", marginBottom: "4px" },
//     statLabel: { fontSize: "11px", color: "#64748B", fontWeight: "600" },

//     // Section Title
//     sectionTitle: { fontSize: "15px", fontWeight: "800", color: "#FF9B51", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #EAEFEF", paddingBottom: "8px", marginBottom: "16px", marginTop: "8px" },

//     // Today Grid
//     todayGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginBottom: "28px" },
//     card: { background: "#fff", borderRadius: "14px", border: "1px solid #EAEFEF", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
//     cardHeader: { display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px", background: "#F8FAFC", borderBottom: "1px solid #EAEFEF" },
//     cardHeaderIcon: { fontSize: "18px" },
//     cardHeaderText: { flex: 1, fontWeight: "700", color: "#25343F", fontSize: "14px" },
//     statusChip: { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" },
//     cardBody: { padding: "18px" },

//     attendanceRow: { display: "flex", alignItems: "center", gap: "0", marginBottom: "14px" },
//     attendanceItem: { flex: 1, textAlign: "center" },
//     attLabel: { fontSize: "11px", color: "#94A3B8", fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" },
//     attValue: { fontSize: "20px", fontWeight: "800", color: "#25343F", marginBottom: "4px" },
//     attDone: { fontSize: "11px", color: "#166534", background: "#dcfce7", display: "inline-block", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" },
//     attPending: { fontSize: "11px", color: "#991b1b", background: "#fee2e2", display: "inline-block", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" },
//     attDivider: { width: "1px", height: "60px", background: "#EAEFEF" },
//     reportChip: { textAlign: "center", padding: "8px", borderRadius: "8px", fontSize: "13px", fontWeight: "700" },

//     perfBarWrap: { marginBottom: "16px" },
//     perfBarLabel: { display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748B", fontWeight: "600", marginBottom: "8px" },
//     perfBarTrack: { background: "#F1F5F9", borderRadius: "100px", height: "10px", overflow: "hidden" },
//     perfBarFill: { height: "10px", borderRadius: "100px", transition: "width 0.4s ease" },
//     perfGrid: { display: "flex", alignItems: "center" },
//     perfItem: { flex: 1, textAlign: "center" },
//     perfNum: { fontSize: "28px", fontWeight: "800", color: "#25343F" },
//     perfDesc: { fontSize: "12px", color: "#64748B", fontWeight: "600" },
//     perfTarget: { fontSize: "11px", color: "#FF9B51", fontWeight: "700", marginTop: "2px" },
//     perfDivider: { width: "1px", height: "60px", background: "#EAEFEF" },

//     // Overall Grid
//     overallGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "28px" },
//     overallCard: { borderRadius: "12px", padding: "18px", textAlign: "center", border: "1px solid #EAEFEF" },
//     overallIcon: { fontSize: "24px", marginBottom: "8px" },
//     overallValue: { fontSize: "28px", fontWeight: "800", marginBottom: "4px" },
//     overallLabel: { fontSize: "12px", color: "#64748B", fontWeight: "600" },

//     // Monthly
//     monthlyRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" },
//     monthlyCard: { background: "#fff", borderRadius: "14px", padding: "28px", textAlign: "center", border: "1px solid #EAEFEF", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
//     monthlyIcon: { fontSize: "32px", marginBottom: "12px" },
//     monthlyValue: { fontSize: "36px", fontWeight: "800", color: "#25343F", marginBottom: "6px" },
//     monthlyLabel: { fontSize: "14px", color: "#64748B", fontWeight: "600" },
// };

// export default UserDetail;
