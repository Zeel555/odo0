const ECO = require('../models/ECO');
const ECOStage = require('../models/ECOStage');
const ApprovalRule = require('../models/ApprovalRule');
const Product = require('../models/Product');
const BOM = require('../models/BOM');
const { ECO_STATUS, ECO_TYPES, STATUS_VALUES, AUDIT_ACTIONS, ROLES } = require('../config/constants');
const { bumpVersion } = require('../utils/versionUtils');
const { logAudit } = require('../utils/auditUtils');

/** Helper: get ordered stages array */
const getStages = () => ECOStage.find().sort({ order: 1 });

/**
 * GET /api/eco
 * List all ECOs with populated refs.
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
 * Single ECO with full detail.
 */
const getECOById = async (req, res) => {
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('product')
    .populate({ path: 'bom', populate: { path: 'components.product', select: 'name version' } })
    .populate('user', 'name email role');
  if (!eco) return res.status(404).json({ message: 'ECO not found' });
  res.json(eco);
};

/**
 * POST /api/eco
 * Create ECO — starts at first ECOStage.
 * Body: { title, ecoType, product, bom, effectiveDate, versionUpdate, proposedChanges }
 */
const createECO = async (req, res) => {
  const stages = await getStages();
  if (!stages.length) {
    return res.status(400).json({ message: 'No ECO stages configured. Please set up stages in Settings.' });
  }
  const firstStage = stages[0];

  const { title, ecoType, product, bom, effectiveDate, versionUpdate, proposedChanges } = req.body;
  const eco = await ECO.create({
    title, ecoType, product,
    bom: bom || null,
    user: req.user._id,
    effectiveDate: effectiveDate || new Date(),
    versionUpdate: versionUpdate !== undefined ? versionUpdate : true,
    stage: firstStage.name,
    proposedChanges: proposedChanges || {},
    status: ECO_STATUS.OPEN,
    companyId: req.companyId,
  });

  await logAudit({
    action: AUDIT_ACTIONS.ECO_CREATED,
    affectedModel: 'ECO',
    affectedId: eco._id,
    newValue: { title, ecoType, stage: firstStage.name },
    userId: req.user._id,
  });

  const populated = await eco.populate('product', 'name version');
  res.status(201).json(populated);
};

/**
 * PUT /api/eco/:id
 * Update ECO fields while status is Open and stage is first stage.
 */
const updateECO = async (req, res) => {
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!eco) return res.status(404).json({ message: 'ECO not found' });
  if (eco.status === ECO_STATUS.APPLIED) {
    return res.status(400).json({ message: 'Cannot edit an applied ECO' });
  }

  const { title, effectiveDate, versionUpdate, proposedChanges, bom } = req.body;
  if (title !== undefined) eco.title = title;
  if (effectiveDate !== undefined) eco.effectiveDate = effectiveDate;
  if (versionUpdate !== undefined) eco.versionUpdate = versionUpdate;
  if (proposedChanges !== undefined) eco.proposedChanges = proposedChanges;
  if (bom !== undefined) eco.bom = bom;

  await eco.save();
  res.json(eco);
};

/**
 * POST /api/eco/:id/validate
 * Move ECO to next stage if current stage does NOT require approval.
 * engineering + admin only.
 */
const validateECO = async (req, res) => {
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!eco) return res.status(404).json({ message: 'ECO not found' });
  if (eco.status === ECO_STATUS.APPLIED) {
    return res.status(400).json({ message: 'ECO already applied' });
  }

  const stages = await getStages();
  const currentIndex = stages.findIndex((s) => s.name === eco.stage);
  if (currentIndex === -1) return res.status(400).json({ message: 'Current stage not found' });

  const currentStage = stages[currentIndex];
  if (currentStage.requiresApproval) {
    return res.status(400).json({ message: 'This stage requires approval, not validation' });
  }

  // Move to next stage or apply if final
  if (currentStage.isFinal) {
    return applyECOLogic(eco, req.user._id, res);
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
  });

  // If next stage is final, auto-apply
  if (nextStage.isFinal && !nextStage.requiresApproval) {
    return applyECOLogic(eco, req.user._id, res);
  }

  const populated = await ECO.findById(eco._id).populate('product', 'name version').populate('user', 'name');
  res.json(populated);
};

/**
 * POST /api/eco/:id/approve
 * Approve ECO in a stage that requires approval. approver + admin only.
 */
