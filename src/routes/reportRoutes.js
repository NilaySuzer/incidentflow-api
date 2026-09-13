const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Raporlama Servisleri
router.get('/completed', reportController.getCompletedTasksReport);
router.get('/pending', reportController.getPendingTasksReport);
router.get('/summary', reportController.getSummaryReport);

module.exports = router;