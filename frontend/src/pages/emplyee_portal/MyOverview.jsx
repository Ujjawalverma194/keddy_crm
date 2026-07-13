import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/emp_base";
import { getStoredAuth } from "../components/authSession";

export default function MyOverview() {
  const navigate = useNavigate();
  const auth = getStoredAuth();
  
  const [data, setData] = useState(null);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetsLoading, setTargetsLoading] = useState(true);
  
  // Filters
  const [timeFilter, setTimeFilter] = useState("today");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let query = `?time=${timeFilter}&employee_id=${auth.id}`;
      if (timeFilter === 'custom') query += `&start=${customRange.start}&end=${customRange.end}`;
      
      const response = await apiRequest(`/sub-admin/api/team-overview/analytics/${query}`, "GET");
      if (response && !response.detail) {
        setData(response);
      }
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTargets = async () => {
    setTargetsLoading(true);
    try {
      const response = await apiRequest(`/api/targets/history`, "GET");
      if (Array.isArray(response)) {
         setTargets(response);
      }
    } catch (err) {
      console.error("Failed to load targets", err);
    } finally {
      setTargetsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, customRange]);

  useEffect(() => {
    fetchTargets();
  }, []);

  const getStatusStyle = (status) => {
      switch(status) {
          case 'COMPLETED': return { background: '#DCFCE7', color: '#16A34A' };
          case 'BEHIND': return { background: '#FEE2E2', color: '#EF4444' };
          case 'ACTIVE': return { background: '#EFF6FF', color: '#2563EB' };
          case 'ARCHIVED': return { background: '#F1F5F9', color: '#64748B' };
          default: return { background: '#F1F5F9', color: '#64748B' };
      }
  };

  if (!data) return (
    <BaseLayout>
       <div style={{ padding: "50px", textAlign: "center", color: "#64748B" }}>Loading Analytics...</div>
    </BaseLayout>
  );

  const sm = data.summary_metrics;
  const pf = data.pipeline_funnel;

  const maxFunnel = Math.max(pf.sourced, 1);
  const funnelSteps = [
    { label: "Sourced", val: pf.sourced, color: "#25343F" },
    { label: "Internal Screening", val: pf.internal_screening, color: "#4834D4" },
    { label: "Submitted", val: pf.submitted, color: "#FF9B51" },
    { label: "L1", val: pf.l1, color: "#F39C12" },
    { label: "L2", val: pf.l2, color: "#E67E22" },
    { label: "L3", val: pf.l3, color: "#D35400" },
    { label: "Onboarded", val: pf.onboarded, color: "#27AE60" },
  ];

  const renderChange = (change) => {
    if (change === undefined || change === null) return null;
    if (change > 0) {
      return <span style={{ fontSize: '11px', fontWeight: '700', color: '#27AE60', marginLeft: '6px' }}>▲ {change}%</span>;
    } else if (change < 0) {
      return <span style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', marginLeft: '6px' }}>▼ {Math.abs(change)}%</span>;
    } else {
      return <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginLeft: '6px' }}>— 0%</span>;
    }
  };

  return (
    <BaseLayout>
      <div style={styles.headerContainer}>
        <div>
          <h4 style={styles.subTitle}>PERFORMANCE</h4>
          <h1 style={styles.pageTitle}>My Overview</h1>
          <p style={styles.metaText}>
            Personal Performance • This {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
          </p>
        </div>
        <div style={styles.timeFilters}>
          {['today', 'yesterday', 'week', 'month', 'quarter', 'custom'].map(tf => (
            <button 
              key={tf} 
              style={timeFilter === tf ? styles.activeFilterBtn : styles.filterBtn}
              onClick={() => setTimeFilter(tf)}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {timeFilter === 'custom' && (
        <div style={styles.customDateContainer}>
           <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} style={styles.dateInput} />
           <span style={{margin:'0 10px'}}>to</span>
           <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} style={styles.dateInput} />
        </div>
      )}

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>PROFILES SOURCED</div>
          <div style={styles.cardValue}>
             {sm.profiles_sourced}
             {renderChange(sm.profiles_sourced_change)}
          </div>
          <div style={styles.cardSub}>vs prev period</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>SUBMITTED</div>
          <div style={styles.cardValue}>
             {sm.submitted}
             {renderChange(sm.submitted_change)}
          </div>
          <div style={styles.cardSub}>to clients / vendors</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>TOTAL INTERVIEWS</div>
          <div style={styles.cardValue}>
             {sm.total_interviews}
             {renderChange(sm.total_interviews_change)}
          </div>
          <div style={styles.cardSub}>L1 + L2 + L3</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>ONBOARDED</div>
          <div style={styles.cardValue}>
             {sm.onboarded}
             {renderChange(sm.onboarded_change)}
          </div>
          <div style={styles.cardSub}>closed placements</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>AVG SUBMITS / WEEK</div>
          <div style={styles.cardValue}>{sm.avg_submits_week}</div>
          <div style={styles.cardSub}>current pace</div>
        </div>
      </div>

      {/* Funnel */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
           <h3 style={styles.panelTitle}>Pipeline Funnel</h3>
           <span style={styles.panelMeta}>Sourced → Screening → Submitted → L1 → L2 → L3 → Onboarded</span>
        </div>
        <div style={{ padding: '20px' }}>
           {funnelSteps.map((step, idx) => {
              const percentage = Math.max(1, (step.val / maxFunnel) * 100);
              const conversion = idx > 0 ? (funnelSteps[idx-1].val > 0 ? Math.round((step.val / funnelSteps[idx-1].val) * 100) : 0) : null;
              
              return (
                <div key={idx} style={styles.funnelRow}>
                  <div style={styles.funnelLabel}>{step.label}</div>
                  <div style={styles.funnelTrack}>
                     <div style={{...styles.funnelFill, width: `${percentage}%`, backgroundColor: step.color}}>
                        {step.val > 0 && <span style={styles.funnelValInside}>{step.val}</span>}
                     </div>
                  </div>
                  <div style={styles.funnelConv}>
                     {conversion !== null ? (conversion > 0 ? `${conversion}%` : '-') : ''}
                  </div>
                </div>
              )
           })}
        </div>
      </div>

      {/* Target History Table */}
      <div style={styles.panel}>
         <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Target History</h3>
            <span style={styles.panelMeta}>Your assigned targets and performance</span>
         </div>
         <div style={{ padding: '20px' }}>
            {targetsLoading ? (
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
      </div>
    </BaseLayout>
  );
}

const styles = {
  headerContainer: { marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  subTitle: { margin: 0, color: '#FF9B51', fontSize: '11px', fontWeight: '800', letterSpacing: '1px' },
  pageTitle: { margin: '5px 0', color: '#25343F', fontSize: '24px', fontWeight: '800' },
  metaText: { margin: 0, color: '#64748B', fontSize: '13px' },
  timeFilters: { display: 'flex', gap: '5px', background: '#F1F5F9', padding: '4px', borderRadius: '8px' },
  filterBtn: { background: 'transparent', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#64748B', cursor: 'pointer' },
  activeFilterBtn: { background: '#FF9B51', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(255, 155, 81, 0.2)' },
  customDateContainer: { display: 'flex', alignItems: 'center', marginBottom: '20px', background: '#fff', padding: '10px 15px', borderRadius: '8px', border: '1px solid #E2E8F0', width: 'fit-content' },
  dateInput: { border: '1px solid #CBD5E1', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', color: '#334155' },
  
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '25px' },
  card: { background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  cardLabel: { fontSize: '11px', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' },
  cardValue: { fontSize: '28px', fontWeight: '800', color: '#0F172A', margin: '8px 0', display: 'flex', alignItems: 'center', gap: '5px' },
  cardSub: { fontSize: '11px', color: '#94A3B8' },

  panel: { background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', marginBottom: '25px', overflow: 'hidden' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' },
  panelTitle: { margin: 0, fontSize: '15px', fontWeight: '700', color: '#1E293B' },
  panelMeta: { margin: 0, fontSize: '12px', color: '#94A3B8' },

  funnelRow: { display: 'flex', alignItems: 'center', marginBottom: '12px' },
  funnelLabel: { width: '140px', fontSize: '12px', fontWeight: '600', color: '#475569', textAlign: 'right', paddingRight: '15px' },
  funnelTrack: { flex: 1, background: '#F1F5F9', height: '24px', borderRadius: '12px', position: 'relative', overflow: 'hidden' },
  funnelFill: { height: '100%', borderRadius: '12px', display: 'flex', alignItems: 'center', paddingLeft: '10px', transition: 'width 0.5s ease' },
  funnelValInside: { color: '#fff', fontSize: '11px', fontWeight: '700' },
  funnelConv: { width: '50px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748B' },

  th: { padding: '15px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  thCenter: { padding: '15px 20px', textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  td: { padding: '15px 20px', fontSize: '14px', color: '#334155' },
  tdCenter: { padding: '15px 20px', textAlign: 'center', fontSize: '14px', color: '#334155' }
};
