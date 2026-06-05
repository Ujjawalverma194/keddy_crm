// Central auth/session helpers
// Goal:
// 1) Old login should NOT survive a fresh tab/browser/app start.
// 2) Auth data should expire automatically after 1 day.
// 3) Logout should clear localStorage, sessionStorage and client-readable cookies.

export const AUTH_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day

const STORAGE_KEYS = ["access", "refresh", "role", "auth_expires_at"];
const COOKIE_KEYS = ["access", "refresh", "role"];

const AUTH_SESSION_KEY = "auth_session_active";
const AUTH_EXPIRES_AT_KEY = "auth_expires_at";

const safeLocalStorage = () => {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

const safeSessionStorage = () => {
    try {
        return window.sessionStorage;
    } catch {
        return null;
    }
};

const expireCookie = (name) => {
    if (typeof document === "undefined") return;

    const expired = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = expired;
    document.cookie = `${expired}; SameSite=Lax`;
};

const setClientCookie = (name, value) => {
    if (typeof document === "undefined" || !value) return;

    // Note: JavaScript can only manage client-readable cookies.
    // HttpOnly cookies must be expired by the backend response.
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${AUTH_MAX_AGE_MS / 1000}; path=/; SameSite=Lax`;
};

export const clearAuthData = () => {
    const local = safeLocalStorage();
    const session = safeSessionStorage();

    STORAGE_KEYS.forEach((key) => local?.removeItem(key));
    session?.removeItem(AUTH_SESSION_KEY);
    COOKIE_KEYS.forEach(expireCookie);
};

export const getStoredAuth = () => {
    const local = safeLocalStorage();
    return {
        token: local?.getItem("access") || "",
        refresh: local?.getItem("refresh") || "",
        role: local?.getItem("role") || "",
        expiresAt: Number(local?.getItem(AUTH_EXPIRES_AT_KEY) || 0),
    };
};

export const isAuthExpired = () => {
    const { expiresAt } = getStoredAuth();
    return Boolean(expiresAt && Date.now() > expiresAt);
};

export const hasActiveTabSession = () => {
    const session = safeSessionStorage();
    return session?.getItem(AUTH_SESSION_KEY) === "1";
};

export const startOrKeepAuthSession = () => {
    const local = safeLocalStorage();
    const session = safeSessionStorage();
    const auth = getStoredAuth();

    if (!auth.token || !auth.role) return false;

    if (!auth.expiresAt) {
        local?.setItem(AUTH_EXPIRES_AT_KEY, String(Date.now() + AUTH_MAX_AGE_MS));
    }

    session?.setItem(AUTH_SESSION_KEY, "1");
    setClientCookie("access", auth.token);
    if (auth.refresh) setClientCookie("refresh", auth.refresh);
    setClientCookie("role", auth.role);

    return true;
};

export const isAuthValid = () => {
    const { token, role } = getStoredAuth();

    if (!token || !role) return false;

    if (isAuthExpired()) {
        clearAuthData();
        return false;
    }

    startOrKeepAuthSession();
    return true;
};

export const initializeAuthForAppStartup = () => {
    const { token, role } = getStoredAuth();

    if (!token && !role) return;

    // If the app starts in a new tab/browser session, force login page.
    // This fixes the case where localStorage kept the previous role after server restart.
    if (!hasActiveTabSession()) {
        clearAuthData();
        return;
    }

    if (isAuthExpired()) {
        clearAuthData();
    }
};
