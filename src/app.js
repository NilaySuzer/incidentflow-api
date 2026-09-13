const express = require('express');
const logger = require('./middlewares/logger');

// Rotaları içeri alıyoruz
const taskRoutes = require('./routes/taskRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Body Parser Middleware (JSON istek gövdelerini okumak için)
app.use(express.json());

// Zorunlu Temel Middleware: Logger
app.use(logger);

// Ana karşılama / Health-check endpoint'i
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'IncidentFlow SRE & Incident Management API is live 🚀',
    version: '1.0.0'
  });
});

// Route yönlendirmeleri
app.use('/tasks', taskRoutes);
app.use('/reports', reportRoutes);

// Tanımlanmamış rotalar için 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint bulunamadı: ${req.method} ${req.originalUrl}`
  });
});

module.exports = app;