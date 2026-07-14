import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import BaseLayout from "../../components/emp_base";

const Icons = {
  Back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>,
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>,
  File: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>,
  Mail: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B2C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>,
};

function RequirementCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    // Client Dropdown States
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const [form, setForm] = useState({
        title: "",
        client_id: "", // API will receive this
        client_display_name: "", // Only for UI
        experience_required: "",
        rate: "",
        vendor_budget_range: "",
        time_zone: "IST",
        jd_description: "",
        skills: "",
        profiles_for_requirement: 3
    });

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    // Fetch Clients for Searchable Dropdown
    const fetchClients = async (search = "") => {
        try {
            const data = await apiRequest(`/employee-portal/api/clients/list/?search=${search}`, "GET");
            setClients(data.results || []);
        } catch (error) {
            console.error("Error fetching clients:", error);
        }
    };

    useEffect(() => {
        fetchClients("");
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (showDropdown) fetchClients(clientSearch);
        }, 400);
        return () => clearTimeout(delayDebounce);
    }, [clientSearch, showDropdown]);

    // Handle Click Outside Dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const selectClient = (client) => {
        setForm({ 
            ...form, 
            client_id: client.id, 
            client_display_name: `${client.client_name} (${client.company_name})` 
        });
        setClientSearch("");
        setShowDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.client_id) return notify("Please select a client from the list", "error");
        if (isSubmitting) return;

        setIsSubmitting(true);
        
        // Payload as per your API requirement
        const payload = {
            title: form.title,
            client_id: parseInt(form.client_id),
            experience_required: form.experience_required,
            rate: form.rate,
            vendor_budget_range: form.vendor_budget_range || "",
            time_zone: form.time_zone,
            jd_description: form.jd_description,
            skills: form.skills,
            profiles_for_requirement: parseInt(form.profiles_for_requirement) || 3
        };

        try {
            const response = await apiRequest("/jd-mapping/api/requirements/", "POST", payload);
            if (response) {
                notify("Requirement created successfully", "success");
                setTimeout(() => navigate("/employee/requirements/my?type"), 2000);
            }
        } catch (error) {
            notify("Error: Requirement could not be created.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const completedCount = [form.title, form.client_id, form.experience_required, form.rate, form.jd_description].filter(Boolean).length;

    return (
        <BaseLayout>
            {toast.show && <div style={{...styles.toast, backgroundColor: toast.type === "error" ? "#E74C3C" : "#27AE60"}}>{toast.msg}</div>}
            <div style={styles.pageShell}>
                <div style={styles.hero}>
                    <div style={styles.heroLeft}><button type="button" onClick={() => navigate(-1)} style={styles.backBtn}><Icons.Back /></button><div><h2 style={styles.pageTitle}>Add Requirement</h2><p style={styles.pageSubtitle}>Create a compact ATS-style requirement for the pipeline.</p></div></div>
                    <div style={styles.progressBox}><div style={styles.progressText}>{completedCount} / 5 required done</div><div style={styles.progressTrack}><div style={{...styles.progressFill, width: `${(completedCount / 5) * 100}%`}} /></div></div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={styles.layoutGrid}>
                        <div style={styles.formGrid}>
                            <div style={styles.sectionCard}><div style={styles.sectionHeader}><div style={styles.sectionIcon}><Icons.File /></div><div><h3 style={styles.sectionTitle}>Requirement details</h3><p style={styles.sectionHint}>Client, role, experience and rate basics.</p></div></div><div style={styles.innerGrid}>
                                <div style={{...styles.inputGroup, ...styles.col6}}><label style={styles.label}>Job Title<span style={styles.requiredDot}>●</span></label><div style={styles.inputShell}><input style={styles.input} name="title" value={form.title} onChange={handleChange} required placeholder="Senior Python Developer" /></div></div>
                                <div style={{...styles.inputGroup, ...styles.col6}} ref={dropdownRef}><label style={styles.label}>Select Client<span style={styles.requiredDot}>●</span></label><div style={styles.inputShell}><input style={styles.input} placeholder={form.client_display_name || "Search & select client..."} value={clientSearch} onChange={(e) => { setClientSearch(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} /></div>{showDropdown && (<div style={styles.dropdown}>{clients.length > 0 ? clients.map(c => (<div key={c.id} style={styles.dropdownItem} onClick={() => selectClient(c)}><div style={{fontWeight: "900", color: "#20242A"}}>{c.client_name}</div><div style={{fontSize: "12px", color: "#64748B", fontWeight: "700"}}>{c.company_name}</div></div>)) : <div style={styles.dropdownItem}>No clients found</div>}</div>)}</div>
                                <div style={{...styles.inputGroup, ...styles.col4}}><label style={styles.label}>Experience Required<span style={styles.requiredDot}>●</span></label><div style={styles.inputShell}><input style={styles.input} name="experience_required" value={form.experience_required} onChange={handleChange} required placeholder="5-8 years" /></div></div>
                                <div style={{...styles.inputGroup, ...styles.col4}}><label style={styles.label}>Rate<span style={styles.requiredDot}>●</span></label><div style={styles.inputShell}><input style={styles.input} name="rate" value={form.rate} onChange={handleChange} required placeholder="1.2 LPM" /></div></div>
                                <div style={{...styles.inputGroup, ...styles.col4}}><label style={styles.label}>Vendor Budget<span style={styles.requiredDot}>●</span></label><div style={styles.inputShell}><input style={styles.input} name="vendor_budget_range" value={form.vendor_budget_range} onChange={handleChange} required placeholder="e.g., 1.3 LPM" /></div></div>
                                <div style={{...styles.inputGroup, ...styles.col4}}><label style={styles.label}>Profiles Req.<span style={styles.requiredDot}>●</span></label><div style={styles.inputShell}><input style={styles.input} type="number" min="1" name="profiles_for_requirement" value={form.profiles_for_requirement} onChange={handleChange} required placeholder="3" /></div></div>
                                <div style={{...styles.inputGroup, ...styles.col4}}><label style={styles.label}>Time Zone</label><div style={styles.inputShell}><select style={styles.select} name="time_zone" value={form.time_zone} onChange={handleChange}><option value="IST">IST</option><option value="UST">UST</option><option value="EST">EST</option><option value="PST">PST</option><option value="GMT">GMT</option><option value="OTHER">OTHER</option></select></div></div>
                            </div></div>
                            <div style={styles.sectionCard}><div style={styles.sectionHeader}><div style={styles.sectionIcon}><Icons.File /></div><div><h3 style={styles.sectionTitle}>JD Description</h3><p style={styles.sectionHint}>Paste the complete requirement details.</p></div></div><div style={styles.textareaShell}><textarea style={styles.textarea} name="jd_description" value={form.jd_description} onChange={handleChange} required placeholder="Paste full JD here..." /></div></div>
                        </div>
                        <div style={styles.sideCard}><div style={styles.previewKicker}>Live Preview</div><h3 style={styles.previewTitle}>{form.title || "New requirement"}</h3><div style={styles.previewSub}>{form.client_display_name || "Client will show here"}</div><div style={styles.previewList}><div style={styles.previewRow}><span>Experience</span><b>{form.experience_required || "—"}</b></div><div style={styles.previewRow}><span>Rate</span><b>{form.rate || "—"}</b></div><div style={styles.previewRow}><span>Time zone</span><b>{form.time_zone || "—"}</b></div><div style={{...styles.previewRow, borderBottom: "none"}}><span>JD</span><b>{form.jd_description ? "Added" : "Pending"}</b></div></div></div>
                    </div>
                    <div style={styles.footerBar}><div style={styles.footerHint}>{completedCount} / 5 required done</div><button type="submit" disabled={isSubmitting} style={{...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1}}>{isSubmitting ? "Processing..." : "Create Requirement"}</button></div>
                </form>
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

export default RequirementCreate;