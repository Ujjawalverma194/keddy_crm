import React, { useState, useEffect } from "react";
import { apiRequest } from "../services/api";

const SubmissionModal = ({ isOpen, onClose, selectedCand, notify, refreshData, initialSubmitType = "INTERNAL", hideInternalOption = false }) => {
    const [submitType, setSubmitType] = useState(initialSubmitType);
    const [searchTerm, setSearchTerm] = useState("");
    const [jdSearchTerm, setJdSearchTerm] = useState("");
    const [jdFilter, setJdFilter] = useState('both'); // 'both', 'today', 'yesterday', 'all'
    
    const [employees, setEmployees] = useState([]);
    const [clientsList, setClientsList] = useState([]);
    const [jdList, setJdList] = useState([]);
    const [selectedJdId, setSelectedJdId] = useState("");
    const [submitData, setSubmitData] = useState({ target_id: "", client_rate: "", client_rate_type: "" });

    const fetchEmployees = async (search = "") => {
        try {
            const res = await apiRequest(
                `/employee-portal/api/employees/?search=${encodeURIComponent(search)}`
            );
            setEmployees(Array.isArray(res) ? res : (res?.results && Array.isArray(res.results) ? res.results : []));
        } catch (err) { console.error("Employee search failed"); }
    };

    const fetchClients = async (search = "") => {
        try {
            const res = await apiRequest(`/employee-portal/clients/list/?search=${search}`);
            setClientsList(res.results || res || []);
        } catch (err) { console.error("Client search failed"); }
    };

    const fetchJDs = async (filter, search) => {
        let url = '';
        if (filter === 'all') {
            url = `/jd-mapping/api/requirements/list/?search=${search}`;
        } else {
            url = `/jd-mapping/my-jds/?type=${filter}&search=${search}`;
        }
        try {
            const res = await apiRequest(url);
            setJdList(res.results || res || []);
        } catch (err) { console.error("JD search failed"); }
    };

    useEffect(() => {
        setSubmitType(initialSubmitType);
    }, [isOpen, initialSubmitType]);
    
    useEffect(() => {
        if (isOpen) {
            const delayDebounceFn = setTimeout(() => {
                if (submitType === 'INTERNAL') fetchEmployees(searchTerm);
                else fetchClients(searchTerm);
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchTerm, submitType, isOpen]);

    useEffect(() => {
        if (isOpen) {
            const delayDebounceFn = setTimeout(() => fetchJDs(jdFilter, jdSearchTerm), 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [jdSearchTerm, jdFilter, isOpen]);

    const handleFinalSubmission = async () => {
        if (!submitData.target_id) return notify("Please select a target", "error");
        if (!selectedJdId) return notify("Please select a JD/Requirement", "error");

        const payload = { verification_status: true };
        if (submitType === "INTERNAL") {
            payload.submitted_to = submitData.target_id;
        } else {
            if (!submitData.client_rate || !submitData.client_rate_type) return notify("Rate details required", "error");
            payload.client = submitData.target_id;
            payload.client_rate = submitData.client_rate;
            payload.client_rate_type = submitData.client_rate_type;
        }

        try {
            await apiRequest(`/employee-portal/candidates/${selectedCand.id}/update/`, "PUT", payload);
            await apiRequest("/jd-mapping/api/submissions/create/", "POST", {
                candidate_id: selectedCand.id,
                requirement_id: selectedJdId
            });
            notify("Profile & JD submitted successfully!");
            onClose();
            refreshData();
        } catch (err) { notify("Submission failed", "error"); }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h3 style={{ color: '#25343F', marginBottom: '15px', fontWeight: '800' }}>Complete Submission</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    {!hideInternalOption && <button style={{ ...styles.typeBtn, border: submitType === 'INTERNAL' ? '2px solid #FF9B51' : '1px solid #F0F2F4' }} onClick={() => { setSubmitType('INTERNAL'); setSubmitData({ target_id: "" }); }}>Internal Team</button>}
                    <button style={{ ...styles.typeBtn, border: submitType === 'CLIENT' ? '2px solid #FF9B51' : '1px solid #F0F2F4' }} onClick={() => { setSubmitType('CLIENT'); setSubmitData({ target_id: "" }); }}>Client</button>
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.modalLabel}>Select {submitType}</label>
                    <input type="text" placeholder={`Search ${submitType}...`} style={styles.modalInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <select style={styles.modalSelect} size="5" value={submitData.target_id} onChange={(e) => setSubmitData({ ...submitData, target_id: e.target.value })}>
                        <option value="">-- Choose --</option>
                        {(submitType === 'INTERNAL' ? employees : clientsList).map((item) => (
                            <option key={item.id} value={item.id}>
                                {submitType === 'INTERNAL' ? `${item.first_name} ${item.last_name}` : (item.company_name || item.client_name)}
                            </option>
                        ))}
                    </select>
                </div>

                {submitType === "CLIENT" && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="number" placeholder="Rate" style={styles.modalInput} onChange={e => setSubmitData({ ...submitData, client_rate: e.target.value })} />
                        <select style={styles.modalInput} onChange={e => setSubmitData({ ...submitData, client_rate_type: e.target.value })}>
                            <option value="">Type</option><option value="LPM">LPM</option><option value="KPM">KPM</option><option value="PHR">PHR</option>
                        </select>
                    </div>
                )}

                <div style={{ ...styles.inputGroup, marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                    <label style={styles.modalLabel}>Choose JD (Required) *</label>
                    
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                        <button style={jdFilter === 'both' ? styles.activeJdFilter : styles.jdFilter} onClick={() => setJdFilter('both')}>Today & Yesterday</button>
                        <button style={jdFilter === 'today' ? styles.activeJdFilter : styles.jdFilter} onClick={() => setJdFilter('today')}>Today</button>
                        <button style={jdFilter === 'yesterday' ? styles.activeJdFilter : styles.jdFilter} onClick={() => setJdFilter('yesterday')}>Yesterday</button>
                        <button style={jdFilter === 'all' ? styles.activeJdFilter : styles.jdFilter} onClick={() => setJdFilter('all')}>All</button>
                    </div>

                    <input type="text" placeholder="Search JD / Requirement ID..." style={styles.modalInput} value={jdSearchTerm} onChange={(e) => setJdSearchTerm(e.target.value)} />
                    
                    <select style={styles.modalSelect} size="4" value={selectedJdId} onChange={(e) => setSelectedJdId(e.target.value)}>
                        <option value="">-- Select JD --</option>
                        {jdList.map((jd) => (<option key={jd.id} value={jd.id}>{jd.requirement_id} - {jd.title} ({jd.client_details?.company_name || jd.client_name})</option>))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button style={styles.saveBtn} onClick={handleFinalSubmission}>Confirm</button>
                    <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(37, 52, 63, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)', padding: '20px' },
    modalContent: { background: '#fff', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative', msOverflowStyle: 'none', scrollbarWidth: 'none' },
    modalLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' },
    modalInput: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #F0F2F4', marginBottom: '10px', outline: 'none', fontSize: '13px' },
    modalSelect: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #F0F2F4', outline: 'none', fontSize: '13px', height: '110px' },
    typeBtn: { flex: 1, padding: '10px', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#25343F' },
    saveBtn: { flex: 1, background: '#FF9B51', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
    cancelBtn: { flex: 1, background: '#F1F5F9', color: '#7F8C8D', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
    jdFilter: { background: '#F1F5F9', color: '#7F8C8D', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' },
    activeJdFilter: { background: '#FF9B51', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }
};

export default SubmissionModal;
