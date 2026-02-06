const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagement';

// Middleware
app.use(cors());
app.use(express.json());

// Task model
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

const Task = mongoose.model('Task', taskSchema);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
});

// Get a single task by ID
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Server error while fetching task' });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, status } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Prevent duplicate task titles (case-insensitive)
    const existingWithTitle = await Task.findOne({
      title: { $regex: new RegExp(`^${title.trim()}$`, 'i') }
    });
    if (existingWithTitle) {
      return res
        .status(400)
        .json({ message: 'A task with this title already exists.' });
    }

    const task = new Task({
      title: title.trim(),
      description: (description || '').trim(),
      status: status || 'pending'
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error while creating task' });
  }
});

// Update an existing task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, description, status } = req.body;

    const updates = {};
    if (typeof title === 'string') updates.title = title.trim();
    if (typeof description === 'string') updates.description = description.trim();
    if (typeof status === 'string') updates.status = status;

    // If title is being changed, ensure it doesn't clash with another task's title
    if (updates.title) {
      const existingWithTitle = await Task.findOne({
        _id: { $ne: req.params.id },
        title: { $regex: new RegExp(`^${updates.title}$`, 'i') }
      });
      if (existingWithTitle) {
        return res
          .status(400)
          .json({ message: 'A task with this title already exists.' });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error while updating task' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
});

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });

