import express from 'express';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database('database.sqlite');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS surveys (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  
  CREATE TABLE IF NOT EXISTS survey_events (
    id TEXT PRIMARY KEY,
    surveyId TEXT,
    eventName TEXT,
    actor TEXT,
    triggerCondition TEXT,
    systemAction TEXT,
    outcomeState TEXT,
    timestamp TEXT,
    FOREIGN KEY(surveyId) REFERENCES surveys(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    data TEXT
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Seed data if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM surveys').get() as { count: number };
  if (count.count === 0) {
    try {
      const { dummySurveys } = await import('./src/data.ts');
      const insert = db.prepare('INSERT INTO surveys (id, data) VALUES (?, ?)');
      const insertMany = db.transaction((surveys: any[]) => {
        for (const survey of surveys) {
          insert.run(survey.id, JSON.stringify(survey));
        }
      });
      insertMany(dummySurveys);
      console.log('Seeded database with dummy surveys');
    } catch (err) {
      console.error('Failed to seed data:', err);
    }
  }

  const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number };
  if (docCount.count === 0) {
    try {
      const { INITIAL_DOCS } = await import('./src/data/documents.ts');
      const insert = db.prepare('INSERT INTO documents (id, data) VALUES (?, ?)');
      const insertMany = db.transaction((docs: any[]) => {
        for (const doc of docs) {
          insert.run(doc.id, JSON.stringify(doc));
        }
      });
      insertMany(INITIAL_DOCS);
      console.log('Seeded database with initial documents');
    } catch (err) {
      console.error('Failed to seed documents:', err);
    }
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const initialUsers = [
      { id: '1', name: 'Jay Vadolkar', email: 'jayvadolkar1@gmail.com', role: 'admin', department: 'Global Admin' },
      { id: '2', name: 'John Doe', email: 'john@example.com', role: 'manager', department: 'Claims Management' },
      { id: '3', name: 'Alice Smith', email: 'alice@example.com', role: 'handler', department: 'Field Operations' },
    ];
    const insert = db.prepare('INSERT INTO users (id, data) VALUES (?, ?)');
    for (const user of initialUsers) {
      insert.run(user.id, JSON.stringify(user));
    }
  }

  // API Routes
  app.get('/api/documents', (req, res) => {
    try {
      const rows = db.prepare('SELECT data FROM documents').all() as { data: string }[];
      res.json(rows.map(row => JSON.parse(row.data)));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  app.post('/api/documents', (req, res) => {
    try {
      const docs = req.body;
      const insertDoc = db.prepare('INSERT OR REPLACE INTO documents (id, data) VALUES (?, ?)');
      
      const transaction = db.transaction((docs) => {
        db.prepare('DELETE FROM documents').run();
        for (const doc of docs) {
          insertDoc.run(doc.id, JSON.stringify(doc));
        }
      });
      
      transaction(docs);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save documents' });
    }
  });

  app.get('/api/users', (req, res) => {
    try {
      const rows = db.prepare('SELECT data FROM users').all() as { data: string }[];
      res.json(rows.map(row => JSON.parse(row.data)));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', (req, res) => {
    try {
      const users = req.body;
      const insertUser = db.prepare('INSERT OR REPLACE INTO users (id, data) VALUES (?, ?)');
      
      const transaction = db.transaction((users) => {
        db.prepare('DELETE FROM users').run();
        for (const user of users) {
          insertUser.run(user.id, JSON.stringify(user));
        }
      });
      
      transaction(users);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save users' });
    }
  });

  app.get('/api/surveys', (req, res) => {
    const rows = db.prepare('SELECT data FROM surveys').all() as { data: string }[];
    res.json(rows.map(row => JSON.parse(row.data)));
  });

  app.post('/api/surveys', (req, res) => {
    const stmt = db.prepare('INSERT INTO surveys (id, data) VALUES (?, ?)');
    stmt.run(req.body.id, JSON.stringify(req.body));
    res.json(req.body);
  });

  app.get('/api/surveys/:id', (req, res) => {
    const row = db.prepare('SELECT data FROM surveys WHERE id = ?').get(req.params.id) as { data: string } | undefined;
    if (row) {
      res.json(JSON.parse(row.data));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  app.put('/api/surveys/:id', (req, res) => {
    const stmt = db.prepare('UPDATE surveys SET data = ? WHERE id = ?');
    stmt.run(JSON.stringify(req.body), req.params.id);
    res.json(req.body);
  });

  app.get('/api/surveys/:id/events', (req, res) => {
    const rows = db.prepare('SELECT * FROM survey_events WHERE surveyId = ? ORDER BY timestamp DESC').all(req.params.id);
    res.json(rows);
  });

  app.post('/api/surveys/:id/events', (req, res) => {
    const event = req.body;
    event.id = Math.random().toString(36).substring(2, 15);
    event.surveyId = req.params.id;
    event.timestamp = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO survey_events (id, surveyId, eventName, actor, triggerCondition, systemAction, outcomeState, timestamp)
      VALUES (@id, @surveyId, @eventName, @actor, @triggerCondition, @systemAction, @outcomeState, @timestamp)
    `);
    stmt.run(event);
    res.json(event);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
