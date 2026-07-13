const { Op } = require('sequelize');
const vendors = require('d:/Downloads/keddy-crm 3/keddy-crm 3/backend/src/controllers/employeePortal/vendors');
const { Vendor, VendorPOC } = require('d:/Downloads/keddy-crm 3/keddy-crm 3/backend/src/models/sequelize/init');
const { vendorToJSON } = require('d:/Downloads/keddy-crm 3/keddy-crm 3/backend/src/utils/formatters');

async function run() {
  const req = {
    user: { id: 1 },
    body: {
      company_name: "Test Company XYZ",
      pocs: JSON.stringify([{ name: "Test POC", number: "1234567890", email: "test@test.com", isPrimary: true }])
    },
    files: {}
  };
  
  const res = {
    status: function(code) { console.log('STATUS:', code); return this; },
    json: function(data) { console.log('JSON:', data); return this; }
  };
  
  try {
    await vendors.create(req, res);
  } catch (e) {
    console.error('ERROR IN CREATE:', e);
  }
}
run();
