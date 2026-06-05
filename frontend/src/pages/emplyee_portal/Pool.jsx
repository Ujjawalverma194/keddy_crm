import React from "react";
import { useNavigate } from "react-router-dom";
import BaseLayout from "../components/emp_base";

// Icons specifically for the two categories
const Icons = {
    Candidates: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,

    Vendors: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
        <circle cx="18" cy="8" r="3"/><path d="M18 11v5"/>
    </svg>
};

function DirectorySelection() {
    const navigate = useNavigate();

    return (
        <BaseLayout>
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                <h2 style={styles.title}>Selection Directory</h2>
                <p style={styles.subtitle}>Select a category to view detailed information.</p>
            </div>

            <div style={styles.cardsContainer}>
                {/* 1. Candidates Card */}
                <div style={styles.mainCard} onClick={() => navigate("/employee/candidates")}>
                    <div style={{ ...styles.iconWrapper, color: "#FF9B51", backgroundColor: "rgba(255, 155, 81, 0.1)" }}>
                        <Icons.Candidates />
                    </div>
                    <div style={styles.textWrapper}>
                        <h3 style={styles.cardHeader}>Candidates</h3>
                        <p style={styles.cardDesc}>View all registered talent and their current pipeline status.</p>
                    </div>
                    <div style={styles.arrow}>→</div>
                </div>

                {/* 2. Vendors Card */}
                <div style={styles.mainCard} onClick={() => navigate("/employee/vendors")}>
                    <div style={{ ...styles.iconWrapper, color: "#4834D4", backgroundColor: "rgba(72, 52, 212, 0.1)" }}>
                        <Icons.Vendors />
                    </div>
                    <div style={styles.textWrapper}>
                        <h3 style={styles.cardHeader}>Vendors</h3>
                        <p style={styles.cardDesc}>Manage IT staffing partners and vendor contact details.</p>
                    </div>
                    <div style={styles.arrow}>→</div>
                </div>
            </div>
        </BaseLayout>
    );
}

const styles = {
    header: { marginBottom: "40px" },
    backBtn: { background: "#25343f", border: "none", color: "white", fontWeight: "700", cursor: "pointer", marginBottom: "10px", padding: 0  , borderRadius:"10px", padding:"10px"},
    title: { fontSize: "28px", color: "#25343F", fontWeight: "800", margin: "0 0 8px 0" },
    subtitle: { color: "#7F8C8D", fontSize: "15px", margin: 0 },
    
    cardsContainer: { 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", 
        gap: "25px" 
    },
    mainCard: { 
        background: "#fff", 
        padding: "30px", 
        borderRadius: "20px", 
        display: "flex", 
        alignItems: "center", 
        gap: "20px", 
        cursor: "pointer", 
        border: "1px solid #F0F2F4",
        transition: "all 0.3s ease",
        position: "relative",
        boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
    },
    iconWrapper: { 
        width: "64px", 
        height: "64px", 
        borderRadius: "15px", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center" 
    },
    textWrapper: { flex: 1 },
    cardHeader: { margin: "0 0 5px 0", fontSize: "20px", fontWeight: "800", color: "#25343F" },
    cardDesc: { margin: 0, fontSize: "14px", color: "#7F8C8D", lineHeight: "1.5" },
    arrow: { fontSize: "20px", color: "#BFC9D1", fontWeight: "bold" }
};

export default DirectorySelection;