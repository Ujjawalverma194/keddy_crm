const { wrapModel } = require('../utils/modelWrapper');
const { TimeSheet: TimeSheetModel, VendorInvoice: VendorInvoiceModel } = require('./sequelize/init');

module.exports = {
  TimeSheet: wrapModel(TimeSheetModel),
  VendorInvoice: wrapModel(VendorInvoiceModel),
};
