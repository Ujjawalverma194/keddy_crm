const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. EMPTY_FORM cleanup
  content = content.replace(/name:\s*"",\s*number:\s*"",\s*email:\s*"",\s*poc_id:\s*null,\s*/, '');
  
  // 2. Add pocs state, remove showPocForm
  content = content.replace(/const \[showPocForm, setShowPocForm\] = useState\(false\);/, `const [pocs, setPocs] = useState([{ id: null, name: "", number: "", email: "", isPrimary: false }]);`);

  // 3. Update assignPoc
  const assignRegex = /name:\s*poc\.name\s*\|\|\s*"",\s*number:\s*poc\.number\s*\|\|\s*"",\s*email:\s*poc\.email\s*\|\|\s*"",\s*poc_id:\s*poc\.id\s*\}\);\s*setShowPocModal\(false\);\s*setShowPocForm\(true\);/;
  content = content.replace(assignRegex, `});
    setPocs([{ id: poc.id, name: poc.name || "", number: poc.number || "", email: poc.email || "", isPrimary: poc.isPrimary || false }]);
    setShowPocModal(false);`);

  // 4. Update addNewPoc
  const addNewRegex = /name:\s*"",\s*number:\s*"",\s*email:\s*"",\s*poc_id:\s*null\s*\}\);\s*setShowPocModal\(false\);\s*setShowPocForm\(true\);/;
  content = content.replace(addNewRegex, `});
    setPocs([{ id: null, name: "", number: "", email: "", isPrimary: false }]);
    setShowPocModal(false);`);

  // 5. Add handlePocChange, addAnotherPoc, removePoc before handleFileChange
  const pocFunctions = `
  const handlePocChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newPocs = [...pocs];
    if (type === 'checkbox' && name === 'isPrimary') {
      newPocs.forEach(p => p.isPrimary = false); // uncheck all others
      newPocs[index][name] = checked;
    } else {
      newPocs[index][name] = value;
    }
    setPocs(newPocs);
  };

  const addAnotherPoc = () => {
    setPocs([...pocs, { id: null, name: "", number: "", email: "", isPrimary: false }]);
  };

  const removePoc = (index) => {
    const newPocs = pocs.filter((_, i) => i !== index);
    setPocs(newPocs);
  };
`;
  content = content.replace(/const handleFileChange/, pocFunctions + '\n  const handleFileChange');

  // 6. Update handleSubmit formData
  const formSubmitRegex = /if \(form\.name && form\.number\) \{\s*formData\.append\("pocs", JSON\.stringify\(\[\{\s*id: form\.poc_id, name: form\.name, number: form\.number, email: form\.email, isPrimary: true\s*\}\]\)\);\s*\}/;
  content = content.replace(formSubmitRegex, `const validPocs = pocs.filter(p => p.name && p.number);
    if (validPocs.length > 0) {
      formData.append("pocs", JSON.stringify(validPocs));
    }`);

  // Update handleSubmit reset
  content = content.replace(/setForm\(EMPTY_FORM\);/, `setForm(EMPTY_FORM);\n      setPocs([{ id: null, name: "", number: "", email: "", isPrimary: false }]);`);

  // 7. Update completedCount
  content = content.replace(/const completedCount = \[form\.name, form\.number, form\.company_name\]\.filter\(Boolean\)\.length;/, `const completedCount = [pocs[0]?.name, pocs[0]?.number, form.company_name].filter(Boolean).length;`);

  // 8. JSX - Remove inline "+ Add POC" button
  content = content.replace(/\{\!selectedCompanyId && form\.company_name && \!showPocForm && \(\s*<button type="button" onClick=\{[\s\S]*?<\/button>\s*\)\}/, '');

  // 9. JSX - Remove inline POC fields
  content = content.replace(/\{showPocForm && \(\s*<>\s*<Field label="POC Name"[\s\S]*?<\/Field>\s*<\/>\s*\)\}/, '');

  // 10. JSX - Add Points of Contact section
  const pocSection = `              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.Vendor /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Points of Contact</h3>
                    <p style={styles.sectionHint}>Add one or more contact persons for this company.</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {pocs.map((poc, idx) => (
                    <div key={idx} style={{ padding: "16px", borderRadius: "12px", border: "1px solid #E8ECF2", position: "relative" }}>
                      {pocs.length > 1 && (
                        <button type="button" onClick={() => removePoc(idx)} style={{ position: "absolute", top: "10px", right: "10px", background: "transparent", color: "#EF4444", border: "none", cursor: "pointer", fontWeight: "bold" }}>&times; Remove</button>
                      )}
                      <div style={styles.innerGrid}>
                        <Field label="POC Name" required style={styles.col4}>
                          <input style={styles.input} name="name" value={poc.name} onChange={(e) => handlePocChange(idx, e)} required placeholder="John Doe" />
                        </Field>
                        <Field label="Phone Number" required style={styles.col4}>
                          <input style={styles.input} name="number" value={poc.number} onChange={(e) => handlePocChange(idx, e)} required placeholder="9876543210" />
                        </Field>
                        <Field label="Email Address" style={styles.col4}>
                          <input style={styles.input} type="email" name="email" value={poc.email} onChange={(e) => handlePocChange(idx, e)} placeholder="john@example.com" />
                        </Field>
                        <div style={{ ...styles.col12, display: "flex", alignItems: "center", marginTop: "8px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", color: "#374151" }}>
                            <input type="checkbox" name="isPrimary" checked={poc.isPrimary} onChange={(e) => handlePocChange(idx, e)} style={{ accentColor: "#FF6B2C", width: "16px", height: "16px" }} />
                            Set as Primary POC
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addAnotherPoc} style={{ background: "#FFF0EA", color: "#FF6B2C", border: "1px dashed #FF6B2C", padding: "12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", textAlign: "center", width: "100%" }}>+ Add Another POC</button>
                </div>
              </div>`;
  
  // Replace the old POC & service info section with the new POC section + Service details section
  const oldServiceSectionRegex = /<div style=\{styles\.sectionCard\}>\s*<div style=\{styles\.sectionHeader\}>\s*<div style=\{styles\.sectionIcon\}><Icons\.Vendor \/><\/div>\s*<div>\s*<h3 style=\{styles\.sectionTitle\}>POC & service info<\/h3>\s*<p style=\{styles\.sectionHint\}>Contact persons, tech strengths, clients and bench details\.<\/p>\s*<\/div>\s*<\/div>/;
  
  const newServiceSection = `              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIcon}><Icons.Settings /></div>
                  <div>
                    <h3 style={styles.sectionTitle}>Service details</h3>
                    <p style={styles.sectionHint}>Tech strengths, clients and bench details.</p>
                  </div>
                </div>`;
                
  content = content.replace(oldServiceSectionRegex, pocSection + '\n\n' + newServiceSection);
  
  fs.writeFileSync(filePath, content);
  console.log('Successfully patched ' + filePath);
}

patchFile('src/pages/emplyee_portal/AddVendor.jsx');
patchFile('src/pages/sub_admin/subadminAddVendor.jsx');
