import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { asList } from "../../utils/apiHelpers";
import BaseLayout from "../components/SubAdminLayout";

function AddCandidate() {
    const navigate = useNavigate();
    const [form, setForm] = useState({});
    const [resumeFile, setResumeFile] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [searchVendor, setSearchVendor] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    
    // Naye States: Dropdown aur Toast ke liye
    const [showDropdown, setShowDropdown] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    useEffect(() => {
        loadDropdowns();
    }, []);

    // Debounce Search Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchVendors(searchVendor);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchVendor]);

    const loadDropdowns = async () => {
        const empRes = await apiRequest("/employee-portal/api/employees/");
        setEmployees(asList(empRes));
        fetchVendors(""); // Initial vendors load
    };

    const fetchVendors = async (query) => {
        try {
            const url = query 
                ? `/sub-admin/api/admin-vendors/?search=${query}` 
                : "/sub-admin/api/admin-vendors/";
            const res = await apiRequest(url);
            setVendors(res.results || []);
        } catch (err) {
            console.error("Vendor fetch error:", err);
        }
    };

    const notify = (msg, type = "success") => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Naya Select Vendor Logic (Searchable dropdown ke liye)
    const selectVendor = (v) => {
        setForm({
            ...form,
            vendor: v.id,
            vendor_company_name: v.company_name || "",
            vendor_number: v.number || ""
        });
        setSearchVendor(`${v.name} (${v.company_name})`);
        setShowDropdown(false);
    };

    const handleResumeUpload = async (file) => {
        if (!file) return;
        setResumeFile(file);
        setIsParsing(true);
        const fd = new FormData();
        fd.append("resume", file);

        try {
            const res = await apiRequest("/employee-portal/api/candidates/parse-resume/", "POST", fd);
            if (res?.data) {
                setForm((prev) => ({
                    ...prev,
                    ...res.data,
                    years_of_experience_calculated:
                        res.data.years_of_experience_calculated ?? prev.years_of_experience_calculated,
                }));
                notify(res.message || "Resume parsed successfully!");
            } else {
                notify(res?.detail || res?.error || "Could not extract details from resume", "error");
            }
        } catch (err) {
            notify("Failed to parse resume", "error");
        }
        setIsParsing(false);
    };

 const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();

    Object.keys(form).forEach((k) => {
        if (form[k] !== null && form[k] !== undefined && form[k] !== "") {
            fd.append(k, form[k]);
        }
    });

    if (resumeFile) {
        fd.append("resume", resumeFile);
    }

    try {
        const res = await apiRequest(
            "/employee-portal/api/candidates/create/",
            "POST",
            fd
        );

        // Success notification
        notify(res.message || "Candidate Created Successfully!");

        // Redirect after notification
        setTimeout(() => {
            navigate("/sub-admin/all-candidates");
        }, 3000);

    } catch (err) {
        notify("Error creating candidate", "error");
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

            <div style={styles.header}>
                {/* Back Button */}
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                <div style={{marginTop: '15px'}}>
                    <h2 style={styles.title}>Add New Candidate</h2>
                    <p style={styles.subtitle}>Upload resume to auto-fill or enter details manually</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={styles.container}>
                
                {/* 1. Resume Upload Section */}
                <div style={styles.section}>
                    <h3 style={styles.secTitle}>1. Resume Upload</h3>
                    <div style={styles.uploadCard}>
                        <input 
                            type="file" 
                            onChange={(e) => handleResumeUpload(e.target.files[0])} 
                            style={styles.fileInput} 
                        />
                        {isParsing && <p style={styles.parsingText}>Parsing Resume... Please Wait</p>}
                    </div>
                </div>

                {/* 2. Candidate Basic Details */}
                <div style={styles.section}>
                    <h3 style={styles.secTitle}>2. Candidate Details</h3>
                    <div style={styles.grid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Full Name</label>
                            <input name="candidate_name" value={form.candidate_name || ""} onChange={handleChange} style={styles.input} placeholder="Enter Name" />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email ID</label>
                            <input name="candidate_email" value={form.candidate_email || ""} onChange={handleChange} style={styles.input} placeholder="example@mail.com" />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Phone Number</label>
                            <input name="candidate_number" value={form.candidate_number || ""} onChange={handleChange} style={styles.input} placeholder="+91..." />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Skills</label>
                            <input name="skills" value={form.skills || ""} onChange={handleChange} style={styles.input} placeholder="React, Python, etc." />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Technology</label>
                            <input name="technology" value={form.technology || ""} onChange={handleChange} style={styles.input} placeholder="Web Development" />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Experience (Manual Entry)</label>
                            <input name="years_of_experience_manual" value={form.years_of_experience_manual || ""} onChange={handleChange} style={styles.input} />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Experience (Calculated)</label>
                            <input name="years_of_experience_calculated" value={form.years_of_experience_calculated || ""} onChange={handleChange} style={styles.input} />
                        </div>
                    </div>
                </div>

                {/* 3. Vendor Section (Updated with Searchable Dropdown) */}
                <div style={styles.section}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                        <h3 style={styles.secTitle}>3. Vendor Information</h3>
                        <button type="button" onClick={() => navigate("/sub-admin/add-vendor")} style={styles.addVendorBtn}>+ Add Vendor</button>
                    </div>
                    <div style={styles.grid}>
                        <div style={{...styles.inputGroup, position: 'relative'}}>
                            <label style={styles.label}>Search & Select Vendor</label>
                            <input 
                                placeholder="Search name/company..." 
                                value={searchVendor} 
                                required={true}
                                onChange={(e) => {
                                    setSearchVendor(e.target.value);
                                    setShowDropdown(true);
                                }} 
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                style={styles.input}
                               
                            />
                            {/* Dropdown Results */}
                            {showDropdown && vendors.length > 0 && (
                                <div style={styles.dropdownList}>
                                    {vendors.map(v => (
                                        <div 
                                            key={v.id} 
                                            onMouseDown={() => selectVendor(v)}
                                            style={styles.dropdownItem}
                                        >
                                            <div style={{fontWeight: '700'}}>{v.name}</div>
                                            <div style={{fontSize: '11px', color: '#666'}}>{v.company_name} | {v.number}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Vendor Company Name</label>
                            <input name="vendor_company_name" value={form.vendor_company_name || ""} onChange={handleChange} style={styles.input} readOnly />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Vendor Contact</label>
                            <input name="vendor_number" value={form.vendor_number || ""} onChange={handleChange} style={styles.input} readOnly />
                        </div> <br />
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Vendor Rate (Expected)</label>
                            <input name="vendor_rate" onChange={handleChange} style={styles.input} placeholder="Rate in INR" required />
                        </div>

                        <div style={styles.inputGroup}>
                            {/* <label style={styles.label}>Vendor Rate Type</label>
                            <select
                                name="vendor_rate_type"
                                value={form.vendor_rate_type || ""}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="LPM">LPM</option>
                                <option value="KPM">KPM</option>
                                <option value="PHR">PHR</option>
                                <option value="LPA">LPA</option>
                            </select> */}

                            <label style={styles.label}>Rate Type</label>
<select 
    name="vendor_rate_type" 
    value={form.vendor_rate_type} 
    onChange={handleChange} 
    style={{
        ...styles.input, 
        width: '100%',       // Poori jagah lega container ki
        maxWidth: '250px',   // Isse zyada bada nahi hoga
        padding: '5px',      // Thoda compact dikhega
        fontSize: '14px'     // Font size chhota karne ke liye
    }} 
    required
>
    <option value="">Select Type</option>
    
    {/* --- Domestic / Local --- */}
    <option value="LPA">LPA (Lakh/Year)</option>
    <option value="LPM">LPM (Lakh/Month)</option>
    <option value="KPM">KPM (Thousand/Month)</option>
    <option value="PHR">PHR (Per Hour - ₹)</option>

    {/* --- Global Major --- */}
    <option value="USD">USD ($)</option>
    <option value="USD_PH">USD/hr ($)</option>
    
    <option value="EUR">EUR (€)</option>
    <option value="EUR_PH">EUR/hr (€)</option>
    
    <option value="GBP">GBP (£)</option>
    <option value="GBP_PH">GBP/hr (£)</option>

    {/* --- Others (Inhe thoda short kar diya hai) --- */}
    <option value="AED">AED (UAE)</option>
    <option value="SGD">SGD (Singapore)</option>
    <option value="SAR">SAR (Saudi)</option>
    <option value="CNY">CNY (China)</option>
    <option value="JPY">JPY (Japan)</option>
    <option value="AUD">AUD (Australia)</option>
    <option value="CAD">CAD (Canada)</option>
    <option value="CHF">CHF (Swiss)</option>
    <option value="HKD">HKD (Hong Kong)</option>
    <option value="THB">THB (Thailand)</option>
    <option value="MYR">MYR (Malaysia)</option>
    <option value="KRW">KRW (S. Korea)</option>
    <option value="NZD">NZD (NZ)</option>
    <option value="ZAR">ZAR (S. Africa)</option>
    <option value="KWD">KWD (Kuwait)</option>
    <option value="QAR">QAR (Qatar)</option>
</select>

                        </div>

                    </div>
                </div>

                {/* 4. Others & Remark */}
                <div style={styles.section}>
                    <h3 style={styles.secTitle}>4. Submission & Remarks</h3>
                    <div style={styles.grid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Submitted To (Internal)</label>
                            <select name="submitted_to" onChange={handleChange} style={styles.input}>
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                                ))}
                            </select>
                        </div>
                        {/* Aapne kaha tha commented as it is rahe */}
                        {/* <div style={styles.inputGroup}>
                            <label style={styles.label}>Remark</label>
                            <textarea name="remark" onChange={handleChange} style={styles.textarea} placeholder="Any notes..."></textarea>
                        </div> */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Extra Details</label>
                            <textarea name="extra_details" onChange={handleChange} style={styles.textarea} placeholder="Additional info..."></textarea>
                        </div>
                    </div>
                </div>

                <button type="submit" style={styles.submitBtn}>Submit Candidate</button>
            </form>
        </BaseLayout>
    );
}

const styles = {
    // Naye styles Back Button, Toast aur Dropdown ke liye
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
    backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
    dropdownList: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #BFC9D1', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginTop: '5px' },
    dropdownItem: { padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' },

    // Purane Styles same to same
    header: { marginBottom: "25px" },
    title: { color: "#25343F", margin: 0, fontSize: "28px", fontWeight: "800" },
    subtitle: { color: "#666", fontSize: "14px" },
    container: { display: "flex", flexDirection: "column", gap: "25px" },
    section: { background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" },
    secTitle: { fontSize: "16px", color: "#FF9B51", fontWeight: "800", marginBottom: "20px", borderBottom: "2px solid #F5F7F9", paddingBottom: "10px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
    label: { fontSize: "12px", fontWeight: "700", color: "#25343F", textTransform: "uppercase" },
    input: { padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none", fontSize: "14px" },
    textarea: { padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none", minHeight: "80px", fontSize: "14px" },
    uploadCard: { padding: "20px", border: "2px dashed #FF9B51", borderRadius: "12px", textAlign: "center", background: "#FFFBF8" },
    parsingText: { color: "#FF9B51", fontWeight: "bold", marginTop: "10px" },
    addVendorBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
    submitBtn: { padding: "18px", background: "#FF9B51", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 20px rgba(255,155,81,0.2)" }
};

export default AddCandidate;



// import React, { useEffect, useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// function AddCandidate() {
//     const navigate = useNavigate();
//     const [form, setForm] = useState({});
//     const [resumeFile, setResumeFile] = useState(null);
//     const [vendors, setVendors] = useState([]);
//     const [employees, setEmployees] = useState([]);
//     const [searchVendor, setSearchVendor] = useState("");
//     const [isParsing, setIsParsing] = useState(false);
//     const [showDropdown, setShowDropdown] = useState(false); // Dropdown open/close control

//     useEffect(() => {
//         loadInitialData();
//     }, []);

//     // Jab search term badle, tab API call karein
//     useEffect(() => {
//         const delayDebounceFn = setTimeout(() => {
//             if (searchVendor.trim()) {
//                 fetchVendors(searchVendor);
//             } else {
//                 // Agar search empty hai toh default list mangwayein
//                 fetchVendors("");
//             }
//         }, 500); // 500ms ka wait (Debounce)

//         return () => clearTimeout(delayDebounceFn);
//     }, [searchVendor]);

//     const loadInitialData = async () => {
//         // Initial load: Default vendors aur employees
//         const empRes = await apiRequest("/employee-portal/api/employees/");
//         setEmployees(empRes || []);
//         fetchVendors(""); // Default vendors fetch
//     };

//     const fetchVendors = async (query) => {
//         try {
//             // Aapki Search API call: /employee-portal/api/vendors/?search=query
//             const url = query 
//                 ? `/employee-portal/api/vendors/?search=${query}` 
//                 : "/employee-portal/api/vendors/";
//             const res = await apiRequest(url);
//             setVendors(res.results || []);
//         } catch (err) {
//             console.error("Vendor fetch error:", err);
//         }
//     };

//     const handleChange = (e) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     };

//     // Jab user dropdown se vendor select kare
//     const selectVendor = (v) => {
//         setForm({
//             ...form,
//             vendor: v.id,
//             vendor_company_name: v.company_name || "",
//             vendor_number: v.number || ""
//         });
//         setSearchVendor(`${v.name} (${v.company_name})`); // Input mein select kiya gaya naam dikhayein
//         setShowDropdown(false); // Dropdown band kar dein
//     };

//     const handleResumeUpload = async (file) => {
//         if (!file) return;
//         setResumeFile(file);
//         setIsParsing(true);
//         const fd = new FormData();
//         fd.append("resume", file);

//         try {
//             const res = await apiRequest("/employee-portal/api/candidates/parse-resume/", "POST", fd);
//             if (res.data) {
//                 setForm(prev => ({ ...prev, ...res.data }));
//             }
//         } catch (err) { console.error("Parsing error"); }
//         setIsParsing(false);
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         const fd = new FormData();
//         Object.keys(form).forEach((k) => {
//             if (form[k] !== null && form[k] !== undefined && form[k] !== "") {
//                 fd.append(k, form[k]);
//             }
//         });
//         if (resumeFile) fd.append("resume", resumeFile);

//         try {
//             const res = await apiRequest("/employee-portal/api/candidates/create/", "POST", fd);
//             alert(res.message || "Candidate Created Successfully!");
//             navigate("/employee/candidates"); 
//         } catch (err) {
//             alert("Error creating candidate");
//         }
//     };

//     return (
//         <BaseLayout>
//             <div style={styles.header}>
//                 <h2 style={styles.title}>Add New Candidate</h2>
//                 <p style={styles.subtitle}>Upload resume to auto-fill or enter details manually</p>
//             </div>

//             <form onSubmit={handleSubmit} style={styles.container}>
//                 {/* 1. Resume Section */}
//                 <div style={styles.section}>
//                     <h3 style={styles.secTitle}>1. Resume Upload</h3>
//                     <div style={styles.uploadCard}>
//                         <input type="file" onChange={(e) => handleResumeUpload(e.target.files[0])} style={styles.fileInput} />
//                         {isParsing && <p style={styles.parsingText}>Parsing Resume... Please Wait</p>}
//                     </div>
//                 </div>

//                 {/* 2. Candidate Details */}
//                 <div style={styles.section}>
//                     <h3 style={styles.secTitle}>2. Candidate Details</h3>
//                     <div style={styles.grid}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Full Name</label>
//                             <input name="candidate_name" value={form.candidate_name || ""} onChange={handleChange} style={styles.input} />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Email ID</label>
//                             <input name="candidate_email" value={form.candidate_email || ""} onChange={handleChange} style={styles.input} />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Phone Number</label>
//                             <input name="candidate_number" value={form.candidate_number || ""} onChange={handleChange} style={styles.input} />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Technology</label>
//                             <input name="technology" value={form.technology || ""} onChange={handleChange} style={styles.input} />
//                         </div>
//                     </div>
//                 </div>

//                 {/* 3. Integrated Vendor Search Section */}
//                 <div style={styles.section}>
//                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
//                         <h3 style={styles.secTitle}>3. Vendor Information</h3>
//                         <button type="button" onClick={() => navigate("/employee/vendor/add")} style={styles.addVendorBtn}>+ Add Vendor</button>
//                     </div>
                    
//                     <div style={styles.grid}>
//                         {/* Search + Dropdown Integrated */}
//                         <div style={{...styles.inputGroup, position: 'relative'}}>
//                             <label style={styles.label}>Search & Select Vendor</label>
//                             <input 
//                                 placeholder="Start typing vendor or company name..." 
//                                 value={searchVendor} 
//                                 onChange={(e) => {
//                                     setSearchVendor(e.target.value);
//                                     setShowDropdown(true);
//                                 }}
//                                 onFocus={() => setShowDropdown(true)}
//                                 style={styles.input} 
//                             />
                            
//                             {/* Custom Dropdown List */}
//                             {showDropdown && vendors.length > 0 && (
//                                 <div style={styles.dropdownList}>
//                                     {vendors.map(v => (
//                                         <div 
//                                             key={v.id} 
//                                             onClick={() => selectVendor(v)}
//                                             style={styles.dropdownItem}
//                                         >
//                                             <div style={{fontWeight: '700'}}>{v.name}</div>
//                                             <div style={{fontSize: '11px', color: '#666'}}>{v.company_name} | {v.number}</div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>

//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Company (Auto)</label>
//                             <input name="vendor_company_name" value={form.vendor_company_name || ""} readOnly style={{...styles.input, backgroundColor: '#f9f9f9'}} />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Contact (Auto)</label>
//                             <input name="vendor_number" value={form.vendor_number || ""} readOnly style={{...styles.input, backgroundColor: '#f9f9f9'}} />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Rate (INR)</label>
//                             <input name="vendor_rate" onChange={handleChange} style={styles.input} />
//                         </div>
//                     </div>
//                 </div>

//                 {/* 4. Submission Section */}
//                 <div style={styles.section}>
//                     <h3 style={styles.secTitle}>4. Submission</h3>
//                     <div style={styles.grid}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Submitted To</label>
//                             <select name="submitted_to" onChange={handleChange} style={styles.input}>
//                                 <option value="">Select Employee</option>
//                                 {employees.map(emp => (
//                                     <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
//                                 ))}
//                             </select>
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Extra Details</label>
//                             <textarea name="extra_details" onChange={handleChange} style={styles.textarea}></textarea>
//                         </div>
//                     </div>
//                 </div>

//                 <button type="submit" style={styles.submitBtn}>Submit Candidate</button>
//             </form>
//         </BaseLayout>
//     );
// }

// const styles = {
//     // ... aapke purane styles baki sab same hain ...
//     header: { marginBottom: "25px" },
//     title: { color: "#25343F", margin: 0, fontSize: "28px", fontWeight: "800" },
//     subtitle: { color: "#666", fontSize: "14px" },
//     container: { display: "flex", flexDirection: "column", gap: "25px" },
//     section: { background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" },
//     secTitle: { fontSize: "16px", color: "#FF9B51", fontWeight: "800", marginBottom: "20px", borderBottom: "2px solid #F5F7F9", paddingBottom: "10px" },
//     grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" },
//     inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
//     label: { fontSize: "12px", fontWeight: "700", color: "#25343F", textTransform: "uppercase" },
//     input: { padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none", fontSize: "14px" },
//     textarea: { padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none", minHeight: "80px", fontSize: "14px" },
//     uploadCard: { padding: "20px", border: "2px dashed #FF9B51", borderRadius: "12px", textAlign: "center", background: "#FFFBF8" },
//     parsingText: { color: "#FF9B51", fontWeight: "bold", marginTop: "10px" },
//     addVendorBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
//     submitBtn: { padding: "18px", background: "#FF9B51", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 20px rgba(255,155,81,0.2)" },
    
//     // Naye styles searchable dropdown ke liye
//     dropdownList: {
//         position: 'absolute',
//         top: '100%',
//         left: 0,
//         right: 0,
//         background: '#fff',
//         border: '1px solid #BFC9D1',
//         borderRadius: '10px',
//         maxHeight: '200px',
//         overflowY: 'auto',
//         zIndex: 1000,
//         boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
//         marginTop: '5px'
//     },
//     dropdownItem: {
//         padding: '10px 15px',
//         cursor: 'pointer',
//         borderBottom: '1px solid #f0f0f0',
//         transition: 'background 0.2s',
//         ":hover": { background: '#FFFBF8' }
//     }
// };

// export default AddCandidate;




// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// function AddCandidate() {
//     const navigate = useNavigate();
//     const [form, setForm] = useState({});
//     const [resumeFile, setResumeFile] = useState(null);
//     const [vendors, setVendors] = useState([]);
//     const [employees, setEmployees] = useState([]);
//     const [searchVendor, setSearchVendor] = useState("");
//     const [isParsing, setIsParsing] = useState(false);

//     useEffect(() => {
//         loadDropdowns();
//     }, []);

//     const loadDropdowns = async () => {
//         const vendorRes = await apiRequest("/employee-portal/api/vendors/");
//         const empRes = await apiRequest("/employee-portal/api/employees/");
//         setVendors(vendorRes.results || []);
//         setEmployees(empRes || []);
//     };

//     const handleChange = (e) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     };

//     const handleVendorChange = (e) => {
//         const vendorId = e.target.value;
//         const selected = vendors.find(v => v.id == vendorId);
//         setForm({
//             ...form,
//             vendor: vendorId,
//             vendor_company_name: selected?.company_name || "",
//             vendor_number: selected?.number || ""
//         });
//     };

//     const handleResumeUpload = async (file) => {
//         setResumeFile(file);
//         setIsParsing(true);
//         const fd = new FormData();
//         fd.append("resume", file);

//         const res = await apiRequest("/employee-portal/api/candidates/parse-resume/", "POST", fd);
//         if (res.data) {
//             setForm(prev => ({ ...prev, ...res.data }));
//         }
//         setIsParsing(false);
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         const fd = new FormData();
//         Object.keys(form).forEach((k) => {
//             if (form[k] !== null && form[k] !== undefined && form[k] !== "") {
//                 fd.append(k, form[k]);
//             }
//         });
//         if (resumeFile) fd.append("resume", resumeFile);

//         try {
//             const res = await apiRequest("/employee-portal/api/candidates/create/", "POST", fd);
//             alert(res.message || "Candidate Created Successfully!");
//             navigate("/employee/candidates"); 
//         } catch (err) {
//             alert("Error creating candidate");
//         }
//     };

//     const filteredVendors = vendors.filter(v =>
//         `${v.name} ${v.company_name} ${v.number}`.toLowerCase().includes(searchVendor.toLowerCase())
//     );

//     return (
//         <BaseLayout>
//             <div style={styles.header}>
//                 <h2 style={styles.title}>Add New Candidate</h2>
//                 <p style={styles.subtitle}>Upload resume to auto-fill or enter details manually</p>
//             </div>

//             <form onSubmit={handleSubmit} style={styles.container}>
                
//                 {/* 1. Resume Upload Section */}
//                 <div style={styles.section}>
//                     <h3 style={styles.secTitle}>1. Resume Upload</h3>
//                     <div style={styles.uploadCard}>
//                         <input 
//                             type="file" 
//                             onChange={(e) => handleResumeUpload(e.target.files[0])} 
//                             style={styles.fileInput} 
//                         />
//                         {isParsing && <p style={styles.parsingText}>Parsing Resume... Please Wait</p>}
//                     </div>
//                 </div>

//                 {/* 2. Candidate Basic Details */}
//                 <div style={styles.section}>
//                     <h3 style={styles.secTitle}>2. Candidate Details</h3>
//                     <div style={styles.grid}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Full Name</label>
//                             <input name="candidate_name" value={form.candidate_name || ""} onChange={handleChange} style={styles.input} placeholder="Enter Name" />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Email ID</label>
//                             <input name="candidate_email" value={form.candidate_email || ""} onChange={handleChange} style={styles.input} placeholder="example@mail.com" />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Phone Number</label>
//                             <input name="candidate_number" value={form.candidate_number || ""} onChange={handleChange} style={styles.input} placeholder="+91..." />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Skills</label>
//                             <input name="skills" value={form.skills || ""} onChange={handleChange} style={styles.input} placeholder="React, Python, etc." />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Technology</label>
//                             <input name="technology" value={form.technology || ""} onChange={handleChange} style={styles.input} placeholder="Web Development" />
//                         </div>

//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Experience (Manual Entry)</label>
//                             <input name="years_of_experience_manual" value={form.years_of_experience_manual || ""} onChange={handleChange} style={styles.input} />
//                         </div>

//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Experience (Calculated)</label>
//                             <input name="years_of_experience_calculated" value={form.years_of_experience_calculated || ""} onChange={handleChange} style={styles.input} />
//                         </div>

                        

//                     </div>
//                 </div>

//                 {/* 3. Vendor Section */}
//                 <div style={styles.section}>
//                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
//                         <h3 style={styles.secTitle}>3. Vendor Information</h3>
//                         <button type="button" onClick={() => navigate("/employee/vendor/add")} style={styles.addVendorBtn}>+ Add Vendor</button>
//                     </div>
//                     <div style={styles.grid}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Search Vendor</label>
//                             <input placeholder="Search name/company..." value={searchVendor} onChange={(e) => setSearchVendor(e.target.value)} style={styles.input} />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Select Vendor</label>
//                             <select name="vendor" onChange={handleVendorChange} style={styles.input}>
//                                 <option value="">-- Choose --</option>
//                                 {filteredVendors.map(v => (
//                                     <option key={v.id} value={v.id}>{v.name} - {v.company_name}</option>
//                                 ))}
//                             </select>
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Company Name</label>
//                             <input name="vendor_company_name" value={form.vendor_company_name || ""} onChange={handleChange} style={styles.input} />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Contact</label>
//                             <input name="vendor_number" value={form.vendor_number || ""} onChange={handleChange} style={styles.input} />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Rate (Expected)</label>
//                             <input name="vendor_rate" onChange={handleChange} style={styles.input} placeholder="Rate in INR" />
//                         </div>
//                     </div>
//                 </div>

//                 {/* 4. Others & Remark */}
//                 <div style={styles.section}>
//                     <h3 style={styles.secTitle}>4. Submission & Remarks</h3>
//                     <div style={styles.grid}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Submitted To (Internal)</label>
//                             <select name="submitted_to" onChange={handleChange} style={styles.input}>
//                                 <option value="">Select Employee</option>
//                                 {employees.map(emp => (
//                                     <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
//                                 ))}
//                             </select>
//                         </div>
//                         {/* <div style={styles.inputGroup}>
//                             <label style={styles.label}>Remark</label>
//                             <textarea name="remark" onChange={handleChange} style={styles.textarea} placeholder="Any notes..."></textarea>
//                         </div> */}
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Extra Details</label>
//                             <textarea name="extra_details" onChange={handleChange} style={styles.textarea} placeholder="Additional info..."></textarea>
//                         </div>
//                     </div>
//                 </div>

//                 <button type="submit" style={styles.submitBtn}>Submit Candidate</button>
//             </form>
//         </BaseLayout>
//     );
// }

// const styles = {
//     header: { marginBottom: "25px" },
//     title: { color: "#25343F", margin: 0, fontSize: "28px", fontWeight: "800" },
//     subtitle: { color: "#666", fontSize: "14px" },
//     container: { display: "flex", flexDirection: "column", gap: "25px" },
//     section: { background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" },
//     secTitle: { fontSize: "16px", color: "#FF9B51", fontWeight: "800", marginBottom: "20px", borderBottom: "2px solid #F5F7F9", paddingBottom: "10px" },
//     grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" },
//     inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
//     label: { fontSize: "12px", fontWeight: "700", color: "#25343F", textTransform: "uppercase" },
//     input: { padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none", fontSize: "14px" },
//     textarea: { padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", outline: "none", minHeight: "80px", fontSize: "14px" },
//     uploadCard: { padding: "20px", border: "2px dashed #FF9B51", borderRadius: "12px", textAlign: "center", background: "#FFFBF8" },
//     parsingText: { color: "#FF9B51", fontWeight: "bold", marginTop: "10px" },
//     addVendorBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
//     submitBtn: { padding: "18px", background: "#FF9B51", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 20px rgba(255,155,81,0.2)" }
// };

// export default AddCandidate;




// import React, { useEffect, useState } from "react";
// import { apiRequest } from "../../services/api";

// function AddCandidate() {
//     const [form, setForm] = useState({});
//     const [resumeFile, setResumeFile] = useState(null);
//     const [vendors, setVendors] = useState([]);
//     const [employees, setEmployees] = useState([]);
//     const [searchVendor, setSearchVendor] = useState("");

//     useEffect(() => {
//         loadDropdowns();
//     }, []);

//     const loadDropdowns = async () => {
//         const vendorRes = await apiRequest("/employee-portal/api/vendors/");
//         const empRes = await apiRequest("/employee-portal/api/employees/");
//         setVendors(vendorRes.results || []);
//         setEmployees(empRes || []);
//     };

//     const handleChange = (e) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     };

//     // Vendor autofill (editable)
//     const handleVendorChange = (e) => {
//         const vendorId = e.target.value;
//         const selected = vendors.find(v => v.id == vendorId);

//         setForm({
//             ...form,
//             vendor: vendorId,
//             vendor_company_name: selected?.company_name || "",
//             vendor_number: selected?.number || ""
//         });
//     };

//     // Resume Parse
//     const handleResumeUpload = async (file) => {
//         setResumeFile(file);

//         const fd = new FormData();
//         fd.append("resume", file);

//         const res = await apiRequest(
//             "/employee-portal/api/candidates/parse-resume/",
//             "POST",
//             fd
//         );

//         if (res.data) {
//             setForm(prev => ({
//                 ...prev,
//                 ...res.data
//             }));
//         }
//     };

//     // Submit Candidate
//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         const fd = new FormData();

//         Object.keys(form).forEach((k) => {
//             if (form[k] !== null && form[k] !== undefined && form[k] !== "") {
//                 fd.append(k, form[k]);
//             }
//         });

//         if (resumeFile) fd.append("resume", resumeFile);

//         const res = await apiRequest(
//             "/employee-portal/api/candidates/create/",
//             "POST",
//             fd
//         );

//         alert(res.message || "Candidate Created");
//         console.log(res);   // IMPORTANT
//         alert(JSON.stringify(res));
//     };

//     const filteredVendors = vendors.filter(v =>
//         `${v.name} ${v.company_name} ${v.number}`
//             .toLowerCase()
//             .includes(searchVendor.toLowerCase())
//     );

//     return (
//         <div>
//             <h2>Add Candidate</h2>

//             <form onSubmit={handleSubmit}>
//                 <input
//                     type="file"
//                     onChange={(e) => handleResumeUpload(e.target.files[0])}
//                 />

//                 <input name="candidate_name" placeholder="Candidate Name"
//                     value={form.candidate_name || ""}
//                     onChange={handleChange}
//                 />

//                 <input name="candidate_email" placeholder="Email"
//                     value={form.candidate_email || ""}
//                     onChange={handleChange}
//                 />

//                 <input name="candidate_number" placeholder="Number"
//                     value={form.candidate_number || ""}
//                     onChange={handleChange}
//                 />

//                 <input name="skills" placeholder="Skills"
//                     value={form.skills || ""}
//                     onChange={handleChange}
//                 />

//                 <input name="technology" placeholder="Technology"
//                     value={form.technology || ""}
//                     onChange={handleChange}
//                 />

//                 {/* Experience Fields */}
//                 <input
//                     name="years_of_experience_calculated"
//                     placeholder="Experience (Auto Calculated)"
//                     value={form.years_of_experience_calculated || ""}
//                     readOnly
//                 />

//                 <input
//                     name="years_of_experience_manual"
//                     placeholder="Experience (Manual)"
//                     value={form.years_of_experience_manual || ""}
//                     onChange={handleChange}
//                 />

//                 <h4>Select Vendor</h4>

//                 <input
//                     placeholder="Search vendor"
//                     value={searchVendor}
//                     onChange={(e) => setSearchVendor(e.target.value)}
//                 />

//                 <select name="vendor" onChange={handleVendorChange}>
//                     <option value="">Select Vendor</option>
//                     {filteredVendors.map(v => (
//                         <option key={v.id} value={v.id}>
//                             {v.name} - {v.company_name}
//                         </option>
//                     ))}
//                 </select>

//                 <input
//                     name="vendor_company_name"
//                     placeholder="Vendor Company Name"
//                     value={form.vendor_company_name || ""}
//                     onChange={handleChange}
//                 />

//                 <input
//                     name="vendor_number"
//                     placeholder="Vendor Number"
//                     value={form.vendor_number || ""}
//                     onChange={handleChange}
//                 />

//                 <h4>Select Submitted To</h4>

//                 <select name="submitted_to" onChange={handleChange}>
//                     <option value="">Select Employee</option>
//                     {employees.map(emp => (
//                         <option key={emp.id} value={emp.id}>
//                             {emp.first_name} {emp.last_name}
//                         </option>
//                     ))}
//                 </select>

//                 <input name="vendor_rate" placeholder="Vendor Rate" onChange={handleChange} />

//                 <textarea name="remark" placeholder="Remark" onChange={handleChange} />
//                 <textarea name="extra_details" placeholder="Extra Details" onChange={handleChange} />

//                 <button type="submit">Create Candidate</button>
//             </form>
//         </div>
//     );
// }

// export default AddCandidate;


