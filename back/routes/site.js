const express = require("express");
const { readPool, writePool } = require("../sqldb.js");
const {
  connectDB,
  saveUser,
  createUserDocumentIfNotExists,
  fetchClassData,
  fetchStats,
} = require("../mongodb");
const router = express.Router();

router.get("/classes/:classType", async (req, res) => {
  try {
    const classData = await fetchClassData();

    if (!classData) {
      return res.status(404).json({ message: "No class data found" });
    }

    const classType = req.params.classType.toLowerCase();
    const classes = classData.classes[classType];

    if (!classes) {
      return res.status(404).json({ message: "Class type not found" });
    }

    res.json(classes);
  } catch (error) {
    console.error("Error fetching class data:", error);
    res.status(500).send("Server Error");
  }
});

router.get("/stats", async (req, res) => {
  try {
    const stats = await fetchStats();

    if (!stats) {
      return res.status(404).json({ message: "No stats found" });
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).send("Server Error");
  }
});
module.exports = router;
