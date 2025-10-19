const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize SQLite database (creates file if not exists)
const db = new Database("blog.db");

// Create table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT NOT NULL
  )
`).run();

app.use(cors());
// Increase body size limits and capture the raw body for debugging parse errors.
// The `verify` option lets us save the raw bytes before body-parser attempts to parse.
app.use(bodyParser.json({
  limit: "5mb",
  verify: (req, res, buf, encoding) => {
    try {
      req.rawBody = buf.toString(encoding || "utf8");
    } catch (e) {
      req.rawBody = "<could not decode raw body>";
    }
  }
}));
// Also accept large urlencoded payloads and capture raw body there as well.
app.use(bodyParser.urlencoded({
  extended: true,
  limit: "5mb",
  verify: (req, res, buf, encoding) => {
    try {
      req.rawBody = buf.toString(encoding || "utf8");
    } catch (e) {
      req.rawBody = "<could not decode raw body>";
    }
  }
}));

// Get all posts
app.get("/api/posts", (req, res) => {
  const posts = db.prepare("SELECT * FROM posts ORDER BY id DESC").all();
  res.json(posts);
});

// Create a new post
app.post("/api/posts", (req, res) => {
  const { title, content, date } = req.body;
  if (!title || !content || !date) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const stmt = db.prepare("INSERT INTO posts (title, content, date) VALUES (?, ?, ?)");
  const info = stmt.run(title, content, date);
  const newPost = db.prepare("SELECT * FROM posts WHERE id = ?").get(info.lastInsertRowid);

  res.status(201).json(newPost);
});

// Delete a post
app.delete("/api/posts/:id", (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare("DELETE FROM posts WHERE id = ?");
  const info = stmt.run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Post not found" });
  }

  res.json({ success: true });
});

// Error handler for JSON parse and other body parsing errors.
// This will log the Content-Type and the first chunk of the raw body to help diagnose
// malformed payloads (e.g., clients sending url-encoded data or an unexpected format).
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    console.error('❌ JSON parse error:', err.message);
    console.error('Request headers content-type:', req.headers['content-type']);
    const raw = req.rawBody || '<no rawBody captured>';
    console.error('Raw body (first 2000 chars):', raw.slice ? raw.slice(0, 2000) : raw);
    return res.status(400).json({ error: 'Invalid JSON', message: err.message });
  }
  // Fallback for other errors
  if (err) {
    console.error('Server error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error' });
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
