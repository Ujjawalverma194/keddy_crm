const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const { VendorPOC: VendorPOCModel } = require('./sequelize/init');

module.exports = createSequelizeRepository(VendorPOCModel);
