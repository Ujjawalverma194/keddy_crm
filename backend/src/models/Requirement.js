const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const {
  Requirement: RequirementModel,
  RequirementIDCounter,
  generateRequirementId,
} = require('./sequelize/init');

module.exports = {
  Requirement: createSequelizeRepository(RequirementModel),
  RequirementIDCounter,
  generateRequirementId,
};
