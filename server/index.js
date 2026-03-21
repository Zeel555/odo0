require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route imports
const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const bomRoutes      = require('./routes/bom');
const ecoRoutes      = require('./routes/eco');
const reportRoutes   = require('./routes/reports');
const settingsRoutes = require('./routes/settings');

const app = express();

// Middleware
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bom',      bomRoutes);
app.use('/api/eco',      ecoRoutes);
app.use('/api/reports',  reportRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
