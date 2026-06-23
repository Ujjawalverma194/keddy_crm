const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const { Candidate: CandidateModel } = require('./sequelize/init');

module.exports = createSequelizeRepository(CandidateModel);
