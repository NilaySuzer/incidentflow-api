const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/tasks.json');

// Yardımcı fonksiyonlar: Dosyadan oku / Dosyaya yaz
const readTasksFromFile = () => {
  try {
    const fileData = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(fileData || '[]');
  } catch (error) {
    return [];
  }
};

const writeTasksToFile = (tasks) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(tasks, null, 2), 'utf-8');
};

// 1. Görev / Incident Listeleme (Filtreleme, Sıralama, Sayfalama dahil)
exports.getAllTasks = (req, res) => {
  let tasks = readTasksFromFile();
  const { status, priority, sort, page = 1, limit = 10 } = req.query;

  // Duruma göre filtreleme
  if (status) {
    tasks = tasks.filter(t => t.status.toLowerCase() === status.toLowerCase());
  }

  // Önceliğe göre filtreleme
  if (priority) {
    tasks = tasks.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
  }

  // Sıralama (createdAt)
  if (sort === 'createdAt') {
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Sayfalama (Pagination)
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedTasks = tasks.slice(startIndex, startIndex + limitNum);

  res.status(200).json({
    success: true,
    total: tasks.length,
    page: pageNum,
    limit: limitNum,
    data: paginatedTasks
  });
};

// 2. Tekil Görev Detayı
exports.getTaskById = (req, res) => {
  const tasks = readTasksFromFile();
  const { id } = req.params;

  const task = tasks.find(t => String(t.id) === String(id));

  if (!task) {
    return res.status(404).json({
      success: false,
      message: `ID değeri ${id} olan görev bulunamadı.`
    });
  }

  res.status(200).json({
    success: true,
    data: task
  });
};

// 3. Yeni Görev / Incident Ekleme
exports.createTask = (req, res) => {
  const tasks = readTasksFromFile();
  const { title, description, priority, assignee, environment } = req.body;

  const newTask = {
    id: `inc-${Date.now()}`,
    title: title.trim(),
    description: description.trim(),
    priority,
    status: 'investigating',
    assignee: assignee.trim(),
    environment: environment || 'production',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tasks.push(newTask);
  writeTasksToFile(tasks);

  res.status(201).json({
    success: true,
    message: 'Görev başarıyla oluşturuldu.',
    data: newTask
  });
};

// 4. Görev Güncelleme
exports.updateTask = (req, res) => {
  const tasks = readTasksFromFile();
  const { id } = req.params;
  const { title, description, priority, status, assignee, environment } = req.body;

  const taskIndex = tasks.findIndex(t => String(t.id) === String(id));

  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `ID değeri ${id} olan görev bulunamadı.`
    });
  }

  const existingTask = tasks[taskIndex];

  const updatedTask = {
    ...existingTask,
    title: title !== undefined ? title.trim() : existingTask.title,
    description: description !== undefined ? description.trim() : existingTask.description,
    priority: priority || existingTask.priority,
    status: status || existingTask.status,
    assignee: assignee !== undefined ? assignee.trim() : existingTask.assignee,
    environment: environment || existingTask.environment,
    updatedAt: new Date().toISOString()
  };

  tasks[taskIndex] = updatedTask;
  writeTasksToFile(tasks);

  res.status(200).json({
    success: true,
    message: 'Görev başarıyla güncellendi.',
    data: updatedTask
  });
};

// 5. Görev Silme
exports.deleteTask = (req, res) => {
  const tasks = readTasksFromFile();
  const { id } = req.params;

  const taskIndex = tasks.findIndex(t => String(t.id) === String(id));

  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `ID değeri ${id} olan görev bulunamadı.`
    });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  writeTasksToFile(tasks);

  res.status(200).json({
    success: true,
    message: 'Görev başarıyla silindi.',
    data: deletedTask
  });
};


exports.searchTasks = (req, res) => {
  const tasks = readTasksFromFile();
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({
      success: false,
      message: 'Lütfen aranacak bir keyword parametresi girin.'
    });
  }

  const query = keyword.toLowerCase();
  const matched = tasks.filter(t => 
    t.title.toLowerCase().includes(query) || 
    t.description.toLowerCase().includes(query)
  );

  res.status(200).json({
    success: true,
    count: matched.length,
    data: matched
  });
};


exports.getTasksByAssignee = (req, res) => {
  const tasks = readTasksFromFile();
  const { assignee } = req.params;

  const matched = tasks.filter(t => t.assignee.toLowerCase() === assignee.toLowerCase());

  res.status(200).json({
    success: true,
    count: matched.length,
    data: matched
  });
};