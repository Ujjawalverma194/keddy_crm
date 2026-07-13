const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const { Target: TargetModel } = require('./sequelize/init');

const Target = createSequelizeRepository(TargetModel);

module.exports = Target;
