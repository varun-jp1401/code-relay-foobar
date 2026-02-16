# Task Nexus — Enterprise Task Manager

A full-stack task management application built with **React**, **Vite**, **Node.js**, **Express**, and **MySQL**.

## Features

- **Authentication** — Register & Login with JWT tokens
- **Workspaces** — Organize teams and members
- **Projects** — Group tasks within workspaces with color coding
- **Tasks** — Kanban board and list views with priorities and due dates
- **Analytics** — Dashboard with task statistics and breakdown charts

## Project Structure

```
task-nexus/
├── server/             # Node.js + Express backend
│   ├── server.js       # Main server file (all routes)
│   └── package.json
├── client/             # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                   # Main app with routing
│   │   ├── App.css                   # Global styles
│   │   ├── main.jsx                  # Entry point
│   │   ├── modules/
│   │   │   ├── context/AuthContext.jsx   # Auth state management
│   │   │   ├── Layout.jsx                # App shell (sidebar + nav)
│   │   │   ├── UI/                       # Reusable UI components
│   │   │   └── TaskComponents/           # Task components
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Workspaces.jsx
│   │       ├── Projects.jsx
│   │       └── Tasks.jsx
│   ├── vite.config.js
│   └── package.json
├── database.sql        # MySQL schema
└── README.md
```

## Getting Started

1. **Fork** this repository by clicking the **Fork** button at the top right of the page.
2. **Clone** your forked repo:
   ```bash
   git clone https://github.com/<your-username>/code-relay-foobar.git
   cd code-relay-foobar
   ```
3. Follow the setup instructions below to get the app running locally.

## Setup Instructions

### Prerequisites

- **Node.js** v16 or higher
- **MySQL** (via XAMPP, WAMP, or standalone)

### 1. Database

1. Start your MySQL server.
2. Import the schema to create the database and tables:
   ```bash
   cd task-nexus
   mysql -u root -p < database.sql
   ```

### 2. Environment

Create a `.env` file in the `task-nexus/server/` directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=task_nexus
PORT=5000
```

Adjust credentials to match your local MySQL setup.

### 3. Backend

```bash
cd task-nexus/server
npm install
npm start
```

The server runs on **http://localhost:5000**

### 4. Frontend

Open a new terminal:

```bash
cd task-nexus/client
npm install
npm run dev
```

The client runs on **http://localhost:3000**

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | React 18, Vite, Axios, React Router, Lucide Icons |
| Backend | Node.js, Express, MySQL2, JSON Web Tokens |
| Database | MySQL with relational schema |
| Styling | Vanilla CSS with glassmorphism design |
