const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const { TimeSheet: TimeSheetModel, VendorInvoice: VendorInvoiceModel } = require('./sequelize/init');

module.exports = {
  TimeSheet: createSequelizeRepository(TimeSheetModel),
  VendorInvoice: createSequelizeRepository(VendorInvoiceModel),
};
