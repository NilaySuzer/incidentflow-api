const express = require('express');
const router = express.Router();

router.get('/summary', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Reports route çalışıyor'
  });
});

module.exports = router;