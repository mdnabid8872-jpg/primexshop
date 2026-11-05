const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(express.json());

const SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
if (!process.env.JWT_SECRET) console.warn('⚠️ JWT_SECRET সেট করা নেই, হোস্টিংয়ে অবশ্যই সেট করুন');

const db = new Database(path.join(__dirname, 'data.sqlite'));
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

const normPhone = p => String(p || '').replace(/\D/g, '').replace(/^880/, '0');
const validPhone = p => /^01[3-9]\d{8}$/.test(p);
const sign = uid => jwt.sign({ uid }, SECRET, { expiresIn: '30d' });

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.uid = jwt.verify(token, SECRET).uid;
    next();
  } catch {
    res.status(401).json({ error: 'আবার লগইন করুন' });
  }
}

app.post('/api/register', async (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 60);
  const phone = normPhone(req.body.phone);
  const password = String(req.body.password || '');

  if (!name) return res.status(400).json({ error: 'নাম দিন' });
  if (!validPhone(phone)) return res.status(400).json({ error: 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)' });
  if (password.length < 6) return res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে' });
  if (db.prepare('SELECT id FROM users WHERE phone = ?').get(phone))
    return res.status(409).json({ error: 'এই নম্বর দিয়ে আগেই অ্যাকাউন্ট আছে' });

  const hash = await bcrypt.hash(password, 10);
  const info = db.prepare('INSERT INTO users (name, phone, password_hash) VALUES (?, ?, ?)').run(name, phone, hash);
  res.json({ token: sign(info.lastInsertRowid), user: { name, phone, balance: 0 } });
});

app.post('/api/login', async (req, res) => {
  const phone = normPhone(req.body.phone);
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'নম্বর বা পাসওয়ার্ড ভুল' });

  res.json({ token: sign(user.id), user: { name: user.name, phone: user.phone, balance: user.balance } });
});

app.get('/api/me', auth, (req, res) => {
  const u = db.prepare('SELECT name, phone, balance FROM users WHERE id = ?').get(req.uid);
  if (!u) return res.status(404).json({ error: 'ইউজার পাওয়া যায়নি' });
  res.json(u);
});

// রিপোজিটরির মূল ফোল্ডার (index.html, login.html) সার্ভ করবে
app.use(express.static(path.join(__dirname, '..')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
