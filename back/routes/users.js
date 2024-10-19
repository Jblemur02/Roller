const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const router = express.Router();

// Registration route
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  pool.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (results.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      pool.query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hashedPassword],
        (err, results) => {
          if (err) {
            return res.status(500).json({ error: "Failed to create user" });
          }
          res
            .status(201)
            .json({ message: "User created", userId: results.insertId });
        }
      );
    }
  );
});

// Login route
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  pool.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Compare the hashed password
      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Send user data (without password)
      res.json({ userId: user.id, username: user.username, email: user.email });
    }
  );
});

// Route to get all users (simple public list, no authentication)
router.get("/", (req, res) => {
  // Example of fetching all users (without passwords)
  pool.query("SELECT id, username, email FROM users", (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results); // Return the list of users
  });
});

module.exports = router;
