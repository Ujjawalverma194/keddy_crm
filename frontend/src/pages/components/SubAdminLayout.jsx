import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { clearAuthData } from "./authSession";

const SubAdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userName, setUserName] = useState("Admin");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await apiRequest("/sub-admin/api/subadmin/dashboard/stats/");
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

    const firstLetter = userName ? userName.charAt(0).toUpperCase() : "S";

    const menuItems = [
        { label: "Overview", path: "/sub-admin" },
        { label: "Manage Team", path: "/sub-admin/team-manage" },
        { label: "Total Profiles", path: "/sub-admin/all-candidates" },
        // { label: "Offboarded Profiles", path: "/sub-admin/offboarded-profiles" },
        { label: "Clients", path: "/sub-admin/clients" },
        { label: "Vendors", path: "/sub-admin/all-Vendors" },
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
                        <div style={styles.brand} onClick={() => navigate("/sub-admin")}>
                            <span style={styles.brandKeddy}>Keddy</span>
                            <span style={styles.brandCrm}>CRM</span>
                            <span style={styles.roleBadge}>Admin</span>
                        </div>
                    </div>

                    <div className="desktop-menu" style={styles.desktopMenu}>
                        {menuItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.path)}
                                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                {item.label}
                                <span className="underline"></span>
                            </button>
                        ))}
                    </div>

                    <div style={styles.userSection}>
                        <div className="user-info-text" style={styles.userInfo}>
                            <span style={styles.userNameText}>{userName}</span>
                            <span style={styles.userStatus}>Management Access</span>
                        </div>
                        
                        {/* Updated Avatar with Logout Dropdown */}
                        <div style={styles.avatarWrapper} className="avatar-dropdown">
                            <div style={styles.avatar}>{firstLetter}</div>
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
                    {/* Mobile Logout Option */}
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
                    background: none;
                    border: none;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
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
                /* Added Hover dropdown for logout */
                .avatar-dropdown:hover button {
                    display: block !important;
                }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", backgroundColor: "#F8FAFC" },
    navbar: { backgroundColor: "#1E293B", height: "70px", display: "flex", justifyContent: "center", position: "sticky", top: 0, zIndex: 1000, padding: "0 4%" },
    navContent: { width: "100%", maxWidth: "1400px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    leftSection: { display: "flex", alignItems: "center", gap: "20px" },
    hamburger: { flexDirection: "column", gap: "5px", cursor: "pointer", padding: "5px" },
    bar: { width: "22px", height: "2px", backgroundColor: "#fff" },
    brand: { display: "flex", alignItems: "center", cursor: "pointer", gap: "10px" },
    brandKeddy: { fontSize: "22px", fontWeight: "800", color: "#fff" },
    brandCrm: { fontSize: "22px", fontWeight: "800", color: "#FF9B51" },
    roleBadge: { backgroundColor: "rgba(255, 155, 81, 0.15)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginLeft: "10px", border: "1px solid rgba(255, 155, 81, 0.3)" },
    desktopMenu: { display: "flex", gap: "15px", alignItems: "center" },
    userSection: { display: "flex", alignItems: "center", gap: "12px" },
    userInfo: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
    userNameText: { color: "#fff", fontSize: "14px", fontWeight: "700" },
    userStatus: { color: "#FF9B51", fontSize: "11px", fontWeight: "700" },
    avatarWrapper: { position: "relative", padding: "10px 0" }, // Needed for positioning logout btn
    avatar: { width: "40px", height: "40px", backgroundColor: "#4834D4", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", cursor: "pointer" },
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
    mobileSidebar: { position: "fixed", top: 0, left: 0, width: "260px", height: "100vh", backgroundColor: "#0F172A", zIndex: 3000, transition: "transform 0.3s ease-in-out", padding: "20px" },
    sidebarHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
    closeBtn: { background: "none", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer" },
    sidebarMenu: { display: "flex", flexDirection: "column", gap: "10px" },
    sidebarItem: { padding: "12px 15px", borderRadius: "5px", fontWeight: "600", cursor: "pointer" },
    overlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000 },
    mainContent: { padding: "25px 0" },
    contentWrapper: { width: "92%", maxWidth: "1400px", margin: "0 auto" }
};

export default SubAdminLayout;






// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { apiRequest } from "../../services/api";

// const SubAdminLayout = ({ children }) => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const [userName, setUserName] = useState("Admin");
//     const [isMenuOpen, setIsMenuOpen] = useState(false);

//     useEffect(() => {
//         const fetchUserData = async () => {
//             try {
//                 // Aapka stats API call same rahega
//                 const data = await apiRequest("/sub-admin/api/subadmin/dashboard/stats/");
//                 if (data && data.user_name) setUserName(data.user_name);
//             } catch (error) {
//                 console.error("Error fetching user data:", error);
//             }
//         };
//         fetchUserData();
//     }, []);

//     const firstLetter = userName ? userName.charAt(0).toUpperCase() : "S";

//     // Sub-Admin specific menu items
//     const menuItems = [
//         { label: "Overview", path: "/sub-admin" },
//         { label: "Manage Team", path: "/sub-admin/team-manage" },
//         { label: "Total Profiles", path: "/sub-admin/all-candidates" },
//         { label: "Clients", path: "/sub-admin/clients" },
//         { label: "Vendors", path: "/sub-admin/all-Vendors" },
//     ];

//     return (
//         <div style={styles.container}>
//             <nav style={styles.navbar}>
//                 <div style={styles.navContent}>
                    
//                     <div style={styles.leftSection}>
//                         <div className="mobile-toggle" style={styles.hamburger} onClick={() => setIsMenuOpen(true)}>
//                             <div style={styles.bar}></div>
//                             <div style={styles.bar}></div>
//                             <div style={styles.bar}></div>
//                         </div>
//                         <div style={styles.brand} onClick={() => navigate("/sub-admin")}>
//                             <span style={styles.brandKeddy}>Keddy</span>
//                             <span style={styles.brandCrm}>CRM</span>
//                             {/* Role Badge */}
//                             <span style={styles.roleBadge}>Admin</span>
//                         </div>
//                     </div>

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
//                             <span style={styles.userStatus}>Management Access</span>
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

//             <style>{`
//                 .mobile-toggle { display: none !important; }
//                 @media (max-width: 900px) {
//                     .mobile-toggle { display: flex !important; }
//                     .desktop-menu { display: none !important; }
//                     .user-info-text { display: none !important; }
//                 }
//                 .nav-link {
//                     position: relative;
//                     color: #fff;
//                     transition: color 0.3s ease;
//                     padding: 8px 12px !important;
//                     margin: 0 5px;
//                     background: none;
//                     border: none;
//                     font-size: 15px;
//                     font-weight: 600;
//                     cursor: pointer;
//                 }
//                 .nav-link .underline {
//                     position: absolute;
//                     bottom: 5px;
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
//     navbar: { backgroundColor: "#1E293B", height: "70px", display: "flex", justifyContent: "center", position: "sticky", top: 0, zIndex: 1000, padding: "0 4%" },
//     navContent: { width: "100%", maxWidth: "1400px", display: "flex", justifyContent: "space-between", alignItems: "center" },
//     leftSection: { display: "flex", alignItems: "center", gap: "20px" },
//     hamburger: { flexDirection: "column", gap: "5px", cursor: "pointer", padding: "5px" },
//     bar: { width: "22px", height: "2px", backgroundColor: "#fff" },
//     brand: { display: "flex", alignItems: "center", cursor: "pointer", gap: "10px" },
//     brandKeddy: { fontSize: "22px", fontWeight: "800", color: "#fff" },
//     brandCrm: { fontSize: "22px", fontWeight: "800", color: "#FF9B51" },
//     roleBadge: { backgroundColor: "rgba(255, 155, 81, 0.15)", color: "#FF9B51", padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginLeft: "10px", border: "1px solid rgba(255, 155, 81, 0.3)" },
//     desktopMenu: { display: "flex", gap: "15px", alignItems: "center" },
//     userSection: { display: "flex", alignItems: "center", gap: "12px" },
//     userInfo: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
//     userNameText: { color: "#fff", fontSize: "14px", fontWeight: "700" },
//     userStatus: { color: "#FF9B51", fontSize: "11px", fontWeight: "700" }, // Different color for sub-admin status
//     avatar: { width: "40px", height: "40px", backgroundColor: "#4834D4", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800" },
//     mobileSidebar: { position: "fixed", top: 0, left: 0, width: "260px", height: "100vh", backgroundColor: "#0F172A", zIndex: 3000, transition: "transform 0.3s ease-in-out", padding: "20px" },
//     sidebarHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
//     closeBtn: { background: "none", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer" },
//     sidebarMenu: { display: "flex", flexDirection: "column", gap: "10px" },
//     sidebarItem: { padding: "12px 15px", borderRadius: "5px", fontWeight: "600", cursor: "pointer" },
//     overlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000 },
//     mainContent: { padding: "25px 0" },
//     contentWrapper: { width: "92%", maxWidth: "1400px", margin: "0 auto" }
// };

// export default SubAdminLayout;