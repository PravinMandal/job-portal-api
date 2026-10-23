const { body, param, query, validationResult } = require('express-validator');

const JOB_TYPES = ['full-time', 'part-time', 'internship', 'remote'];
const APPLICATION_STATUSES = ['applied', 'shortlisted', 'rejected', 'hired'];
const SORT_FIELDS = ['createdAt', '-createdAt', 'salary', '-salary', 'title', '-title'];

// express-validator checks every item when a value is an array, so repeated
// query fields or array bodies could slip through as a list. Scalars should
// arrive as a single value. The skills field is the one exception.
function singleValueInput(req, res, next) {
  for (const [key, value] of Object.entries(req.body || {})) {
    if (key === 'skills') continue;
    if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
      return res.status(400).json({ success: false, message: `${key} must be a single value` });
    }
  }

  for (const [key, value] of Object.entries(req.query || {})) {
    if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
      return res.status(400).json({ success: false, message: `${key} must be a single value` });
    }
  }

  return next();
}

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array({ onlyFirstError: true })[0].msg,
    });
  }
  return next();
}

const registerRules = [
  body('name')
    .isString()
    .withMessage('Name must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 80 })
    .withMessage('Name cannot exceed 80 characters'),
  body('email')
    .isString()
    .withMessage('Email must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isString()
    .withMessage('Role must be a string')
    .bail()
    .isIn(['candidate', 'employer'])
    .withMessage('Role must be either candidate or employer'),
  body('companyName').custom((value, { req }) => {
    if (value !== undefined && typeof value !== 'string') {
      throw new Error('Company name must be a string');
    }
    if (req.body.role === 'employer' && (!value || !value.trim())) {
      throw new Error('Company name is required for employers');
    }
    return true;
  }),
  handleValidation,
];

const loginRules = [
  body('email')
    .isString()
    .withMessage('Email must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isString()
    .withMessage('Password must be a string')
    .bail()
    .notEmpty()
    .withMessage('Password is required'),
  handleValidation,
];

const jobIdParam = param('id').isMongoId().withMessage('Invalid job id');
const applicationIdParam = param('id').isMongoId().withMessage('Invalid application id');

const createJobRules = [
  body('title')
    .isString()
    .withMessage('Job title must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Job title is required')
    .isLength({ max: 100 })
    .withMessage('Job title cannot exceed 100 characters'),
  body('description')
    .isString()
    .withMessage('Description must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),
  body('companyName')
    .optional()
    .isString()
    .withMessage('Company name must be a string')
    .bail()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('location')
    .isString()
    .withMessage('Location must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('type')
    .isString()
    .withMessage('Job type must be a string')
    .bail()
    .notEmpty()
    .withMessage('Job type is required')
    .isIn(JOB_TYPES)
    .withMessage('Job type must be full-time, part-time, internship or remote'),
  body('salary')
    .notEmpty()
    .withMessage('Salary is required')
    .isFloat({ gt: 0 })
    .withMessage('Salary must be a positive number')
    .custom((value) => Number.isFinite(Number(value)))
    .withMessage('Salary must be a finite number')
    .toFloat(),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array of strings'),
  body('skills.*')
    .optional()
    .isString()
    .withMessage('Each skill must be a string')
    .trim()
    .notEmpty()
    .withMessage('Each skill must be a non-empty string'),
  handleValidation,
];

const updateJobRules = [
  body('title')
    .optional()
    .isString()
    .withMessage('Job title must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Job title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Job title cannot exceed 100 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),
  body('companyName')
    .optional()
    .isString()
    .withMessage('Company name must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Company name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Location cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('type')
    .optional()
    .isString()
    .withMessage('Job type must be a string')
    .bail()
    .isIn(JOB_TYPES)
    .withMessage('Job type must be full-time, part-time, internship or remote'),
  body('salary')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Salary must be a positive number')
    .custom((value) => Number.isFinite(Number(value)))
    .withMessage('Salary must be a finite number')
    .toFloat(),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array of strings'),
  body('skills.*')
    .optional()
    .isString()
    .withMessage('Each skill must be a string')
    .trim()
    .notEmpty()
    .withMessage('Each skill must be a non-empty string'),
  handleValidation,
];

const listJobsRules = [
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .bail()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search is too long'),
  query('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
    .bail()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location is too long'),
  query('type')
    .optional()
    .isString()
    .withMessage('Job type must be a string')
    .bail()
    .isIn(JOB_TYPES)
    .withMessage('Job type must be full-time, part-time, internship or remote'),
  query('skill')
    .optional()
    .isString()
    .withMessage('Skill must be a string')
    .bail()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Skill is too long'),
  query('minSalary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number')
    .custom((value) => Number.isFinite(Number(value)))
    .withMessage('Minimum salary must be a finite number')
    .toFloat(),
  query('sort')
    .optional()
    .isString()
    .withMessage('Sort must be a string')
    .bail()
    .isIn(SORT_FIELDS)
    .withMessage(`Sort must be one of: ${SORT_FIELDS.join(', ')}`),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  handleValidation,
];

const applyRules = [
  jobIdParam,
  body('coverLetter')
    .optional()
    .isString()
    .withMessage('Cover letter must be a string')
    .isLength({ max: 2000 })
    .withMessage('Cover letter cannot exceed 2000 characters'),
  handleValidation,
];

const jobApplicationsRules = [
  jobIdParam,
  query('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .bail()
    .isIn(APPLICATION_STATUSES)
    .withMessage('Status must be applied, shortlisted, rejected or hired'),
  handleValidation,
];

const updateStatusRules = [
  applicationIdParam,
  body('status')
    .isString()
    .withMessage('Status must be a string')
    .bail()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(APPLICATION_STATUSES)
    .withMessage('Status must be applied, shortlisted, rejected or hired'),
  handleValidation,
];

const jobIdRules = [jobIdParam, handleValidation];
const applicationIdRules = [applicationIdParam, handleValidation];

module.exports = {
  JOB_TYPES,
  singleValueInput,
  APPLICATION_STATUSES,
  registerRules,
  loginRules,
  createJobRules,
  updateJobRules,
  listJobsRules,
  applyRules,
  jobApplicationsRules,
  updateStatusRules,
  jobIdRules,
  applicationIdRules,
};
