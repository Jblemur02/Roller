// mysqlConnection.js
const mysql = require("mysql2");

// Write pool for write operations
const writePool = mysql.createPool({
  host: "roller-instance-1.ct40s26o0ok5.us-east-2.rds.amazonaws.com", // Replace with your write endpoint
  user: "root",
  password: "blemur55",
  database: "roller",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Read pool for read operations
const readPool = mysql.createPool({
  host: "roller-instance-1-us-east-2c.ct40s26o0ok5.us-east-2.rds.amazonaws.com", // Replace with your read endpoint
  user: "root",
  password: "blemur55",
  database: "roller",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = {
  writePool,
  readPool,
};