const approveECO = async (req, res) => {
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!eco) return res.status(404).json({ message: 'ECO not found' });
  if (eco.status === ECO_STATUS.APPLIED) {
    return res.status(400).json({ message: 'ECO already applied' });
  }

  const stages = await getStages();
  const currentIndex = stages.findIndex((s) => s.name === eco.stage);
  if (currentIndex === -1) return res.status(400).json({ message: 'Current stage not found' });

  const currentStage = stages[currentIndex];
  if (!currentStage.requiresApproval) {
    return res.status(400).json({ message: 'Current stage does not require approval — use validate instead' });
  }

  // Verify approver role via ApprovalRule
  if (req.user.role !== ROLES.ADMIN) {
    const rule = await ApprovalRule.findOne({ stage: eco.stage, approverRole: req.user.role });
    if (!rule) {
      return res.status(403).json({ message: 'Your role is not authorised to approve in this stage' });
    }
  }

  const oldStage = eco.stage;

  // If this is the final stage, apply
  if (currentStage.isFinal) {
    return applyECOLogic(eco, req.user._id, res);
  }

  const nextStage = stages[currentIndex + 1];
  if (!nextStage) return res.status(400).json({ message: 'No next stage found' });

  eco.stage = nextStage.name;
  await eco.save();

  await logAudit({
    action: AUDIT_ACTIONS.ECO_APPROVED,
    affectedModel: 'ECO',
    affectedId: eco._id,
    oldValue: { stage: oldStage },
    newValue: { stage: nextStage.name },
    userId: req.user._id,
  });

  // Auto-apply if next stage is final and requires no approval
  if (nextStage.isFinal && !nextStage.requiresApproval) {
    return applyECOLogic(eco, req.user._id, res);
  }

  const populated = await ECO.findById(eco._id).populate('product', 'name version').populate('user', 'name');
  res.json(populated);
};

/**
 * Internal: apply ECO changes — clones/updates Product or BOM, writes audit logs,
 *           marks ECO as Applied.
 * @param {Document} eco - The ECO mongoose document
 * @param {ObjectId} userId
 * @param {Response} res
 */
const applyECOLogic = async (eco, userId, res) => {
  const { proposedChanges, versionUpdate, ecoType } = eco;

  if (ecoType === ECO_TYPES.PRODUCT) {
    const oldProduct = await Product.findById(eco.product);
    if (!oldProduct) return res.status(404).json({ message: 'Product not found' });

    if (versionUpdate) {
      // Clone product with new version
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

      // Archive old version
      oldProduct.status = STATUS_VALUES.ARCHIVED;
      await oldProduct.save();

      await logAudit({ action: AUDIT_ACTIONS.VERSION_CREATED, affectedModel: 'Product', affectedId: newProduct._id, oldValue: oldProduct.toObject(), newValue: newProduct.toObject(), userId });
      await logAudit({ action: AUDIT_ACTIONS.RECORD_ARCHIVED, affectedModel: 'Product', affectedId: oldProduct._id, oldValue: { status: STATUS_VALUES.ACTIVE }, newValue: { status: STATUS_VALUES.ARCHIVED }, userId });

      // Update ECO to point at new product
      eco.product = newProduct._id;
    } else {
      // Patch in-place
      const old = oldProduct.toObject();
      if (proposedChanges.name !== undefined) oldProduct.name = proposedChanges.name;
      if (proposedChanges.salePrice !== undefined) oldProduct.salePrice = proposedChanges.salePrice;
      if (proposedChanges.costPrice !== undefined) oldProduct.costPrice = proposedChanges.costPrice;
      if (proposedChanges.attachments !== undefined) oldProduct.attachments = proposedChanges.attachments;
      await oldProduct.save();
      await logAudit({ action: AUDIT_ACTIONS.PRODUCT_UPDATED, affectedModel: 'Product', affectedId: oldProduct._id, oldValue: old, newValue: oldProduct.toObject(), userId });
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

      await logAudit({ action: AUDIT_ACTIONS.VERSION_CREATED, affectedModel: 'BOM', affectedId: newBOM._id, oldValue: oldBOM.toObject(), newValue: newBOM.toObject(), userId });
      await logAudit({ action: AUDIT_ACTIONS.RECORD_ARCHIVED, affectedModel: 'BOM', affectedId: oldBOM._id, oldValue: { status: STATUS_VALUES.ACTIVE }, newValue: { status: STATUS_VALUES.ARCHIVED }, userId });

      eco.bom = newBOM._id;
    } else {
      const old = oldBOM.toObject();
      if (proposedChanges.components !== undefined) oldBOM.components = proposedChanges.components;
      if (proposedChanges.operations !== undefined) oldBOM.operations = proposedChanges.operations;
      await oldBOM.save();
      await logAudit({ action: AUDIT_ACTIONS.BOM_UPDATED, affectedModel: 'BOM', affectedId: oldBOM._id, oldValue: old, newValue: oldBOM.toObject(), userId });
    }
  }

  eco.status = ECO_STATUS.APPLIED;
  const stages = await getStages();
  const finalStage = stages.find((s) => s.isFinal);
  if (finalStage) eco.stage = finalStage.name;
  await eco.save();

  await logAudit({ action: AUDIT_ACTIONS.ECO_APPLIED, affectedModel: 'ECO', affectedId: eco._id, newValue: { status: ECO_STATUS.APPLIED }, userId });

  const populated = await ECO.findById(eco._id).populate('product', 'name version').populate('bom', 'version').populate('user', 'name');
  res.json({ message: 'ECO applied successfully', eco: populated });
};

/**
 * POST /api/eco/:id/apply
 * Manually trigger apply (admin only or when on final stage).
 */
const applyECO = async (req, res) => {
  const eco = await ECO.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!eco) return res.status(404).json({ message: 'ECO not found' });
  if (eco.status === ECO_STATUS.APPLIED) {
    return res.status(400).json({ message: 'ECO already applied' });
  }
  return applyECOLogic(eco, req.user._id, res);
};

module.exports = { getECOs, getECOById, createECO, updateECO, validateECO, approveECO, applyECO };
