const Target = require('../models/Target');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const { getCompanyUserIds, resolveCompanyId } = require('../utils/company');
const { Op } = require('sequelize');

const PIPELINE_STATUSES = ['INTERNAL SCREENING', 'CLIENT SCREENING', 'L1', 'L2', 'L3', 'OTHER'];

async function calculateTargetProgress(target) {
  const start = new Date(target.startDate);
  start.setHours(0, 0, 0, 0);
  
  let end = new Date(start);
  if (target.endDate) {
    end = new Date(target.endDate);
    end.setHours(23, 59, 59, 999);
  } else if (target.targetDuration === 'DAILY') {
    end.setHours(23, 59, 59, 999);
  } else if (target.targetDuration === 'WEEKLY') {
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);
  } else if (target.targetDuration === 'MONTHLY') {
    end.setMonth(end.getMonth() + 1);
    end.setHours(23, 59, 59, 999);
  }

  const userId = target.userId;

  const [profileSourcing, submissions, interviews] = await Promise.all([
    Candidate.countDocuments({
      createdById: userId,
      isDeleted: false,
      createdAt: { $gte: start, $lte: end },
    }),
    Candidate.countDocuments({
      isDeleted: false,
      verificationStatus: true,
      clientId: { $ne: null },
      createdAt: { $gte: start, $lte: end },
      $or: [{ createdById: userId }, { submittedToId: userId }],
    }),
    Candidate.countDocuments({
      isDeleted: false,
      verificationStatus: true,
      mainStatus: { $in: ['L1', 'L2', 'L3'] }, // Using L1/L2/L3 as Interview representation
      createdAt: { $gte: start, $lte: end },
      $or: [{ createdById: userId }, { submittedToId: userId }],
    })
  ]);

  let avgWeeklySubmissions = 0;
  if (target.targetDuration === 'MONTHLY') {
    const timeDiff = end.getTime() - start.getTime();
    const weeks = timeDiff / (1000 * 3600 * 24 * 7);
    if (weeks > 0) {
      avgWeeklySubmissions = (submissions / weeks).toFixed(1);
    }
  } else if (target.targetDuration === 'WEEKLY') {
    avgWeeklySubmissions = submissions;
  } else {
    avgWeeklySubmissions = submissions; 
  }

  let status = target.status;
  
  let isCompleted = true;
  if (target.profilesSourcingTarget > 0 && profileSourcing < target.profilesSourcingTarget) isCompleted = false;
  if (target.totalSubmissionTarget > 0 && submissions < target.totalSubmissionTarget) isCompleted = false;
  if (target.interviewTarget > 0 && interviews < target.interviewTarget) isCompleted = false;
  if (target.avgWeeklySubmissionsTarget > 0 && avgWeeklySubmissions < target.avgWeeklySubmissionsTarget) isCompleted = false;

  if (target.status === 'ACTIVE' && isCompleted) {
    status = 'COMPLETED';
  } else if (target.status === 'ACTIVE' && end < new Date() && !isCompleted) {
    status = 'BEHIND';
  }

  return {
    ...target.toJSON(),
    progress: {
      profileSourcing,
      submissions,
      interviews,
      avgWeeklySubmissions: parseFloat(avgWeeklySubmissions)
    },
    calculatedStatus: status
  };
}

async function assignTarget(req, res) {
  try {
    const { userId, targetDuration, profilesSourcingTarget, totalSubmissionTarget, interviewTarget, avgWeeklySubmissionsTarget, startDate, endDate, notes } = req.body;
    const companyId = resolveCompanyId(req.user) || req.user.id;

    if (!userId) {
      return res.status(400).json({ detail: "User ID is required." });
    }

    // Only allow Admin or TL to assign targets to their own team
    const employee = await User.findById(userId);
    if (!employee) {
      return res.status(404).json({ detail: "Employee not found." });
    }

    if (req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader) {
      if (employee.teamLeaderId !== req.user.id) {
        return res.status(403).json({ detail: "Cannot assign target to an employee not in your team." });
      }
    }

    // Deactivate existing target of same duration
    const { Target: TargetModel } = require('../models/sequelize/init');
    await TargetModel.update(
      { isActive: false, status: 'ARCHIVED' },
      { where: { userId, targetDuration, isActive: true, isDeleted: false } }
    );

    const target = await Target.create({
      userId,
      assignedById: req.user.id,
      companyId,
      targetDuration,
      profilesSourcingTarget: (profilesSourcingTarget === "" || profilesSourcingTarget === null || profilesSourcingTarget === undefined) ? null : Number(profilesSourcingTarget),
      totalSubmissionTarget: (totalSubmissionTarget === "" || totalSubmissionTarget === null || totalSubmissionTarget === undefined) ? null : Number(totalSubmissionTarget),
      interviewTarget: (interviewTarget === "" || interviewTarget === null || interviewTarget === undefined) ? null : Number(interviewTarget),
      avgWeeklySubmissionsTarget: (avgWeeklySubmissionsTarget === "" || avgWeeklySubmissionsTarget === null || avgWeeklySubmissionsTarget === undefined) ? null : Number(avgWeeklySubmissionsTarget),
      startDate: startDate || new Date(),
      endDate,
      notes,
      isActive: true,
      status: 'ACTIVE'
    });

    res.status(201).json(target);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Failed to assign target." });
  }
}

