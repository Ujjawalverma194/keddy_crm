
const fs = require('fs');
let content = fs.readFileSync('src/pages/emplyee_portal/AddVendor.jsx', 'utf8');

content = content.replace(/Add Vendor/g, 'Add Client');
content = content.replace(/AddVendor/g, 'AddClient');
content = content.replace(/\/vendors\//g, '/clients/');
content = content.replace(/vendor/g, 'client');
content = content.replace(/Vendor/g, 'Client');

fs.writeFileSync('src/pages/emplyee_portal/AddClient.temp.jsx', content);
console.log('done');

