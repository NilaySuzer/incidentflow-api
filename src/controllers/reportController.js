const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/tasks.json');

const readTasksFromFile = () => {
  try {
    const fileData = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(fileData || '[]');
  } catch (error) {
    return [];
  }
};

// 1. GET /reports/completed
// Çözülen / tamamlanan görevler (status: completed veya resolved)
exports.getCompletedTasksReport = (req, res) => {
  const tasks = readTasksFromFile();
  const completedTasks = tasks.filter(
    (t) => t.status === 'completed' || t.status === 'resolved'
  );

  res.status(200).json({
    success: true,
    reportType: 'completed_tasks',
    count: completedTasks.length,
    data: completedTasks
  });
};

// 2. GET /reports/pending
// Bekleyen / aktif müdahale edilen görevler (status: pending veya investigating/in_progress)
exports.getPendingTasksReport = (req, res) => {
  const tasks = readTasksFromFile();
  const pendingTasks = tasks.filter(
    (t) =>
      t.status === 'pending' ||
      t.status === 'investigating' ||
      t.status === 'in_progress'
  );

  res.status(200).json({
    success: true,
    reportType: 'pending_tasks',
    count: pendingTasks.length,
    data: pendingTasks
  });
};

// 3. GET /reports/summary
// Genel Sistem Özeti (Toplam vaka, durum ve öncelik istatistikleri)
exports.getSummaryReport = (req, res) => {
  const tasks = readTasksFromFile();

  const summary = {
    totalTasks: tasks.length,
    byStatus: {
      investigating: tasks.filter((t) => t.status === 'investigating').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      resolved: tasks.filter(
        (t) => t.status === 'resolved' || t.status === 'completed'
      ).length,
      pending: tasks.filter((t) => t.status === 'pending').length
    },
    byPriority: {
      P0: tasks.filter((t) => t.priority === 'P0' || t.priority === 'high').length,
      P1: tasks.filter((t) => t.priority === 'P1').length,
      P2: tasks.filter((t) => t.priority === 'P2' || t.priority === 'medium').length,
      P3: tasks.filter((t) => t.priority === 'P3' || t.priority === 'low').length
    },
    activeAssignees: [...new Set(tasks.map((t) => t.assignee))],
    generatedAt: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    data: summary
  });
};