const express = require('express');
const router = express.Router();
const { registerCompany, getMyCompany } = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');

// Public: register a new company + admin
router.post('/register', registerCompany);

// Protected: get current user's company info
router.get('/me', protect, getMyCompany);

module.exports = router;
