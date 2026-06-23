import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { clearAuthData, getStoredAuth, isAuthValid } from "./authSession";

// Helper: map role to its home dashboard path
const ROLE_HOME = {
    CENTRAL_ADMIN: "/central-admin",
    SUB_ADMIN: "/sub-admin",
    EMPLOYEE: "/employee",
    ACCOUNTANT: "/accounts",
};

// GuestRoute: wraps public pages like Login/Register
// If user is already logged in with a valid token, redirect to their dashboard
export const GuestRoute = ({ children }) => {
    const { role } = getStoredAuth();

    if (isAuthValid() && role && ROLE_HOME[role]) {
        return <Navigate to={ROLE_HOME[role]} replace />;
    }

    return children;
};

// ProtectedRoute: wraps private pages
// If no valid token/role, redirect to login
const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const { role } = getStoredAuth();

    useEffect(() => {
        const recheckAuth = () => {
            if (!isAuthValid()) {
                clearAuthData();
                window.location.replace("/");
            }
        };

        const intervalId = window.setInterval(recheckAuth, 60 * 1000);
        window.addEventListener("pageshow", recheckAuth);
        window.addEventListener("popstate", recheckAuth);
        window.addEventListener("focus", recheckAuth);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("pageshow", recheckAuth);
            window.removeEventListener("popstate", recheckAuth);
            window.removeEventListener("focus", recheckAuth);
        };
    }, []);

    // 1. Not logged in / expired session → go to login
    if (!isAuthValid() || !role) {
        clearAuthData();
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    // 2. Logged in but visiting a route for a different role
    //    → redirect them to THEIR OWN dashboard (do NOT clear their token)
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        const home = ROLE_HOME[role] || "/";
        return <Navigate to={home} replace />;
    }

    // 3. Correct role → render the page
    return children;
};

export default ProtectedRoute;
