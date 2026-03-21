const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Generate JWT including companyId */
const signToken = (id, companyId) =>
  jwt.sign({ id, companyId }, process.env.JWT_SECRET, { expiresIn: '7d' });

/** Format user for API response */
const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  companyId: user.companyId,
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Finds user by email+companyId or email+null (for legacy).
 * Since users no longer self-register, this is the main entry point after company creation.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // Find user by email — could match multiple companies, pick the first active one
  const users = await User.find({ email, isActive: { $ne: false } });
  if (!users.length) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // If multiple companies share the email, match by password
  let matched = null;
  for (const u of users) {
    if (await u.matchPassword(password)) { matched = u; break; }
  }
  if (!matched) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = signToken(matched._id, matched.companyId);
  res.json({ token, user: formatUser(matched) });
};

/**
 * GET /api/auth/me
 */
const me = async (req, res) => {
  res.json({ user: formatUser(req.user) });
};

/**
 * GET /api/auth/users (admin only) — returns users in same company
 */
const getAllUsers = async (req, res) => {
  const users = await User.find({ companyId: req.companyId }).select('-password').sort({ name: 1 });
  res.json(users);
};

module.exports = { login, me, getAllUsers };
