const processTeamFormation = require("../services/teamFormationService");

const handleTeamFormation = async (req, res) => {
  try {
    let data;

    if (req.file) {
      // Handle file upload
      data = JSON.parse(req.file.buffer.toString());
    } else {
      // Handle direct JSON submission
      data = req.body;
    }

    const result = await processTeamFormation(data);
    res.json(result);
  } catch (error) {
    console.error("Error processing team formation:", error);
    res.status(500).json({ error: "Failed to process team formation request" });
  }
};

module.exports = {
  handleTeamFormation,
};
