import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
import { apiRequest, API_BASE } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";

function DocViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [fileUrl, setFileUrl] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFile = async() => {
            try {
                const data = await apiRequest(`/employee-portal/api/vendors/${id}/`, "GET");
                if (data.bench_list) {
                    const path = data.bench_list.startsWith('/media/') ?
                        data.bench_list :
                        `/media${data.bench_list}`;

                    setFileUrl(`${API_BASE}${path}`);
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFile();
    }, [id]);

    // Download Function
    const handleDownload = () => {
        if (fileUrl) {
            const link = document.createElement("a");
            link.href = fileUrl;
            // File ka naam extract karne ke liye logic
            const fileName = fileUrl.split('/').pop();
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return ( <
        BaseLayout >
        <
        div style = { styles.header } >
        <
        div style = {
            { display: "flex", alignItems: "center", gap: "15px" }
        } >
        <
        button onClick = {
            () => navigate(-1)
        }
        style = { styles.backBtn } > ←Close <
        /button> <
        h2 style = { styles.title } > Document Preview < /h2> < /
        div >

        { /* Naya Download Button */ } {
            fileUrl && ( <
                button onClick = { handleDownload }
                style = { styles.downloadBtn } > 📥Download File <
                /button>
            )
        } <
        /div>

        <
        div style = { styles.viewerContainer } > {
            loading ? ( <
                p style = {
                    { padding: "20px" }
                } > Loading document... < /p>
            ) : fileUrl ? ( <
                iframe src = { fileUrl }
                style = { styles.iframe }
                title = "Document Viewer" /
                >
            ) : ( <
                p style = {
                    { padding: "20px" }
                } > No document found
                for this vendor. < /p>
            )
        } <
        /div> < /
        BaseLayout >
    );
}

const styles = {
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between", // Back button aur Download button ko side mein karne ke liye
        marginBottom: "15px"
    },
    backBtn: {
        padding: "8px 15px",
        cursor: "pointer",
        background: "#25343F",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontWeight: "600"
    },
    downloadBtn: {
        padding: "8px 20px",
        cursor: "pointer",
        background: "#FF9B51", // Aapka Brand Orange
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontWeight: "700",
        boxShadow: "0 4px 10px rgba(255, 155, 81, 0.3)"
    },
    title: { margin: 0, color: "#25343F", fontSize: "20px", fontWeight: "800" },
    viewerContainer: {
        width: "100%",
        height: "82vh",
        background: "#fff",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        border: "1px solid #BFC9D1"
    },
    iframe: { width: "100%", height: "100%", border: "none" }
};

export default DocViewer;




// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { apiRequest } from "../../services/api";
// import BaseLayout from "../components/emp_base";

// function DocViewer() {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const [fileUrl, setFileUrl] = useState("");
//     const [loading, setLoading] = useState(true);

//     // DocViewer.js mein useEffect ke andar console log lagayein check karne ke liye
//     useEffect(() => {
//         const fetchFile = async() => {
//             try {
//                 const data = await apiRequest(`/employee-portal/api/vendors/${id}/`, "GET");
//                 console.log("Full Data from API:", data); // Check karein 'bench_list' mein kya aa raha hai

//                 if (data.bench_list) {
//                     // Ensure media path is included
//                     const path = data.bench_list.startsWith('/media/') ?
//                         data.bench_list :
//                         `/media${data.bench_list}`;

//                     setFileUrl(`http://127.0.0.1:8000${path}`);
//                 }
//             } catch (error) {
//                 console.error("Error:", error);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchFile();
//     }, [id]);


//     return ( <
//         BaseLayout >
//         <
//         div style = { styles.header } >
//         <
//         button onClick = {
//             () => navigate(-1)
//         }
//         style = { styles.backBtn } > ←Close Preview < /button> <
//         h2 style = { styles.title } > Document Preview < /h2> < /
//         div >

//         <
//         div style = { styles.viewerContainer } > {
//             loading ? ( <
//                 p > Loading document... < /p>
//             ) : fileUrl ? ( <
//                 iframe src = { fileUrl }
//                 style = { styles.iframe }
//                 title = "Document Viewer" /
//                 >
//             ) : ( <
//                 p > No document found
//                 for this vendor. < /p>
//             )
//         } <
//         /div> < /
//         BaseLayout >
//     );
// }

// const styles = {
//     header: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "15px" },
//     backBtn: { padding: "8px 15px", cursor: "pointer", background: "#25343F", color: "#fff", border: "none", borderRadius: "5px" },
//     title: { margin: 0, color: "#25343F" },
//     viewerContainer: {
//         width: "100%",
//         height: "85vh",
//         background: "#fff",
//         borderRadius: "10px",
//         overflow: "hidden",
//         boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
//     },
//     iframe: { width: "100%", height: "100%", border: "none" }
// };

// export default DocViewer;