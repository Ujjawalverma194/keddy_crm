const { wrapModel } = require('../utils/modelWrapper');
const {
  CandidateStatusHistory: StatusModel,
  CandidateRemarkHistory: RemarkModel,
} = require('./sequelize/init');

module.exports = {
  CandidateStatusHistory: wrapModel(StatusModel),
  CandidateRemarkHistory: wrapModel(RemarkModel),
};
