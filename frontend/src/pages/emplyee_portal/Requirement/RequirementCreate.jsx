import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import BaseLayout from "../../components/emp_base";

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
        skills: ""
    });

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    // Fetch Clients for Searchable Dropdown
    const fetchClients = async (search = "") => {
        try {
            const data = await apiRequest(`/employee-portal/clients/list/?search=${search}`, "GET");
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
            skills: form.skills
        };

        try {
            const response = await apiRequest("/jd-mapping/api/requirements/", "POST", payload);
            if (response) {
                notify("Requirement created successfully", "success");
                setTimeout(() => navigate("/employee/requirements"), 2000);
            }
        } catch (error) {
            notify("Error: Requirement could not be created.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BaseLayout>
            {toast.show && (
                <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
                    {toast.msg}
                </div>
            )}

            <div style={styles.headerRow}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                <h2 style={styles.pageTitle}>Add Requirement</h2>
                <div style={{ width: '80px' }}></div>
            </div>

            <form onSubmit={handleSubmit} style={styles.card}>
                <div style={styles.formGrid}>
                    
                    <div style={styles.sectionHeader}>Mandatory Details</div>
                    
                    {/* Job Title */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Job Title *</label>
                        <input style={styles.input} name="title" value={form.title} onChange={handleChange} required placeholder="Senior Python Developer" />
                    </div>

                    {/* Searchable Client Dropdown */}
                    <div style={{...styles.inputGroup, position: 'relative'}} ref={dropdownRef}>
                        <label style={styles.label}>Select Client *</label>
                        <div style={styles.searchWrapper}>
                            <input 
                                style={styles.input} 
                                placeholder={form.client_display_name || "Search & Select Client..."}
                                value={clientSearch}
                                onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                            />
                            {showDropdown && (
                                <div style={styles.dropdown}>
                                    {clients.length > 0 ? clients.map(c => (
                                        <div key={c.id} style={styles.dropdownItem} onClick={() => selectClient(c)}>
                                            <div style={{fontWeight: '700'}}>{c.client_name}</div>
                                            <div style={{fontSize: '11px', color: '#64748B'}}>{c.company_name}</div>
                                        </div>
                                    )) : <div style={styles.dropdownItem}>No clients found</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Experience Required *</label>
                        <input style={styles.input} name="experience_required" value={form.experience_required} onChange={handleChange} required placeholder="5-8 years" />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Rate *</label>
                        <input style={styles.input} name="rate" value={form.rate} onChange={handleChange} required placeholder="1.8 LPM" />
                    </div>

                    {/* <div style={styles.inputGroup}>
                        <label style={styles.label}>Vendor Budget Range *</label>
                        <input style={styles.input} name="vendor_budget_range" value={form.vendor_budget_range} onChange={handleChange} required placeholder="1.3 LPM - 1.6 LPM" />
                    </div> */}

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Vendor Budget Range *</label>
                        <input 
                            style={styles.input} 
                            name="vendor_budget_range" 
                            value={form.vendor_budget_range || ''} 
                            onChange={handleChange} required
                            placeholder="e.g., 1.3 LPM - 1.6 LPM" 
                        />
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


                    <div style={{...styles.inputGroup, gridColumn: "1 / -1"}}>
                        <label style={styles.label}>JD Description *</label>
                        <textarea style={styles.textarea} name="jd_description" value={form.jd_description} onChange={handleChange} required placeholder="Paste full JD here..."></textarea>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button type="submit" disabled={isSubmitting} style={{...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1}}>
                        {isSubmitting ? "Processing..." : "Create Requirement"}
                    </button>
                </div>
            </form>
        </BaseLayout>
    );
}

const styles = {
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700' },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", maxWidth: "1000px", margin: "0 auto 20px auto" },
    backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: '600' },
    pageTitle: { fontSize: "24px", color: "#25343F", fontWeight: "800" },
    card: { background: "#fff", borderRadius: "16px", padding: "30px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", maxWidth: "1000px", margin: "0 auto" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" },
    sectionHeader: { gridColumn: "1 / -1", fontSize: "13px", fontWeight: "800", color: "#FF9B51", borderBottom: "1px solid #eee", paddingBottom: "5px", textTransform: "uppercase" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
    label: { fontSize: "12px", fontWeight: "700", color: "#25343F" },
    input: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none" },
    textarea: { padding: "12px", borderRadius: "8px", border: "1px solid #CBD5E1", minHeight: "150px", outline: "none", fontSize: "14px" },
    searchWrapper: { position: 'relative' },
    dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' },
    dropdownItem: { padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' },
    footer: { marginTop: "30px", textAlign: "right" },
    submitBtn: { background: "#FF9B51", color: "#fff", border: "none", padding: "12px 35px", borderRadius: "10px", fontSize: "15px", fontWeight: "800", cursor: "pointer" }
};

export default RequirementCreate;