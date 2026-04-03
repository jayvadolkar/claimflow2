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

  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS document_rules (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS image_rules (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS survey_profiles (
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

  try {
    const { INITIAL_DOCS } = await import('./src/data/documents.ts');
    const upsertDoc = db.prepare('INSERT OR IGNORE INTO documents (id, data) VALUES (?, ?)');
    const updateDoc = db.prepare('UPDATE documents SET data = ? WHERE id = ?');

    const migrate = db.transaction((docs: any[]) => {
      for (const doc of docs) {
        // Insert if new
        upsertDoc.run(doc.id, JSON.stringify(doc));
        // Patch existing system docs: fix applicableCases and normalize hypothecation
        const existing = db.prepare('SELECT data FROM documents WHERE id = ?').get(doc.id) as { data: string } | undefined;
        if (existing) {
          const parsed = JSON.parse(existing.data);
          let changed = false;
          // Normalize hypothecation string "Both" → array ['Yes','No']
          if (typeof parsed.hypothecation === 'string') {
            parsed.hypothecation = parsed.hypothecation === 'Both' ? ['Yes', 'No'] : [parsed.hypothecation];
            changed = true;
          }
          // Sync applicableCases from INITIAL_DOCS for system docs to pick up new case types
          if (parsed.isSystem && doc.applicableCases) {
            parsed.applicableCases = doc.applicableCases;
            changed = true;
          }
          if (changed) updateDoc.run(JSON.stringify(parsed), doc.id);
        }
      }
    });
    migrate(INITIAL_DOCS);
    console.log('Documents seeded/migrated');
  } catch (err) {
    console.error('Failed to seed/migrate documents:', err);
  }

  // Seed document rules (INSERT OR IGNORE — never overwrites admin customizations)
  try {
    const { INITIAL_DOCUMENT_RULES } = await import('./src/data/documentRules.ts');
    const upsertDR = db.prepare('INSERT OR IGNORE INTO document_rules (id, data) VALUES (?, ?)');
    db.transaction((rules: any[]) => {
      for (const rule of rules) upsertDR.run(rule.id, JSON.stringify(rule));
    })(INITIAL_DOCUMENT_RULES);
    console.log('Document rules seeded');
  } catch (err) {
    console.error('Failed to seed document rules:', err);
  }

  // Seed image rules (INSERT OR IGNORE)
  try {
    const { INITIAL_IMAGE_RULES } = await import('./src/data/imageRules.ts');
    const upsertIR = db.prepare('INSERT OR IGNORE INTO image_rules (id, data) VALUES (?, ?)');
    db.transaction((rules: any[]) => {
      for (const rule of rules) upsertIR.run(rule.id, JSON.stringify(rule));
    })(INITIAL_IMAGE_RULES);
    console.log('Image rules seeded');
  } catch (err) {
    console.error('Failed to seed image rules:', err);
  }

  // Seed survey profiles (INSERT OR IGNORE)
  try {
    const { INITIAL_SURVEY_PROFILES } = await import('./src/data/surveyProfiles.ts');
    const upsertSP = db.prepare('INSERT OR IGNORE INTO survey_profiles (id, data) VALUES (?, ?)');
    db.transaction((profiles: any[]) => {
      for (const p of profiles) upsertSP.run(p.id, JSON.stringify(p));
    })(INITIAL_SURVEY_PROFILES);
    console.log('Survey profiles seeded');
  } catch (err) {
    console.error('Failed to seed survey profiles:', err);
  }

  try {
    const { SEED_ROLES } = await import('./src/data/roles.ts');
    const upsert = db.prepare('INSERT OR REPLACE INTO roles (id, data) VALUES (?, ?)');
    const upsertMany = db.transaction((roles: any[]) => {
      for (const role of roles) {
        upsert.run(role.id, JSON.stringify(role));
      }
    });
    upsertMany(SEED_ROLES);
    console.log('Upserted roles from seed data');
  } catch (err) {
    console.error('Failed to upsert roles:', err);
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const initialUsers = [
      { id: '1', name: 'Jay Vadolkar', email: 'jayvadolkar1@gmail.com', role: 'role-superadmin', department: 'Global Admin', username: 'jay', password: 'admin123' },
      { id: '2', name: 'John Doe', email: 'john@example.com', role: 'role-manager', department: 'Claims Management', username: 'john', password: 'manager123' },
      { id: '3', name: 'Alice Smith', email: 'alice@example.com', role: 'role-handler', department: 'Field Operations', username: 'alice', password: 'handler123' },
    ];
    const insert = db.prepare('INSERT INTO users (id, data) VALUES (?, ?)');
    for (const user of initialUsers) {
      insert.run(user.id, JSON.stringify(user));
    }
  }

  // Migrate existing users to add login credentials if missing
  const allUserRows = db.prepare('SELECT id, data FROM users').all() as { id: string; data: string }[];
  const defaultCreds: Record<string, { username: string; password: string }> = {
    '1': { username: 'jay', password: 'admin123' },
    '2': { username: 'john', password: 'manager123' },
    '3': { username: 'alice', password: 'handler123' },
  };
  for (const row of allUserRows) {
    const data = JSON.parse(row.data);
    if (!data.username) {
      const creds = defaultCreds[data.id] || { username: data.email.split('@')[0], password: 'password123' };
      data.username = creds.username;
      data.password = creds.password;
      db.prepare('UPDATE users SET data = ? WHERE id = ?').run(JSON.stringify(data), row.id);
    }
  }

  // Auth Routes
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      const rows = db.prepare('SELECT data FROM users').all() as { data: string }[];
      const users = rows.map(r => JSON.parse(r.data));
      const user = users.find((u: any) => u.username === username && u.password === password);
      if (user) {
        res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, username: user.username } });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.put('/api/users/:id/credentials', (req, res) => {
    try {
      const { username, password } = req.body;
      const row = db.prepare('SELECT data FROM users WHERE id = ?').get(req.params.id) as { data: string } | undefined;
      if (!row) return res.status(404).json({ error: 'User not found' });
      const data = JSON.parse(row.data);
      if (username !== undefined) data.username = username;
      if (password !== undefined && password !== '') data.password = password;
      db.prepare('UPDATE users SET data = ? WHERE id = ?').run(JSON.stringify(data), req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update credentials' });
    }
  });

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

  // Document rules
  app.get('/api/document-rules', (_req, res) => {
    try {
      const rows = db.prepare('SELECT data FROM document_rules').all() as { data: string }[];
      res.json(rows.map(r => JSON.parse(r.data)));
    } catch { res.status(500).json({ error: 'Failed to fetch document rules' }); }
  });

  app.post('/api/document-rules', (req, res) => {
    try {
      const rules = req.body;
      db.transaction((rules: any[]) => {
        db.prepare('DELETE FROM document_rules').run();
        const ins = db.prepare('INSERT INTO document_rules (id, data) VALUES (?, ?)');
        for (const rule of rules) ins.run(rule.id, JSON.stringify(rule));
      })(rules);
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Failed to save document rules' }); }
  });

  // Image rules
  app.get('/api/image-rules', (_req, res) => {
    try {
      const rows = db.prepare('SELECT data FROM image_rules').all() as { data: string }[];
      res.json(rows.map(r => JSON.parse(r.data)));
    } catch { res.status(500).json({ error: 'Failed to fetch image rules' }); }
  });

  app.post('/api/image-rules', (req, res) => {
    try {
      const rules = req.body;
      db.transaction((rules: any[]) => {
        db.prepare('DELETE FROM image_rules').run();
        const ins = db.prepare('INSERT INTO image_rules (id, data) VALUES (?, ?)');
        for (const rule of rules) ins.run(rule.id, JSON.stringify(rule));
      })(rules);
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Failed to save image rules' }); }
  });

  // Survey profiles (condition-centric document/image assignment)
  app.get('/api/survey-profiles', (_req, res) => {
    try {
      const rows = db.prepare('SELECT data FROM survey_profiles ORDER BY rowid').all() as { data: string }[];
      res.json(rows.map(r => JSON.parse(r.data)));
    } catch { res.status(500).json({ error: 'Failed to fetch survey profiles' }); }
  });

  app.post('/api/survey-profiles', (req, res) => {
    try {
      const profiles = req.body;
      db.transaction((ps: any[]) => {
        db.prepare('DELETE FROM survey_profiles').run();
        const ins = db.prepare('INSERT INTO survey_profiles (id, data) VALUES (?, ?)');
        for (const p of ps) ins.run(p.id, JSON.stringify(p));
      })(profiles);
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Failed to save survey profiles' }); }
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

  app.get('/api/roles', (req, res) => {
    try {
      const rows = db.prepare('SELECT data FROM roles').all() as { data: string }[];
      res.json(rows.map(row => JSON.parse(row.data)));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  });

  app.post('/api/roles', (req, res) => {
    try {
      const roles = req.body;
      const insertRole = db.prepare('INSERT OR REPLACE INTO roles (id, data) VALUES (?, ?)');
      
      const transaction = db.transaction((roles) => {
        db.prepare('DELETE FROM roles').run();
        for (const role of roles) {
          insertRole.run(role.id, JSON.stringify(role));
        }
      });
      
      transaction(roles);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save roles' });
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
