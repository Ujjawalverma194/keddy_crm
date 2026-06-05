const { Attendance, DailyWorkReport, CompanySettings } = require('../models/Attendance');
const User = require('../models/User');
const { resolveCompanyId } = require('../utils/company');
const { drfPaginate, drfResponse } = require('../utils/pagination');
const {
  buildEmployeeFilter,
  employeeToDropdownJSON,
  attendanceStatusDisplay,
} = require('../utils/employeeQuery');
const { mediaUrl } = require('../utils/serialize');
const {
  buildTodayMetrics,
  buildMonthlyPerformance,
  buildOverallStats,
} = require('../services/attendanceMetrics');

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function ensureCompanySettings(companyId) {
  let s = await CompanySettings.findOne({ companyId });
  if (!s) {
    s = await CompanySettings.create({ companyId });
  }
  return s;
}

async function checkIn(req, res) {
  const companyId = resolveCompanyId(req.user);
  const date = todayDate();
  let record = await Attendance.findOne({ userId: req.user.id, date });
  if (record?.checkIn) {
    return res.status(400).json({ success: false, message: 'Already checked in' });
  }
  const now = new Date();
  if (!record) {
    record = await Attendance.create({
      userId: req.user.id,
      companyId,
      date,
      checkIn: now,
      status: 'ON_TIME',
    });
  } else {
    record.checkIn = now;
    record.status = 'ON_TIME';
    await record.save();
  }
  return res.json({ success: true, data: record });
}

async function checkOut(req, res) {
  const date = todayDate();
  const record = await Attendance.findOne({ userId: req.user.id, date });
  if (!record?.checkIn) {
    return res.status(400).json({ success: false, message: 'Check in first' });
  }
  record.checkOut = new Date();
  await record.save();
  return res.json({ success: true, data: record });
}

async function dailyReport(req, res) {
  const companyId = resolveCompanyId(req.user);
  const date = todayDate();
  const { work_done, challenges, plan_for_tomorrow } = req.body;
  const report = await DailyWorkReport.findOneAndUpdate(
    { userId: req.user.id, date },
    { workDone: work_done, challenges, planForTomorrow: plan_for_tomorrow, companyId },
    { upsert: true, new: true }
  );
  return res.json({ success: true, data: report });
}

async function myToday(req, res) {
  try {
    const companyId = resolveCompanyId(req.user) || req.user.parentUserId || req.user.id;
    const today = await buildTodayMetrics(req.user.id, companyId);
    const date = todayDate();
    const report = await DailyWorkReport.findOne({ userId: req.user.id, date });
    return res.json({
      success: true,
      attendance: today.attendance,
      report: report
        ? {
            work_done: report.workDone,
            challenges: report.challenges,
            plan_for_tomorrow: report.planForTomorrow,
          }
        : null,
      performance: {
        ...today.performance,
        monthly_sourced: 0,
        monthly_submitted: 0,
        is_top_performer: false,
      },
      target: today.target,
      report_submitted: today.report_submitted,
      suggestions: [],
    });
  } catch (err) {
    console.error('myToday error:', err);
    return res.status(500).json({ success: false, detail: 'Failed to load today data' });
  }
}

async function myMonthly(req, res) {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const [y, m] = month.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  const { page, pageSize, skip, limit } = drfPaginate(req.query);

  const records = await Attendance.find({
    userId: req.user.id,
    date: { $gte: start, $lt: end },
  })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Attendance.countDocuments({
    userId: req.user.id,
    date: { $gte: start, $lt: end },
  });

  return res.json({
    success: true,
    data: {
      daily_data: records,
      pagination: {
        total_items: total,
        total_pages: Math.ceil(total / pageSize) || 1,
        current_page: page,
      },
    },
  });
}

async function attendanceBoard(req, res) {
  const companyId = resolveCompanyId(req.user);
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const date = todayDate();
  const filter = { companyId, date };
  const [items, total] = await Promise.all([
    Attendance.find(filter).skip(skip).limit(limit),
    Attendance.countDocuments(filter),
  ]);
  return res.json({
    success: true,
    results: items,
    pagination: { total_items: total, current_page: page },
  });
}

