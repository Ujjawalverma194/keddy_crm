import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";

const format12Hour = (timeStr) => {
    if (!timeStr) return "N/A";
    const [h, m] = timeStr.split(':');
    if (!h || !m) return timeStr;
    let hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${suffix}`;
};

function ViewEod() {
    const { id: userId } = useParams();
    const navigate = useNavigate();
    const [eods, setEods] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    
    const getAuthHeaders = () => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    };

    useEffect(() => {
        const fetchEods = async () => {
            setLoading(true);
            try {
                let url = `/sub-admin/api/eod/employee/${userId}`;
                if (startDate && endDate) {
                    url += `?startDate=${startDate}&endDate=${endDate}`;
                }
                const res = await apiRequest(url, "GET", null, getAuthHeaders());
                if (res && res.results) {
                    setEods(res.results);
                }
            } catch (err) {
                console.error("Error fetching EODs", err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchEods();
        }
    }, [userId, startDate, endDate]);

    return (
        <BaseLayout>
            <div style={styles.headerRow}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>
                    ← Back
                </button>
                <h2 style={styles.pageTitle}>Employee EOD History</h2>
                <div style={{ width: "90px" }} />
            </div>

            <div style={{ background: "#fff", borderRadius: 14, padding: 25, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #EAEFEF" }}>
                <div style={{ display: "flex", gap: 15, marginBottom: 25, alignItems: "flex-end" }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: "10px 15px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14 }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: "10px 15px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14 }} />
                    </div>
                    {loading && <div style={{ fontSize: 14, color: "#475569", marginBottom: 10, marginLeft: 10 }}>Loading...</div>}
                </div>
                
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Reporting Time</th>
                                <th style={styles.th}>Tasks Completed</th>
                                <th style={styles.th}>Issues Faced</th>
                                <th style={styles.th}>Tomorrow's Plan</th>
                                <th style={styles.th}>Log Out Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eods.length > 0 ? (
                                eods.map(eod => (
                                    <tr key={eod.id} style={{ borderBottom: "1px solid #E2E8F0" }}>
                                        <td style={styles.td}>{eod.date}</td>
                                        <td style={styles.td}>{format12Hour(eod.reportingTime)}</td>
                                        <td style={styles.td}><pre style={styles.pre}>{eod.tasksCompleted}</pre></td>
                                        <td style={styles.td}><pre style={styles.pre}>{eod.issuesFaced}</pre></td>
                                        <td style={styles.td}><pre style={styles.pre}>{eod.resolutionSteps}</pre></td>
                                        <td style={styles.td}>{format12Hour(eod.logoutTime)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#64748B", fontSize: 14 }}>
                                        No EOD reports found for this employee.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </BaseLayout>
    );
}

const styles = {
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
    backBtn: { display: "flex", alignItems: "center", gap: "8px", background: "#25343F", color: "#fff", border: "none", padding: "9px 18px", borderRadius: "9px", fontWeight: "700", cursor: "pointer", fontSize: 13 },
    pageTitle: { fontSize: "22px", color: "#25343F", fontWeight: "800", margin: 0 },
    th: { padding: "14px 18px", textAlign: "left", fontSize: 13, fontWeight: "700", color: "#475569", backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" },
    td: { padding: "18px", fontSize: 14, color: "#334155", verticalAlign: "top" },
    pre: { margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14 }
};

export default ViewEod;
