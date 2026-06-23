const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const {
  CandidateStatusHistory: StatusModel,
  CandidateRemarkHistory: RemarkModel,
} = require('./sequelize/init');

module.exports = {
  CandidateStatusHistory: createSequelizeRepository(StatusModel),
  CandidateRemarkHistory: createSequelizeRepository(RemarkModel),
};
