const testData = {
  people: [
    {
      id: "1",
      gender: "FEMALE",
      personality: {
        ei: 1.0,
        sn: -1.0,
        tf: 0.0,
        pj: 1.0,
      },
      skills: [
        {
          id: "1",
          level: 0.25, // Must be between 0 and 1
        },
      ],
    },
    {
      id: "2",
      gender: "MALE",
      personality: {
        ei: -0.5,
        sn: 0.0,
        tf: 1.0,
        pj: -1.0,
      },
      skills: [
        {
          id: "1",
          level: 0.75,
        },
      ],
    },
  ],
  tasks: [
    {
      id: "1",
      skills: [
        {
          id: "1",
          level: 0.25,
          importance: 1, // Must be minimum 1.0
        },
      ],
      teamSize: 2, // Must be minimum 2
    },
  ],
  // Optional parameters
  alpha: 0.3,
  beta: 0.3,
  gamma: 0.3,
  delta: 0.3,
};

module.exports = testData;
