const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const {
  CompanySettings: SettingsModel,
  Attendance: AttendanceModel,
  DailyWorkReport: ReportModel,
} = require('./sequelize/init');

module.exports = {
  CompanySettings: createSequelizeRepository(SettingsModel),
  Attendance: createSequelizeRepository(AttendanceModel),
  DailyWorkReport: createSequelizeRepository(ReportModel),
};
