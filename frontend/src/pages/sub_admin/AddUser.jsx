import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AddUser() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        number: "",
        password: "",
        role: "EMPLOYEE",
        profile_picture: null
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, profile_picture: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();

        data.append("first_name", formData.first_name);
        data.append("last_name", formData.last_name);
        data.append("email", formData.email);
        data.append("number", formData.number);
        data.append("password", formData.password);
        data.append("role", formData.role);

        if (formData.profile_picture) {
            data.append("profile_picture", formData.profile_picture);
        }

        try {
            const response = await apiRequest("/sub-admin/api/users/", "POST", data);

            if (response.success) {

                if (formData.role === "ACCOUNTANT") {
                    toast.success("Accountant created successfully!");
                } else {
                    toast.success("Recruiter created successfully!");
                }

                setTimeout(() => navigate("/sub-admin/team-manage"), 2000);

            } else if (response.errors) {
                toast.error("Error: " + JSON.stringify(response.errors));
            } else {
                toast.error("Something went wrong.");
            }

        } catch (error) {
            console.error(error);
            toast.error("Server error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseLayout>
            <ToastContainer position="top-right" autoClose={3000} />

            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
                <h2 style={styles.pageTitle}>Add Team Member</h2>
            </div>

            <div style={styles.formCard}>
                <form onSubmit={handleSubmit} style={styles.form}>

                    <div style={styles.row}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>First Name *</label>
                            <input
                                type="text"
                                name="first_name"
                                required
                                style={styles.input}
                                onChange={handleChange}
                                placeholder="e.g. Rahul"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                style={styles.input}
                                onChange={handleChange}
                                placeholder="e.g. Sharma"
                            />
                        </div>
                    </div>


                    <div style={styles.row}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                required
                                style={styles.input}
                                onChange={handleChange}
                                placeholder="rahul@gmail.com"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password *</label>
                            <input
                                type="password"
                                name="password"
                                required
                                style={styles.input}
                                onChange={handleChange}
                                placeholder="Minimum 8 characters"
                            />
                        </div>
                    </div>


                    <div style={styles.row}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Phone Number</label>
                            <input
                                type="text"
                                name="number"
                                style={styles.input}
                                onChange={handleChange}
                                placeholder="9876543210"
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Role *</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                style={styles.input}
                            >
                                <option value="EMPLOYEE">Recruiter</option>
                                <option value="ACCOUNTANT">Accountant</option>
                            </select>
                        </div>
                    </div>


                    <div style={styles.row}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Profile Picture</label>
                            <input
                                type="file"
                                style={styles.input}
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                        </div>
                    </div>


                    <div style={styles.btnContainer}>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            style={styles.cancelBtn}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            style={styles.submitBtn}
                        >
                            {loading ? "Creating..." : "Save User"}
                        </button>
                    </div>

                </form>
            </div>
        </BaseLayout>
    );
}

const styles = {
    header: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" },

    backBtn: {
        background: "#1e293b",
        color: "white",
        border: "none",
        fontWeight: "700",
        cursor: "pointer",
        padding:"10px 15px",
        borderRadius:"10px"
    },

    pageTitle: {
        fontSize: "24px",
        color: "#25343F",
        fontWeight: "800",
        margin: 0
    },

    formCard: {
        background: "#fff",
        padding: "40px",
        borderRadius: "16px",
        boxShadow: "0 4px 25px rgba(37, 52, 63, 0.05)",
        border: "1px solid #BFC9D1"
    },

    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px"
    },

    row: {
        display: "flex",
        gap: "20px",
        flexWrap: "wrap"
    },

    inputGroup: {
        flex: 1,
        minWidth: "300px",
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },

    label: {
        fontSize: "14px",
        color: "#25343F",
        fontWeight: "700"
    },

    input: {
        padding: "12px 15px",
        borderRadius: "10px",
        border: "1px solid #BFC9D1",
        outline: "none",
        fontSize: "14px",
        color: "#25343F"
    },

    btnContainer: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "15px",
        marginTop: "20px"
    },

    cancelBtn: {
        padding: "12px 25px",
        borderRadius: "10px",
        border: "1px solid #BFC9D1",
        background: "#fff",
        fontWeight: "700",
        cursor: "pointer"
    },

    submitBtn: {
        padding: "12px 35px",
        borderRadius: "10px",
        border: "none",
        background: "#FF9B51",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(255, 155, 81, 0.3)"
    }
};

export default AddUser;









// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/SubAdminLayout";
// // Toast imports
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// function AddUser() {
//     const navigate = useNavigate();
//     const [loading, setLoading] = useState(false);
    
//     // Initial State - Role set to EMPLOYEE by default
//     const [formData, setFormData] = useState({
//         first_name: "",
//         last_name: "",
//         email: "",
//         number: "",
//         password: "",
//         role: "EMPLOYEE", // Default role
//         profile_picture: null
//     });

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData({ ...formData, [name]: value });
//     };

//     const handleFileChange = (e) => {
//         setFormData({ ...formData, profile_picture: e.target.files[0] });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);

