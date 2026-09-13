const validateTask = (req, res, next) => {
  const { title, description, priority, assignee } = req.body;
  const validPriorities = ['P0', 'P1', 'P2', 'P3', 'high', 'medium', 'low'];

  const missingFields = [];
  if (!title || typeof title !== 'string' || title.trim() === '') missingFields.push('title');
  if (!description || typeof description !== 'string' || description.trim() === '') missingFields.push('description');
  if (!priority) missingFields.push('priority');
  if (!assignee || typeof assignee !== 'string' || assignee.trim() === '') missingFields.push('assignee');

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: `Eksik veya hatalı zorunlu alanlar: ${missingFields.join(', ')}`
    });
  }

  if (!validPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: `Geçersiz priority seviyesi. İzin verilenler: ${validPriorities.join(', ')}`
    });
  }

  next();
};

module.exports = validateTask;