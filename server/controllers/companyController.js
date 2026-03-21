const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { ROLES } = require('../config/constants');

/** Generate JWT including companyId */
const signToken = (id, companyId) =>
  jwt.sign({ id, companyId }, process.env.JWT_SECRET, { expiresIn: '7d' });

/**
 * POST /api/company/register
 * Creates a new company + admin user in one step. Public route.
 * Body: { companyName, name, email, password }
 */
const registerCompany = async (req, res) => {
  const { companyName, name, email, password } = req.body;
  if (!companyName || !name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check if email already used in a company (allow same email in different companies)
  // but prevent duplicate global admin registrations with same email+no company
  const existingGlobal = await User.findOne({ email, companyId: null });
  if (existingGlobal) {
    return res.status(400).json({ message: 'Email already in use. Please log in.' });
  }

  // Create company (owner updated after user creation)
  const company = await Company.create({ name: companyName });

  // Create admin user linked to company
  const user = await User.create({
    name,
    email,
    password,
    role: ROLES.ADMIN,
    companyId: company._id,
  });

  // Set company owner
  company.owner = user._id;
  await company.save();

  const token = signToken(user._id, company._id);
  res.status(201).json({
    token,
    user: {
      _id: user._id, name: user.name, email: user.email,
      role: user.role, companyId: company._id,
    },
    company: { _id: company._id, name: company.name },
  });
};

/**
 * GET /api/company/me
 * Returns current user's company info.
 */
const getMyCompany = async (req, res) => {
  const company = await Company.findById(req.companyId).populate('owner', 'name email');
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json(company);
};

module.exports = { registerCompany, getMyCompany };
