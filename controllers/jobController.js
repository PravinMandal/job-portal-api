const mongoose = require('mongoose');
const Job = require('../models/job');
const Application = require('../models/application');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isOwner(job, userId) {
  return job.postedBy.toString() === userId.toString();
}

function findJobWithParam(id) {
  return Job.findById(id);
}

async function createJob(req, res, next) {
  try {
    const { title, description, location, type, salary } = req.body;
    const companyName = (req.body.companyName || req.user.companyName || '').trim();
    const skills = Array.isArray(req.body.skills)
      ? req.body.skills.map((skill) => skill.trim()).filter(Boolean)
      : [];

    const job = await Job.create({
      title: title.trim(),
      description: description.trim(),
      companyName,
      location: location.trim(),
      type,
      salary,
      skills,
      postedBy: req.user._id,
    });

    return res.status(201).json({ success: true, message: 'Job created', job });
  } catch (err) {
    return next(err);
  }
}

async function getJobs(req, res, next) {
  try {
    const { search, location, type, skill, minSalary, sort = '-createdAt' } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const filter = {};

    if (search) {
      const pattern = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: pattern }, { companyName: pattern }];
    }
    if (location) {
      filter.location = new RegExp(escapeRegex(location.trim()), 'i');
    }
    if (type) {
      filter.type = type;
    }
    if (skill) {
      filter.skills = new RegExp(escapeRegex(skill.trim()), 'i');
    }
    if (minSalary !== undefined) {
      filter.salary = { $gte: Number(minSalary) };
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortOrder = sort.startsWith('-') ? -1 : 1;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Job.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('postedBy', 'name companyName'),
      Job.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: data.length,
      data,
    });
  } catch (err) {
    return next(err);
  }
}

async function getJob(req, res, next) {
  try {
    const job = await findJobWithParam(req.params.id).populate('postedBy', 'name companyName');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    return res.json({ success: true, message: 'Job fetched', job });
  } catch (err) {
    return next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const job = await findJobWithParam(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (!isOwner(job, req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only update your own jobs' });
    }

    const allowed = ['title', 'description', 'companyName', 'location', 'type', 'salary', 'skills'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    if (updates.skills) {
      updates.skills = updates.skills.map((skill) => skill.trim()).filter(Boolean);
    }

    Object.assign(job, updates);
    await job.save();

    return res.json({ success: true, message: 'Job updated', job });
  } catch (err) {
    return next(err);
  }
}

async function closeJob(req, res, next) {
  try {
    const job = await findJobWithParam(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (!isOwner(job, req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only close your own jobs' });
    }

    job.status = 'closed';
    await job.save();

    return res.json({ success: true, message: 'Job closed', job });
  } catch (err) {
    return next(err);
  }
}

async function deleteJob(req, res, next) {
  try {
    const job = await findJobWithParam(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (!isOwner(job, req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own jobs' });
    }

    await Application.deleteMany({ job: job._id });
    await job.deleteOne();

    return res.json({ success: true, message: 'Job and its applications deleted' });
  } catch (err) {
    return next(err);
  }
}

async function getJobStats(req, res, next) {
  try {
    const job = await findJobWithParam(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (!isOwner(job, req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only view statistics for your own jobs' });
    }

    const rows = await Application.aggregate([
      { $match: { job: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const stats = { applied: 0, shortlisted: 0, rejected: 0, hired: 0 };
    for (const row of rows) {
      stats[row._id] = row.count;
    }

    return res.json({
      success: true,
      message: 'Job statistics fetched',
      jobId: job._id,
      total: stats.applied + stats.shortlisted + stats.rejected + stats.hired,
      stats,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createJob,
  getJobs,
  getJob,
  updateJob,
  closeJob,
  deleteJob,
  getJobStats,
};
