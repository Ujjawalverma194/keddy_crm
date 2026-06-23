const { differenceInHours } = require('date-fns');

function computeRequirementStatus(requirement) {
  if (
    requirement.manualStatus &&
    requirement.manualStatusUpdatedAt
  ) {
    const hoursSinceManual = differenceInHours(
      new Date(),
      new Date(requirement.manualStatusUpdatedAt)
    );
    if (hoursSinceManual < 24) return requirement.manualStatus;
  }

  const hoursSinceCreate = differenceInHours(new Date(), new Date(requirement.createdAt));
  if (hoursSinceCreate <= 4) return 'HOT';
  if (hoursSinceCreate <= 24) return 'WARM';
  return 'COLD';
}

module.exports = { computeRequirementStatus };
