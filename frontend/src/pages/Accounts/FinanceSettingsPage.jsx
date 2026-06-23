import React, { useState, useEffect } from "react";
import { apiRequest } from "../../services/api";
import AccountsBaseLayout from "../components/AccountsBaseLayout";

// Toaster Component
const Toaster = ({ msg, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div style={{
            ...styles.toaster,
            backgroundColor: type === 'error' ? '#EF4444' : '#10B981'
        }}>
            {msg}
        </div>
    );
};

const FinanceSettingsPage = () => {
    const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
    const [settings, setSettings] = useState({
        company_name: "",
        address: "",
        gstin: "",
        default_gst_rate: "18.00",
        phone: "",
        email: "",
        default_sac_code: "",
        default_terms: ""
    });

    const [logo, setLogo] = useState(null);
    const [signature, setSignature] = useState(null);

    const [bank, setBank] = useState({
        account_holder_name: "",
        bank_name: "",
        account_number: "",
        ifsc_code: "",
        branch: ""
    });

    const [loading, setLoading] = useState(false);

    const notify = (msg, type = "success") => setToast({ show: true, msg, type });

    // ================= FETCH SETTINGS =================
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await apiRequest("/invoice/api/settings/", "GET");

                if (data) {
                    setSettings({
                        company_name: data.company_name || "",
                        address: data.address || "",
                        gstin: data.gstin || "",
                        default_gst_rate: data.default_gst_rate || "18.00",
                        phone: data.phone || "",
                        email: data.email || "",
                        default_sac_code: data.default_sac_code || "",
                        default_terms: data.default_terms || ""
                    });
                }

            } catch (err) {
                console.error("Error fetching settings", err);
            }
        };

        fetchSettings();
    }, []);

    // ================= UPDATE SETTINGS =================
    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();

        Object.keys(settings).forEach(key => {
            if (settings[key]) {
                formData.append(key, settings[key]);
            }
        });

        if (logo instanceof File) formData.append("logo", logo);
        if (signature instanceof File) formData.append("signature", signature);

        try {
            await apiRequest("/invoice/api/settings/", "PUT", formData);
            notify("Company settings updated!");
        } catch {
            notify("Settings update failed", "error");
        }

        setLoading(false);
    };

    // ================= ADD BANK =================
    const handleBankSubmit = async (e) => {
        e.preventDefault();

        try {
            await apiRequest("/invoice/api/bank-accounts/", "POST", bank);

            notify("Bank Account added!");

            setBank({
                account_holder_name: "",
                bank_name: "",
                account_number: "",
                ifsc_code: "",
                branch: ""
            });

        } catch {
            notify("Bank add failed", "error");
        }
    };

    return (
        <AccountsBaseLayout>
            {toast.show && <Toaster msg={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>

                {/* COMPANY SETTINGS */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Company Settings</h3>

                    <form onSubmit={handleSettingsSubmit}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Company Name *</label>
                            <input required style={styles.input} placeholder="Company Name"
                                value={settings.company_name}
                                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email *</label>
                            <input required style={styles.input} type="email" placeholder="Email"
                                value={settings.email}
                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Phone *</label>
                            <input required style={styles.input} placeholder="Phone"
                                value={settings.phone}
                                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>GSTIN</label>
                            <input style={styles.input} placeholder="GSTIN"
                                value={settings.gstin}
                                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Default GST Rate (%)</label>
                            <input style={styles.input} type="number" step="0.01" placeholder="GST Rate"
                                value={settings.default_gst_rate}
                                onChange={(e) => setSettings({ ...settings, default_gst_rate: e.target.value })}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Address *</label>
                            <textarea required style={styles.textarea} placeholder="Address"
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Default Terms & Conditions</label>
                            <textarea style={styles.textarea} placeholder="Default Terms"
                                value={settings.default_terms}
                                onChange={(e) => setSettings({ ...settings, default_terms: e.target.value })}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Company Logo</label>
                            <input style={styles.fileInput} type="file" onChange={(e) => setLogo(e.target.files[0])} />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Authorized Signature</label>
                            <input style={styles.fileInput} type="file" onChange={(e) => setSignature(e.target.files[0])} />
                        </div>

                        <button style={styles.submitBtn} type="submit">
                            {loading ? "Updating..." : "Save Settings"}
                        </button>

                    </form>
                </div>

                {/* BANK */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Add Bank Account</h3>

                    <form onSubmit={handleBankSubmit}>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Account Holder Name *</label>
                            <input required style={styles.input} placeholder="Account Holder"
                                value={bank.account_holder_name}
                                onChange={(e) => setBank({ ...bank, account_holder_name: e.target.value })}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Bank Name *</label>
                            <input required style={styles.input} placeholder="Bank Name"
                                value={bank.bank_name}
                                onChange={(e) => setBank({ ...bank, bank_name: e.target.value })}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Account Number *</label>
                            <input required style={styles.input} placeholder="Account Number"
                                value={bank.account_number}
                                onChange={(e) => setBank({ ...bank, account_number: e.target.value })}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>IFSC Code *</label>
                            <input required style={styles.input} placeholder="IFSC"
                                value={bank.ifsc_code}
                                onChange={(e) => setBank({ ...bank, ifsc_code: e.target.value })}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Branch</label>
                            <input style={styles.input} placeholder="Branch"
                                value={bank.branch}
                                onChange={(e) => setBank({ ...bank, branch: e.target.value })}
                            />
                        </div>

                        <button style={styles.bankBtn} type="submit">Add Bank</button>

                    </form>
                </div>

            </div>
        </AccountsBaseLayout>
    );
};

const styles = {
    toaster: { position: 'fixed', top: '20px', right: '20px', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 10001, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    card: { background: "#fff", padding: "25px", borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
    cardTitle: { fontSize: "18px", fontWeight: "800", color: "#1E293B", marginBottom: "20px", borderBottom: "1px solid #F1F5F9", paddingBottom: "10px" },
    inputGroup: { marginBottom: "15px" },
    label: { display: "block", fontSize: "12px", fontWeight: "700", color: "#64748B", marginBottom: "6px", textTransform: 'uppercase' },
    input: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", width: '100%', outline: 'none', boxSizing: 'border-box', fontSize: '14px' },
    textarea: { padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", width: '100%', minHeight: '80px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    fileInput: { fontSize: "13px", color: "#64748B" },
    submitBtn: { background: "#10B981", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", width: "100%", marginTop: "10px" },
    bankBtn: { background: "#3B82F6", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", width: "100%", marginTop: "10px" }
};

export default FinanceSettingsPage;





// import React, { useState, useEffect } from "react";
// import { apiRequest } from "../../services/api";
// import AccountsBaseLayout from "../components/AccountsBaseLayout";

// const FinanceSettingsPage = () => {

//     const [settings, setSettings] = useState({
//         company_name: "",
//         address: "",
//         gstin: "",
//         default_gst_rate: "18.00",
//         phone: "",
//         email: "",
//         default_sac_code: "",
//         default_terms: ""
//     });

//     const [logo, setLogo] = useState(null);
//     const [signature, setSignature] = useState(null);

//     const [bank, setBank] = useState({
//         account_holder_name: "",
//         bank_name: "",
//         account_number: "",
//         ifsc_code: "",
//         branch: ""
//     });

//     const [loading, setLoading] = useState(false);

//     // ================= FETCH SETTINGS =================
//     useEffect(() => {
//         const fetchSettings = async () => {
//             try {
//                 const data = await apiRequest("/invoice/api/settings/", "GET");

//                 if (data) {
//                     setSettings({
//                         company_name: data.company_name || "",
//                         address: data.address || "",
//                         gstin: data.gstin || "",
//                         default_gst_rate: data.default_gst_rate || "18.00",
//                         phone: data.phone || "",
//                         email: data.email || "",
//                         default_sac_code: data.default_sac_code || "",
//                         default_terms: data.default_terms || ""
//                     });
//                 }

//             } catch (err) {
//                 console.error("Error fetching settings", err);
//             }
//         };

//         fetchSettings();
//     }, []);

//     // ================= UPDATE SETTINGS =================
//     const handleSettingsSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);

//         const formData = new FormData();

//         Object.keys(settings).forEach(key => {
//             if (settings[key]) {
//                 formData.append(key, settings[key]);
//             }
//         });

//         if (logo instanceof File) formData.append("logo", logo);
//         if (signature instanceof File) formData.append("signature", signature);

//         try {
//             await apiRequest("/invoice/api/settings/", "PUT", formData);
//             alert("Company settings updated!");
//         } catch {
//             alert("Settings update failed");
//         }

//         setLoading(false);
//     };

//     // ================= ADD BANK =================
//     const handleBankSubmit = async (e) => {
//         e.preventDefault();

//         try {
//             await apiRequest("/invoice/api/bank-accounts/", "POST", bank);

//             alert("Bank Account added!");

//             setBank({
//                 account_holder_name: "",
//                 bank_name: "",
//                 account_number: "",
//                 ifsc_code: "",
//                 branch: ""
//             });

//         } catch {
//             alert("Bank add failed");
//         }
//     };

//     return (
//         <AccountsBaseLayout>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>

//                 {/* COMPANY SETTINGS */}
//                 <div style={{ background: "#fff", padding: "25px", borderRadius: "10px" }}>
//                     <h3>Company Settings</h3>

//                     <form onSubmit={handleSettingsSubmit}>

//                         <input placeholder="Company Name"
//                             value={settings.company_name}
//                             onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
//                         />

//                         <input placeholder="Email"
//                             value={settings.email}
//                             onChange={(e) => setSettings({ ...settings, email: e.target.value })}
//                         />

//                         <input placeholder="Phone"
//                             value={settings.phone}
//                             onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
//                         />

//                         <input placeholder="GSTIN"
//                             value={settings.gstin}
//                             onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
//                         />

//                         <input placeholder="GST Rate"
//                             value={settings.default_gst_rate}
//                             onChange={(e) => setSettings({ ...settings, default_gst_rate: e.target.value })}
//                         />

//                         <textarea placeholder="Address"
//                             value={settings.address}
//                             onChange={(e) => setSettings({ ...settings, address: e.target.value })}
//                         />

//                         <input type="file" onChange={(e) => setLogo(e.target.files[0])} />
//                         <input type="file" onChange={(e) => setSignature(e.target.files[0])} />

//                         <button type="submit">
//                             {loading ? "Updating..." : "Save Settings"}
//                         </button>

//                     </form>
//                 </div>

//                 {/* BANK */}
//                 <div style={{ background: "#fff", padding: "25px", borderRadius: "10px" }}>
//                     <h3>Add Bank Account</h3>

//                     <form onSubmit={handleBankSubmit}>

//                         <input placeholder="Account Holder"
//                             value={bank.account_holder_name}
//                             onChange={(e) => setBank({ ...bank, account_holder_name: e.target.value })}
//                         />

//                         <input placeholder="Bank Name"
//                             value={bank.bank_name}
//                             onChange={(e) => setBank({ ...bank, bank_name: e.target.value })}
//                         />

//                         <input placeholder="Account Number"
//                             value={bank.account_number}
//                             onChange={(e) => setBank({ ...bank, account_number: e.target.value })}
//                         />

//                         <input placeholder="IFSC"
//                             value={bank.ifsc_code}
//                             onChange={(e) => setBank({ ...bank, ifsc_code: e.target.value })}
//                         />

//                         <input placeholder="Branch"
//                             value={bank.branch}
//                             onChange={(e) => setBank({ ...bank, branch: e.target.value })}
//                         />

//                         <button type="submit">Add Bank</button>

//                     </form>
//                 </div>

//             </div>
//         </AccountsBaseLayout>
//     );
// };

// export default FinanceSettingsPage;





// import React, { useState, useEffect } from "react";
// import { apiRequest } from "../../services/api";
// import AccountsBaseLayout from "../components/AccountsBaseLayout";

// const FinanceSettingsPage = () => {
//     const [settings, setSettings] = useState({
//         company_name: "", address: "", gstin: "", default_gst_rate: "18.00",
//         phone: "", email: "", default_sac_code: "", default_terms: ""
//     });
//     const [logo, setLogo] = useState(null);
//     const [signature, setSignature] = useState(null);
//     const [bank, setBank] = useState({ 
//         account_holder_name: "", bank_name: "", account_number: "", ifsc_code: "", branch: "" 
//     });
//     const [loading, setLoading] = useState(false);

//     const localStyles = {
//         pageGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "25px" },
//         card: { backgroundColor: "#fff", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
//         cardTitle: { fontSize: "18px", fontWeight: "700", color: "#1E293B", marginBottom: "20px", borderBottom: "2px solid #F1F5F9", paddingBottom: "10px" },
//         form: { display: "flex", flexDirection: "column", gap: "15px" },
//         row: { display: "flex", gap: "15px" },
//         inputGroup: { display: "flex", flexDirection: "column", gap: "5px", flex: 1 },
//         label: { fontSize: "14px", fontWeight: "600", color: "#64748B" },
//         input: { padding: "10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px" },
//         saveBtn: { backgroundColor: "#1E293B", color: "#fff", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "700", marginTop: "10px" },
//         bankBtn: { backgroundColor: "#FF9B51", color: "#fff", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "700" }
//     };

//     useEffect(() => {
//         const fetchSettings = async () => {
//             try {
//                 const data = await apiRequest("/invoice/api/settings/", "GET");
//                 if (data) setSettings(data);
//             } catch (err) { console.error("Error fetching settings", err); }
//         };
//         fetchSettings();
//     }, []);

//     const handleSettingsSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         const formData = new FormData();
//         const textFields = ["company_name", "address", "gstin", "default_gst_rate", "phone", "email", "default_sac_code", "default_terms"];
        
//         textFields.forEach(key => {
//             if (settings[key]) formData.append(key, settings[key]);
//         });

//         if (logo instanceof File) formData.append("logo", logo);
//         if (signature instanceof File) formData.append("signature", signature);

//         try {
//             await apiRequest("/invoice/api/settings/", "PUT", formData);
//             alert("Company settings updated!");
//         } catch (err) { alert("Settings update failed"); }
//         setLoading(false);
//     };

//     const handleBankSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             await apiRequest("/invoice/api/bank-accounts/", "POST", bank);
//             alert("Bank Account added!");
//             setBank({ account_holder_name: "", bank_name: "", account_number: "", ifsc_code: "", branch: "" });
//         } catch (err) { alert("Bank add failed"); }
//     };

//     return (
//         <AccountsBaseLayout>
//         <div style={localStyles.pageGrid}>
//             <div style={localStyles.card}>
//                 <h2 style={localStyles.cardTitle}>Company Finance Settings</h2>
//                 <form onSubmit={handleSettingsSubmit} style={localStyles.form}>
//                     <div style={localStyles.inputGroup}>
//                         <label style={localStyles.label}>Company Name</label>
//                         <input style={localStyles.input} type="text" value={settings.company_name || ""} onChange={(e) => setSettings({...settings, company_name: e.target.value})} />
//                     </div>
//                     <div style={localStyles.row}>
//                         <div style={localStyles.inputGroup}>
//                             <label style={localStyles.label}>Email</label>
//                             <input style={localStyles.input} type="email" value={settings.email || ""} onChange={(e) => setSettings({...settings, email: e.target.value})} />
//                         </div>
//                         <div style={localStyles.inputGroup}>
//                             <label style={localStyles.label}>Phone</label>
//                             <input style={localStyles.input} type="text" value={settings.phone || ""} onChange={(e) => setSettings({...settings, phone: e.target.value})} />
//                         </div>
//                     </div>
//                     <div style={localStyles.row}>
//                         <div style={localStyles.inputGroup}>
//                             <label style={localStyles.label}>GSTIN</label>
//                             <input style={localStyles.input} type="text" value={settings.gstin || ""} onChange={(e) => setSettings({...settings, gstin: e.target.value})} />
//                         </div>
//                         <div style={localStyles.inputGroup}>
//                             <label style={localStyles.label}>GST Rate (%)</label>
//                             <input style={localStyles.input} type="number" value={settings.default_gst_rate || ""} onChange={(e) => setSettings({...settings, default_gst_rate: e.target.value})} />
//                         </div>
//                     </div>
//                     <div style={localStyles.row}>
//                         <div style={localStyles.inputGroup}>
//                             <label style={localStyles.label}>SAC Code</label>
//                             <input style={localStyles.input} type="text" value={settings.default_sac_code || ""} onChange={(e) => setSettings({...settings, default_sac_code: e.target.value})} />
//                         </div>
//                         <div style={localStyles.inputGroup}>
//                             <label style={localStyles.label}>Terms</label>
//                             <input style={localStyles.input} type="text" value={settings.default_terms || ""} onChange={(e) => setSettings({...settings, default_terms: e.target.value})} />
//                         </div>
//                     </div>
//                     <div style={localStyles.inputGroup}>
//                         <label style={localStyles.label}>Address</label>
//                         <textarea style={{...localStyles.input, minHeight: "60px"}} value={settings.address || ""} onChange={(e) => setSettings({...settings, address: e.target.value})} />
//                     </div>
//                     <div style={localStyles.row}>
//                         <div style={localStyles.inputGroup}><label style={localStyles.label}>Logo</label><input type="file" onChange={(e) => setLogo(e.target.files[0])} /></div>
//                         <div style={localStyles.inputGroup}><label style={localStyles.label}>Signature</label><input type="file" onChange={(e) => setSignature(e.target.files[0])} /></div>
//                     </div>
//                     <button type="submit" style={localStyles.saveBtn}>{loading ? "Updating..." : "Update Settings"}</button>
//                 </form>
//             </div>

//             <div style={localStyles.card}>
//                 <h2 style={localStyles.cardTitle}>Add Bank Account</h2>
//                 <form onSubmit={handleBankSubmit} style={localStyles.form}>
//                     <div style={localStyles.inputGroup}>
//                         <label style={localStyles.label}>Account Holder Name</label>
//                         <input style={localStyles.input} type="text" value={bank.account_holder_name} onChange={(e) => setBank({...bank, account_holder_name: e.target.value})} required />
//                     </div>
//                     <div style={localStyles.row}>
//                         <div style={localStyles.inputGroup}>
//                             <label style={localStyles.label}>Bank Name</label>
//                             <input style={localStyles.input} type="text" value={bank.bank_name} onChange={(e) => setBank({...bank, bank_name: e.target.value})} required />
//                         </div>
//                         <div style={localStyles.inputGroup}>
//                             <label style={localStyles.label}>Account Number</label>
//                             <input style={localStyles.input} type="text" value={bank.account_number} onChange={(e) => setBank({...bank, account_number: e.target.value})} required />
//                         </div>
//                     </div>
//                     <div style={localStyles.row}>
//                         <div style={localStyles.inputGroup}>
//                             <label style={localStyles.label}>IFSC Code</label>
//                             <input style={localStyles.input} type="text" value={bank.ifsc_code} onChange={(e) => setBank({...bank, ifsc_code: e.target.value})} required />
//                         </div>
//                         <div style={localStyles.inputGroup}>
//                             <label style={localStyles.label}>Branch</label>
//                             <input style={localStyles.input} type="text" value={bank.branch} onChange={(e) => setBank({...bank, branch: e.target.value})} />
//                         </div>
//                     </div>
//                     <button type="submit" style={localStyles.bankBtn}>Save Bank Account</button>
//                 </form>
//             </div>
//         </div>
//         </AccountsBaseLayout>
//     );
// };

// export default FinanceSettingsPage;