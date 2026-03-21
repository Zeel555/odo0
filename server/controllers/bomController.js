const BOM = require('../models/BOM');
const { STATUS_VALUES, ROLES } = require('../config/constants');

const getBOMs = async (req, res) => {
  const filter = { companyId: req.companyId };
  if (req.user.role === ROLES.OPERATIONS) filter.status = STATUS_VALUES.ACTIVE;
  const boms = await BOM.find(filter)
    .populate('product', 'name version status')
    .populate('components.product', 'name version')
    .sort({ createdAt: -1 });
  res.json(boms);
};

const getBOMById = async (req, res) => {
  const bom = await BOM.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('product', 'name version status')
    .populate('components.product', 'name version status');
  if (!bom) return res.status(404).json({ message: 'BOM not found' });
  res.json(bom);
};

const getBOMHistory = async (req, res) => {
  const bom = await BOM.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!bom) return res.status(404).json({ message: 'BOM not found' });
  const rootId = bom.rootBOM || bom._id;
  const history = await BOM.find({
    companyId: req.companyId,
    $or: [{ _id: rootId }, { rootBOM: rootId }],
  }).populate('product', 'name version').sort({ createdAt: 1 });
  res.json(history);
};

const createBOM = async (req, res) => {
  const { product, components, operations } = req.body;
  const bom = await BOM.create({
    product,
    components: components || [],
    operations: operations || [],
    version: 'v1',
    status: STATUS_VALUES.ACTIVE,
    companyId: req.companyId,
  });
  const populated = await bom.populate('product', 'name version');
  res.status(201).json(populated);
};

const updateBOM = async (req, res) => {
  const bom = await BOM.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!bom) return res.status(404).json({ message: 'BOM not found' });
  if (bom.status === STATUS_VALUES.ARCHIVED) {
    return res.status(400).json({ message: 'Cannot edit an Archived BOM' });
  }
  const { components, operations } = req.body;
  if (components !== undefined) bom.components = components;
  if (operations !== undefined) bom.operations = operations;
  await bom.save();
  res.json(bom);
};

module.exports = { getBOMs, getBOMById, getBOMHistory, createBOM, updateBOM };