async function adminUserDetail(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await User.findOne({ id: userId, isDeleted: false });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const companyId = user.parentUserId || resolveCompanyId(req.user) || req.user.id;

    const [today, monthly_performance, overall_stats] = await Promise.all([
      buildTodayMetrics(userId, companyId),
      buildMonthlyPerformance(userId),
      buildOverallStats(userId),
    ]);

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          number: user.number || '',
          role: user.role,
          is_active: user.isActive !== false,
          profile_picture: user.profilePicture ? mediaUrl(user.profilePicture) : null,
          date_joined: user.createdAt,
          last_attendance_date: user.lastAttendanceDate
            ? new Date(user.lastAttendanceDate).toLocaleDateString('en-GB')
            : null,
        },
        today,
        monthly_performance,
        overall_stats,
        leaves: { pending: 0, approved: 0 },
        points: {
          total_points: user.totalPoints ?? 0,
          points_this_month: user.totalPoints ?? 0,
          attendance_streak: user.attendanceStreak ?? 0,
          late_warning_count: user.lateWarningCount ?? 0,
        },
      },
    });
  } catch (err) {
    console.error('adminUserDetail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load user details' });
  }
}

function formatAttendanceTime(dt) {
  if (!dt) return null;
  return new Date(dt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function sameCalendarDay(a, b) {
  if (!a || !b) return false;
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

async function adminReports(req, res) {
  try {
    const companyId = resolveCompanyId(req.user) || req.user.id;
    const { page, pageSize } = drfPaginate(req.query);
    const user_id = req.query.user_id;
    const date = req.query.date;
    const from_date = req.query.from_date;
    const to_date = req.query.to_date;
    const search = (req.query.search || '').trim().toLowerCase();

    let employeeFilter = buildEmployeeFilter(companyId, '');
    if (user_id) {
      employeeFilter = {
        parentUserId: companyId,
        role: 'EMPLOYEE',
        isDeleted: false,
        id: parseInt(user_id, 10),
      };
    }

    const companyUsers = await User.find(employeeFilter);
    const userIds = companyUsers.map((u) => u.id);
    const userMap = new Map(companyUsers.map((u) => [Number(u.id), u]));

    const employeesPayload = companyUsers.map(employeeToDropdownJSON);

    if (!userIds.length) {
      return res.json({
        success: true,
        data: {
          reports: [],
          employees: employeesPayload,
          pagination: {
            total_pages: 0,
            current_page: page,
            total_items: 0,
            page_size: pageSize,
            has_next: false,
            has_previous: false,
          },
        },
      });
    }

    const attFilter = { companyId, userId: { $in: userIds } };
    if (date) {
      const d = new Date(date);
      const e = new Date(d);
      e.setDate(e.getDate() + 1);
      attFilter.date = { $gte: d, $lt: e };
    } else {
      if (from_date) {
        attFilter.date = attFilter.date || {};
        attFilter.date.$gte = new Date(from_date);
      }
      if (to_date) {
        attFilter.date = attFilter.date || {};
        const end = new Date(to_date);
        end.setDate(end.getDate() + 1);
        attFilter.date.$lt = end;
      }
    }

    const [attendances, allReports] = await Promise.all([
      Attendance.find(attFilter),
      DailyWorkReport.find({ companyId, userId: { $in: userIds } }),
    ]);

    const reportByUserDate = new Map();
    for (const r of allReports) {
      const key = `${r.userId}:${new Date(r.date).toISOString().slice(0, 10)}`;
      reportByUserDate.set(key, r);
    }

    const reports = [];

    for (const attendance of attendances) {
      const user = userMap.get(Number(attendance.userId));
      if (!user) continue;

      const dateKey = `${attendance.userId}:${new Date(attendance.date).toISOString().slice(0, 10)}`;
      const report = reportByUserDate.get(dateKey) || null;

      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const checkInTime = formatAttendanceTime(attendance.checkIn);
      const checkOutTime = formatAttendanceTime(attendance.checkOut);
      const workDone = report?.workDone || null;
      const challenges = report?.challenges || null;
      const planForTomorrow = report?.planForTomorrow || null;
      const statusDisplay = attendanceStatusDisplay(attendance.status);

      if (search) {
        const haystack = [
          userName,
          user.email,
          workDone,
          challenges,
          planForTomorrow,
          checkInTime,
          checkOutTime,
          attendance.status,
          statusDisplay,
          attendance.workFrom,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) continue;
      }

      reports.push({
        id: report?.id ?? null,
        user: user.id,
        user_name: userName,
        user_email: user.email,
        date: attendance.date,
        work_done: workDone,
        challenges,
        plan_for_tomorrow: planForTomorrow,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        attendance_status: attendance.status,
        attendance_status_display: statusDisplay,
        report_submitted: !!report,
        work_from: attendance.workFrom,
        location: attendance.location,
        created_at: report?.createdAt || attendance.createdAt,
        updated_at: report?.updatedAt || attendance.updatedAt,
      });
    }

    reports.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total_items = reports.length;
    const total_pages = Math.ceil(total_items / pageSize) || 1;
    const skip = (page - 1) * pageSize;
    const paged = reports.slice(skip, skip + pageSize);

    return res.json({
      success: true,
      data: {
        reports: paged,
        employees: employeesPayload,
        pagination: {
          total_pages,
          current_page: page,
          total_items,
          page_size: pageSize,
          has_next: page < total_pages,
          has_previous: page > 1,
        },
      },
    });
  } catch (err) {
    console.error('adminReports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load reports' });
  }
}

async function adminUsers(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const search = (req.query.search || '').trim();
  const users = await User.find(buildEmployeeFilter(companyId, search)).sort({ createdAt: -1 });
  return res.json(
    users.map((u) => ({
      ...employeeToDropdownJSON(u),
      number: u.number,
      role: u.role,
      is_active: u.isActive !== false,
      date_joined: u.createdAt,
    }))
  );
}

async function adminAttendanceList(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const filter = { companyId };
  const { user_id, date, month, from_date, to_date, status } = req.query;

  if (user_id) filter.userId = parseInt(user_id, 10);
  if (status) filter.status = status;
  if (date) {
    const d = new Date(date);
    const e = new Date(d);
    e.setDate(e.getDate() + 1);
    filter.date = { $gte: d, $lt: e };
  } else if (month) {
    const [y, m] = String(month).split('-').map(Number);
    if (y && m) filter.date = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
  } else if (from_date || to_date) {
    filter.date = {};
    if (from_date) filter.date.$gte = new Date(from_date);
    if (to_date) {
      const end = new Date(to_date);
      end.setDate(end.getDate() + 1);
      filter.date.$lt = end;
    }
  }

  const [items, total] = await Promise.all([
    Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    Attendance.countDocuments(filter),
  ]);

  const users = await User.find({ id: { $in: items.map((i) => i.userId) } });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const results = items.map((a) => {
    const u = userMap.get(a.userId);
    return {
      id: a.id,
      user: u
        ? {
            id: u.id,
            first_name: u.firstName,
            last_name: u.lastName,
            full_name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
            email: u.email,
          }
        : null,
      date: a.date,
      check_in: a.checkIn,
      check_out: a.checkOut,
      status: a.status,
      work_from: a.workFrom,
      late_reason: a.lateReason,
      location: a.location,
    };
  });

  return res.json(drfResponse(results, total, page, pageSize));
}

async function adminAttendanceDetail(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const id = parseInt(req.params.id, 10);
  const attendance = await Attendance.findOne({ id, companyId });
  if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found' });

  const user = await User.findOne({ id: attendance.userId });
  return res.json({
    id: attendance.id,
    user: user
      ? {
          id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
        }
      : null,
    date: attendance.date,
    check_in: attendance.checkIn,
    check_out: attendance.checkOut,
    status: attendance.status,
    work_from: attendance.workFrom,
    late_reason: attendance.lateReason,
    location: attendance.location,
    created_at: attendance.createdAt,
    updated_at: attendance.updatedAt,
  });
}

async function adminAttendanceUpdate(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const id = parseInt(req.params.id, 10);
  const attendance = await Attendance.findOne({ id, companyId });
  if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found' });

  const b = req.body || {};
  if (b.check_in !== undefined) attendance.checkIn = b.check_in ? new Date(b.check_in) : null;
  if (b.check_out !== undefined) attendance.checkOut = b.check_out ? new Date(b.check_out) : null;
  if (b.status !== undefined) attendance.status = b.status;
  if (b.work_from !== undefined) attendance.workFrom = b.work_from;
  if (b.late_reason !== undefined) attendance.lateReason = b.late_reason;
  if (b.location !== undefined) attendance.location = b.location;
  await attendance.save();

  return res.json({ success: true, message: 'Attendance updated successfully' });
}

async function adminAttendanceDelete(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const id = parseInt(req.params.id, 10);
  const attendance = await Attendance.findOne({ id, companyId });
  if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found' });
  await Attendance.deleteOne({ id, companyId });
  return res.json({ success: true, message: 'Attendance record deleted successfully' });
}

async function adminReportDelete(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const id = parseInt(req.params.id, 10);
  const report = await DailyWorkReport.findOne({ id, companyId });
  if (!report) return res.status(404).json({ success: false, message: 'Daily report not found' });
  await DailyWorkReport.deleteOne({ id, companyId });
  return res.json({ success: true, message: 'Daily report deleted successfully' });
}

module.exports = {
  checkIn,
  checkOut,
  dailyReport,
  myToday,
  myMonthly,
  attendanceBoard,
  adminUsers,
  adminUserDetail,
  adminAttendanceList,
  adminAttendanceDetail,
  adminAttendanceUpdate,
  adminAttendanceDelete,
  adminReports,
  adminReportDelete,
};
