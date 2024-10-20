const express = require("express");
const router = express.Router();
const db = require("../db");

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Fetch user from the database based on the token
    const [user] = await db.query("SELECT * FROM users WHERE token = ?", [
      token,
    ]);

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = user; // Attach user data to the request for use in other routes
    next();
  } catch (error) {
    console.error("Error in authentication:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Route to get user time_shards
router.get("/userdata", authenticate, (req, res) => {
  const timeShards = req.user.time_shards; // User data already fetched in middleware
  res.json({ time_shards: timeShards });
});

module.exports = router;
