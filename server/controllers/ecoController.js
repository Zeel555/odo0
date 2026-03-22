const ECO = require('../models/ECO');
const ECOStage = require('../models/ECOStage');
const ApprovalRule = require('../models/ApprovalRule');
const Product = require('../models/Product');
const BOM = require('../models/BOM');
const { ECO_STATUS, ECO_TYPES, STATUS_VALUES, AUDIT_ACTIONS, ROLES } = require('../config/constants');
const { bumpVersion } = require('../utils/versionUtils');
const { logAudit } = require('../utils/auditUtils');
const { notifyApproversStage, notifyCreatorRejected, notifyCreatorReadyToApply } = require('../services/ecoNotifications');

const getStagesForCompany = (companyId) =>
  ECOStage.find({ companyId }).sort({ order: 1 });

/** Whether the user may approve/reject at this ECO stage */
const canUserApproveAtStage = async (req, stageName) => {
  const rules = await ApprovalRule.find({ companyId: req.companyId, stage: stageName });
  if (rules.length === 0) {
    return [ROLES.APPROVER, ROLES.ADMIN].includes(req.user.role);
  }
  return rules.some((r) => r.approverRole === req.user.role) || req.user.role === ROLES.ADMIN;
};

/**
 * GET /api/eco
 */
const getECOs = async (req, res) => {
  const ecos = await ECO.find({ companyId: req.companyId })
    .populate('product', 'name version')
    .populate('bom', 'version')
    .populate('user', 'name role')
    .sort({ createdAt: -1 });
  res.json(ecos);
};

/**
 * GET /api/eco/:id
 */
const getECOById = async (req, res) => {
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('product')
    .populate({ path: 'bom', populate: { path: 'components.product', select: 'name version' } })
    .populate('user', 'name email role')
    .populate('comments.user', 'name email');
  if (!eco) return res.status(404).json({ message: 'ECO not found' });
  res.json(eco);
};

/**
 * GET /api/eco/:id/timeline — audit entries for this ECO
 */
const getECOTimeline = async (req, res) => {
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!eco) return res.status(404).json({ message: 'ECO not found' });

  const AuditLog = require('../models/AuditLog');
  const logs = await AuditLog.find({
    companyId: req.companyId,
    affectedModel: 'ECO',
    affectedId: eco._id,
  })
    .populate('performedBy', 'name email role')
    .sort({ timestamp: -1 })
    .limit(200);
  res.json(logs);
};

/**
 * GET /api/eco/:id/export — CSV snapshot for download
 */
