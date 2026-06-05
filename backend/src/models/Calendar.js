const { wrapModel } = require('../utils/modelWrapper');
const {
  GoogleCalendarAccount: GoogleCalendarAccountModel,
  CandidateCalendarEvent: CandidateCalendarEventModel,
  CandidateCalendarEventHistory: CandidateCalendarEventHistoryModel,
} = require('./sequelize/init');

module.exports = {
  GoogleCalendarAccount: wrapModel(GoogleCalendarAccountModel),
  CandidateCalendarEvent: wrapModel(CandidateCalendarEventModel),
  CandidateCalendarEventHistory: wrapModel(CandidateCalendarEventHistoryModel),
};
