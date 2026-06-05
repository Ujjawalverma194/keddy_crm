import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { clearAuthData } from "./authSession";

const BaseLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userName, setUserName] = useState("Recruiter");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await apiRequest("/employee-portal/dashboard/stats/");
                if (data && data.user_name) setUserName(data.user_name);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };
        fetchUserData();
    }, []);

    // --- LOGOUT LOGIC ---
    const handleLogout = () => {
        clearAuthData();
        // Use replace to prevent back-button from returning to protected pages
        window.location.replace("/");
    };

    const firstLetter = userName ? userName.charAt(0).toUpperCase() : "U";

    const menuItems = [
        { label: "Dashboard", path: "/employee" },
        { label: "Submitted Profiles", path: "/employee/submitted-profiles" },
        
        { label: "Total Profiles", path: "/employee/user-candidates" },
        // { label: "Vendors", path: "/employee/user-vendors" },
        // { label: "Clients", path: "/employee/clients" },
        
        { label: "Team Submissions", path: "/employee/TeamSubmissions" },
        { label: "Pool", path: "/employee/pool" },
    ];

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <div style={styles.navContent}>
                    
                    <div style={styles.leftSection}>
                        <div className="mobile-toggle" style={styles.hamburger} onClick={() => setIsMenuOpen(true)}>
                            <div style={styles.bar}></div>
                            <div style={styles.bar}></div>
                            <div style={styles.bar}></div>
                        </div>
                        <div style={styles.brand} onClick={() => navigate("/employee")}>
                            <span style={styles.brandKeddy}>Keddy</span>
                            <span style={styles.brandCrm}>CRM</span>
                        </div>
                    </div>

                    <div className="desktop-menu" style={styles.desktopMenu}>
                        {menuItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.path)}
                                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                                style={styles.navBtn}
                            >
                                {item.label}
                                <span className="underline"></span>
                            </button>
                        ))}
                    </div>

                    <div style={styles.userSection}>
                        <div className="user-info-text" style={styles.userInfo}>
                            <span style={styles.userNameText}>{userName}</span>
                            <span style={styles.userStatus}>Online</span>
                        </div>
                        
                        {/* Avatar aur Logout Wrapper */}
                        <div style={styles.avatarWrapper} className="avatar-dropdown">
                            <div style={styles.avatar}>{firstLetter}</div>
                            {/* Desktop Logout Button - Hover ya click par dikhane ke liye */}
                            <button onClick={handleLogout} style={styles.logoutBtnDesktop}>Logout</button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar */}
            <div style={{ ...styles.mobileSidebar, transform: isMenuOpen ? "translateX(0)" : "translateX(-100%)" }}>
                <div style={styles.sidebarHeader}>
                    <div style={styles.brand}>
                        <span style={styles.brandKeddy}>Keddy</span><span style={styles.brandCrm}>CRM</span>
                    </div>
                    <button onClick={() => setIsMenuOpen(false)} style={styles.closeBtn}>✕</button>
                </div>
                <div style={styles.sidebarMenu}>
                    {menuItems.map((item) => (
                        <div
                            key={item.label}
                            onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                            style={{
                                ...styles.sidebarItem,
                                color: location.pathname === item.path ? "#FF9B51" : "#fff",
                                borderLeft: location.pathname === item.path ? "4px solid #FF9B51" : "4px solid transparent"
                            }}
                        >
                            {item.label}
                        </div>
                    ))}
                    {/* Mobile Logout */}
                    <div onClick={handleLogout} style={{...styles.sidebarItem, color: "#FF5E5E", marginTop: "20px", borderTop: "1px solid #334155"}}>
                        Logout Account
                    </div>
                </div>
            </div>

            {isMenuOpen && <div style={styles.overlay} onClick={() => setIsMenuOpen(false)} />}

            <main style={styles.mainContent}>
                <div style={styles.contentWrapper}>
                    {children}
                </div>
            </main>

            <style>{`
                .mobile-toggle { display: none !important; }
                
                @media (max-width: 900px) {
                    .mobile-toggle { display: flex !important; }
                    .desktop-menu { display: none !important; }
                    .user-info-text { display: none !important; }
                }

                .nav-link {
                    position: relative;
                    color: #fff;
                    transition: color 0.3s ease;
                    padding: 8px 12px !important;
                    margin: 0 5px;
                }
                
                .nav-link .underline {
                    position: absolute;
                    bottom: 5px;
                    left: 0;
                    width: 0;
                    height: 2px;
                    background-color: #FF9B51;
                    transition: width 0.3s ease;
                }

                .nav-link:hover .underline, 
                .nav-link.active .underline {
                    width: 100%;
                }

                .nav-link.active {
                    color: #FF9B51 !important;
                }

                /* Logout button hover effect */
                .avatar-dropdown:hover button {
                    display: block !important;
                }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", backgroundColor: "#F8FAFC" },
    navbar: { backgroundColor: "#25343F", height: "70px", display: "flex", justifyContent: "center", position: "sticky", top: 0, zIndex: 1000, padding: "0 4%" },
    navContent: { width: "100%", maxWidth: "1400px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    leftSection: { display: "flex", alignItems: "center", gap: "20px" },
    hamburger: { flexDirection: "column", gap: "5px", cursor: "pointer", padding: "5px" },
    bar: { width: "22px", height: "2px", backgroundColor: "#fff" },
    brand: { display: "flex", alignItems: "center", cursor: "pointer" },
    brandKeddy: { fontSize: "22px", fontWeight: "800", color: "#fff" },
    brandCrm: { fontSize: "22px", fontWeight: "800", color: "#FF9B51" },
    desktopMenu: { display: "flex", gap: "15px", alignItems: "center" },
    navBtn: { background: "none", border: "none", fontSize: "15px", fontWeight: "600", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" },
    userSection: { display: "flex", alignItems: "center", gap: "12px" },
    userInfo: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
    userNameText: { color: "#fff", fontSize: "14px", fontWeight: "700" },
    userStatus: { color: "#4CD964", fontSize: "11px", fontWeight: "700" },
    avatarWrapper: { position: "relative", padding: "10px 0" },
    avatar: { width: "40px", height: "40px", backgroundColor: "#FF9B51", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", cursor: "pointer" },
    logoutBtnDesktop: { 
        display: "none", 
        position: "absolute", 
        top: "50px", 
        right: 0, 
        backgroundColor: "#fff", 
        color: "#FF5E5E", 
        border: "1px solid #eee", 
        padding: "8px 15px", 
        borderRadius: "5px", 
        fontWeight: "700", 
        fontSize: "12px", 
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        zIndex: 1001 
    },
    mobileSidebar: { position: "fixed", top: 0, left: 0, width: "260px", height: "100vh", backgroundColor: "#1E293B", zIndex: 3000, transition: "transform 0.3s ease-in-out", padding: "20px" },
    sidebarHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
    closeBtn: { background: "none", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer" },
    sidebarMenu: { display: "flex", flexDirection: "column", gap: "10px" },
    sidebarItem: { padding: "12px 15px", borderRadius: "5px", fontWeight: "600", cursor: "pointer" },
    overlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000 },
    mainContent: { padding: "25px 0" },
    contentWrapper: { width: "92%", maxWidth: "1400px", margin: "0 auto" }
};

export default BaseLayout;








// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { apiRequest } from "../../services/api";

// const BaseLayout = ({ children }) => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const [userName, setUserName] = useState("Recruiter");
//     const [isMenuOpen, setIsMenuOpen] = useState(false);

//     useEffect(() => {
//         const fetchUserData = async () => {
//             try {
//                 const data = await apiRequest("/employee-portal/dashboard/stats/");
//                 if (data && data.user_name) setUserName(data.user_name);
//             } catch (error) {
//                 console.error("Error fetching user data:", error);
//             }
//         };
//         fetchUserData();
//     }, []);

//     const firstLetter = userName ? userName.charAt(0).toUpperCase() : "U";

//     const menuItems = [
//         { label: "Dashboard", path: "/employee" },
//         { label: "Candidates", path: "/employee/user-candidates" },
//         { label: "Vendors", path: "/employee/user-vendors" },
//         { label: "Clients", path: "/employee/clients" },
//         { label: "Pool", path: "/employee/pool" },
//     ];

//     return (
//         <div style={styles.container}>
//             <nav style={styles.navbar}>
//                 <div style={styles.navContent}>
                    
//                     <div style={styles.leftSection}>
//                         {/* Mobile Only Hamburger */}
//                         <div className="mobile-toggle" style={styles.hamburger} onClick={() => setIsMenuOpen(true)}>
//                             <div style={styles.bar}></div>
//                             <div style={styles.bar}></div>
//                             <div style={styles.bar}></div>
//                         </div>
//                         <div style={styles.brand} onClick={() => navigate("/employee")}>
//                             <span style={styles.brandKeddy}>Keddy</span>
//                             <span style={styles.brandCrm}>CRM</span>
//                         </div>
//                     </div>

//                     {/* Desktop Menu with Hover Effect */}
//                     <div className="desktop-menu" style={styles.desktopMenu}>
//                         {menuItems.map((item) => (
//                             <button
//                                 key={item.label}
//                                 onClick={() => navigate(item.path)}
//                                 className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
//                                 style={styles.navBtn}
//                             >
//                                 {item.label}
//                                 <span className="underline"></span>
//                             </button>
//                         ))}
//                     </div>

//                     <div style={styles.userSection}>
//                         <div className="user-info-text" style={styles.userInfo}>
//                             <span style={styles.userNameText}>{userName}</span>
//                             <span style={styles.userStatus}>Online</span>
//                         </div>
//                         <div style={styles.avatar}>{firstLetter}</div>
//                     </div>
//                 </div>
//             </nav>

//             {/* Mobile Sidebar */}
//             <div style={{ ...styles.mobileSidebar, transform: isMenuOpen ? "translateX(0)" : "translateX(-100%)" }}>
//                 <div style={styles.sidebarHeader}>
//                     <div style={styles.brand}>
//                         <span style={styles.brandKeddy}>Keddy</span><span style={styles.brandCrm}>CRM</span>
//                     </div>
//                     <button onClick={() => setIsMenuOpen(false)} style={styles.closeBtn}>✕</button>
//                 </div>
//                 <div style={styles.sidebarMenu}>
//                     {menuItems.map((item) => (
//                         <div
//                             key={item.label}
//                             onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
//                             style={{
//                                 ...styles.sidebarItem,
//                                 color: location.pathname === item.path ? "#FF9B51" : "#fff",
//                                 borderLeft: location.pathname === item.path ? "4px solid #FF9B51" : "4px solid transparent"
//                             }}
//                         >
//                             {item.label}
//                         </div>
//                     ))}
//                 </div>
//             </div>

//             {isMenuOpen && <div style={styles.overlay} onClick={() => setIsMenuOpen(false)} />}

//             <main style={styles.mainContent}>
//                 <div style={styles.contentWrapper}>
//                     {children}
//                 </div>
//             </main>

//             {/* Critical Responsive & Animation CSS */}
//             <style>{`
//                 /* Hide Hamburger on Desktop */
//                 .mobile-toggle { display: none !important; }
                
//                 @media (max-width: 900px) {
//                     .mobile-toggle { display: flex !important; }
//                     .desktop-menu { display: none !important; }
//                     .user-info-text { display: none !important; }
//                 }

//                 /* Nav Link Hover Animation */
//                 .nav-link {
//                     position: relative;
//                     color: #fff;
//                     transition: color 0.3s ease;
//                     padding: 8px 12px !important;
//                     margin: 0 5px;
//                 }
                
//                 .nav-link .underline {
//                     position: absolute;
//                     bottom: 5px; /* Text ke just niche */
//                     left: 0;
//                     width: 0;
//                     height: 2px;
//                     background-color: #FF9B51;
//                     transition: width 0.3s ease;
//                 }

//                 .nav-link:hover .underline, 
//                 .nav-link.active .underline {
//                     width: 100%;
//                 }

//                 .nav-link.active {
//                     color: #FF9B51 !important;
//                 }
//             `}</style>
//         </div>
//     );
// };

// const styles = {
//     container: { minHeight: "100vh", backgroundColor: "#F8FAFC" },
//     navbar: { backgroundColor: "#25343F", height: "70px", display: "flex", justifyContent: "center", position: "sticky", top: 0, zIndex: 1000, padding: "0 4%" },
//     navContent: { width: "100%", maxWidth: "1400px", display: "flex", justifyContent: "space-between", alignItems: "center" },
//     leftSection: { display: "flex", alignItems: "center", gap: "20px" },
//     hamburger: { flexDirection: "column", gap: "5px", cursor: "pointer", padding: "5px" },
//     bar: { width: "22px", height: "2px", backgroundColor: "#fff" },
//     brand: { display: "flex", alignItems: "center", cursor: "pointer" },
//     brandKeddy: { fontSize: "22px", fontWeight: "800", color: "#fff" },
//     brandCrm: { fontSize: "22px", fontWeight: "800", color: "#FF9B51" },
//     desktopMenu: { display: "flex", gap: "15px", alignItems: "center" },
//     navBtn: { background: "none", border: "none", fontSize: "15px", fontWeight: "600", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" },
//     userSection: { display: "flex", alignItems: "center", gap: "12px" },
//     userInfo: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
//     userNameText: { color: "#fff", fontSize: "14px", fontWeight: "700" },
//     userStatus: { color: "#4CD964", fontSize: "11px", fontWeight: "700" },
//     avatar: { width: "40px", height: "40px", backgroundColor: "#FF9B51", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800" },
//     mobileSidebar: { position: "fixed", top: 0, left: 0, width: "260px", height: "100vh", backgroundColor: "#1E293B", zIndex: 3000, transition: "transform 0.3s ease-in-out", padding: "20px" },
//     sidebarHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
//     closeBtn: { background: "none", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer" },
//     sidebarMenu: { display: "flex", flexDirection: "column", gap: "10px" },
//     sidebarItem: { padding: "12px 15px", borderRadius: "5px", fontWeight: "600", cursor: "pointer" },
//     overlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000 },
//     mainContent: { padding: "25px 0" },
//     contentWrapper: { width: "92%", maxWidth: "1400px", margin: "0 auto" }
// };

// export default BaseLayout;





// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { apiRequest } from "../../services/api"; // Path check kar lijiyega

// const BaseLayout = ({ children }) => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const [userName, setUserName] = useState("Recruiter");

//     // Fetch user profile data for Navbar
//     useEffect(() => {
//         const fetchUserData = async() => {
//             try {
//                 const data = await apiRequest("/employee-portal/dashboard/stats/");
//                 if (data && data.user_name) {
//                     setUserName(data.user_name);
//                 }
//             } catch (error) {
//                 console.error("Error fetching user data for layout:", error);
//             }
//         };
//         fetchUserData();
//     }, []);

//     // Get the first letter for the avatar and capitalize it
//     const firstLetter = userName ? userName.charAt(0).toUpperCase() : "U";

//     const menuItems = [
//         { label: "Dashboard", path: "/employee" },
//         { label: "Candidates", path: "/employee/candidates" },
//         { label: "Vendors", path: "/employee/vendors" },
//         { label: "Clients", path: "/employee/clients" },
//     ];

//     return ( <
//         div style = { styles.container } > { /* Professional Top Navbar */ } <
//         nav style = { styles.navbar } >
//         <
//         div style = { styles.navContent } > { /* Brand Branding */ } <
//         div style = { styles.brand }
//         onClick = {
//             () => navigate("/employee")
//         } >
//         <
//         span style = { styles.brandKeddy } > Keddy < /span> <
//         span style = { styles.brandCrm } > CRM < /span> < /
//         div >

//         { /* Navigation Menu */ } <
//         div style = { styles.menuLinks } > {
//             menuItems.map((item) => ( <
//                 button key = { item.label }
//                 onClick = {
//                     () => navigate(item.path)
//                 }
//                 style = {
//                     {
//                         ...styles.navBtn,
//                             color: location.pathname === item.path ? "#FF9B51" : "#fff",
//                             borderBottom: location.pathname === item.path ? "3px solid #FF9B51" : "3px solid transparent",
//                     }
//                 } > { item.label } <
//                 /button>
//             ))
//         } <
//         /div>

//         { /* Dynamic User Profile Section */ } <
//         div style = { styles.userSection } >
//         <
//         div style = { styles.userInfo } >
//         <
//         span style = { styles.userName } > { userName } < /span> <
//         span style = { styles.userStatus } > Online < /span> < /
//         div > <
//         div style = { styles.avatar } > { firstLetter } < /div> < /
//         div > <
//         /div> < /
//         nav >

//         { /* Content Area */ } <
//         main style = { styles.mainContent } >
//         <
//         div style = { styles.contentWrapper } > { children } <
//         /div> < /
//         main > <
//         /div>
//     );
// };

// const styles = {
//     container: { minHeight: "100vh", backgroundColor: "#F4F7F9", fontFamily: "'Inter', 'Segoe UI', sans-serif" },
//     navbar: { backgroundColor: "#25343F", height: "75px", display: "flex", justifyContent: "center", alignItems: "center", position: "sticky", top: 0, zIndex: 1000, boxShadow: "0 4px 15px rgba(0,0,0,0.15)" },
//     navContent: { width: "90%", maxWidth: "1400px", display: "flex", justifyContent: "space-between", alignItems: "center" },
//     brand: { display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" },
//     brandKeddy: { fontSize: "24px", fontWeight: "700", color: "#fff", letterSpacing: "-0.5px" },
//     brandCrm: { fontSize: "24px", fontWeight: "700", color: "#FF9B51" },
//     menuLinks: { display: "flex", gap: "10px", height: "75px" },
//     navBtn: { background: "none", border: "none", padding: "0 20px", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "all 0.3s ease", height: "100%", display: "flex", alignItems: "center" },
//     userSection: { display: "flex", alignItems: "center", gap: "15px" },
//     userInfo: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
//     userName: { color: "#fff", fontSize: "14px", fontWeight: "700", textTransform: "capitalize" },
//     userStatus: { color: "#FF9B51", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" },
//     avatar: { width: "40px", height: "40px", backgroundColor: "#FF9B51", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", boxShadow: "0 4px 10px rgba(255, 155, 81, 0.4)", fontSize: "18px" },
//     mainContent: { padding: "40px 0" },
//     contentWrapper: { width: "90%", maxWidth: "1400px", margin: "0 auto" }
// };

// export default BaseLayout;




// import React from "react";
// import { useNavigate, useLocation } from "react-router-dom";

// const BaseLayout = ({ children }) => {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const menuItems = [
//         { label: "Dashboard", path: "/employee" },
//         { label: "Candidates", path: "/employee/candidates" },
//         { label: "Vendors", path: "/employee/vendors" },
//         { label: "Clients", path: "/employee/clients" },
//     ];

//     return ( <
//         div style = { styles.container } > { /* Professional Top Navbar */ } <
//         nav style = { styles.navbar } >
//         <
//         div style = { styles.navContent } > { /* Brand Branding */ } <
//         div style = { styles.brand }
//         onClick = {
//             () => navigate("/employee")
//         } >
//         <
//         span style = { styles.brandKeddy } > Keddy < /span> <
//         span style = { styles.brandCrm } > CRM < /span> < /
//         div >

//         { /* Navigation Menu */ } <
//         div style = { styles.menuLinks } > {
//             menuItems.map((item) => ( <
//                 button key = { item.label }
//                 onClick = {
//                     () => navigate(item.path)
//                 }
//                 style = {
//                     {
//                         ...styles.navBtn,
//                             color: location.pathname === item.path ? "#FF9B51" : "#fff",
//                             borderBottom: location.pathname === item.path ? "3px solid #FF9B51" : "3px solid transparent",
//                     }
//                 } > { item.label } <
//                 /button>
//             ))
//         } <
//         /div>

//         { /* User Profile Section */ } <
//         div style = { styles.userSection } >
//         <
//         div style = { styles.userInfo } >
//         <
//         span style = { styles.userName } > Recruiter Panel < /span> <
//         span style = { styles.userStatus } > Online < /span> < /
//         div > <
//         div style = { styles.avatar } > E < /div> < /
//         div > <
//         /div> < /
//         nav >

//         { /* Content Area */ } <
//         main style = { styles.mainContent } >
//         <
//         div style = { styles.contentWrapper } > { children } <
//         /div> < /
//         main > <
//         /div>
//     );
// };

// const styles = {
//     container: {
//         minHeight: "100vh",
//         backgroundColor: "#F4F7F9", // Premium Light Grayish background
//         fontFamily: "'Inter', 'Segoe UI', sans-serif",
//     },
//     navbar: {
//         backgroundColor: "#25343F", // Deep Navy
//         height: "75px",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         position: "sticky",
//         top: 0,
//         zIndex: 1000,
//         boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
//     },
//     navContent: {
//         width: "90%",
//         maxWidth: "1400px",
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "center",
//     },
//     brand: {
//         display: "flex",
//         alignItems: "center",
//         gap: "4px",
//         cursor: "pointer",
//     },
//     brandKeddy: { fontSize: "24px", fontWeight: "700", color: "#fff", letterSpacing: "-0.5px" },
//     brandCrm: { fontSize: "24px", fontWeight: "700", color: "#FF9B51" },
//     menuLinks: {
//         display: "flex",
//         gap: "10px",
//         height: "75px",
//     },
//     navBtn: {
//         background: "none",
//         border: "none",
//         padding: "0 20px",
//         fontSize: "15px",
//         fontWeight: "600",
//         cursor: "pointer",
//         transition: "all 0.3s ease",
//         height: "100%",
//         display: "flex",
//         alignItems: "center",
//     },
//     userSection: {
//         display: "flex",
//         alignItems: "center",
//         gap: "15px",
//     },
//     userInfo: {
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "flex-end",
//     },
//     userName: { color: "#fff", fontSize: "14px", fontWeight: "700" },
//     userStatus: { color: "#FF9B51", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" },
//     avatar: {
//         width: "40px",
//         height: "40px",
//         backgroundColor: "#FF9B51",
//         borderRadius: "10px",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         color: "#fff",
//         fontWeight: "800",
//         boxShadow: "0 4px 10px rgba(255, 155, 81, 0.4)",
//     },
//     mainContent: {
//         padding: "40px 0",
//     },
//     contentWrapper: {
//         width: "90%",
//         maxWidth: "1400px",
//         margin: "0 auto",
//     }
// };

// export default BaseLayout;





// import React from "react";

// const BaseLayout = ({ children }) => {
//     return ( <
//         div style = { styles.container } >
//         <
//         nav style = { styles.navbar } >
//         <
//         div style = { styles.logo } > Keddy CRM < /div> <
//         div style = { styles.userProfile } > Recruiter Panel👋 < /div> <
//         /nav> <
//         div style = { styles.content } > { children } <
//         /div> <
//         /div>
//     );
// };

// const styles = {
//     container: {
//         minHeight: "100vh",
//         backgroundColor: "#EAEFEF", // Updated: Light Mist Background
//         fontFamily: "'Segoe UI', Roboto, sans-serif",
//     },
//     navbar: {
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "center",
//         padding: "15px 5%",
//         backgroundColor: "#25343F", // Updated: Soft Blue-Gray Navbar
//         borderBottom: "1px solid rgba(37, 52, 63, 0.1)", // Tied to Dark Navy
//         position: "sticky",
//         top: 0,
//         zIndex: 100,
//         flexWrap: "wrap",
//         boxShadow: "0 2px 10px rgba(37, 52, 63, 0.05)",
//     },
//     logo: {
//         fontSize: "clamp(18px, 4vw, 24px)",
//         fontWeight: "800",
//         color: "#ffffff", // Updated: Dark Navy
//         letterSpacing: "0.5px",
//     },
//     userProfile: {
//         fontWeight: "700",
//         color: "#FF9B51", // Updated: Vibrant Orange
//         fontSize: "14px",
//         backgroundColor: "rgba(249, 249, 250, 0.05)", // Subtle Navy tint
//         padding: "6px 12px",
//         borderRadius: "20px",
//     },
//     content: {
//         padding: "20px 5%",
//         maxWidth: "1400px",
//         margin: "0 auto",
//     }
// };

// export default BaseLayout;