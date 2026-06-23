import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";

function AddClient() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    // Files state
    const [files, setFiles] = useState({
        nda_document: null,
        msa_document: null
    });

    const [form, setForm] = useState({
        client_name: "",
        company_name: "",
        phone_number: "",
        email: "",
        official_email: "",
        sending_email_id: "",
        company_employee_count: "",
        remark: "",
        is_active: true,
        is_verified: false,
        nda_status: "NOT_SENT",
        msa_status: "NOT_SENT"
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

        // Data appending
        Object.keys(form).forEach((key) => {
            let val = form[key];
            if (typeof val === "boolean") val = val ? "1" : "0";
            if (val !== null && val !== undefined && val !== "") {
                formData.append(key, val);
            }
        });

        // Files appending
        if (files.nda_document) formData.append("nda_document", files.nda_document);
        if (files.msa_document) formData.append("msa_document", files.msa_document);

        try {
            await apiRequest("/employee-portal/clients/create/", "POST", formData);
            notify("Client Profile Created Successfully!");
            
            // Reset form but stay on page as requested
            setForm({
                client_name: "", company_name: "", phone_number: "", email: "",
                official_email: "", sending_email_id: "", company_employee_count: "",
                remark: "", is_active: true, is_verified: false,
                nda_status: "NOT_SENT", msa_status: "NOT_SENT"
            });
            setFiles({ nda_document: null, msa_document: null });
            e.target.reset();
        } catch (error) {
            notify("Error: Client is Not Created.", "error");
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
                <h2 style={styles.pageTitle}>Add New Client</h2>
                <div style={{ width: '100px' }}></div>
            </div>

            <form onSubmit={handleSubmit} style={styles.card}>
                <div style={styles.formGrid}>
                    
                    {/* SECTION 1: MANDATORY */}
                    <div style={styles.sectionHeader}>Required Information</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Client Name *</label>
                        <input style={styles.input} name="client_name" value={form.client_name} onChange={handleChange} required placeholder="e.g. John Doe" />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Company Name *</label>
                        <input style={styles.input} name="company_name" value={form.company_name} onChange={handleChange} required placeholder="e.g. Infosys Limited" />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Phone Number *</label>
                        <input style={styles.input} name="phone_number" value={form.phone_number} onChange={handleChange} required placeholder="9876543210" />
                    </div>

                    {/* SECTION 2: EMAILS & CORP INFO */}
                    <div style={styles.sectionHeader}>Contact & Corporate Info</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input style={styles.input} type="email" name="email" value={form.email} onChange={handleChange} placeholder="hr@client.com" />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Official Email</label>
                        <input style={styles.input} type="email" name="official_email" value={form.official_email} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Sending Email ID</label>
                        <input style={styles.input} type="email" name="sending_email_id" value={form.sending_email_id} onChange={handleChange} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Employee Count</label>
                        <input style={styles.input} type="number" name="company_employee_count" value={form.company_employee_count} onChange={handleChange} />
                    </div>

                    {/* SECTION 3: AGREEMENT STATUS */}
                    <div style={styles.sectionHeader}>Agreement Status</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>NDA Status</label>
                        <select style={styles.input} name="nda_status" value={form.nda_status} onChange={handleChange}>
                            <option value="NOT_SENT">Not Sent</option>
                            <option value="SENT">Sent</option>
                            <option value="SIGNED">Signed</option>
                        </select>
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>MSA Status</label>
                        <select style={styles.input} name="msa_status" value={form.msa_status} onChange={handleChange}>
                            <option value="NOT_SENT">Not Sent</option>
                            <option value="SENT">Sent</option>
                            <option value="SIGNED">Signed</option>
                        </select>
                    </div>

                    {/* SECTION 4: DOCUMENTS */}
                    <div style={styles.sectionHeader}>Documents</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>NDA Document</label>
                        <input style={styles.fileInput} type="file" onChange={(e) => handleFileChange(e, "nda_document")} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>MSA Document</label>
                        <input style={styles.fileInput} type="file" onChange={(e) => handleFileChange(e, "msa_document")} />
                    </div>

                    {/* SECTION 5: REMARK */}
                    <div style={{...styles.inputGroup, gridColumn: "1 / -1"}}>
                        <label style={styles.label}>Remark</label>
                        <textarea style={styles.textarea} name="remark" value={form.remark} onChange={handleChange} placeholder="Additional notes..."></textarea>
                    </div>
                </div>

                {/* Status Checkboxes */}
                <div style={styles.checkboxRow}>
                    <div style={styles.checkboxWrapper}>
                        <input type="checkbox" id="is_active" name="is_active" checked={form.is_active} onChange={handleChange} style={styles.checkbox} />
                        <label htmlFor="is_active" style={styles.checkLabel}>Is Active</label>
                    </div>
                    <div style={styles.checkboxWrapper}>
                        <input type="checkbox" id="is_verified" name="is_verified" checked={form.is_verified} onChange={handleChange} style={styles.checkbox} />
                        <label htmlFor="is_verified" style={styles.checkLabel}>Is Verified</label>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button type="submit" disabled={isSubmitting} style={{...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1}}>
                        {isSubmitting ? "Processing..." : "Create Client Profile"}
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
    card: { background: "#fff", borderRadius: "16px", padding: "35px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", maxWidth: "1100px", margin: "0 auto" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" },
    sectionHeader: { gridColumn: "1 / -1", fontSize: "14px", fontWeight: "800", color: "#FF9B51", marginTop: "25px", borderBottom: "1px solid #eee", paddingBottom: "5px", textTransform: "uppercase" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "13px", fontWeight: "700", color: "#25343F" },
    input: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none" },
    textarea: { padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", minHeight: "80px", outline: "none" },
    fileInput: { fontSize: "12px", color: "#666" },
    checkboxRow: { display: "flex", gap: "30px", marginTop: "30px", background: "#F8FAFC", padding: "15px", borderRadius: "10px" },
    checkboxWrapper: { display: "flex", alignItems: "center", gap: "8px" },
    checkbox: { width: "18px", height: "18px", cursor: "pointer", accentColor: "#FF9B51" },
    checkLabel: { fontWeight: "700", fontSize: "14px", color: "#25343F" },
    footer: { marginTop: "30px", textAlign: "right" },
    submitBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "14px 40px", borderRadius: "10px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(255,155,81,0.3)" }
};

export default AddClient;



