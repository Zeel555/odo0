const express = require('express');
const router = express.Router();
const {
  getBOMs, getBOMById, getBOMHistory, createBOM, updateBOM, archiveBOM,
} = require('../controllers/bomController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/',    getBOMs);
router.get('/:id/history', getBOMHistory);
router.get('/:id', getBOMById);
router.post('/',   requireRole(ROLES.ENGINEERING, ROLES.ADMIN), createBOM);
router.put('/:id', requireRole(ROLES.ENGINEERING, ROLES.ADMIN), updateBOM);
router.delete('/:id', requireRole(ROLES.ADMIN), archiveBOM);

module.exports = router;
