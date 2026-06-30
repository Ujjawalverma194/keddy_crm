const User = require('../models/User');

function getCompanyRoot(user) {
  if (!user) return null;
  if (user.role === 'SUB_ADMIN' || user.role === 'CENTRAL_ADMIN') return user;
  if ((user.role === 'EMPLOYEE' || user.role === 'ACCOUNTANT') && user.parentUserId) {
    return { id: user.parentUserId };
  }
  return null;
}

async function getCompanyUserIds(user, req) {
  if (req && req.headers['x-team-leader-mode'] === 'true' && user.isTeamLeader) {
    const employees = await User.find({
      $or: [{ id: user.id }, { teamLeaderId: user.id }],
      isActive: { $ne: false },
    }).select('id');
    return employees.map((u) => u.id);
  }

  const root = getCompanyRoot(user);
  if (!root) return [];

  const rootId = root.id || user.id;
  const employees = await User.find({
    $or: [{ id: rootId }, { parentUserId: rootId }],
    isActive: { $ne: false },
  }).select('id');

  return employees.map((u) => u.id);
}

function resolveCompanyId(user) {
  if (user.role === 'SUB_ADMIN') return user.id;
  if (user.role === 'EMPLOYEE' || user.role === 'ACCOUNTANT') return user.parentUserId;
  return null;
}

module.exports = { getCompanyRoot, getCompanyUserIds, resolveCompanyId };
