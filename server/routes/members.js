const express = require('express');
const router = express.Router();
const { getMembers, inviteMember, resendInvite, removeMember } = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

// All member management routes require admin
router.use(protect, requireRole(ROLES.ADMIN));

router.get('/', getMembers);
router.post('/invite', inviteMember);
router.post('/resend/:inviteId', resendInvite);
router.delete('/:userId', removeMember);

module.exports = router;
