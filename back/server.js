// server.js
const express = require("express");
const cors = require("cors");
const app = express();
const usersRouter = require("./routes/users");
const userDataRouter = require("./routes/userData");

const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,POST",
  allowedHeaders: "Content-Type",
};

app.use("/users/data", userDataRouter);

app.use(cors(corsOptions));
app.use(express.json());

// Root route to check if the server is running
app.get("/", (req, res) => {
  res.send(`Server is running on port ${PORT}...`);
});

// User routes
app.use("/users", usersRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
