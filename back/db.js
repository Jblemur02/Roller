const mysql = require("mysql2");
const { MongoClient } = require("mongodb");

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "blemur55", // Consider using environment variables for sensitive info
  database: "roller",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// MongoDB connection setup
const uri =
  "mongodb+srv://admin:Swaggm%40n55@roller.1uptn.mongodb.net/roller?retryWrites=true&w=majority";
const client = new MongoClient(uri);

// Connect to the database
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

// Call the connect function when starting the server
connectDB();

// Export the MySQL pool and MongoDB client
module.exports = { pool, client };
