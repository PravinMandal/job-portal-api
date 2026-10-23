const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

function publicUser(user) {
  const result = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (user.role === 'employer') {
    result.companyName = user.companyName;
  }

  return result;
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const role = req.body.role || 'candidate';
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      companyName: role === 'employer' ? req.body.companyName.trim() : undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    return next(err);
  }
}

async function getMe(req, res) {
  return res.json({ success: true, message: 'Profile fetched', user: publicUser(req.user) });
}

module.exports = { register, login, getMe };
