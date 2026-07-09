const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const { EodReport: EodReportModel } = require('./sequelize/init');

module.exports = createSequelizeRepository(EodReportModel);
