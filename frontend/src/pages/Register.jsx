import React, { useState } from "react";
import { apiRequest } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        number: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });

    const handleChange = (e) => {
        setForm({...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async(e) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: "", text: "" });

        try {
            const res = await apiRequest("/api/register/", "POST", form);
            if (res.message) {
                setMsg({ type: "success", text: "Registration successful. Redirecting to login..." });
                setTimeout(() => navigate("/"), 1200);
            } else {
                setMsg({ type: "error", text: "Registration failed. Please check details." });
            }
        } catch {
            setMsg({ type: "error", text: "Server error. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return ( <
        div style = { styles.page } >
        <
        div style = { styles.card } >
        <
        h1 style = { styles.title } > Keddy CRM < /h1> <
        p style = { styles.subtitle } > Create your account < /p>

        {
            msg.text && ( <
                div style = {
                    {
                        ...styles.message,
                            ...(msg.type === "success" ? styles.success : styles.error),
                    }
                } > { msg.text } <
                /div>
            )
        }

        <form onSubmit = { handleSubmit }
        style = { styles.form } >
        <
        div style = { styles.row } >
        <
        input style = { styles.input }
        name = "first_name"
        placeholder = "First Name"
        onChange = { handleChange }
        required /
        >
        <
        input style = { styles.input }
        name = "last_name"
        placeholder = "Last Name"
        onChange = { handleChange }
        required /
        >
        </div>

        <
        input style = { styles.input }
        name = "email"
        type = "email"
        placeholder = "Email"
        onChange = { handleChange }
        required /
        >

        <
        input style = { styles.input }
        name = "number"
        placeholder = "Mobile Number"
        onChange = { handleChange }
        required /
        >

        <
        input style = { styles.input }
        name = "password"
        type = "password"
        placeholder = "Password"
        onChange = { handleChange }
        required /
        >

        <button style = { styles.button }
        type = "submit"
        disabled = { loading }
        onMouseOver = {
            (e) => e.target.style.opacity = "0.9"
        }
        onMouseOut = {
            (e) => e.target.style.opacity = "1"
        } > { loading ? "Creating Account..." : "Register" } <
        /button> < /
        form >

        <
        p style = { styles.footerText } >
        Already have an account ? { " " } <
        Link to = "/"
        style = { styles.link } >
        Login <
        /Link> </p> </div>
         </div >
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EAEFEF", // Page Background: Light Mist
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    },
    card: {
        width: "90%",
        maxWidth: 420,
        backgroundColor: "#BFC9D1", // Card: Soft Blue-Gray
        borderRadius: 16,
        padding: "40px 32px",
        boxShadow: "0 10px 25px rgba(37, 52, 63, 0.1)", // Shadow tied to Navy color
        border: "1px solid rgba(37, 52, 63, 0.05)",
    },
    title: {
        textAlign: "center",
        margin: 0,
        fontSize: 32,
        fontWeight: 700,
        color: "#25343F", // Heading: Dark Navy
        letterSpacing: "0.9px",
    },
    subtitle: {
        textAlign: "center",
        marginTop: 8,
        marginBottom: 24,
        color: "#25343F", // Subtitle: Dark Navy
        opacity: 0.8,
        fontSize: 16,
    },
    message: {
        padding: "12px",
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 14,
        textAlign: "center",
        fontWeight: "500",
    },
    success: {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #bbf7d0",
    },
    error: {
        background: "#fee2e2",
        color: "#991b1b",
        border: "1px solid #fecaca",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: 14,
    },
    row: {
        display: "flex",
        gap: 12,
    },
    input: {
        width: "100%",
        padding: "14px",
        borderRadius: 10,
        border: "1px solid #25343F", // Border: Dark Navy
        fontSize: 15,
        outline: "none",
        backgroundColor: "#ffffff",
        color: "#25343F", // Input Text: Dark Navy
        boxSizing: "border-box",
    },
    button: {
        marginTop: 10,
        padding: "14px",
        borderRadius: 10,
        border: "none",
        background: "#FF9B51", // Button: Vibrant Orange
        color: "#ffffff",
        fontSize: 16,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 4px 12px rgba(255, 155, 81, 0.3)",
    },
    footerText: {
        marginTop: 20,
        textAlign: "center",
        fontSize: 15,
        color: "#25343F", // Footer Text: Dark Navy
    },
    link: {
        color: "#FF9B51", // Link: Vibrant Orange
        textDecoration: "none",
        fontWeight: 700,
    },
};

export default Register;






// // src/pages/Register.js

// import React, { useState } from "react";
// import { apiRequest } from "../services/api";
// import { useNavigate, Link } from "react-router-dom";

// function Register() {
//     const navigate = useNavigate();
//     const [form, setForm] = useState({
//         first_name: "",
//         last_name: "",
//         email: "",
//         number: "",
//         password: "",
//     });
//     const [loading, setLoading] = useState(false);
//     const [msg, setMsg] = useState({ type: "", text: "" });

//     const handleChange = (e) => {
//         setForm({...form, [e.target.name]: e.target.value });
//     };

//     const handleSubmit = async(e) => {
//         e.preventDefault();
//         setLoading(true);
//         setMsg({ type: "", text: "" });

//         try {
//             const res = await apiRequest("/api/register/", "POST", form);
//             if (res.message) {
//                 setMsg({ type: "success", text: "Registration successful. Redirecting to login..." });
//                 setTimeout(() => navigate("/login"), 1200);
//             } else {
//                 setMsg({ type: "error", text: "Registration failed. Please check details." });
//             }
//         } catch {
//             setMsg({ type: "error", text: "Server error. Please try again." });
//         } finally {
//             setLoading(false);
//         }
//     };

//     return ( <
//         div style = { styles.page } >
//         <
//         div style = { styles.card } >
//         <
//         h1 style = { styles.title } > Keddy CRM < /h1> <
//         p style = { styles.subtitle } > Create your account < /p>

//         {
//             msg.text && ( <
//                 div style = {
//                     {
//                         ...styles.message,
//                             ...(msg.type === "success" ? styles.success : styles.error),
//                     }
//                 } >
//                 { msg.text } <
//                 /div>
//             )
//         }

//         <
//         form onSubmit = { handleSubmit }
//         style = { styles.form } >
//         <
//         div style = { styles.row } >
//         <
//         input style = { styles.input }
//         name = "first_name"
//         placeholder = "First Name"
//         onChange = { handleChange }
//         required /
//         >
//         <
//         input style = { styles.input }
//         name = "last_name"
//         placeholder = "Last Name"
//         onChange = { handleChange }
//         required /
//         >
//         <
//         /div>

//         <
//         input style = { styles.input }
//         name = "email"
//         type = "email"
//         placeholder = "Email"
//         onChange = { handleChange }
//         required /
//         >

//         <
//         input style = { styles.input }
//         name = "number"
//         placeholder = "Mobile Number"
//         onChange = { handleChange }
//         required /
//         >

//         <
//         input style = { styles.input }
//         name = "password"
//         type = "password"
//         placeholder = "Password"
//         onChange = { handleChange }
//         required /
//         >

//         <
//         button style = { styles.button }
//         type = "submit"
//         disabled = { loading }
//         onMouseOver = {
//             (e) => e.target.style.opacity = "0.9" }
//         onMouseOut = {
//             (e) => e.target.style.opacity = "1" } >
//         { loading ? "Creating Account..." : "Register" } <
//         /button> <
//         /form>

//         <
//         p style = { styles.footerText } >
//         Already have an account ? { " " } <
//         Link to = "/login"
//         style = { styles.link } >
//         Login <
//         /Link> <
//         /p> <
//         /div> <
//         /div>
//     );
// }

// const styles = {
//     page: {
//         minHeight: "100vh",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         backgroundColor: "#FAF3E1", // Soft Cream Background
//         fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
//     },
//     card: {
//         width: "90%",
//         maxWidth: 420,
//         backgroundColor: "#F5E7C6", // Light Beige Card
//         borderRadius: 16,
//         padding: "40px 32px",
//         boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
//         border: "1px solid rgba(0,0,0,0.05)",
//     },
//     title: {
//         textAlign: "center",
//         margin: 0,
//         fontSize: 32,
//         fontWeight: 700,
//         color: "#222222", // Deep Charcoal
//         letterSpacing: "0.9px",
//     },
//     subtitle: {
//         textAlign: "center",
//         marginTop: 8,
//         marginBottom: 24,
//         color: "#555555",
//         fontSize: 16,
//     },
//     message: {
//         padding: "12px",
//         borderRadius: 8,
//         marginBottom: 16,
//         fontSize: 14,
//         textAlign: "center",
//         fontWeight: "500",
//     },
//     success: {
//         background: "#dcfce7",
//         color: "#166534",
//         border: "1px solid #bbf7d0",
//     },
//     error: {
//         background: "#fee2e2",
//         color: "#991b1b",
//         border: "1px solid #fecaca",
//     },
//     form: {
//         display: "flex",
//         flexDirection: "column",
//         gap: 14,
//     },
//     row: {
//         display: "flex",
//         gap: 12,
//     },
//     input: {
//         width: "100%",
//         padding: "14px",
//         borderRadius: 10,
//         border: "1px solid rgba(34, 34, 34, 0.15)",
//         fontSize: 15,
//         outline: "none",
//         backgroundColor: "#ffffff",
//         color: "#222222",
//         boxSizing: "border-box",
//     },
//     button: {
//         marginTop: 10,
//         padding: "14px",
//         borderRadius: 10,
//         border: "none",
//         background: "#FA8112", // Vibrant Orange
//         color: "#ffffff",
//         fontSize: 16,
//         fontWeight: 700,
//         cursor: "pointer",
//         transition: "all 0.2s ease",
//         boxShadow: "0 4px 12px rgba(250, 129, 18, 0.3)",
//     },
//     footerText: {
//         marginTop: 20,
//         textAlign: "center",
//         fontSize: 15,
//         color: "#222222",
//     },
//     link: {
//         color: "#FA8112", // Orange link to match button
//         textDecoration: "none",
//         fontWeight: 700,
//     },
// };

// export default Register;