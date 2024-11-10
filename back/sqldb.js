// mysqlConnection.js
const mysql = require("mysql2");

// Write pool for write operations
const pool = mysql.createPool({
  host: "mysql-roller-treasureroller.e.aivencloud.com",
  user: "avnadmin",
  password: "AVNS_hQPu2sxujQMBxGNe6B6",
  database: "roller",
  port: 24356,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
