// server.js
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const usersRouter = require("./routes/users");
const siteRouter = require("./routes/site");

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,POST",
  allowedHeaders: "Content-Type",
};

app.use(cors(corsOptions));
app.use(express.json());

app.use(
  session({
    secret: "simple-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Root route to check if the server is running
app.get("/", (req, res) => {
  res.send(`Server is running on port ${PORT}...`);
});

// User routes
app.use("/users", usersRouter);
app.use("/site", siteRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
