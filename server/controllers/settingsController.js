const ECOStage = require('../models/ECOStage');
const ApprovalRule = require('../models/ApprovalRule');

// ─── ECO Stages ─────────────────────────────────────────────────────────────

/**
 * GET /api/settings/stages — list all stages in order.
 */
const getStages = async (req, res) => {
  const stages = await ECOStage.find({ companyId: req.companyId }).sort({ order: 1 });
  res.json(stages);
};

/**
 * POST /api/settings/stages
 * Body: { name, order, requiresApproval, isFinal }
 */
const createStage = async (req, res) => {
  const { name, order, requiresApproval, isFinal } = req.body;
  const stage = await ECOStage.create({ name, order, requiresApproval, isFinal, companyId: req.companyId });
  res.status(201).json(stage);
};

/**
 * PUT /api/settings/stages/:id
 */
const updateStage = async (req, res) => {
  const stage = await ECOStage.findOneAndUpdate(
    { _id: req.params.id, companyId: req.companyId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!stage) return res.status(404).json({ message: 'Stage not found' });
  res.json(stage);
};

/**
 * DELETE /api/settings/stages/:id
 */
const deleteStage = async (req, res) => {
  const stage = await ECOStage.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
  if (!stage) return res.status(404).json({ message: 'Stage not found' });
  res.json({ message: 'Stage deleted' });
};

// ─── Approval Rules ──────────────────────────────────────────────────────────

/**
 * GET /api/settings/rules — list all approval rules.
 */
const getRules = async (req, res) => {
  const rules = await ApprovalRule.find({ companyId: req.companyId }).sort({ stage: 1 });
  res.json(rules);
};

/**
 * POST /api/settings/rules
 * Body: { stage, approverRole }
 */
const createRule = async (req, res) => {
  const { stage, approverRole } = req.body;
  const rule = await ApprovalRule.create({ stage, approverRole, companyId: req.companyId });
  res.status(201).json(rule);
};

/**
 * DELETE /api/settings/rules/:id
 */
const deleteRule = async (req, res) => {
  const rule = await ApprovalRule.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
  if (!rule) return res.status(404).json({ message: 'Rule not found' });
  res.json({ message: 'Rule deleted' });
};

module.exports = {
  getStages, createStage, updateStage, deleteStage,
  getRules, createRule, deleteRule,
};
