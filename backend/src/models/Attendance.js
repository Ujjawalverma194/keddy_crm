const { wrapModel } = require('../utils/modelWrapper');
const {
  CompanySettings: SettingsModel,
  Attendance: AttendanceModel,
  DailyWorkReport: ReportModel,
} = require('./sequelize/init');

module.exports = {
  CompanySettings: wrapModel(SettingsModel),
  Attendance: wrapModel(AttendanceModel),
  DailyWorkReport: wrapModel(ReportModel),
};
