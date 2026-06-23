const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const { Vendor: VendorModel } = require('./sequelize/init');

module.exports = createSequelizeRepository(VendorModel);
