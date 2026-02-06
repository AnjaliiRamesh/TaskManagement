const { useState, useEffect } = React;

const API_BASE_URL = 'http://localhost:5000/api';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function StatusTag({ status }) {
  let className = 'task-status-tag ';
  if (status === 'pending') className += 'task-status-pending';
  else if (status === 'in-progress') className += 'task-status-in-progress';
  else if (status === 'completed') className += 'task-status-completed';

  return <span className={className}>{status.replace('-', ' ')}</span>;
}

function TaskCard({ task, onEdit, onDelete }) {
  return (
    <div className="task-card" onClick={() => onEdit(task)}>
      <div className="task-main">
        <div className="task-title-row">
          <div className="task-title">{task.title}</div>
        </div>
        <div className="task-meta">
          <StatusTag status={task.status} />
        </div>
        {task.description && (
          <div className="task-description">{task.description}</div>
        )}
      </div>
      <div className="task-side">
        <div className="task-date">
          {task.createdAt ? `Created ${formatDate(task.createdAt)}` : ''}
        </div>
        <div
          className="task-actions"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            className="btn btn-ghost btn-small"
            type="button"
            onClick={() => onEdit(task)}
          >
            Edit
          </button>
          <button
            className="btn btn-danger btn-small"
            type="button"
            onClick={() => onDelete(task)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, status, active, onClick }) {
  const classes = ['filter-chip'];
  if (active) classes.push('filter-chip-active');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={() => onClick(status)}
    >
      <span
        className={
          'filter-dot ' +
          (status === 'all'
            ? 'filter-dot-all'
            : status === 'pending'
            ? 'filter-dot-pending'
            : status === 'in-progress'
            ? 'filter-dot-in-progress'
            : 'filter-dot-completed')
        }
      />
      {label}
    </button>
  );
}

function TaskForm({
  mode,
  form,
  onChange,
  onSubmit,
  onReset,
  loading,
  disabled
}) {
  const isEditing = mode === 'edit';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && !loading) {
          onSubmit();
        }
      }}
    >
      <div className="field-group">
        <div className="field">
          <label className="field-label">
            Title <span>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Prepare weekly status report"
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="field-label">Description</label>
          <textarea
            placeholder="Add context, links, and expectations..."
            value={form.description}
            onChange={(e) =>
              onChange({
                ...form,
                description: e.target.value
              })
            }
          />
        </div>
        <div className="field">
          <label className="field-label">Status</label>
          <select
            value={form.status}
            onChange={(e) => onChange({ ...form, status: e.target.value })}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="actions">
        <button
          className="btn btn-primary"
          type="submit"
          disabled={disabled || loading}
        >
          {loading ? 'Saving…' : isEditing ? 'Update Task' : 'Add Task'}
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={onReset}
          disabled={loading}
        >
          Clear
        </button>
      </div>
    </form>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast">
      <span className="toast-dot" />
      <span>{message}</span>
    </div>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [theme, setTheme] = useState('light');

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'pending'
  });

  const [mode, setMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  async function fetchTasks() {
    try {
      setInitialLoading(true);
      setError('');
      const res = await fetch(`${API_BASE_URL}/tasks`);
      if (!res.ok) {
        throw new Error('Failed to load tasks');
      }
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load tasks. Ensure backend is running on port 5000.');
    } finally {
      setInitialLoading(false);
    }
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }

    // Frontend check: prevent duplicate titles (case-insensitive)
    const normalizedNewTitle = form.title.trim().toLowerCase();
    const hasDuplicateTitle = tasks.some((t) => {
      const sameTitle = t.title.trim().toLowerCase() === normalizedNewTitle;
      const sameTask = editingId && t._id === editingId;
      return sameTitle && !sameTask;
    });
    if (hasDuplicateTitle) {
      setError('A task with this title already exists.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status
    };

    try {
      let res;
      if (mode === 'edit' && editingId) {
        res = await fetch(`${API_BASE_URL}/tasks/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const msg = (await res.json()).message || 'Request failed';
        throw new Error(msg);
      }

      await fetchTasks();
      setToast(mode === 'edit' ? 'Task updated' : 'Task created');
      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      title: '',
      description: '',
      status: 'pending'
    });
    setMode('create');
    setEditingId(null);
  }

  function handleEdit(task) {
    setMode('edit');
    setEditingId(task._id);
    setForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'pending'
    });
  }

  async function handleDelete(task) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${task._id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const msg = (await res.json()).message || 'Delete failed';
        throw new Error(msg);
      }
      await fetchTasks();
      setToast('Task deleted');
      if (editingId === task._id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  }

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus =
      filterStatus === 'all' ? true : t.status === filterStatus;
    const needle = search.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      t.title.toLowerCase().includes(needle) ||
      (t.description || '').toLowerCase().includes(needle);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <>
      <div className="app-shell">
        <header className="app-header">
          <div className="header-main">
            <h1 className="app-title">Taskora</h1>
            <p className="app-subtitle">
              A clean workspace to capture, organize, and complete your tasks.
            </p>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
            <span className="tasks-count-label">{tasks.length} tasks</span>
          </div>
        </header>

        <main className="layout">
          <section className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  {mode === 'edit' ? 'Update Task' : 'Add New Task'}
                </div>
                <div className="card-subtitle">
                  {mode === 'edit'
                    ? 'Make quick adjustments and keep everything up to date.'
                    : 'Add a clear title and a short description so future you knows what to do.'}
                </div>
              </div>
            </div>

            <TaskForm
              mode={mode}
              form={form}
              onChange={setForm}
              onSubmit={handleSubmit}
              onReset={resetForm}
              loading={loading}
              disabled={initialLoading}
            />

            {error && <div className="error-banner">{error}</div>}
          </section>

          <section className="card">
            <div className="list-header">
              <div>
                <div className="card-title">Tasks</div>
                <div className="card-subtitle">
                  {initialLoading
                    ? 'Loading tasks from API…'
                    : tasks.length === 0
                    ? 'No tasks yet. Start by adding one on the left.'
                    : `Showing ${filteredTasks.length} of ${tasks.length} tasks.`}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="filters">
                  <FilterChip
                    status="all"
                    label="All"
                    active={filterStatus === 'all'}
                    onClick={setFilterStatus}
                  />
                  <FilterChip
                    status="pending"
                    label="Pending"
                    active={filterStatus === 'pending'}
                    onClick={setFilterStatus}
                  />
                  <FilterChip
                    status="in-progress"
                    label="In Progress"
                    active={filterStatus === 'in-progress'}
                    onClick={setFilterStatus}
                  />
                  <FilterChip
                    status="completed"
                    label="Completed"
                    active={filterStatus === 'completed'}
                    onClick={setFilterStatus}
                  />
                </div>
                <input
                  className="search-input"
                  type="text"
                  placeholder="Quick search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="tasks-list">
              {initialLoading ? (
                <div className="empty-state">
                  <div className="empty-visual">⏳</div>
                  <div className="empty-title">Connecting to your API…</div>
                  <div>Make sure the backend server is running.</div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-visual">📝</div>
                  <div className="empty-title">Nothing to show yet</div>
                  <div>
                    Try adjusting filters or create a new task on the left.
                  </div>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      <Toast message={toast} />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

