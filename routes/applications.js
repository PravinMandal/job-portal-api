const express = require('express');
const {
  getMyApplications,
  updateApplicationStatus,
  withdrawApplication,
} = require('../controllers/applicationController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { updateStatusRules, applicationIdRules } = require('../middleware/validation');

const router = express.Router();

router.get('/my', requireAuth, requireRole('candidate'), getMyApplications);

router.patch(
  '/:id/status',
  requireAuth,
  requireRole('employer'),
  updateStatusRules,
  updateApplicationStatus
);

router.delete('/:id', requireAuth, requireRole('candidate'), applicationIdRules, withdrawApplication);

module.exports = router;