const exportECO = async (req, res) => {
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('product', 'name version')
    .populate('bom', 'version')
    .populate('user', 'name email');
  if (!eco) return res.status(404).json({ message: 'ECO not found' });

  const rows = [
    ['Field', 'Value'],
    ['Title', eco.title],
    ['Type', eco.ecoType],
    ['Product', eco.product?.name || ''],
    ['Product version', eco.product?.version || ''],
    ['BOM version', eco.bom?.version || ''],
    ['Stage', eco.stage],
    ['Status', eco.status],
    ['Version update', eco.versionUpdate ? 'Yes' : 'No'],
    ['Effective date', eco.effectiveDate?.toISOString?.() || ''],
    ['Created by', eco.user?.email || ''],
    ['Proposed changes (JSON)', JSON.stringify(eco.proposedChanges || {})],
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="eco-${eco._id}.csv"`);
  res.send('\uFEFF' + csv);
};

/**
 * POST /api/eco
 */
const createECO = async (req, res) => {
  const stages = await getStagesForCompany(req.companyId);
  if (!stages.length) {
    return res.status(400).json({ message: 'No ECO stages configured. Please set up stages in Settings.' });
  }
  const firstStage = stages[0];

  const { title, ecoType, product, bom, effectiveDate, versionUpdate, proposedChanges, attachmentUrls } = req.body;
  const eco = await ECO.create({
    title,
    ecoType,
    product,
    bom: bom || null,
    user: req.user._id,
    effectiveDate: effectiveDate || new Date(),
    versionUpdate: versionUpdate !== undefined ? versionUpdate : true,
    stage: firstStage.name,
    proposedChanges: proposedChanges || {},
    attachmentUrls: Array.isArray(attachmentUrls) ? attachmentUrls : [],
    status: ECO_STATUS.OPEN,
    companyId: req.companyId,
  });

  await logAudit({
    action: AUDIT_ACTIONS.ECO_CREATED,
    affectedModel: 'ECO',
    affectedId: eco._id,
    newValue: { title, ecoType, stage: firstStage.name },
    userId: req.user._id,
    companyId: req.companyId,
  });

  const populated = await eco.populate('product', 'name version');
  res.status(201).json(populated);
};

/**
 * PUT /api/eco/:id — only while Open and still on first (draft) stage
 */
const updateECO = async (req, res) => {
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!eco) return res.status(404).json({ message: 'ECO not found' });
  if (eco.status === ECO_STATUS.APPLIED) {
    return res.status(400).json({ message: 'Cannot edit an applied ECO' });
  }
  if (eco.status === ECO_STATUS.REJECTED) {
    return res.status(400).json({ message: 'Cannot edit a rejected ECO' });
  }

  const stages = await getStagesForCompany(req.companyId);
  const firstStage = stages[0];
  if (!firstStage || eco.stage !== firstStage.name) {
    return res.status(400).json({ message: 'ECO can only be edited in the first workflow stage (draft).' });
  }

  const { title, effectiveDate, versionUpdate, proposedChanges, bom, attachmentUrls } = req.body;
  if (title !== undefined) eco.title = title;
  if (effectiveDate !== undefined) eco.effectiveDate = effectiveDate;
  if (versionUpdate !== undefined) eco.versionUpdate = versionUpdate;
  if (proposedChanges !== undefined) eco.proposedChanges = proposedChanges;
  if (bom !== undefined) eco.bom = bom;
  if (attachmentUrls !== undefined) eco.attachmentUrls = Array.isArray(attachmentUrls) ? attachmentUrls : eco.attachmentUrls;

  await eco.save();
  res.json(eco);
};

/**
 * POST /api/eco/:id/validate — advance when current stage does NOT require approval
 */
const validateECO = async (req, res) => {
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!eco) return res.status(404).json({ message: 'ECO not found' });
  if (eco.status === ECO_STATUS.APPLIED) {
    return res.status(400).json({ message: 'ECO already applied' });
  }
  if (eco.status === ECO_STATUS.REJECTED) {
    return res.status(400).json({ message: 'ECO was rejected' });
  }

  const stages = await getStagesForCompany(req.companyId);
  const currentIndex = stages.findIndex((s) => s.name === eco.stage);
  if (currentIndex === -1) return res.status(400).json({ message: 'Current stage not found' });

  const currentStage = stages[currentIndex];
  if (currentStage.requiresApproval) {
    return res.status(400).json({ message: 'This stage requires approval — use Approve or Reject.' });
  }
  if (currentStage.isFinal) {
    return res.status(400).json({ message: 'ECO is in the final stage — use Apply to execute changes.' });
  }

  const nextStage = stages[currentIndex + 1];
  if (!nextStage) return res.status(400).json({ message: 'No next stage found' });

  const oldStage = eco.stage;
  eco.stage = nextStage.name;
  await eco.save();

  await logAudit({
    action: AUDIT_ACTIONS.STAGE_TRANSITION,
    affectedModel: 'ECO',
    affectedId: eco._id,
    oldValue: { stage: oldStage },
    newValue: { stage: nextStage.name },
    userId: req.user._id,
    companyId: req.companyId,
  });

  if (nextStage.requiresApproval) {
    await notifyApproversStage(eco, req.companyId);
  }
  if (nextStage.isFinal && !nextStage.requiresApproval) {
    await notifyCreatorReadyToApply(eco);
  }

  const populated = await ECO.findById(eco._id).populate('product', 'name version').populate('user', 'name');
  res.json(populated);
};

/**
 * POST /api/eco/:id/approve — advance from approval-required stage to next (does NOT apply master data)
 */
const approveECO = async (req, res) => {
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!eco) return res.status(404).json({ message: 'ECO not found' });
  if (eco.status === ECO_STATUS.APPLIED) {
    return res.status(400).json({ message: 'ECO already applied' });
  }
  if (eco.status === ECO_STATUS.REJECTED) {
    return res.status(400).json({ message: 'ECO was rejected' });
  }

  const stages = await getStagesForCompany(req.companyId);
  const currentIndex = stages.findIndex((s) => s.name === eco.stage);
  if (currentIndex === -1) return res.status(400).json({ message: 'Current stage not found' });

  const currentStage = stages[currentIndex];
  if (!currentStage.requiresApproval) {
    return res.status(400).json({ message: 'Use “Submit / Next stage” to advance from this stage — approval is not required here.' });
  }

  const ok = await canUserApproveAtStage(req, eco.stage);
  if (!ok) {
    return res.status(403).json({ message: 'You are not allowed to approve at this stage.' });
  }

  const nextStage = stages[currentIndex + 1];
  if (!nextStage) return res.status(400).json({ message: 'No next stage after approval.' });

  const oldStage = eco.stage;
  eco.stage = nextStage.name;
  await eco.save();

  await logAudit({
    action: AUDIT_ACTIONS.ECO_APPROVED,
    affectedModel: 'ECO',
    affectedId: eco._id,
    oldValue: { stage: oldStage },
    newValue: { stage: nextStage.name },
    userId: req.user._id,
    companyId: req.companyId,
  });

  if (nextStage.isFinal) {
    await notifyCreatorReadyToApply(eco);
  }

  const populated = await ECO.findById(eco._id).populate('product', 'name version').populate('user', 'name');
  res.json({ message: 'Approval recorded. Apply changes when ready (final stage).', eco: populated });
};

/**
 * POST /api/eco/:id/reject
 */
const rejectECO = async (req, res) => {
  const { reason } = req.body;
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId }).populate('user', 'email name');
  if (!eco) return res.status(404).json({ message: 'ECO not found' });
  if (eco.status === ECO_STATUS.APPLIED) {
    return res.status(400).json({ message: 'Cannot reject an applied ECO' });
  }
  if (eco.status === ECO_STATUS.REJECTED) {
    return res.status(400).json({ message: 'Already rejected' });
  }

  const stages = await getStagesForCompany(req.companyId);
  const currentStage = stages.find((s) => s.name === eco.stage);
  if (!currentStage?.requiresApproval) {
    return res.status(400).json({ message: 'This stage does not require approval — reject is only available during approval review.' });
  }

  const ok = await canUserApproveAtStage(req, eco.stage);
  if (!ok) {
    return res.status(403).json({ message: 'You are not allowed to reject at this stage.' });
  }

  eco.status = ECO_STATUS.REJECTED;
  eco.rejectReason = (reason || '').trim();
  await eco.save();

  await logAudit({
    action: AUDIT_ACTIONS.ECO_REJECTED,
    affectedModel: 'ECO',
    affectedId: eco._id,
    newValue: { status: ECO_STATUS.REJECTED, reason: eco.rejectReason },
    userId: req.user._id,
    companyId: req.companyId,
  });

  await notifyCreatorRejected(eco);

  const populated = await ECO.findById(eco._id).populate('product', 'name version').populate('user', 'name');
  res.json({ message: 'ECO rejected.', eco: populated });
};

/**
 * POST /api/eco/:id/comments
 */
const addECOComment = async (req, res) => {
  const { text } = req.body;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ message: 'Comment text is required' });
  }
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!eco) return res.status(404).json({ message: 'ECO not found' });
  if (eco.status === ECO_STATUS.APPLIED || eco.status === ECO_STATUS.REJECTED) {
    return res.status(400).json({ message: 'Cannot add comments to a closed ECO' });
  }

  eco.comments.push({ user: req.user._id, text: String(text).trim(), createdAt: new Date() });
  await eco.save();

  const populated = await ECO.findById(eco._id).populate('comments.user', 'name email');
  res.status(201).json(populated);
};

/**
 * Internal: apply ECO changes to master data
 */
const applyECOLogic = async (eco, userId, res) => {
  const { proposedChanges, versionUpdate, ecoType } = eco;

  if (ecoType === ECO_TYPES.PRODUCT) {
    const oldProduct = await Product.findById(eco.product);
    if (!oldProduct) return res.status(404).json({ message: 'Product not found' });

    if (versionUpdate) {
      const newVersion = bumpVersion(oldProduct.version);
      const rootId = oldProduct.rootProduct || oldProduct._id;

      const newProduct = await Product.create({
        name: proposedChanges.name ?? oldProduct.name,
        salePrice: proposedChanges.salePrice ?? oldProduct.salePrice,
        costPrice: proposedChanges.costPrice ?? oldProduct.costPrice,
        attachments: proposedChanges.attachments ?? oldProduct.attachments,
        version: newVersion,
        status: STATUS_VALUES.ACTIVE,
        rootProduct: rootId,
        createdBy: userId,
        companyId: eco.companyId,
      });

      oldProduct.status = STATUS_VALUES.ARCHIVED;
      await oldProduct.save();

      await logAudit({
        action: AUDIT_ACTIONS.VERSION_CREATED,
        affectedModel: 'Product',
        affectedId: newProduct._id,
        oldValue: oldProduct.toObject(),
        newValue: newProduct.toObject(),
        userId,
        companyId: eco.companyId,
      });
      await logAudit({
        action: AUDIT_ACTIONS.RECORD_ARCHIVED,
        affectedModel: 'Product',
        affectedId: oldProduct._id,
        oldValue: { status: STATUS_VALUES.ACTIVE },
        newValue: { status: STATUS_VALUES.ARCHIVED },
        userId,
        companyId: eco.companyId,
      });

      eco.product = newProduct._id;
    } else {
      const old = oldProduct.toObject();
      if (proposedChanges.name !== undefined) oldProduct.name = proposedChanges.name;
      if (proposedChanges.salePrice !== undefined) oldProduct.salePrice = proposedChanges.salePrice;
      if (proposedChanges.costPrice !== undefined) oldProduct.costPrice = proposedChanges.costPrice;
      if (proposedChanges.attachments !== undefined) oldProduct.attachments = proposedChanges.attachments;
      await oldProduct.save();
      await logAudit({
        action: AUDIT_ACTIONS.PRODUCT_UPDATED,
        affectedModel: 'Product',
        affectedId: oldProduct._id,
        oldValue: old,
        newValue: oldProduct.toObject(),
        userId,
        companyId: eco.companyId,
      });
    }
  } else if (ecoType === ECO_TYPES.BOM) {
    const oldBOM = await BOM.findById(eco.bom);
    if (!oldBOM) return res.status(404).json({ message: 'BOM not found' });

    if (versionUpdate) {
      const newVersion = bumpVersion(oldBOM.version);
      const rootId = oldBOM.rootBOM || oldBOM._id;

      const newBOM = await BOM.create({
        product: oldBOM.product,
        components: proposedChanges.components ?? oldBOM.components,
        operations: proposedChanges.operations ?? oldBOM.operations,
        version: newVersion,
        status: STATUS_VALUES.ACTIVE,
        rootBOM: rootId,
        companyId: eco.companyId,
      });

      oldBOM.status = STATUS_VALUES.ARCHIVED;
      await oldBOM.save();

      await logAudit({
        action: AUDIT_ACTIONS.VERSION_CREATED,
        affectedModel: 'BOM',
        affectedId: newBOM._id,
        oldValue: oldBOM.toObject(),
        newValue: newBOM.toObject(),
        userId,
        companyId: eco.companyId,
      });
      await logAudit({
        action: AUDIT_ACTIONS.RECORD_ARCHIVED,
        affectedModel: 'BOM',
        affectedId: oldBOM._id,
        oldValue: { status: STATUS_VALUES.ACTIVE },
        newValue: { status: STATUS_VALUES.ARCHIVED },
        userId,
        companyId: eco.companyId,
      });

      eco.bom = newBOM._id;
    } else {
      const old = oldBOM.toObject();
      if (proposedChanges.components !== undefined) oldBOM.components = proposedChanges.components;
      if (proposedChanges.operations !== undefined) oldBOM.operations = proposedChanges.operations;
      await oldBOM.save();
      await logAudit({
        action: AUDIT_ACTIONS.BOM_UPDATED,
        affectedModel: 'BOM',
        affectedId: oldBOM._id,
        oldValue: old,
        newValue: oldBOM.toObject(),
        userId,
        companyId: eco.companyId,
      });
    }
  }

  eco.status = ECO_STATUS.APPLIED;
  const stages = await getStagesForCompany(eco.companyId);
  const finalStage = stages.find((s) => s.isFinal);
  if (finalStage) eco.stage = finalStage.name;
  await eco.save();

  await logAudit({
    action: AUDIT_ACTIONS.ECO_APPLIED,
    affectedModel: 'ECO',
    affectedId: eco._id,
    newValue: { status: ECO_STATUS.APPLIED },
    userId,
    companyId: eco.companyId,
  });

  const populated = await ECO.findById(eco._id).populate('product', 'name version').populate('bom', 'version').populate('user', 'name');
  res.json({ message: 'ECO applied successfully', eco: populated });
};

/**
 * POST /api/eco/:id/apply — apply master data (must be on final stage)
 */
const applyECO = async (req, res) => {
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!eco) return res.status(404).json({ message: 'ECO not found' });
  if (eco.status === ECO_STATUS.APPLIED) {
    return res.status(400).json({ message: 'ECO already applied' });
  }
  if (eco.status === ECO_STATUS.REJECTED) {
    return res.status(400).json({ message: 'ECO was rejected' });
  }

  const stages = await getStagesForCompany(req.companyId);
  const finalStage = stages.find((s) => s.isFinal);
  if (!finalStage || eco.stage !== finalStage.name) {
    return res.status(400).json({
      message: `Apply is only allowed in the final stage (${finalStage?.name || 'Done'}). Current stage: ${eco.stage}`,
    });
  }

  return applyECOLogic(eco, req.user._id, res);
};

module.exports = {
  getECOs,
  getECOById,
  getECOTimeline,
  exportECO,
  createECO,
  updateECO,
  validateECO,
  approveECO,
  rejectECO,
  addECOComment,
  applyECO,
};
