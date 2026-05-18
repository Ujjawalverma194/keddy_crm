import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import BaseLayout from "../../components/emp_base";

function RequirementUpdate() {
    const { id } = useParams(); // URL se requirement id nikalne ke liye
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    // Client Dropdown States
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const [form, setForm] = useState({
        title: "",
        client_id: "",
        client_display_name: "",
        experience_required: "",
        rate: "",
        vendor_budget_range: "",
        time_zone: "IST",
        jd_description: "",
        skills: ""
    });

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    // 1. Fetch Existing Requirement Data
    useEffect(() => {
        const fetchRequirementData = async () => {
            try {
                // Yahan hum detail fetch karenge (Umid hai aapke paas detail API hogi)
                // Agar detail API alag hai toh path change kar lena
                const response = await apiRequest(`/jd-mapping/api/requirements/${id}/`, "GET");
                // API returns wrapper { success, message, data }
                const data = response && response.success ? response.data : response;
                if (data) {
                    setForm({
                        title: data.title || "",
                        client_id: data.client_details?.id || data.client_id || "", 
                        client_display_name: data.client_details ? `${data.client_details.name} (${data.client_details.company_name || ''})` : (data.client || ""),
                        experience_required: data.experience_required || "",
                        rate: data.rate || "",
                        vendor_budget_range: data.vendor_budget_range || "",
                        time_zone: data.time_zone || "IST",
                        jd_description: data.jd_description || "",
                        skills: data.skills || ""
                    });
                }
            } catch (error) {
                console.error("Error fetching requirement:", error);
                notify("Failed to load requirement data", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchRequirementData();
    }, [id]);

    // 2. Client Search Logic
    const fetchClients = async (search = "") => {
        try {
            const data = await apiRequest(`/employee-portal/clients/list/?search=${search}`, "GET");
            setClients(data.results || []);
        } catch (error) {
            console.error("Error fetching clients:", error);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (showDropdown) fetchClients(clientSearch);
        }, 400);
        return () => clearTimeout(delayDebounce);
    }, [clientSearch, showDropdown]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
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
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        const payload = {
            title: form.title,
            client_id: parseInt(form.client_id),
            experience_required: form.experience_required,
            rate: form.rate,
            vendor_budget_range: form.vendor_budget_range || "",
            time_zone: form.time_zone,
            jd_description: form.jd_description,
            skills: form.skills
        };

        try {
            // PUT request as per your requirement
            const response = await apiRequest(`/jd-mapping/api/requirements/${id}/update/`, "PUT", payload);
            if (response && response.success) {
                notify("Requirement updated successfully", "success");
                setTimeout(() => navigate("/employee/requirements"), 1500);
            }
        } catch (error) {
            notify("Error: Update failed.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <BaseLayout><div style={{textAlign: 'center', padding: '50px'}}>Loading Requirement Data...</div></BaseLayout>;

    return (
        <BaseLayout>
            {toast.show && (
                <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
                    {toast.msg}
                </div>
            )}

            <div style={styles.headerRow}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Cancel</button>
                <h2 style={styles.pageTitle}>Update Requirement</h2>
                <div style={{ width: '80px' }}></div>
            </div>

            <form onSubmit={handleSubmit} style={styles.card}>
                <div style={styles.formGrid}>
                    <div style={styles.sectionHeader}>Edit Information</div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Job Title *</label>
                        <input style={styles.input} name="title" value={form.title} onChange={handleChange} required />
                    </div>

                    <div style={{...styles.inputGroup, position: 'relative'}} ref={dropdownRef}>
                        <label style={styles.label}>Client *</label>
                        <div style={styles.searchWrapper}>
                            <input 
                                style={styles.input} 
                                placeholder={form.client_display_name || "Select Client..."}
                                value={clientSearch}
                                onChange={(e) => { setClientSearch(e.target.value); setShowDropdown(true); }}
                                onFocus={() => setShowDropdown(true)}
                            />
                            {showDropdown && (
                                <div style={styles.dropdown}>
                                    {clients.length > 0 ? clients.map(c => (
                                        <div key={c.id} style={styles.dropdownItem} onClick={() => selectClient(c)}>
                                            <div style={{fontWeight: '700'}}>{c.client_name}</div>
                                            <div style={{fontSize: '11px'}}>{c.company_name}</div>
                                        </div>
                                    )) : <div style={styles.dropdownItem}>Search for clients...</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Experience Required *</label>
                        <input style={styles.input} name="experience_required" value={form.experience_required} onChange={handleChange} required />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Rate *</label>
                        <input style={styles.input} name="rate" value={form.rate} onChange={handleChange} required />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Vendor Budget Range *</label>
                        <input style={styles.input} name="vendor_budget_range" value={form.vendor_budget_range || ''} onChange={handleChange} placeholder="e.g., 1.3 LPM - 1.6 LPM" />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Time Zone</label>
                        <select style={styles.input} name="time_zone" value={form.time_zone} onChange={handleChange}>
                            <option value="IST">IST</option>
                            <option value="UST">UST</option>
                            <option value="EST">EST</option>
                            <option value="PST">PST</option>
                            <option value="GMT">GMT</option>
                            <option value="OTHER">OTHER</option>
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Skills</label>
                        <input style={styles.input} name="skills" value={form.skills} onChange={handleChange} />
                    </div>

                    <div style={{...styles.inputGroup, gridColumn: "1 / -1"}}>
                        <label style={styles.label}>JD Description *</label>
                        <textarea style={styles.textarea} name="jd_description" value={form.jd_description} onChange={handleChange} required></textarea>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button type="submit" disabled={isSubmitting} style={{...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1}}>
                        {isSubmitting ? "Updating..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </BaseLayout>
    );
}

const styles = {
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700' },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", maxWidth: "1000px", margin: "0 auto 20px auto" },
    backBtn: { background: "#64748B", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer" },
    pageTitle: { fontSize: "24px", color: "#25343F", fontWeight: "800" },
    card: { background: "#fff", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", maxWidth: "1000px", margin: "0 auto" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" },
    sectionHeader: { gridColumn: "1 / -1", fontSize: "13px", fontWeight: "800", color: "#FF9B51", borderBottom: "1px solid #eee", paddingBottom: "5px", textTransform: "uppercase" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
    label: { fontSize: "12px", fontWeight: "700", color: "#25343F" },
    input: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none" },
    textarea: { padding: "12px", borderRadius: "8px", border: "1px solid #CBD5E1", minHeight: "150px", outline: "none" },
    searchWrapper: { position: 'relative' },
    dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', zIndex: 10, maxHeight: '200px', overflowY: 'auto' },
    dropdownItem: { padding: '10px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' },
    footer: { marginTop: "30px", textAlign: "right" },
    submitBtn: { background: "#25343F", color: "#fff", border: "none", padding: "12px 35px", borderRadius: "10px", fontWeight: "800", cursor: "pointer" }
};

export default RequirementUpdate;