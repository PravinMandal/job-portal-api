const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job is required'],
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Candidate is required'],
    },
    coverLetter: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['applied', 'shortlisted', 'rejected', 'hired'],
        message: 'Status must be applied, shortlisted, rejected or hired',
      },
      default: 'applied',
    },
  },
  { timestamps: true }
);

// A candidate can apply to a job only once, and the database enforces it too.
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ candidate: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
