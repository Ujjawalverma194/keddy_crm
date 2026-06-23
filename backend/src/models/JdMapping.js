const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const {
  RequirementAssignment: AssignmentModel,
  CandidateJDSubmission: SubmissionModel,
} = require('./sequelize/init');

module.exports = {
  RequirementAssignment: createSequelizeRepository(AssignmentModel),
  CandidateJDSubmission: createSequelizeRepository(SubmissionModel),
};
