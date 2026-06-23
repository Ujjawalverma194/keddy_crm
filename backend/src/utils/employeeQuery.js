/** Build employee list filter — matches Django parent_user + role=EMPLOYEE + optional search. */
function buildEmployeeFilter(companyAdminId, search = '') {
  const base = {
    parentUserId: companyAdminId,
    role: 'EMPLOYEE',
    isDeleted: false,
  };

  const q = String(search || '').trim();
  if (!q) return base;

  const or = [
    { firstName: new RegExp(q, 'i') },
    { lastName: new RegExp(q, 'i') },
    { email: new RegExp(q, 'i') },
    { number: new RegExp(q, 'i') },
  ];

  const idNum = parseInt(q, 10);
  if (!Number.isNaN(idNum) && String(idNum) === q) {
    or.push({ id: idNum });
  }

  return {
    ...base,
    $and: [{ $or: or }],
  };
}

function employeeToDropdownJSON(u) {
  return {
    id: u.id,
    first_name: u.firstName,
    last_name: u.lastName,
    email: u.email,
    full_name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
  };
}

const ATTENDANCE_STATUS_LABELS = {
  ON_TIME: 'On Time',
  LATE: 'Late',
  ABSENT: 'Absent',
  HALF_DAY: 'Half Day',
};

function attendanceStatusDisplay(status) {
  return ATTENDANCE_STATUS_LABELS[status] || status || '—';
}

module.exports = {
  buildEmployeeFilter,
  employeeToDropdownJSON,
  attendanceStatusDisplay,
};
