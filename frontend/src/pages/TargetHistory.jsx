import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { getStoredAuth } from "./components/authSession";

import SubAdminLayout from "./components/SubAdminLayout";
import EmpBase from "./components/emp_base";

export default function TargetHistory() {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');
    const { role } = getStoredAuth();
    
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(true);

    const Layout = role === 'EMPLOYEE' ? EmpBase : SubAdminLayout;

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const url = userId ? `/api/targets/history?userId=${userId}` : `/api/targets/history`;
                const response = await apiRequest(url, "GET");
                if (Array.isArray(response)) {
                    setTargets(response);
                }
            } catch (error) {
                console.error("Failed to load target history", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [userId]);

    const getStatusStyle = (status) => {
        switch(status) {
            case 'COMPLETED': return { background: '#DCFCE7', color: '#16A34A' };
            case 'BEHIND': return { background: '#FEE2E2', color: '#EF4444' };
            case 'ACTIVE': return { background: '#EFF6FF', color: '#2563EB' };
            case 'ARCHIVED': return { background: '#F1F5F9', color: '#64748B' };
            default: return { background: '#F1F5F9', color: '#64748B' };
        }
    };

    return (
        <Layout>
            <div style={{ padding: '20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#25343F', marginBottom: '20px' }}>
                    Target History {userId && targets.length > 0 && targets[0].employee ? `- ${targets[0].employee.firstName} ${targets[0].employee.lastName}` : ''}
                </h2>
                
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading history...</div>
                ) : targets.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        No target history found.
                    </div>
                ) : (
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#F9FAFB', borderBottom: '2px solid #E2E8F0' }}>
                                <tr>
                                    {role !== 'EMPLOYEE' && <th style={styles.th}>Employee</th>}
                                    <th style={styles.th}>Date Range</th>
                                    <th style={styles.th}>Duration</th>
                                    <th style={styles.thCenter}>Profiles Target</th>
                                    <th style={styles.thCenter}>Submissions Target</th>
                                    <th style={styles.thCenter}>Interviews Target</th>
                                    <th style={styles.thCenter}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {targets.map(t => {
                                    const sStyle = getStatusStyle(t.calculatedStatus || t.status);
                                    return (
                                        <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            {role !== 'EMPLOYEE' && (
                                                <td style={styles.td}>
                                                    <div style={{fontWeight: '600'}}>{t.employee?.firstName || ''} {t.employee?.lastName || ''}</div>
                                                </td>
                                            )}
                                            <td style={styles.td}>
                                                <div>{new Date(t.startDate).toLocaleDateString()}</div>
                                                {t.endDate && <div style={{ fontSize: '11px', color: '#64748B' }}>to {new Date(t.endDate).toLocaleDateString()}</div>}
                                            </td>
                                            <td style={styles.td}>{t.targetDuration}</td>
                                            <td style={styles.tdCenter}>
                                                <div style={{fontWeight: '700'}}>
                                                    {t.profilesSourcingTarget != null ? `${t.progress?.profileSourcing || 0} / ${t.profilesSourcingTarget}` : '-'}
                                                </div>
                                            </td>
                                            <td style={styles.tdCenter}>
                                                <div style={{fontWeight: '700'}}>
                                                    {t.totalSubmissionTarget != null ? `${t.progress?.submissions || 0} / ${t.totalSubmissionTarget}` : '-'}
                                                </div>
                                            </td>
                                            <td style={styles.tdCenter}>
                                                <div style={{fontWeight: '700'}}>
                                                    {t.interviewTarget != null ? `${t.progress?.interviews || 0} / ${t.interviewTarget}` : '-'}
                                                </div>
                                            </td>
                                            <td style={styles.tdCenter}>
                                                <span style={{
                                                    fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px',
                                                    ...sStyle
                                                }}>
                                                    {t.calculatedStatus || t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}

const styles = {
    th: { padding: '15px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
    thCenter: { padding: '15px 20px', textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
    td: { padding: '15px 20px', fontSize: '14px', color: '#334155' },
    tdCenter: { padding: '15px 20px', textAlign: 'center', fontSize: '14px', color: '#334155' }
};
