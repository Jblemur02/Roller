const express = require("express");
const pool = require("../sqldb");
const {
  connectDB,
  saveUser,
  createUserDocumentIfNotExists,
} = require("../mongodb");
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

      pool.query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, password],
        async (err, results) => {
          if (err)
            return res.status(500).json({ error: "Failed to create user" });

          const userId = results.insertId;
          await saveUser({ id: userId, cards: [] });

          res.status(201).json({ message: "User created", userId });
        }
      );
    }
  );
});

// Login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  pool.query(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    async (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const user = results[0];
      req.session.userId = user.id;

      await createUserDocumentIfNotExists(user.id);

      res.json({
        message: "Logged in successfully",
        userId: user.id,
        username: user.username,
        email: user.email,
        time_shards: user.time_shards,
        level: user.level,
        chronos: user.chronos,
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

// Update user route
router.post("/updateUser", (req, res) => {
  const userData = req.body;

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

// Route to update user's cards
router.post("/updateUserCards", async (req, res) => {
  const { userId, uniqueID } = req.body;

  if (!userId || !uniqueID) {
    return res.status(400).json({ message: "Missing required data" });
  }

  const collection = await connectDB();

  try {
    // Find the user document
    const userDocument = await collection.findOne({ id: userId });

    if (!userDocument) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the card already exists
    const cardIndex = userDocument.cards.findIndex(
      (card) => card.uid === uniqueID
    );

    if (cardIndex > -1) {
      // Card exists, update the quantity
      const updateResult = await collection.updateOne(
        { id: userId, "cards.uid": uniqueID },
        { $inc: { "cards.$.quantity": 1 } } // Increment quantity by 1
      );

      if (updateResult.modifiedCount > 0) {
        return res.status(200).json({ message: "Card quantity updated" });
      }
    } else {
      // Card does not exist, add a new card
      const updateResult = await collection.updateOne(
        { id: userId },
        { $push: { cards: { uid: uniqueID, quantity: 1 } } }
      );

      if (updateResult.modifiedCount > 0) {
        return res.status(200).json({ message: "Card added" });
      }
    }

    return res.status(500).json({ message: "Failed to update cards" });
  } catch (error) {
    console.error("Error updating user cards:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Route to update user cards
router.post("/:id/updateCards", async (req, res) => {
  const userId = req.params.id;
  const { cardUpdates } = req.body;

  try {
    const collection = await connectDB();

    // Loop through cardUpdates and update quantities
    for (const card of cardUpdates) {
      await collection.updateOne(
        { id: userId, "cards.uid": card.uid },
        { $inc: { "cards.$.quantity": 1 } },
        { upsert: true }
      );
    }

    res.status(200).json({ message: "User cards updated successfully" });
  } catch (error) {
    console.error("Error updating user cards:", error);
    res.status(500).json({ message: "Failed to update user cards" });
  }
});

// Route to get all users (simple public list, no authentication)
router.get("/", (req, res) => {
  pool.query("SELECT id, username, email FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

module.exports = router;
