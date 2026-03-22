const Product = require('../models/Product');
const { STATUS_VALUES, ROLES } = require('../config/constants');

const getProducts = async (req, res) => {
  const filter = { companyId: req.companyId };
  if (req.user.role === ROLES.OPERATIONS) filter.status = STATUS_VALUES.ACTIVE;
  const products = await Product.find(filter)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
  res.json(products);
};

const getProductById = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate('createdBy', 'name email');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

const getProductHistory = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const rootId = product.rootProduct || product._id;
  const history = await Product.find({
    companyId: req.companyId,
    $or: [{ _id: rootId }, { rootProduct: rootId }],
  }).sort({ createdAt: 1 }).populate('createdBy', 'name');
  res.json(history);
};

const createProduct = async (req, res) => {
  const { name, salePrice, costPrice, attachments } = req.body;
  const product = await Product.create({
    name, salePrice, costPrice,
    attachments: attachments || [],
    version: 'v1',
    status: STATUS_VALUES.ACTIVE,
    createdBy: req.user._id,
    companyId: req.companyId,
  });
  res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  return res.status(403).json({
    message:
      'Direct product edits are disabled. Propose changes through an Engineering Change Order (ECO).',
  });
};

const archiveProduct = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  product.status = STATUS_VALUES.ARCHIVED;
  await product.save();
  res.json({ message: 'Product archived', product });
};

module.exports = { getProducts, getProductById, getProductHistory, createProduct, updateProduct, archiveProduct };
