const { wrapModel } = require('../utils/modelWrapper');
const { Candidate: CandidateModel } = require('./sequelize/init');

module.exports = wrapModel(CandidateModel);
