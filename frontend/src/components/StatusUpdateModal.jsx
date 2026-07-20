import React from 'react';
import { MAIN_STATUS_OPTIONS, SUB_STATUS_OPTIONS } from '../utils/statusHelper';

const StatusUpdateModal = ({ isOpen, onClose, formData, setFormData, onSave, hasClientSubmission = true }) => {
    if (!isOpen) return null;

    const restrictedStatuses = ["L1", "L2", "L3", "OTHER", "OFFERED", "ONBORD", "OFFBOARDED"];

    return (
        <div style={mStyles.modalOverlay}>
            <div style={mStyles.modalContent}>
                <h3 style={{color:'#25343F', marginBottom:'20px'}}>Update Status</h3>
                <div style={mStyles.inputGroup}>
                    <label style={mStyles.modalLabel}>Main Status</label>
                    <select style={mStyles.select} value={formData.main_status} onChange={e => setFormData({...formData, main_status: e.target.value})}>
                        {MAIN_STATUS_OPTIONS.map(opt => {
                            const isRestricted = !hasClientSubmission && restrictedStatuses.includes(opt);
                            return (
                                <option key={opt} value={opt} disabled={isRestricted}>
                                    {opt} {isRestricted ? "(Client Submission Required)" : ""}
                                </option>
                            );
                        })}
                    </select>
                </div>
                {["INTERNAL SCREENING", "CLIENT SCREENING", "L1", "L2", "L3", "OTHER"].includes(formData.main_status) && (
                    <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={mStyles.modalLabel}>Date</label>
                            <input
                                type="date"
                                style={mStyles.input}
                                value={formData.l1_l2_date || ""}
                                onChange={(e) => setFormData({ ...formData, l1_l2_date: e.target.value })}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={mStyles.modalLabel}>Time</label>
                            <select
                                style={mStyles.select}
                                value={formData.l1_l2_time || ""}
                                onChange={(e) => setFormData({ ...formData, l1_l2_time: e.target.value })}
                            >
                                <option value="" disabled>Select Time</option>
                                {Array.from({ length: 48 }).map((_, i) => {
                                    const h = Math.floor(i / 2).toString().padStart(2, '0');
                                    const m = i % 2 === 0 ? '00' : '30';
                                    const val = `${h}:${m}`;
                                    const ampm = Math.floor(i / 2) >= 12 ? 'PM' : 'AM';
                                    const h12 = Math.floor(i / 2) % 12 || 12;
                                    const label = `${h12}:${m} ${ampm}`;
                                    return <option key={val} value={val}>{label}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                )}
                <div style={mStyles.inputGroup}>
                    <label style={mStyles.modalLabel}>Sub Status</label>
                    <select style={mStyles.select} value={formData.sub_status} onChange={e => setFormData({...formData, sub_status: e.target.value})}>
                        {SUB_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div style={mStyles.inputGroup}>
                    <label style={mStyles.modalLabel}>Remark</label>
                    <textarea style={mStyles.textarea} value={formData.remark} onChange={e => setFormData({...formData, remark: e.target.value})} placeholder="Add remark..." />
                </div>
                <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                    <button style={mStyles.saveBtn} onClick={onSave}>Save Changes</button>
                    <button style={mStyles.cancelBtn} onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

const mStyles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(5px)' },
    modalContent: { background: '#fff', padding: '32px', borderRadius: '24px', width: '400px', boxShadow: '0 24px 48px rgba(0,0,0,0.12)' },
    inputGroup: { marginBottom: '18px' },
    modalLabel: { fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '8px' },
    select: { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', background: '#FAFBFC', fontSize: '14px', color: '#1E293B', transition: 'border-color 0.2s', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px top 50%', backgroundSize: '10px auto' },
    input: { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', boxSizing: 'border-box', background: '#FAFBFC', fontSize: '14px', color: '#1E293B', transition: 'border-color 0.2s' },
    textarea: { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', height: '90px', resize: 'none', outline: 'none', background: '#FAFBFC', fontSize: '14px', color: '#1E293B', transition: 'border-color 0.2s', fontFamily: 'inherit' },
    saveBtn: { flex: 1, background: '#FF9B51', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', transition: 'transform 0.1s, opacity 0.2s' },
    cancelBtn: { flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', transition: 'background 0.2s' }
};

export default StatusUpdateModal;