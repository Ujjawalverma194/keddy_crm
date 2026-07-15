const { Op } = require('sequelize');
const { Candidate, CandidateStatusHistory } = require('../models/sequelize/init');

async function updateExpiredInterviews() {
  try {
    const scheduledStatuses = ["INTERNAL SCREENING", "CLIENT SCREENING", "L1", "L2", "L3", "OTHER"];
    
    const candidates = await Candidate.findAll({
      where: {
        mainStatus: { [Op.in]: scheduledStatuses },
        l1L2Date: { [Op.ne]: null },
        l1L2Time: { [Op.ne]: null },
        isDeleted: false
      }
    });

    const now = new Date();
    let updatedCount = 0;

    for (const cand of candidates) {
      // Ensure we have a string date
      let dateStr = cand.l1L2Date;
      if (cand.l1L2Date instanceof Date) {
        dateStr = cand.l1L2Date.toISOString().split('T')[0];
      }
      
      const timeStr = cand.l1L2Time.trim();
      const dateTimeStr = `${dateStr}T${timeStr}`;
      const scheduledDate = new Date(dateTimeStr);
      
      if (!isNaN(scheduledDate.getTime()) && scheduledDate < now) {
         const oldStatus = cand.mainStatus;
         cand.mainStatus = 'FEEDBACK PENDING';
         await cand.save();
         
         // Optional: Add to status history if required
         await CandidateStatusHistory.create({
            candidateId: cand.id,
            oldStatus,
            newStatus: 'FEEDBACK PENDING',
            changedById: null // system
         });

         updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
       console.log(`[Cron] Updated ${updatedCount} expired scheduled interviews to FEEDBACK PENDING.`);
    }

  } catch (error) {
    console.error('[Cron] Error updating expired interviews:', error);
  }
}

function startStatusUpdater() {
  // Run every 15 minutes (900,000 ms)
  setInterval(updateExpiredInterviews, 15 * 60 * 1000);
  
  // Also run once 5 seconds after startup
  setTimeout(updateExpiredInterviews, 5000);
}

module.exports = { startStatusUpdater };
