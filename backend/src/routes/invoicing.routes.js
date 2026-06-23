const express = require('express');
const { authenticate, requireRoles } = require('../middleware/auth');
const { uploadInvoice } = require('../middleware/upload');
const ctrl = require('../controllers/invoicingController');

const router = express.Router();
router.use(authenticate);

const financeRoles = requireRoles('SUB_ADMIN', 'ACCOUNTANT');

router.post('/api/create/', financeRoles, ctrl.create);
router.get('/api/all/', financeRoles, ctrl.listAll);
router.get('/api/invoices/:pk/', financeRoles, ctrl.retrieve);
router.patch('/api/invoices/:pk/update/', financeRoles, ctrl.updateInvoice);
router.put('/api/update/:id/', financeRoles, ctrl.updateInvoice);
router.put('/api/status/:id/', financeRoles, ctrl.updateStatus);
router.patch('/api/status/:id/', financeRoles, ctrl.updateStatus);
router.patch('/api/invoices/:id/status/', financeRoles, ctrl.updateStatus);
router.delete('/api/invoices/:id/soft-delete/', financeRoles, ctrl.softDelete);
router.delete('/api/invoices/:id/hard-delete/', financeRoles, ctrl.hardDelete);
router.post('/api/generate-pdf/:id/', financeRoles, ctrl.generatePdf);
router.get('/api/preview/:id/', financeRoles, ctrl.preview);
router.get('/api/candidate/:candidate_id/invoices/', financeRoles, ctrl.candidateInvoiceHistory);

router.get('/api/settings/', financeRoles, ctrl.financeSettingsGet);
router.put('/api/settings/', financeRoles, uploadInvoice.any(), ctrl.financeSettingsPut);

router.get('/api/bank-accounts/', financeRoles, ctrl.listBankAccounts);
router.post('/api/bank-accounts/', financeRoles, ctrl.createBankAccount);
router.get('/api/payments/', financeRoles, ctrl.listPayments);
router.post('/api/payments/', financeRoles, ctrl.createPayment);

router.get('/api/dashboard/all/', financeRoles, ctrl.financeDashboard);
router.get('/api/finance/dashboard/', financeRoles, ctrl.financeDashboard);

router.get('/api/clients/', financeRoles, ctrl.listFinanceClients);
router.post('/api/clients/', financeRoles, ctrl.createFinanceClient);
router.get('/api/clients/:client_id/', financeRoles, ctrl.financeClientDetail);
router.get('/api/clients/:id/', financeRoles, ctrl.financeClientDetail);
router.patch('/api/clients/:client_id/', financeRoles, ctrl.updateFinanceClient);
router.put('/api/clients/:client_id/', financeRoles, ctrl.updateFinanceClient);
router.get('/api/clients/:client_id/candidates/', financeRoles, ctrl.clientCandidates);

module.exports = router;
