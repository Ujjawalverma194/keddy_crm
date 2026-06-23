export const getRequirementRowBgByStatus = (status) => {
    switch(status) {
        case 'HOT': return '#FFF7ED';
        case 'WARM': return '#FFFBEB';
        default: return '#FFFFFF';
    }
};