// mysqlConnection.js
const mysql = require("mysql2");

// Write pool for write operations
const pool = mysql.createPool({
  host: "roller.ct40s26o0ok5.us-east-2.rds.amazonaws.com",
  user: "admin",
  password: "blemur55",
  database: "roller",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
