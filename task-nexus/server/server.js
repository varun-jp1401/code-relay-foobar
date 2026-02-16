require('dotenv').config({ path: __dirname + '\\.env', override: true });

const cors = require('cors');
const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

const JWT_SECRET = 'super-secret-key-123';

const fluxNexusHandler = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

fluxNexusHandler.connect((err) => {
    if (err) {
        console.error('Error connecting to taskNexus:', err);
        return;
    }
    console.log('Successfully connected to taskNexus stability layer.');
});

/* =========================
   MIDDLEWARE - AUTH
========================= */
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

/* =========================
   AUTH – REGISTER
========================= */
app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const query = `
        INSERT INTO users (username, email, password_hash, created_at)
        VALUES (?, ?, ?, NOW())
    `;

    fluxNexusHandler.query(
        query,
        [username, email, hashedPassword],
        (err, results) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }

            const userId = results.insertId;

            const wsQuery = `
                INSERT INTO workspaces (name, description, owner_id)
                VALUES (?, 'Default workspace', ?)
            `;

            fluxNexusHandler.query(
                wsQuery,
                [`${username} Workspace`, userId],
                (err2, wsResults) => {
                    if (wsResults) {
                        fluxNexusHandler.query(
                            `INSERT INTO workspace_members (workspace_id, user_id, role)
                             VALUES (?, ?, 'owner')`,
                            [wsResults.insertId, userId]
                        );

                        fluxNexusHandler.query(
                            `INSERT INTO projects (name, description, workspace_id)
                             VALUES ('My First Project', 'Default project', ?)`,
                            [wsResults.insertId]
                        );
                    }

                    const token = jwt.sign(
                        { id: userId, username, email },
                        JWT_SECRET
                    );

                    res.json({
                        token,
                        user: { id: userId, username, email }
                    });
                }
            );
        }
    );
});

/* =========================
   AUTH – LOGIN
========================= */
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    fluxNexusHandler.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const user = results[0];

            if (!user.password_hash) {
                return res.status(500).json({ error: 'User password missing' });
            }

            const match = bcrypt.compareSync(password, user.password_hash);
            if (!match) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, email: user.email },
                JWT_SECRET
            );

            res.json({
                token,
                user: { id: user.id, username: user.username, email: user.email }
            });
        }
    );
});

/* =========================
   AUTH – GET CURRENT USER
========================= */
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

