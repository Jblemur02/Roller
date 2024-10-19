// userData.js
const express = require("express");
const pool = require("../db");
const router = express.Router();

// Middleware to authenticate the user
const authenticate = (req, res, next) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  req.userId = userId;
  next();
};

// GET method to retrieve user data
router.get("/userdata", authenticate, (req, res) => {
  const userId = req.userId;

  pool.query(
    "SELECT level, affinity, chronos, time_shards FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(results[0]);
    }
  );
});

// POST method to update user data
router.post("/userdata", authenticate, (req, res) => {
  const { level, affinity, chronos, time_shards } = req.body;
  const userId = req.userId;

  pool.query(
    "UPDATE users SET level = ?, affinity = ?, chronos = ?, time_shards = ? WHERE id = ?",
    [level, affinity, chronos, time_shards, userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User data updated successfully" });
    }
  );
});

module.exports = router;
