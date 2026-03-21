const express = require('express');
const router = express.Router();
const { getInvite, acceptInvite } = require('../controllers/inviteController');

// Both routes are public — no auth required
router.get('/:token', getInvite);
router.post('/:token/accept', acceptInvite);

module.exports = router;
