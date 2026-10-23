const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    type: {
      type: String,
      required: [true, 'Job type is required'],
      enum: {
        values: ['full-time', 'part-time', 'internship', 'remote'],
        message: 'Job type must be full-time, part-time, internship or remote',
      },
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [1, 'Salary must be a positive number'],
    },
    skills: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'closed'],
        message: 'Status must be open or closed',
      },
      default: 'open',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

jobSchema.index({ postedBy: 1, createdAt: -1 });
jobSchema.index({ status: 1, type: 1, location: 1 });

module.exports = mongoose.model('Job', jobSchema);
