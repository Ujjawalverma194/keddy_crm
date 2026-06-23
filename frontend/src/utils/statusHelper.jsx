/*
*
 * Har status ke liye unique color background aur text color return karta hai.
 * Is logic ko update karne par poore project ki list/detail tables ke rang badal jayenge.
 */
export const getStatusStyles = (status) => {
    switch (status) {
        case "SUBMITTED":
            return { bg: "#E8F4FD", text: "#1976D2" };
        case "SCREENING":
            return { bg: "#ffee005e", text: "#383333" };
        case "L1":
            return { bg: "#6365f146", text: "#1976D2" };
        case "L2":
            return { bg: "#D6DBF0", text: "#101933" };
        case "L3":
            return { bg: "#31df39a8", text: "#183f1a" };
        case "OTHER":
            return { bg: "#00ff0da9", text: "#183f1a" };
        case "OFFERED":
            return { bg: "#FFF9C4", text: "#F57F17" };
        case "ONBORD":
            return { bg: "#C8E6C9", text: "#1B5E20" };
        case "ON_HOLD":
            return { bg: "#FFF3E0", text: "#E65100" };
        case "REJECTED":
            return { bg: "#FFEBEE", text: "#C62828" };
        case "WITHDRAWN":
            return { bg: "#ECEFF1", text: "#455A64" };
        case "OFFBOARDED":
            return { bg: "#E0E0E0", text: "#424242" };
        default:
            return { bg: "#ffffff", text: "#334155" };
    }
};

// Main status dropdown options
export const MAIN_STATUS_OPTIONS = [
    "SUBMITTED",
    "SCREENING",
    "L1",
    "L2",
    "L3",
    "OTHER",
    "OFFERED",
    "ONBORD",
    "REJECTED",
    "ON_HOLD",
    "WITHDRAWN",
    "OFFBOARDED"
];

// Sub status dropdown options
export const SUB_STATUS_OPTIONS = [
    "NONE", 
    "SCHEDULED", 
    "COMPLETED", 
    "FEEDBACK_PENDING", 
    "CLEARED", 
    "REJECTED", 
    "ON_HOLD", 
    "POSTPONED", 
    "NO_SHOW", 
    "INTERVIEW_PENDING"
];