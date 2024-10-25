const { MongoClient } = require("mongodb");

// MongoDB connection setup
const uri =
  "mongodb+srv://admin:Swaggm%40n55@roller.1uptn.mongodb.net/roller?retryWrites=true&w=majority";
const client = new MongoClient(uri);

let dbInstance;

// Connect to MongoDB and return the userData collection
async function connectDB() {
  if (!dbInstance) {
    try {
      await client.connect();
      dbInstance = client.db("roller").collection("userData");
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }
  return dbInstance;
}

// Add or update user in the database
async function saveUser(user) {
  const collection = await connectDB();
  try {
    const result = await collection.updateOne(
      { id: user.id },
      { $set: user },
      { upsert: true }
    );
    console.log("User saved:", result.upsertedId || user.id);
    return result;
  } catch (error) {
    console.error("Error saving user:", error);
  }
}

async function createUserDocumentIfNotExists(userId) {
  const collection = await connectDB();

  const existingUser = await collection.findOne({ id: userId });
  if (!existingUser) {
    const userDocument = {
      id: userId,
      cards: [],
    };

    try {
      const result = await collection.insertOne(userDocument);
      console.log(
        `User document created in MongoDB with ID: ${result.insertedId}`
      );
    } catch (error) {
      console.error("Error creating user document in MongoDB:", error);
    }
  } else {
    console.log(`User document already exists for userId: ${userId}`);
  }
}

module.exports = { connectDB, saveUser, createUserDocumentIfNotExists };
