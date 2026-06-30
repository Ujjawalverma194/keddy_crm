// import React, { useState, useEffect } from "react";
// import { apiRequest } from "../services/api";
// import { useNavigate, Link } from "react-router-dom";

// // Helper: map role to its home dashboard path
// const ROLE_HOME = {
//     CENTRAL_ADMIN: "/central-admin",
//     SUB_ADMIN: "/sub-admin",
//     EMPLOYEE: "/employee",
//     ACCOUNTANT: "/accounts",
// };

// function Login() {
//     const navigate = useNavigate();
//     const [form, setForm] = useState({
//         email: "",
//         password: "",
//     });
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");

//     // ✅ If already logged in, redirect to correct dashboard
//     useEffect(() => {
//         const token = localStorage.getItem("access");
//         const role = localStorage.getItem("role");
//         if (token && role && ROLE_HOME[role]) {
//             navigate(ROLE_HOME[role], { replace: true });
//         }
//     }, [navigate]);

//     const handleChange = (e) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setError("");

//         try {
//             // ✅ Clear ALL old auth data before new login (prevents cross-role contamination)
//             localStorage.removeItem("access");
//             localStorage.removeItem("refresh");
//             localStorage.removeItem("role");

//             const res = await apiRequest("/api/login/", "POST", form);

//             if (res.access) {
//                 localStorage.setItem("access", res.access);
//             }

//             if (res.refresh) {
//                 localStorage.setItem("refresh", res.refresh);
//             }

//             // ✅ Store role in localStorage so ProtectedRoute can check it
//             if (res.role) {
//                 localStorage.setItem("role", res.role);
//             }

//             // ✅ Role based navigation with replace: true (prevents back-button to login)
//             const home = ROLE_HOME[res.role];
//             if (home) {
//                 navigate(home, { replace: true });
//             } else {
//                 setError("Login failed. Please check your credentials.");
//             }

//         } catch (err) {
//             setError("Invalid credentials or server error.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div style={styles.page}>
//             <div style={styles.card}>
//                 <h1 style={styles.title}>Keddy CRM</h1>
//                 <p style={styles.subtitle}>Welcome back! Please login.</p>

//                 {error && <div style={styles.errorBox}>{error}</div>}

//                 <form onSubmit={handleSubmit} style={styles.form}>
//                     <input
//                         style={styles.input}
//                         name="email"
//                         type="email"
//                         placeholder="Email Address"
//                         onChange={handleChange}
//                         required
//                     />

//                     <input
//                         style={styles.input}
//                         name="password"
//                         type="password"
//                         placeholder="Password"
//                         onChange={handleChange}
//                         required
//                     />

//                     <button
//                         style={styles.button}
//                         type="submit"
//                         disabled={loading}
//                     >
//                         {loading ? "Logging in..." : "Login"}
//                     </button>
//                 </form>

//                 <p style={styles.footerText}>
//                     Don't have an account?{" "}
//                     <Link to="/register" style={styles.link}>
//                         Register here
//                     </Link>
//                 </p>
//             </div>
//         </div>
//     );
// }

