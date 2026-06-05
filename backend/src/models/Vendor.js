const { wrapModel } = require('../utils/modelWrapper');
const { Vendor: VendorModel } = require('./sequelize/init');

module.exports = wrapModel(VendorModel);
