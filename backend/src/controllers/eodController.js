const EodReport = require('../models/EodReport');
const { resolveCompanyId } = require('../utils/company');

async function createEod(req, res) {
  try {
    const { date, reportingTime, tasksCompleted, issuesFaced, resolutionSteps, logoutTime } = req.body;
    const companyId = resolveCompanyId(req.user) || req.user.id;

    const eod = await EodReport.model.create({
      userId: req.user.id,
      date,
      reportingTime,
      tasksCompleted,
      issuesFaced,
      resolutionSteps,
      logoutTime,
      companyId,
    });

    return res.status(201).json(eod);
  } catch (error) {
    console.error('Error creating EOD:', error);
    return res.status(500).json({ detail: 'Failed to create EOD report' });
  }
}

async function updateEod(req, res) {
  try {
    const { id } = req.params;
    const { reportingTime, tasksCompleted, issuesFaced, resolutionSteps, logoutTime } = req.body;

    const eod = await EodReport.findOne({ id, userId: req.user.id });
    if (!eod) {
      return res.status(404).json({ detail: 'EOD report not found' });
    }

    await eod.update({
      reportingTime,
      tasksCompleted,
      issuesFaced,
      resolutionSteps,
      logoutTime,
    });

    return res.json(eod);
  } catch (error) {
    console.error('Error updating EOD:', error);
    return res.status(500).json({ detail: 'Failed to update EOD report' });
  }
}

async function getMyEods(req, res) {
  try {
    const eods = await EodReport.model.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']],
    });
    return res.json({ results: eods });
  } catch (error) {
    console.error('Error fetching EODs:', error);
    return res.status(500).json({ detail: 'Failed to fetch EOD reports' });
  }
}

async function getEod(req, res) {
  try {
    const { id } = req.params;
    const eod = await EodReport.findOne({ id, userId: req.user.id });
    if (!eod) {
      return res.status(404).json({ detail: 'EOD report not found' });
    }
    return res.json(eod);
  } catch (error) {
    console.error('Error fetching EOD:', error);
    return res.status(500).json({ detail: 'Failed to fetch EOD report' });
  }
}

async function getEmployeeEodsByAdmin(req, res) {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const whereClause = { userId: employeeId };
    
    if (startDate && endDate) {
      whereClause.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Since we are using standard sequelize model, let's just use the raw model
    const { Op } = require('sequelize');
    if (startDate && endDate) {
        whereClause.date = {
            [Op.gte]: startDate,
            [Op.lte]: endDate
        }
    }

    const eods = await EodReport.model.findAll({
      where: whereClause,
      order: [['date', 'DESC']],
    });
    return res.json({ results: eods });
  } catch (error) {
    console.error('Error fetching employee EODs:', error);
    return res.status(500).json({ detail: 'Failed to fetch EOD reports' });
  }
}

module.exports = {
  createEod,
  updateEod,
  getEod,
  getMyEods,
  getEmployeeEodsByAdmin,
};
