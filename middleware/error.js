function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }

  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({
      success: false,
      message: first ? first.message : 'Validation failed',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid id format' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    const message =
      field === 'email' ? 'Email is already registered' : 'You have already applied to this job';
    return res.status(409).json({ success: false, message });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

module.exports = errorHandler;
