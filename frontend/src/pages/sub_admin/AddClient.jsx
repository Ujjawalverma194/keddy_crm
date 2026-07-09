import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";


const Icons = {
    Back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>,
    User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 1 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>,
    File: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>,
    Mail: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
};

function AddClient() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });
    const [duplicateClient, setDuplicateClient] = useState(null);

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

    useEffect(() => {
        const checkDuplicate = async () => {
            if (form.client_name || form.company_name || form.phone_number) {
                try {
                    const data = await apiRequest("/employee-portal/clients/check-duplicate/", "POST", {
                        client_name: form.client_name,
                        company_name: form.company_name,
                        phone_number: form.phone_number
                    });
                    if (data && data.duplicate) {
                        setDuplicateClient(data.client);
                    } else {
                        setDuplicateClient(null);
                    }
                } catch (error) {
                    console.error("Failed to check duplicate client", error);
                }
            } else {
                setDuplicateClient(null);
            }
        };

        const timerId = setTimeout(() => {
            checkDuplicate();
        }, 800);

        return () => clearTimeout(timerId);
    }, [form.client_name, form.company_name, form.phone_number]);

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

    const completedCount = [form.client_name, form.company_name, form.phone_number].filter(Boolean).length;

    return (
        <BaseLayout>
            {toast.show && <div style={{ ...styles.toast, backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60" }}>{toast.msg}</div>}

            {duplicateClient && (
                <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, background: '#FEF2F2', border: '1px solid #F87171', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div>
                        <h4 style={{ margin: 0, color: '#991B1B', fontSize: '16px' }}>Client already exists!</h4>
                        <p style={{ margin: '4px 0 0', color: '#B91C1C', fontSize: '14px' }}>A client named <strong>{duplicateClient.client_name}</strong> from <strong>{duplicateClient.company_name}</strong> already exists.</p>
                    </div>
                    <button type="button" onClick={() => navigate(`/sub-admin/clients`)} style={{ padding: '8px 16px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        View Existing Client
                    </button>
                </div>
            )}

            <div style={styles.pageShell}>
                <div style={styles.hero}><div style={styles.heroLeft}><button type="button" onClick={() => navigate(-1)} style={styles.backBtn}><Icons.Back /></button><div><h2 style={styles.pageTitle}>Add New Client</h2><p style={styles.pageSubtitle}>Create a compact client profile with documents and agreement status.</p></div></div><div style={styles.progressBox}><div style={styles.progressText}>{completedCount} / 3 required done</div><div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${(completedCount / 3) * 100}%` }} /></div></div></div>
                <form onSubmit={handleSubmit}><div style={styles.layoutGrid}><div style={styles.formGrid}>
                    <div style={styles.sectionCard}><div style={styles.sectionHeader}><div style={styles.sectionIcon}><Icons.User /></div><div><h3 style={styles.sectionTitle}>Client basics</h3><p style={styles.sectionHint}>Required profile information.</p></div></div><div style={styles.innerGrid}><div style={{ ...styles.inputGroup, ...styles.col4 }}><label style={styles.label}>Client Name<span style={styles.requiredDot}>●</span></label><div style={styles.inputShell}><input style={styles.input} name="client_name" value={form.client_name} onChange={handleChange} required placeholder="e.g. John Doe" /></div></div><div style={{ ...styles.inputGroup, ...styles.col4 }}><label style={styles.label}>Company Name<span style={styles.requiredDot}>●</span></label><div style={styles.inputShell}><input style={styles.input} name="company_name" value={form.company_name} onChange={handleChange} required placeholder="e.g. Infosys Limited" /></div></div><div style={{ ...styles.inputGroup, ...styles.col4 }}><label style={styles.label}>Phone Number<span style={styles.requiredDot}>●</span></label><div style={styles.inputShell}><input style={styles.input} name="phone_number" value={form.phone_number} onChange={handleChange} required placeholder="9876543210" /></div></div></div></div>
                    <div style={styles.sectionCard}><div style={styles.sectionHeader}><div style={styles.sectionIcon}><Icons.Mail /></div><div><h3 style={styles.sectionTitle}>Contact & corporate info</h3><p style={styles.sectionHint}>Email channels and company metadata.</p></div></div><div style={styles.innerGrid}><div style={{ ...styles.inputGroup, ...styles.col6 }}><label style={styles.label}>Email Address</label><div style={styles.inputShell}><input style={styles.input} type="email" name="email" value={form.email} onChange={handleChange} placeholder="hr@client.com" /></div></div><div style={{ ...styles.inputGroup, ...styles.col6 }}><label style={styles.label}>Official Email</label><div style={styles.inputShell}><input style={styles.input} type="email" name="official_email" value={form.official_email} onChange={handleChange} /></div></div><div style={{ ...styles.inputGroup, ...styles.col6 }}><label style={styles.label}>Sending Email ID</label><div style={styles.inputShell}><input style={styles.input} type="email" name="sending_email_id" value={form.sending_email_id} onChange={handleChange} /></div></div><div style={{ ...styles.inputGroup, ...styles.col6 }}><label style={styles.label}>Employee Count</label><div style={styles.inputShell}><input style={styles.input} type="number" name="company_employee_count" value={form.company_employee_count} onChange={handleChange} /></div></div></div></div>
                    <div style={styles.sectionCard}><div style={styles.sectionHeader}><div style={styles.sectionIcon}><Icons.File /></div><div><h3 style={styles.sectionTitle}>Agreements & documents</h3><p style={styles.sectionHint}>Upload NDA/MSA and track status.</p></div></div><div style={styles.innerGrid}><div style={{ ...styles.inputGroup, ...styles.col6 }}><label style={styles.label}>NDA Status</label><div style={styles.inputShell}><select style={styles.select} name="nda_status" value={form.nda_status} onChange={handleChange}><option value="NOT_SENT">Not Sent</option><option value="SENT">Sent</option><option value="SIGNED">Signed</option></select></div></div><div style={{ ...styles.inputGroup, ...styles.col6 }}><label style={styles.label}>MSA Status</label><div style={styles.inputShell}><select style={styles.select} name="msa_status" value={form.msa_status} onChange={handleChange}><option value="NOT_SENT">Not Sent</option><option value="SENT">Sent</option><option value="SIGNED">Signed</option></select></div></div><div style={{ ...styles.inputGroup, ...styles.col6 }}><label style={styles.label}>NDA Document</label><div style={styles.inputShell}><input style={styles.input} type="file" onChange={(e) => handleFileChange(e, "nda_document")} /></div></div><div style={{ ...styles.inputGroup, ...styles.col6 }}><label style={styles.label}>MSA Document</label><div style={styles.inputShell}><input style={styles.input} type="file" onChange={(e) => handleFileChange(e, "msa_document")} /></div></div><div style={{ ...styles.inputGroup, ...styles.col12 }}><label style={styles.label}>Remark</label><div style={styles.textareaShell}><textarea style={styles.textarea} name="remark" value={form.remark} onChange={handleChange} placeholder="Additional notes..." /></div></div></div></div>
                </div><div style={styles.sideCard}><div style={styles.previewKicker}>Live Preview</div><h3 style={styles.previewTitle}>{form.client_name || "New client"}</h3><div style={styles.previewSub}>{form.company_name || "Company will show here"}</div><div style={styles.previewList}><div style={styles.previewRow}><span>Phone</span><b>{form.phone_number || "—"}</b></div><div style={styles.previewRow}><span>Email</span><b>{form.official_email || form.email || "—"}</b></div><div style={styles.previewRow}><span>NDA</span><b>{form.nda_status}</b></div><div style={styles.previewRow}><span>MSA</span><b>{form.msa_status}</b></div><div style={{ ...styles.previewRow, borderBottom: "none" }}><span>Status</span><b>{form.is_active ? "Active" : "Inactive"}</b></div></div><div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}><label style={{ ...styles.previewRow, border: "1px solid #E8ECF2", borderRadius: "12px", padding: "10px 12px", cursor: "pointer" }}><input type="checkbox" id="is_active" name="is_active" checked={form.is_active} onChange={handleChange} style={{ accentColor: "#FF6B2C" }} /> <span>Is Active</span></label><label style={{ ...styles.previewRow, border: "1px solid #E8ECF2", borderRadius: "12px", padding: "10px 12px", cursor: "pointer" }}><input type="checkbox" id="is_verified" name="is_verified" checked={form.is_verified} onChange={handleChange} style={{ accentColor: "#FF6B2C" }} /> <span>Is Verified</span></label></div></div>
                </div><div style={styles.footerBar}><div style={styles.footerHint}>{completedCount} / 3 required done</div><button type="submit" disabled={isSubmitting} style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1 }}>{isSubmitting ? "Processing..." : "Create Client Profile"}</button></div></form>
            </div>
        </BaseLayout>
    );

}


const styles = {
    toast: { position: "fixed", top: "85px", right: "20px", color: "#fff", padding: "12px 25px", borderRadius: "10px", zIndex: 9999, fontWeight: "800", boxShadow: "0 14px 30px rgba(15,23,42,0.18)" },
    pageShell: { width: "100%", maxWidth: "1260px", margin: "0 auto", padding: "26px 18px 98px", boxSizing: "border-box" },
    hero: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "18px", marginBottom: "18px" },
    heroLeft: { display: "flex", alignItems: "center", gap: "14px" },
    backBtn: { width: "44px", height: "44px", borderRadius: "14px", border: "1px solid #E9EDF3", background: "#fff", color: "#25343F", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 10px 24px rgba(15,23,42,0.06)" },
    pageTitle: { margin: 0, color: "#20242A", fontSize: "28px", fontWeight: "900", letterSpacing: "-0.8px" },
    pageSubtitle: { margin: "4px 0 0", color: "#85878E", fontSize: "14px", fontWeight: "600" },
    progressBox: { minWidth: "210px", background: "#fff", border: "1px solid #EEF1F5", borderRadius: "16px", padding: "12px 14px", boxShadow: "0 10px 28px rgba(15,23,42,0.05)" },
    progressText: { color: "#5E6470", fontSize: "12px", fontWeight: "800", marginBottom: "8px" },
    progressTrack: { height: "7px", borderRadius: "999px", background: "#EEF1F5", overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #FF9B51, #FF5E2F)", transition: "width 0.25s ease" },
    layoutGrid: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: "24px", alignItems: "start" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "16px" },
    sectionCard: { gridColumn: "span 12", background: "#fff", borderRadius: "22px", padding: "20px 22px", border: "1px solid #EEF1F5", boxShadow: "0 18px 42px rgba(15,23,42,0.055)" },
    sectionHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
    sectionIcon: { width: "38px", height: "38px", borderRadius: "14px", background: "#FFF2EA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    sectionTitle: { margin: 0, color: "#20242A", fontSize: "18px", fontWeight: "900", letterSpacing: "-0.35px" },
    sectionHint: { margin: "2px 0 0", color: "#85878E", fontSize: "13px", fontWeight: "600" },
    innerGrid: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "14px" },
    col4: { gridColumn: "span 4" }, col6: { gridColumn: "span 6" }, col12: { gridColumn: "span 12" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "7px", position: "relative" },
    label: { color: "#24272D", fontSize: "13px", fontWeight: "900" },
    requiredDot: { color: "#FF5E2F", marginLeft: "5px" },
    inputShell: { minHeight: "50px", borderRadius: "14px", border: "1px solid #E8ECF2", background: "#fff", display: "flex", alignItems: "center", gap: "10px", padding: "0 14px", boxSizing: "border-box" },
    input: { width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#20242A", background: "transparent", fontWeight: "600", boxSizing: "border-box" },
    select: { width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#20242A", background: "transparent", fontWeight: "700", cursor: "pointer" },
    textareaShell: { borderRadius: "16px", border: "1px solid #E8ECF2", background: "#fff", padding: "13px 14px", boxSizing: "border-box" },
    textarea: { width: "100%", minHeight: "110px", resize: "vertical", border: "none", outline: "none", fontSize: "14px", color: "#20242A", lineHeight: "1.55", fontWeight: "600", background: "transparent", boxSizing: "border-box" },
    dropdown: { position: "absolute", top: "78px", left: 0, right: 0, background: "#fff", border: "1px solid #E2E8F0", borderRadius: "14px", boxShadow: "0 18px 40px rgba(15,23,42,0.15)", zIndex: 30, maxHeight: "230px", overflowY: "auto", padding: "6px" },
    dropdownItem: { padding: "11px 12px", cursor: "pointer", borderRadius: "10px" },
    sideCard: { position: "sticky", top: "88px", background: "#fff", borderRadius: "22px", padding: "22px", border: "1px solid #EEF1F5", borderTop: "5px solid #FF6B2C", boxShadow: "0 18px 42px rgba(15,23,42,0.08)" },
    previewKicker: { color: "#8A8D94", fontSize: "12px", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", borderBottom: "1px solid #E8ECF2", paddingBottom: "10px", marginBottom: "18px" },
    previewTitle: { margin: "0 0 5px", color: "#20242A", fontSize: "22px", fontWeight: "900", opacity: 0.88 },
    previewSub: { color: "#7B7E86", fontSize: "14px", fontWeight: "700", marginBottom: "18px" },
    previewList: { border: "1px solid #E8ECF2", borderRadius: "16px", overflow: "hidden" },
    previewRow: { display: "flex", justifyContent: "space-between", gap: "12px", padding: "13px 14px", borderBottom: "1px solid #EEF1F5", color: "#7B7E86", fontSize: "14px", fontWeight: "700" },
    footerBar: { position: "sticky", bottom: 0, zIndex: 20, marginTop: "18px", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)", borderTop: "1px solid #EEF1F5", padding: "16px 0 0", display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" },
    footerHint: { color: "#7B7E86", fontSize: "13px", fontWeight: "800" },
    submitBtn: { minWidth: "210px", border: "none", borderRadius: "15px", background: "linear-gradient(135deg, #FF9B51, #FF5E2F)", color: "#fff", padding: "14px 30px", fontSize: "15px", fontWeight: "900", cursor: "pointer", boxShadow: "0 12px 28px rgba(255, 94, 47, 0.32)" },
};

export default AddClient;