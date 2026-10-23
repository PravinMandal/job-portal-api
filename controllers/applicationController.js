const Application = require('../models/application');
const Job = require('../models/job');

const ALLOWED_TRANSITIONS = {
  applied: ['shortlisted', 'rejected'],
  shortlisted: ['hired', 'rejected'],
  rejected: [],
  hired: [],
};

function isJobOwner(job, userId) {
  return job.postedBy.toString() === userId.toString();
}

async function applyToJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.status === 'closed') {
      return res.status(409).json({
        success: false,
        message: 'This job is closed and no longer accepts applications',
      });
    }

    const existing = await Application.findOne({ job: job._id, candidate: req.user._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already applied to this job' });
    }

    const application = await Application.create({
      job: job._id,
      candidate: req.user._id,
      coverLetter: req.body.coverLetter ? req.body.coverLetter.trim() : '',
    });

    await application.populate('job', 'title companyName location type salary status');

    return res.status(201).json({ success: true, message: 'Application submitted', application });
  } catch (err) {
    return next(err);
  }
}

async function getMyApplications(req, res, next) {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .populate('job', 'title companyName location type salary status')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: 'Applications fetched',
      count: applications.length,
      applications,
    });
  } catch (err) {
    return next(err);
  }
}

async function getJobApplications(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (!isJobOwner(job, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only view applications for your own jobs',
      });
    }

    const filter = { job: job._id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const applications = await Application.find(filter)
      .populate('candidate', 'name email')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: 'Applications fetched',
      count: applications.length,
      applications,
    });
  } catch (err) {
    return next(err);
  }
}

async function updateApplicationStatus(req, res, next) {
  try {
    const application = await Application.findById(req.params.id).populate(
      'job',
      'title companyName postedBy'
    );
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (!application.job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (!isJobOwner(application.job, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update applications for your own jobs',
      });
    }

    const nextStatus = req.body.status;
    if (!ALLOWED_TRANSITIONS[application.status].includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `An application cannot move from ${application.status} to ${nextStatus}`,
      });
    }

    application.status = nextStatus;
    await application.save();
    await application.populate('candidate', 'name email');

    return res.json({
      success: true,
      message: 'Application status updated',
      application,
    });
  } catch (err) {
    return next(err);
  }
}

async function withdrawApplication(req, res, next) {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (application.candidate.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only withdraw your own application',
      });
    }
    if (application.status !== 'applied') {
      return res.status(400).json({
        success: false,
        message: 'You can only withdraw an application while it is in the applied stage',
      });
    }

    await application.deleteOne();

    return res.json({ success: true, message: 'Application withdrawn' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
};
