require('dotenv').config({ path: __dirname + '\\.env', override: true });

const cors = require('cors');
const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

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
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const user = results[0];

            const passwordMatch = bcrypt.compareSync(password, user.password_hash);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });
        }
    );
});



/* =========================
   WORKSPACES
========================= */
app.get('/api/workspaces', (req, res) => {
    let userId = 1;

    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) userId = jwt.verify(token, JWT_SECRET).id;
    } catch {}

    fluxNexusHandler.query(
        `SELECT w.*, wm.role
         FROM workspaces w
         JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = ?`,
        [userId],
        (err, results) => {
            if (err) return res.status(500).send('Error');
            res.json(results);
        }
    );
});

/* =========================
   PROJECTS
========================= */
app.get('/api/projects/workspace/:workspaceId', (req, res) => {
    fluxNexusHandler.query(
        'SELECT * FROM projects WHERE workspace_id = ?',
        [req.params.workspaceId],
        (err, results) => {
            if (err) return res.status(500).send('Error');
            res.json(results);
        }
    );
});

/* =========================
   TASKS
========================= */
app.get('/api/tasks', (req, res) => {
    let query = 'SELECT * FROM tasks';
    let params = [];

    if (req.query.projectId) {
        query += ' WHERE project_id = ?';
        params.push(req.query.projectId);
    }

    fluxNexusHandler.query(query, params, (err, results) => {
        if (err) return res.status(500).send('Error');
        res.json(results);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Nexus stability layer active on port ${PORT}`);
});
