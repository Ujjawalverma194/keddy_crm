const config = require('../config');

function mediaUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('/media/')) return normalized;
  return `${config.mediaUrl}${normalized.replace(/^\/+/, '')}`;
}

function userBrief(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    role: user.role,
    profile_picture: mediaUrl(user.profilePicture),
  };
}

module.exports = { mediaUrl, userBrief };
