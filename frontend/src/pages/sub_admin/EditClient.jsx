import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";

function EditClient() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [benchListFile, setBenchListFile] = useState(null);

    const [form, setForm] = useState({
        company_name: "",
        company_website: "",
        company_pan_or_reg_no: "",
        gst_number: "",
        billing_address: "",
        account_holder_name: "",
        bank_name: "",
        account_number: "",
        ifsc_code: "",
        remark: "",
        official_email: "",
        sending_email_id: "",
        company_employee_count: "",
    });

    const [pocs, setPocs] = useState([{ name: "", number: "", email: "", isPrimary: false }]);

    // Step 1: Purana data fetch karna
    useEffect(() => {
        const fetchClient = async () => {
            try {
                const data = await apiRequest(`/employee-portal/api/clients/${id}/`, "GET");
                setForm({
                    company_name: data.company_name || "",
                    email: data.email || "",
                    company_website: data.company_website || "",
                    company_pan_or_reg_no: data.company_pan_or_reg_no || "",
                    top_3_clients: data.top_3_clients || "",
                    no_of_bench_developers: data.no_of_bench_developers || 0,
                    provide_onsite: data.provide_onsite || false,
                    onsite_location: data.onsite_location || "",
                    specialized_tech_developers: data.specialized_tech_developers || "",
                });
                if (data.pocs && data.pocs.length > 0) {
                    setPocs(data.pocs);
                } else {
                    setPocs([{ name: "", number: "", email: "", isPrimary: false }]);
                }
            } catch (error) {
                console.error("Error fetching client:", error);
                alert("Client data load nahi ho paya.");
            } finally {
                setLoading(false);
            }
        };
        fetchClient();
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
        
        formData.append("pocs", JSON.stringify(pocs));

        if (benchListFile) {
            formData.append("bench_list", benchListFile);
        }

        try {
            // Edit ke liye PUT request use hogi
            await apiRequest(`/employee-portal/api/clients/${id}/update/`, "PUT", formData);
            alert("Client updated successfully!");
            navigate(`/employee/client/view/${id}`);
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
                <h2 style={styles.pageTitle}>Edit Client: {pocs[0]?.name || form.company_name}</h2>
            </div>

            <form onSubmit={handleSubmit} style={styles.card}>
                <div style={styles.formGrid}>
                    <div style={styles.sectionHeader}>Required Info</div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Company Name *</label>
                        <input style={styles.input} name="company_name" value={form.company_name} onChange={handleChange} required />
                    </div>

                    <div style={styles.sectionHeader}>Company Details</div>

                      <div style={styles.inputGroup}>
                          <label style={styles.label}>Client Official Email</label>
                          <input style={styles.input} type="email" name="official_email" value={form.official_email} onChange={handleChange} />
                      </div>
                      <div style={styles.inputGroup}>
                          <label style={styles.label}>Sending Email ID</label>
                          <input style={styles.input} type="email" name="sending_email_id" value={form.sending_email_id} onChange={handleChange} />
                      </div>
                      <div style={styles.inputGroup}>
                          <label style={styles.label}>GST Number</label>
                          <input style={styles.input} name="gst_number" value={form.gst_number} onChange={handleChange} />
                      </div>
                      <div style={styles.inputGroup}>
                          <label style={styles.label}>Billing Address</label>
                          <input style={styles.input} name="billing_address" value={form.billing_address} onChange={handleChange} />
                      </div>
                      <div style={styles.inputGroup}>
                          <label style={styles.label}>Account Holder Name</label>
                          <input style={styles.input} name="account_holder_name" value={form.account_holder_name} onChange={handleChange} />
                      </div>
                      <div style={styles.inputGroup}>
                          <label style={styles.label}>Bank Name</label>
                          <input style={styles.input} name="bank_name" value={form.bank_name} onChange={handleChange} />
                      </div>
                      <div style={styles.inputGroup}>
                          <label style={styles.label}>Account Number</label>
                          <input style={styles.input} name="account_number" value={form.account_number} onChange={handleChange} />
                      </div>
                      <div style={styles.inputGroup}>
                          <label style={styles.label}>IFSC Code</label>
                          <input style={styles.input} name="ifsc_code" value={form.ifsc_code} onChange={handleChange} />
                      </div>
                      <div style={styles.inputGroup}>
                          <label style={styles.label}>Company Employee Count</label>
                          <input style={styles.input} type="number" name="company_employee_count" value={form.company_employee_count} onChange={handleChange} />
                      </div>
                      <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                          <label style={styles.label}>Remark</label>
                          <textarea style={{...styles.input, minHeight: '60px', resize: 'vertical'}} name="remark" value={form.remark} onChange={handleChange} />
                      </div>

<div style={styles.sectionHeader}>Point of Contact (POC)</div>
                    <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {pocs.map((poc, index) => (
                            <div key={index} style={styles.pocBlock}>
                                <div style={styles.pocHeader}>
                                    <span style={styles.pocTitle}>Contact {index + 1} {poc.isPrimary ? "(Primary)" : ""}</span>
                                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                        {!poc.isPrimary && (
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const newPocs = pocs.map((p, i) => ({ ...p, isPrimary: i === index }));
                                                    setPocs(newPocs);
                                                }}
                                                style={styles.makePrimaryBtn}
                                            >
                                                Make Primary
                                            </button>
                                        )}
                                        {pocs.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    if (!window.confirm("Are you sure you want to remove this POC?")) return;
                                                    const newPocs = pocs.filter((_, i) => i !== index);
                                                    if (poc.isPrimary && newPocs.length > 0) newPocs[0].isPrimary = true;
                                                    setPocs(newPocs);
                                                }}
                                                style={styles.removeBtn}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div style={styles.pocGrid}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Name *</label>
                                        <input style={styles.input} value={poc.name} onChange={(e) => {
                                            const newPocs = [...pocs];
                                            newPocs[index].name = e.target.value;
                                            setPocs(newPocs);
                                        }} required />
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Phone Number *</label>
                                        <input style={styles.input} value={poc.number} onChange={(e) => {
                                            const newPocs = [...pocs];
                                            newPocs[index].number = e.target.value;
                                            setPocs(newPocs);
                                        }} required />
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Email Address</label>
                                        <input style={styles.input} type="email" value={poc.email || ""} onChange={(e) => {
                                            const newPocs = [...pocs];
                                            newPocs[index].email = e.target.value;
                                            setPocs(newPocs);
                                        }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={() => setPocs([...pocs, { name: "", number: "", email: "", isPrimary: false }])} style={styles.addPocBtn}>
                            + Add Another POC
                        </button>
                    </div>

                    </div>
                  <div style={styles.footer}>
                    <button type="submit" disabled={updating} style={styles.submitBtn}>
                        {updating ? "Updating..." : "Update Client"}
                    </button>
                </div>
            </form>
        </BaseLayout>
    );
}

// Styles are exactly same as your AddClient
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
    submitBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "12px 35px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 10px rgba(255, 155, 81, 0.2)" },
    pocBlock: { background: "rgba(255, 255, 255, 0.5)", border: "1px solid rgba(255, 255, 255, 0.8)", borderRadius: "10px", padding: "15px" },
    pocHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
    pocTitle: { fontSize: "14px", fontWeight: "800", color: "#25343F" },
    removeBtn: { background: "#FEE2E2", color: "#DC2626", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontWeight: "700" },
    makePrimaryBtn: { background: "#E0F2FE", color: "#0284C7", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontWeight: "700" },
    pocGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" },
    addPocBtn: { alignSelf: "flex-start", background: "none", border: "1px dashed #25343F", color: "#25343F", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }
};

export default EditClient;

