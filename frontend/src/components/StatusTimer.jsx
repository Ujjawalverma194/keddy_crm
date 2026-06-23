import React, { useState, useEffect } from "react";

const StatusTimer = ({ createdAt, status, manual_status, manual_status_updated_at }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!createdAt) return;
        
        const calculateTimeLeft = () => {
            const now = new Date();
            let referenceTime;
            if (manual_status && manual_status_updated_at) {
                referenceTime = new Date(manual_status_updated_at);
            } else {
                referenceTime = new Date(createdAt);
            }
            
            const hoursPassed = (now - referenceTime) / (1000 * 60 * 60);
            const currentStatus = status;
            
            if (currentStatus === 'HOT') {
                const remainingHours = 4 - hoursPassed;
                if (remainingHours <= 0) return "Expiring soon";
                const hours = Math.floor(remainingHours);
                const minutes = Math.floor((remainingHours % 1) * 60);
                return `${hours}h ${minutes}m remaining`;
            } 
            else if (currentStatus === 'WARM') {
                const remainingHours = 24 - hoursPassed;
                if (remainingHours <= 0) return "Expired";
                const hours = Math.floor(remainingHours);
                const minutes = Math.floor((remainingHours % 1) * 60);
                return `${hours}h ${minutes}m remaining`;
            }
            else {
                return null;
            }
        };

        setTimeLeft(calculateTimeLeft());
        
        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000);

        return () => clearInterval(interval);
    }, [createdAt, manual_status, manual_status_updated_at, status]);

    if (status === 'COLD') return null;
    if (!timeLeft) return null;
    
    return (
        <div style={{ 
            fontSize: '10px', 
            color: status === 'HOT' ? '#DC2626' : '#F59E0B', 
            marginTop: '4px', 
            fontWeight: '700',
            background: status === 'HOT' ? 'rgba(254, 226, 226, 0.6)' : 'rgba(254, 243, 199, 0.6)',
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'inline-block',
            border: `1px solid ${status === 'HOT' ? '#FCA5A5' : '#FCD34D'}`
        }}>
            ⏱ {timeLeft}
        </div>
    );
};

export default StatusTimer;