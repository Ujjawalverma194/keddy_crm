import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";

function EditVendor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [benchListFile, setBenchListFile] = useState(null);

    const [form, setForm] = useState({
        name: "",
        number: "",
        company_name: "",
        email: "",
        company_website: "",
        company_pan_or_reg_no: "",
        poc1_name: "",
        poc1_number: "",
        poc2_name: "",
        poc2_number: "",
        top_3_clients: "",
        no_of_bench_developers: 0,
        provide_onsite: false,
        onsite_location: "",
        specialized_tech_developers: "",
    });

    // Step 1: Purana data fetch karna
    useEffect(() => {
        const fetchVendor = async () => {
            try {
                const data = await apiRequest(`/employee-portal/api/vendors/${id}/`, "GET");
                setForm({
                    name: data.name || "",
                    number: data.number || "",
                    company_name: data.company_name || "",
                    email: data.email || "",
                    company_website: data.company_website || "",
                    company_pan_or_reg_no: data.company_pan_or_reg_no || "",
                    poc1_name: data.poc1_name || "",
                    poc1_number: data.poc1_number || "",
                    poc2_name: data.poc2_name || "",
                    poc2_number: data.poc2_number || "",
                    top_3_clients: data.top_3_clients || "",
                    no_of_bench_developers: data.no_of_bench_developers || 0,
                    provide_onsite: data.provide_onsite || false,
                    onsite_location: data.onsite_location || "",
                    specialized_tech_developers: data.specialized_tech_developers || "",
                });
            } catch (error) {
                console.error("Error fetching vendor:", error);
                alert("Vendor data load nahi ho paya.");
            } finally {
                setLoading(false);
            }
        };
        fetchVendor();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : (type === "number" ? parseInt(value) || 0 : value)
        });
    };

    const handleFileChange = (e) => {
        setBenchListFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);

        const formData = new FormData();
        Object.keys(form).forEach((key) => {
            formData.append(key, form[key]);
        });

        if (benchListFile) {
            formData.append("bench_list", benchListFile);
        }

        try {
            // Edit ke liye PUT request use hogi
            await apiRequest(`/employee-portal/api/vendors/${id}/update/`, "PUT", formData);
            alert("Vendor updated successfully!");
            navigate(`/employee/vendor/view/${id}`);
        } catch (error) {
            alert("Update failed. Please check all fields.");
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <BaseLayout><p>Loading...</p></BaseLayout>;

    return (
        <BaseLayout>
            <div style={styles.topBar}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                <h2 style={styles.pageTitle}>Edit Vendor: {form.name}</h2>
            </div>

            <form onSubmit={handleSubmit} style={styles.card}>
                <div style={styles.formGrid}>
                    <div style={styles.sectionHeader}>Required Info</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Vendor Name *</label>
                        <input style={styles.input} name="name" value={form.name} onChange={handleChange} required />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Phone Number *</label>
                        <input style={styles.input} name="number" value={form.number} onChange={handleChange} required />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Company Name *</label>
                        <input style={styles.input} name="company_name" value={form.company_name} onChange={handleChange} required />
                    </div>

                    <div style={styles.sectionHeader}>Company Details</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email</label>
                        <input style={styles.input} type="email" name="email" value={form.email} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Website</label>
                        <input style={styles.input} name="company_website" value={form.company_website} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>PAN / Reg No.</label>
                        <input style={styles.input} name="company_pan_or_reg_no" value={form.company_pan_or_reg_no} onChange={handleChange} />
                    </div>

                    <div style={styles.sectionHeader}>Point of Contact (POC)</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>POC 1 Name</label>
                        <input style={styles.input} name="poc1_name" value={form.poc1_name} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>POC 1 Number</label>
                        <input style={styles.input} name="poc1_number" value={form.poc1_number} onChange={handleChange} />
                    </div> <br />
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>POC 2 Name</label>
                        <input style={styles.input} name="poc2_name" value={form.poc2_name} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>POC 2 Number</label>
                        <input style={styles.input} name="poc2_number" value={form.poc2_number} onChange={handleChange} />
                    </div>

                    <div style={styles.sectionHeader}>Developer & Bench Info</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Top 3 Clients</label>
                        <input style={styles.input} name="top_3_clients" value={form.top_3_clients} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Bench Developers Count</label>
                        <input style={styles.input} type="number" name="no_of_bench_developers" value={form.no_of_bench_developers} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Specialized Technologies</label>
                        <input style={styles.input} name="specialized_tech_developers" value={form.specialized_tech_developers} onChange={handleChange} placeholder="e.g. React, Java, Python" />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Update Bench List (File)</label>
                        <input style={styles.input} type="file" onChange={handleFileChange} />
                    </div>
                </div>

                <div style={styles.checkboxWrapper}>
                    <input type="checkbox" id="onsite" name="provide_onsite" checked={form.provide_onsite} onChange={handleChange} />
                    <label htmlFor="onsite" style={styles.checkLabel}>Provide Onsite Support?</label>
                </div>

                {form.provide_onsite && (
                    <div style={{ ...styles.inputGroup, marginTop: '15px' }}>
                        <label style={styles.label}>Onsite Location</label>
                        <input style={styles.input} name="onsite_location" value={form.onsite_location} onChange={handleChange} />
                    </div>
                )}

                <div style={styles.footer}>
                    <button type="submit" disabled={updating} style={styles.submitBtn}>
                        {updating ? "Updating..." : "Update Vendor"}
                    </button>
                </div>
            </form>
        </BaseLayout>
    );
}

// Styles are exactly same as your AddVendor
const styles = {
    topBar: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" },
    backBtn: { background: "none", border: "none", color: "#25343F", fontWeight: "700", cursor: "pointer", fontSize: "15px" },
    pageTitle: { fontSize: "22px", color: "#25343F", fontWeight: "800", margin: 0 },
    card: { background: "#BFC9D1", borderRadius: "15px", padding: "25px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", maxWidth: "850px", margin: "0 auto" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "15px" },
    sectionHeader: { gridColumn: "1 / -1", fontSize: "14px", fontWeight: "700", color: "#25343F", marginTop: "20px", borderBottom: "1px solid rgba(37, 52, 63, 0.1)", paddingBottom: "5px", textTransform: "uppercase" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
    label: { fontSize: "13px", fontWeight: "700", color: "#25343F" },
    input: { padding: "10px", borderRadius: "8px", border: "1px solid rgba(37, 52, 63, 0.2)", fontSize: "14px", backgroundColor: "#EAEFEF", color: "#25343F", outline: "none" },
    checkboxWrapper: { display: "flex", alignItems: "center", gap: "10px", marginTop: "20px" },
    checkLabel: { fontWeight: "700", color: "#25343F", fontSize: "14px", cursor: "pointer" },
    footer: { marginTop: "25px", textAlign: "right" },
    submitBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "12px 35px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 10px rgba(255, 155, 81, 0.2)" }
};

export default EditVendor;

