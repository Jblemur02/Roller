const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://admin:Swaggm%40n55@roller.1uptn.mongodb.net/roller?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const newUser = {
      id: 1,
      cards: [
        {
          _id: "00001-000-00-000",
          quantity: 5,
          order: 1,
          pulled_at: "2024-10-24T12:00:00Z",
        },
      ],
    };

    const result = await client
      .db("users")
      .collection("userData")
      .insertOne(newUser);
    console.log("Insert Result:", result);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

run();
