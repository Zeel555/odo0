const ECO = require('../models/ECO');
const ECOStage = require('../models/ECOStage');
const AuditLog = require('../models/AuditLog');
const Product = require('../models/Product');
const BOM = require('../models/BOM');
const { ECO_STATUS, STATUS_VALUES } = require('../config/constants');

/**
 * GET /api/dashboard/stats — widgets for dashboard home
 */
const getDashboardStats = async (req, res) => {
  const cid = req.companyId;

  const [
    openECOs,
    appliedECOs,
    rejectedECOs,
    activeProducts,
    activeBOMs,
    stages,
  ] = await Promise.all([
    ECO.countDocuments({ companyId: cid, status: ECO_STATUS.OPEN }),
    ECO.countDocuments({ companyId: cid, status: ECO_STATUS.APPLIED }),
    ECO.countDocuments({ companyId: cid, status: ECO_STATUS.REJECTED }),
    Product.countDocuments({ companyId: cid, status: STATUS_VALUES.ACTIVE }),
    BOM.countDocuments({ companyId: cid, status: STATUS_VALUES.ACTIVE }),
    ECOStage.find({ companyId: cid }).sort({ order: 1 }),
  ]);

  const approvalStage = stages.find((s) => s.requiresApproval);
  let pendingApproval = 0;
  if (approvalStage) {
    pendingApproval = await ECO.countDocuments({
      companyId: cid,
      status: ECO_STATUS.OPEN,
      stage: approvalStage.name,
    });
  }

  const finalStage = stages.find((s) => s.isFinal);
  let readyToApply = 0;
  if (finalStage) {
    readyToApply = await ECO.countDocuments({
      companyId: cid,
      status: ECO_STATUS.OPEN,
      stage: finalStage.name,
    });
  }

  const recentAudit = await AuditLog.find({ companyId: cid })
    .populate('performedBy', 'name')
    .sort({ timestamp: -1 })
    .limit(8);

  res.json({
    openECOs,
    pendingApproval,
    readyToApply,
    appliedECOs,
    rejectedECOs,
    activeProducts,
    activeBOMs,
    recentAudit,
  });
};

module.exports = { getDashboardStats };
