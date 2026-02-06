## Professional Task Management Web App

Node.js + Express + MongoDB backend with a React-based frontend for managing professional tasks (create, view, update, delete).

### Tech Stack

- **Frontend**: React (via CDN), HTML, CSS, vanilla JS (no build step)
- **Backend**: Node.js, Express
- **Database**: MongoDB (via Mongoose)

### Project Structure

- `backend/` – Node + Express API server
  - `server.js` – main server entry
  - `package.json` – backend dependencies and scripts
- `frontend/` – React-based SPA served as static files
  - `index.html` – shell that loads React and `app.js`
  - `styles.css` – responsive UI styles
  - `app.js` – React app (task list, filters, CRUD)

---

## Backend Setup (Node + Express + MongoDB)

### 1. Prerequisites

- Node.js (LTS recommended)
- MongoDB running locally (default URI: `mongodb://localhost:27017/taskmanagement`)
  - You can change the URI via `MONGODB_URI` environment variable.

### 2. Install Dependencies

From the project root:

```bash
cd backend
npm install
```

### 3. Environment Variables (optional)

Create a `.env` file inside `backend/` if you want to override defaults:

```bash
MONGODB_URI=mongodb://localhost:27017/taskmanagement
PORT=5000
```

If you skip this step, the backend will use:

- `MONGODB_URI = mongodb://localhost:27017/taskmanagement`
- `PORT = 5000`

### 4. Run the Backend

Development (with `nodemon`, auto-restart on file changes):

```bash
cd backend
npm run dev
```

or plain Node:

```bash
cd backend
npm start
```

Backend will start on `http://localhost:5000`.

#### Available REST Endpoints

Base URL: `http://localhost:5000/api`

- **GET** `/tasks` – list all tasks
- **GET** `/tasks/:id` – get a single task by id
- **POST** `/tasks` – create a new task
  - body: `{ "title": string, "description": string, "status": "pending" | "in-progress" | "completed" }`
- **PUT** `/tasks/:id` – update an existing task
  - body can include `title`, `description`, `status`
- **DELETE** `/tasks/:id` – delete a task

Each task document has:

- `title` (required)
- `description` (optional)
- `status` (`pending`, `in-progress`, or `completed`)
- `createdAt`, `updatedAt` (timestamps from Mongoose)

---

## Frontend Setup (React SPA)

The frontend is a single-page React app that talks to the backend REST API.

### Option 1 – Open directly in browser

1. Make sure the backend is running on `http://localhost:5000`.
2. Open `frontend/index.html` in your browser (e.g. double-click or use “Open with Live Server” in VS Code).

The app will:

- Load React via CDN.
- Call `http://localhost:5000/api/tasks` for all CRUD actions.

### Option 2 – Serve with a simple static server (recommended)

From project root or `frontend/`, you can use any static server. Example using `npx serve`:

```bash
cd frontend
npx serve .
```

Then open the printed URL (e.g. `http://localhost:3000`) in your browser.

> Make sure CORS is enabled in the backend (already handled in `server.js`).

---

## How the App Works (High-Level)

- **Frontend**
  - React component tree in `app.js`:
    - Add / edit task form with fields: **Title**, **Description**, **Status**.
    - Task list with:
      - Status filter (All / Pending / In Progress / Completed)
      - Text search
      - Inline edit / delete actions.
  - Responsive design via `styles.css` to work nicely on desktop and mobile.

- **Backend**
  - `Express` + `Mongoose` connected to MongoDB.
  - `Task` model with:
    - `title`, `description`, `status`
    - `timestamps` (`createdAt`, `updatedAt`).
  - REST endpoints to perform full CRUD.

---

## Running End-to-End (Quick Start)

1. **Start MongoDB** locally.
2. **Start backend**:
   - `cd backend`
   - `npm install`
   - `npm run dev` (or `npm start`)
3. **Open frontend**:
   - Open `frontend/index.html` directly in your browser, **or**
   - Serve `frontend/` with any static server (e.g. `npx serve .`).

You now have a professional task management web app ready to demonstrate:

- Frontend (React + responsive UI)
- Backend (Node + Express REST API)
- Database (MongoDB with persistent storage)

