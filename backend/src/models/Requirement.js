const { wrapModel } = require('../utils/modelWrapper');
const {
  Requirement: RequirementModel,
  RequirementIDCounter,
  generateRequirementId,
} = require('./sequelize/init');

module.exports = {
  Requirement: wrapModel(RequirementModel),
  RequirementIDCounter,
  generateRequirementId,
};