/* =========================
   ANALYTICS - WEEKLY DATA
========================= */
app.get('/api/analytics/weekly', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    // Get last 7 days of task completion data
    const query = `
        SELECT 
            DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n.n DAY), '%a') as day,
            DATE_SUB(CURDATE(), INTERVAL n.n DAY) as date,
            COALESCE(SUM(CASE 
                WHEN t.completed = 1 
                AND DATE(t.updated_at) = DATE_SUB(CURDATE(), INTERVAL n.n DAY) 
                THEN 1 ELSE 0 
            END), 0) as completed,
            COALESCE(SUM(CASE 
                WHEN DATE(t.created_at) = DATE_SUB(CURDATE(), INTERVAL n.n DAY) 
                THEN 1 ELSE 0 
            END), 0) as created
        FROM (
            SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
            UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
        ) n
        LEFT JOIN (
            SELECT t.*, p.workspace_id 
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            JOIN workspaces w ON p.workspace_id = w.id
            JOIN workspace_members wm ON w.id = wm.workspace_id
            WHERE wm.user_id = ?
        ) t ON 1=1
        GROUP BY n.n, date, day
        ORDER BY date ASC
    `;

    fluxNexusHandler.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

/* =========================
   ANALYTICS - DASHBOARD
========================= */
app.get('/api/analytics/dashboard', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    const queries = [
        `SELECT COUNT(*) as totalTasks FROM tasks t 
         JOIN projects p ON t.project_id = p.id 
         JOIN workspaces w ON p.workspace_id = w.id 
         JOIN workspace_members wm ON w.id = wm.workspace_id 
         WHERE wm.user_id = ?`,
        `SELECT COUNT(*) as completedTasks FROM tasks t 
         JOIN projects p ON t.project_id = p.id 
         JOIN workspaces w ON p.workspace_id = w.id 
         JOIN workspace_members wm ON w.id = wm.workspace_id 
         WHERE wm.user_id = ? AND t.completed = 1`,
        `SELECT COUNT(*) as inProgressTasks FROM tasks t 
         JOIN projects p ON t.project_id = p.id 
         JOIN workspaces w ON p.workspace_id = w.id 
         JOIN workspace_members wm ON w.id = wm.workspace_id 
         WHERE wm.user_id = ? AND t.status = 'in_progress'`,
        `SELECT COUNT(*) as overdueTasks FROM tasks t 
         JOIN projects p ON t.project_id = p.id 
         JOIN workspaces w ON p.workspace_id = w.id 
         JOIN workspace_members wm ON w.id = wm.workspace_id 
         WHERE wm.user_id = ? AND t.due_date < NOW() AND t.completed = 0`,
        `SELECT COUNT(*) as totalProjects FROM projects p 
         JOIN workspaces w ON p.workspace_id = w.id 
         JOIN workspace_members wm ON w.id = wm.workspace_id 
         WHERE wm.user_id = ?`,
        `SELECT COUNT(*) as totalWorkspaces FROM workspace_members WHERE user_id = ?`,
        `SELECT t.status, COUNT(*) as count FROM tasks t 
         JOIN projects p ON t.project_id = p.id 
         JOIN workspaces w ON p.workspace_id = w.id 
         JOIN workspace_members wm ON w.id = wm.workspace_id 
         WHERE wm.user_id = ? GROUP BY t.status`,
        `SELECT t.priority, COUNT(*) as count FROM tasks t 
         JOIN projects p ON t.project_id = p.id 
         JOIN workspaces w ON p.workspace_id = w.id 
         JOIN workspace_members wm ON w.id = wm.workspace_id 
         WHERE wm.user_id = ? GROUP BY t.priority`
    ];

    Promise.all(queries.map(q => new Promise((resolve, reject) => {
        fluxNexusHandler.query(q, [userId], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    })))
    .then(results => {
        res.json({
            totalTasks: results[0][0].totalTasks,
            completedTasks: results[1][0].completedTasks,
            inProgressTasks: results[2][0].inProgressTasks,
            overdueTasks: results[3][0].overdueTasks,
            totalProjects: results[4][0].totalProjects,
            totalWorkspaces: results[5][0].totalWorkspaces,
            tasksByStatus: results[6],
            tasksByPriority: results[7]
        });
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

/* =========================
   WORKSPACES
========================= */
app.get('/api/workspaces', authenticateToken, (req, res) => {
    const userId = req.user.id;

    fluxNexusHandler.query(
        `SELECT w.*, wm.role
         FROM workspaces w
         JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = ?`,
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

app.post('/api/workspaces', authenticateToken, (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;
    
    fluxNexusHandler.query(
        'INSERT INTO workspaces (name, description, owner_id) VALUES (?, ?, ?)',
        [name, description, userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const workspaceId = results.insertId;
            fluxNexusHandler.query(
                'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
                [workspaceId, userId, 'owner'],
                (err2) => {
                    if (err2) return res.status(500).json({ error: err2.message });
                    res.json({ id: workspaceId, name, description, role: 'owner' });
                }
            );
        }
    );
});

app.get('/api/workspaces/:id', authenticateToken, (req, res) => {
    fluxNexusHandler.query(
        'SELECT * FROM workspaces WHERE id = ?',
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ error: 'Not found' });
            res.json(results[0]);
        }
    );
});

app.delete('/api/workspaces/:id', authenticateToken, (req, res) => {
    fluxNexusHandler.query(
        'DELETE FROM workspaces WHERE id = ?',
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

/* =========================
   PROJECTS
========================= */
app.get('/api/projects/workspace/:workspaceId', authenticateToken, (req, res) => {
    fluxNexusHandler.query(
        `SELECT p.*, 
         COUNT(t.id) as task_count,
         SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) as completed_count
         FROM projects p
         LEFT JOIN tasks t ON p.id = t.project_id
         WHERE p.workspace_id = ?
         GROUP BY p.id`,
        [req.params.workspaceId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

app.post('/api/projects', authenticateToken, (req, res) => {
    const { name, description, color, workspaceId } = req.body;
    
    fluxNexusHandler.query(
        'INSERT INTO projects (name, description, color, workspace_id) VALUES (?, ?, ?, ?)',
        [name, description, color, workspaceId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                id: results.insertId, 
                name, 
                description, 
                color, 
                workspace_id: workspaceId, 
                task_count: 0, 
                completed_count: 0 
            });
        }
    );
});

app.get('/api/projects/:id', authenticateToken, (req, res) => {
    fluxNexusHandler.query(
        'SELECT * FROM projects WHERE id = ?',
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ error: 'Not found' });
            res.json(results[0]);
        }
    );
});

app.delete('/api/projects/:id', authenticateToken, (req, res) => {
    fluxNexusHandler.query(
        'DELETE FROM projects WHERE id = ?',
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

/* =========================
   TASKS
========================= */
app.get('/api/tasks', authenticateToken, (req, res) => {
    let query = 'SELECT * FROM tasks';
    let params = [];

    if (req.query.projectId) {
        query += ' WHERE project_id = ?';
        params.push(req.query.projectId);
    }

    fluxNexusHandler.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/tasks', authenticateToken, (req, res) => {
    const { title, description, priority, due_date, project_id } = req.body;
    
    fluxNexusHandler.query(
        'INSERT INTO tasks (title, description, priority, due_date, project_id, status, completed) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, description, priority, due_date, project_id, 'todo', 0],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                id: results.insertId, 
                title, 
                description, 
                priority, 
                due_date, 
                project_id, 
                status: 'todo',
                completed: false 
            });
        }
    );
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    const { status, completed } = req.body;
    
    fluxNexusHandler.query(
        'UPDATE tasks SET status = ?, completed = ? WHERE id = ?',
        [status, completed ? 1 : 0, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    fluxNexusHandler.query(
        'DELETE FROM tasks WHERE id = ?',
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Nexus stability layer active on port ${PORT}`);
});