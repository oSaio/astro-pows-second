import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LEVELS } from '../src/levels.js';
import { grade } from '../src/engine.js';

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 16) { console.error('Set JWT_SECRET (16+ chars) in .env'); process.exit(1); }
const db = new Database(process.env.DB_FILE || './astro.db');
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  pass_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')), created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS progress (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, level_id TEXT NOT NULL,
  stars INTEGER NOT NULL, credits INTEGER NOT NULL, PRIMARY KEY (user_id, level_id));`);

// The only way to get an admin: seeded from environment, never from the API.
if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD &&
    !db.prepare('SELECT 1 FROM users WHERE username=?').get(process.env.ADMIN_USERNAME)) {
  db.prepare("INSERT INTO users (username, pass_hash, role) VALUES (?,?,'admin')")
    .run(process.env.ADMIN_USERNAME, bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12));
}

const app = express();
app.use(helmet());
app.use(express.json({ limit: '20kb' }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const sign = u => jwt.sign({ id: u.id }, SECRET, { expiresIn: '14d' });
const progressOf = id => Object.fromEntries(db.prepare('SELECT level_id, stars, credits FROM progress WHERE user_id=?').all(id).map(p => [p.level_id, { stars: p.stars, credits: p.credits }]));
const pub = u => ({ id: u.id, username: u.username, role: u.role });

function auth(req, res, next) {
  try {
    const p = jwt.verify((req.headers.authorization || '').slice(7), SECRET);
    const u = db.prepare('SELECT id, username, role FROM users WHERE id=?').get(p.id);
    if (!u) throw new Error('no user');
    req.user = u; next();
  } catch { res.status(401).json({ error: 'Please log in again.' }); }
}

app.post('/api/auth/signup', authLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !/^[A-Za-z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: 'Username: 3-20 letters, numbers or underscores.' });
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) return res.status(400).json({ error: 'Password must be 8-72 characters.' });
  try {
    // role is never read from the request body
    const r = db.prepare("INSERT INTO users (username, pass_hash, role) VALUES (?,?,'user')").run(username, bcrypt.hashSync(password, 12));
    const u = { id: r.lastInsertRowid, username, role: 'user' };
    res.status(201).json({ token: sign(u), user: pub(u), progress: {} });
  } catch (e) {
    if (String(e.code).startsWith('SQLITE_CONSTRAINT')) return res.status(409).json({ error: 'That username is taken.' });
    res.status(500).json({ error: 'Could not create account.' });
  }
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Enter your username and password.' });
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!u || !bcrypt.compareSync(password, u.pass_hash)) return res.status(401).json({ error: 'Wrong username or password.' });
  res.json({ token: sign(u), user: pub(u), progress: progressOf(u.id) });
});

app.get('/api/me', auth, (req, res) => res.json({ user: pub(req.user), progress: progressOf(req.user.id) }));

// Server-authoritative: the program is re-simulated here, so clients cannot fake stars or credits.
app.post('/api/progress/:id', auth, (req, res) => {
  const i = LEVELS.findIndex(l => l.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Unknown level.' });
  const done = progressOf(req.user.id);
  if (req.user.role !== 'admin' && i > 0 && !done[LEVELS[i - 1].id]) return res.status(403).json({ error: 'Level locked.' });
  const g = grade(LEVELS[i], req.body?.program);
  if (g.ok) {
    db.prepare(`INSERT INTO progress (user_id, level_id, stars, credits) VALUES (?,?,?,?)
      ON CONFLICT(user_id, level_id) DO UPDATE SET stars = MAX(stars, excluded.stars)`).run(req.user.id, LEVELS[i].id, g.stars, LEVELS[i].credits);
  }
  res.json({ ok: g.ok, msg: g.msg, stars: g.stars, progress: progressOf(req.user.id) });
});

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.use((err, req, res, next) => res.status(400).json({ error: 'Bad request.' }));
app.listen(process.env.PORT || 3001, () => console.log('Astro-Paws server ready'));