async function updateTarget(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const target = await Target.findById(id);
    if (!target || target.isDeleted) {
      return res.status(404).json({ detail: "Target not found." });
    }

    const employee = await User.findById(target.userId);
    if (req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader) {
      if (employee.teamLeaderId !== req.user.id) {
        return res.status(403).json({ detail: "Permission denied." });
      }
    }

    await Target.update(id, updateData);
    const updatedTarget = await Target.findById(id);
    res.json(updatedTarget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Failed to update target." });
  }
}

async function deleteTarget(req, res) {
  try {
    const { id } = req.params;
    
    const target = await Target.findById(id);
    if (!target || target.isDeleted) {
      return res.status(404).json({ detail: "Target not found." });
    }

    const employee = await User.findById(target.userId);
    if (req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader) {
      if (employee.teamLeaderId !== req.user.id) {
        return res.status(403).json({ detail: "Permission denied." });
      }
    }

    await Target.update(id, { isDeleted: true, isActive: false });
    res.json({ detail: "Target deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Failed to delete target." });
  }
}

async function autoExpireTargets(targets, TargetModel) {
  const now = new Date();
  const activeTargets = [];
  
  for (const target of targets) {
    const start = new Date(target.startDate);
    start.setHours(0, 0, 0, 0);
    
    let end = new Date(start);
    if (target.endDate) {
      end = new Date(target.endDate);
      end.setHours(23, 59, 59, 999);
    } else if (target.targetDuration === 'DAILY') {
      end.setHours(23, 59, 59, 999);
    } else if (target.targetDuration === 'WEEKLY') {
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);
    } else if (target.targetDuration === 'MONTHLY') {
      end.setMonth(end.getMonth() + 1);
      end.setHours(23, 59, 59, 999);
    }

    if (now > end) {
      await TargetModel.update(
        { isActive: false, status: 'EXPIRED' },
        { where: { id: target.id } }
      );
    } else {
      activeTargets.push(target);
    }
  }
  return activeTargets;
}

async function getMyTargets(req, res) {
  try {
    const userId = req.user.id;
    const { Target: TargetModel } = require('../models/sequelize/init');
    let targets = await TargetModel.findAll({
      where: { userId, isActive: true, isDeleted: false },
      order: [['createdAt', 'DESC']]
    });
    
    targets = await autoExpireTargets(targets, TargetModel);

    const targetsWithProgress = await Promise.all(targets.map(calculateTargetProgress));
    res.json(targetsWithProgress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Failed to fetch targets." });
  }
}

async function getTeamTargets(req, res) {
  try {
    let userIds = [];
    if (req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader) {
      const users = await User.find({ teamLeaderId: req.user.id, isDeleted: false });
      userIds = users.map(u => u.id);
    } else {
      const companyId = resolveCompanyId(req.user) || req.user.id;
      const users = await User.find({ parentUserId: companyId, isDeleted: false });
      userIds = users.map(u => u.id);
    }

    const { Target: TargetModel } = require('../models/sequelize/init');
    let targets = await TargetModel.findAll({
      where: { userId: { [Op.in]: userIds }, isActive: true, isDeleted: false },
      include: [
        { model: User.model, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture'] }
      ]
    });

    targets = await autoExpireTargets(targets, TargetModel);

    const targetsWithProgress = await Promise.all(targets.map(calculateTargetProgress));
    res.json(targetsWithProgress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Failed to fetch team targets." });
  }
}

async function getTargetHistory(req, res) {
  try {
    const { userId } = req.query;
    const { Target: TargetModel } = require('../models/sequelize/init');
    
    let queryWhere = { isDeleted: false };
    const isTLMode = req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader;
    const isImpersonatingTL = req.headers['x-impersonate-tl'] && req.user.role === 'SUB_ADMIN';

    if (req.user.role === 'EMPLOYEE' && !isTLMode) {
      queryWhere.userId = req.user.id;
    } else {
      if (userId) {
        // verify permission to view this user
        const employee = await User.findById(userId);
        
        if (isTLMode) {
          if (employee.teamLeaderId != req.user.id) {
            return res.status(403).json({ detail: "Permission denied." });
          }
        }
        
        if (isImpersonatingTL) {
          const tlId = parseInt(req.headers['x-impersonate-tl'], 10);
          if (employee.teamLeaderId != tlId && employee.id != tlId) {
            return res.status(403).json({ detail: "Permission denied." });
          }
        }
        
        queryWhere.userId = userId;
      } else {
        // list all for admin/tl
        if (isTLMode) {
          const users = await User.find({ teamLeaderId: req.user.id, isDeleted: false });
          queryWhere.userId = { [Op.in]: users.map(u => u.id) };
        } else if (isImpersonatingTL) {
          const tlId = parseInt(req.headers['x-impersonate-tl'], 10);
          const users = await User.find({ teamLeaderId: tlId, isDeleted: false });
          queryWhere.userId = { [Op.in]: users.map(u => u.id) };
        } else {
          const companyId = resolveCompanyId(req.user) || req.user.id;
          queryWhere.companyId = companyId;
        }
      }
    }

    const targets = await TargetModel.findAll({
      where: queryWhere,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User.model, as: 'employee', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    const targetsWithProgress = await Promise.all(targets.map(calculateTargetProgress));
    res.json(targetsWithProgress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Failed to fetch target history." });
  }
}

module.exports = {
  assignTarget,
  updateTarget,
  deleteTarget,
  getMyTargets,
  getTeamTargets,
  getTargetHistory
};
