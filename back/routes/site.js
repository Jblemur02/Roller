const express = require("express");
const { pool } = require("../sqldb.js");
const {
  connectDB,
  saveUser,
  createUserDocumentIfNotExists,
  fetchSiteData,
} = require("../mongodb");
const router = express.Router();

router.get("/classes/:classType", async (req, res) => {
  try {
    const classData = await fetchSiteData();

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
    const baseStats = await fetchSiteData();
    console.log("Fetched base stats:", baseStats);

    const stats = baseStats.stats.base;

    res.json(stats);

    if (!baseStats) {
      return res.status(404).json({ message: "No base stats found" });
    }
  } catch (error) {
    console.error("Error fetching base stats:", error);
    res.status(500).send("Server Error");
  }
});
module.exports = router;
