const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function createUploader(subfolder) {
  const dest = path.join(config.mediaRoot, subfolder);
  ensureDir(dest);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

  return multer({ storage });
}

const uploadResume = createUploader('candidates/resumes');
const uploadProfile = createUploader('profile_pics');
const uploadVendor = createUploader('vendors');
const uploadClient = createUploader('clients');
const uploadTimesheet = createUploader('candidates/timesheets');
const uploadVendorInvoice = createUploader('candidates/vendor_invoices');
const uploadInvoice = createUploader('invoices');
const uploadAny = createUploader('uploads');

function relPath(absolutePath) {
  if (!absolutePath) return null;
  const rel = path.relative(config.mediaRoot, absolutePath).replace(/\\/g, '/');
  return rel;
}

module.exports = {
  uploadResume,
  uploadProfile,
  uploadVendor,
  uploadClient,
  uploadTimesheet,
  uploadVendorInvoice,
  uploadInvoice,
  uploadAny,
  relPath,
};
