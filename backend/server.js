const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;

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
app.use(bodyParser.json());

// Get all posts
app.get("/posts", (req, res) => {
  const posts = db.prepare("SELECT * FROM posts ORDER BY id DESC").all();
  res.json(posts);
});

// Create a new post
app.post("/posts", (req, res) => {
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
app.delete("/posts/:id", (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare("DELETE FROM posts WHERE id = ?");
  const info = stmt.run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Post not found" });
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
