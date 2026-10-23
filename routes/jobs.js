const express = require('express');
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  closeJob,
  deleteJob,
  getJobStats,
} = require('../controllers/jobController');
const { applyToJob, getJobApplications } = require('../controllers/applicationController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const {
  createJobRules,
  updateJobRules,
  listJobsRules,
  applyRules,
  jobApplicationsRules,
  jobIdRules,
} = require('../middleware/validation');

const router = express.Router();

router.get('/', listJobsRules, getJobs);

router.post('/', requireAuth, requireRole('employer'), createJobRules, createJob);

router.get('/:id/stats', requireAuth, requireRole('employer'), jobIdRules, getJobStats);

router.patch('/:id/close', requireAuth, requireRole('employer'), jobIdRules, closeJob);

router.post('/:id/apply', requireAuth, requireRole('candidate'), applyRules, applyToJob);

router.get(
  '/:id/applications',
  requireAuth,
  requireRole('employer'),
  jobApplicationsRules,
  getJobApplications
);

router.get('/:id', jobIdRules, getJob);

router.put(
  '/:id',
  requireAuth,
  requireRole('employer'),
  jobIdRules,
  updateJobRules,
  updateJob
);

router.delete('/:id', requireAuth, requireRole('employer'), jobIdRules, deleteJob);

module.exports = router;
