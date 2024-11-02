const { MongoClient } = require("mongodb");

// MongoDB connection setup
const uri =
  "mongodb+srv://admin:Swaggm%40n55@roller.1uptn.mongodb.net/roller?retryWrites=true&w=majority";
const client = new MongoClient(uri);

let userDataCollection;
let siteDataCollection;

// Connect to MongoDB and return the userData and siteData collections
async function connectDB() {
  if (!userDataCollection || !siteDataCollection) {
    try {
      await client.connect();
      userDataCollection = client.db("roller").collection("userData");
      siteDataCollection = client.db("roller").collection("siteData");
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }
  return { userDataCollection, siteDataCollection }; // Return both collections
}

// Add or update user in the userData collection
async function saveUser(user) {
  const { userDataCollection } = await connectDB();
  try {
    const result = await userDataCollection.updateOne(
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

// Create user document if it doesn't exist
async function createUserDocumentIfNotExists(userId) {
  const { userDataCollection } = await connectDB();
  const existingUser = await userDataCollection.findOne({ id: userId });
  if (!existingUser) {
    const userDocument = {
      id: userId,
      cards: [],
    };

    try {
      const result = await userDataCollection.insertOne(userDocument);
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

async function fetchSiteData() {
  const { siteDataCollection } = await connectDB();
  try {
    const classData = await siteDataCollection.findOne(); // Fetch the class data document
    return classData; // Return the entire document or filter as needed
  } catch (error) {
    console.error("Error fetching class data:", error);
    throw error;
  }
}

module.exports = {
  connectDB,
  saveUser,
  createUserDocumentIfNotExists,
  fetchSiteData,
};
