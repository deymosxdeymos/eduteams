const axios = require("axios");

const EDU2COM_API =
  "https://ardid.iiia.csic.es/eduteams/edu2com/v1/teamFormation";

const processTeamFormation = async (data) => {
  try {
    console.log("Received data in backend:", JSON.stringify(data, null, 2));

    // Make sure we're sending the correct format to the API
    const formattedData = {
      people: data.people,
      tasks: data.tasks.map((task, index) => ({
        id: `task_${index + 1}`,
        skills: task.skills,
        teamSize: task.teamSize,
      })),
      alpha: data.alpha || 0.5,
      beta: data.beta || 0.3,
      gamma: data.gamma || 0.1,
      delta: data.delta || 0.1,
    };

    console.log(
      "Sending to Edu2com API:",
      JSON.stringify(formattedData, null, 2),
    );

    const response = await axios.post(EDU2COM_API, formattedData);

    console.log(
      "Edu2com API Response:",
      JSON.stringify(response.data, null, 2),
    );

    return response.data;
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(`Failed to process team formation: ${error.message}`);
  }
};

module.exports = processTeamFormation;
