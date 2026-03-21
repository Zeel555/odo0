const crypto = require('crypto');
const User = require('../models/User');
const Invite = require('../models/Invite');
const { ROLES } = require('../config/constants');

/**
 * GET /api/members
 * Lists all users + pending invites for the admin's company.
 */
const getMembers = async (req, res) => {
  const [users, invites] = await Promise.all([
    User.find({ companyId: req.companyId }).select('-password').sort({ name: 1 }),
    Invite.find({ companyId: req.companyId, status: 'pending' }).sort({ createdAt: -1 }),
  ]);
  res.json({ users, invites });
};

/**
 * POST /api/members/invite
 * Creates an invite record and returns the invite URL.
 * Body: { name, email, role }
 */
const inviteMember = async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email and role are required' });
  }
  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  // Check if user already in company
  const exists = await User.findOne({ email, companyId: req.companyId });
  if (exists) {
    return res.status(400).json({ message: 'User with this email already exists in your company' });
  }

  // Cancel any previous pending invite for same email+company
  await Invite.deleteMany({ email, companyId: req.companyId, status: 'pending' });

  const token = crypto.randomBytes(32).toString('hex');
  const invite = await Invite.create({
    name,
    email,
    role,
    companyId: req.companyId,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/${token}`;
  res.status(201).json({ invite, inviteUrl });
};

/**
 * POST /api/members/resend/:inviteId
 * Regenerates token and resets expiry for a pending invite.
 */
const resendInvite = async (req, res) => {
  const invite = await Invite.findOne({ _id: req.params.inviteId, companyId: req.companyId });
  if (!invite) return res.status(404).json({ message: 'Invite not found' });

  invite.token = crypto.randomBytes(32).toString('hex');
  invite.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await invite.save();

  const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/${invite.token}`;
  res.json({ invite, inviteUrl });
};

/**
 * DELETE /api/members/:userId
 * Removes a user from the company (sets companyId to null, deactivates).
 */
const removeMember = async (req, res) => {
  const user = await User.findOne({ _id: req.params.userId, companyId: req.companyId });
  if (!user) return res.status(404).json({ message: 'User not found in your company' });
  if (user._id.equals(req.user._id)) {
    return res.status(400).json({ message: 'You cannot remove yourself' });
  }
  user.isActive = false;
  user.companyId = null;
  await user.save();
  res.json({ message: 'Member removed' });
};

module.exports = { getMembers, inviteMember, resendInvite, removeMember };