//         const data = new FormData();
//         data.append("first_name", formData.first_name);
//         data.append("last_name", formData.last_name);
//         data.append("email", formData.email);
//         data.append("number", formData.number);
//         data.append("password", formData.password);
//         data.append("role", "EMPLOYEE"); // Explicitly sending EMPLOYEE
        
//         if (formData.profile_picture) {
//             data.append("profile_picture", formData.profile_picture);
//         }

//         try {
//             const response = await apiRequest("/sub-admin/api/users/", "POST", data);
            
//             if (response.id) {
//                 toast.success("Employee created successfully!");
//                 setTimeout(() => navigate("/sub-admin/team-manage"), 2000);
//             } else if (response.detail) {
//                 toast.error(`Error: ${response.detail}`);
//             } else {
//                 toast.error("Something went wrong. Please check the data.");
//             }
//         } catch (error) {
//             console.error("Post Error:", error);
//             toast.error("Failed to connect to server.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <BaseLayout>
//             <ToastContainer position="top-right" autoClose={3000} />
            
//             <div style={styles.header}>
//                 <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                 <h2 style={styles.pageTitle}>Add New Employee</h2>
//             </div>

//             <div style={styles.formCard}>
//                 <form onSubmit={handleSubmit} style={styles.form}>
//                     <div style={styles.row}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>First Name *</label>
//                             <input 
//                                 type="text" name="first_name" required
//                                 style={styles.input} onChange={handleChange}
//                                 placeholder="e.g. Rahul"
//                             />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Last Name</label>
//                             <input 
//                                 type="text" name="last_name" 
//                                 style={styles.input} onChange={handleChange}
//                                 placeholder="e.g. Sharma"
//                             />
//                         </div>
//                     </div>

//                     <div style={styles.row}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Email Address *</label>
//                             <input 
//                                 type="email" name="email" required
//                                 style={styles.input} onChange={handleChange}
//                                 placeholder="rahul@gmail.com"
//                             />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Password *</label>
//                             <input 
//                                 type="password" name="password" required
//                                 style={styles.input} onChange={handleChange}
//                                 placeholder="Minimum 8 characters"
//                             />
//                         </div>
//                     </div>

//                     <div style={styles.row}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Phone Number</label>
//                             <input 
//                                 type="text" name="number" 
//                                 style={styles.input} onChange={handleChange}
//                                 placeholder="9876543210"
//                             />
//                         </div>
//                         {/* Role dropdown removed from UI */}
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Profile Picture</label>
//                             <input 
//                                 type="file" style={styles.input} 
//                                 onChange={handleFileChange} accept="image/*"
//                             />
//                         </div>
//                     </div>

//                     <div style={styles.btnContainer}>
//                         <button type="button" onClick={() => navigate(-1)} style={styles.cancelBtn}>
//                             Cancel
//                         </button>
//                         <button type="submit" disabled={loading} style={styles.submitBtn}>
//                             {loading ? "Creating..." : "Save Employee"}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </BaseLayout>
//     );
// }

// const styles = {
//     header: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" },
//     backBtn: { background: "transparent", color: "#25343F", border: "none", fontWeight: "700", cursor: "pointer" },
//     pageTitle: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
//     formCard: { 
//         background: "#fff", padding: "40px", borderRadius: "16px", 
//         boxShadow: "0 4px 25px rgba(37, 52, 63, 0.05)", border: "1px solid #BFC9D1" 
//     },
//     form: { display: "flex", flexDirection: "column", gap: "20px" },
//     row: { display: "flex", gap: "20px", flexWrap: "wrap" },
//     inputGroup: { flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "8px" },
//     label: { fontSize: "14px", color: "#25343F", fontWeight: "700" },
//     input: { 
//         padding: "12px 15px", borderRadius: "10px", border: "1px solid #BFC9D1", 
//         outline: "none", fontSize: "14px", color: "#25343F" 
//     },
//     btnContainer: { display: "flex", justifyContent: "flex-end", gap: "15px", marginTop: "20px" },
//     cancelBtn: { 
//         padding: "12px 25px", borderRadius: "10px", border: "1px solid #BFC9D1", 
//         background: "#fff", fontWeight: "700", cursor: "pointer" 
//     },
//     submitBtn: { 
//         padding: "12px 35px", borderRadius: "10px", border: "none", 
//         background: "#FF9B51", color: "#fff", fontWeight: "700", 
//         cursor: "pointer", boxShadow: "0 4px 12px rgba(255, 155, 81, 0.3)" 
//     }
// };

// export default AddUser;





// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/SubAdminLayout";
// // Toast imports
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// function AddUser() {
//     const navigate = useNavigate();
//     const [loading, setLoading] = useState(false);
    
//     // Initial State - Added Password
//     const [formData, setFormData] = useState({
//         first_name: "",
//         last_name: "",
//         email: "",
//         number: "",
//         password: "", // New Field
//         role: "EMPLOYEE",
//         profile_picture: null
//     });

//     const roles = [
//         { value: "CENTRAL_ADMIN", label: "Central Admin" },
//         { value: "SUB_ADMIN", label: "Sub Admin" },
//         { value: "EMPLOYEE", label: "Employee" }
//     ];

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData({ ...formData, [name]: value });
//     };

