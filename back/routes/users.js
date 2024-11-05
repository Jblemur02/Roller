const express = require("express");
const pool = require("../sqldb.js");
const {
  connectDB,
  saveUser,
  createUserDocumentIfNotExists,
} = require("../mongodb");
const router = express.Router();

// Registration route (write operation)
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  pool.query(
    // Check if email already exists using pool
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      pool.query(
        // Insert new user using pool
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

// Login route (read operation)
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

      // Ensure user document exists
      await createUserDocumentIfNotExists(user.id);

      const { userDataCollection } = await connectDB();
      const userDocument = await userDataCollection.findOne({ id: user.id });

      if (!userDocument) {
        return res.status(500).json({ error: "Internal server error" }); // Handle missing user document
      }

      // Include cards and other relevant user data in the response
      const userData = {
        message: "Logged in successfully",
        userId: user.id,
        username: user.username,
        email: user.email,
        time_shards: user.time_shards,
        level: user.level,
        chronos: user.chronos,
        cards: userDocument.cards, // Include the cards array
      };

      res.json(userData);
    }
  );
});

// Logout route (write operation)
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Error logging out" });
    res.json({ message: "Logged out successfully" });
  });
});

// Update user route (write operation)
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

// Fetch single user data by ID (read operation)
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

// Fetch all users (read operation)
router.get("/", (req, res) => {
  pool.query("SELECT id, username, email FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// Update user's chronos (write operation)
router.post("/updateChronos", (req, res) => {
  const { id, chronos } = req.body;

  if (isNaN(chronos) || chronos === null) {
    return res.status(400).json({ message: "Invalid chronos value" });
  }

  pool.query(
    "UPDATE users SET chronos = ? WHERE id = ?",
    [chronos, id],
    (error, results) => {
      if (error) {
        console.error("Error updating chronos:", error);
        return res.status(500).json({ message: "Failed to update chronos" });
      }
      res.status(200).json({ message: "Chronos updated successfully" });
    }
  );
});

// Route to update user's cards
router.post("/updateUserCards", async (req, res) => {
  const { userId, uniqueID } = req.body;

  if (!userId || !uniqueID) {
    return res.status(400).json({ message: "Missing required data" });
  }

  try {
    const { userDataCollection } = await connectDB();

    if (!userDataCollection) {
      return res.status(500).json({ message: "Failed to connect to database" });
    }

    const userDocument = await userDataCollection.findOne({ id: userId });

    // Check if the card already exists
    const cardIndex = userDocument.cards.findIndex(
      (card) => card.uid === uniqueID
    );

    if (cardIndex > -1) {
      // Card exists, update the quantity
      const updateResult = await userDataCollection.updateOne(
        { id: userId, "cards.uid": uniqueID },
        { $inc: { "cards.$.quantity": 1 } } // Increment quantity by 1
      );

      if (updateResult.modifiedCount > 0) {
        return res.status(200).json({ message: "Card quantity updated" });
      }
    } else {
      // Card does not exist, add a new card
      const updateResult = await userDataCollection.updateOne(
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

router.post("/:id/updateCards", async (req, res) => {
  const userId = parseInt(req.params.id);
  const { cardUpdates } = req.body;

  try {
    const { userDataCollection } = await connectDB(); // Ensure userDataCollection is initialized

    for (const card of cardUpdates) {
      if (card.quantity === 0) {
        // Remove card if quantity is zero
        await userDataCollection.updateOne(
          { id: userId },
          { $pull: { cards: { uid: card.uid } } }
        );
      } else {
        // Update card quantity if greater than zero
        await userDataCollection.updateOne(
          { id: userId, "cards.uid": card.uid },
          { $set: { "cards.$.quantity": card.quantity } }
        );
      }
    }

    res.status(200).json({ message: "User cards updated successfully" });
  } catch (error) {
    console.error("Error updating user cards:", error);
    res.status(500).json({ message: "Failed to update user cards" });
  }
});

router.get("/:id/cards", async (req, res) => {
  try {
    const userId = parseInt(req.params.id); // Ensure userId is an integer
    console.log("Fetching cards for userId:", userId);

    const { userDataCollection } = await connectDB(); // Connect to MongoDB and get the userDataCollection

    const userCards = await userDataCollection.findOne({ id: userId });

    if (!userCards || !userCards.cards) {
      console.log("No cards found for this user.");
      return res.status(404).json({ message: "No cards found for this user" });
    }

    console.log("User Cards:", userCards.cards);
    res.json(userCards.cards);
  } catch (error) {
    console.error("Error fetching cards:", error); // Log the error
    res.status(500).send("Error fetching cards");
  }
});

// Route to update user cards
router.post("/:id/updateCards", async (req, res) => {
  const userId = req.params.id;
  const { cardUpdates } = req.body;

  for (const card of cardUpdates) {
    if (isNaN(card.quantity)) {
      console.error("Invalid card quantity:", card);
      return res.status(400).json({ message: "Invalid card quantity" });
    }

    try {
      const userDataCollection = await connectDB();

      for (const card of cardUpdates) {
        if (card.quantity === 0) {
          // Remove card if quantity is zero
          await userDataCollection.updateOne(
            { id: userId },
            { $pull: { cards: { uid: card.uid } } }
          );
        } else {
          // Update card quantity if greater than zero
          await userDataCollection.updateOne(
            { id: userId, "cards.uid": card.uid },
            { $set: { "cards.$.quantity": card.quantity } }
          );
        }
      }

      res.status(200).json({ message: "User cards updated successfully" });
    } catch (error) {
      console.error("Error updating user cards:", error);
      res.status(500).json({ message: "Failed to update user cards" });
    }
  }
});

module.exports = router;
