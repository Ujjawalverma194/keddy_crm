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
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' },
    modalContent: { background: '#fff', padding: '30px', borderRadius: '15px', width: '380px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
    inputGroup: { marginBottom: '15px' },
    modalLabel: { fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '5px', textTransform: 'uppercase' },
    select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' },
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', height: '80px', resize: 'none' },
    saveBtn: { flex: 1, background: '#FF9B51', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
    cancelBtn: { flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }
};

export default StatusUpdateModal;