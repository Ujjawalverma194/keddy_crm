const { wrapModel } = require('../utils/modelWrapper');
const {
  RequirementAssignment: AssignmentModel,
  CandidateJDSubmission: SubmissionModel,
} = require('./sequelize/init');

module.exports = {
  RequirementAssignment: wrapModel(AssignmentModel),
  CandidateJDSubmission: wrapModel(SubmissionModel),
};
