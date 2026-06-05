import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { asList } from "../../utils/apiHelpers";
import BaseLayout from "../components/emp_base";

function AddCandidate() {
    const navigate = useNavigate();
    
    // Sabse pehle ye State define karna zaroori hai error hatane ke liye
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [form, setForm] = useState({
        candidate_name: "",
        candidate_email: "",
        candidate_number: "",
        skills: "",
        technology: "",
        years_of_experience_manual: "",
        years_of_experience_calculated: "",
        vendor: "",
        vendor_company_name: "",
        vendor_number: "",
        vendor_rate: "",
        vendor_rate_type: "",
        submitted_to: "",
        extra_details: ""
    });
    
    const [resumeFile, setResumeFile] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [searchVendor, setSearchVendor] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: "", type: "" });

    useEffect(() => {
        loadDropdowns();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchVendors(searchVendor);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchVendor]);

    const loadDropdowns = async () => {
        try {
            const empRes = await apiRequest("/employee-portal/api/employees/");
            setEmployees(asList(empRes));
            fetchVendors(""); 
        } catch (err) {
            console.error("Error loading dropdowns", err);
        }
    };

    const fetchVendors = async (query) => {
        try {
            const url = query 
                ? `/employee-portal/api/user/vendors/?search=${query}` 
                : "/employee-portal/api/user/vendors/";
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
    
    // Double Click Prevention
    if (isSubmitting) return; 

    setIsSubmitting(true); 

    const fd = new FormData();

    Object.keys(form).forEach((k) => {
        if (form[k] !== null && form[k] !== undefined && form[k] !== "") {
            fd.append(k, form[k]);
        }
    });

    if (resumeFile) fd.append("resume", resumeFile);

    try {
        const res = await apiRequest("/employee-portal/api/candidates/create/", "POST", fd);

        // Notification
        notify(res.message || "Candidate Created Successfully!");

        // Redirect after notification
        setTimeout(() => {
            navigate("/employee/user-candidates");
        }, 1500);

    } catch (err) {
        notify("Error creating candidate", "error");
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

            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                <div style={{marginTop: '15px'}}>
                    <h2 style={styles.title}>Add New Candidate</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={styles.container}>
                
                {/* 1. Resume Upload */}
                <div style={styles.section}>
                    <h3 style={styles.secTitle}>1. Resume Upload</h3>
                    <div style={styles.uploadCard}>
                        <input type="file" onChange={(e) => handleResumeUpload(e.target.files[0])} />
                        {isParsing && <p style={styles.parsingText}>Parsing Resume...</p>}
                    </div>
                </div>

                {/* 2. Candidate Details */}
                <div style={styles.section}>
                    <h3 style={styles.secTitle}>2. Candidate Details</h3>
                    <div style={styles.grid}>
                        <div style={styles.inputGroup}><label style={styles.label}>Full Name</label><input name="candidate_name" value={form.candidate_name} onChange={handleChange} style={styles.input} required /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Email ID</label><input name="candidate_email" value={form.candidate_email} onChange={handleChange} style={styles.input}  /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Phone Number</label><input name="candidate_number" value={form.candidate_number} onChange={handleChange} style={styles.input}  /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Skills</label><input name="skills" value={form.skills} onChange={handleChange} style={styles.input} /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Technology</label><input name="technology" value={form.technology} onChange={handleChange} style={styles.input} /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Experience (Manual)</label><input name="years_of_experience_manual" value={form.years_of_experience_manual} onChange={handleChange} style={styles.input} /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Experience (Calculated)</label><input name="years_of_experience_calculated" value={form.years_of_experience_calculated} onChange={handleChange} style={styles.input} /></div>
                    </div>
                </div>

                {/* 3. Vendor Section - 3 items in one line */}
                <div style={styles.section}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                        <h3 style={styles.secTitle}>3. Vendor Information</h3>
                    </div>
                    <div style={{...styles.grid, gridTemplateColumns: "repeat(3, 1fr)"}}>
                        <div style={{...styles.inputGroup, position: 'relative'}}>
                            <label style={styles.label}>Search & Select Vendor</label>
                            <input 
                                placeholder="Search..." 
                                value={searchVendor} 
                                required
                                onChange={(e) => { setSearchVendor(e.target.value); setShowDropdown(true); }} 
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 300)}
                                style={styles.input}
                                autoComplete="off"
                            />
                            {showDropdown && (
                                <div style={styles.dropdownList} required>
                                    {vendors.map(v => (
                                        <div key={v.id} onMouseDown={() => selectVendor(v)} style={styles.dropdownItem}>
                                            <strong>{v.name}</strong><br/>
                                            <small>{v.company_name}</small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={styles.inputGroup}><label style={styles.label}>Vendor Company Name</label><input value={form.vendor_company_name} style={styles.input} readOnly /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Vendor Contact</label><input value={form.vendor_number} style={styles.input} readOnly /></div>
                        
                        {/* Next line rate fields */}
                        <div style={styles.inputGroup}><label style={styles.label}>Vendor Rate</label><input name="vendor_rate" value={form.vendor_rate} onChange={handleChange} style={styles.input} required /></div>
                        <div style={styles.inputGroup}>
                            {/* <label style={styles.label}>Rate Type</label>
                            <select name="vendor_rate_type" value={form.vendor_rate_type} onChange={handleChange} style={styles.input} required>
                                <option value="">Select Type</option>
                                <option value="LPM">LPM</option><option value="KPM">KPM</option><option value="PHR">PHR</option><option value="LPA">LPA</option>
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

                <div style={styles.section}>
                    <h3 style={styles.secTitle}>4. Submission</h3>
                    <div style={styles.grid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Submitted To</label>
                            <select name="submitted_to" value={form.submitted_to} onChange={handleChange} style={styles.input}>
                                <option value="">Select</option>
                                {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>))}
                            </select>
                        </div>
                        <div style={styles.inputGroup}><label style={styles.label}>Extra Details</label><textarea name="extra_details" value={form.extra_details} onChange={handleChange} style={styles.textarea}></textarea></div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    style={{
                        ...styles.submitBtn, 
                        backgroundColor: isSubmitting ? "#BFC9D1" : "#FF9B51",
                        cursor: isSubmitting ? "not-allowed" : "pointer"
                    }}
                >
                    {isSubmitting ? "Submitting..." : "Submit Candidate"}
                </button>
            </form>
        </BaseLayout>
    );
}

const styles = {
    toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700' },
    backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer" },
    header: { marginBottom: "25px" },
    title: { color: "#25343F", fontSize: "28px", fontWeight: "800" },
    container: { display: "flex", flexDirection: "column", gap: "25px" },
    section: { background: "#fff", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" },
    secTitle: { fontSize: "16px", color: "#FF9B51", fontWeight: "800", marginBottom: "20px", borderBottom: "2px solid #F5F7F9", paddingBottom: "10px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
    label: { fontSize: "12px", fontWeight: "700", color: "#25343F", textTransform: "uppercase" },
    input: { padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", fontSize: "14px" },
    textarea: { padding: "12px", borderRadius: "10px", border: "1px solid #BFC9D1", minHeight: "80px" },
    dropdownList: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #BFC9D1', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000 },
    dropdownItem: { padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' },
    uploadCard: { padding: "20px", border: "2px dashed #FF9B51", borderRadius: "12px", textAlign: "center" },
    parsingText: { color: "#FF9B51", fontWeight: "bold" },
    submitBtn: { padding: "18px", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "800" }
};

export default AddCandidate;



// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// function AddCandidate() {
//     const navigate = useNavigate();
//     const [form, setForm] = useState({
//         candidate_name: "",
//         candidate_email: "",
//         candidate_number: "",
//         skills: "",
//         technology: "",
//         years_of_experience_manual: "",
//         years_of_experience_calculated: "",
//         vendor: "",
//         vendor_company_name: "",
//         vendor_number: "",
//         vendor_rate: "",
//         vendor_rate_type: "",
//         submitted_to: "",
//         extra_details: ""
//     });
//     const [resumeFile, setResumeFile] = useState(null);
//     const [vendors, setVendors] = useState([]);
//     const [employees, setEmployees] = useState([]);
//     const [searchVendor, setSearchVendor] = useState("");
//     const [isParsing, setIsParsing] = useState(false);
    
//     const [showDropdown, setShowDropdown] = useState(false);
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     useEffect(() => {
//         loadDropdowns();
//     }, []);

//     // Debounce Search Logic - Endpoint updated to /user/vendors/
//     useEffect(() => {
//         const delayDebounceFn = setTimeout(() => {
//             fetchVendors(searchVendor);
//         }, 500);
//         return () => clearTimeout(delayDebounceFn);
//     }, [searchVendor]);

//     const loadDropdowns = async () => {
//         try {
//             const empRes = await apiRequest("/employee-portal/api/employees/");
//             setEmployees(empRes || []);
//             fetchVendors(""); 
//         } catch (err) {
//             console.error("Error loading dropdowns", err);
//         }
//     };

//     const fetchVendors = async (query) => {
//         try {
//             // Correct Endpoint from your VendorList page
//             const url = query 
//                 ? `/employee-portal/api/user/vendors/?search=${query}` 
//                 : "/employee-portal/api/user/vendors/";
//             const res = await apiRequest(url);
//             setVendors(res.results || []);
//         } catch (err) {
//             console.error("Vendor fetch error:", err);
//         }
//     };

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleChange = (e) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     };

//     const selectVendor = (v) => {
//         setForm({
//             ...form,
//             vendor: v.id,
//             vendor_company_name: v.company_name || "",
//             vendor_number: v.number || ""
//         });
//         setSearchVendor(`${v.name} (${v.company_name})`);
//         setShowDropdown(false);
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
//                 notify("Resume parsed successfully!");
//             }
//         } catch (err) {
//             notify("Failed to parse resume", "error");
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
//             notify(res.message || "Candidate Created Successfully!");
//             setTimeout(() => {
//                 window.location.reload(); 
//             }, 2000);
//         } catch (err) {
//             notify("Error creating candidate", "error");
//         }
//     };

//     return (
//         <BaseLayout>
//             {toast.show && (
//                 <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
//                     {toast.msg}
//                 </div>
//             )}

//             <div style={styles.header}>
//                 <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                 <div style={{marginTop: '15px'}}>
//                     <h2 style={styles.title}>Add New Candidate</h2>
//                     <p style={styles.subtitle}>Upload resume to auto-fill or enter details manually</p>
//                 </div>
//             </div>

//             <form onSubmit={handleSubmit} style={styles.container}>
                
//                 {/* 1. Resume Upload Section */}
//                 <div style={styles.section}>
//                     <h3 style={styles.secTitle}>1. Resume Upload</h3>
//                     <div style={styles.uploadCard}>
//                         <input type="file" onChange={(e) => handleResumeUpload(e.target.files[0])} style={styles.fileInput} />
//                         {isParsing && <p style={styles.parsingText}>Parsing Resume... Please Wait</p>}
//                     </div>
//                 </div>

//                 {/* 2. Candidate Basic Details */}
//                 <div style={styles.section}>
//                     <h3 style={styles.secTitle}>2. Candidate Details</h3>
//                     <div style={styles.grid}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Full Name</label>
//                             <input name="candidate_name" value={form.candidate_name} onChange={handleChange} style={styles.input} placeholder="Enter Name" required />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Email ID</label>
//                             <input name="candidate_email" value={form.candidate_email} onChange={handleChange} style={styles.input} placeholder="example@mail.com"  />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Phone Number</label>
//                             <input name="candidate_number" value={form.candidate_number} onChange={handleChange} style={styles.input} placeholder="+91..."  />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Skills</label>
//                             <input name="skills" value={form.skills} onChange={handleChange} style={styles.input} placeholder="React, Python, etc." />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Technology</label>
//                             <input name="technology" value={form.technology} onChange={handleChange} style={styles.input} placeholder="Web Development" />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Experience (Manual Entry)</label>
//                             <input name="years_of_experience_manual" value={form.years_of_experience_manual} onChange={handleChange} style={styles.input} />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Experience (Calculated)</label>
//                             <input name="years_of_experience_calculated" value={form.years_of_experience_calculated} onChange={handleChange} style={styles.input} />
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
//                         <div style={{...styles.inputGroup, position: 'relative'}}>
//                             <label style={styles.label}>Search & Select Vendor</label>
//                             <input 
//                                 placeholder="Search name/company..." 
//                                 value={searchVendor} 
//                                 required
//                                 onChange={(e) => {
//                                     setSearchVendor(e.target.value);
//                                     setShowDropdown(true);
//                                 }} 
//                                 onFocus={() => setShowDropdown(true)}
//                                 onBlur={() => setTimeout(() => setShowDropdown(false), 300)}
//                                 style={styles.input}
//                                 autoComplete="off"
//                             />
//                             {showDropdown && (
//                                 <div style={styles.dropdownList}>
//                                     {vendors.length > 0 ? (
//                                         vendors.map(v => (
//                                             <div key={v.id} onMouseDown={() => selectVendor(v)} style={styles.dropdownItem}>
//                                                 <div style={{fontWeight: '700'}}>{v.name}</div>
//                                                 <div style={{fontSize: '11px', color: '#666'}}>{v.company_name} | {v.number}</div>
//                                             </div>
//                                         ))
//                                     ) : (
//                                         <div style={{padding: '10px', textAlign: 'center', color: '#999'}}>No Vendors Found</div>
//                                     )}
//                                 </div>
//                             )}
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Company Name</label>
//                             <input value={form.vendor_company_name} style={styles.input} readOnly />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Contact</label>
//                             <input value={form.vendor_number} style={styles.input} readOnly />
//                         </div>
//                         <br />
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Rate (Expected)</label>
//                             <input name="vendor_rate" value={form.vendor_rate} onChange={handleChange} style={styles.input} placeholder="Rate in INR" required />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Rate Type</label>
//                             <select name="vendor_rate_type" value={form.vendor_rate_type} onChange={handleChange} style={styles.input} required>
//                                 <option value="">Select Type</option>
//                                 <option value="LPM">LPM</option>
//                                 <option value="KPM">KPM</option>
//                                 <option value="PHR">PHR</option>
//                                 <option value="LPA">LPA</option>
//                             </select>
//                         </div>
//                     </div>
//                 </div>

//                 {/* 4. Submission & Remarks */}
//                 <div style={styles.section}>
//                     <h3 style={styles.secTitle}>4. Submission & Remarks</h3>
//                     <div style={styles.grid}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Submitted To (Internal)</label>
//                             <select name="submitted_to" value={form.submitted_to} onChange={handleChange} style={styles.input}>
//                                 <option value="">Select Employee</option>
//                                 {employees.map(emp => (
//                                     <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
//                                 ))}
//                             </select>
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Extra Details</label>
//                             <textarea name="extra_details" value={form.extra_details} onChange={handleChange} style={styles.textarea} placeholder="Additional info..."></textarea>
//                         </div>
//                     </div>
//                 </div>

//                 <button type="submit" style={styles.submitBtn}>Submit Candidate</button>
//             </form>
//         </BaseLayout>
//     );
// }

// const styles = {
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
//     backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
//     dropdownList: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #BFC9D1', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginTop: '5px' },
//     dropdownItem: { padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' },
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
    
//     // Naye States: Dropdown aur Toast ke liye
//     const [showDropdown, setShowDropdown] = useState(false);
//     const [toast, setToast] = useState({ show: false, msg: "", type: "" });

//     useEffect(() => {
//         loadDropdowns();
//     }, []);

//     // Debounce Search Logic
//     useEffect(() => {
//         const delayDebounceFn = setTimeout(() => {
//             fetchVendors(searchVendor);
//         }, 500);
//         return () => clearTimeout(delayDebounceFn);
//     }, [searchVendor]);

//     const loadDropdowns = async () => {
//         const empRes = await apiRequest("/employee-portal/api/employees/");
//         setEmployees(empRes || []);
//         fetchVendors(""); // Initial vendors load
//     };

//     const fetchVendors = async (query) => {
//         try {
//             const url = query 
//                 ? `/employee-portal/api/vendors/?search=${query}` 
//                 : "/employee-portal/api/vendors/";
//             const res = await apiRequest(url);
//             setVendors(res.results || []);
//         } catch (err) {
//             console.error("Vendor fetch error:", err);
//         }
//     };

//     const notify = (msg, type = "success") => {
//         setToast({ show: true, msg, type });
//         setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
//     };

//     const handleChange = (e) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     };

//     // Naya Select Vendor Logic (Searchable dropdown ke liye)
//     const selectVendor = (v) => {
//         setForm({
//             ...form,
//             vendor: v.id,
//             vendor_company_name: v.company_name || "",
//             vendor_number: v.number || ""
//         });
//         setSearchVendor(`${v.name} (${v.company_name})`);
//         setShowDropdown(false);
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
//                 notify("Resume parsed successfully!");
//             }
//         } catch (err) {
//             notify("Failed to parse resume", "error");
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
//             notify(res.message || "Candidate Created Successfully!");
            
//             setTimeout(() => {
//             window.location.reload();   
//             }, 3000);

//         } catch (err) {
//             notify("Error creating candidate", "error");
//         }
//         window.location.reload();

//     };

//     return (
//         <BaseLayout>
//             {/* Toast Notification */}
//             {toast.show && (
//                 <div style={{...styles.toast, backgroundColor: toast.type === 'error' ? '#E74C3C' : '#27AE60'}}>
//                     {toast.msg}
//                 </div>
//             )}

//             <div style={styles.header}>
//                 {/* Back Button */}
//                 <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                 <div style={{marginTop: '15px'}}>
//                     <h2 style={styles.title}>Add New Candidate</h2>
//                     <p style={styles.subtitle}>Upload resume to auto-fill or enter details manually</p>
//                 </div>
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

//                 {/* 3. Vendor Section (Updated with Searchable Dropdown) */}
//                 <div style={styles.section}>
//                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
//                         <h3 style={styles.secTitle}>3. Vendor Information</h3>
//                         <button type="button" onClick={() => navigate("/employee/vendor/add")} style={styles.addVendorBtn}>+ Add Vendor</button>
//                     </div>
//                     <div style={styles.grid}>
//                         <div style={{...styles.inputGroup, position: 'relative'}}>
//                             <label style={styles.label}>Search & Select Vendor</label>
//                             <input 
//                                 placeholder="Search name/company..." 
//                                 value={searchVendor} 
//                                 required={true}
//                                 onChange={(e) => {
//                                     setSearchVendor(e.target.value);
//                                     setShowDropdown(true);
//                                 }} 
//                                 onFocus={() => setShowDropdown(true)}
//                                 onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
//                                 style={styles.input}
                               
//                             />
//                             {/* Dropdown Results */}
//                             {showDropdown && vendors.length > 0 && (
//                                 <div style={styles.dropdownList}>
//                                     {vendors.map(v => (
//                                         <div 
//                                             key={v.id} 
//                                             onMouseDown={() => selectVendor(v)}
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
//                             <label style={styles.label}>Vendor Company Name</label>
//                             <input name="vendor_company_name" value={form.vendor_company_name || ""} onChange={handleChange} style={styles.input} readOnly />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Contact</label>
//                             <input name="vendor_number" value={form.vendor_number || ""} onChange={handleChange} style={styles.input} readOnly />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Rate (Expected)</label>
//                             <input name="vendor_rate" onChange={handleChange} style={styles.input} placeholder="Rate in INR" required />
//                         </div>

//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Vendor Rate Type</label>
//                             <select
//                                 name="vendor_rate_type"
//                                 value={form.vendor_rate_type || ""}
//                                 onChange={handleChange}
//                                 style={styles.input}
//                                 required
//                             >
//                                 <option value="">Select Type</option>
//                                 <option value="LPM">LPM</option>
//                                 <option value="KPM">KPM</option>
//                                 <option value="PHR">PHR</option>
//                                 <option value="LPA">LPA</option>
//                             </select>
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
//                         {/* Aapne kaha tha commented as it is rahe */}
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
//     // Naye styles Back Button, Toast aur Dropdown ke liye
//     toast: { position: 'fixed', top: '85px', right: '20px', color: '#fff', padding: '12px 25px', borderRadius: '8px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
//     backBtn: { background: "#25343F", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
//     dropdownList: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #BFC9D1', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginTop: '5px' },
//     dropdownItem: { padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' },

//     // Purane Styles same to same
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


