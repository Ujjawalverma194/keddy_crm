// src/pages/CentralAdminDashboard.js

import React from "react";

function CentralAdminDashboard() {
    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h1 style={styles.title}>Keddy CRM</h1>
                <p style={styles.subtitle}>Central Admin Dashboard</p>

                <div style={styles.box}>
                    <h3>Welcome Central Admin 👑</h3>
                    <p>You have full control over the CRM system.</p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg,#1f2937,#111827)",
    },
    card: {
        background: "#fff",
        padding: 30,
        borderRadius: 12,
        width: 500,
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    },
    title: {
        textAlign: "center",
        margin: 0,
    },
    subtitle: {
        textAlign: "center",
        color: "#6b7280",
        marginBottom: 20,
    },
    box: {
        padding: 20,
        borderRadius: 8,
        background: "#f3f4f6",
    },
};

export default CentralAdminDashboard;