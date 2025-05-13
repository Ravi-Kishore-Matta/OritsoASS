const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = 'mongodb://127.0.0.1:27017/task_management';

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Task Schema
const taskSchema = new mongoose.Schema({
  taskTitle: { type: String, required: true },
  taskDescription: String,
  taskDueDate: { type: Date, required: true },
  taskStatus: { type: String, required: true, enum: ['Pending', 'In Progress', 'Completed'] },
  taskRemarks: String,
  createdOn: { type: Date, default: Date.now },
  lastUpdatedOn: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  lastUpdatedBy: { type: String, required: true }
});

taskSchema.pre('save', function (next) {
  this.lastUpdatedOn = new Date();
  next();
});

const Task = mongoose.model('Task', taskSchema);

// Routes

// Create
app.post('/tasks', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(400).json({ error: err.message });
  }
});

// Read All or Search
app.get('/tasks', async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q
      ? {
          $or: [
            { taskTitle: new RegExp(q, 'i') },
            { taskDescription: new RegExp(q, 'i') },
            { taskStatus: new RegExp(q, 'i') },
            { taskRemarks: new RegExp(q, 'i') },
            { createdBy: new RegExp(q, 'i') },
            { lastUpdatedBy: new RegExp(q, 'i') },
          ],
        }
      : {};
    const tasks = await Task.find(filter).sort({ taskDueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Read One
app.get('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update
app.put('/tasks/:id', async (req, res) => {
  try {
    const updated = {
      ...req.body,
      lastUpdatedOn: new Date(),
    };
    const task = await Task.findByIdAndUpdate(req.params.id, updated, {
      new: true,
      runValidators: true,
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete
app.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
