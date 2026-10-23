require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const { singleValueInput } = require('./middleware/validation');
const errorHandler = require('./middleware/error');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(singleValueInput);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Job Portal API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
