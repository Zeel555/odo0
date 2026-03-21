const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Invite = require('../models/Invite');

const signToken = (id, companyId) =>
  jwt.sign({ id, companyId }, process.env.JWT_SECRET, { expiresIn: '7d' });

/**
 * GET /api/invite/:token
 * Public — validates invite token and returns invite metadata (name, email, role, company).
 */
const getInvite = async (req, res) => {
  const invite = await Invite.findOne({ token: req.params.token })
    .populate('companyId', 'name');
  if (!invite) return res.status(404).json({ message: 'Invite not found or already accepted' });
  if (invite.status === 'accepted') {
    return res.status(400).json({ message: 'This invite has already been accepted' });
  }
  if (new Date() > invite.expiresAt) {
    return res.status(400).json({ message: 'This invite link has expired. Ask your admin to resend.' });
  }

  res.json({
    name: invite.name,
    email: invite.email,
    role: invite.role,
    companyName: invite.companyId?.name || '',
    companyId: invite.companyId?._id,
  });
};

/**
 * POST /api/invite/:token/accept
 * Public — creates a new user account and marks invite as accepted.
 * Body: { password }
 */
const acceptInvite = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const invite = await Invite.findOne({ token: req.params.token })
    .populate('companyId', 'name');
  if (!invite) return res.status(404).json({ message: 'Invite not found' });
  if (invite.status === 'accepted') {
    return res.status(400).json({ message: 'This invite has already been accepted' });
  }
  if (new Date() > invite.expiresAt) {
    return res.status(400).json({ message: 'This invite link has expired' });
  }

  // Check not already in company
  const existingUser = await User.findOne({ email: invite.email, companyId: invite.companyId });
  if (existingUser) {
    return res.status(400).json({ message: 'A user with this email already exists in this company' });
  }

  // Create user + mark invite accepted
  const user = await User.create({
    name: invite.name,
    email: invite.email,
    password,
    role: invite.role,
    companyId: invite.companyId,
  });

  invite.status = 'accepted';
  await invite.save();

  res.status(201).json({ message: 'Account created. You can now log in.' });
};

module.exports = { getInvite, acceptInvite };
