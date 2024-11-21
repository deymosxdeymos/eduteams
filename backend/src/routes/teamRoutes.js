const express = require("express");
const multer = require("multer");
const processTeamFormation = require("../services/teamFormationService");
const testData = require("../data/test-data");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/test", async (req, res) => {
  try {
    console.log("Using test data:", JSON.stringify(testData, null, 2));
    const result = await processTeamFormation(testData);
    res.json(result);
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      error: error.message,
      details: error.response?.data,
    });
  }
});

router.post("/transform", upload.single("file"), async (req, res) => {
  try {
    let data = req.file ? JSON.parse(req.file.buffer.toString()) : req.body;

    const result = await processTeamFormation(data);
    res.json(result);
  } catch (error) {
    console.error("Transform endpoint error:", error);
    res.status(500).json({
      error: error.message,
      details: error.response?.data,
    });
  }
});

module.exports = router;
