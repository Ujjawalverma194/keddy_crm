import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import BaseLayout from "../components/SubAdminLayout";
import { getStoredAuth } from "../components/authSession";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ["#4834D4", "#FF9B51", "#27AE60"]; // Purple, Orange, Green

const format12Hour = (timeStr) => {
    if (!timeStr) return "N/A";
    const [h, m] = timeStr.split(':');
    if (!h || !m) return timeStr;
    let hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${suffix}`;
};

const Icons = {
  Close: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
};

export default function TeamOverview() {
  const navigate = useNavigate();
  const { isTeamLeaderMode, authState } = getStoredAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [timeFilter, setTimeFilter] = useState("today"); // today, week, month, quarter, custom
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [sortConfig, setSortConfig] = useState({ key: 'submitted', direction: 'desc' });
  
  // EOD Modal State
  const [eodModalOpen, setEodModalOpen] = useState(false);
  const [eodEmployee, setEodEmployee] = useState(null);
  const [eodData, setEodData] = useState([]);
  const [eodLoading, setEodLoading] = useState(false);
  const [selectedEodIndex, setSelectedEodIndex] = useState(0);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let query = `?time=${timeFilter}`;
      if (selectedEmployee) query += `&employee_id=${selectedEmployee.id}`;
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

  useEffect(() => {
    fetchAnalytics();
  }, [timeFilter, selectedEmployee, customRange]);

  const handleDrillDown = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleClearDrillDown = () => {
    setSelectedEmployee(null);
  };

  const handleViewEod = async (e, user) => {
    e.stopPropagation(); // prevent drill down row click
    setEodEmployee(user);
    setEodModalOpen(true);
    setEodLoading(true);
    try {
      const response = await apiRequest(`/sub-admin/api/eod/employee/${user.id}`, "GET");
      if (response && response.results) {
        setEodData(response.results);
        setSelectedEodIndex(0); // latest by default
      }
    } catch (err) {
      console.error("Failed to load EODs", err);
    } finally {
      setEodLoading(false);
    }
  };

  const closeEodModal = () => {
    setEodModalOpen(false);
    setEodEmployee(null);
    setEodData([]);
  };

  const sortedTeamBreakdown = React.useMemo(() => {
    if (!data?.team_breakdown) return [];
    let sortableItems = [...data.team_breakdown];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'name') {
          aVal = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          bVal = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data?.team_breakdown, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key) => {
    if (!sortConfig || sortConfig.key !== key) return "";
    return sortConfig.direction === 'asc' ? " ↑" : " ↓";
  };

  if (!data) return (
    <BaseLayout>
       <div style={{ padding: "50px", textAlign: "center", color: "#64748B" }}>Loading Team Analytics...</div>
    </BaseLayout>
  );

  const sm = data.summary_metrics;
  const pf = data.pipeline_funnel;
  const topPerformer = [...(data.team_breakdown || [])].sort((a,b) => b.submitted - a.submitted)[0];

  // Prepare Pie Chart Data
  const pieData = [
    { name: "Internal Screening", value: pf.internal_screening },
    { name: "L1 Interview", value: pf.l1 },
    { name: "L2+ Interview", value: pf.l2 + pf.l3 },
  ].filter(d => d.value > 0);
  if (pieData.length === 0) pieData.push({ name: "No Data", value: 1 });

  // Pipeline Math
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
          <h4 style={styles.subTitle}>RECRUITING OPS</h4>
          <h1 style={styles.pageTitle}>Team Performance Panel</h1>
          <p style={styles.metaText}>
            {selectedEmployee ? '1 member' : `${data.team_breakdown.length} members`} • This {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
          </p>
        </div>
        <div style={styles.timeFilters}>
          {['today', 'week', 'month', 'quarter', 'custom'].map(tf => (
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

      {selectedEmployee && (
        <div style={styles.drillDownBanner}>
           <span style={{color: '#FF9B51', fontWeight: 'bold'}}>Viewing: {selectedEmployee.first_name} {selectedEmployee.last_name}</span>
           <button onClick={handleClearDrillDown} style={styles.clearBtn}><Icons.Close /></button>
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
          <div style={styles.cardLabel}>AVG SUBMITS / RECRUITER</div>
          <div style={styles.cardValue}>{sm.avg_submits_recruiter}</div>
          <div style={styles.cardSub}>across {selectedEmployee ? '1 person' : `${data.team_breakdown.length} people`}</div>
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
           <span style={styles.panelMeta}>Sourced → Screening → Submitted → L1 → L2 → L3 → Onboarded (for closer)</span>
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

      {/* Charts */}
      {/* <div style={styles.chartGrid}>
         <div style={styles.panel}>
            <div style={styles.panelHeader}>
               <h3 style={styles.panelTitle}>Activity Over Time</h3>
            </div>
            <div style={{ height: '250px', padding: '10px 20px 20px 0' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.activity_over_time}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{fontSize: 11, fill: '#94A3B8'}} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, dataMax => Math.max(dataMax, 40)]} tick={{fontSize: 11, fill: '#94A3B8'}} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#FF9B51" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="interviews" name="Interviews" stroke="#4834D4" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="onboarded" name="Onboarded" stroke="#27AE60" strokeWidth={2} dot={false} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>
         <div style={styles.panel}>
            <div style={styles.panelHeader}>
               <h3 style={styles.panelTitle}>Screening & Interview Mix</h3>
            </div>
            <div style={{ height: '250px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Legend 
                      content={(props) => {
                        const { payload } = props;
                        return (
                          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px', marginTop: '10px' }}>
                            {payload.map((entry, index) => (
                              <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color }}></span>
                                {entry.value}: <span style={{ fontWeight: '800', color: '#1E293B' }}>{entry.payload.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                      verticalAlign="bottom" 
                      align="center" 
                    />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div> */}

      {/* Team Breakdown Table */}
      <div style={styles.panel}>
         <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Team Breakdown</h3>
            <span style={styles.panelMeta}>Top performer: <strong style={{color: '#FF9B51'}}>{topPerformer ? `${topPerformer.first_name} ${topPerformer.last_name}` : 'N/A'}</strong></span>
         </div>
         <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
               <thead>
                  <tr style={styles.thRow}>
                     <th style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} onClick={() => requestSort('name')}>RECRUITER{getSortIndicator('name')}</th>
                     <th style={{...styles.thCenter, cursor: 'pointer', userSelect: 'none'}} onClick={() => requestSort('today_src')}>TODAY SRC{getSortIndicator('today_src')}</th>
                     <th style={{...styles.thCenter, cursor: 'pointer', userSelect: 'none'}} onClick={() => requestSort('today_sub')}>TODAY SUB{getSortIndicator('today_sub')}</th>
                     <th style={{...styles.thCenter, cursor: 'pointer', userSelect: 'none'}} onClick={() => requestSort('sourced')}>SOURCED{getSortIndicator('sourced')}</th>
                     <th style={{...styles.thCenter, cursor: 'pointer', userSelect: 'none'}} onClick={() => requestSort('screen')}>SCREEN{getSortIndicator('screen')}</th>
                     <th style={{...styles.thCenterBlue, cursor: 'pointer', userSelect: 'none'}} onClick={() => requestSort('submitted')}>SUBMITTED{getSortIndicator('submitted')}</th>
                     <th style={{...styles.thCenter, cursor: 'pointer', userSelect: 'none'}} onClick={() => requestSort('l1')}>L1{getSortIndicator('l1')}</th>
                     <th style={{...styles.thCenter, cursor: 'pointer', userSelect: 'none'}} onClick={() => requestSort('l2')}>L2{getSortIndicator('l2')}</th>
                     <th style={{...styles.thCenter, cursor: 'pointer', userSelect: 'none'}} onClick={() => requestSort('l3')}>L3{getSortIndicator('l3')}</th>
                     <th style={{...styles.thCenter, cursor: 'pointer', userSelect: 'none'}} onClick={() => requestSort('onboarded')}>ONBOARDED{getSortIndicator('onboarded')}</th>
                     <th style={{...styles.thCenter, width: '80px'}}>EOD</th>
                  </tr>
               </thead>
               <tbody>
                  {sortedTeamBreakdown.map(user => {
                     const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
                     return (
                     <tr key={user.id} style={{...styles.tr, backgroundColor: selectedEmployee?.id === user.id ? 'rgba(255, 155, 81, 0.15)' : 'transparent'}} onClick={() => handleDrillDown(user)}>
                        <td style={styles.tdLeft}>
                           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                              <div style={styles.avatar}>{initials}</div>
                              <div>
                                 <div style={styles.userName}>{user.first_name} {user.last_name}</div>
                                 <div style={styles.userRole}>{user.isTeamLeader ? 'Team Lead' : (user.role === 'EMPLOYEE' ? 'Recruiter' : user.role)}</div>
                              </div>
                           </div>
                        </td>
                        <td style={styles.tdCenter}>{user.today_src}</td>
                        <td style={styles.tdCenter}>{user.today_sub}</td>
                        <td style={styles.tdCenter}>{user.sourced}</td>
                        <td style={styles.tdCenter}>{user.screen}</td>
                        <td style={styles.tdCenterBlue}>{user.submitted}</td>
                        <td style={styles.tdCenter}>{user.l1}</td>
                        <td style={styles.tdCenter}>{user.l2}</td>
                        <td style={styles.tdCenter}>{user.l3}</td>
                        <td style={styles.tdCenterOrange}>{user.onboarded}</td>
                        <td style={styles.tdCenter}>
                          <button onClick={(e) => handleViewEod(e, user)} style={styles.viewEodBtn}>View EOD</button>
                        </td>
                     </tr>
                  )})}
               </tbody>
            </table>
         </div>
      </div>

      {/* EOD Modal */}
      {eodModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                EOD Report - {eodEmployee?.first_name} {eodEmployee?.last_name}
              </h3>
              <button onClick={closeEodModal} style={styles.closeBtn}><Icons.Close /></button>
            </div>
            
            <div style={styles.modalBody}>
              {eodLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading EODs...</div>
              ) : eodData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>No EOD reports found for this employee.</div>
              ) : (
                <>
                  <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Select Date:</span>
                    <select 
                      value={selectedEodIndex} 
                      onChange={(e) => setSelectedEodIndex(Number(e.target.value))}
                      style={styles.dateSelect}
                    >
                      {eodData.map((eod, idx) => (
                        <option key={eod.id} value={idx}>{eod.date}</option>
                      ))}
                    </select>
                  </div>
                  
                  {eodData[selectedEodIndex] && (
                    <div style={styles.eodDetailsGrid}>
                      <div style={styles.eodField}>
                        <div style={styles.eodLabel}>Date</div>
                        <div style={styles.eodValue}>{eodData[selectedEodIndex].date}</div>
                      </div>
                      <div style={styles.eodField}>
                        <div style={styles.eodLabel}>Reporting Time</div>
                        <div style={styles.eodValue}>{format12Hour(eodData[selectedEodIndex].reportingTime)}</div>
                      </div>
                      <div style={styles.eodField}>
                        <div style={styles.eodLabel}>Log Out Time</div>
                        <div style={styles.eodValue}>{format12Hour(eodData[selectedEodIndex].logoutTime)}</div>
                      </div>
                      
                      <div style={{...styles.eodField, gridColumn: '1 / -1'}}>
                        <div style={styles.eodLabel}>Tasks Completed</div>
                        <pre style={styles.eodPre}>{eodData[selectedEodIndex].tasksCompleted || "N/A"}</pre>
                      </div>
                      <div style={{...styles.eodField, gridColumn: '1 / -1'}}>
                        <div style={styles.eodLabel}>Issues Faced Today</div>
                        <pre style={styles.eodPre}>{eodData[selectedEodIndex].issuesFaced || "N/A"}</pre>
                      </div>
                      <div style={{...styles.eodField, gridColumn: '1 / -1'}}>
                        <div style={styles.eodLabel}>Resolution Steps / Tomorrow's Plan</div>
                        <pre style={styles.eodPre}>{eodData[selectedEodIndex].resolutionSteps || "N/A"}</pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div style={styles.modalFooter}>
              <button onClick={closeEodModal} style={styles.closeFooterBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
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
  drillDownBanner: { display: 'inline-flex', alignItems: 'center', background: 'rgba(255, 155, 81, 0.1)', padding: '6px 14px', borderRadius: '20px', marginBottom: '20px', gap: '10px', border: '1px solid rgba(255, 155, 81, 0.2)' },
  clearBtn: { background: 'transparent', border: 'none', color: '#FF9B51', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px', marginBottom: '25px' },
  card: { background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  cardLabel: { fontSize: '11px', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' },
  cardValue: { fontSize: '28px', fontWeight: '800', color: '#0F172A', margin: '8px 0', display: 'flex', alignItems: 'center', gap: '5px' },
  vsPrev: { fontSize: '11px', color: '#ef4444', fontWeight: '700' },
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

  chartGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', marginBottom: '25px' },

  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { borderBottom: '2px solid #E2E8F0' },
  th: { padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' },
  thCenter: { padding: '12px 10px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748B', letterSpacing: '0.5px' },
  thCenterBlue: { padding: '12px 10px', textAlign: 'center', fontSize: '11px', fontWeight: '800', color: '#FF9B51', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.2s' },
  tdLeft: { padding: '12px 20px' },
  tdCenter: { padding: '12px 10px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#334155' },
  tdCenterBlue: { padding: '12px 10px', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: '#FF9B51' },
  tdCenterOrange: { padding: '12px 10px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#27AE60' },
  
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#ff9b51', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' },
  userName: { fontSize: '13px', fontWeight: '700', color: '#25343F' },
  userRole: { fontSize: '11px', color: '#64748B' },
  
  viewEodBtn: { padding: '4px 8px', fontSize: '11px', fontWeight: '700', color: '#4834D4', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', borderRadius: '12px', width: '600px', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' },
  modalTitle: { margin: 0, fontSize: '18px', fontWeight: '800', color: '#1E293B' },
  closeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: '4px' },
  modalBody: { padding: '20px', overflowY: 'auto', flex: 1 },
  modalFooter: { padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' },
  closeFooterBtn: { padding: '8px 16px', backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' },
  
  dateSelect: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#1E293B', outline: 'none', minWidth: '150px' },
  eodDetailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' },
  eodField: { backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #F1F5F9' },
  eodLabel: { fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  eodValue: { fontSize: '14px', fontWeight: '600', color: '#1E293B' },
  eodPre: { margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', fontSize: '13px', color: '#334155', lineHeight: '1.5' }
};
