// routes/users.js
const express = require("express");
const pool = require("../db");
const router = express.Router();

// Registration route
router.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  pool.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, password],
      (err, results) => {
        if (err)
          return res.status(500).json({ error: "Failed to create user" });
        res
          .status(201)
          .json({ message: "User created", userId: results.insertId });
      }
    );
  });
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
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Save user ID in session and send back full user data
      const user = results[0];
      req.session.userId = user.id;
      res.json({
        message: "Logged in successfully",
        userId: user.id,
        username: user.username,
        email: user.email,
        time_shards: user.time_shards,
        level: user.level,
        chronos: user.chronos,
        // Add more user-specific fields here if necessary
      });
    }
  );
});

// Logout route
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Error logging out" });
    res.json({ message: "Logged out successfully" });
  });
});

router.post("/updateUser", (req, res) => {
  const userData = req.body;

  // Log incoming request data
  console.log("Received user data:", userData);

  if (!userData || !userData.id || userData.time_shards === undefined) {
    return res.status(400).json({ message: "Invalid user data" });
  }

  const query = "UPDATE users SET time_shards = ? WHERE id = ?";
  pool.query(query, [userData.time_shards, userData.id], (error, results) => {
    if (error) {
      console.error("Error updating user data:", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User data updated successfully" });
  });
});

// Route to fetch a single user’s data by ID
router.get("/:id", (req, res) => {
  const userId = req.params.id;

  pool.query(
    "SELECT id, username, email, time_shards, level, chronos FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(results[0]);
    }
  );
});

// Route to get all users (simple public list, no authentication)
router.get("/", (req, res) => {
  pool.query("SELECT id, username, email FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

module.exports = router;
