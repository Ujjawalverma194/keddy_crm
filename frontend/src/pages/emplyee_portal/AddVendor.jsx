import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";

function AddVendor() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });
    
    const [files, setFiles] = useState({
        bench_list: null,
        nda_document: null,
        msa_document: null
    });

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
        vendor_official_email: "",
        sending_email_id: "",
        provide_bench: true,
        provide_market: false,
        company_employee_count: "",
        remark: ""
    });

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleFileChange = (e, key) => {
        setFiles({ ...files, [key]: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        const formData = new FormData();

        // Data appending logic
        Object.keys(form).forEach((key) => {
            let val = form[key];
            if (typeof val === "boolean") val = val ? "1" : "0";
            if (val !== null && val !== undefined && val !== "") {
                formData.append(key, val);
            }
        });

        // Files appending
        if (files.bench_list) formData.append("bench_list", files.bench_list);
        if (files.nda_document) formData.append("nda_document", files.nda_document);
        if (files.msa_document) formData.append("msa_document", files.msa_document);

        try {
            await apiRequest("/employee-portal/api/vendors/create/", "POST", formData);
            notify("Vendor created successfully!");
            
            // Form reset logic taaki redirect na karna pade
            setForm({
                ...form, name: "", number: "", company_name: "", email: "", 
                company_website: "", company_pan_or_reg_no: "", remark: ""
            });
            setFiles({ bench_list: null, nda_document: null, msa_document: null });
            e.target.reset(); // Reset HTML inputs

        } catch (error) {
            notify("Error creating vendor. Please check all fields.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BaseLayout>
            {/* Toast Notification */}
            {toast.show && (
                <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
                    {toast.msg}
                </div>
            )}

            <div style={styles.headerRow}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                <h2 style={styles.pageTitle}>Create New Vendor</h2>
                <div style={{ width: '100px' }}></div> {/* Spacer to keep title center */}
            </div>

            <form onSubmit={handleSubmit} style={styles.card}>
                <div style={styles.formGrid}>
                    
                    {/* SECTION 1: MANDATORY (Only these 3 are required) */}
                    <div style={styles.sectionHeader}>Required Information</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Vendor Name *</label>
                        <input style={styles.input} name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Phone Number *</label>
                        <input style={styles.input} name="number" value={form.number} onChange={handleChange} required placeholder="9876543220" />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Company Name *</label>
                        <input style={styles.input} name="company_name" value={form.company_name} onChange={handleChange} required placeholder="ABC Tech" />
                    </div>

                    {/* SECTION 2: EMAILS & WEB */}
                    <div style={styles.sectionHeader}>Contact & Online Presence</div>
                    {/* <div style={styles.inputGroup}>
                        <label style={styles.label}>Personal/Contact Email</label>
                        <input style={styles.input} type="email" name="email" value={form.email} onChange={handleChange} />
                    </div> */}
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Vendor Official Email</label>
                        <input style={styles.input} type="email" name="vendor_official_email" value={form.vendor_official_email} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Sending Email ID</label>
                        <input style={styles.input} type="email" name="sending_email_id" value={form.sending_email_id} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Website URL</label>
                        <input style={styles.input} name="company_website" value={form.company_website} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>PAN / Reg No.</label>
                        <input style={styles.input} name="company_pan_or_reg_no" value={form.company_pan_or_reg_no} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Company Employee Count</label>
                        <input style={styles.input} type="number" name="company_employee_count" value={form.company_employee_count} onChange={handleChange} />
                    </div>

                    {/* SECTION 3: POC */}
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

                    {/* SECTION 4: TECH INFO */}
                    <div style={styles.sectionHeader}>Service & Tech Info</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Specialized Technologies</label>
                        <input style={styles.input} name="specialized_tech_developers" value={form.specialized_tech_developers} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Top 3 Clients</label>
                        <input style={styles.input} name="top_3_clients" value={form.top_3_clients} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Bench Developers Count</label>
                        <input style={styles.input} type="number" name="no_of_bench_developers" value={form.no_of_bench_developers} onChange={handleChange} />
                    </div>

                    {/* SECTION 5: DOCUMENTS */}
                    <div style={styles.sectionHeader}>Documents (Uploads)</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Bench List</label>
                        <input style={styles.fileInput} type="file" onChange={(e) => handleFileChange(e, "bench_list")} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>NDA Document</label>
                        <input style={styles.fileInput} type="file" onChange={(e) => handleFileChange(e, "nda_document")} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>MSA Document</label>
                        <input style={styles.fileInput} type="file" onChange={(e) => handleFileChange(e, "msa_document")} />
                    </div>

                    {/* SECTION 6: REMARK */}
                    <div style={{...styles.inputGroup, gridColumn: "1 / -1"}}>
                        <label style={styles.label}>Remark</label>
                        <textarea style={styles.textarea} name="remark" value={form.remark} onChange={handleChange}></textarea>
                    </div>
                </div>

                <div style={styles.checkboxRow}>
                    <div style={styles.checkboxWrapper}>
                        <input type="checkbox" id="onsite" name="provide_onsite" checked={form.provide_onsite} onChange={handleChange} style={styles.checkbox} />
                        <label htmlFor="onsite" style={styles.checkLabel}>Onsite Support</label>
                    </div>
                    <div style={styles.checkboxWrapper}>
                        <input type="checkbox" id="bench" name="provide_bench" checked={form.provide_bench} onChange={handleChange} style={styles.checkbox} />
                        <label htmlFor="bench" style={styles.checkLabel}>Provide Bench</label>
                    </div>
                    <div style={styles.checkboxWrapper}>
                        <input type="checkbox" id="market" name="provide_market" checked={form.provide_market} onChange={handleChange} style={styles.checkbox} />
                        <label htmlFor="market" style={styles.checkLabel}>Provide Market</label>
                    </div>
                </div>

                {form.provide_onsite && (
                    <div style={{ ...styles.inputGroup, marginTop: '20px', maxWidth: '400px' }}>
                        <label style={styles.label}>Onsite Location</label>
                        <input style={styles.input} name="onsite_location" value={form.onsite_location} onChange={handleChange} placeholder="City name" />
                    </div>
                )}

                <div style={styles.footer}>
                    <button type="submit" disabled={isSubmitting} style={{...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1}}>
                        {isSubmitting ? "Saving..." : "Create Vendor"}
                    </button>
                </div>
            </form>
        </BaseLayout>
    );
}

const styles = {
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", maxWidth: "1100px", margin: "0 auto 25px auto" },
    backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
    pageTitle: { fontSize: "28px", color: "#25343F", fontWeight: "800", margin: 0, textAlign: "center", flex: 1 },
    card: { background: "#fff", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", maxWidth: "1100px", margin: "0 auto" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" },
    sectionHeader: { gridColumn: "1 / -1", fontSize: "14px", fontWeight: "800", color: "#FF9B51", marginTop: "25px", borderBottom: "1px solid #eee", paddingBottom: "5px", textTransform: "uppercase" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "13px", fontWeight: "700", color: "#25343F" },
    input: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none" },
    textarea: { padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", minHeight: "80px", outline: "none" },
    fileInput: { fontSize: "12px", color: "#666" },
    checkboxRow: { display: "flex", gap: "30px", marginTop: "30px", flexWrap: "wrap", background: "#F8FAFC", padding: "15px", borderRadius: "10px" },
    checkboxWrapper: { display: "flex", alignItems: "center", gap: "8px" },
    checkbox: { width: "18px", height: "18px", cursor: "pointer", accentColor: "#FF9B51" },
    checkLabel: { fontWeight: "700", fontSize: "14px", color: "#25343F" },
    footer: { marginTop: "30px", textAlign: "right" },
    submitBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "14px 40px", borderRadius: "10px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(255,155,81,0.3)" }
};

export default AddVendor;