// const styles = {
//     page: {
//         minHeight: "100vh",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         backgroundColor: "#EAEFEF",
//         fontFamily: "'Segoe UI', Roboto, sans-serif",
//     },
//     card: {
//         width: "90%",
//         maxWidth: 400,
//         backgroundColor: "#BFC9D1",
//         borderRadius: 16,
//         padding: "40px 32px",
//         boxShadow: "0 10px 25px rgba(37, 52, 63, 0.1)",
//         textAlign: "center",
//     },
//     title: {
//         margin: 0,
//         fontSize: 32,
//         fontWeight: 700,
//         color: "#25343F",
//     },
//     subtitle: {
//         marginTop: 8,
//         marginBottom: 24,
//         color: "#25343F",
//         opacity: 0.8,
//         fontSize: 15,
//     },
//     errorBox: {
//         background: "#fee2e2",
//         color: "#991b1b",
//         padding: "10px",
//         borderRadius: 8,
//         marginBottom: 16,
//         fontSize: 14,
//         border: "1px solid #fecaca",
//     },
//     form: {
//         display: "flex",
//         flexDirection: "column",
//         gap: 15,
//     },
//     input: {
//         width: "100%",
//         padding: "14px",
//         borderRadius: 10,
//         border: "1px solid #25343F",
//         fontSize: 15,
//         outline: "none",
//         backgroundColor: "#ffffff",
//         color: "#25343F",
//         boxSizing: "border-box",
//     },
//     button: {
//         marginTop: 5,
//         padding: "14px",
//         borderRadius: 10,
//         border: "none",
//         background: "#FF9B51",
//         color: "#ffffff",
//         fontSize: 16,
//         fontWeight: 700,
//         cursor: "pointer",
//         boxShadow: "0 4px 12px rgba(255, 155, 81, 0.3)",
//     },
//     footerText: {
//         marginTop: 20,
//         fontSize: 14,
//         color: "#25343F",
//     },
//     link: {
//         color: "#FF9B51",
//         textDecoration: "none",
//         fontWeight: 700,
//     },
// };

// export default Login;





// // import React, { useState } from "react";
// // import { apiRequest } from "../services/api";
// // import { useNavigate, Link } from "react-router-dom";

// // function Login() {
// //     const navigate = useNavigate();
// //     const [form, setForm] = useState({
// //         email: "",
// //         password: "",
// //     });
// //     const [loading, setLoading] = useState(false);
// //     const [error, setError] = useState("");

// //     const handleChange = (e) => {
// //         setForm({...form, [e.target.name]: e.target.value });
// //     };

// //     const handleSubmit = async(e) => {
// //         e.preventDefault();
// //         setLoading(true);
// //         setError("");

// //         try {
// //             const res = await apiRequest("/api/login/", "POST", form);
// //             console.log("Login Response:",res.access); 
// //             localStorage.setItem("token", res.access);