//     const handleFileChange = (e) => {
//         setFormData({ ...formData, profile_picture: e.target.files[0] });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);

//         const data = new FormData();
//         data.append("first_name", formData.first_name);
//         data.append("last_name", formData.last_name);
//         data.append("email", formData.email);
//         data.append("number", formData.number);
//         data.append("password", formData.password); // Appending Password
//         data.append("role", formData.role);
//         if (formData.profile_picture) {
//             data.append("profile_picture", formData.profile_picture);
//         }

//         try {
//             const response = await apiRequest("/sub-admin/api/users/", "POST", data);
            
//             // Checking for CSRF or Auth errors in response
//             if (response.id) {
//                 toast.success("User created successfully!");
//                 setTimeout(() => navigate("/sub-admin/team-manage"), 2000);
//             } else if (response.detail) {
//                 toast.error(`Error: ${response.detail}`);
//             } else {
//                 toast.error("Something went wrong. Please check the data.");
//             }
//         } catch (error) {
//             console.error("Post Error:", error);
//             toast.error("Failed to connect to server.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <BaseLayout>
//             <ToastContainer position="top-right" autoClose={3000} />
            
//             <div style={styles.header}>
//                 <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
//                 <h2 style={styles.pageTitle}>Add New Employee</h2>
//             </div>

//             <div style={styles.formCard}>
//                 <form onSubmit={handleSubmit} style={styles.form}>
//                     <div style={styles.row}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>First Name *</label>
//                             <input 
//                                 type="text" name="first_name" required
//                                 style={styles.input} onChange={handleChange}
//                                 placeholder="e.g. Rahul"
//                             />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Last Name</label>
//                             <input 
//                                 type="text" name="last_name" 
//                                 style={styles.input} onChange={handleChange}
//                                 placeholder="e.g. Sharma"
//                             />
//                         </div>
//                     </div>

//                     <div style={styles.row}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Email Address *</label>
//                             <input 
//                                 type="email" name="email" required
//                                 style={styles.input} onChange={handleChange}
//                                 placeholder="rahul@gmail.com"
//                             />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Password *</label>
//                             <input 
//                                 type="password" name="password" required
//                                 style={styles.input} onChange={handleChange}
//                                 placeholder="Minimum 8 characters"
//                             />
//                         </div>
//                     </div>

//                     <div style={styles.row}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Phone Number</label>
//                             <input 
//                                 type="text" name="number" 
//                                 style={styles.input} onChange={handleChange}
//                                 placeholder="9876543210"
//                             />
//                         </div>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Role</label>
//                             <select 
//                                 name="role" style={styles.input} 
//                                 value={formData.role} onChange={handleChange}
//                             >
//                                 {roles.map(role => (
//                                     <option key={role.value} value={role.value}>
//                                         {role.label}
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>
//                     </div>

//                     <div style={styles.row}>
//                         <div style={styles.inputGroup}>
//                             <label style={styles.label}>Profile Picture</label>
//                             <input 
//                                 type="file" style={styles.input} 
//                                 onChange={handleFileChange} accept="image/*"
//                             />
//                         </div>
//                     </div>

//                     <div style={styles.btnContainer}>
//                         <button type="button" onClick={() => navigate(-1)} style={styles.cancelBtn}>
//                             Cancel
//                         </button>
//                         <button type="submit" disabled={loading} style={styles.submitBtn}>
//                             {loading ? "Creating..." : "Save User"}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </BaseLayout>
//     );
// }

// const styles = {
//     header: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" },
//     backBtn: { background: "transparent", color: "#25343F", border: "none", fontWeight: "700", cursor: "pointer" },
//     pageTitle: { fontSize: "24px", color: "#25343F", fontWeight: "800", margin: 0 },
//     formCard: { 
//         background: "#fff", padding: "40px", borderRadius: "16px", 
//         boxShadow: "0 4px 25px rgba(37, 52, 63, 0.05)", border: "1px solid #BFC9D1" 
//     },
//     form: { display: "flex", flexDirection: "column", gap: "20px" },
//     row: { display: "flex", gap: "20px", flexWrap: "wrap" },
//     inputGroup: { flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "8px" },
//     label: { fontSize: "14px", color: "#25343F", fontWeight: "700" },
//     input: { 
//         padding: "12px 15px", borderRadius: "10px", border: "1px solid #BFC9D1", 
//         outline: "none", fontSize: "14px", color: "#25343F" 
//     },
//     btnContainer: { display: "flex", justifyContent: "flex-end", gap: "15px", marginTop: "20px" },
//     cancelBtn: { 
//         padding: "12px 25px", borderRadius: "10px", border: "1px solid #BFC9D1", 
//         background: "#fff", fontWeight: "700", cursor: "pointer" 
//     },
//     submitBtn: { 
//         padding: "12px 35px", borderRadius: "10px", border: "none", 
//         background: "#FF9B51", color: "#fff", fontWeight: "700", 
//         cursor: "pointer", boxShadow: "0 4px 12px rgba(255, 155, 81, 0.3)" 
//     }
// };

// export default AddUser;