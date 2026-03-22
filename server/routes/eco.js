const express = require('express');
const router = express.Router();
const {
  getECOs,
  getECOById,
  getECOTimeline,
  exportECO,
  createECO,
  updateECO,
  validateECO,
  approveECO,
  rejectECO,
  addECOComment,
  applyECO,
} = require('../controllers/ecoController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

const ecoViewers = [ROLES.ENGINEERING, ROLES.APPROVER, ROLES.ADMIN];

router.use(protect);
router.use(requireRole(...ecoViewers));

router.get('/', getECOs);

router.get('/:id/timeline', getECOTimeline);
router.get('/:id/export', exportECO);
router.get('/:id', getECOById);

router.post('/', requireRole(ROLES.ENGINEERING, ROLES.ADMIN), createECO);
router.put('/:id', requireRole(ROLES.ENGINEERING, ROLES.ADMIN), updateECO);

router.post('/:id/validate', requireRole(ROLES.ENGINEERING, ROLES.ADMIN), validateECO);
router.post('/:id/approve', requireRole(ROLES.APPROVER, ROLES.ADMIN), approveECO);
router.post('/:id/reject', requireRole(ROLES.APPROVER, ROLES.ADMIN), rejectECO);
router.post('/:id/apply', requireRole(ROLES.ADMIN), applyECO);

router.post('/:id/comments', addECOComment);

module.exports = router;
