import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";

function UpdateClient() {
    const navigate = useNavigate();
    const { id: clientId } = useParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    // Files state
    const [files, setFiles] = useState({
        nda_document: null,
        msa_document: null
    });

    // Existing file names (server pe jo already h)
    const [existingFiles, setExistingFiles] = useState({
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
        nda_status: "NOT_SENT",
        msa_status: "NOT_SENT"
    });

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        return { "Authorization": `Bearer ${token}` };
    };

    // Existing client data fetch karo
    useEffect(() => {
        const fetchClient = async () => {
            setIsFetching(true);
            try {
                const response = await apiRequest(
                    `/employee-portal/api/clients/${clientId}/`,
                    "GET",
                    null,
                    getAuthHeaders()
                );
                const data = response;
                setForm({
                    client_name: data.client_name || "",
                    company_name: data.company_name || "",
                    phone_number: data.phone_number || "",
                    email: data.email || "",
                    official_email: data.official_email || "",
                    sending_email_id: data.sending_email_id || "",
                    company_employee_count: data.company_employee_count || "",
                    remark: data.remark || "",
                    nda_status: data.nda_status || "NOT_SENT",
                    msa_status: data.msa_status || "NOT_SENT"
                });
                // Existing file names save karo dikhane ke liye
                setExistingFiles({
                    nda_document: data.nda_document || null,
                    msa_document: data.msa_document || null
                });
            } catch (error) {
                notify("Error fetching client data.", "error");
            } finally {
                setIsFetching(false);
            }
        };
        fetchClient();
    }, [clientId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleFileChange = (e, key) => {
        setFiles({ ...files, [key]: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        const formData = new FormData();

        // Sirf wahi fields append karo jo form mein hain (is_active, is_verified nahi)
        Object.keys(form).forEach((key) => {
            const val = form[key];
            if (val !== null && val !== undefined && val !== "") {
                formData.append(key, val);
            }
        });

        // Files: sirf naye selected files append karo
        if (files.nda_document) formData.append("nda_document", files.nda_document);
        if (files.msa_document) formData.append("msa_document", files.msa_document);

        try {
            await apiRequest(
                `/employee-portal/api/clients/${clientId}/update/`,
                "PATCH",
                formData,
                getAuthHeaders()
            );
            notify("Client Updated Successfully!");
            setTimeout(() => navigate(-1), 1500);
        } catch (error) {
            notify("Error: Client could not be updated.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // File name extract karne ke liye helper
    const getFileName = (url) => {
        if (!url) return null;
        return url.split("/").pop();
    };

    if (isFetching) {
        return (
            <BaseLayout>
                <div style={styles.loadingWrapper}>
                    <div style={styles.loadingText}>Loading client data...</div>
                </div>
            </BaseLayout>
        );
    }

    return (
        <BaseLayout>
            {/* Toast Notification */}
            {toast.show && (
                <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60" }}>
                    {toast.msg}
                </div>
            )}

            <div style={styles.headerRow}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                <h2 style={styles.pageTitle}>Update Client</h2>
                <div style={{ width: "100px" }}></div>
            </div>

            <form onSubmit={handleSubmit} style={styles.card}>
                <div style={styles.formGrid}>

                    {/* SECTION 1: REQUIRED */}
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

                    {/* SECTION 2: CONTACT & CORPORATE */}
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
                        {existingFiles.nda_document && !files.nda_document && (
                            <div style={styles.existingFile}>
                                📎 Current: <a href={existingFiles.nda_document} target="_blank" rel="noreferrer" style={styles.fileLink}>{getFileName(existingFiles.nda_document)}</a>
                            </div>
                        )}
                        <input style={styles.fileInput} type="file" onChange={(e) => handleFileChange(e, "nda_document")} />
                        {files.nda_document && <div style={styles.newFileNote}>✓ New file selected: {files.nda_document.name}</div>}
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>MSA Document</label>
                        {existingFiles.msa_document && !files.msa_document && (
                            <div style={styles.existingFile}>
                                📎 Current: <a href={existingFiles.msa_document} target="_blank" rel="noreferrer" style={styles.fileLink}>{getFileName(existingFiles.msa_document)}</a>
                            </div>
                        )}
                        <input style={styles.fileInput} type="file" onChange={(e) => handleFileChange(e, "msa_document")} />
                        {files.msa_document && <div style={styles.newFileNote}>✓ New file selected: {files.msa_document.name}</div>}
                    </div>

                    {/* SECTION 5: REMARK */}
                    <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                        <label style={styles.label}>Remark</label>
                        <textarea style={styles.textarea} name="remark" value={form.remark} onChange={handleChange} placeholder="Additional notes..."></textarea>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        style={styles.cancelBtn}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1 }}
                    >
                        {isSubmitting ? "Updating..." : "Update Client Profile"}
                    </button>
                </div>
            </form>
        </BaseLayout>
    );
}

const styles = {
    toast: { position: "fixed", top: "85px", right: "20px", color: "#fff", padding: "12px 25px", borderRadius: "8px", zIndex: 9999, fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
    loadingWrapper: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" },
    loadingText: { fontSize: "18px", color: "#25343F", fontWeight: "700" },
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
    fileInput: { fontSize: "12px", color: "#666", marginTop: "4px" },
    existingFile: { fontSize: "12px", color: "#64748B", background: "#F8FAFC", padding: "6px 10px", borderRadius: "6px", border: "1px solid #E2E8F0" },
    fileLink: { color: "#FF9B51", fontWeight: "600", textDecoration: "none" },
    newFileNote: { fontSize: "11px", color: "#27AE60", fontWeight: "600" },
    footer: { marginTop: "30px", display: "flex", justifyContent: "flex-end", gap: "12px" },
    cancelBtn: { background: "#F1F5F9", color: "#25343F", border: "none", padding: "14px 30px", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
    submitBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "14px 40px", borderRadius: "10px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(255,155,81,0.3)" }
};

export default UpdateClient;