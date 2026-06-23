import React from "react";
import { getRequirementRowBgByStatus } from "../utils/RequirementRowHelper";

const RequirementRowWrapper = ({ status, children, onClick, ...props }) => {
    const baseBg = getRequirementRowBgByStatus(status);
    
    return (
        <tr
            style={{
                borderBottom: "1px solid #F1F5F9",
                cursor: "pointer",
                backgroundColor: baseBg
            }}
            onClick={onClick}
            {...props}
        >
            {children}
        </tr>
    );
};

export default RequirementRowWrapper;