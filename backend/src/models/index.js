module.exports = {
  User: require('./User'),
  Vendor: require('./Vendor'),
  Client: require('./Client'),
  Candidate: require('./Candidate'),
  ...require('./CandidateHistory'),
  ...require('./Requirement'),
  ...require('./JdMapping'),
  ...require('./Documents'),
  ...require('./Invoice'),
  ...require('./Attendance'),
};