// //             if (res.role === "CENTRAL_ADMIN") navigate("/central-admin");
// //             else if (res.role === "SUB_ADMIN") navigate("/sub-admin");
// //             else if (res.role === "EMPLOYEE") navigate("/employee");
// //             else setError("Login failed. Please check your credentials.");
// //         } catch (err) {
// //             setError("Something went wrong. Please try again.");
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     return ( <
// //         div style = { styles.page } >
// //         <
// //         div style = { styles.card } >
// //         <
// //         h1 style = { styles.title } > Keddy CRM < /h1> <
// //         p style = { styles.subtitle } > Welcome back!Please login. < /p>

// //         {
// //             error && < div style = { styles.errorBox } > { error } < /div>}

// //             <
// //             form onSubmit = { handleSubmit }
// //             style = { styles.form } >
// //                 <
// //                 input
// //             style = { styles.input }
// //             name = "email"
// //             type = "email"
// //             placeholder = "Email Address"
// //             onChange = { handleChange }
// //             required
// //                 /
// //                 >
// //                 <
// //                 input
// //             style = { styles.input }
// //             name = "password"
// //             type = "password"
// //             placeholder = "Password"
// //             onChange = { handleChange }
// //             required
// //                 /
// //                 >
// //                 <
// //                 button
// //             style = { styles.button }
// //             type = "submit"
// //             disabled = { loading } > { loading ? "Logging in..." : "Login" } <
// //                 /button> < /
// //             form >

// //                 <
// //                 p style = { styles.footerText } >
// //                 Don 't have an account?{" "} <
// //             Link to = "/register"
// //             style = { styles.link } >
// //                 Register here <
// //                 /Link> < /
// //             p > <
// //                 /div> < /
// //             div >
// //         );
// //     }

// //     const styles = {
// //         page: {
// //             minHeight: "100vh",
// //             display: "flex",
// //             alignItems: "center",
// //             justifyContent: "center",
// //             backgroundColor: "#EAEFEF", // Updated: Light Mist
// //             fontFamily: "'Segoe UI', Roboto, sans-serif",
// //         },
// //         card: {
// //             width: "90%",
// //             maxWidth: 400,
// //             backgroundColor: "#BFC9D1", // Updated: Soft Blue-Gray
// //             borderRadius: 16,
// //             padding: "40px 32px",
// //             boxShadow: "0 10px 25px rgba(37, 52, 63, 0.1)", // Shadow adjusted to Dark Navy
// //             textAlign: "center",
// //         },
// //         title: {
// //             margin: 0,
// //             fontSize: 32,
// //             fontWeight: 700,
// //             color: "#25343F", // Updated: Dark Navy
// //             letterSpacing: "0.9px",
// //         },
// //         subtitle: {
// //             marginTop: 8,
// //             marginBottom: 24,
// //             color: "#25343F", // Updated: Dark Navy (matching heading)
// //             opacity: 0.8,
// //             fontSize: 15,
// //         },
// //         errorBox: {
// //             background: "#fee2e2",
// //             color: "#991b1b",
// //             padding: "10px",
// //             borderRadius: 8,
// //             marginBottom: 16,
// //             fontSize: 14,
// //             border: "1px solid #fecaca",
// //         },
// //         form: {
// //             display: "flex",
// //             flexDirection: "column",
// //             gap: 15,
// //         },
// //         input: {
// //             width: "100%",
// //             padding: "14px",
// //             borderRadius: 10,
// //             border: "1px solid #25343F", // Updated: Dark Navy border
// //             fontSize: 15,
// //             outline: "none",
// //             backgroundColor: "#ffffff",
// //             color: "#25343F", // Updated: Dark Navy
// //             boxSizing: "border-box",
// //         },
// //         button: {
// //             marginTop: 5,
// //             padding: "14px",
// //             borderRadius: 10,
// //             border: "none",
// //             background: "#FF9B51", // Updated: Vibrant Orange
// //             color: "#ffffff",
// //             fontSize: 16,
// //             fontWeight: 700,
// //             cursor: "pointer",
// //             boxShadow: "0 4px 12px rgba(255, 155, 81, 0.3)",
// //         },
// //         footerText: {
// //             marginTop: 20,
// //             fontSize: 14,
// //             color: "#25343F", // Updated: Dark Navy
// //         },
// //         link: {
// //             color: "#FF9B51", // Updated: Vibrant Orange
// //             textDecoration: "none",
// //             fontWeight: 700,
// //         },
// //     };

// //     export default Login;







//     // // src/pages/Login.js

//     // import React, { useState } from "react";
//     // import { apiRequest } from "../services/api";
//     // import { useNavigate, Link } from "react-router-dom";

//     // function Login() {
//     //     const navigate = useNavigate();
//     //     const [form, setForm] = useState({
//     //         email: "",
//     //         password: "",
//     //     });
//     //     const [loading, setLoading] = useState(false);
//     //     const [error, setError] = useState("");

//     //     const handleChange = (e) => {
//     //         setForm({...form, [e.target.name]: e.target.value });
//     //     };

//     //     const handleSubmit = async(e) => {
//     //         e.preventDefault();
//     //         setLoading(true);
//     //         setError("");

//     //         try {
//     //             const res = await apiRequest("/api/login/", "POST", form);

//     //             if (res.role === "CENTRAL_ADMIN") navigate("/central-admin");
//     //             else if (res.role === "SUB_ADMIN") navigate("/sub-admin");
//     //             else if (res.role === "EMPLOYEE") navigate("/employee");
//     //             else setError("Login failed. Please check your credentials.");
//     //         } catch (err) {
//     //             setError("Something went wrong. Please try again.");
//     //         } finally {
//     //             setLoading(false);
//     //         }
//     //     };

//     //     return ( <
//     //         div style = { styles.page } >
//     //         <
//     //         div style = { styles.card } >
//     //         <
//     //         h1 style = { styles.title } > Keddy CRM < /h1> <
//     //         p style = { styles.subtitle } > Welcome back!Please login. < /p>

//     //         {
//     //             error && < div style = { styles.errorBox } > { error } < /div>}

//     //             <
//     //             form onSubmit = { handleSubmit }
//     //             style = { styles.form } >
//     //                 <
//     //                 input
//     //             style = { styles.input }
//     //             name = "email"
//     //             type = "email"
//     //             placeholder = "Email Address"
//     //             onChange = { handleChange }
//     //             required
//     //                 /
//     //                 >
//     //                 <
//     //                 input
//     //             style = { styles.input }
//     //             name = "password"
//     //             type = "password"
//     //             placeholder = "Password"
//     //             onChange = { handleChange }
//     //             required
//     //                 /
//     //                 >
//     //                 <
//     //                 button
//     //             style = { styles.button }
//     //             type = "submit"
//     //             disabled = { loading } > { loading ? "Logging in..." : "Login" } <
//     //                 /button> < /
//     //             form >

//     //                 <
//     //                 p style = { styles.footerText } >
//     //                 Don 't have an account?{" "} <
//     //             Link to = "/register"
//     //             style = { styles.link } >
//     //                 Register here <
//     //                 /Link> < /
//     //             p > <
//     //                 /div> < /
//     //             div >
//     //         );
//     //     }

//     //     const styles = {
//     //         page: {
//     //             minHeight: "100vh",
//     //             display: "flex",
//     //             alignItems: "center",
//     //             justifyContent: "center",
//     //             backgroundColor: "#FAF3E1", // Theme Background
//     //             fontFamily: "'Segoe UI', Roboto, sans-serif",
//     //         },
//     //         card: {
//     //             width: "90%",
//     //             maxWidth: 400,
//     //             backgroundColor: "#F5E7C6", // Theme Card
//     //             borderRadius: 16,
//     //             padding: "40px 32px",
//     //             boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
//     //             textAlign: "center",
//     //         },
//     //         title: {
//     //             margin: 0,
//     //             fontSize: 32,
//     //             fontWeight: 700,
//     //             color: "#222222",
//     //             letterSpacing: "0.9px",
//     //         },
//     //         subtitle: {
//     //             marginTop: 8,
//     //             marginBottom: 24,
//     //             color: "#555555",
//     //             fontSize: 15,
//     //         },
//     //         errorBox: {
//     //             background: "#fee2e2",
//     //             color: "#991b1b",
//     //             padding: "10px",
//     //             borderRadius: 8,
//     //             marginBottom: 16,
//     //             fontSize: 14,
//     //             border: "1px solid #fecaca",
//     //         },
//     //         form: {
//     //             display: "flex",
//     //             flexDirection: "column",
//     //             gap: 15,
//     //         },
//     //         input: {
//     //             width: "100%",
//     //             padding: "14px",
//     //             borderRadius: 10,
//     //             border: "1px solid rgba(34, 34, 34, 0.15)",
//     //             fontSize: 15,
//     //             outline: "none",
//     //             backgroundColor: "#ffffff",
//     //             color: "#222222",
//     //             boxSizing: "border-box",
//     //         },
//     //         button: {
//     //             marginTop: 5,
//     //             padding: "14px",
//     //             borderRadius: 10,
//     //             border: "none",
//     //             background: "#FA8112", // Brand Orange
//     //             color: "#ffffff",
//     //             fontSize: 16,
//     //             fontWeight: 700,
//     //             cursor: "pointer",
//     //             boxShadow: "0 4px 12px rgba(250, 129, 18, 0.3)",
//     //         },
//     //         footerText: {
//     //             marginTop: 20,
//     //             fontSize: 14,
//     //             color: "#222222",
//     //         },
//     //         link: {
//     //             color: "#FA8112",
//     //             textDecoration: "none",
//     //             fontWeight: 700,
//     //         },
//     //     };

//     //     export default Login;














import React, { useState, useEffect } from "react";
import { apiRequest } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

// Helper: map role to its home dashboard path
const ROLE_HOME = {
    CENTRAL_ADMIN: "/central-admin",
    SUB_ADMIN: "/sub-admin",
    EMPLOYEE: "/employee",
    ACCOUNTANT: "/accounts",
};

function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ✅ If already logged in, redirect to correct dashboard
    useEffect(() => {
        const token = localStorage.getItem("access");
        const role = localStorage.getItem("role");
        if (token && role && ROLE_HOME[role]) {
            navigate(ROLE_HOME[role], { replace: true });
        }
    }, [navigate]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // ✅ Clear ALL old auth data before new login (prevents cross-role contamination)
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("role");
            localStorage.removeItem("isTeamLeader");
            localStorage.removeItem("isTeamLeaderMode");

            const res = await apiRequest("/api/login/", "POST", form);

            if (res.access) {
                localStorage.setItem("access", res.access);
            }

            if (res.refresh) {
                localStorage.setItem("refresh", res.refresh);
            }

            // ✅ Store role in localStorage so ProtectedRoute can check it
            if (res.role) {
                localStorage.setItem("role", res.role);
            }
            if (res.isTeamLeader !== undefined) {
                localStorage.setItem("isTeamLeader", res.isTeamLeader ? "true" : "false");
            }

            // ✅ Role based navigation with replace: true (prevents back-button to login)
            const home = ROLE_HOME[res.role];
            if (home) {
                navigate(home, { replace: true });
            } else {
                setError("Login failed. Please check your credentials.");
            }

        } catch (err) {
            setError("Invalid credentials or server error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.glowTop} />
            <div style={styles.glowBottom} />

            <div style={styles.shell}>
                <div style={styles.brandPanel}>
                    <div>
                        <div style={styles.logo}>
                            <span style={styles.logoWhite}>Keddy</span>
                            <span style={styles.logoOrange}>CRM</span>
                        </div>
                        <h1 style={styles.heroTitle}>Welcome to your recruitment command center.</h1>
                        <p style={styles.heroText}>
                            Login to manage candidates, clients, vendors, submissions, requirements and CRM workflows.
                        </p>
                    </div>

                    <div style={styles.featureGrid}>
                        <div style={styles.featureCard}><b>ATS</b><span>Profiles</span></div>
                        <div style={styles.featureCard}><b>CRM</b><span>Clients</span></div>
                        <div style={styles.featureCard}><b>JD</b><span>Pipeline</span></div>
                    </div>
                </div>

                <div style={styles.card}>
                    <div style={styles.cardTop}>
                        <div style={styles.lockIcon}>🔐</div>
                        <div>
                            <h2 style={styles.title}>Sign in</h2>
                            <p style={styles.subtitle}>Continue to KeddyCRM</p>
                        </div>
                    </div>

                    {error && <div style={styles.errorBox}>{error}</div>}

                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Email Address</label>
                            <input
                                style={styles.input}
                                name="email"
                                type="email"
                                placeholder="name@company.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Password</label>
                            <input
                                style={styles.input}
                                name="password"
                                type="password"
                                placeholder="Enter password"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button
                            style={{
                                ...styles.button,
                                opacity: loading ? 0.75 : 1,
                                cursor: loading ? "not-allowed" : "pointer",
                            }}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p style={styles.footerText}>
                        Don't have an account?{" "}
                        <Link to="/register" style={styles.link}>
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px",
        background: "linear-gradient(135deg, #F8FAFC 0%, #EEF3F6 52%, #EAEFEF 100%)",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
    },
    glowTop: {
        position: "absolute",
        width: 360,
        height: 360,
        borderRadius: "50%",
        background: "rgba(255,155,81,0.22)",
        top: -120,
        right: -90,
        filter: "blur(6px)",
    },
    glowBottom: {
        position: "absolute",
        width: 260,
        height: 260,
        borderRadius: "50%",
        background: "rgba(37,52,63,0.10)",
        bottom: -90,
        left: -70,
        filter: "blur(8px)",
    },
    shell: {
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: 1040,
        display: "grid",
        gridTemplateColumns: "1.1fr 430px",
        gap: 28,
        alignItems: "stretch",
    },
    brandPanel: {
        minHeight: 520,
        borderRadius: 28,
        padding: 42,
        background: "linear-gradient(145deg, #25343F 0%, #13202B 100%)",
        color: "#fff",
        boxShadow: "0 24px 60px rgba(15,23,42,0.22)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
    },
    logo: {
        display: "inline-flex",
        gap: 6,
        padding: "10px 14px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
    },
    logoWhite: { color: "#fff", fontSize: 22, fontWeight: 900 },
    logoOrange: { color: "#FF9B51", fontSize: 22, fontWeight: 900 },
    heroTitle: {
        maxWidth: 520,
        margin: "72px 0 16px",
        fontSize: 44,
        lineHeight: 1.08,
        fontWeight: 900,
        letterSpacing: "-1.6px",
    },
    heroText: {
        maxWidth: 500,
        margin: 0,
        color: "rgba(255,255,255,0.76)",
        fontSize: 16,
        lineHeight: 1.65,
        fontWeight: 600,
    },
    featureGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 14,
        marginTop: 36,
    },
    featureCard: {
        padding: 16,
        borderRadius: 18,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        color: "rgba(255,255,255,0.76)",
        fontSize: 12,
        fontWeight: 800,
        textTransform: "uppercase",
    },
    card: {
        background: "rgba(255,255,255,0.95)",
        borderRadius: 28,
        padding: 38,
        boxShadow: "0 24px 60px rgba(15,23,42,0.14)",
        border: "1px solid rgba(226,232,240,0.95)",
        backdropFilter: "blur(16px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxSizing: "border-box",
    },
    cardTop: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 26,
        textAlign: "left",
    },
    lockIcon: {
        width: 52,
        height: 52,
        borderRadius: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFF2EA",
        fontSize: 22,
        boxShadow: "0 10px 24px rgba(255,155,81,0.18)",
    },
    title: {
        margin: 0,
        fontSize: 30,
        fontWeight: 900,
        color: "#25343F",
        letterSpacing: "-0.8px",
    },
    subtitle: {
        margin: "5px 0 0",
        color: "#64748B",
        fontSize: 14,
        fontWeight: 600,
    },
    errorBox: {
        background: "#FEF2F2",
        color: "#991B1B",
        padding: "12px 14px",
        borderRadius: 14,
        marginBottom: 18,
        fontSize: 13,
        border: "1px solid #FECACA",
        fontWeight: 700,
        textAlign: "left",
    },
    form: { display: "flex", flexDirection: "column", gap: 16 },
    fieldGroup: { display: "flex", flexDirection: "column", gap: 8, textAlign: "left" },
    label: { fontSize: 13, fontWeight: 800, color: "#25343F" },
    input: {
        width: "100%",
        padding: "14px 15px",
        borderRadius: 14,
        border: "1px solid #E2E8F0",
        fontSize: 15,
        outline: "none",
        backgroundColor: "#ffffff",
        color: "#25343F",
        boxSizing: "border-box",
        fontWeight: 600,
    },
    button: {
        marginTop: 8,
        padding: 15,
        borderRadius: 15,
        border: "none",
        background: "linear-gradient(135deg, #FFB36F 0%, #FF7F37 45%, #FF5E2F 100%)",
        color: "#ffffff",
        fontSize: 16,
        fontWeight: 900,
        boxShadow: "0 14px 28px rgba(255,126,55,0.34)",
    },
    footerText: {
        marginTop: 22,
        marginBottom: 0,
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        fontWeight: 600,
    },
    link: {
        color: "#FF7F37",
        textDecoration: "none",
        fontWeight: 900,
    },
};

export default Login;
