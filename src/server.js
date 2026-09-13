const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`IncidentFlow API Server running on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/`);
  console.log(`Tasks API:    http://localhost:${PORT}/tasks`);
  console.log(`Reports API:  http://localhost:${PORT}/reports/summary`);
  console.log(`========================================`);
});