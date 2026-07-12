import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/api';

const ProfilesPreviewModal = ({ isOpen, onClose, title, fetchEndpoint, userRole = 'employee' }) => {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        const fetchProfiles = async () => {
            try {
                // Fetch up to 500 profiles without pagination overhead in the modal for now
                const separator = fetchEndpoint.includes('?') ? '&' : '?';
                const endpoint = `${fetchEndpoint}${separator}page=1&page_size=500`;
                const response = await apiRequest(endpoint, "GET");

                if (isMounted) {
                    // Extract results depending on the response format
                    let data = [];
                    if (Array.isArray(response)) {
                        data = response;
                    } else if (response && Array.isArray(response.results)) {
                        data = response.results;
                    } else if (response && Array.isArray(response.data)) {
                        data = response.data;
                    }
                    setProfiles(data);
                }
            } catch (err) {
                console.error("Failed to fetch modal profiles:", err);
                if (isMounted) setError("Failed to load profiles");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchProfiles();

        return () => { isMounted = false; };
    }, [isOpen, fetchEndpoint]);

    if (!isOpen) return null;

    const handleViewProfile = (candidateId) => {
        const basePath = userRole === 'subadmin' || userRole === 'admin' ? '/sub-admin' : '/employee';
        navigate(`${basePath}/candidate/view/${candidateId}`);
    };

    const renderMainStatus = (status) => {
        if (!status) return "-";
        return (
            <span style={{
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "600",
                backgroundColor: status === 'SUBMITTED' ? '#FEF3C7' : '#E0E7FF',
                color: status === 'SUBMITTED' ? '#92400E' : '#3730A3',
                whiteSpace: "nowrap"
            }}>
                {status}
            </span>
        );
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                {/* Header (Fixed) */}
                <div style={styles.header}>
                    <h2 style={styles.title}>{title}</h2>
                    <button style={styles.closeBtn} onClick={onClose} title="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div style={styles.body}>
                    {loading ? (
                        <div style={styles.centerContainer}>
                            <div style={styles.spinner}></div>
                            <p style={styles.loadingText}>Loading profiles...</p>
                        </div>
                    ) : error ? (
                        <div style={styles.centerContainer}>
                            <p style={styles.errorText}>{error}</p>
                        </div>
                    ) : profiles.length === 0 ? (
                        <div style={styles.centerContainer}>
                            <p style={styles.emptyText}>No profiles found.</p>
                        </div>
                    ) : (
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead style={styles.thead}>
                                    <tr>
                                        <th style={styles.th}>Date</th>
                                        <th style={styles.th}>Candidate</th>
                                        <th style={styles.th}>Technology</th>
                                        <th style={styles.th}>Vendor / Rates</th>
                                        <th style={styles.th}>Submitted By</th>
                                        <th style={styles.th}>Status</th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profiles.map((profile) => (
                                        <tr key={profile.id} style={styles.tr}>
                                            <td style={styles.td}>
                                                {new Date(profile.created_at || profile.createdAt).toLocaleDateString('en-GB')}
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.primaryText}>{profile.candidate_name || 'N/A'}</div>
                                                <div style={styles.secondaryText}>{profile.candidate_email || ''}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.techText}>{profile.technology || '-'}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.primaryText}>{profile.vendor_company_name || profile.vendor_name || '-'}</div>
                                                {(profile.vendor_rate || profile.client_rate) && (
                                                    <div style={styles.secondaryText}>
                                                        {profile.vendor_rate ? `V: $${profile.vendor_rate}` : ''}
                                                        {profile.vendor_rate && profile.client_rate ? ' | ' : ''}
                                                        {profile.client_rate ? `C: $${profile.client_rate}` : ''}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                {profile.created_by_name || '-'}
                                            </td>
                                            <td style={styles.td}>
                                                {renderMainStatus(profile.main_status || profile.mainStatus)}
                                            </td>
                                            <td style={styles.td}>
                                                <button 
                                                    style={styles.viewBtn} 
                                                    onClick={() => handleViewProfile(profile.id)}
                                                >
                                                    View Profile
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
    },
    modal: {
        background: '#fff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '1100px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
    },
    header: {
        padding: '20px 24px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FAFAFA'
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: '700',
        color: '#1E293B'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#64748B',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        transition: 'all 0.2s'
    },
    body: {
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff'
    },
    tableContainer: {
        flex: 1,
        overflowY: 'auto',
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
    },
    thead: {
        position: 'sticky',
        top: 0,
        backgroundColor: '#F8FAFC',
        zIndex: 1,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    th: {
        padding: '14px 16px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid #E2E8F0'
    },
    tr: {
        borderBottom: '1px solid #F1F5F9',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#F8FAFC'
        }
    },
    td: {
        padding: '14px 16px',
        fontSize: '13px',
        verticalAlign: 'middle',
        color: '#334155'
    },
    primaryText: {
        fontWeight: '600',
        color: '#1E293B',
        fontSize: '13px'
    },
    secondaryText: {
        fontSize: '12px',
        color: '#64748B',
        marginTop: '2px'
    },
    techText: {
        color: '#f97316',
        fontWeight: '500',
        fontSize: '13px'
    },
    viewBtn: {
        backgroundColor: '#FFF7ED',
        color: '#EA580C',
        border: '1px solid #FDBA74',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    centerContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        flex: 1
    },
    loadingText: {
        color: '#64748B',
        fontSize: '14px',
        marginTop: '12px',
        fontWeight: '500'
    },
    errorText: {
        color: '#EF4444',
        fontSize: '14px',
        fontWeight: '500'
    },
    emptyText: {
        color: '#64748B',
        fontSize: '15px',
        fontWeight: '500'
    },
    spinner: {
        width: '32px',
        height: '32px',
        border: '3px solid #FFF7ED',
        borderTop: '3px solid #EA580C',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    }
};

export default ProfilesPreviewModal;
