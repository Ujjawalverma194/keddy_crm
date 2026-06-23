const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const {
  GoogleCalendarAccount: GoogleCalendarAccountModel,
  CandidateCalendarEvent: CandidateCalendarEventModel,
  CandidateCalendarEventHistory: CandidateCalendarEventHistoryModel,
} = require('./sequelize/init');

module.exports = {
  GoogleCalendarAccount: createSequelizeRepository(GoogleCalendarAccountModel),
  CandidateCalendarEvent: createSequelizeRepository(CandidateCalendarEventModel),
  CandidateCalendarEventHistory: createSequelizeRepository(CandidateCalendarEventHistoryModel),
};
