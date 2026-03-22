const AuditLog = require('../models/AuditLog');
const Product = require('../models/Product');
const BOM = require('../models/BOM');
const ECO = require('../models/ECO');
const { STATUS_VALUES } = require('../config/constants');

const companyFilter = (req) => ({ companyId: req.companyId });

/**
 * GET /api/reports/eco
 */
const getECOReport = async (req, res) => {
  const ecos = await ECO.find(companyFilter(req))
    .populate('product', 'name version')
    .populate('bom', 'version')
    .populate('user', 'name role')
    .sort({ createdAt: -1 });
  res.json(ecos);
};

/**
 * GET /api/reports/version-history
 */
const getVersionHistory = async (req, res) => {
  const products = await Product.find(companyFilter(req))
    .populate('createdBy', 'name')
    .sort({ createdAt: 1 });

  const groups = {};
  for (const p of products) {
    const key = (p.rootProduct || p._id).toString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  res.json(Object.values(groups));
};

/**
 * GET /api/reports/bom-history
 */
const getBOMHistory = async (req, res) => {
  const boms = await BOM.find(companyFilter(req))
    .populate('product', 'name version')
    .sort({ createdAt: 1 });

  const groups = {};
  for (const b of boms) {
    const key = (b.rootBOM || b._id).toString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  }
  res.json(Object.values(groups));
};

/**
 * GET /api/reports/archived
 */
const getArchived = async (req, res) => {
  const products = await Product.find({
    ...companyFilter(req),
    status: STATUS_VALUES.ARCHIVED,
  })
    .populate('createdBy', 'name')
    .sort({ updatedAt: -1 });
  const boms = await BOM.find({
    ...companyFilter(req),
    status: STATUS_VALUES.ARCHIVED,
  })
    .populate('product', 'name')
    .sort({ updatedAt: -1 });
  res.json({ products, boms });
};

/**
 * GET /api/reports/active-matrix
 */
const getActiveMatrix = async (req, res) => {
  const products = await Product.find({
    ...companyFilter(req),
    status: STATUS_VALUES.ACTIVE,
  })
    .populate('createdBy', 'name')
    .sort({ name: 1 });
  const boms = await BOM.find({
    ...companyFilter(req),
    status: STATUS_VALUES.ACTIVE,
  })
    .populate('product', 'name version')
    .sort({ createdAt: -1 });

  const matrix = products.map((p) => {
    const matchingBOMs = boms.filter(
      (b) => b.product && b.product._id.toString() === p._id.toString()
    );
    return {
      product: p,
      activeBOMs: matchingBOMs,
    };
  });
  res.json(matrix);
};

/**
 * GET /api/reports/audit
 */
const getAuditLog = async (req, res) => {
  const { model, action, userId } = req.query;
  const filter = { companyId: req.companyId };
  if (model) filter.affectedModel = model;
  if (action) filter.action = action;
  if (userId) filter.performedBy = userId;

  const logs = await AuditLog.find(filter)
    .populate('performedBy', 'name email role')
    .sort({ timestamp: -1 })
    .limit(500);
  res.json(logs);
};

module.exports = {
  getECOReport,
  getVersionHistory,
  getBOMHistory,
  getArchived,
  getActiveMatrix,
  getAuditLog,
};
